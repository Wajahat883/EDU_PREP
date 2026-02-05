/**
 * Payment Service API Routes
 *
 * Endpoints for:
 * - Subscription creation, upgrade, downgrade, cancellation
 * - Payment method management
 * - Invoice and billing history
 * - Webhook handling
 */

import express, { Router, Request, Response } from "express";
import Stripe from "stripe";
import { authenticateToken } from "../middleware/auth";
import {
  SubscriptionManager,
  RenewalScheduler,
} from "../services/subscriptionManager";
import {
  StripeWebhookService,
  WebhookEventLogger,
} from "../services/stripeWebhookService";
import { Subscription } from "../models/Payment";
import { Invoice } from "../models/Payment";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================================================================
// SUBSCRIPTION ENDPOINTS
// ============================================================================

/**
 * GET /api/payments/subscription
 * Get current subscription for user
 */
router.get(
  "/subscription",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const subscription = await SubscriptionManager.getSubscription(userId);

      res.json({
        success: true,
        subscription: subscription || null,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  },
);

/**
 * POST /api/payments/subscribe
 * Create a new subscription
 *
 * Body: { tier, couponCode?, paymentMethodId? }
 */
router.post(
  "/subscribe",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const email = (req as any).user?.email;
      const { tier, couponCode, paymentMethodId } = req.body;

      if (!userId || !email) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!["starter", "professional", "premium"].includes(tier)) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      const result = await SubscriptionManager.createSubscription({
        userId,
        tier,
        email,
        trialDays: 14,
        paymentMethodId,
        couponCode,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        subscription: result.subscription,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  },
);

/**
 * POST /api/payments/upgrade
 * Upgrade subscription to higher tier
 *
 * Body: { newTier }
 */
router.post(
  "/upgrade",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { newTier } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await SubscriptionManager.changeSubscriptionTier(
        userId,
        newTier,
        true, // Apply prorations
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        subscription: result.subscription,
      });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  },
);

/**
 * POST /api/payments/downgrade
 * Downgrade subscription to lower tier
 *
 * Body: { newTier }
 */
router.post(
  "/downgrade",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { newTier } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await SubscriptionManager.changeSubscriptionTier(
        userId,
        newTier,
        false, // No prorations for downgrade
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        subscription: result.subscription,
      });
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      res.status(500).json({ error: "Failed to downgrade subscription" });
    }
  },
);

/**
 * POST /api/payments/cancel
 * Cancel subscription
 *
 * Body: { immediate? }
 */
router.post(
  "/cancel",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { immediate } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await SubscriptionManager.cancelSubscription(
        userId,
        immediate || false,
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: immediate
          ? "Subscription canceled immediately"
          : "Subscription will be canceled at period end",
        subscription: result.subscription,
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  },
);

/**
 * POST /api/payments/reactivate
 * Reactivate a canceled subscription
 */
router.post(
  "/reactivate",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await SubscriptionManager.reactivateSubscription(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: "Subscription reactivated",
        subscription: result.subscription,
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  },
);

// ============================================================================
// PAYMENT METHOD ENDPOINTS
// ============================================================================

/**
 * GET /api/payments/payment-methods
 * Get all payment methods for user
 */
