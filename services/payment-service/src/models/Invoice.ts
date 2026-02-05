/**
 * Invoice Model
 * Location: services/payment-service/src/models/Invoice.ts
 *
 * Stores invoice records for billing, including payment status, amount, and
 * associated subscription and customer information.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  amount: number;
  amountPaid: number;
  refundedAmount: number;
  currency: string;
  status:
    | "draft"
    | "open"
    | "paid"
    | "void"
    | "uncollectible"
    | "failed"
    | "refunded"
    | "partially_refunded";
  billingReason: string;
  dueDate?: Date;
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "paid",
        "void",
        "uncollectible",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "draft",
      index: true,
    },
    billingReason: {
      type: String,
      enum: [
        "subscription_cycle",
        "subscription_create",
        "subscription_update",
        "subscription_transition",
        "manual",
      ],
      default: "subscription_cycle",
    },
    dueDate: {
      type: Date,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    pdfUrl: {
      type: String,
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
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ stripeSubscriptionId: 1, status: 1 });
invoiceSchema.index({ periodStart: 1, periodEnd: 1 });
invoiceSchema.index({ status: 1, createdAt: -1 });

// Virtual for net amount (amount - refunded)
invoiceSchema.virtual("netAmount").get(function () {
  return this.amountPaid - this.refundedAmount;
});

export const InvoiceModel = mongoose.model<IInvoice>("Invoice", invoiceSchema);
