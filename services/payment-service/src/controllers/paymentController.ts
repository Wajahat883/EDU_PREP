/**
 * Payment Controller
 * Location: services/payment-service/src/controllers/paymentController.ts
 *
 * Handles payment and subscription business logic
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import stripeService from "../services/stripeService";
import { SubscriptionModel } from "../models/Subscription";
import { InvoiceModel } from "../models/Invoice";
import { PaymentModel } from "../models/Payment";
import logger from "../utils/logger";

export class PaymentController {
  /**
   * POST /api/payments/subscribe
   * Create a new subscription
   */
  async subscribe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const { tierId, paymentMethodId } = req.body;

      if (!tierId || !paymentMethodId) {
        return res.status(400).json({
          error: "Missing required fields: tierId, paymentMethodId",
          code: "MISSING_FIELDS",
        });
      }

      // Map tier IDs to Stripe price IDs
      const tierToPriceId: Record<string, string> = {
        basic: process.env.STRIPE_BASIC_PRICE_ID || "",
        standard: process.env.STRIPE_STANDARD_PRICE_ID || "",
        premium: process.env.STRIPE_PREMIUM_PRICE_ID || "",
      };

      const priceId = tierToPriceId[tierId.toLowerCase()];

      if (!priceId) {
        return res.status(400).json({
          error: "Invalid subscription tier",
          code: "INVALID_TIER",
        });
      }

      // Check if user already has an active subscription
      const existingSubscription = await SubscriptionModel.findOne({
        userId: req.user.id,
        status: "active",
      });

      if (existingSubscription) {
        return res.status(409).json({
          error: "User already has an active subscription",
          code: "SUBSCRIPTION_EXISTS",
        });
      }

      // Create or get Stripe customer
      let stripeCustomerId: string;

      const existingSubData = await SubscriptionModel.findOne({
        userId: req.user.id,
      });

      if (existingSubData) {
        stripeCustomerId = existingSubData.stripeCustomerId;
      } else {
        const customer = await stripeService.createCustomer({
          email: req.user.email,
          metadata: { userId: req.user.id },
        });
        stripeCustomerId = customer.id;
      }

      // Create Stripe subscription
      const stripeSubscription = await stripeService.createSubscription({
        customerId: stripeCustomerId,
        priceId,
        email: req.user.email,
        metadata: {
          userId: req.user.id,
          tier: tierId,
        },
      });

      // Save subscription to database
      const subscription = new SubscriptionModel({
        userId: req.user.id,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        planId: tierId.toLowerCase(),
        status: stripeSubscription.status,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        metadata: {
          planName: tierId,
        },
      });

      await subscription.save();

      logger.info("Subscription created successfully", {
        userId: req.user.id,
        subscriptionId: stripeSubscription.id,
        tier: tierId,
      });

      res.status(201).json({
        success: true,
        subscription: {
          id: subscription._id,
          stripeSubscriptionId: stripeSubscription.id,
          status: subscription.status,
          planId: subscription.planId,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      });
    } catch (error) {
      logger.error("Subscription creation failed", error);
      res.status(500).json({
        error: "Failed to create subscription",
        code: "SUBSCRIPTION_ERROR",
      });
    }
  }

  /**
   * POST /api/payments/upgrade
   * Upgrade existing subscription
   */
  async upgrade(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const { newTierId } = req.body;

      if (!newTierId) {
        return res.status(400).json({
          error: "Missing required field: newTierId",
          code: "MISSING_FIELDS",
        });
      }

      // Get current subscription
      const currentSubscription = await SubscriptionModel.findOne({
        userId: req.user.id,
        status: "active",
      });

      if (!currentSubscription) {
        return res.status(404).json({
          error: "No active subscription found",
          code: "NO_SUBSCRIPTION",
        });
      }

      // Map tier IDs to Stripe price IDs
      const tierToPriceId: Record<string, string> = {
        basic: process.env.STRIPE_BASIC_PRICE_ID || "",
        standard: process.env.STRIPE_STANDARD_PRICE_ID || "",
        premium: process.env.STRIPE_PREMIUM_PRICE_ID || "",
      };

      const newPriceId = tierToPriceId[newTierId.toLowerCase()];

      if (!newPriceId) {
        return res.status(400).json({
          error: "Invalid subscription tier",
          code: "INVALID_TIER",
        });
      }

      // Check if upgrading to same tier
      if (currentSubscription.planId === newTierId.toLowerCase()) {
        return res.status(400).json({
          error: "Already subscribed to this tier",
          code: "SAME_TIER",
        });
      }

      // Update Stripe subscription
      const updatedSubscription = await stripeService.updateSubscription({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        priceId: newPriceId,
        metadata: {
          previousTier: currentSubscription.planId,
          newTier: newTierId.toLowerCase(),
          upgradedAt: new Date().toISOString(),
        },
      });

      // Update database
      currentSubscription.stripePriceId = newPriceId;
      currentSubscription.planId = newTierId.toLowerCase();
      currentSubscription.metadata = {
        ...currentSubscription.metadata,
        previousTier: currentSubscription.planId,
        upgradedAt: new Date(),
      };

      await currentSubscription.save();

      logger.info("Subscription upgraded successfully", {
        userId: req.user.id,
        from: currentSubscription.planId,
        to: newTierId.toLowerCase(),
      });

      res.status(200).json({
        success: true,
        subscription: {
          id: currentSubscription._id,
          stripeSubscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          planId: currentSubscription.planId,
          currentPeriodStart: currentSubscription.currentPeriodStart,
          currentPeriodEnd: currentSubscription.currentPeriodEnd,
        },
      });
    } catch (error) {
      logger.error("Subscription upgrade failed", error);
      res.status(500).json({
        error: "Failed to upgrade subscription",
        code: "UPGRADE_ERROR",
      });
    }
  }

  /**
   * GET /api/payments/subscription
   * Get user's current subscription
   */
  async getSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const subscription = await SubscriptionModel.findOne({
        userId: req.user.id,
      }).sort({ createdAt: -1 });

      if (!subscription) {
        return res.status(404).json({
          error: "No subscription found",
          code: "NO_SUBSCRIPTION",
        });
      }

      res.status(200).json({
        subscription: {
          id: subscription._id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
      });
    } catch (error) {
      logger.error("Failed to retrieve subscription", error);
      res.status(500).json({
        error: "Failed to retrieve subscription",
        code: "RETRIEVAL_ERROR",
      });
    }
  }

  /**
   * POST /api/payments/cancel
   * Cancel user's subscription
   */
  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const subscription = await SubscriptionModel.findOne({
        userId: req.user.id,
        status: "active",
      });

      if (!subscription) {
        return res.status(404).json({
          error: "No active subscription found",
          code: "NO_SUBSCRIPTION",
        });
      }

      // Cancel at period end (graceful cancellation)
      const cancelAtPeriodEnd = req.body.immediate === true ? false : true;

      const updatedSubscription = await stripeService.updateSubscription({
        subscriptionId: subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
      });

      subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
      if (!cancelAtPeriodEnd) {
        subscription.status = "canceled";
        subscription.canceledAt = new Date();
      }

      await subscription.save();

      logger.info("Subscription canceled", {
        userId: req.user.id,
        immediate: !cancelAtPeriodEnd,
      });

      res.status(200).json({
        success: true,
        message: cancelAtPeriodEnd
          ? "Subscription will be canceled at the end of the billing period"
          : "Subscription canceled immediately",
        subscription: {
          id: subscription._id,
          status: subscription.status,
          canceledAt: subscription.canceledAt,
        },
      });
    } catch (error) {
      logger.error("Subscription cancellation failed", error);
      res.status(500).json({
        error: "Failed to cancel subscription",
        code: "CANCEL_ERROR",
      });
    }
  }

  /**
   * GET /api/payments/invoices
   * Get user's payment invoices
   */
  async getInvoices(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const subscription = await SubscriptionModel.findOne({
        userId: req.user.id,
      });

      if (!subscription) {
        return res.status(404).json({
          error: "No subscription found",
          code: "NO_SUBSCRIPTION",
        });
      }

      const stripeInvoices = await stripeService.getCustomerInvoices(
        subscription.stripeCustomerId,
      );

      const invoices = stripeInvoices.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        createdAt: new Date(invoice.created * 1000),
        pdfUrl: invoice.pdf,
        number: invoice.number,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
      }));

      res.status(200).json({
        invoices,
        total: invoices.length,
      });
    } catch (error) {
      logger.error("Failed to retrieve invoices", error);
      res.status(500).json({
        error: "Failed to retrieve invoices",
        code: "INVOICES_ERROR",
      });
    }
  }
}

export default new PaymentController();
