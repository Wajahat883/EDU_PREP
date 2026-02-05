/**
 * Email Notifications Service
 * Location: services/notification-service/src/services/email.service.ts
 *
 * Handles sending all application emails via SendGrid with 9 email templates:
 * 1. Welcome/Verification
 * 2. Password Reset
 * 3. Subscription Confirmation
 * 4. Plan Change
 * 5. Payment Failed
 * 6. Invoice Created
 * 7. Payment Successful
 * 8. Refund Notification
 * 9. Study Streak/Achievement
 */

import sgMail from "@sendgrid/mail";
import { render } from "@react-email/render";
import logger from "../utils/logger";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

/**
 * Email template definitions
 */
interface EmailTemplate {
  name: string;
  subject: (data: any) => string;
  component: (data: any) => string;
}

/**
 * Template 1: Welcome & Account Verification
 */
const WelcomeTemplate: EmailTemplate = {
  name: "welcome",
  subject: (data) => "Welcome to EduPrep!",
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Welcome to EduPrep, ${data.name}!</h1>
        <p>Thank you for joining EduPrep. We're excited to help you ace your medical exams.</p>
        <p>
          <a href="${data.verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Verify Your Email
          </a>
        </p>
        <p>This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          If you didn't create this account, please ignore this email.
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 2: Password Reset
 */
const PasswordResetTemplate: EmailTemplate = {
  name: "password-reset",
  subject: (data) => "Reset Your EduPrep Password",
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Reset Your Password</h1>
        <p>We received a request to reset your password. Click the button below:</p>
        <p>
          <a href="${data.resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px;">Link expires in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 3: Subscription Confirmation
 */
const SubscriptionConfirmationTemplate: EmailTemplate = {
  name: "subscription-confirmation",
  subject: (data) => `Welcome to ${data.planName}!`,
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Subscription Confirmed!</h1>
        <p>Your subscription to the <strong>${data.planName}</strong> plan is now active.</p>
        
        <h2>Plan Details:</h2>
        <ul>
          <li><strong>Plan:</strong> ${data.planName}</li>
          <li><strong>Price:</strong> $${data.price}/month</li>
          <li><strong>Renewal:</strong> ${data.renewalDate}</li>
          <li><strong>Auto-renewal:</strong> Enabled</li>
        </ul>
        
        <h2>Your Benefits:</h2>
        <ul>
          ${data.features.map((feature) => `<li>${feature}</li>`).join("")}
        </ul>
        
        <p>
          <a href="${data.dashboardLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Start Learning Now
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          <a href="${data.manageSubscriptionLink}" style="color: #2563eb; text-decoration: none;">Manage Subscription</a>
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 4: Plan Change Notification
 */
const PlanChangeTemplate: EmailTemplate = {
  name: "plan-change",
  subject: (data) => `Your Plan Has Been Updated`,
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Plan Updated Successfully</h1>
        <p>Your subscription plan has been changed.</p>
        
        <h2>Change Details:</h2>
        <p><strong>From:</strong> ${data.oldPlan}</p>
        <p><strong>To:</strong> ${data.newPlan}</p>
        <p><strong>Effective:</strong> ${data.effectiveDate}</p>
        
        <p style="color: #16a34a; font-weight: bold;">
          ${data.creditMessage}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          <a href="${data.contactLink}" style="color: #2563eb; text-decoration: none;">Contact Support</a> if you have any questions.
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 5: Payment Failed Warning
 */
const PaymentFailedTemplate: EmailTemplate = {
  name: "payment-failed",
  subject: (data) => "Payment Failed - Action Required",
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #dc2626;">Payment Failed</h1>
        <p>We couldn't process your payment for your subscription renewal.</p>
        
        <p><strong>Error:</strong> ${data.failureReason}</p>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p><strong>Invoice:</strong> ${data.invoiceId}</p>
        
        <p style="color: #dc2626; font-weight: bold;">
          Please update your payment method within 3 days to avoid service interruption.
        </p>
        
        <p>
          <a href="${data.updatePaymentLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Update Payment Method
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px;">
          Next retry attempt: ${data.nextRetryDate}
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 6: Invoice Created/Available
 */
const InvoiceCreatedTemplate: EmailTemplate = {
  name: "invoice-created",
  subject: (data) => `Invoice #${data.invoiceNumber} - ${data.amount}`,
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">Your Invoice is Ready</h1>
        <p>Your invoice for ${data.billingPeriod} is now available.</p>
        
        <h2>Invoice Details:</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Invoice #:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Period:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.billingPeriod}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px;">
          <a href="${data.downloadLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Download PDF
          </a>
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 7: Payment Successful Receipt
 */
const PaymentSuccessfulTemplate: EmailTemplate = {
  name: "payment-successful",
  subject: (data) => "Payment Received - Receipt",
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #16a34a;">Payment Received</h1>
        <p>Thank you! Your payment has been successfully processed.</p>
        
        <h2>Receipt:</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Transaction ID:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Subscription:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.subscriptionPlan}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; color: #16a34a; font-weight: bold;">
          Your subscription is active and renewed through ${data.renewalDate}.
        </p>
      </body>
    </html>
  `,
};

/**
 * Template 8: Refund Notification
 */
const RefundNotificationTemplate: EmailTemplate = {
  name: "refund-notification",
  subject: (data) => "Refund Processed - $${data.amount}",
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #16a34a;">Refund Processed</h1>
        <p>Your refund has been successfully processed.</p>
        
        <h2>Refund Details:</h2>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p><strong>Type:</strong> ${data.type === "full" ? "Full Refund" : "Partial Refund"}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Processing Time:</strong> 3-5 business days</p>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          The refund will be credited to your original payment method.
        </p>
        
        ${
          data.subscriptionStatus === "canceled"
            ? `
          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
            Your subscription has been canceled. You will lose access on ${data.accessEndDate}.
          </p>
        `
            : ""
        }
      </body>
    </html>
  `,
};

/**
 * Template 9: Study Streak & Achievements
 */
const AchievementTemplate: EmailTemplate = {
  name: "achievement",
  subject: (data) => `🎉 ${data.achievementName} - Keep It Up!`,
  component: (data) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2563eb;">🎉 Great Work!</h1>
        <p>Congratulations, ${data.name}!</p>
        
        <h2>${data.achievementName}</h2>
        <p>${data.achievementDescription}</p>
        
        <h2>Your Progress:</h2>
        <ul>
          <li><strong>Study Streak:</strong> ${data.streak} days</li>
          <li><strong>Questions Answered:</strong> ${data.questionsAnswered}</li>
          <li><strong>Accuracy:</strong> ${data.accuracy}%</li>
          <li><strong>Rank:</strong> Top ${data.rank}%</li>
        </ul>
        
        <p style="margin-top: 20px;">
          <a href="${data.dashboardLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Your Profile
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          Keep up the excellent work! 💪
        </p>
      </body>
    </html>
  `,
};

/**
 * Email sending service
 */
export class EmailService {
  /**
   * Send email with template
   */
  static async sendEmail(
    to: string,
    templateName: string,
    templateData: any,
    options?: {
      cc?: string[];
      bcc?: string[];
      replyTo?: string;
      scheduledAt?: Date;
    },
  ): Promise<void> {
    try {
      const templates: Record<string, EmailTemplate> = {
        welcome: WelcomeTemplate,
        "password-reset": PasswordResetTemplate,
        "subscription-confirmation": SubscriptionConfirmationTemplate,
        "plan-change": PlanChangeTemplate,
        "payment-failed": PaymentFailedTemplate,
        "invoice-created": InvoiceCreatedTemplate,
        "payment-successful": PaymentSuccessfulTemplate,
        "refund-notification": RefundNotificationTemplate,
        achievement: AchievementTemplate,
      };

      const template = templates[templateName];
      if (!template) {
        throw new Error(`Unknown email template: ${templateName}`);
      }

      const htmlContent = template.component(templateData);
      const subject = template.subject(templateData);

      const msg = {
        to,
        cc: options?.cc || [],
        bcc: options?.bcc || [],
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@eduprep.com",
        subject,
        html: htmlContent,
        replyTo: options?.replyTo,
      };

      // Schedule if needed
      if (options?.scheduledAt && options.scheduledAt > new Date()) {
        (msg as any).send_at = Math.floor(options.scheduledAt.getTime() / 1000);
      }

      await sgMail.send(msg);
      logger.info(`Email sent to ${to} - Template: ${templateName}`);
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send batch emails
   */
  static async sendBatch(
    recipients: Array<{ email: string; templateData: any }>,
    templateName: string,
  ): Promise<void> {
    try {
      const messages = recipients.map(({ email, templateData }) => {
        const templates: Record<string, EmailTemplate> = {
          welcome: WelcomeTemplate,
          "password-reset": PasswordResetTemplate,
          "subscription-confirmation": SubscriptionConfirmationTemplate,
          "plan-change": PlanChangeTemplate,
          "payment-failed": PaymentFailedTemplate,
          "invoice-created": InvoiceCreatedTemplate,
          "payment-successful": PaymentSuccessfulTemplate,
          "refund-notification": RefundNotificationTemplate,
          achievement: AchievementTemplate,
        };

        const template = templates[templateName];
        const htmlContent = template.component(templateData);
        const subject = template.subject(templateData);

        return {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || "noreply@eduprep.com",
          subject,
          html: htmlContent,
        };
      });

      await sgMail.sendMultiple({
        personalizations: messages.map((msg) => ({
          to: [{ email: msg.to }],
          subject: msg.subject,
        })),
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@eduprep.com",
        },
        content: [{ type: "text/html", value: messages[0].html }],
      });

      logger.info(
        `Batch email sent to ${recipients.length} recipients - Template: ${templateName}`,
      );
    } catch (error: any) {
      logger.error(`Failed to send batch email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcome(
    email: string,
    name: string,
    verificationLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "welcome", { name, verificationLink });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    email: string,
    resetLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "password-reset", { resetLink });
  }

  /**
   * Send subscription confirmation
   */
  static async sendSubscriptionConfirmation(
    email: string,
    planName: string,
    price: number,
    renewalDate: string,
    features: string[],
    dashboardLink: string,
    manageSubscriptionLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "subscription-confirmation", {
      planName,
      price,
      renewalDate,
      features,
      dashboardLink,
      manageSubscriptionLink,
    });
  }

  /**
   * Send plan change notification
   */
  static async sendPlanChange(
    email: string,
    oldPlan: string,
    newPlan: string,
    effectiveDate: string,
    creditMessage: string,
    contactLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "plan-change", {
      oldPlan,
      newPlan,
      effectiveDate,
      creditMessage,
      contactLink,
    });
  }

  /**
   * Send payment failed warning
   */
  static async sendPaymentFailed(
    email: string,
    failureReason: string,
    amount: number,
    invoiceId: string,
    updatePaymentLink: string,
    nextRetryDate: string,
  ): Promise<void> {
    await this.sendEmail(email, "payment-failed", {
      failureReason,
      amount,
      invoiceId,
      updatePaymentLink,
      nextRetryDate,
    });
  }

  /**
   * Send invoice notification
   */
  static async sendInvoice(
    email: string,
    invoiceNumber: string,
    amount: number,
    billingPeriod: string,
    status: string,
    downloadLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "invoice-created", {
      invoiceNumber,
      amount,
      billingPeriod,
      status,
      downloadLink,
    });
  }

  /**
   * Send payment success receipt
   */
  static async sendPaymentSuccess(
    email: string,
    amount: number,
    date: string,
    transactionId: string,
    subscriptionPlan: string,
    renewalDate: string,
  ): Promise<void> {
    await this.sendEmail(email, "payment-successful", {
      amount,
      date,
      transactionId,
      subscriptionPlan,
      renewalDate,
    });
  }

  /**
   * Send refund notification
   */
  static async sendRefund(
    email: string,
    amount: number,
    type: "full" | "partial",
    reason: string,
    subscriptionStatus?: string,
    accessEndDate?: string,
  ): Promise<void> {
    await this.sendEmail(email, "refund-notification", {
      amount,
      type,
      reason,
      subscriptionStatus,
      accessEndDate,
    });
  }

  /**
   * Send achievement notification
   */
  static async sendAchievement(
    email: string,
    name: string,
    achievementName: string,
    achievementDescription: string,
    streak: number,
    questionsAnswered: number,
    accuracy: number,
    rank: number,
    dashboardLink: string,
  ): Promise<void> {
    await this.sendEmail(email, "achievement", {
      name,
      achievementName,
      achievementDescription,
      streak,
      questionsAnswered,
      accuracy,
      rank,
      dashboardLink,
    });
  }
}
