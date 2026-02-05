import mongoose from "mongoose";
import { MongoClient } from "mongodb";

/**
 * Migration: Create database indexes for optimal query performance
 * Date: 2025-01-28
 */

async function createAuthServiceIndexes() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    const db = client.db("auth-service");

    // Users collection indexes
    const usersCollection = db.collection("users");

    // Index on email for login queries
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, sparse: true },
    );

    // Index on role for RBAC queries
    await usersCollection.createIndex({ role: 1 });

    // Index on createdAt for user listing and analytics
    await usersCollection.createIndex({ createdAt: -1 });

    // Compound index for finding active users by role
    await usersCollection.createIndex({
      isActive: 1,
      role: 1,
    });

    console.log("✓ Auth Service indexes created successfully");
  } finally {
    await client.close();
  }
}

async function createQBankServiceIndexes() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    const db = client.db("qbank-service");

    // Questions collection indexes
    const questionsCollection = db.collection("questions");

    // Index on exam type and subject for filtering
    await questionsCollection.createIndex({
      examTypeId: 1,
      subjectId: 1,
    });

    // Index on difficulty for difficulty-based filtering
    await questionsCollection.createIndex({ difficulty: 1 });

    // Index on tags for tag-based filtering
    await questionsCollection.createIndex({ tags: 1 });

    // Compound index for active questions by exam and difficulty
    await questionsCollection.createIndex({
      isActive: 1,
      examTypeId: 1,
      difficulty: 1,
    });

    // Index on Bloom's level for educational taxonomy
    await questionsCollection.createIndex({ bloomLevel: 1 });

    // Index on creation date for newly added questions
    await questionsCollection.createIndex({ createdAt: -1 });

    // TTL index for marking questions for review (expires after 90 days)
    await questionsCollection.createIndex(
      { reviewScheduledAt: 1 },
      { expireAfterSeconds: 7776000, sparse: true },
    );

    // Exam types collection indexes
    const examTypesCollection = db.collection("exam_types");
    await examTypesCollection.createIndex({ name: 1 }, { unique: true });

    console.log("✓ QBank Service indexes created successfully");
  } finally {
    await client.close();
  }
}

async function createTestEngineServiceIndexes() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    const db = client.db("test-engine-service");

    // Sessions collection indexes
    const sessionsCollection = db.collection("sessions");

    // Index on userId and createdAt for user's session history
    await sessionsCollection.createIndex({
      userId: 1,
      createdAt: -1,
    });

    // Index on status for finding active sessions
    await sessionsCollection.createIndex({ status: 1 });

    // Index on createdAt for pruning old sessions
    await sessionsCollection.createIndex({ createdAt: -1 });

    // Answers collection indexes
    const answersCollection = db.collection("answers");

    // Index for quick access to answers by session
    await answersCollection.createIndex({ sessionId: 1 });

    // Index for answer analytics
    await answersCollection.createIndex({
      sessionId: 1,
      questionId: 1,
    });

    // Flashcards collection indexes
    const flashcardsCollection = db.collection("flashcards");

    // Index for finding user's flashcards due for review
    await flashcardsCollection.createIndex({
      userId: 1,
      nextReviewDate: 1,
    });

    // Index on mastery level for spaced repetition
    await flashcardsCollection.createIndex({ masteryLevel: 1 });

    console.log("✓ Test Engine Service indexes created successfully");
  } finally {
    await client.close();
  }
}

async function createAnalyticsServiceIndexes() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    const db = client.db("analytics-service");

    // Performance data collection indexes
    const performanceCollection = db.collection("performance_data");

    // Index for quick user analytics lookup
    await performanceCollection.createIndex({
      userId: 1,
      date: -1,
    });

    // Index on timestamp for time-based queries
    await performanceCollection.createIndex({ timestamp: -1 });

    // Subject performance indexes
    const subjectPerfCollection = db.collection("subject_performance");

    // Index for user's subject-wise performance
    await subjectPerfCollection.createIndex({
      userId: 1,
      subjectId: 1,
    });

    // TTL index for automatic cleanup of old performance data (2 years)
    await performanceCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 63072000 },
    );

    console.log("✓ Analytics Service indexes created successfully");
  } finally {
    await client.close();
  }
}

async function createPaymentServiceIndexes() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017",
  );

  try {
    await client.connect();
    const db = client.db("payment-service");

    // Subscriptions collection indexes
    const subscriptionsCollection = db.collection("subscriptions");

    // Index for user subscriptions
    await subscriptionsCollection.createIndex({
      userId: 1,
      status: 1,
    });

    // Index on expiry date for renewal notifications
    await subscriptionsCollection.createIndex({ expiryDate: 1 });

    // Invoices collection indexes
    const invoicesCollection = db.collection("invoices");

    // Index for user's invoice history
    await invoicesCollection.createIndex({
      userId: 1,
      createdAt: -1,
    });

    // Index on status for payment tracking
    await invoicesCollection.createIndex({ status: 1 });

    // Billing history indexes
    const billingCollection = db.collection("billing_history");

    // Index for user transaction history
    await billingCollection.createIndex({
      userId: 1,
      transactionDate: -1,
    });

    // Stripe events collection
    const eventsCollection = db.collection("stripe_events");

    // Index for webhook processing
    await eventsCollection.createIndex({ eventId: 1 }, { unique: true });

    // Index for processing failures
    await eventsCollection.createIndex({ status: 1 });

    console.log("✓ Payment Service indexes created successfully");
  } finally {
    await client.close();
  }
}

/**
 * Run all migrations
 */
export async function runMigrations() {
  try {
    console.log("Starting database migrations...\n");

    await createAuthServiceIndexes();
    await createQBankServiceIndexes();
    await createTestEngineServiceIndexes();
    await createAnalyticsServiceIndexes();
    await createPaymentServiceIndexes();

    console.log("\n✓ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}
