/**
 * Stripe Webhook Service
 *
 * Handles all Stripe events:
 * - Customer creation
 * - Subscription lifecycle (created, updated, deleted)
 * - Payment success/failure
 * - Invoice events (created, paid, failed)
 * - Refunds
 */

import Stripe from "stripe";
import { User } from "../models/User";
import { Subscription, ISubscription } from "../models/Subscription";
import { Invoice, IInvoice } from "../models/Invoice";
import { PaymentFailure, IPaymentFailure } from "../models/PaymentFailure";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  error?: string;
}

/**
 * Stripe Event Handler
 *
 * Processes incoming Stripe webhook events and updates database
 */
export class StripeWebhookService {
  /**
   * Verify webhook signature
   *
   * Ensures webhook came from Stripe (not spoofed)
   *
   * @param body Raw request body
   * @param sig Stripe signature header
   * @returns Parsed event or null if invalid
   */
  static verifyWebhookSignature(
    body: string,
    sig: string,
  ): Stripe.Event | null {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      return event;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return null;
    }
  }

  /**
   * Handle Stripe event
   *
   * Routes event to appropriate handler based on type
   *
   * @param event Stripe event object
   * @returns Processing result
   */
  static async handleEvent(event: Stripe.Event) {
    try {
      console.log(`Processing event: ${event.type}`);

      let result: any;

      switch (event.type) {
        // Customer events
        case "customer.created":
          result = await this.handleCustomerCreated(
            event.data.object as Stripe.Customer,
          );
          break;

        case "customer.deleted":
          result = await this.handleCustomerDeleted(
            event.data.object as Stripe.Customer,
          );
          break;

        // Subscription events
        case "customer.subscription.created":
          result = await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.updated":
          result = await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
            event.data.previous_attributes,
          );
          break;

        case "customer.subscription.deleted":
          result = await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        // Invoice events
        case "invoice.created":
          result = await this.handleInvoiceCreated(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "invoice.payment_succeeded":
          result = await this.handleInvoicePaid(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "invoice.payment_failed":
          result = await this.handleInvoiceFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "invoice.finalized":
          result = await this.handleInvoiceFinalized(
            event.data.object as Stripe.Invoice,
          );
          break;

        // Charge events
        case "charge.refunded":
          result = await this.handleChargeRefunded(
            event.data.object as Stripe.Charge,
          );
          break;

        case "charge.dispute.created":
          result = await this.handleDisputeCreated(
            event.data.object as Stripe.Dispute,
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
          result = { handled: false };
      }

      return {
        success: true,
        eventId: event.id,
        type: event.type,
        result,
      };
    } catch (error) {
      console.error("Error handling webhook event:", error);
      throw error;
    }
  }

  /**
   * Handle customer.created event
   *
   * Called when customer creates Stripe account
   */
  private static async handleCustomerCreated(
    customer: Stripe.Customer,
  ): Promise<void> {
    try {
      // Customer ID stored in user metadata
      const userId = customer.metadata?.userId;
      if (!userId) {
        console.warn("No userId in customer metadata");
        return;
      }

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: customer.id,
        stripeEmail: customer.email,
      });

      console.log(`Customer created: ${customer.id} for user: ${userId}`);
    } catch (error) {
      console.error("Error handling customer.created:", error);
      throw error;
    }
  }

  /**
   * Handle customer.deleted event
   *
   * Called when customer is deleted in Stripe dashboard
   */
  private static async handleCustomerDeleted(
    customer: Stripe.Customer,
  ): Promise<void> {
    try {
      // Mark user as non-subscriber
      await User.findOneAndUpdate(
        { stripeCustomerId: customer.id },
        {
          stripeCustomerId: null,
          subscriptionStatus: "deleted",
        },
      );

      console.log(`Customer deleted: ${customer.id}`);
    } catch (error) {
      console.error("Error handling customer.deleted:", error);
      throw error;
    }
  }

  /**
   * Handle customer.subscription.created event
   *
   * Called when subscription begins (payment successful)
   */
  private static async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.warn("No userId in subscription metadata");
        return;
      }

      const customerId = subscription.customer as string;

      // Determine tier from product ID
      const tier = this.getTierFromPriceId(subscription.items.data[0].price.id);

      // Create subscription record
      const newSubscription = new Subscription({
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        tier, // 'starter', 'professional', 'premium'
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripeData: subscription,
        stripeMetadata: subscription.metadata,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      });

      await newSubscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        subscriptionStartDate: new Date(),
      });

      console.log(
        `Subscription created: ${subscription.id} tier: ${tier} user: ${userId}`,
      );
    } catch (error) {
      console.error("Error handling subscription.created:", error);
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   *
   * Called when subscription details change
   * (tier change, cancellation, etc.)
   */
  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    previousAttributes: any,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      // Update subscription record
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: subscription.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeData: subscription,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (updated) {
        // Update user subscription status
        await User.findByIdAndUpdate(updated.userId, {
          subscriptionStatus: subscription.status,
        });
      }

      // Check if this is a cancellation
      if (
        previousAttributes.cancel_at_period_end === false &&
        subscription.cancel_at_period_end === true
      ) {
        console.log(`Subscription marked for cancellation: ${subscriptionId}`);
        // Could trigger email notification here
      }

      console.log(`Subscription updated: ${subscriptionId}`);
    } catch (error) {
      console.error("Error handling subscription.updated:", error);
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   *
   * Called when subscription is canceled
   */
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      // Update subscription record
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (updated) {
        // Update user subscription status
        await User.findByIdAndUpdate(updated.userId, {
          subscriptionStatus: "canceled",
          subscriptionTier: null,
        });
      }

      console.log(`Subscription deleted: ${subscriptionId}`);
    } catch (error) {
      console.error("Error handling subscription.deleted:", error);
      throw error;
    }
  }

  /**
   * Handle invoice.created event
   *
   * Called when invoice is generated
   */
  private static async handleInvoiceCreated(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      // Find user and subscription
      const user = await User.findOne({ stripeCustomerId: customerId });
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!user || !subscription) {
        console.warn("User or subscription not found for invoice");
        return;
      }

      // Create invoice record
      const newInvoice = new Invoice({
        userId: user._id,
        subscriptionId: subscription._id,
        stripeInvoiceId: invoice.id,
        stripeCustomerId: customerId,
        amount: invoice.amount_paid || invoice.amount_due,
        amountPaid: invoice.amount_paid || 0,
        amountDue: invoice.amount_due || 0,
        status: invoice.status,
        pdfUrl: invoice.pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        description: invoice.description,
        stripeData: invoice,
      });

      await newInvoice.save();

      console.log(`Invoice created: ${invoice.id} for user: ${user._id}`);
    } catch (error) {
      console.error("Error handling invoice.created:", error);
      throw error;
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   *
   * Called when invoice payment succeeds
   */
  private static async handleInvoicePaid(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      const invoiceId = invoice.id;

      // Update invoice record
      const updated = await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoiceId },
        {
          status: "paid",
          amountPaid: invoice.amount_paid,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (updated) {
        // Could trigger receipt email here
        console.log(`Invoice paid: ${invoiceId} user: ${updated.userId}`);
      }
    } catch (error) {
      console.error("Error handling invoice.payment_succeeded:", error);
      throw error;
    }
  }

  /**
   * Handle invoice.payment_failed event
   *
   * Called when payment fails (need to retry)
   */
  private static async handleInvoiceFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      const customerId = invoice.customer as string;
      const invoiceId = invoice.id;

      // Find user
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (!user) {
        console.warn("User not found for failed invoice");
        return;
      }

      // Update invoice record
      await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoiceId },
        {
          status: "open",
          failedAt: new Date(),
          updatedAt: new Date(),
        },
      );

      // Create payment failure record
      const failure = new PaymentFailure({
        userId: user._id,
        stripeInvoiceId: invoiceId,
        stripeCustomerId: customerId,
        amount: invoice.amount_due,
        failureReason:
          invoice.last_financing_error?.message || "Payment failed",
        retryCount: 0,
        nextRetryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });

      await failure.save();

      console.log(`Invoice payment failed: ${invoiceId} user: ${user._id}`);
      // Could trigger email notification about payment failure
    } catch (error) {
      console.error("Error handling invoice.payment_failed:", error);
      throw error;
    }
  }

  /**
   * Handle invoice.finalized event
   *
   * Called when invoice is finalized and ready for payment
   */
  private static async handleInvoiceFinalized(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      // Update invoice status
      await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          status: "finalized",
          updatedAt: new Date(),
        },
      );

      console.log(`Invoice finalized: ${invoice.id}`);
    } catch (error) {
      console.error("Error handling invoice.finalized:", error);
      throw error;
    }
  }

  /**
   * Handle charge.refunded event
   *
   * Called when charge is refunded
   */
  private static async handleChargeRefunded(
    charge: Stripe.Charge,
  ): Promise<void> {
    try {
      const customerId = charge.customer as string;

      // Find user
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (!user) {
        console.warn("User not found for refund");
        return;
      }

      // Find and update invoice
      await Invoice.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
          status: "refunded",
          refundedAmount: charge.amount_refunded,
          refundedAt: new Date(),
          updatedAt: new Date(),
        },
      );

      console.log(`Charge refunded: ${charge.id} user: ${user._id}`);
      // Could trigger refund confirmation email
    } catch (error) {
      console.error("Error handling charge.refunded:", error);
      throw error;
    }
  }

  /**
   * Handle charge.dispute.created event
   *
   * Called when customer disputes a charge
   */
  private static async handleDisputeCreated(
    dispute: Stripe.Dispute,
  ): Promise<void> {
    try {
      const chargeId = dispute.charge as string;

      // Find user via charge
      const charge = await stripe.charges.retrieve(chargeId);
      const customerId = charge.customer as string;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (!user) {
        console.warn("User not found for dispute");
        return;
      }

      console.log(
        `Dispute created: ${dispute.id} for user: ${user._id} reason: ${dispute.reason}`,
      );
      // Could trigger dispute notification to admin
    } catch (error) {
      console.error("Error handling charge.dispute.created:", error);
      throw error;
    }
  }

  /**
   * Get subscription tier from Stripe price ID
   *
   * Maps Stripe price ID to internal tier name
   */
  private static getTierFromPriceId(priceId: string): string {
    const tierMap: Record<string, string> = {
      [process.env.STRIPE_PRICE_STARTER!]: "starter",
      [process.env.STRIPE_PRICE_PROFESSIONAL!]: "professional",
      [process.env.STRIPE_PRICE_PREMIUM!]: "premium",
    };

    return tierMap[priceId] || "unknown";
  }

  /**
   * Get price ID from tier
   *
   * Maps internal tier to Stripe price ID
   */
  static getPriceIdFromTier(tier: string): string {
    const tierMap: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER!,
      professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
      premium: process.env.STRIPE_PRICE_PREMIUM!,
    };

    return tierMap[tier] || "";
  }

  /**
   * Get product ID from tier
   */
  static getProductIdFromTier(tier: string): string {
    const tierMap: Record<string, string> = {
      starter: process.env.STRIPE_PRODUCT_STARTER!,
      professional: process.env.STRIPE_PRODUCT_PROFESSIONAL!,
      premium: process.env.STRIPE_PRODUCT_PREMIUM!,
    };

    return tierMap[tier] || "";
  }
}

/**
 * Event Logger Service
 *
 * Logs all webhook events for auditing and debugging
 */
export class WebhookEventLogger {
  /**
   * Log webhook event
   */
  static async logEvent(
    event: Stripe.Event,
    status: "success" | "failure",
    error?: string,
  ): Promise<void> {
    try {
      // Could implement MongoDB event logging here
      console.log(
        `[${status.toUpperCase()}] Event: ${event.type} ID: ${event.id}`,
      );
      if (error) {
        console.error(`Error: ${error}`);
      }
    } catch (err) {
      console.error("Error logging webhook event:", err);
    }
  }
}
