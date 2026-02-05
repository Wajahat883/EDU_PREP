import { EventEmitter } from "events";

export interface TutorProfile {
  tutorId: string;
  userId: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  headline: string;
  expertise: string[];
  certifications: string[];
  experience: number; // years
  languages: string[];
  hourlyRate: number;
  responseTime: number; // minutes
  availability: {
    daysOfWeek: number[]; // 0-6
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  ratingCount: number;
  isVerified: boolean;
  badges: TutorBadge[];
  profileViews: number;
  hiringsInProgress: number;
  status: "active" | "inactive" | "vacation" | "banned";
  joinedDate: Date;
  lastActive: Date;
}

export interface TutorBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  awardedDate: Date;
  level: "bronze" | "silver" | "gold" | "platinum";
}

export interface TutorReview {
  reviewId: string;
  tutorId: string;
  studentId: string;
  studentName: string;
  rating: number; // 1-5
  title: string;
  text: string;
  categories: {
    communication: number;
    expertise: number;
    punctuality: number;
    helpfulness: number;
  };
  createdDate: Date;
  isVerified: boolean; // Verified purchase
  helpful: number;
  notHelpful: number;
}

export interface TutorSession {
  sessionId: string;
  tutorId: string;
  studentId: string;
  subject: string;
  scheduledDate: Date;
  duration: number; // minutes
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  cost: number;
  notes?: string;
  sessionNotes?: string;
  recordingUrl?: string;
}

export class TutorProfileService extends EventEmitter {
  private tutorProfiles: Map<string, TutorProfile> = new Map();
  private reviews: Map<string, TutorReview[]> = new Map();
  private sessions: Map<string, TutorSession[]> = new Map();
  private tutorRankings: Map<string, { tutorId: string; score: number }> =
    new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // expertise -> tutorIds

  constructor() {
    super();
    this.initializeSearchIndex();
  }

  private initializeSearchIndex(): void {
    const subjects = [
      "Math",
      "Science",
      "English",
      "History",
      "Spanish",
      "French",
      "Programming",
      "Music",
      "Art",
    ];
    subjects.forEach((subject) => {
      this.searchIndex.set(subject.toLowerCase(), new Set());
    });
  }

  // Create tutor profile
  createTutorProfile(
    userId: string,
    username: string,
    email: string,
    expertise: string[],
    hourlyRate: number,
    headline: string,
  ): TutorProfile {
    const tutorId = `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const profile: TutorProfile = {
      tutorId,
      userId,
      username,
      email,
      avatar: `https://avatars.example.com/${userId}`,
      bio: "",
      headline,
      expertise,
      certifications: [],
      experience: 0,
      languages: ["English"],
      hourlyRate,
      responseTime: 60,
      availability: {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      },
      totalSessions: 0,
      totalHours: 0,
      averageRating: 0,
      ratingCount: 0,
      isVerified: false,
      badges: [],
      profileViews: 0,
      hiringsInProgress: 0,
      status: "active",
      joinedDate: new Date(),
      lastActive: new Date(),
    };

    this.tutorProfiles.set(tutorId, profile);
    this.reviews.set(tutorId, []);
    this.sessions.set(tutorId, []);

    // Index by expertise
    expertise.forEach((exp) => {
      const expLower = exp.toLowerCase();
      const tutorSet = this.searchIndex.get(expLower) || new Set();
      tutorSet.add(tutorId);
      this.searchIndex.set(expLower, tutorSet);
    });

    this.emit("tutor:profile-created", {
      tutorId,
      username,
      expertise,
      hourlyRate,
    });

