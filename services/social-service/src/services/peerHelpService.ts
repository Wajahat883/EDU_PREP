import { EventEmitter } from "events";

export interface HelpRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  subject: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  status: "open" | "in-progress" | "resolved" | "closed";
  helperId?: string;
  helperName?: string;
  createdDate: Date;
  startedDate?: Date;
  resolvedDate?: Date;
  rating?: number;
  feedback?: string;
}

export interface PeerHelper {
  userId: string;
  userName: string;
  expertise: string[];
  helpCount: number;
  successRate: number;
  reputationPoints: number;
  avgRating: number;
  responseTime: number; // minutes
  verified: boolean;
  createdDate: Date;
}

export interface HelpSession {
  sessionId: string;
  requestId: string;
  helperId: string;
  helperName: string;
  requesterId: string;
  requesterName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  messages: SessionMessage[];
  resources: string[];
  status: "active" | "completed" | "abandoned";
}

export interface SessionMessage {
  messageId: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

export interface HelperBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  awardedDate: Date;
}

export class PeerHelpService extends EventEmitter {
  private helpRequests: Map<string, HelpRequest> = new Map();
  private helpers: Map<string, PeerHelper> = new Map();
  private sessions: Map<string, HelpSession> = new Map();
  private badges: Map<string, HelperBadge[]> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private expertiseIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    const categories = [
      "Mathematics",
      "Science",
      "Languages",
      "Programming",
      "History",
      "Literature",
      "Economics",
      "Other",
    ];
    categories.forEach((cat) => {
      this.categoryIndex.set(cat.toLowerCase(), new Set());
      this.expertiseIndex.set(cat.toLowerCase(), new Set());
    });
  }

  // Create help request
  createHelpRequest(
    requesterId: string,
    requesterName: string,
    subject: string,
    description: string,
    category: string,
    difficulty: "easy" | "medium" | "hard",
    tags: string[] = [],
  ): HelpRequest {
    const requestId = `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: HelpRequest = {
      requestId,
      requesterId,
      requesterName,
      subject,
      description,
      category,
      difficulty,
      tags,
      status: "open",
      createdDate: new Date(),
    };

    this.helpRequests.set(requestId, request);

    // Index by category
    const catLower = category.toLowerCase();
    const requests = this.categoryIndex.get(catLower) || new Set();
    requests.add(requestId);
    this.categoryIndex.set(catLower, requests);

    this.emit("help-request:created", {
      requestId,
      subject,
      requesterName,
      category,
      difficulty,
    });

    return request;
  }

  // Find matching helpers
  findMatchingHelpers(category: string, expertise: string[]): PeerHelper[] {
    const catLower = category.toLowerCase();
    const helperIds = this.expertiseIndex.get(catLower) || new Set();

    return Array.from(helperIds)
      .map((id) => this.helpers.get(id))
      .filter((h) => {
        if (!h) return false;
        if (!h.verified) return false;
        // Match at least one expertise
        return expertise.some((exp) => h.expertise.includes(exp));
      })
      .sort((a, b) => {
        // Sort by reputation and rating
        if (b.reputationPoints !== a.reputationPoints) {
          return b.reputationPoints - a.reputationPoints;
        }
        return (b.avgRating || 0) - (a.avgRating || 0);
      }) as PeerHelper[];
  }

  // Accept help request
  acceptHelpRequest(
    requestId: string,
    helperId: string,
    helperName: string,
  ): void {
    const request = this.helpRequests.get(requestId);
    if (!request) return;

    request.helperId = helperId;
    request.helperName = helperName;
    request.status = "in-progress";
    request.startedDate = new Date();

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: HelpSession = {
      sessionId,
      requestId,
      helperId,
      helperName,
      requesterId: request.requesterId,
      requesterName: request.requesterName,
      startTime: new Date(),
      duration: 0,
      messages: [],
      resources: [],
      status: "active",
    };

    this.sessions.set(sessionId, session);

    const helper = this.helpers.get(helperId);
    if (helper) {
      helper.responseTime = Math.round(
        (new Date().getTime() - request.createdDate.getTime()) / 60000,
      );
    }

    this.emit("help-request:accepted", {
      requestId,
      helperId,
      helperName,
      requesterName: request.requesterName,
    });
  }

  // Add message to session
  addSessionMessage(
    sessionId: string,
    senderId: string,
    senderName: string,
    content: string,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: SessionMessage = {
      messageId,
      sessionId,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
    };

    session.messages.push(message);

    this.emit("session:message-added", {
      messageId,
      sessionId,
      senderName,
    });
  }

  // Resolve help request
  resolveHelpRequest(
    requestId: string,
    rating: number,
    feedback: string,
  ): void {
    const request = this.helpRequests.get(requestId);
    if (!request) return;

    request.status = "resolved";
    request.resolvedDate = new Date();
    request.rating = rating;
    request.feedback = feedback;

    if (request.helperId) {
      // Update helper stats
      const helper = this.helpers.get(request.helperId);
      if (helper) {
        helper.helpCount++;
        helper.reputationPoints += Math.ceil(rating * 10);

        const currentAvg = helper.avgRating || 0;
        helper.avgRating =
          (currentAvg * (helper.helpCount - 1) + rating) / helper.helpCount;

        // Check for badges
        this.checkAndAwardBadges(request.helperId);
      }

      // End session
      for (const session of this.sessions.values()) {
        if (session.requestId === requestId) {
          session.status = "completed";
          session.endTime = new Date();
          session.duration = Math.round(
            (session.endTime.getTime() - session.startTime.getTime()) / 60000,
          );
          break;
        }
      }
    }

    this.emit("help-request:resolved", {
      requestId,
      rating,
      helperId: request.helperId,
      requesterName: request.requesterName,
    });
  }

  // Register helper
  registerHelper(
    userId: string,
    userName: string,
    expertise: string[],
  ): PeerHelper {
    const helper: PeerHelper = {
      userId,
      userName,
      expertise,
      helpCount: 0,
      successRate: 100,
      reputationPoints: 0,
      avgRating: 0,
      responseTime: 0,
      verified: false,
      createdDate: new Date(),
    };

    this.helpers.set(userId, helper);
    this.badges.set(userId, []);

    // Index by expertise
    expertise.forEach((exp) => {
      const expLower = exp.toLowerCase();
      const helperIds = this.expertiseIndex.get(expLower) || new Set();
      helperIds.add(userId);
      this.expertiseIndex.set(expLower, helperIds);
    });

    this.emit("helper:registered", {
      userId,
      userName,
      expertise,
    });

    return helper;
  }

  // Verify helper
  verifyHelper(userId: string): void {
    const helper = this.helpers.get(userId);
    if (helper) {
      helper.verified = true;

      this.emit("helper:verified", {
        userId,
        userName: helper.userName,
      });
    }
  }

  // Check and award badges
  private checkAndAwardBadges(helperId: string): void {
    const helper = this.helpers.get(helperId);
    if (!helper) return;

    const badges = this.badges.get(helperId) || [];

    // Check for Helping Hand (10 helps)
    if (
      helper.helpCount === 10 &&
      !badges.some((b) => b.name === "Helping Hand")
    ) {
      badges.push({
        badgeId: `badge_${Date.now()}`,
        name: "Helping Hand",
        description: "Helped 10 students",
        icon: "helping-hand",
        criteria: "helpCount >= 10",
        awardedDate: new Date(),
      });
    }

    // Check for Expert Helper (50 helps)
    if (
      helper.helpCount === 50 &&
      !badges.some((b) => b.name === "Expert Helper")
    ) {
      badges.push({
        badgeId: `badge_${Date.now()}`,
        name: "Expert Helper",
        description: "Helped 50 students",
        icon: "expert-helper",
        criteria: "helpCount >= 50",
        awardedDate: new Date(),
      });
    }

    // Check for Top Rated (4.8+ rating)
    if (
      helper.avgRating >= 4.8 &&
      !badges.some((b) => b.name === "Top Rated")
    ) {
      badges.push({
        badgeId: `badge_${Date.now()}`,
        name: "Top Rated",
        description: "Average rating of 4.8+",
        icon: "top-rated",
        criteria: "avgRating >= 4.8",
        awardedDate: new Date(),
      });
    }

    // Check for Quick Responder (< 5 min response time)
    if (
      helper.responseTime < 5 &&
      !badges.some((b) => b.name === "Quick Responder")
    ) {
      badges.push({
        badgeId: `badge_${Date.now()}`,
        name: "Quick Responder",
        description: "Average response time < 5 minutes",
        icon: "quick-responder",
        criteria: "responseTime < 5",
        awardedDate: new Date(),
      });
    }

    this.badges.set(helperId, badges);

    if (badges.length > 0) {
      this.emit("badge:awarded", {
        helperId,
        badgeCount: badges.length,
      });
    }
  }

  // Get helper profile
  getHelperProfile(helperId: string): PeerHelper | undefined {
    return this.helpers.get(helperId);
  }

  // Get open requests
  getOpenRequests(category?: string, limit: number = 50): HelpRequest[] {
    let requests = Array.from(this.helpRequests.values()).filter(
      (r) => r.status === "open",
    );

    if (category) {
      const catLower = category.toLowerCase();
      requests = requests.filter((r) => r.category.toLowerCase() === catLower);
    }

    // Sort by difficulty and recency
    return requests
      .sort((a, b) => {
        const diffOrder: Record<string, number> = {
          hard: 3,
          medium: 2,
          easy: 1,
        };
        if (diffOrder[b.difficulty] !== diffOrder[a.difficulty]) {
          return diffOrder[b.difficulty] - diffOrder[a.difficulty];
        }
        return b.createdDate.getTime() - a.createdDate.getTime();
      })
      .slice(0, limit);
  }

  // Get help request
  getHelpRequest(requestId: string): HelpRequest | undefined {
    return this.helpRequests.get(requestId);
  }

  // Search requests
  searchRequests(query: string, category?: string): HelpRequest[] {
    let requests = Array.from(this.helpRequests.values()).filter(
      (r) => r.status === "open",
    );

    if (category) {
      requests = requests.filter(
        (r) => r.category.toLowerCase() === category.toLowerCase(),
      );
    }

    const queryLower = query.toLowerCase();
    return requests.filter(
      (r) =>
        r.subject.toLowerCase().includes(queryLower) ||
        r.description.toLowerCase().includes(queryLower) ||
        r.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
    );
  }

  // Get leaderboard
  getLeaderboard(limit: number = 50): PeerHelper[] {
    return Array.from(this.helpers.values())
      .filter((h) => h.verified)
      .sort((a, b) => {
        if (b.reputationPoints !== a.reputationPoints) {
          return b.reputationPoints - a.reputationPoints;
        }
        return (b.avgRating || 0) - (a.avgRating || 0);
      })
      .slice(0, limit);
  }
}

export const peerHelpService = new PeerHelpService();

export default PeerHelpService;
