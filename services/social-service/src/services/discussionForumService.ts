import { EventEmitter } from "events";

export interface ForumThread {
  threadId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  createdDate: Date;
  updatedDate: Date;
  lastReplyDate?: Date;
}

export interface ForumPost {
  postId: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachments?: string[];
  upvotes: number;
  downvotes: number;
  repliesCount: number;
  createdDate: Date;
  updatedDate: Date;
  isDeleted: boolean;
}

export interface ForumReply {
  replyId: string;
  postId: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdDate: Date;
  updatedDate: Date;
  isDeleted: boolean;
}

export interface ThreadSubscription {
  subscriptionId: string;
  userId: string;
  threadId: string;
  notifyOnReply: boolean;
  subscribedDate: Date;
}

export class DiscussionForumService extends EventEmitter {
  private threads: Map<string, ForumThread> = new Map();
  private posts: Map<string, ForumPost[]> = new Map();
  private replies: Map<string, ForumReply[]> = new Map();
  private subscriptions: Map<string, ThreadSubscription[]> = new Map();
  private userVotes: Map<string, Map<string, number>> = new Map(); // userId -> postId -> vote
  private categoryIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const categories = [
      "General Discussion",
      "Academic Help",
      "Project Showcase",
      "Study Tips",
      "Technology",
      "Announcements",
    ];
    categories.forEach((cat) => {
      this.categoryIndex.set(cat.toLowerCase(), new Set());
    });
  }

  // Create thread
  createThread(
    creatorId: string,
    creatorName: string,
    title: string,
    description: string,
    category: string,
    tags: string[] = [],
  ): ForumThread {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const thread: ForumThread = {
      threadId,
      creatorId,
      creatorName,
      title,
      description,
      category,
      tags,
      isPinned: false,
      isLocked: false,
      views: 0,
      replyCount: 0,
      upvotes: 0,
      downvotes: 0,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    this.threads.set(threadId, thread);
    this.posts.set(threadId, []);
    this.replies.set(threadId, []);

    // Index by category
    const catLower = category.toLowerCase();
    const threads = this.categoryIndex.get(catLower) || new Set();
    threads.add(threadId);
    this.categoryIndex.set(catLower, threads);

    this.emit("thread:created", {
      threadId,
      title,
      creatorName,
      category,
      tagCount: tags.length,
    });

    return thread;
  }

  // Add post to thread
  addPost(
    threadId: string,
    authorId: string,
    authorName: string,
    content: string,
  ): void {
    const thread = this.threads.get(threadId);
    if (!thread) return;

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const post: ForumPost = {
      postId,
      threadId,
      authorId,
      authorName,
      content,
      upvotes: 0,
      downvotes: 0,
      repliesCount: 0,
      createdDate: new Date(),
      updatedDate: new Date(),
      isDeleted: false,
    };

    const posts = this.posts.get(threadId) || [];
    posts.push(post);
    this.posts.set(threadId, posts);

    thread.replyCount++;
    thread.updatedDate = new Date();

    this.emit("post:added", {
      postId,
      threadId,
      authorName,
      contentLength: content.length,
    });
  }

  // Add reply to post
  addReply(
    postId: string,
    threadId: string,
    authorId: string,
    authorName: string,
    content: string,
  ): void {
    const thread = this.threads.get(threadId);
    if (!thread) return;

    const post = (this.posts.get(threadId) || []).find(
      (p) => p.postId === postId,
    );
    if (!post) return;

    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const reply: ForumReply = {
      replyId,
      postId,
      threadId,
      authorId,
      authorName,
      content,
      upvotes: 0,
      downvotes: 0,
      createdDate: new Date(),
      updatedDate: new Date(),
      isDeleted: false,
    };

    const replies = this.replies.get(postId) || [];
    replies.push(reply);
    this.replies.set(postId, replies);

    post.repliesCount++;
    thread.replyCount++;

    this.emit("reply:added", {
      replyId,
      postId,
      threadId,
      authorName,
    });
  }

  // Upvote post
  upvotePost(userId: string, postId: string): void {
    const userVotes = this.userVotes.get(userId) || new Map();

    const currentVote = userVotes.get(postId) || 0;

    if (currentVote === 1) return; // Already upvoted

    // Find and update post
    for (const posts of this.posts.values()) {
      const post = posts.find((p) => p.postId === postId);
      if (post) {
        if (currentVote === -1) {
          post.downvotes--;
        }
        post.upvotes++;
        userVotes.set(postId, 1);
        this.userVotes.set(userId, userVotes);

        this.emit("post:upvoted", {
          postId,
          userId,
          totalUpvotes: post.upvotes,
        });
        return;
      }
    }
  }

  // Downvote post
  downvotePost(userId: string, postId: string): void {
    const userVotes = this.userVotes.get(userId) || new Map();

    const currentVote = userVotes.get(postId) || 0;

    if (currentVote === -1) return; // Already downvoted

    // Find and update post
    for (const posts of this.posts.values()) {
      const post = posts.find((p) => p.postId === postId);
      if (post) {
        if (currentVote === 1) {
          post.upvotes--;
        }
        post.downvotes++;
        userVotes.set(postId, -1);
        this.userVotes.set(userId, userVotes);

        this.emit("post:downvoted", {
          postId,
          userId,
          totalDownvotes: post.downvotes,
        });
        return;
      }
    }
  }

  // Pin thread
  pinThread(threadId: string): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.isPinned = true;

      this.emit("thread:pinned", {
        threadId,
        title: thread.title,
      });
    }
  }

  // Lock thread
  lockThread(threadId: string): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.isLocked = true;

      this.emit("thread:locked", {
        threadId,
        title: thread.title,
      });
    }
  }

  // Subscribe to thread
  subscribeToThread(
    userId: string,
    threadId: string,
    notifyOnReply: boolean = true,
  ): void {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscription: ThreadSubscription = {
      subscriptionId,
      userId,
      threadId,
      notifyOnReply,
      subscribedDate: new Date(),
    };

    const subscriptions = this.subscriptions.get(userId) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(userId, subscriptions);

    this.emit("thread:subscribed", {
      subscriptionId,
      userId,
      threadId,
    });
  }

  // Get thread
  getThread(threadId: string): ForumThread | undefined {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.views++;
    }
    return thread;
  }

  // Get thread posts
  getThreadPosts(threadId: string): ForumPost[] {
    return this.posts.get(threadId) || [];
  }

  // Get post replies
  getPostReplies(postId: string): ForumReply[] {
    return this.replies.get(postId) || [];
  }

  // Search threads
  searchThreads(
    query: string,
    category?: string,
    limit: number = 50,
  ): ForumThread[] {
    let results: ForumThread[] = [];

    if (category) {
      const threadIds =
        this.categoryIndex.get(category.toLowerCase()) || new Set();
      results = Array.from(threadIds)
        .map((id) => this.threads.get(id))
        .filter((t) => t !== undefined) as ForumThread[];
    } else {
      results = Array.from(this.threads.values());
    }

    // Filter by query
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(queryLower) ||
          t.description.toLowerCase().includes(queryLower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
      );
    }

    // Sort by recency and pinned status
    results.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      return b.updatedDate.getTime() - a.updatedDate.getTime();
    });

    return results.slice(0, limit);
  }

  // Get trending threads
  getTrendingThreads(limit: number = 20): ForumThread[] {
    return Array.from(this.threads.values())
      .filter((t) => !t.isLocked)
      .sort((a, b) => {
        const aScore =
          (a.upvotes * 2 + a.replyCount * 1.5 + a.views * 0.5) /
          (Date.now() - a.updatedDate.getTime());
        const bScore =
          (b.upvotes * 2 + b.replyCount * 1.5 + b.views * 0.5) /
          (Date.now() - b.updatedDate.getTime());
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  // Get user subscriptions
  getUserSubscriptions(userId: string): ForumThread[] {
    const subscriptions = this.subscriptions.get(userId) || [];
    return subscriptions
      .map((sub) => this.threads.get(sub.threadId))
      .filter((t) => t !== undefined) as ForumThread[];
  }
}

export const discussionForumService = new DiscussionForumService();

export default DiscussionForumService;
