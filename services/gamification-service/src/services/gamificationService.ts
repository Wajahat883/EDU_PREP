import { EventEmitter } from "events";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
  criteria: {
    type: string;
    value: number;
    timeframe?: "daily" | "weekly" | "monthly" | "all-time";
  };
  unlockedDate?: Date;
  progress?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  achievementsRequired: string[];
  points: number;
  unlockedDate?: Date;
}

export interface UserProfile {
  userId: string;
  level: number;
  experiencePoints: number;
  nextLevelThreshold: number;
  totalPoints: number;
  streak: number;
  streakStartDate: Date;
  achievements: Achievement[];
  badges: Badge[];
  milestones: string[];
}

export class GamificationService extends EventEmitter {
  private userProfiles: Map<string, UserProfile> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private badges: Map<string, Badge> = new Map();

  constructor() {
    super();
    this.initializeAchievements();
    this.initializeBadges();
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Learning achievements
      {
        id: "first_test",
        name: "Getting Started",
        description: "Complete your first test",
        icon: "🎯",
        rarity: "common",
        points: 10,
        criteria: { type: "tests_completed", value: 1 },
      },
      {
        id: "test_master",
        name: "Test Master",
        description: "Complete 50 tests",
        icon: "🏆",
        rarity: "rare",
        points: 100,
        criteria: { type: "tests_completed", value: 50 },
      },
      {
        id: "perfect_score",
        name: "Perfect Score",
        description: "Score 100% on a test",
        icon: "⭐",
        rarity: "epic",
        points: 150,
        criteria: { type: "perfect_test", value: 1 },
      },
      {
        id: "accuracy_100",
        name: "Precision Expert",
        description: "Maintain 100% accuracy for a week",
        icon: "🎯",
        rarity: "rare",
        points: 120,
        criteria: {
          type: "accuracy",
          value: 100,
          timeframe: "weekly",
        },
      },
      {
        id: "consistency_king",
        name: "Consistency King",
        description: "Maintain 30-day streak",
        icon: "🔥",
        rarity: "epic",
        points: 200,
        criteria: {
          type: "streak",
          value: 30,
          timeframe: "all-time",
        },
      },
      {
        id: "speed_runner",
        name: "Speed Runner",
        description: "Complete test 50% faster than average",
        icon: "⚡",
        rarity: "rare",
        points: 100,
        criteria: { type: "speed", value: 50 },
      },
      {
        id: "subject_master_math",
        name: "Math Master",
        description: "Achieve 90%+ mastery in Math",
        icon: "📐",
        rarity: "rare",
        points: 100,
        criteria: { type: "subject_mastery", value: 90, subject: "math" },
      },
      {
        id: "learning_path_complete",
        name: "Path Finder",
        description: "Complete an adaptive learning path",
        icon: "🛤️",
        rarity: "uncommon",
        points: 50,
        criteria: { type: "learning_path_completed", value: 1 },
      },
      {
        id: "helpful_peer",
        name: "Helpful Peer",
        description: "Help 5 classmates",
        icon: "🤝",
        rarity: "uncommon",
        points: 75,
        criteria: { type: "peer_help", value: 5 },
      },
    ];

    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeBadges(): void {
    const badges: Badge[] = [
      {
        id: "novice",
        name: "Novice",
        description: "Earn 5 achievements",
        icon: "🥉",
        tier: "bronze",
        achievementsRequired: [
          "first_test",
          "learning_path_complete",
          "helpful_peer",
        ],
        points: 50,
      },
      {
        id: "apprentice",
        name: "Apprentice",
        description: "Earn 10 achievements",
        icon: "🥈",
        tier: "silver",
        achievementsRequired: ["test_master", "speed_runner", "accuracy_100"],
        points: 150,
      },
      {
        id: "expert",
        name: "Expert",
        description: "Earn 15 achievements and reach level 20",
        icon: "🥇",
        tier: "gold",
        achievementsRequired: ["perfect_score", "subject_master_math"],
        points: 300,
      },
      {
        id: "legendary",
        name: "Legendary",
        description: "Earn 20+ achievements and maintain 100-day streak",
        icon: "👑",
        tier: "platinum",
        achievementsRequired: ["consistency_king"],
        points: 500,
      },
    ];

    badges.forEach((badge) => {
      this.badges.set(badge.id, badge);
    });
  }

