import mongoose, { Schema, Document } from "mongoose";

/**
 * Subscription Document Schema
 *
 * Stores subscription data for each user
 */
export interface ISubscription extends Document {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tier: "starter" | "professional" | "premium";
  status: string; // active, past_due, canceled, incomplete
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  stripeData: any; // Complete Stripe subscription object
  stripeMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
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
    tier: {
      type: String,
      enum: ["starter", "professional", "premium"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "past_due", "unpaid", "canceled", "incomplete"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialEnd: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    stripeData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    stripeMetadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);

/**
 * Invoice Document Schema
 *
 * Stores billing invoices
 */
export interface IInvoice extends Document {
  userId: string;
  subscriptionId: mongoose.Types.ObjectId;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  amount: number; // Total amount in cents
  amountPaid: number;
  amountDue: number;
  status: string; // draft, open, paid, uncollectible, void
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  refundedAmount?: number;
  description?: string;
  stripeData: any;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
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
    amountDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "uncollectible", "void", "refunded"],
      default: "open",
    },
    pdfUrl: {
      type: String,
    },
    hostedInvoiceUrl: {
      type: String,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
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
    refundedAmount: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
    },
    stripeData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);

/**
 * Payment Failure Document Schema
 *
 * Tracks failed payment attempts
 */
export interface IPaymentFailure extends Document {
  userId: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  amount: number;
  failureReason: string;
  retryCount: number;
  nextRetryDate: Date;
  resolvedAt?: Date;
  resolutionMethod?: string; // 'paid', 'canceled', 'refunded'
  stripeData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentFailureSchema = new Schema<IPaymentFailure>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    failureReason: {
      type: String,
      required: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextRetryDate: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolutionMethod: {
      type: String,
      enum: ["paid", "canceled", "refunded"],
    },
    stripeData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

paymentFailureSchema.index({ userId: 1, resolvedAt: 1 });

export const PaymentFailure = mongoose.model<IPaymentFailure>(
  "PaymentFailure",
  paymentFailureSchema,
);

/**
 * Billing History Schema
 *
 * Stores user billing records for admin and user viewing
 */
export interface IBillingHistory extends Document {
  userId: string;
  type:
    | "subscription_start"
    | "subscription_change"
    | "payment"
    | "refund"
    | "cancellation";
  amount?: number;
  description: string;
  stripeEventId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const billingHistorySchema = new Schema<IBillingHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "subscription_start",
        "subscription_change",
        "payment",
        "refund",
        "cancellation",
      ],
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    stripeEventId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

billingHistorySchema.index({ userId: 1, createdAt: -1 });

export const BillingHistory = mongoose.model<IBillingHistory>(
  "BillingHistory",
  billingHistorySchema,
);
