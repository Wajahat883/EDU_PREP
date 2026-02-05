/**
 * Payment Retry Scheduler Service
 *
 * Automatically retries failed payments with:
 * - Exponential backoff strategy
 * - Configurable retry attempts (default 3)
 * - Email notifications on failures
 * - Database tracking of retry attempts
 * - Scheduled job processing
 */

import cron from "node-cron";
import { PaymentFailure } from "../models/Payment";
import { User } from "../models/User";
import { SubscriptionManager } from "./subscriptionManager";
import { emailNotificationService } from "./emailNotificationService";

interface RetrySchedule {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayHours: number;
}

class PaymentRetryScheduler {
  private retrySchedule: RetrySchedule = {
    maxAttempts: 3,
    backoffMultiplier: 2, // 1 hour -> 2 hours -> 4 hours
    initialDelayHours: 1,
  };

  private subscriptionManager: SubscriptionManager;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.subscriptionManager = new SubscriptionManager();
  }

  /**
   * Start the retry scheduler (runs every hour)
   */
  startScheduler(): void {
    if (this.cronJob) {
      console.log("Retry scheduler already running");
      return;
    }

    // Run every hour at minute 0
    this.cronJob = cron.schedule("0 * * * *", async () => {
      console.log("[PaymentRetryScheduler] Running scheduled retry check...");
      await this.processRetries();
    });

    console.log("Payment retry scheduler started (runs hourly)");
  }

  /**
   * Stop the retry scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("Payment retry scheduler stopped");
    }
  }

  /**
   * Process due payment retries
   */
  async processRetries(): Promise<void> {
    try {
      // Find all failures due for retry
      const now = new Date();
      const dueFailures = await PaymentFailure.find({
        nextRetryDate: { $lte: now },
        retryCount: { $lt: this.retrySchedule.maxAttempts },
        resolvedAt: null,
      }).populate("userId");

      console.log(
        `[PaymentRetryScheduler] Found ${dueFailures.length} payments due for retry`,
      );

      for (const failure of dueFailures) {
        await this.retryPayment(failure);
      }
    } catch (error) {
      console.error("[PaymentRetryScheduler] Error processing retries:", error);
    }
  }

  /**
   * Retry a specific failed payment
   */
  private async retryPayment(failure: any): Promise<void> {
    try {
      const user = failure.userId;
      const invoiceId = failure.stripeInvoiceId;

      console.log(
        `[PaymentRetryScheduler] Retrying payment for user ${user._id}, invoice ${invoiceId}`,
      );

      // Attempt to retry the payment
      await this.subscriptionManager.retryFailedPayment(invoiceId);

      // Update failure record
      failure.retryCount += 1;
      failure.lastRetryDate = new Date();

      // Calculate next retry time
      const delayHours =
        Math.pow(this.retrySchedule.backoffMultiplier, failure.retryCount) *
        this.retrySchedule.initialDelayHours;

      failure.nextRetryDate = new Date(
        Date.now() + delayHours * 60 * 60 * 1000,
      );

      await failure.save();

      console.log(
        `[PaymentRetryScheduler] Payment retry #${failure.retryCount} scheduled for ${failure.nextRetryDate}`,
      );

      // Send retry notification to user
      await this.sendRetryNotification(
        user,
        failure.amount,
        failure.retryCount,
        failure.nextRetryDate,
      );
    } catch (error: any) {
      console.error("[PaymentRetryScheduler] Retry failed:", error);

      // Update failure record with error
      failure.retryCount += 1;
      failure.failureReason = error.message || "Retry attempt failed";
      failure.lastRetryDate = new Date();

      // Check if we've exceeded max retries
      if (failure.retryCount >= this.retrySchedule.maxAttempts) {
        console.log(
          `[PaymentRetryScheduler] Max retries exceeded for invoice ${failure.stripeInvoiceId}`,
        );

        // Mark as unresolved with final status
        failure.resolutionMethod = "failed_max_retries";
        failure.failureReason = "Maximum retry attempts exceeded";

        // Send final failure notification
        const user = await User.findById(failure.userId);
        if (user) {
          await this.sendFinalFailureNotification(
            user,
            failure.amount,
            failure.failureReason,
          );
        }
      } else {
        // Schedule next retry
        const delayHours =
          Math.pow(this.retrySchedule.backoffMultiplier, failure.retryCount) *
          this.retrySchedule.initialDelayHours;

        failure.nextRetryDate = new Date(
          Date.now() + delayHours * 60 * 60 * 1000,
        );
      }

      await failure.save();
    }
  }

  /**
   * Mark payment as successful after retry
   */
  async markPaymentSuccessful(invoiceId: string): Promise<void> {
    try {
      const failure = await PaymentFailure.findOne({
        stripeInvoiceId: invoiceId,
        resolvedAt: null,
      });

      if (failure) {
        failure.resolvedAt = new Date();
        failure.resolutionMethod = "paid";
        await failure.save();

        console.log(
          `[PaymentRetryScheduler] Payment ${invoiceId} marked as successful`,
        );

        // Send success notification
        const user = await User.findById(failure.userId);
        if (user) {
          await this.sendRetrySuccessNotification(user, failure.amount);
        }
      }
    } catch (error) {
      console.error(
        "[PaymentRetryScheduler] Error marking payment successful:",
        error,
      );
    }
  }

  /**
   * Get retry status for a specific failure
   */
  async getRetryStatus(invoiceId: string): Promise<any> {
    try {
      const failure = await PaymentFailure.findOne({
        stripeInvoiceId: invoiceId,
      });

      if (!failure) {
        return null;
      }

      return {
        invoiceId,
        status: failure.resolvedAt ? failure.resolutionMethod : "pending",
        retryCount: failure.retryCount,
        maxRetries: this.retrySchedule.maxAttempts,
        nextRetryDate: failure.nextRetryDate,
        lastRetryDate: failure.lastRetryDate,
        failureReason: failure.failureReason,
      };
    } catch (error) {
      console.error(
        "[PaymentRetryScheduler] Error getting retry status:",
        error,
      );
      return null;
    }
  }

  /**
   * Get all pending retries
   */
  async getPendingRetries(): Promise<any[]> {
    try {
      const failures = await PaymentFailure.find({
        resolvedAt: null,
        retryCount: { $lt: this.retrySchedule.maxAttempts },
      })
        .populate("userId", "email")
        .lean();

      return failures.map((f) => ({
        invoiceId: f.stripeInvoiceId,
        userId: f.userId._id,
        userEmail: f.userId.email,
        amount: f.amount,
        retryCount: f.retryCount,
        nextRetryDate: f.nextRetryDate,
        failureReason: f.failureReason,
      }));
    } catch (error) {
      console.error(
        "[PaymentRetryScheduler] Error getting pending retries:",
        error,
      );
      return [];
    }
  }

  /**
   * Manual trigger for retry process (admin/testing)
   */
  async manualRetryTrigger(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      console.log("[PaymentRetryScheduler] Manual retry trigger initiated");

      const now = new Date();
      const dueFailures = await PaymentFailure.find({
        nextRetryDate: { $lte: now },
        retryCount: { $lt: this.retrySchedule.maxAttempts },
        resolvedAt: null,
      });

      let successful = 0;
      let failed = 0;

      for (const failure of dueFailures) {
        try {
          await this.retryPayment(failure);
          successful++;
        } catch (error) {
          failed++;
          console.error("Retry failed:", error);
        }
      }

      return {
        processed: dueFailures.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error(
        "[PaymentRetryScheduler] Manual retry trigger failed:",
        error,
      );
      return {
        processed: 0,
        successful: 0,
        failed: 0,
      };
    }
  }

  /**
   * Send retry notification email
   */
  private async sendRetryNotification(
    user: any,
    amount: number,
    attemptNumber: number,
    nextRetryDate: Date,
  ): Promise<void> {
    try {
      const html = `
        <h2>Payment Retry Attempt #${attemptNumber}</h2>
        <p>Hello ${user.name || user.email},</p>
        <p>We're retrying your payment of $${amount.toFixed(2)}.</p>

        <h3>Retry Details:</h3>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Attempt:</strong> ${attemptNumber} of ${this.retrySchedule.maxAttempts}</li>
          <li><strong>Next Retry:</strong> ${nextRetryDate.toLocaleDateString()}</li>
        </ul>

        <p>We'll continue attempting to charge your payment method until it succeeds or reaches the maximum retry limit.</p>

        <p>To update your payment method now and expedite this process:</p>
        <a href="${process.env.APP_URL}/subscription" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #FF9800;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        ">Update Payment Method</a>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Questions? Contact support@eduprep.com
        </p>
      `;

      await emailNotificationService["sendEmail"](
        user.email,
        `Payment Retry Attempt #${attemptNumber}`,
        html,
      );
    } catch (error) {
      console.error("Failed to send retry notification:", error);
    }
  }

  /**
   * Send final failure notification
   */
  private async sendFinalFailureNotification(
    user: any,
    amount: number,
    reason: string,
  ): Promise<void> {
    try {
      const html = `
        <h2>Payment Failed - Subscription May Be At Risk</h2>
        <p>Hello ${user.name || user.email},</p>
        <p>We've exhausted all retry attempts for your payment.</p>

        <h3>Final Attempt Details:</h3>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Reason:</strong> ${reason}</li>
          <li><strong>Attempts:</strong> ${this.retrySchedule.maxAttempts} of ${this.retrySchedule.maxAttempts}</li>
        </ul>

        <p><strong style="color: red;">Your subscription access may be limited or suspended until this is resolved.</strong></p>

        <p>Please update your payment method immediately to restore full access:</p>
        <a href="${process.env.APP_URL}/subscription" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #F44336;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        ">Update Payment Method Now</a>

        <p>If you continue to have payment issues, please contact our support team.</p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Contact us: support@eduprep.com or reply to this email
        </p>
      `;

      await emailNotificationService["sendEmail"](
        user.email,
        "Payment Failed - Action Required",
        html,
      );
    } catch (error) {
      console.error("Failed to send final failure notification:", error);
    }
  }

  /**
   * Send retry success notification
   */
  private async sendRetrySuccessNotification(
    user: any,
    amount: number,
  ): Promise<void> {
    try {
      const html = `
        <h2>Payment Successful!</h2>
        <p>Hello ${user.name || user.email},</p>
        <p>Great news! Your payment has been processed successfully.</p>

        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Paid</span></li>
          <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>

        <p>Your subscription is now active and you have full access to all premium features.</p>

        <p>Thank you for your business!</p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Questions? Contact support@eduprep.com
        </p>
      `;

      await emailNotificationService["sendEmail"](
        user.email,
        "Payment Successful",
        html,
      );
    } catch (error) {
      console.error("Failed to send success notification:", error);
    }
  }

  /**
   * Update retry schedule (admin)
   */
  updateRetrySchedule(schedule: Partial<RetrySchedule>): void {
    this.retrySchedule = {
      ...this.retrySchedule,
      ...schedule,
    };
    console.log(
      "[PaymentRetryScheduler] Retry schedule updated:",
      this.retrySchedule,
    );
  }

  /**
   * Get current retry schedule
   */
  getRetrySchedule(): RetrySchedule {
    return { ...this.retrySchedule };
  }
}

// Export singleton instance
export const paymentRetryScheduler = new PaymentRetryScheduler();

export default PaymentRetryScheduler;
