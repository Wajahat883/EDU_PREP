/**
 * Stripe Payment Webhooks Handler
 * Location: services/payment-service/src/webhooks/stripe.webhooks.ts
 *
 * Handles all Stripe webhook events for subscription management, invoice generation,
 * payment failure handling, and renewal automation.
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { SubscriptionModel } from "../models/Subscription";
import { InvoiceModel } from "../models/Invoice";
import { UserModel } from "../models/User";
import { NotificationService } from "../services/notification.service";
import { AnalyticsService } from "../services/analytics.service";
import logger from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * Stripe webhook signature verification and routing
 * Endpoint: POST /webhooks/stripe
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Route event to appropriate handler
  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.created":
      await handleInvoiceCreated(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "charge.failed":
      await handleChargeFailed(event.data.object as Stripe.Charge);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Handle subscription creation
 * Triggered when user completes checkout and subscription is created
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    const customerId = subscription.customer as string;
    const planId = subscription.items.data[0]?.price.product as string;

    // Fetch user from Stripe customer metadata
    const customer = await stripe.customers.retrieve(customerId);
    const userId = (customer as any).metadata?.user_id;

    if (!userId) {
      logger.error(`No user_id found in customer metadata for ${customerId}`);
      return;
    }

    // Create subscription record in database
    const subscriptionData = {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      planId,
      status: subscription.status, // 'active', 'past_due', 'unpaid', 'canceled', 'incomplete'
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      createdAt: new Date(subscription.created * 1000),
      metadata: subscription.metadata,
    };

    await SubscriptionModel.create(subscriptionData);
    logger.info(`Subscription created for user ${userId}: ${subscription.id}`);

    // Update user subscription status
    await UserModel.findByIdAndUpdate(userId, {
      subscriptionStatus: "active",
      subscriptionId: subscription.id,
      subscriptionPlan: planId,
    });

    // Send confirmation email
    await NotificationService.sendSubscriptionConfirmation(userId, planId);

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "subscription_created",
      planId,
      amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
    });
  } catch (error: any) {
    logger.error(`Error handling subscription created: ${error.message}`);
    throw error;
  }
}

/**
 * Handle subscription updates
 * Triggered when subscription details change (plan change, payment method update, etc.)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    const customerId = subscription.customer as string;

    // Find existing subscription
    const existingSubscription = await SubscriptionModel.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      logger.warn(`Subscription not found: ${subscription.id}`);
      return;
    }

    const userId = existingSubscription.userId;
    const statusChanged = existingSubscription.status !== subscription.status;
    const planChanged =
      existingSubscription.stripePriceId !==
      subscription.items.data[0]?.price.id;

    // Update subscription record
    const updateData = {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      stripePriceId: subscription.items.data[0]?.price.id,
      metadata: subscription.metadata,
    };

    await SubscriptionModel.findByIdAndUpdate(
      existingSubscription._id,
      updateData,
    );
    logger.info(`Subscription updated: ${subscription.id}`);

    // Handle plan change
    if (planChanged) {
      const newPlanId = subscription.items.data[0]?.price.product as string;
      await UserModel.findByIdAndUpdate(userId, {
        subscriptionPlan: newPlanId,
      });
      await NotificationService.sendPlanChangeNotification(userId, newPlanId);
      await AnalyticsService.trackEvent({
        userId,
        eventType: "subscription_plan_changed",
        newPlanId,
      });
    }

    // Handle status change
    if (statusChanged) {
      const newStatus = subscription.status;

      if (newStatus === "past_due") {
        await NotificationService.sendPaymentDueNotification(userId);
        await AnalyticsService.trackEvent({
          userId,
          eventType: "subscription_past_due",
        });
      }

      if (newStatus === "active") {
        await NotificationService.sendSubscriptionReactivatedNotification(
          userId,
        );
        await AnalyticsService.trackEvent({
          userId,
          eventType: "subscription_reactivated",
        });
      }
    }
  } catch (error: any) {
    logger.error(`Error handling subscription updated: ${error.message}`);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 * Triggered when subscription is canceled by user or system
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    const existingSubscription = await SubscriptionModel.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      logger.warn(`Subscription not found: ${subscription.id}`);
      return;
    }

    const userId = existingSubscription.userId;

    // Mark subscription as canceled
    await SubscriptionModel.findByIdAndUpdate(existingSubscription._id, {
      status: "canceled",
      canceledAt: new Date(),
    });

    // Update user
    await UserModel.findByIdAndUpdate(userId, {
      subscriptionStatus: "canceled",
      subscriptionEndDate: new Date(),
    });

    logger.info(`Subscription canceled: ${subscription.id}`);

    // Send cancellation notification
    await NotificationService.sendSubscriptionCanceledNotification(userId);

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "subscription_canceled",
    });
  } catch (error: any) {
    logger.error(`Error handling subscription deleted: ${error.message}`);
    throw error;
  }
}

/**
 * Handle invoice creation
 * Triggered when invoice is generated for upcoming billing
 */
async function handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
  try {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    const subscription = await SubscriptionModel.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      logger.warn(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }

    // Create invoice record
    const invoiceData = {
      userId: subscription.userId,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      amount: invoice.amount_due / 100,
      amountPaid: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status, // 'draft', 'open', 'paid', 'void', 'uncollectible'
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      billingReason: invoice.billing_reason,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      pdfUrl: invoice.pdf || null,
      createdAt: new Date(invoice.created * 1000),
      metadata: invoice.metadata,
    };

    await InvoiceModel.create(invoiceData);
    logger.info(
      `Invoice created: ${invoice.id} for user ${subscription.userId}`,
    );

    // Send invoice notification
    if (invoice.pdf) {
      await NotificationService.sendInvoiceCreated(
        subscription.userId,
        invoice.pdf,
        invoice.id,
      );
    }
  } catch (error: any) {
    logger.error(`Error handling invoice created: ${error.message}`);
    throw error;
  }
}

