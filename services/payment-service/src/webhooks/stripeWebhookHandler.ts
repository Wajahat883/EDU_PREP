/**
 * Stripe Webhook Handler
 * Location: services/payment-service/src/webhooks/stripeWebhookHandler.ts
 *
 * Handles Stripe webhook events for subscription updates, payments, and cancellations
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import stripeService from "../services/stripeService";
import { SubscriptionModel } from "../models/Subscription";
import { InvoiceModel } from "../models/Invoice";
import logger from "../utils/logger";
import emailService from "../services/emailService";

export class StripeWebhookHandler {
  /**
   * Handle incoming Stripe webhook
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const body = req.body;

      if (!signature) {
        return res.status(400).json({
          error: "Missing stripe-signature header",
          code: "MISSING_SIGNATURE",
        });
      }

      let event: Stripe.Event;

      try {
        event = stripeService.constructWebhookEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET || "",
        );
      } catch (error: any) {
        logger.error("Webhook signature verification failed", error);
        return res.status(400).json({
          error: "Webhook signature verification failed",
          code: "INVALID_SIGNATURE",
        });
      }

      logger.info("Processing webhook event", { eventType: event.type });

      switch (event.type) {
        case "customer.subscription.created":
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case "customer.subscription.trial_will_end":
          await this.handleTrialWillEnd(
            event.data.object as Stripe.Subscription,
          );
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("Webhook processing error", error);
      res.status(500).json({
        error: "Webhook processing failed",
        code: "WEBHOOK_ERROR",
      });
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    try {
      logger.info("Processing subscription.created event", {
        subscriptionId: subscription.id,
      });

      const metadata = subscription.metadata || {};

      const sub = new SubscriptionModel({
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: (subscription.items.data[0]?.price.id as string) || "",
        planId: metadata.tier || "basic",
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        metadata,
      });

      await sub.save();

      // Send confirmation email
      if (metadata.email) {
        await emailService.sendSubscriptionConfirmation({
          email: metadata.email,
          planName: metadata.tier || "Basic",
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
        });
      }

      logger.info("Subscription created event processed successfully");
    } catch (error) {
      logger.error("Error processing subscription.created event", error);
    }
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      logger.info("Processing subscription.updated event", {
        subscriptionId: subscription.id,
      });

      const sub = await SubscriptionModel.findOne({
        stripeSubscriptionId: subscription.id,
      });

      if (!sub) {
        logger.warn("Subscription not found for update", {
          subscriptionId: subscription.id,
        });
        return;
      }

      sub.status = subscription.status;
      sub.currentPeriodStart = new Date(
        subscription.current_period_start * 1000,
      );
      sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      sub.stripePriceId =
        (subscription.items.data[0]?.price.id as string) || sub.stripePriceId;

      if (subscription.canceled_at) {
        sub.canceledAt = new Date(subscription.canceled_at * 1000);
      }

      await sub.save();

      logger.info("Subscription updated event processed successfully");
    } catch (error) {
      logger.error("Error processing subscription.updated event", error);
    }
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      logger.info("Processing subscription.deleted event", {
        subscriptionId: subscription.id,
      });

      const sub = await SubscriptionModel.findOne({
        stripeSubscriptionId: subscription.id,
      });

      if (!sub) {
        logger.warn("Subscription not found for deletion", {
          subscriptionId: subscription.id,
        });
        return;
      }

      sub.status = "canceled";
      sub.canceledAt = new Date();
      await sub.save();

      // Send cancellation email
      const metadata = subscription.metadata || {};
      if (metadata.email) {
        await emailService.sendCancellationConfirmation({
          email: metadata.email,
          planName: metadata.tier || "Basic",
          canceledAt: new Date(),
        });
      }

      logger.info("Subscription deleted event processed successfully");
    } catch (error) {
      logger.error("Error processing subscription.deleted event", error);
    }
  }

  /**
   * Handle payment succeeded event
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      logger.info("Processing invoice.payment_succeeded event", {
        invoiceId: invoice.id,
      });

      const invoiceRecord = new InvoiceModel({
        stripeInvoiceId: invoice.id,
        stripeCustomerId: invoice.customer as string,
        amount: invoice.amount_paid,
        status: "paid",
        paidAt: new Date(invoice.created * 1000),
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        pdfUrl: invoice.pdf || "",
        metadata: invoice.metadata || {},
      });

      await invoiceRecord.save();

      const metadata = invoice.metadata || {};
      if (metadata.email) {
        await emailService.sendPaymentReceipt({
          email: metadata.email,
          invoiceNumber: invoice.number || "",
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          pdfUrl: invoice.pdf || "",
        });
      }

      logger.info("Payment succeeded event processed successfully");
    } catch (error) {
      logger.error("Error processing invoice.payment_succeeded event", error);
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      logger.info("Processing invoice.payment_failed event", {
        invoiceId: invoice.id,
      });

      const metadata = invoice.metadata || {};
      if (metadata.email) {
        await emailService.sendPaymentFailedNotification({
          email: metadata.email,
          invoiceAmount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          retryDate: new Date(invoice.next_payment_attempt * 1000),
        });
      }

      const sub = await SubscriptionModel.findOne({
        stripeCustomerId: invoice.customer as string,
      });

      if (sub) {
        sub.status = "past_due";
        await sub.save();
      }

      logger.info("Payment failed event processed successfully");
    } catch (error) {
      logger.error("Error processing invoice.payment_failed event", error);
    }
  }

  /**
   * Handle trial will end event
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription) {
    try {
      logger.info("Processing customer.subscription.trial_will_end event", {
        subscriptionId: subscription.id,
      });

      const metadata = subscription.metadata || {};
      if (metadata.email && subscription.trial_end) {
        await emailService.sendTrialEndingNotification({
          email: metadata.email,
          trialEndDate: new Date(subscription.trial_end * 1000),
          planName: metadata.tier || "Basic",
        });
      }

      logger.info("Trial ending event processed successfully");
    } catch (error) {
      logger.error("Error processing trial_will_end event", error);
    }
  }
}

export default new StripeWebhookHandler();
