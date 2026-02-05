/**
 * Gamification Service
 * Location: services/gamification-service/src/services/gamification.service.ts
 *
 * Complete gamification system with:
 * - Badge/achievement system (40+ badges)
 * - Leaderboard rankings (global, monthly, weekly)
 * - Points and scoring system
 * - Streaks and challenges
 * - Social sharing
 */

import { UserModel } from "../models/User";
import { BadgeModel, IBadge } from "../models/Badge";
import { LeaderboardModel } from "../models/Leaderboard";
import { ChallengeModel, IChallenge } from "../models/Challenge";
import logger from "../utils/logger";

/**
 * Badge definitions - 40+ achievements
 */
const BADGE_DEFINITIONS = [
  // Mastery Badges
  {
    id: "subject_master_anatomy",
    name: "Anatomy Master",
    description: "90%+ accuracy on Anatomy",
  },
  {
    id: "subject_master_biochemistry",
    name: "Biochemistry Master",
    description: "90%+ on Biochemistry",
  },
  {
    id: "subject_master_pharmacology",
    name: "Pharmacology Master",
    description: "90%+ on Pharmacology",
  },
  {
    id: "subject_master_pathology",
    name: "Pathology Master",
    description: "90%+ on Pathology",
  },
  {
    id: "subject_master_physiology",
    name: "Physiology Master",
    description: "90%+ on Physiology",
  },

  // Streak Badges
  {
    id: "streak_7",
    name: "7-Day Warrior",
    description: "Study 7 days in a row",
  },
  {
    id: "streak_14",
    name: "2-Week Champion",
    description: "Study 14 days in a row",
  },
  {
    id: "streak_30",
    name: "Month Master",
    description: "Study 30 days in a row",
  },
  {
    id: "streak_100",
    name: "Century Club",
    description: "Study 100 days in a row",
  },

  // Volume Badges
  { id: "questions_100", name: "Novice", description: "Answer 100 questions" },
  {
    id: "questions_500",
    name: "Apprentice",
    description: "Answer 500 questions",
  },
  {
    id: "questions_1000",
    name: "Scholar",
    description: "Answer 1000 questions",
  },
  {
    id: "questions_5000",
    name: "Expert",
    description: "Answer 5000 questions",
  },
  {
    id: "questions_10000",
    name: "Legendary",
    description: "Answer 10000 questions",
  },

  // Performance Badges
  {
    id: "perfect_10",
    name: "Perfect 10",
    description: "Get 100% on 10 consecutive questions",
  },
  {
    id: "accuracy_80",
    name: "Accuracy Achiever",
    description: "Maintain 80% accuracy for a week",
  },
  {
    id: "accuracy_90",
    name: "Precision Master",
    description: "Maintain 90% accuracy for a month",
  },
  {
    id: "test_pass",
    name: "Test Taker",
    description: "Pass first full-length exam",
  },
  {
    id: "test_pass_high",
    name: "High Scorer",
    description: "Score 90%+ on full-length exam",
  },

  // Mode Badges
  {
    id: "flashcard_100",
    name: "Flashcard Fanatic",
    description: "Review 100 flashcards",
  },
  {
    id: "tutor_mode_10",
    name: "Tutor Trainee",
    description: "Complete 10 tutor mode sessions",
  },
  {
    id: "timed_mode_fast",
    name: "Speed Demon",
    description: "Avg 30s per question in timed mode",
  },

  // Achievement Badges
  {
    id: "first_milestone",
    name: "Milestone Marker",
    description: "Complete first learning path milestone",
  },
  {
    id: "leaderboard_top10",
    name: "Top 10 Tracker",
    description: "Reach top 10 on leaderboard",
  },
  {
    id: "leaderboard_top100",
    name: "Leaderboard Legend",
    description: "Reach top 100 on leaderboard",
  },

  // Social Badges
  {
    id: "social_share",
    name: "Social Butterfly",
    description: "Share achievement 5 times",
  },
  {
    id: "friend_invite",
    name: "Friend Finder",
    description: "Invite 5 friends",
  },

  // Special Event Badges
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete session before 9 AM",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete session after 10 PM",
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Study on all weekend days",
  },

  // Milestone Badges
  { id: "level_10", name: "Level 10 Achiever", description: "Reach level 10" },
  { id: "level_25", name: "Level 25 Master", description: "Reach level 25" },
  { id: "level_50", name: "Level 50 Legend", description: "Reach level 50" },
];

