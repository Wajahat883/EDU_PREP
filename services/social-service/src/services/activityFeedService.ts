import { EventEmitter } from "events";

export interface ActivityLog {
  activityId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  activityType:
    | "course_completed"
    | "quiz_passed"
    | "assignment_submitted"
    | "post_created"
    | "joined_group"
    | "course_enrolled"
    | "badge_earned"
    | "streak_achieved";
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  metadata: Map<string, any>;
  timestamp: Date;
  visibility: "public" | "friends" | "private";
}

export interface FeedEntry {
  feedId: string;
  userId: string;
  activities: ActivityLog[];
  liked: boolean;
  likeCount: number;
  commentCount: number;
  sharedCount: number;
  timestamp: Date;
}

export interface FeedComment {
  commentId: string;
  feedId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdDate: Date;
}

export interface UserFollow {
  followId: string;
  followerId: string;
  followingId: string;
  createdDate: Date;
}

export interface FeedPreference {
  userId: string;
  followedUsers: Set<string>;
  blockedUsers: Set<string>;
  mutedUsers: Set<string>;
  activityTypePreferences: Map<string, boolean>;
}

export class ActivityFeedService extends EventEmitter {
  private activities: Map<string, ActivityLog> = new Map();
  private feeds: Map<string, FeedEntry[]> = new Map();
  private comments: Map<string, FeedComment[]> = new Map();
  private follows: Map<string, Set<string>> = new Map(); // userId -> followingIds
  private followers: Map<string, Set<string>> = new Map(); // userId -> followerIds
  private userFeeds: Map<string, FeedEntry[]> = new Map(); // userId -> feed entries
  private preferences: Map<string, FeedPreference> = new Map();
  private likes: Map<string, Set<string>> = new Map(); // feedId -> userIds who liked

  constructor() {
    super();
  }

  // Log activity
  logActivity(
    userId: string,
    userName: string,
    userAvatar: string,
    activityType: string,
    entityType: string,
    entityId: string,
    entityName: string,
    description: string,
    visibility: "public" | "friends" | "private" = "public",
  ): ActivityLog {
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const activity: ActivityLog = {
      activityId,
      userId,
      userName,
      userAvatar,
      activityType: activityType as ActivityLog["activityType"],
      entityType,
      entityId,
      entityName,
      description,
      metadata: new Map(),
      timestamp: new Date(),
      visibility,
    };

    this.activities.set(activityId, activity);

    // Create feed entry
    const feedId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const feedEntry: FeedEntry = {
      feedId,
      userId,
      activities: [activity],
      liked: false,
      likeCount: 0,
      commentCount: 0,
      sharedCount: 0,
      timestamp: new Date(),
    };

    // Add to user's feed
    const userFeed = this.userFeeds.get(userId) || [];
    userFeed.unshift(feedEntry);
    this.userFeeds.set(userId, userFeed);

    // Distribute to followers
    const followers = this.followers.get(userId) || new Set();
    for (const followerId of followers) {
      const followerFeed = this.userFeeds.get(followerId) || [];

      // Check mutes
      const prefs =
        this.preferences.get(followerId) ||
        this.createDefaultPreferences(followerId);
      if (!prefs.mutedUsers.has(userId)) {
        followerFeed.unshift(feedEntry);
        this.userFeeds.set(followerId, followerFeed);
      }
    }

    this.emit("activity:logged", {
      activityId,
      userId,
      userName,
      activityType,
      entityName,
    });

    return activity;
  }

  private createDefaultPreferences(userId: string): FeedPreference {
    const prefs: FeedPreference = {
      userId,
      followedUsers: new Set(),
      blockedUsers: new Set(),
      mutedUsers: new Set(),
      activityTypePreferences: new Map([
        ["course_completed", true],
        ["quiz_passed", true],
        ["assignment_submitted", false],
        ["post_created", true],
        ["joined_group", true],
        ["course_enrolled", false],
        ["badge_earned", true],
        ["streak_achieved", true],
      ]),
    };

    this.preferences.set(userId, prefs);
    return prefs;
  }

  // Follow user
  followUser(followerId: string, followingId: string): void {
    const following = this.follows.get(followerId) || new Set();
    if (following.has(followingId)) return;

    following.add(followingId);
    this.follows.set(followerId, following);

    const followers = this.followers.get(followingId) || new Set();
    followers.add(followerId);
    this.followers.set(followingId, followers);

    this.emit("user:followed", {
      followerId,
      followingId,
      followerCount: followers.size,
    });
  }

  // Unfollow user
  unfollowUser(followerId: string, followingId: string): void {
    const following = this.follows.get(followerId) || new Set();
    following.delete(followingId);

    const followers = this.followers.get(followingId) || new Set();
    followers.delete(followerId);

    this.emit("user:unfollowed", {
      followerId,
      followingId,
      followerCount: followers.size,
    });
  }

