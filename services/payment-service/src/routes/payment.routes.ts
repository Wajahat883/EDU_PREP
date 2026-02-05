/**
 * Payment Routes & API Endpoints
 * Location: services/payment-service/src/routes/payment.routes.ts
 *
 * Handles subscription management, plan upgrades/downgrades, payment method management,
 * invoice retrieval, and subscription operations.
 */

import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { SubscriptionModel } from "../models/Subscription";
import { InvoiceModel } from "../models/Invoice";
import { UserModel } from "../models/User";
import Stripe from "stripe";
import logger from "../utils/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 * Public endpoint (no auth required)
 */
router.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: "starter",
        name: "Starter",
        price: 9.99,
        billingPeriod: "month",
        features: [
          "Access to 10,000 questions",
          "3 practice exams per week",
          "Basic analytics dashboard",
          "Mobile app access",
        ],
        stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
      },
      {
        id: "professional",
        name: "Professional",
        price: 29.99,
        billingPeriod: "month",
        features: [
          "Access to 50,000 questions",
          "Unlimited practice exams",
          "Advanced analytics & performance insights",
          "Personalized study recommendations",
          "Priority support",
          "Flashcard system (SM-2)",
        ],
        stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      },
      {
        id: "premium",
        name: "Premium",
        price: 79.99,
        billingPeriod: "month",
        features: [
          "All Professional features",
          "AI-powered learning paths",
          "One-on-one tutoring sessions (5/month)",
          "Gamification & leaderboards",
          "Detailed weakness analysis",
          "Mock exam proctoring",
          "24/7 support",
          "Custom study schedules",
        ],
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      },
    ];

    res.json(plans);
  } catch (error: any) {
    logger.error(`Error fetching plans: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

/**
 * GET /api/subscriptions/current
 * Get current user's subscription details
 * Requires authentication
 */
router.get(
  "/current",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      const subscription = await SubscriptionModel.findOne({ userId }).sort({
        createdAt: -1,
      });

      if (!subscription) {
        return res.json({ subscription: null });
      }

      res.json({ subscription });
    } catch (error: any) {
      logger.error(`Error fetching current subscription: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  },
);

/**
 * GET /api/subscriptions/invoices
 * Get user's invoice history
 * Requires authentication
 */
router.get(
  "/invoices",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = parseInt(req.query.skip as string) || 0;

      const invoices = await InvoiceModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await InvoiceModel.countDocuments({ userId });

      res.json({
        invoices,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      logger.error(`Error fetching invoices: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  },
);

/**
 * POST /api/subscriptions/create-checkout
 * Create Stripe checkout session for subscription
 * Requires authentication
 */
router.post(
  "/create-checkout",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { priceId, planId } = req.body;

      // Validate inputs
      if (!priceId || !planId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get user
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has active subscription
      const existingSubscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: ["active", "past_due"] },
      });

      if (existingSubscription) {
        return res
          .status(400)
          .json({ error: "User already has an active subscription" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { user_id: userId.toString() },
        });
        customerId = customer.id;

        // Save customer ID
        await UserModel.findByIdAndUpdate(userId, {
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing?checkout=canceled`,
        subscription_data: {
          metadata: {
            user_id: userId.toString(),
            plan_id: planId,
          },
        },
      });

      logger.info(`Checkout session created for user ${userId}: ${session.id}`);

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      logger.error(`Error creating checkout session: ${error.message}`);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

/**
 * POST /api/subscriptions/upgrade
 * Upgrade or downgrade subscription to different plan
 * Requires authentication
 */
router.post(
  "/upgrade",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { newPriceId } = req.body;

      if (!newPriceId) {
        return res.status(400).json({ error: "Missing newPriceId" });
      }

      // Get user's current subscription
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: ["active", "past_due"] },
      });

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Update subscription in Stripe
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: subscription.stripePriceId,
              deleted: true,
            },
          ],
          add_invoice_items: [
            {
              price: newPriceId,
            },
          ],
        },
      );

      logger.info(`Subscription upgraded for user ${userId}`);

      res.json({ success: true, subscription: stripeSubscription });
    } catch (error: any) {
      logger.error(`Error upgrading subscription: ${error.message}`);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  },
);

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription at end of billing period
 * Requires authentication
 */
router.post(
  "/cancel",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { immediate = false } = req.body;

      // Get user's current subscription
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: ["active", "past_due"] },
      });

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel in Stripe
      let canceledSubscription: Stripe.Subscription;

      if (immediate) {
        // Immediate cancellation
        canceledSubscription = await stripe.subscriptions.del(
          subscription.stripeSubscriptionId,
        );
      } else {
        // Cancel at period end
        canceledSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          },
        );
      }

      logger.info(`Subscription canceled for user ${userId}`);

      res.json({ success: true, subscription: canceledSubscription });
    } catch (error: any) {
      logger.error(`Error canceling subscription: ${error.message}`);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  },
);

/**
 * POST /api/subscriptions/reactivate
 * Reactivate a canceled subscription
 * Requires authentication
 */
router.post(
  "/reactivate",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      // Get user's canceled subscription
      const subscription = await SubscriptionModel.findOne({
        userId,
        cancelAtPeriodEnd: true,
      });

      if (!subscription) {
        return res
          .status(404)
          .json({ error: "No subscription pending cancellation found" });
      }

      // Reactivate in Stripe
      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      logger.info(`Subscription reactivated for user ${userId}`);

      res.json({ success: true, subscription: reactivatedSubscription });
    } catch (error: any) {
      logger.error(`Error reactivating subscription: ${error.message}`);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  },
);

/**
 * GET /api/subscriptions/payment-methods
 * Get user's saved payment methods
 * Requires authentication
 */
router.get(
  "/payment-methods",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const user = await UserModel.findById(userId);

      if (!user || !user.stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
      });

      res.json({ paymentMethods: paymentMethods.data });
    } catch (error: any) {
      logger.error(`Error fetching payment methods: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  },
);

/**
 * POST /api/subscriptions/payment-method
 * Update default payment method
 * Requires authentication
 */
router.post(
  "/payment-method",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({ error: "Missing paymentMethodId" });
      }

      const user = await UserModel.findById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User has no Stripe customer" });
      }

      // Update customer's default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info(`Payment method updated for user ${userId}`);

      res.json({ success: true });
    } catch (error: any) {
      logger.error(`Error updating payment method: ${error.message}`);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  },
);

/**
 * GET /api/subscriptions/download-invoice/:invoiceId
 * Download invoice PDF
 * Requires authentication
 */
router.get(
  "/download-invoice/:invoiceId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { invoiceId } = req.params;

      // Verify ownership
      const invoice = await InvoiceModel.findOne({
        stripeInvoiceId: invoiceId,
        userId,
      });

      if (!invoice || !invoice.pdfUrl) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Redirect to PDF URL
      res.redirect(invoice.pdfUrl);
    } catch (error: any) {
      logger.error(`Error downloading invoice: ${error.message}`);
      res.status(500).json({ error: "Failed to download invoice" });
    }
  },
);

export default router;