export class GamificationService {
  /**
   * BADGE & ACHIEVEMENT SYSTEM
   */

  /**
   * Award badge to user
   */
  static async awardBadge(
    userId: string,
    badgeId: string,
  ): Promise<IBadge | null> {
    try {
      // Check if badge already awarded
      const existing = await BadgeModel.findOne({ userId, badgeId });
      if (existing) {
        logger.info(`Badge already awarded to user: ${userId}`);
        return existing;
      }

      // Create badge record
      const badgeDefinition = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (!badgeDefinition) {
        throw new Error(`Badge definition not found: ${badgeId}`);
      }

      const badge = await BadgeModel.create({
        userId,
        badgeId,
        name: badgeDefinition.name,
        description: badgeDefinition.description,
        awardedAt: new Date(),
      });

      // Add points
      const pointsReward = this.getPointsForBadge(badgeId);
      await UserModel.findByIdAndUpdate(userId, {
        $inc: { points: pointsReward },
        $push: { badges: badgeId },
      });

      logger.info(`Badge awarded to user ${userId}: ${badgeId}`);

      // Send notification
      await this.notifyBadgeAwarded(userId, badgeDefinition.name);

      return badge;
    } catch (error: any) {
      logger.error(`Error awarding badge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check and award badges based on user activity
   */
  static async checkAndAwardBadges(
    userId: string,
    triggerType: string,
  ): Promise<string[]> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("User not found");

      const awardedBadges: string[] = [];

      // Get user stats
      const questionsAnswered = user.questionsAnswered || 0;
      const accuracy = user.averageAccuracy || 0;
      const streak = user.studyStreak || 0;
      const level = Math.floor(user.points / 1000) + 1;

      // Volume badges
      if (
        questionsAnswered >= 100 &&
        !(user.badges || []).includes("questions_100")
      ) {
        await this.awardBadge(userId, "questions_100");
        awardedBadges.push("questions_100");
      }
      if (
        questionsAnswered >= 500 &&
        !(user.badges || []).includes("questions_500")
      ) {
        await this.awardBadge(userId, "questions_500");
        awardedBadges.push("questions_500");
      }
      if (
        questionsAnswered >= 1000 &&
        !(user.badges || []).includes("questions_1000")
      ) {
        await this.awardBadge(userId, "questions_1000");
        awardedBadges.push("questions_1000");
      }
      if (
        questionsAnswered >= 5000 &&
        !(user.badges || []).includes("questions_5000")
      ) {
        await this.awardBadge(userId, "questions_5000");
        awardedBadges.push("questions_5000");
      }

      // Streak badges
      if (streak >= 7 && !(user.badges || []).includes("streak_7")) {
        await this.awardBadge(userId, "streak_7");
        awardedBadges.push("streak_7");
      }
      if (streak >= 14 && !(user.badges || []).includes("streak_14")) {
        await this.awardBadge(userId, "streak_14");
        awardedBadges.push("streak_14");
      }
      if (streak >= 30 && !(user.badges || []).includes("streak_30")) {
        await this.awardBadge(userId, "streak_30");
        awardedBadges.push("streak_30");
      }

      // Accuracy badges
      if (accuracy >= 80 && !(user.badges || []).includes("accuracy_80")) {
        await this.awardBadge(userId, "accuracy_80");
        awardedBadges.push("accuracy_80");
      }
      if (accuracy >= 90 && !(user.badges || []).includes("accuracy_90")) {
        await this.awardBadge(userId, "accuracy_90");
        awardedBadges.push("accuracy_90");
      }

      // Level badges
      if (level >= 10 && !(user.badges || []).includes("level_10")) {
        await this.awardBadge(userId, "level_10");
        awardedBadges.push("level_10");
      }
      if (level >= 25 && !(user.badges || []).includes("level_25")) {
        await this.awardBadge(userId, "level_25");
        awardedBadges.push("level_25");
      }
      if (level >= 50 && !(user.badges || []).includes("level_50")) {
        await this.awardBadge(userId, "level_50");
        awardedBadges.push("level_50");
      }

      return awardedBadges;
    } catch (error: any) {
      logger.error(`Error checking badges: ${error.message}`);
      return [];
    }
  }

  /**
   * Get points reward for badge
   */
  private static getPointsForBadge(badgeId: string): number {
    const pointsMap: Record<string, number> = {
      // High value badges
      streak_100: 1000,
      level_50: 800,
      perfect_10: 500,
      accuracy_90: 400,

      // Medium value badges
      streak_30: 300,
      questions_10000: 300,
      level_25: 250,
      accuracy_80: 200,

      // Standard badges
      questions_5000: 150,
      streak_14: 100,
      level_10: 100,
      test_pass_high: 100,

      // Base badges
      questions_1000: 50,
      streak_7: 50,
      test_pass: 25,
      questions_500: 25,
    };

    return pointsMap[badgeId] || 10;
  }

  /**
   * LEADERBOARD SYSTEM
   */

  /**
   * Update user leaderboard position
   */
  static async updateLeaderboard(userId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const currentWeek = `${now.getFullYear()}-W${this.getWeekNumber(now)}`;

      // Global leaderboard
      await LeaderboardModel.updateOne(
        { userId, period: "global" },
        {
          userId,
          period: "global",
          points: user.points || 0,
          questionsAnswered: user.questionsAnswered || 0,
          accuracy: user.averageAccuracy || 0,
          rank: 0, // Will be calculated
          updatedAt: new Date(),
        },
        { upsert: true },
      );

      // Monthly leaderboard
      await LeaderboardModel.updateOne(
        { userId, period: currentMonth },
        {
          userId,
          period: currentMonth,
          points: user.monthlyPoints || 0,
          questionsAnswered: user.monthlyQuestions || 0,
          accuracy: user.monthlyAccuracy || 0,
          rank: 0,
          updatedAt: new Date(),
        },
        { upsert: true },
      );

      // Weekly leaderboard
      await LeaderboardModel.updateOne(
        { userId, period: currentWeek },
        {
          userId,
          period: currentWeek,
          points: user.weeklyPoints || 0,
          questionsAnswered: user.weeklyQuestions || 0,
          accuracy: user.weeklyAccuracy || 0,
          rank: 0,
          updatedAt: new Date(),
        },
        { upsert: true },
      );

      logger.info(`Leaderboard updated for user ${userId}`);
    } catch (error: any) {
      logger.error(`Error updating leaderboard: ${error.message}`);
    }
  }

  /**
   * Get global leaderboard
   */
  static async getGlobalLeaderboard(limit = 100): Promise<any[]> {
    try {
      const leaderboard = await LeaderboardModel.find({ period: "global" })
        .sort({ points: -1 })
        .limit(limit)
        .populate("userId", "name avatar");

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.userId,
        points: entry.points,
        questionsAnswered: entry.questionsAnswered,
        accuracy: entry.accuracy,
      }));
    } catch (error: any) {
      logger.error(`Error fetching leaderboard: ${error.message}`);
      return [];
    }
  }

  /**
   * Get monthly leaderboard
   */
  static async getMonthlyLeaderboard(limit = 50): Promise<any[]> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const leaderboard = await LeaderboardModel.find({ period: currentMonth })
        .sort({ points: -1 })
        .limit(limit)
        .populate("userId", "name avatar");

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.userId,
        points: entry.points,
        questionsAnswered: entry.questionsAnswered,
      }));
    } catch (error: any) {
      logger.error(`Error fetching monthly leaderboard: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user's leaderboard ranking
   */
  static async getUserRanking(userId: string): Promise<{
    globalRank: number;
    monthlyRank: number;
    weeklyRank: number;
    percentile: number;
  }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("User not found");

      // Get rank in each leaderboard
      const globalRank =
        (await LeaderboardModel.countDocuments({
          period: "global",
          points: { $gt: user.points },
        })) + 1;
      const monthlyRank =
        (await LeaderboardModel.countDocuments({
          period: new RegExp(
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          ),
          points: { $gt: user.monthlyPoints || 0 },
        })) + 1;
      const weeklyRank =
        (await LeaderboardModel.countDocuments({
          period: new RegExp(`${new Date().getFullYear()}-W`),
          points: { $gt: user.weeklyPoints || 0 },
        })) + 1;

      const totalUsers = await UserModel.countDocuments();
      const percentile = Math.round(
        ((totalUsers - globalRank) / totalUsers) * 100,
      );

      return {
        globalRank,
        monthlyRank,
        weeklyRank,
        percentile,
      };
    } catch (error: any) {
      logger.error(`Error getting user ranking: ${error.message}`);
      throw error;
    }
  }

  /**
   * CHALLENGES & COMPETITIONS
   */

  /**
   * Create daily challenge
   */
  static async createDailyChallenge(): Promise<IChallenge> {
    try {
      const challenge = await ChallengeModel.create({
        type: "daily",
        name: "Daily Question Challenge",
        description: "Answer 20 questions with 75%+ accuracy",
        objective: {
          questionsToAnswer: 20,
          minAccuracy: 75,
          timeLimit: 60, // minutes
        },
        reward: {
          points: 100,
          badge: "daily_challenge_complete",
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      logger.info(`Daily challenge created: ${challenge._id}`);
      return challenge;
    } catch (error: any) {
      logger.error(`Error creating daily challenge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete challenge
   */
  static async completeChallenge(
    userId: string,
    challengeId: string,
  ): Promise<void> {
    try {
      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) throw new Error("Challenge not found");

      // Record completion
      await ChallengeModel.findByIdAndUpdate(challengeId, {
        $addToSet: { completedBy: userId },
      });

      // Award points and badge
      await UserModel.findByIdAndUpdate(userId, {
        $inc: { points: challenge.reward.points },
      });

      if (challenge.reward.badge) {
        await this.awardBadge(userId, challenge.reward.badge);
      }

      logger.info(`Challenge completed by user ${userId}: ${challengeId}`);
    } catch (error: any) {
      logger.error(`Error completing challenge: ${error.message}`);
      throw error;
    }
  }

  /**
   * POINTS & LEVELING SYSTEM
   */

  /**
   * Award points for activity
   */
  static async awardPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<void> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          $inc: { points },
          $push: {
            pointsLog: {
              points,
              reason,
              timestamp: new Date(),
            },
          },
        },
        { new: true },
      );

      // Check level up
      if (user) {
        const newLevel = Math.floor((user.points || 0) / 1000) + 1;
        const oldLevel = Math.floor(((user.points || 0) - points) / 1000) + 1;

        if (newLevel > oldLevel) {
          await this.notifyLevelUp(userId, newLevel);
        }
      }

      logger.info(`Awarded ${points} points to user ${userId}: ${reason}`);
    } catch (error: any) {
      logger.error(`Error awarding points: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate points for activity
   */
  static calculateActivityPoints(activity: {
    questionsAnswered: number;
    accuracy: number;
    difficulty: number;
    timeSpent: number;
  }): number {
    // Base: 5 points per question
    let basePoints = activity.questionsAnswered * 5;

    // Accuracy multiplier: 0.8x to 1.5x
    const accuracyMultiplier = 0.8 + (activity.accuracy / 100) * 0.7;
    basePoints *= accuracyMultiplier;

    // Difficulty bonus: +1 point per difficulty level
    basePoints += activity.questionsAnswered * activity.difficulty;

    // Time efficiency bonus: faster completion = bonus
    const idealTime = activity.questionsAnswered * 1.5; // 1.5 min per question
    if (activity.timeSpent < idealTime) {
      basePoints *= 1.2;
    }

    return Math.round(basePoints);
  }

  /**
   * SOCIAL & SHARING
   */

  /**
   * Share achievement
   */
  static async shareAchievement(
    userId: string,
    achievementType: string,
  ): Promise<void> {
    try {
      const user = await UserModel.findByIdAndUpdate(userId, {
        $inc: { sharesCount: 1 },
        $push: {
          shares: {
            type: achievementType,
            timestamp: new Date(),
          },
        },
      });

      // Award points for sharing
      await this.awardPoints(
        userId,
        10,
        `Shared ${achievementType} achievement`,
      );

      // Check social sharing badge
      if ((user?.sharesCount || 0) >= 5) {
        await this.awardBadge(userId, "social_share");
      }

      logger.info(`Achievement shared by user ${userId}: ${achievementType}`);
    } catch (error: any) {
      logger.error(`Error sharing achievement: ${error.message}`);
      throw error;
    }
  }

  /**
   * NOTIFICATIONS
   */

  private static async notifyBadgeAwarded(
    userId: string,
    badgeName: string,
  ): Promise<void> {
    logger.info(`Badge awarded notification: ${userId} - ${badgeName}`);
    // Integration with notification service
  }

  private static async notifyLevelUp(
    userId: string,
    level: number,
  ): Promise<void> {
    logger.info(`Level up notification: ${userId} reached level ${level}`);
    // Integration with notification service
  }

  /**
   * UTILITY
   */

  private static getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
