/**
 * Email Service
 * Location: services/payment-service/src/services/emailService.ts
 *
 * Handles sending transactional emails for payment events
 */

import logger from "../utils/logger";

export interface SubscriptionConfirmationParams {
  email: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  features?: string[];
}

export interface PaymentReceiptParams {
  email: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  pdfUrl?: string;
}

export interface PaymentFailedParams {
  email: string;
  invoiceAmount: number;
  currency: string;
  retryDate: Date;
}

export interface CancellationConfirmationParams {
  email: string;
  planName: string;
  canceledAt: Date;
}

export interface TrialEndingParams {
  email: string;
  trialEndDate: Date;
  planName: string;
}

class EmailService {
  private emailProvider = process.env.EMAIL_PROVIDER || "sendgrid";
  private senderEmail = process.env.SENDER_EMAIL || "noreply@eduprep.com";

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(params: SubscriptionConfirmationParams) {
    try {
      const html = this.generateSubscriptionConfirmationHtml(params);

      await this.sendEmail({
        to: params.email,
        subject: `Welcome to EduPrep ${params.planName} Plan!`,
        html,
      });

      logger.info("Subscription confirmation email sent", {
        email: params.email,
      });
    } catch (error) {
      logger.error("Failed to send subscription confirmation email", error);
    }
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(params: PaymentReceiptParams) {
    try {
      const html = this.generatePaymentReceiptHtml(params);

      await this.sendEmail({
        to: params.email,
        subject: `Payment Receipt - Invoice #${params.invoiceNumber}`,
        html,
      });

      logger.info("Payment receipt email sent", { email: params.email });
    } catch (error) {
      logger.error("Failed to send payment receipt email", error);
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(params: PaymentFailedParams) {
    try {
      const html = this.generatePaymentFailedHtml(params);

      await this.sendEmail({
        to: params.email,
        subject: "Payment Failed - Action Required",
        html,
      });

      logger.info("Payment failed notification email sent", {
        email: params.email,
      });
    } catch (error) {
      logger.error("Failed to send payment failed notification", error);
    }
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(params: CancellationConfirmationParams) {
    try {
      const html = this.generateCancellationHtml(params);

      await this.sendEmail({
        to: params.email,
        subject: "Your EduPrep Subscription Has Been Canceled",
        html,
      });

      logger.info("Cancellation confirmation email sent", {
        email: params.email,
      });
    } catch (error) {
      logger.error("Failed to send cancellation confirmation email", error);
    }
  }

  /**
   * Send trial ending notification
   */
  async sendTrialEndingNotification(params: TrialEndingParams) {
    try {
      const html = this.generateTrialEndingHtml(params);

      await this.sendEmail({
        to: params.email,
        subject: "Your EduPrep Trial is Ending Soon",
        html,
      });

      logger.info("Trial ending notification email sent", {
        email: params.email,
      });
    } catch (error) {
      logger.error("Failed to send trial ending notification", error);
    }
  }

  /**
   * Generic email sender (mock implementation)
   * In production, integrate with SendGrid, AWS SES, or your email provider
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    if (this.emailProvider === "sendgrid") {
      // TODO: Implement SendGrid integration
      logger.debug("Sending email via SendGrid (mock)", {
        to: params.to,
        subject: params.subject,
      });
    } else if (this.emailProvider === "aws_ses") {
      // TODO: Implement AWS SES integration
      logger.debug("Sending email via AWS SES (mock)", {
        to: params.to,
        subject: params.subject,
      });
    } else {
      // Mock implementation - just log
      logger.info("Email sent (mock)", {
        to: params.to,
        subject: params.subject,
      });
    }
  }

  /**
   * Generate HTML for subscription confirmation email
   */
  private generateSubscriptionConfirmationHtml(
    params: SubscriptionConfirmationParams,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .features { list-style: none; padding: 0; margin: 20px 0; }
            .features li { padding: 10px 0; border-bottom: 1px solid #eee; }
            .features li:before { content: "✓ "; color: #667eea; font-weight: bold; margin-right: 10px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EduPrep!</h1>
              <p>Your ${params.planName} subscription is now active</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Thank you for upgrading to the <strong>${params.planName}</strong> plan! Your subscription is now active and you have access to all premium features.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p><strong>Subscription Details:</strong></p>
                <p>Plan: ${params.planName}</p>
                <p>Start Date: ${params.startDate.toLocaleDateString()}</p>
                <p>Next Billing Date: ${params.endDate.toLocaleDateString()}</p>
              </div>

              <p>You can now:</p>
              <ul class="features">
                <li>Access all premium content</li>
                <li>Download resources for offline learning</li>
                <li>Get priority support</li>
                <li>Track your detailed progress</li>
              </ul>

              <a href="${process.env.APP_URL || "https://eduprep.com"}/dashboard" class="btn">Go to Dashboard</a>

              <p style="margin-top: 30px;">If you have any questions, please contact our support team at support@eduprep.com</p>

              <div class="footer">
                <p>&copy; 2026 EduPrep. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for payment receipt email
   */
  private generatePaymentReceiptHtml(params: PaymentReceiptParams): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f9f9f9; padding: 20px; text-align: center; border-bottom: 2px solid #667eea; }
            .content { padding: 30px; }
            .receipt-details { background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Invoice #${params.invoiceNumber}</p>
            </div>
            <div class="content">
              <p>Thank you for your payment!</p>
              
              <div class="receipt-details">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <strong>Amount Paid:</strong>
                  <span class="amount">${params.currency} ${params.amount.toFixed(2)}</span>
                </div>
                <div style="border-top: 1px solid #ddd; padding-top: 15px;">
                  <p><strong>Invoice #:</strong> ${params.invoiceNumber}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span style="color: green;">✓ Paid</span></p>
                </div>
              </div>

              ${params.pdfUrl ? `<p><a href="${params.pdfUrl}" style="color: #667eea; text-decoration: none;">Download Full Invoice (PDF)</a></p>` : ""}

              <p>If you have any questions about this invoice, please contact our billing team at billing@eduprep.com</p>

              <div class="footer">
                <p>&copy; 2026 EduPrep. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for payment failed email
   */
  private generatePaymentFailedHtml(params: PaymentFailedParams): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .btn { display: inline-block; background: #ffc107; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Payment Failed - Action Required</h1>
            
            <div class="warning">
              <p><strong>⚠️ Your recent payment could not be processed</strong></p>
              <p>Amount: <strong>${params.currency} ${params.invoiceAmount.toFixed(2)}</strong></p>
            </div>

            <p>The payment method on file for your subscription failed. To keep your subscription active, please update your payment method.</p>

            <p><strong>What happens next:</strong></p>
            <ul>
              <li>We'll automatically retry your payment on ${params.retryDate.toLocaleDateString()}</li>
              <li>Your access may be limited until payment is successful</li>
              <li>If payment continues to fail, your subscription may be canceled</li>
            </ul>

            <a href="${process.env.APP_URL || "https://eduprep.com"}/billing" class="btn">Update Payment Method</a>

            <p style="margin-top: 30px;">Questions? Contact our support team at support@eduprep.com</p>

            <div class="footer">
              <p>&copy; 2026 EduPrep. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for cancellation confirmation email
   */
  private generateCancellationHtml(
    params: CancellationConfirmationParams,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { padding: 20px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Subscription Canceled</h1>
            <div class="content">
              <p>Your ${params.planName} subscription has been successfully canceled.</p>
              
              <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p><strong>Cancellation Date:</strong> ${params.canceledAt.toLocaleDateString()}</p>
              </div>

              <p>You'll retain access to your account and content until your current billing period ends. After that, your access will be downgraded to the free plan.</p>

              <p>We'd love to have you back! If you'd like to reactivate your subscription or have feedback about your experience, please let us know at support@eduprep.com</p>

              <a href="${process.env.APP_URL || "https://eduprep.com"}/pricing" class="btn">View Plans</a>

              <div class="footer">
                <p>&copy; 2026 EduPrep. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for trial ending notification
   */
  private generateTrialEndingHtml(params: TrialEndingParams): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .banner { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0; }
            .content { padding: 20px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Your Trial is Ending Soon!</h1>
            <div class="banner">
              <p>Your ${params.planName} trial ends on ${params.trialEndDate.toLocaleDateString()}</p>
            </div>
            
            <div class="content">
              <p>We hope you've enjoyed exploring EduPrep with your free trial! To continue with uninterrupted access, your subscription will automatically convert to a paid plan unless you cancel.</p>

              <p><strong>What you'll get after trial:</strong></p>
              <ul>
                <li>Full access to all ${params.planName} features</li>
                <li>Download resources for offline learning</li>
                <li>Priority support</li>
                <li>Detailed progress analytics</li>
              </ul>

              <p>If you'd like to upgrade to a higher plan or have any questions, just let us know!</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL || "https://eduprep.com"}/pricing" class="btn">View Plans</a>
              </div>

              <p style="color: #999; font-size: 14px;">Questions? Contact us at support@eduprep.com or reply to this email.</p>

              <div class="footer">
                <p>&copy; 2026 EduPrep. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService();