/**
 * Handle successful payment
 * Triggered when invoice payment is successfully processed
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  try {
    const subscriptionId = invoice.subscription as string;

    const subscription = await SubscriptionModel.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      logger.warn(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const userId = subscription.userId;

    // Update invoice status
    await InvoiceModel.findOneAndUpdate(
      { stripeInvoiceId: invoice.id },
      {
        status: "paid",
        amountPaid: invoice.amount_paid / 100,
        paidAt: new Date(),
      },
    );

    // Update subscription status back to active if it was past_due
    if (subscription.status === "past_due") {
      await SubscriptionModel.findByIdAndUpdate(subscription._id, {
        status: "active",
      });
    }

    logger.info(`Invoice payment succeeded: ${invoice.id}`);

    // Send payment confirmation
    await NotificationService.sendPaymentConfirmation(
      userId,
      invoice.amount_paid / 100,
    );

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "payment_successful",
      amount: invoice.amount_paid / 100,
    });
  } catch (error: any) {
    logger.error(`Error handling invoice payment succeeded: ${error.message}`);
    throw error;
  }
}

/**
 * Handle payment failure
 * Triggered when invoice payment fails
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  try {
    const subscriptionId = invoice.subscription as string;

    const subscription = await SubscriptionModel.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      logger.warn(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const userId = subscription.userId;

    // Update invoice status
    await InvoiceModel.findOneAndUpdate(
      { stripeInvoiceId: invoice.id },
      {
        status: "failed",
        failedAt: new Date(),
      },
    );

    // Update subscription to past_due
    await SubscriptionModel.findByIdAndUpdate(subscription._id, {
      status: "past_due",
    });

    logger.warn(`Invoice payment failed: ${invoice.id}`);

    // Send payment failure notification
    const charge = invoice.charge as string;
    const chargeObj = await stripe.charges.retrieve(charge);
    const failureMessage =
      chargeObj.failure_message || "Payment method declined";

    await NotificationService.sendPaymentFailureNotification(
      userId,
      failureMessage,
      invoice.id,
    );

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "payment_failed",
      failureReason: failureMessage,
    });

    // Schedule retry notification (24 hours before next attempt)
    const nextRetry = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null;
    if (nextRetry) {
      await NotificationService.scheduleRetryReminder(userId, nextRetry);
    }
  } catch (error: any) {
    logger.error(`Error handling invoice payment failed: ${error.message}`);
    throw error;
  }
}

/**
 * Handle charge failure
 * Triggered when charge fails for any reason (card declined, insufficient funds, etc.)
 */
async function handleChargeFailed(charge: Stripe.Charge): Promise<void> {
  try {
    const customerId = charge.customer as string;

    if (!customerId) {
      logger.warn(`No customer associated with failed charge: ${charge.id}`);
      return;
    }

    // Find subscription by customer
    const subscription = await SubscriptionModel.findOne({
      stripeCustomerId: customerId,
    });

    if (!subscription) {
      logger.warn(`Subscription not found for customer: ${customerId}`);
      return;
    }

    const userId = subscription.userId;
    const failureCode = charge.failure_code || "unknown_error";
    const failureMessage =
      charge.failure_message || "Payment processing failed";

    logger.warn(
      `Charge failed for user ${userId}: ${failureCode} - ${failureMessage}`,
    );

    // Determine action based on failure code
    if (
      [
        "card_declined",
        "insufficient_funds",
        "lost_card",
        "stolen_card",
      ].includes(failureCode)
    ) {
      // Update payment method required flag
      await UserModel.findByIdAndUpdate(userId, {
        paymentMethodRequired: true,
      });

      // Send update payment method notification
      await NotificationService.sendUpdatePaymentMethodNotification(userId);
    }

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "charge_failed",
      failureCode,
      failureMessage,
    });
  } catch (error: any) {
    logger.error(`Error handling charge failed: ${error.message}`);
    throw error;
  }
}

/**
 * Handle charge refund
 * Triggered when charge is refunded (full or partial)
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  try {
    const customerId = charge.customer as string;

    if (!customerId) {
      logger.warn(`No customer associated with refunded charge: ${charge.id}`);
      return;
    }

    // Find subscription by customer
    const subscription = await SubscriptionModel.findOne({
      stripeCustomerId: customerId,
    });

    if (!subscription) {
      logger.warn(`Subscription not found for customer: ${customerId}`);
      return;
    }

    const userId = subscription.userId;
    const refundAmount = charge.amount_refunded / 100;
    const isFullRefund = charge.amount_refunded === charge.amount;

    logger.info(
      `Charge refunded for user ${userId}: $${refundAmount} (${isFullRefund ? "full" : "partial"})`,
    );

    // Find and update invoice
    const invoice = await InvoiceModel.findOne({
      stripeCustomerId: customerId,
    });

    if (invoice) {
      await InvoiceModel.findByIdAndUpdate(invoice._id, {
        refundedAmount: (invoice.refundedAmount || 0) + refundAmount,
        refundedAt: new Date(),
        status: isFullRefund ? "refunded" : "partially_refunded",
      });
    }

    // Send refund notification
    await NotificationService.sendRefundNotification(
      userId,
      refundAmount,
      isFullRefund,
    );

    // Track analytics
    await AnalyticsService.trackEvent({
      userId,
      eventType: "charge_refunded",
      refundAmount,
      isFullRefund,
    });
  } catch (error: any) {
    logger.error(`Error handling charge refunded: ${error.message}`);
    throw error;
  }
}

/**
 * Export webhook handler for express router
 */
export default {
  handleStripeWebhook,
};