router.get(
  "/payment-methods",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const paymentMethods =
        await SubscriptionManager.getPaymentMethods(userId);

      res.json({
        success: true,
        count: paymentMethods.length,
        paymentMethods: paymentMethods.map((pm: Stripe.PaymentMethod) => ({
          id: pm.id,
          type: pm.type,
          card: pm.card
            ? {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
              }
            : null,
        })),
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  },
);

/**
 * POST /api/payments/payment-methods/update
 * Update default payment method
 *
 * Body: { paymentMethodId }
 */
router.post(
  "/payment-methods/update",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { paymentMethodId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await SubscriptionManager.updatePaymentMethod(
        userId,
        paymentMethodId,
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: "Payment method updated",
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  },
);

// ============================================================================
// INVOICE & BILLING ENDPOINTS
// ============================================================================

/**
 * GET /api/payments/invoices
 * Get invoices for user
 */
router.get(
  "/invoices",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { limit = 10, skip = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const invoices = await Invoice.find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Invoice.countDocuments({ userId });

      res.json({
        success: true,
        total,
        count: invoices.length,
        invoices: invoices.map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.stripeInvoiceId,
          amount: inv.amount / 100, // Convert from cents
          amountPaid: inv.amountPaid / 100,
          amountDue: inv.amountDue / 100,
          status: inv.status,
          period: {
            start: inv.periodStart,
            end: inv.periodEnd,
          },
          pdfUrl: inv.pdfUrl,
          hostedInvoiceUrl: inv.hostedInvoiceUrl,
          paidAt: inv.paidAt,
          createdAt: inv.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  },
);

/**
 * GET /api/payments/invoices/:invoiceId
 * Get specific invoice details
 */
router.get(
  "/invoices/:invoiceId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { invoiceId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const invoice = await Invoice.findOne({
        _id: invoiceId,
        userId,
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.json({
        success: true,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.stripeInvoiceId,
          amount: invoice.amount / 100,
          amountPaid: invoice.amountPaid / 100,
          amountDue: invoice.amountDue / 100,
          status: invoice.status,
          period: {
            start: invoice.periodStart,
            end: invoice.periodEnd,
          },
          pdfUrl: invoice.pdfUrl,
          hostedInvoiceUrl: invoice.hostedInvoiceUrl,
          description: invoice.description,
          paidAt: invoice.paidAt,
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  },
);

/**
 * POST /api/payments/invoices/:invoiceId/retry
 * Retry failed payment on invoice
 */
router.post(
  "/invoices/:invoiceId/retry",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { invoiceId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify invoice belongs to user
      const invoice = await Invoice.findOne({
        stripeInvoiceId: invoiceId,
        userId,
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const result = await SubscriptionManager.retryFailedPayment(
        userId,
        invoiceId,
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: "Payment processed",
      });
    } catch (error) {
      console.error("Error retrying payment:", error);
      res.status(500).json({ error: "Failed to retry payment" });
    }
  },
);

// ============================================================================
// COUPON & VALIDATION ENDPOINTS
// ============================================================================

/**
 * POST /api/payments/validate-coupon
 * Validate coupon code
 *
 * Body: { couponCode }
 */
router.post("/validate-coupon", async (req: Request, res: Response) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ error: "Coupon code required" });
    }

    const result = await SubscriptionManager.validateCoupon(couponCode);

    res.json(result);
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

/**
 * POST /api/payments/webhook
 * Handle Stripe webhooks
 *
 * Must be public endpoint (no authentication)
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const body = (req as any).body;

      // Verify webhook signature
      const event = StripeWebhookService.verifyWebhookSignature(body, sig);

      if (!event) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      // Process event
      const result = await StripeWebhookService.handleEvent(event);

      // Log event
      await WebhookEventLogger.logEvent(event, "success");

      res.json({
        success: true,
        eventId: result.eventId,
        type: result.type,
      });
    } catch (error: any) {
      console.error("Error processing webhook:", error);

      // Log failure
      try {
        const sig = req.headers["stripe-signature"] as string;
        const body = (req as any).body;
        const event = StripeWebhookService.verifyWebhookSignature(body, sig);
        if (event) {
          await WebhookEventLogger.logEvent(event, "failure", error.message);
        }
      } catch (logError) {
        console.error("Error logging webhook failure:", logError);
      }

      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

// ============================================================================
// ADMIN/DIAGNOSTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/payments/upcoming-renewals
 * Get subscriptions renewing soon (admin only)
 */
router.get(
  "/admin/upcoming-renewals",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { days = 7 } = req.query;
      const renewals = await RenewalScheduler.getUpcomingRenewals(
        parseInt(days as string),
      );

      res.json({
        success: true,
        count: renewals.length,
        renewals,
      });
    } catch (error) {
      console.error("Error fetching upcoming renewals:", error);
      res.status(500).json({ error: "Failed to fetch renewals" });
    }
  },
);

export default router;
