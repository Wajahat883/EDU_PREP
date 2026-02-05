import { Router, Request, Response } from "express";
import { discussionForumService } from "../services/discussionForumService";
import { studyGroupService } from "../services/studyGroupService";
import { messagingService } from "../services/messagingService";
import { activityFeedService } from "../services/activityFeedService";
import { peerHelpService } from "../services/peerHelpService";

const router = Router();

// Discussion Forum Routes

router.post("/forums/threads", (req: Request, res: Response) => {
  try {
    const { userId, userName, title, content, category, tags } = req.body;
    const thread = discussionForumService.createThread(
      userId,
      userName,
      title,
      content,
      category,
      tags,
    );
    res.status(201).json({ success: true, thread });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/forums/threads/:threadId", (req: Request, res: Response) => {
  try {
    const thread = discussionForumService.getThread(req.params.threadId);
    res.json(thread);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/forums/threads", (req: Request, res: Response) => {
  try {
    const { category, sort } = req.query;
    const threads = discussionForumService.getThreads(
      category as string,
      sort as string,
    );
    res.json({ threads });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/forums/threads/:threadId/posts",
  (req: Request, res: Response) => {
    try {
      const { userId, userName, content } = req.body;
      const post = discussionForumService.addPost(
        req.params.threadId,
        userId,
        userName,
        content,
      );
      res.status(201).json({ success: true, post });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/forums/posts/:postId/replies", (req: Request, res: Response) => {
  try {
    const { userId, userName, content } = req.body;
    const reply = discussionForumService.addReply(
      req.params.postId,
      userId,
      userName,
      content,
    );
    res.status(201).json({ success: true, reply });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/forums/posts/:postId/upvote", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    discussionForumService.upvotePost(req.params.postId, userId);
    res.json({ success: true, message: "Post upvoted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/forums/posts/:postId/downvote", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    discussionForumService.downvotePost(req.params.postId, userId);
    res.json({ success: true, message: "Post downvoted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/forums/threads/:threadId/subscribe",
  (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      discussionForumService.subscribeToThread(req.params.threadId, userId);
      res.json({ success: true, message: "Subscribed to thread" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get("/forums/trending", (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const trending = discussionForumService.getTrendingThreads(
      limit ? parseInt(limit as string) : 50,
    );
    res.json({ trending });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Study Groups Routes

router.post("/groups", (req: Request, res: Response) => {
  try {
    const { creatorId, creatorName, name, description, subject, maxMembers } =
      req.body;
    const group = studyGroupService.createGroup(
      creatorId,
      creatorName,
      name,
      description,
      subject,
      maxMembers,
    );
    res.status(201).json({ success: true, group });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/groups/:groupId", (req: Request, res: Response) => {
  try {
    const group = studyGroupService.getGroup(req.params.groupId);
    res.json(group);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/groups", (req: Request, res: Response) => {
  try {
    const { subject, search } = req.query;
    const groups = studyGroupService.getGroups(
      subject as string,
      search as string,
    );
    res.json({ groups });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/groups/:groupId/join", (req: Request, res: Response) => {
  try {
    const { userId, userName } = req.body;
    studyGroupService.joinGroup(req.params.groupId, userId, userName);
    res.json({ success: true, message: "Joined group" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/groups/:groupId/leave", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    studyGroupService.leaveGroup(req.params.groupId, userId);
    res.json({ success: true, message: "Left group" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/groups/:groupId/messages", (req: Request, res: Response) => {
  try {
    const { userId, userName, text } = req.body;
    const message = studyGroupService.addGroupMessage(
      req.params.groupId,
      userId,
      userName,
      text,
    );
    res.status(201).json({ success: true, message });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/groups/:groupId/messages", (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const messages = studyGroupService.getGroupMessages(
      req.params.groupId,
      limit ? parseInt(limit as string) : 50,
    );
    res.json({ messages });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/groups/:groupId/study-sessions",
  (req: Request, res: Response) => {
    try {
      const {
        organizerId,
        organizerName,
        topic,
        startTime,
        duration,
        meetingUrl,
      } = req.body;
      const session = studyGroupService.createStudySession(
        req.params.groupId,
        organizerId,
        organizerName,
        topic,
        new Date(startTime),
        duration,
        meetingUrl,
      );
      res.status(201).json({ success: true, session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get("/groups/:groupId/study-sessions", (req: Request, res: Response) => {
  try {
    const sessions = studyGroupService.getGroupStudySessions(
      req.params.groupId,
    );
    res.json({ sessions });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/groups/:groupId/announcements", (req: Request, res: Response) => {
  try {
    const { authorId, authorName, title, content, priority } = req.body;
    const announcement = studyGroupService.postAnnouncement(
      req.params.groupId,
      authorId,
      authorName,
      title,
      content,
      priority,
    );
    res.status(201).json({ success: true, announcement });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Messaging Routes

router.post("/messages/conversations", (req: Request, res: Response) => {
  try {
    const { userId1, userId1Name, userId2, userId2Name } = req.body;
    const conversation = messagingService.createConversation(
      userId1,
      userId1Name,
      userId2,
      userId2Name,
    );
    res.status(201).json({ success: true, conversation });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/messages/:conversationId/send", (req: Request, res: Response) => {
  try {
    const { senderId, senderName, text, attachments } = req.body;
    const message = messagingService.sendMessage(
      req.params.conversationId,
      senderId,
      senderName,
      text,
      attachments,
    );
    res.status(201).json({ success: true, message });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/messages/:conversationId", (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const messages = messagingService.getMessages(
      req.params.conversationId,
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0,
    );
    res.json({ messages });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/messages/:conversationId/typing",
  (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      messagingService.updateTypingStatus(
        req.params.conversationId,
        userId,
        true,
      );
      res.json({ success: true, message: "Typing status updated" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/messages/:messageId/read", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    messagingService.markMessageAsRead(req.params.messageId, userId);
    res.json({ success: true, message: "Message marked as read" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/messages/conversations/:userId", (req: Request, res: Response) => {
  try {
    const conversations = messagingService.getUserConversations(
      req.params.userId,
    );
    res.json({ conversations });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/messages/search", (req: Request, res: Response) => {
  try {
    const { conversationId, query } = req.body;
    const results = messagingService.searchMessages(conversationId, query);
    res.json({ results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Activity Feed Routes

router.post("/feed/activity", (req: Request, res: Response) => {
  try {
    const { userId, userName, type, entityId, content } = req.body;
    const activity = activityFeedService.logActivity(
      userId,
      userName,
      type,
      entityId,
      content,
    );
    res.status(201).json({ success: true, activity });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/feed/:userId", (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const feed = activityFeedService.getUserFeed(
      req.params.userId,
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0,
    );
    res.json(feed);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/feed/:userId/follow", (req: Request, res: Response) => {
  try {
    const { followerId } = req.body;
    activityFeedService.followUser(followerId, req.params.userId);
    res.json({ success: true, message: "User followed" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feed/:userId/unfollow", (req: Request, res: Response) => {
  try {
    const { followerId } = req.body;
    activityFeedService.unfollowUser(followerId, req.params.userId);
    res.json({ success: true, message: "User unfollowed" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feed/preferences/:userId", (req: Request, res: Response) => {
  try {
    const { activityTypes, notificationEnabled } = req.body;
    activityFeedService.updateFeedPreferences(
      req.params.userId,
      activityTypes,
      notificationEnabled,
    );
    res.json({ success: true, message: "Preferences updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feed/:userId/block", (req: Request, res: Response) => {
  try {
    const { blockedUserId } = req.body;
    activityFeedService.blockUser(req.params.userId, blockedUserId);
    res.json({ success: true, message: "User blocked" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feed/:userId/mute", (req: Request, res: Response) => {
  try {
    const { mutedUserId } = req.body;
    activityFeedService.muteUser(req.params.userId, mutedUserId);
    res.json({ success: true, message: "User muted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/feed/trending", (req: Request, res: Response) => {
  try {
    const { limit, timeRange } = req.query;
    const trending = activityFeedService.getTrendingActivities(
      limit ? parseInt(limit as string) : 50,
      timeRange as string,
    );
    res.json({ trending });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Peer Help Routes

router.post("/help/requests", (req: Request, res: Response) => {
  try {
    const { studentId, studentName, subject, question, difficulty } = req.body;
    const request = peerHelpService.createHelpRequest(
      studentId,
      studentName,
      subject,
      question,
      difficulty,
    );
    res.status(201).json({ success: true, request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/help/requests", (req: Request, res: Response) => {
  try {
    const { subject, status, difficulty } = req.query;
    const requests = peerHelpService.getHelpRequests(
      subject as string,
      status as string,
      difficulty as string,
    );
    res.json({ requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/help/requests/:requestId", (req: Request, res: Response) => {
  try {
    const request = peerHelpService.getHelpRequest(req.params.requestId);
    res.json(request);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/help/requests/:requestId/respond",
  (req: Request, res: Response) => {
    try {
      const { helperId, helperName } = req.body;
      peerHelpService.assignHelper(req.params.requestId, helperId, helperName);
      res.json({ success: true, message: "Helper assigned" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/help/requests/:requestId/complete",
  (req: Request, res: Response) => {
    try {
      peerHelpService.completeHelpRequest(req.params.requestId);
      res.json({ success: true, message: "Help request completed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/help/helpers/profile", (req: Request, res: Response) => {
  try {
    const { userId, userName, expertise, bio } = req.body;
    peerHelpService.createHelperProfile(userId, userName, expertise, bio);
    res.status(201).json({ success: true, message: "Helper profile created" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/help/helpers/top", (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const topHelpers = peerHelpService.getTopHelpers(
      limit ? parseInt(limit as string) : 50,
    );
    res.json({ topHelpers });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/help/leaderboard", (req: Request, res: Response) => {
  try {
    const { limit, timeRange } = req.query;
    const leaderboard = peerHelpService.getHelperLeaderboard(
      limit ? parseInt(limit as string) : 100,
      timeRange as string,
    );
    res.json({ leaderboard });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
