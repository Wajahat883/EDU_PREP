/**
 * Subscription Model
 * Location: services/payment-service/src/models/Subscription.ts
 *
 * Stores subscription information for users, tracking plan, status, billing cycles,
 * and Stripe integration IDs.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planId: string;
  status:
    | "active"
    | "past_due"
    | "unpaid"
    | "canceled"
    | "incomplete"
    | "incomplete_expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ["starter", "professional", "premium"],
      index: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "past_due",
        "unpaid",
        "canceled",
        "incomplete",
        "incomplete_expired",
      ],
      default: "active",
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ planId: 1, status: 1 });

export const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
