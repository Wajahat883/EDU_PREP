import { EventEmitter } from "events";
import admin from "firebase-admin";
import { Platform } from "react-native";
import PushNotification from "react-native-push-notification";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: "high" | "normal" | "low";
}

export interface NotificationRule {
  id: string;
  eventType: string;
  enabled: boolean;
  channels: ("push" | "email" | "in-app")[];
  cooldownMinutes?: number;
}

export class NotificationService extends EventEmitter {
  private firebaseAdmin: admin.app.App;
  private rules: Map<string, NotificationRule> = new Map();
  private lastNotificationTime: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeFirebase();
    this.setupDefaultRules();
  }

  private initializeFirebase(): void {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    this.firebaseAdmin = admin.app();
  }

  private setupDefaultRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        id: "test-started",
        eventType: "test:started",
        enabled: true,
        channels: ["push", "in-app"],
      },
      {
        id: "test-reminder",
        eventType: "test:reminder",
        enabled: true,
        channels: ["push", "email"],
        cooldownMinutes: 60,
      },
      {
        id: "test-results",
        eventType: "test:results",
        enabled: true,
        channels: ["push", "in-app", "email"],
      },
      {
        id: "question-recommended",
        eventType: "question:recommended",
        enabled: true,
        channels: ["in-app"],
        cooldownMinutes: 30,
      },
      {
        id: "achievement-unlocked",
        eventType: "achievement:unlocked",
        enabled: true,
        channels: ["push", "in-app"],
      },
      {
        id: "course-updated",
        eventType: "course:updated",
        enabled: true,
        channels: ["email", "in-app"],
      },
      {
        id: "grade-posted",
        eventType: "grade:posted",
        enabled: true,
        channels: ["push", "email"],
      },
      {
        id: "system-maintenance",
        eventType: "system:maintenance",
        enabled: true,
        channels: ["email", "in-app"],
      },
    ];

    defaultRules.forEach((rule) => {
      this.rules.set(rule.eventType, rule);
    });
  }

  async sendPushNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) return false;

      // Check rate limiting
      if (!this.checkRateLimit(userId, payload.title)) {
        return false;
      }

      const message = {
        data: {
          ...payload.data,
          timestamp: Date.now().toString(),
        },
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: {
          priority: payload.priority || "high",
          notification: {
            sound: payload.sound || "default",
            channelId: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: payload.badge,
              sound: payload.sound || "default",
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: "https://assets.eduprep.com/icon-192.png",
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      console.log(
        `Push notification sent: ${response.successCount} successful`,
      );

      // Update last notification time
      this.updateLastNotificationTime(userId, payload.title);

      this.emit("notification:sent", {
        userId,
        payload,
        successCount: response.successCount,
      });

      return response.successCount > 0;
    } catch (error) {
      console.error("Failed to send push notification:", error);
      return false;
    }
  }

  async sendEmailNotification(
    userId: string,
    subject: string,
    template: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    try {
      // Integration with email service (SendGrid, AWS SES, etc.)
      // This is a placeholder - implement with your email provider
      console.log(`Email notification: ${subject} to user ${userId}`);

      this.emit("email:sent", {
        userId,
        subject,
        template,
      });

      return true;
    } catch (error) {
      console.error("Failed to send email notification:", error);
      return false;
    }
  }

  async saveInAppNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      // Save to database for in-app display
      const notification = {
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        read: false,
        createdAt: new Date(),
      };

      // Would be saved to database here
      console.log(`In-app notification saved: ${JSON.stringify(notification)}`);

      this.emit("in-app:saved", notification);

      return true;
    } catch (error) {
      console.error("Failed to save in-app notification:", error);
      return false;
    }
  }

  async notifyTestStarted(
    userId: string,
    testId: string,
    testTitle: string,
  ): Promise<void> {
    if (!this.isEventEnabled("test:started")) return;

    const payload: NotificationPayload = {
      title: "Test Available",
      body: `${testTitle} is ready. Tap to start.`,
      data: { testId, action: "open_test" },
      priority: "high",
    };

    await this.sendNotification(userId, "test:started", payload);
  }

  async notifyTestReminder(
    userId: string,
    testId: string,
    testTitle: string,
    minutesUntilDeadline: number,
  ): Promise<void> {
    if (!this.isEventEnabled("test:reminder")) return;

    const payload: NotificationPayload = {
      title: "Test Reminder",
      body: `${testTitle} deadline in ${minutesUntilDeadline} minutes.`,
      data: { testId, action: "open_test" },
    };

    await this.sendNotification(userId, "test:reminder", payload);
  }

  async notifyTestResults(
    userId: string,
    testId: string,
    testTitle: string,
    score: number,
    maxScore: number,
  ): Promise<void> {
    if (!this.isEventEnabled("test:results")) return;

    const percentage = Math.round((score / maxScore) * 100);
    const payload: NotificationPayload = {
      title: "Test Results Ready",
      body: `${testTitle}: ${score}/${maxScore} (${percentage}%)`,
      data: { testId, action: "open_results" },
      priority: "high",
    };

    await this.sendNotification(userId, "test:results", payload);
  }

  async notifyQuestionRecommendation(
    userId: string,
    questionId: string,
    questionText: string,
    reason: string,
  ): Promise<void> {
    if (!this.isEventEnabled("question:recommended")) return;

    const payload: NotificationPayload = {
      title: "Question Recommended",
      body: reason,
      data: { questionId, action: "open_question" },
    };

    await this.sendNotification(userId, "question:recommended", payload);
  }

  async notifyAchievementUnlocked(
    userId: string,
    achievementName: string,
    description: string,
  ): Promise<void> {
    if (!this.isEventEnabled("achievement:unlocked")) return;

    const payload: NotificationPayload = {
      title: "🏆 Achievement Unlocked!",
      body: `${achievementName}: ${description}`,
      data: { action: "open_achievements" },
      priority: "high",
    };

    await this.sendNotification(userId, "achievement:unlocked", payload);
  }

  async notifyCourseUpdated(
    courseId: string,
    courseName: string,
    updateType: string,
  ): Promise<void> {
    if (!this.isEventEnabled("course:updated")) return;

    const payload: NotificationPayload = {
      title: `${courseName} Updated`,
      body: `New ${updateType} added. Check it out!`,
      data: { courseId, action: "open_course" },
    };

    // Would get enrolled students from database
    // For now, emit event for handler to process
    this.emit("course:updated", { courseId, payload });
  }

  async notifyGradePosted(
    userId: string,
    testTitle: string,
    grade: string,
  ): Promise<void> {
    if (!this.isEventEnabled("grade:posted")) return;

    const payload: NotificationPayload = {
      title: "Grade Posted",
      body: `${testTitle}: ${grade}`,
      data: { action: "open_grades" },
      priority: "high",
    };

    await this.sendNotification(userId, "grade:posted", payload);
  }

  async notifySystemMaintenance(
    startTime: Date,
    endTime: Date,
    message: string,
  ): Promise<void> {
    if (!this.isEventEnabled("system:maintenance")) return;

    const payload: NotificationPayload = {
      title: "Scheduled Maintenance",
      body: message,
      data: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    // Broadcast to all connected users
    this.emit("system:maintenance", { payload });
  }

  private async sendNotification(
    userId: string,
    eventType: string,
    payload: NotificationPayload,
  ): Promise<void> {
    const rule = this.rules.get(eventType);
    if (!rule) return;

    const promises: Promise<boolean>[] = [];

    if (rule.channels.includes("push")) {
      promises.push(this.sendPushNotification(userId, payload));
    }

    if (rule.channels.includes("email")) {
      promises.push(
        this.sendEmailNotification(
          userId,
          payload.title,
          eventType,
          payload.data || {},
        ),
      );
    }

    if (rule.channels.includes("in-app")) {
      promises.push(this.saveInAppNotification(userId, payload));
    }

    await Promise.allSettled(promises);
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    // Would retrieve from database
    // This is a placeholder
    return [];
  }

  private isEventEnabled(eventType: string): boolean {
    return this.rules.get(eventType)?.enabled ?? true;
  }

  private checkRateLimit(userId: string, key: string): boolean {
    const ruleKey = `${userId}:${key}`;
    const lastTime = this.lastNotificationTime.get(ruleKey);
    const cooldownMinutes = this.rules.get(key)?.cooldownMinutes ?? 0;

    if (!lastTime) return true;

    const minutesPassed = (Date.now() - lastTime) / (1000 * 60);
    return minutesPassed >= cooldownMinutes;
  }

  private updateLastNotificationTime(userId: string, key: string): void {
    const ruleKey = `${userId}:${key}`;
    this.lastNotificationTime.set(ruleKey, Date.now());
  }

  setEventEnabled(eventType: string, enabled: boolean): void {
    const rule = this.rules.get(eventType);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  getNotificationRules(): NotificationRule[] {
    return Array.from(this.rules.values());
  }

  updateNotificationRule(eventType: string, channels: string[]): void {
    const rule = this.rules.get(eventType);
    if (rule) {
      rule.channels = channels as any;
    }
  }
}

export const notificationService = new NotificationService();

export default NotificationService;