    return profile;
  }

  // Update profile
  updateTutorProfile(tutorId: string, updates: Partial<TutorProfile>): void {
    const profile = this.tutorProfiles.get(tutorId);
    if (!profile) return;

    Object.assign(profile, updates);
    profile.lastActive = new Date();

    this.emit("tutor:profile-updated", {
      tutorId,
      username: profile.username,
    });
  }

  // Add review
  addReview(
    tutorId: string,
    studentId: string,
    studentName: string,
    rating: number,
    title: string,
    text: string,
    categories: TutorReview["categories"],
  ): TutorReview {
    const profile = this.tutorProfiles.get(tutorId);
    if (!profile) {
      throw new Error("Tutor not found");
    }

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const review: TutorReview = {
      reviewId,
      tutorId,
      studentId,
      studentName,
      rating,
      title,
      text,
      categories,
      createdDate: new Date(),
      isVerified: true,
      helpful: 0,
      notHelpful: 0,
    };

    const reviews = this.reviews.get(tutorId) || [];
    reviews.push(review);
    this.reviews.set(tutorId, reviews);

    // Update tutor rating
    const totalRating = profile.averageRating * profile.ratingCount + rating;
    profile.ratingCount++;
    profile.averageRating = totalRating / profile.ratingCount;

    // Check for badges
    this.awardBadgesIfEligible(tutorId);

    this.emit("review:added", {
      reviewId,
      tutorId,
      rating,
      studentName,
    });

    return review;
  }

  private awardBadgesIfEligible(tutorId: string): void {
    const profile = this.tutorProfiles.get(tutorId);
    if (!profile) return;

    // Top Rated badge
    if (
      profile.averageRating >= 4.8 &&
      profile.ratingCount >= 10 &&
      !profile.badges.find((b) => b.name === "Top Rated")
    ) {
      const badge: TutorBadge = {
        badgeId: `badge_${Date.now()}`,
        name: "Top Rated",
        description: "Maintains a 4.8+ rating with 10+ reviews",
        icon: "⭐",
        criteria: "rating >= 4.8 && reviews >= 10",
        awardedDate: new Date(),
        level: "gold",
      };
      profile.badges.push(badge);

      this.emit("badge:awarded", {
        tutorId,
        badgeName: "Top Rated",
        level: "gold",
      });
    }

    // Experienced badge
    if (
      profile.totalSessions >= 100 &&
      !profile.badges.find((b) => b.name === "Experienced")
    ) {
      const badge: TutorBadge = {
        badgeId: `badge_${Date.now()}`,
        name: "Experienced",
        description: "Completed 100+ sessions",
        icon: "🎓",
        criteria: "sessions >= 100",
        awardedDate: new Date(),
        level: "silver",
      };
      profile.badges.push(badge);

      this.emit("badge:awarded", {
        tutorId,
        badgeName: "Experienced",
        level: "silver",
      });
    }

    // Responsive badge
    if (
      profile.responseTime <= 5 &&
      !profile.badges.find((b) => b.name === "Responsive")
    ) {
      const badge: TutorBadge = {
        badgeId: `badge_${Date.now()}`,
        name: "Responsive",
        description: "Quick response time (< 5 minutes)",
        icon: "⚡",
        criteria: "responseTime <= 5",
        awardedDate: new Date(),
        level: "bronze",
      };
      profile.badges.push(badge);
    }
  }

  // Search tutors
  searchTutors(
    query: string,
    expertise?: string,
    maxRate?: number,
    minRating?: number,
    limit: number = 20,
  ): TutorProfile[] {
    let results: TutorProfile[] = [];

    if (expertise) {
      const expLower = expertise.toLowerCase();
      const tutorIds = this.searchIndex.get(expLower) || new Set();
      results = Array.from(tutorIds)
        .map((id) => this.tutorProfiles.get(id))
        .filter((t) => t !== undefined) as TutorProfile[];
    } else {
      results = Array.from(this.tutorProfiles.values());
    }

    // Apply filters
    if (maxRate) {
      results = results.filter((t) => t.hourlyRate <= maxRate);
    }
    if (minRating) {
      results = results.filter((t) => t.averageRating >= minRating);
    }

    // Filter by search query
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.username.toLowerCase().includes(queryLower) ||
          t.headline.toLowerCase().includes(queryLower) ||
          t.expertise.some((e) => e.toLowerCase().includes(queryLower)),
      );
    }

    // Sort by rating and reviews
    results.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.ratingCount - a.ratingCount;
    });

    return results.slice(0, limit);
  }

  // Get tutor profile
  getTutorProfile(tutorId: string): TutorProfile | undefined {
    const profile = this.tutorProfiles.get(tutorId);
    if (profile) {
      profile.profileViews++;
    }
    return profile;
  }

  // Get tutor reviews
  getTutorReviews(tutorId: string, limit: number = 20): TutorReview[] {
    const reviews = this.reviews.get(tutorId) || [];
    return reviews
      .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
      .slice(0, limit);
  }

  // Get tutor sessions
  getTutorSessions(tutorId: string): TutorSession[] {
    return this.sessions.get(tutorId) || [];
  }

  // Schedule session
  scheduleSession(
    tutorId: string,
    studentId: string,
    subject: string,
    scheduledDate: Date,
    duration: number,
  ): TutorSession {
    const profile = this.tutorProfiles.get(tutorId);
    if (!profile) {
      throw new Error("Tutor not found");
    }

    const cost = (duration / 60) * profile.hourlyRate;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: TutorSession = {
      sessionId,
      tutorId,
      studentId,
      subject,
      scheduledDate,
      duration,
      status: "scheduled",
      cost,
    };

    const sessions = this.sessions.get(tutorId) || [];
    sessions.push(session);
    this.sessions.set(tutorId, sessions);

    profile.hiringsInProgress++;

    this.emit("session:scheduled", {
      sessionId,
      tutorId,
      studentId,
      subject,
      cost,
    });

    return session;
  }

  // Complete session
  completeSession(
    tutorId: string,
    sessionId: string,
    notes: string,
    recordingUrl?: string,
  ): void {
    const sessions = this.sessions.get(tutorId) || [];
    const session = sessions.find((s) => s.sessionId === sessionId);

    if (session) {
      session.status = "completed";
      session.sessionNotes = notes;
      session.recordingUrl = recordingUrl;

      const profile = this.tutorProfiles.get(tutorId)!;
      profile.totalSessions++;
      profile.totalHours += session.duration / 60;
      profile.hiringsInProgress--;

      this.emit("session:completed", {
        sessionId,
        tutorId,
        duration: session.duration,
        earnings: session.cost,
      });
    }
  }

  // Get top tutors
  getTopTutors(limit: number = 10): TutorProfile[] {
    return Array.from(this.tutorProfiles.values())
      .filter((t) => t.status === "active" && t.ratingCount >= 5)
      .sort((a, b) => {
        const scoreA = a.averageRating * 0.7 + (a.totalSessions / 100) * 0.3;
        const scoreB = b.averageRating * 0.7 + (b.totalSessions / 100) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Verify tutor
  verifyTutor(tutorId: string): void {
    const profile = this.tutorProfiles.get(tutorId);
    if (!profile) return;

    profile.isVerified = true;

    this.emit("tutor:verified", {
      tutorId,
      username: profile.username,
    });
  }
}

export const tutorProfileService = new TutorProfileService();

export default TutorProfileService;
