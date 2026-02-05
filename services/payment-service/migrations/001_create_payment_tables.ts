/**
 * Database Migration - Create Payment Tables
 * Location: services/payment-service/migrations/001_create_payment_tables.ts
 *
 * Creates initial payment-related collections and indexes
 */

import mongoose, { Connection } from "mongoose";

export const up = async (db: Connection) => {
  try {
    console.log("Running migration: 001_create_payment_tables");

    // Create subscriptions collection with indexes
    await db.collection("subscriptions").createIndex({ userId: 1 });
    await db.collection("subscriptions").createIndex({ stripeCustomerId: 1 });
    await db.collection("subscriptions").createIndex({
      stripeSubscriptionId: 1,
    });
    await db.collection("subscriptions").createIndex({ planId: 1 });
    await db.collection("subscriptions").createIndex({ status: 1 });
    await db.collection("subscriptions").createIndex({ createdAt: 1 });

    // Create invoices collection with indexes
    await db.collection("invoices").createIndex({ stripeInvoiceId: 1 });
    await db.collection("invoices").createIndex({ stripeCustomerId: 1 });
    await db.collection("invoices").createIndex({ status: 1 });
    await db.collection("invoices").createIndex({ createdAt: 1 });
    await db.collection("invoices").createIndex({ paidAt: 1 });

    // Create payments collection with indexes
    await db.collection("payments").createIndex({ stripePaymentIntentId: 1 });
    await db.collection("payments").createIndex({ userId: 1 });
    await db.collection("payments").createIndex({ status: 1 });
    await db.collection("payments").createIndex({ createdAt: 1 });

    // Create payment methods collection with indexes
    await db
      .collection("paymentmethods")
      .createIndex({ stripePaymentMethodId: 1 });
    await db.collection("paymentmethods").createIndex({ userId: 1 });
    await db.collection("paymentmethods").createIndex({ isDefault: 1 });

    // Create webhook events collection for audit trail
    await db.collection("webhookevents").createIndex({ stripeEventId: 1 });
    await db.collection("webhookevents").createIndex({ eventType: 1 });
    await db.collection("webhookevents").createIndex({ createdAt: 1 });

    console.log("Migration 001_create_payment_tables completed successfully");
  } catch (error) {
    console.error("Migration 001_create_payment_tables failed:", error);
    throw error;
  }
};

export const down = async (db: Connection) => {
  try {
    console.log("Rolling back migration: 001_create_payment_tables");

    // Drop collections
    await db
      .collection("subscriptions")
      .drop()
      .catch(() => {});
    await db
      .collection("invoices")
      .drop()
      .catch(() => {});
    await db
      .collection("payments")
      .drop()
      .catch(() => {});
    await db
      .collection("paymentmethods")
      .drop()
      .catch(() => {});
    await db
      .collection("webhookevents")
      .drop()
      .catch(() => {});

    console.log(
      "Rollback of migration 001_create_payment_tables completed successfully",
    );
  } catch (error) {
    console.error(
      "Rollback of migration 001_create_payment_tables failed:",
      error,
    );
    throw error;
  }
};
