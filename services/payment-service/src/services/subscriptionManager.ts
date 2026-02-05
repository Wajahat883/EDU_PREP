/**
 * Subscription Management Service
 *
 * Handles subscription lifecycle:
 * - Creating subscriptions
 * - Upgrading/downgrading tiers
 * - Cancellation
 * - Renewal automation
 * - Trial period management
 */

import Stripe from "stripe";
import { User, IUser } from "../models/User";
import { Subscription, ISubscription } from "../models/Subscription";
import { StripeWebhookService } from "./stripeWebhookService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface SubscriptionOptions {
  userId: string;
  tier: "starter" | "professional" | "premium";
  email: string;
  trialDays?: number;
  paymentMethodId?: string;
  couponCode?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: ISubscription;
  clientSecret?: string;
  error?: string;
}

/**
 * Subscription Manager Service
 *
 * Handles all subscription operations
 */
export class SubscriptionManager {
  /**
   * Create a new subscription
   *
   * Flow:
   * 1. Create/retrieve Stripe customer
   * 2. Create subscription in Stripe
   * 3. Save to database
   * 4. Send confirmation email
   *
   * @param options Subscription creation options
   * @returns Subscription details
   */
  static async createSubscription(
    options: SubscriptionOptions,
  ): Promise<SubscriptionResponse> {
    try {
      const { userId, tier, email, trialDays = 14, couponCode } = options;

      // Find or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId, email);

      // Get price ID for tier
      const priceId = StripeWebhookService.getPriceIdFromTier(tier);
      if (!priceId) {
        return { success: false, error: "Invalid subscription tier" };
      }

      // Create subscription in Stripe
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        metadata: {
          userId,
          tier,
        },
        trial_period_days: trialDays,
        automatic_tax: { enabled: true },
        collection_method: "charge_automatically",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      };

      // Add coupon if provided
      if (couponCode) {
        subscriptionParams.coupon = couponCode;
      }

      const stripeSubscription =
        await stripe.subscriptions.create(subscriptionParams);

      // Create subscription record in database
      const newSubscription = new Subscription({
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customer.id,
        tier,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
        stripeData: stripeSubscription,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      });

      await newSubscription.save();

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          stripeCustomerId: customer.id,
          subscriptionStatus: stripeSubscription.status,
          subscriptionTier: tier,
          subscriptionStartDate: new Date(),
          trialEndsAt: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
        },
        { new: true },
      );

      return {
        success: true,
        subscription: newSubscription,
      };
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upgrade or downgrade subscription
   *
   * Changes to a different tier
   *
   * @param userId User ID
   * @param newTier New subscription tier
   * @param proration If true, bills/credits difference immediately
   * @returns Updated subscription
   */
  static async changeSubscriptionTier(
    userId: string,
    newTier: "starter" | "professional" | "premium",
    proration: boolean = true,
  ): Promise<SubscriptionResponse> {
    try {
      // Find user's current subscription
      const subscription = await Subscription.findOne({
        userId,
        status: { $ne: "canceled" },
      });

      if (!subscription) {
        return { success: false, error: "No active subscription found" };
      }

      // Get new price ID
      const newPriceId = StripeWebhookService.getPriceIdFromTier(newTier);
      if (!newPriceId) {
        return { success: false, error: "Invalid subscription tier" };
      }

      // Update subscription in Stripe
      const updatedStripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: subscription.stripeData.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: proration ? "create_prorations" : "none",
          metadata: {
            userId,
            tier: newTier,
          },
          expand: ["latest_invoice.payment_intent"],
        },
      );

      // Update database
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.stripeSubscriptionId },
        {
          tier: newTier,
          stripeData: updatedStripeSubscription,
          updatedAt: new Date(),
        },
        { new: true },
      );

      // Update user
      await User.findByIdAndUpdate(userId, {
        subscriptionTier: newTier,
      });

      return {
        success: true,
        subscription: updated || undefined,
      };
    } catch (error: any) {
      console.error("Error changing subscription tier:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel subscription
   *
   * Marks subscription for cancellation at period end
   * (can still be reactivated before renewal)
   *
   * @param userId User ID
   * @param immediate If true, cancel immediately; if false, cancel at period end
   * @returns Cancellation response
   */
  static async cancelSubscription(
    userId: string,
    immediate: boolean = false,
  ): Promise<SubscriptionResponse> {
    try {
      // Find user's subscription
      const subscription = await Subscription.findOne({
        userId,
        status: { $ne: "canceled" },
      });

      if (!subscription) {
        return { success: false, error: "No active subscription found" };
      }

      // Cancel in Stripe
      const canceledSubscription = immediate
        ? await stripe.subscriptions.del(subscription.stripeSubscriptionId)
        : await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

      // Update database
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.stripeSubscriptionId },
        {
          status: canceledSubscription.status,
          canceledAt: new Date(),
          stripeData: canceledSubscription,
          updatedAt: new Date(),
        },
        { new: true },
      );

      // Update user
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: canceledSubscription.status,
        subscriptionCanceledAt: new Date(),
      });

      return {
        success: true,
        subscription: updated || undefined,
      };
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reactivate canceled subscription
   *
   * Re-enables subscription before period end
   *
   * @param userId User ID
   * @returns Reactivated subscription
   */
  static async reactivateSubscription(
    userId: string,
  ): Promise<SubscriptionResponse> {
    try {
      // Find canceled subscription
      const subscription = await Subscription.findOne({
        userId,
        status: "active",
        canceledAt: { $exists: true },
      });

      if (!subscription) {
        return { success: false, error: "No canceled subscription found" };
      }

      // Reactivate in Stripe
      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      // Update database
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.stripeSubscriptionId },
        {
          status: reactivatedSubscription.status,
          canceledAt: null,
          stripeData: reactivatedSubscription,
          updatedAt: new Date(),
        },
        { new: true },
      );

      // Update user
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: reactivatedSubscription.status,
        subscriptionCanceledAt: null,
      });

      return {
        success: true,
        subscription: updated || undefined,
      };
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get or create Stripe customer
   *
   * @param userId User ID
   * @param email User email
   * @returns Stripe customer
   */
  private static async getOrCreateCustomer(
    userId: string,
    email: string,
  ): Promise<Stripe.Customer> {
    // Check if user already has Stripe customer ID
    const user = await User.findById(userId);

    if (user?.stripeCustomerId) {
      // Retrieve existing customer
      return await stripe.customers.retrieve(user.stripeCustomerId);
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    return customer;
  }

  /**
   * Get subscription details
   *
   * @param userId User ID
   * @returns Current subscription
   */
  static async getSubscription(userId: string): Promise<ISubscription | null> {
    return Subscription.findOne({
      userId,
      status: { $ne: "canceled" },
    });
  }

  /**
   * Get subscription history
   *
   * @param userId User ID
   * @returns All subscriptions (active and canceled)
   */
  static async getSubscriptionHistory(
    userId: string,
  ): Promise<ISubscription[]> {
    return Subscription.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Apply coupon code
   *
   * Validates and applies coupon to subscription
   *
   * @param couponCode Coupon code
   * @returns Coupon details
   */
  static async validateCoupon(couponCode: string) {
    try {
      const coupon = await stripe.coupons.retrieve(couponCode);
      return {
        valid: true,
        coupon: {
          id: coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months,
          maxRedemptions: coupon.max_redemptions,
          timesRedeemed: coupon.times_redeemed,
          valid: !coupon.deleted,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid coupon code",
      };
    }
  }

  /**
   * Get payment methods for user
   *
   * @param userId User ID
   * @returns List of payment methods
   */
  static async getPaymentMethods(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user?.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
      });

      return paymentMethods.data;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return [];
    }
  }

  /**
   * Update payment method
   *
   * Changes the default payment method for billing
   *
   * @param userId User ID
   * @param paymentMethodId Stripe payment method ID
   * @returns Success status
   */
  static async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user?.stripeCustomerId) {
        return { success: false, error: "User not connected to Stripe" };
      }

      // Update customer default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Also update on active subscription
      const subscription = await Subscription.findOne({
        userId,
        status: "active",
      });

      if (subscription) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          default_payment_method: paymentMethodId,
        });
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retry failed payment
   *
   * Attempts to charge a previously failed invoice
   *
   * @param userId User ID
   * @param invoiceId Stripe invoice ID
   * @returns Payment attempt result
   */
  static async retryFailedPayment(
    userId: string,
    invoiceId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invoice
      const invoice = await stripe.invoices.retrieve(invoiceId);

      if (invoice.status === "paid") {
        return {
          success: false,
          error: "Invoice already paid",
        };
      }

      // Retry payment
      const paid = await stripe.invoices.pay(invoiceId);

      return {
        success: paid.status === "paid",
        error: paid.status !== "paid" ? "Payment still failed" : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Renewal Scheduler Service
 *
 * Handles automatic subscription renewals
 */
export class RenewalScheduler {
  /**
   * Check for upcoming renewals (for email reminders)
   *
   * Returns subscriptions renewing in next N days
   *
   * @param daysAhead Number of days to look ahead
   * @returns Subscriptions renewing soon
   */
  static async getUpcomingRenewals(daysAhead: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Subscription.find({
      status: "active",
      currentPeriodEnd: {
        $lte: futureDate,
        $gte: new Date(),
      },
    }).populate("userId");
  }

  /**
   * Check for overdue payments
   *
   * Returns unpaid invoices past due
   *
   * @returns Overdue invoices
   */
  static async getOverduePayments() {
    const Invoice = require("../models/Invoice");
    return Invoice.find({
      status: { $in: ["open", "draft"] },
      dueDate: { $lt: new Date() },
    }).populate("userId");
  }

  /**
   * Process subscription renewals
   *
   * Automatically renews subscriptions at period end
   * (This is handled by Stripe, but can be called for manual sync)
   */
  static async processRenewals() {
    try {
      const activeSubscriptions = await Subscription.find({
        status: "active",
        currentPeriodEnd: { $lt: new Date() },
      });

      console.log(
        `Processing ${activeSubscriptions.length} subscription renewals`,
      );

      for (const sub of activeSubscriptions) {
        try {
          // Sync with Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(
            sub.stripeSubscriptionId,
          );

          // Update database
          await Subscription.updateOne(
            { _id: sub._id },
            {
              status: stripeSubscription.status,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000,
              ),
            },
          );
        } catch (error) {
          console.error(
            `Error processing renewal for subscription ${sub._id}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("Error processing renewals:", error);
    }
  }
}
