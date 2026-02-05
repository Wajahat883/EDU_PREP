import express, { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

const router: Router = express.Router();

// Get user notifications
router.get(
  "/my-notifications",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      // Would fetch from database
      const notifications = [
        {
          id: "1",
          title: "Test Available",
          body: "Math Quiz is ready",
          read: false,
          createdAt: new Date(),
        },
      ];

      res.json({
        success: true,
        data: notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
);

// Mark notification as read
router.patch(
  "/notifications/:notificationId/read",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // Would update database
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  },
);

// Clear all notifications
router.delete(
  "/notifications/clear-all",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      // Would delete from database
      res.json({ success: true, message: "All notifications cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  },
);

// Get notification preferences
router.get(
  "/preferences",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      // Would fetch from database
      const preferences = {
        push: true,
        email: true,
        inApp: true,
        emailFrequency: "daily",
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "08:00",
        },
      };

      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  },
);

// Update notification preferences
router.patch(
  "/preferences",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { push, email, inApp, quietHours } = req.body;

      // Would update database
      res.json({
        success: true,
        message: "Preferences updated",
        data: req.body,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  },
);

// Register push notification token
router.post(
  "/tokens/register",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { token, platform } = req.body;

      if (!token || !platform) {
        return res.status(400).json({
          error: "Token and platform are required",
        });
      }

      // Would save to database
      res.json({
        success: true,
        message: "Token registered successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to register token" });
    }
  },
);

// Unregister push notification token
router.post(
  "/tokens/unregister",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Would delete from database
      res.json({
        success: true,
        message: "Token unregistered successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to unregister token" });
    }
  },
);

// Admin: Send notification to users
router.post(
  "/admin/send-bulk",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response) => {
    try {
      const { userIds, title, body, data } = req.body;

      if (!userIds || !title || !body) {
        return res.status(400).json({
          error: "userIds, title, and body are required",
        });
      }

      let successCount = 0;
      for (const userId of userIds) {
        const sent = await notificationService.sendPushNotification(userId, {
          title,
          body,
          data,
        });
        if (sent) successCount++;
      }

      res.json({
        success: true,
        message: `Notifications sent to ${successCount}/${userIds.length} users`,
        successCount,
        failureCount: userIds.length - successCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send notifications" });
    }
  },
);

// Activity feed / real-time updates
router.get(
  "/activity-feed",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = parseInt(req.query.skip as string) || 0;

      // Would fetch from database
      const activities = [
        {
          id: "1",
          userId: "user-2",
          action: "test_completed",
          subject: "Math Quiz",
          timestamp: new Date(),
          isFollowing: true,
        },
      ];

      res.json({
        success: true,
        data: activities,
        pagination: { limit, skip, total: activities.length },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity feed" });
    }
  },
);

// Get notification rules
router.get(
  "/rules",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response) => {
    try {
      const rules = notificationService.getNotificationRules();
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  },
);

// Update notification rule
router.patch(
  "/rules/:eventType",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response) => {
    try {
      const { eventType } = req.params;
      const { channels } = req.body;

      notificationService.updateNotificationRule(eventType, channels);
      res.json({ success: true, message: "Rule updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update rule" });
    }
  },
);

// Enable/disable event notifications
router.patch(
  "/events/:eventType/toggle",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response) => {
    try {
      const { eventType } = req.params;
      const { enabled } = req.body;

      notificationService.setEventEnabled(eventType, enabled);
      res.json({
        success: true,
        message: `Event ${eventType} ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle event" });
    }
  },
);

// Test notification
router.post(
  "/test-notification",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { title, body } = req.body;

      const sent = await notificationService.sendPushNotification(userId, {
        title: title || "Test Notification",
        body: body || "This is a test notification",
        priority: "high",
      });

      res.json({
        success: true,
        message: sent ? "Test notification sent" : "No active tokens found",
        sent,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  },
);

export default router;
