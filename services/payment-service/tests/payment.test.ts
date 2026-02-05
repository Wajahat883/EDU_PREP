/**
 * Payment Service Test Suite
 *
 * Tests for:
 * - Subscription creation and management
 * - Payment processing
 * - Billing cycles and invoices
 * - Refunds and cancellations
 * - Webhook handling
 * - Plan transitions and prorations
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { PaymentService } from "../services/paymentService";
import { Subscription } from "../models/Subscription";
import { Invoice } from "../models/Invoice";
import { Payment } from "../models/Payment";

describe("Payment Service", () => {
  const paymentService = new PaymentService();
  const userId = "user_payment_1";
  const paymentMethodId = "pm_test_123";

  beforeAll(async () => {
    // Clear test data
    await Subscription.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
  });

  afterAll(async () => {
    await Subscription.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
  });

  describe("Create Subscription", () => {
    it("should create monthly subscription for Pro plan", async () => {
      const subscription = await paymentService.createSubscription({
        userId,
        planId: "pro_monthly",
        paymentMethodId,
        billingCycle: "monthly" as const,
      });

      expect(subscription).toBeDefined();
      expect(subscription._id).toBeDefined();
      expect(subscription.userId).toBe(userId);
      expect(subscription.plan).toBe("pro_monthly");
      expect(subscription.status).toBe("active");
      expect(subscription.currentPeriodStart).toBeDefined();
      expect(subscription.currentPeriodEnd).toBeDefined();
    });

    it("should create annual subscription with discount", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_2",
        planId: "pro_annual",
        paymentMethodId,
        billingCycle: "annual" as const,
      });

      expect(subscription.billingCycle).toBe("annual");
      expect(subscription.discount).toBeGreaterThan(0);
    });

    it("should charge initial payment on subscription creation", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_3",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const payment = await Payment.findOne({
        subscriptionId: subscription._id,
      });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe("completed");
    });

    it("should fail with invalid plan", async () => {
      expect(async () => {
        await paymentService.createSubscription({
          userId: "user_payment_4",
          planId: "invalid_plan",
          paymentMethodId,
        });
      }).rejects.toThrow();
    });

    it("should prevent duplicate active subscriptions", async () => {
      await paymentService.createSubscription({
        userId: "user_payment_5",
        planId: "pro_monthly",
        paymentMethodId,
      });

      expect(async () => {
        await paymentService.createSubscription({
          userId: "user_payment_5",
          planId: "pro_monthly",
          paymentMethodId,
        });
      }).rejects.toThrow();
    });
  });

  describe("Change Subscription Plan", () => {
    let subscriptionId: string;

    beforeAll(async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_upgrade",
        planId: "basic_monthly",
        paymentMethodId,
      });
      subscriptionId = subscription._id.toString();
    });

    it("should upgrade subscription plan", async () => {
      const updated = await paymentService.changePlan(
        subscriptionId,
        "pro_monthly",
        { prorate: true },
      );

      expect(updated.plan).toBe("pro_monthly");
      expect(updated.status).toBe("active");
    });

    it("should calculate prorated charges on upgrade", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_prorate",
        planId: "basic_monthly",
        paymentMethodId,
      });

      const result = await paymentService.changePlan(
        subscription._id.toString(),
        "pro_monthly",
        { prorate: true },
      );

      expect(result.proratedAmount).toBeDefined();
      expect(result.proratedAmount).toBeGreaterThan(0);
    });

    it("should downgrade subscription plan", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_downgrade",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const updated = await paymentService.changePlan(
        subscription._id.toString(),
        "basic_monthly",
        { prorate: true },
      );

      expect(updated.plan).toBe("basic_monthly");
    });

    it("should apply credit on downgrade if applicable", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_credit",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const updated = await paymentService.changePlan(
        subscription._id.toString(),
        "basic_monthly",
        { prorate: true },
      );

      if (updated.creditApplied) {
        expect(updated.creditApplied).toBeGreaterThan(0);
      }
    });
  });

  describe("Billing and Invoices", () => {
    let subscriptionId: string;

    beforeAll(async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_billing",
        planId: "pro_monthly",
        paymentMethodId,
      });
      subscriptionId = subscription._id.toString();
    });

    it("should generate invoice on billing cycle", async () => {
      const invoice = await paymentService.generateInvoice(subscriptionId);

      expect(invoice).toBeDefined();
      expect(invoice._id).toBeDefined();
      expect(invoice.subscriptionId.toString()).toBe(subscriptionId);
      expect(invoice.status).toBe("issued");
      expect(invoice.amount).toBeGreaterThan(0);
    });

    it("should track invoice payment status", async () => {
      const invoice = await paymentService.generateInvoice(subscriptionId);
      const invoiceId = invoice._id.toString();

      const updated = await paymentService.markInvoiceAsPaid(invoiceId);

      expect(updated.status).toBe("paid");
      expect(updated.paidAt).toBeDefined();
    });

    it("should send invoice to customer", async () => {
      const invoice = await paymentService.generateInvoice(subscriptionId);

      const sent = await paymentService.sendInvoice(invoice._id.toString());

      expect(sent.emailSentAt).toBeDefined();
      expect(sent.sentTo).toBeDefined();
    });

    it("should list invoices for subscription", async () => {
      // Create multiple invoices
      for (let i = 0; i < 3; i++) {
        await paymentService.generateInvoice(subscriptionId);
      }

      const invoices = await paymentService.getInvoices(subscriptionId);

      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Refunds and Cancellations", () => {
    it("should process full refund", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_refund",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const refund = await paymentService.refundSubscription(
        subscription._id.toString(),
        { fullRefund: true },
      );

      expect(refund).toBeDefined();
      expect(refund.status).toBe("completed");
      expect(refund.amount).toBeGreaterThan(0);
    });

    it("should process partial refund", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_partial_refund",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const refund = await paymentService.refundSubscription(
        subscription._id.toString(),
        { amount: 50 },
      );

      expect(refund.amount).toBe(50);
    });

    it("should cancel subscription immediately", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_cancel_immediate",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const cancelled = await paymentService.cancelSubscription(
        subscription._id.toString(),
        { immediate: true },
      );

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.cancelledAt).toBeDefined();
    });

    it("should cancel subscription at end of billing period", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_cancel_eop",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const scheduled = await paymentService.cancelSubscription(
        subscription._id.toString(),
        { immediate: false },
      );

      expect(scheduled.status).toBe("active");
      expect(scheduled.scheduledCancellationDate).toBeDefined();
    });

    it("should record cancellation reason", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_cancel_reason",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const cancelled = await paymentService.cancelSubscription(
        subscription._id.toString(),
        {
          immediate: true,
          reason: "Customer requested",
        },
      );

      expect(cancelled.cancellationReason).toBe("Customer requested");
    });
  });

  describe("Payment Processing", () => {
    it("should process successful payment", async () => {
      const payment = await paymentService.processPayment({
        userId: "user_payment_process",
        amount: 9.99,
        currency: "USD",
        paymentMethodId,
        description: "Monthly subscription renewal",
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe("completed");
      expect(payment.amount).toBe(9.99);
      expect(payment.transactionId).toBeDefined();
    });

    it("should handle payment failures", async () => {
      expect(async () => {
        await paymentService.processPayment({
          userId: "user_payment_fail",
          amount: 9.99,
          currency: "USD",
          paymentMethodId: "pm_invalid",
          description: "Test payment",
        });
      }).rejects.toThrow();
    });

    it("should retry failed payments", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_payment_retry",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const retried = await paymentService.retryPayment(
        subscription._id.toString(),
      );

      expect(retried.status).toBe("completed");
      expect(retried.retryCount).toBeGreaterThan(0);
    });

    it("should track payment history", async () => {
      const userId = "user_payment_history";

      await paymentService.processPayment({
        userId,
        amount: 9.99,
        currency: "USD",
        paymentMethodId,
        description: "Payment 1",
      });

      await paymentService.processPayment({
        userId,
        amount: 19.99,
        currency: "USD",
        paymentMethodId,
        description: "Payment 2",
      });

      const history = await paymentService.getPaymentHistory(userId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Webhook Handling", () => {
    it("should handle charge succeeded webhook", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_webhook_charge",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const handled = await paymentService.handleWebhook({
        type: "charge.succeeded",
        data: {
          subscriptionId: subscription._id.toString(),
          amount: 9.99,
          transactionId: "txn_123",
        },
      });

      expect(handled.success).toBe(true);
    });

    it("should handle charge failed webhook", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_webhook_failed",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const handled = await paymentService.handleWebhook({
        type: "charge.failed",
        data: {
          subscriptionId: subscription._id.toString(),
          reason: "insufficient_funds",
        },
      });

      expect(handled.success).toBe(true);
    });

    it("should handle customer subscription deleted webhook", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_webhook_deleted",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const handled = await paymentService.handleWebhook({
        type: "customer.subscription.deleted",
        data: {
          subscriptionId: subscription._id.toString(),
        },
      });

      expect(handled.success).toBe(true);
    });
  });

  describe("Subscription Management", () => {
    it("should get user active subscription", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_get_sub",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const active = await paymentService.getActiveSubscription("user_get_sub");

      expect(active).toBeDefined();
      expect(active?._id.toString()).toBe(subscription._id.toString());
    });

    it("should list all user subscriptions", async () => {
      const userId = "user_list_subs";

      await paymentService.createSubscription({
        userId,
        planId: "basic_monthly",
        paymentMethodId,
      });

      const subscriptions = await paymentService.getSubscriptions(userId);

      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBeGreaterThan(0);
    });

    it("should update subscription payment method", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_update_pm",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const updated = await paymentService.updatePaymentMethod(
        subscription._id.toString(),
        "pm_new_456",
      );

      expect(updated.paymentMethodId).toBe("pm_new_456");
    });

    it("should check subscription status", async () => {
      const subscription = await paymentService.createSubscription({
        userId: "user_check_status",
        planId: "pro_monthly",
        paymentMethodId,
      });

      const status = await paymentService.getSubscriptionStatus(
        subscription._id.toString(),
      );

      expect(status).toBeDefined();
      expect(status.isActive).toBe(true);
      expect(status.daysUntilRenewal).toBeGreaterThan(0);
    });
  });

  describe("Plan Management", () => {
    it("should list available plans", async () => {
      const plans = await paymentService.getPlans();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0]).toHaveProperty("id");
      expect(plans[0]).toHaveProperty("name");
      expect(plans[0]).toHaveProperty("price");
    });

    it("should get plan details", async () => {
      const plan = await paymentService.getPlan("pro_monthly");

      expect(plan).toBeDefined();
      expect(plan.id).toBe("pro_monthly");
      expect(plan.features).toBeDefined();
    });
  });
});
