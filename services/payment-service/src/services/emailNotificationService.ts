/**
 * Email Notification Service for Payment Events
 *
 * Sends transactional emails for:
 * - Subscription confirmations
 * - Payment receipts
 * - Failed payment notifications
 * - Renewal reminders
 * - Cancellation confirmations
 * - Refund notices
 */

import nodemailer from "nodemailer";
import { IUser } from "../models/User";
import { ISubscription, IInvoice } from "../models/Payment";

interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const config: EmailConfig = {
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "",
      },
    };

    this.fromEmail = process.env.FROM_EMAIL || config.auth.user;
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(
    user: IUser,
    subscription: ISubscription,
    tierName: string,
  ): Promise<void> {
    const trialEndDate = subscription.trialEnd
      ? new Date(subscription.trialEnd).toLocaleDateString()
      : null;

    const html = `
      <h2>Welcome to EduPrep ${tierName} Plan!</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Your subscription has been activated successfully.</p>
      
      <h3>Subscription Details:</h3>
      <ul>
        <li><strong>Plan:</strong> ${tierName}</li>
        <li><strong>Status:</strong> ${subscription.status}</li>
        <li><strong>Next Billing Date:</strong> ${new Date(
          subscription.currentPeriodEnd,
        ).toLocaleDateString()}</li>
        ${
          trialEndDate
            ? `<li><strong>Trial Period Ends:</strong> ${trialEndDate}</li>`
            : ""
        }
      </ul>

      <p>You can manage your subscription anytime from your account settings.</p>

      <a href="${process.env.APP_URL}/subscription" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2196F3;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      ">Manage Subscription</a>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        If you have any questions, please contact support@eduprep.com
      </p>
    `;

    await this.sendEmail(user.email, "Welcome to EduPrep Premium!", html);
  }

  /**
   * Send invoice/receipt email
   */
  async sendInvoiceReceipt(
    user: IUser,
    invoice: IInvoice,
    tierName: string,
    amount: number,
  ): Promise<void> {
    const invoiceNumber = invoice.stripeInvoiceId?.slice(-8) || "N/A";
    const periodStart = new Date(invoice.period.start).toLocaleDateString();
    const periodEnd = new Date(invoice.period.end).toLocaleDateString();

    const html = `
      <h2>Payment Receipt - Invoice #${invoiceNumber}</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Thank you for your payment. Here's your invoice receipt.</p>

      <h3>Invoice Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Invoice Number:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            #${invoiceNumber}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Plan:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            ${tierName}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Billing Period:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            ${periodStart} to ${periodEnd}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <strong>Amount:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            $${amount.toFixed(2)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px;">
            <strong>Status:</strong>
          </td>
          <td style="padding: 8px;">
            <span style="color: #4CAF50; font-weight: bold;">Paid</span>
          </td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${invoice.hostedInvoiceUrl || `${process.env.APP_URL}/invoices`}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        ">View Invoice</a>
      </p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Thank you for supporting EduPrep. Questions? Contact support@eduprep.com
      </p>
    `;

    await this.sendEmail(
      user.email,
      `Receipt for Invoice #${invoiceNumber}`,
      html,
    );
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotice(
    user: IUser,
    amount: number,
    reason: string,
    retryDate: Date,
  ): Promise<void> {
    const retryDateStr = retryDate.toLocaleDateString();

    const html = `
      <h2>Payment Failed - Action Required</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Unfortunately, we couldn't process your latest payment.</p>

      <h3>Payment Details:</h3>
      <ul>
        <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
        <li><strong>Reason:</strong> ${reason}</li>
        <li><strong>Retry Date:</strong> ${retryDateStr}</li>
      </ul>

      <p>We'll automatically retry this payment. If you'd prefer to resolve this now:</p>

      <a href="${process.env.APP_URL}/subscription" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #FF9800;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      ">Update Payment Method</a>

      <p><strong>Without payment, your subscription access may be limited.</strong></p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Need help? Contact support@eduprep.com or reply to this email.
      </p>
    `;

    await this.sendEmail(
      user.email,
      "Payment Failed - Please Update Your Payment Method",
      html,
    );
  }

  /**
   * Send renewal reminder email
   */
  async sendRenewalReminder(
    user: IUser,
    amount: number,
    renewalDate: Date,
    tierName: string,
  ): Promise<void> {
    const renewalDateStr = renewalDate.toLocaleDateString();

    const html = `
      <h2>Your Subscription Renews Soon</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Your ${tierName} subscription will renew in 7 days.</p>

      <h3>Renewal Details:</h3>
      <ul>
        <li><strong>Plan:</strong> ${tierName}</li>
        <li><strong>Renewal Date:</strong> ${renewalDateStr}</li>
        <li><strong>Amount to Charge:</strong> $${amount.toFixed(2)}</li>
      </ul>

      <p>Your subscription will automatically renew on the date above using your saved payment method.</p>

      <p>
        <a href="${process.env.APP_URL}/subscription" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        ">Manage Your Subscription</a>
      </p>

      <p>To cancel or change your plan, visit your subscription settings before the renewal date.</p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Questions? Contact support@eduprep.com
      </p>
    `;

    await this.sendEmail(
      user.email,
      `Your ${tierName} subscription renews on ${renewalDateStr}`,
      html,
    );
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(
    user: IUser,
    tierName: string,
    cancelDate: Date,
    immediate: boolean,
  ): Promise<void> {
    const cancelDateStr = cancelDate.toLocaleDateString();

    const html = `
      <h2>Subscription Canceled</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Your ${tierName} subscription has been successfully canceled.</p>

      <h3>Cancellation Details:</h3>
      <ul>
        <li><strong>Plan:</strong> ${tierName}</li>
        <li><strong>Cancellation Type:</strong> ${immediate ? "Immediate" : "At Period End"}</li>
        <li><strong>Effective Date:</strong> ${cancelDateStr}</li>
      </ul>

      ${
        !immediate
          ? `<p>You'll retain access to premium features until your billing period ends on ${cancelDateStr}.</p>`
          : `<p>Your access to premium features has been revoked. You can still access the free tier.</p>`
      }

      <p>We'd love to have you back! If you change your mind, you can reactivate your subscription anytime from your account settings.</p>

      <a href="${process.env.APP_URL}/subscription" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      ">Reactivate Subscription</a>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        We're sorry to see you go. If you have feedback, please let us know: feedback@eduprep.com
      </p>
    `;

    await this.sendEmail(
      user.email,
      "Your Subscription Has Been Canceled",
      html,
    );
  }

  /**
   * Send plan upgrade confirmation
   */
  async sendUpgradeConfirmation(
    user: IUser,
    oldTier: string,
    newTier: string,
    proration: number,
  ): Promise<void> {
    const html = `
      <h2>Subscription Upgraded!</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>Your subscription has been successfully upgraded.</p>

      <h3>Upgrade Details:</h3>
      <ul>
        <li><strong>Previous Plan:</strong> ${oldTier}</li>
        <li><strong>New Plan:</strong> ${newTier}</li>
        ${
          proration !== 0
            ? `<li><strong>Prorated Charge:</strong> $${proration.toFixed(2)}</li>`
            : `<li><strong>Charge:</strong> None - Credit applied</li>`
        }
      </ul>

      <p>You'll now have access to all premium features included with your new plan.</p>

      <a href="${process.env.APP_URL}/subscription" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #2196F3;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      ">View Subscription</a>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Thank you for upgrading to EduPrep premium. Questions? Contact support@eduprep.com
      </p>
    `;

    await this.sendEmail(
      user.email,
      `Subscription Upgraded to ${newTier}`,
      html,
    );
  }

  /**
   * Send refund notification
   */
  async sendRefundNotice(
    user: IUser,
    amount: number,
    reason: string,
    refundDate: Date,
  ): Promise<void> {
    const refundDateStr = refundDate.toLocaleDateString();

    const html = `
      <h2>Refund Processed</h2>
      <p>Hello ${user.name || user.email},</p>
      <p>A refund has been processed for your EduPrep account.</p>

      <h3>Refund Details:</h3>
      <ul>
        <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
        <li><strong>Reason:</strong> ${reason}</li>
        <li><strong>Refund Date:</strong> ${refundDateStr}</li>
      </ul>

      <p>The refund will appear in your account within 3-5 business days.</p>

      <p>If you have any questions about this refund, please contact us.</p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Questions? Contact support@eduprep.com
      </p>
    `;

    await this.sendEmail(user.email, "Refund Processed", html);
  }

  /**
   * Send generic transactional email
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `EduPrep <${this.fromEmail}>`,
        to,
        subject,
        html,
        replyTo: "support@eduprep.com",
      });

      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      // Log error but don't throw - email failures shouldn't break the flow
    }
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connected successfully");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();

export default EmailNotificationService;