  // Get user feed
  getUserFeed(userId: string, limit: number = 50): FeedEntry[] {
    const feed = this.userFeeds.get(userId) || [];

    // Check preferences and filter
    const prefs =
      this.preferences.get(userId) || this.createDefaultPreferences(userId);

    const filtered = feed.filter((entry) => {
      // Skip blocked users
      if (prefs.blockedUsers.has(entry.userId)) return false;

      // Check activity type preferences
      for (const activity of entry.activities) {
        if (!prefs.activityTypePreferences.get(activity.activityType)) {
          return false;
        }
      }

      return true;
    });

    return filtered.slice(0, limit);
  }

  // Get follower feed
  getFollowerFeed(userId: string, limit: number = 50): FeedEntry[] {
    const following = this.follows.get(userId) || new Set();

    let feed: FeedEntry[] = [];

    for (const followingId of following) {
      const userFeed = this.userFeeds.get(followingId) || [];
      feed = feed.concat(userFeed);
    }

    // Sort by timestamp
    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return feed.slice(0, limit);
  }

  // Like feed entry
  likeEntry(feedId: string, userId: string): void {
    const likers = this.likes.get(feedId) || new Set();

    if (likers.has(userId)) return;

    likers.add(userId);
    this.likes.set(feedId, likers);

    // Find and update feed entry
    for (const feed of this.userFeeds.values()) {
      const entry = feed.find((e) => e.feedId === feedId);
      if (entry) {
        entry.likeCount = likers.size;

        this.emit("feed:liked", {
          feedId,
          userId,
          likeCount: entry.likeCount,
        });
        return;
      }
    }
  }

  // Unlike feed entry
  unlikeEntry(feedId: string, userId: string): void {
    const likers = this.likes.get(feedId) || new Set();

    if (!likers.has(userId)) return;

    likers.delete(userId);
    this.likes.set(feedId, likers);

    // Find and update feed entry
    for (const feed of this.userFeeds.values()) {
      const entry = feed.find((e) => e.feedId === feedId);
      if (entry) {
        entry.likeCount = likers.size;

        this.emit("feed:unliked", {
          feedId,
          userId,
          likeCount: entry.likeCount,
        });
        return;
      }
    }
  }

  // Add comment
  addComment(
    feedId: string,
    authorId: string,
    authorName: string,
    content: string,
  ): void {
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const comment: FeedComment = {
      commentId,
      feedId,
      authorId,
      authorName,
      content,
      createdDate: new Date(),
    };

    const comments = this.comments.get(feedId) || [];
    comments.push(comment);
    this.comments.set(feedId, comments);

    // Update feed entry comment count
    for (const feed of this.userFeeds.values()) {
      const entry = feed.find((e) => e.feedId === feedId);
      if (entry) {
        entry.commentCount++;
        break;
      }
    }

    this.emit("comment:added", {
      commentId,
      feedId,
      authorName,
      contentLength: content.length,
    });
  }

  // Get comments
  getComments(feedId: string, limit: number = 20): FeedComment[] {
    const comments = this.comments.get(feedId) || [];
    return comments.slice(-limit);
  }

  // Mute user
  muteUser(userId: string, mutedUserId: string): void {
    let prefs = this.preferences.get(userId);
    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.mutedUsers.add(mutedUserId);

    this.emit("user:muted", {
      userId,
      mutedUserId,
    });
  }

  // Unmute user
  unmuteUser(userId: string, unmutedUserId: string): void {
    const prefs = this.preferences.get(userId);
    if (prefs) {
      prefs.mutedUsers.delete(unmutedUserId);

      this.emit("user:unmuted", {
        userId,
        unmutedUserId,
      });
    }
  }

  // Block user
  blockUser(userId: string, blockedUserId: string): void {
    let prefs = this.preferences.get(userId);
    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
    }

    prefs.blockedUsers.add(blockedUserId);

    // Also unfollow
    const following = this.follows.get(userId) || new Set();
    following.delete(blockedUserId);

    this.emit("user:blocked", {
      userId,
      blockedUserId,
    });
  }

  // Unblock user
  unblockUser(userId: string, unblockedUserId: string): void {
    const prefs = this.preferences.get(userId);
    if (prefs) {
      prefs.blockedUsers.delete(unblockedUserId);

      this.emit("user:unblocked", {
        userId,
        unblockedUserId,
      });
    }
  }

  // Get trending activities
  getTrendingActivities(limit: number = 20): ActivityLog[] {
    const activities = Array.from(this.activities.values());

    // Sort by visibility and recency
    return activities
      .filter((a) => a.visibility === "public")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get user stats
  getUserStats(userId: string): {
    followers: number;
    following: number;
    activities: number;
  } {
    return {
      followers: (this.followers.get(userId) || new Set()).size,
      following: (this.follows.get(userId) || new Set()).size,
      activities: Array.from(this.activities.values()).filter(
        (a) => a.userId === userId,
      ).length,
    };
  }
}

export const activityFeedService = new ActivityFeedService();

export default ActivityFeedService;