  initializeUserProfile(userId: string): UserProfile {
    const profile: UserProfile = {
      userId,
      level: 1,
      experiencePoints: 0,
      nextLevelThreshold: 1000,
      totalPoints: 0,
      streak: 0,
      streakStartDate: new Date(),
      achievements: [],
      badges: [],
      milestones: [],
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  getUserProfile(userId: string): UserProfile {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = this.initializeUserProfile(userId);
    }
    return profile;
  }

  // Award experience points
  awardExperience(
    userId: string,
    amount: number,
    reason: string,
  ): {
    leveledUp: boolean;
    newLevel: number;
    pointsThisLevel: number;
  } {
    let profile = this.getUserProfile(userId);

    profile.experiencePoints += amount;
    profile.totalPoints += amount;

    let leveledUp = false;
    let newLevel = profile.level;

    while (profile.experiencePoints >= profile.nextLevelThreshold) {
      profile.experiencePoints -= profile.nextLevelThreshold;
      profile.level++;
      profile.nextLevelThreshold = Math.floor(profile.nextLevelThreshold * 1.1);
      leveledUp = true;
      newLevel = profile.level;

      this.emit("level:up", {
        userId,
        newLevel,
        totalPoints: profile.totalPoints,
      });
    }

    this.emit("experience:awarded", {
      userId,
      amount,
      reason,
      totalPoints: profile.totalPoints,
    });

    return {
      leveledUp,
      newLevel,
      pointsThisLevel: profile.experiencePoints,
    };
  }

  // Check and unlock achievements
  async checkAchievements(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
  ): Promise<Achievement[]> {
    const profile = this.getUserProfile(userId);
    const unlockedAchievements: Achievement[] = [];

    for (const [achievementId, achievement] of this.achievements.entries()) {
      // Skip if already unlocked
      if (profile.achievements.some((a) => a.id === achievementId)) {
        continue;
      }

      // Check if criteria matches
      if (this.checkAchievementCriteria(achievement, eventType, eventData)) {
        achievement.unlockedDate = new Date();
        achievement.progress = 100;
        profile.achievements.push(achievement);
        unlockedAchievements.push(achievement);

        // Award points
        this.awardExperience(
          userId,
          achievement.points,
          `Achievement: ${achievement.name}`,
        );

        this.emit("achievement:unlocked", {
          userId,
          achievement,
          totalPoints: profile.totalPoints,
        });

        // Check for badge unlocks
        this.checkBadges(userId);
      }
    }

    return unlockedAchievements;
  }

  private checkAchievementCriteria(
    achievement: Achievement,
    eventType: string,
    eventData: Record<string, any>,
  ): boolean {
    const { type, value } = achievement.criteria;

    switch (type) {
      case "tests_completed":
        return eventType === "test_completed" && eventData.total >= value;
      case "perfect_test":
        return eventType === "test_completed" && eventData.score === 100;
      case "accuracy":
        return eventType === "accuracy_check" && eventData.accuracy >= value;
      case "streak":
        return eventType === "streak_update" && eventData.streak >= value;
      case "speed":
        return (
          eventType === "test_completed" && eventData.speedImprovement >= value
        );
      case "subject_mastery":
        return (
          eventType === "mastery_check" &&
          eventData.mastery >= value &&
          eventData.subject === achievement.criteria["subject"]
        );
      case "learning_path_completed":
        return eventType === "learning_path_completed";
      case "peer_help":
        return eventType === "peer_helped" && eventData.total >= value;
      default:
        return false;
    }
  }

  // Check and unlock badges
  private checkBadges(userId: string): void {
    const profile = this.getUserProfile(userId);
    const unlockedAchievementIds = profile.achievements.map((a) => a.id);

    for (const [badgeId, badge] of this.badges.entries()) {
      // Skip if already unlocked
      if (profile.badges.some((b) => b.id === badgeId)) {
        continue;
      }

      // Check if all required achievements are unlocked
      const allAchievementsUnlocked = badge.achievementsRequired.every((req) =>
        unlockedAchievementIds.includes(req),
      );

      if (allAchievementsUnlocked) {
        badge.unlockedDate = new Date();
        profile.badges.push(badge);

        // Award points
        this.awardExperience(userId, badge.points, `Badge: ${badge.name}`);

        this.emit("badge:unlocked", {
          userId,
          badge,
          tier: badge.tier,
        });
      }
    }
  }

  // Update streak
  updateStreak(userId: string): {
    streak: number;
    streakExtended: boolean;
  } {
    const profile = this.getUserProfile(userId);
    const now = new Date();
    const lastActivityDate = profile.streakStartDate;
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let streakExtended = false;

    if (daysSinceLastActivity === 0) {
      // Same day, no change
      streakExtended = false;
    } else if (daysSinceLastActivity === 1) {
      // Next day, extend streak
      profile.streak++;
      profile.streakStartDate = now;
      streakExtended = true;

      // Award streak bonus
      const bonusPoints = 50 * profile.streak; // Increasing bonus
      this.awardExperience(
        userId,
        bonusPoints,
        `Streak bonus day ${profile.streak}`,
      );

      this.emit("streak:extended", {
        userId,
        streak: profile.streak,
        bonusPoints,
      });
    } else {
      // More than 1 day, reset streak
      if (profile.streak > 0) {
        this.emit("streak:broken", {
          userId,
          previousStreak: profile.streak,
        });
      }
      profile.streak = 1;
      profile.streakStartDate = now;
    }

    return { streak: profile.streak, streakExtended };
  }

  // Get leaderboard
  getLeaderboard(
    scope: "global" | "class" | "subject",
    limit: number = 10,
    userIds?: string[],
  ): Array<{
    rank: number;
    userId: string;
    level: number;
    totalPoints: number;
    streak: number;
  }> {
    const profiles = Array.from(this.userProfiles.values());

    // Filter by scope if needed
    let filtered = userIds
      ? profiles.filter((p) => userIds.includes(p.userId))
      : profiles;

    // Sort by total points
    const sorted = filtered
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return sorted.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      level: profile.level,
      totalPoints: profile.totalPoints,
      streak: profile.streak,
    }));
  }

  // Get achievement progress
  getAchievementProgress(
    userId: string,
  ): Array<Achievement & { progress: number }> {
    const profile = this.getUserProfile(userId);
    const allAchievements = Array.from(this.achievements.values());

    return allAchievements.map((achievement) => {
      const unlocked = profile.achievements.find(
        (a) => a.id === achievement.id,
      );
      return {
        ...achievement,
        progress: unlocked ? 100 : 0,
      };
    });
  }
}

export const gamificationService = new GamificationService();

export default GamificationService;
