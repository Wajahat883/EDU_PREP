/**
 * Stripe Service
 * Location: services/payment-service/src/services/stripeService.ts
 *
 * Handles all Stripe API interactions for payments and subscriptions
 */

import Stripe from "stripe";
import logger from "../utils/logger";

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  email: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private stripe: Stripe;
  private apiVersion = "2023-10-16" as Stripe.LatestApiVersion;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: this.apiVersion,
    });
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      logger.info("Creating Stripe customer", { email: params.email });

      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      logger.info("Customer created successfully", { customerId: customer.id });
      return customer;
    } catch (error) {
      logger.error("Failed to create customer", error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info("Creating subscription", {
        customerId: params.customerId,
        priceId: params.priceId,
      });

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
        metadata: params.metadata,
      };

      if (params.trialDays) {
        subscriptionParams.trial_period_days = params.trialDays;
      }

      const subscription =
        await this.stripe.subscriptions.create(subscriptionParams);

      logger.info("Subscription created successfully", {
        subscriptionId: subscription.id,
      });

      return subscription;
    } catch (error) {
      logger.error("Failed to create subscription", error);
      throw error;
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    params: UpdateSubscriptionParams,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info("Updating subscription", {
        subscriptionId: params.subscriptionId,
      });

      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (params.priceId) {
        updateParams.items = [{ price: params.priceId }];
      }

      if (params.metadata) {
        updateParams.metadata = params.metadata;
      }

      if (params.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = params.cancelAtPeriodEnd;
      }

      const subscription = await this.stripe.subscriptions.update(
        params.subscriptionId,
        updateParams,
      );

      logger.info("Subscription updated successfully", {
        subscriptionId: subscription.id,
      });

      return subscription;
    } catch (error) {
      logger.error("Failed to update subscription", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info("Canceling subscription", { subscriptionId });

      const subscription = await this.stripe.subscriptions.del(subscriptionId);

      logger.info("Subscription canceled successfully", {
        subscriptionId: subscription.id,
      });

      return subscription;
    } catch (error) {
      logger.error("Failed to cancel subscription", error);
      throw error;
    }
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      logger.info("Retrieving subscription", { subscriptionId });

      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      return subscription;
    } catch (error) {
      logger.error("Failed to retrieve subscription", error);
      throw error;
    }
  }

  /**
   * Create a payment intent for manual payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      logger.info("Creating payment intent", {
        amount,
        currency,
        customerId,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method_types: ["card"],
        metadata,
      });

      logger.info("Payment intent created successfully", {
        paymentIntentId: paymentIntent.id,
      });

      return paymentIntent;
    } catch (error) {
      logger.error("Failed to create payment intent", error);
      throw error;
    }
  }

  /**
   * Retrieve invoices for a customer
   */
  async getCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      logger.info("Retrieving customer invoices", { customerId });

      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });

      return invoices.data;
    } catch (error) {
      logger.error("Failed to retrieve invoices", error);
      throw error;
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(
    body: Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, signature, secret);
  }
}

export default new StripeService(process.env.STRIPE_SECRET_KEY || "");
