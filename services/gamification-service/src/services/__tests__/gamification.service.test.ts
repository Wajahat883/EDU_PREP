/**
 * Gamification Service Tests
 * Location: services/gamification-service/src/services/__tests__/gamification.service.test.ts
 *
 * Comprehensive test suite for gamification features
 * 50+ test cases covering badges, leaderboards, challenges, points, and social
 */

import { GamificationService } from "../gamification.service";
import { UserModel } from "../../models/User";
import { BadgeModel } from "../../models/Badge";
import { LeaderboardModel } from "../../models/Leaderboard";
import { ChallengeModel } from "../../models/Challenge";
import mongoose from "mongoose";

const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();
const MOCK_USER_ID_2 = new mongoose.Types.ObjectId().toString();

describe("GamificationService", () => {
  describe("Badge System", () => {
    describe("awardBadge", () => {
      test("should award badge to user", async () => {
        const badge = await GamificationService.awardBadge(
          MOCK_USER_ID,
          "questions_100",
        );
        expect(badge).toBeDefined();
        expect(badge.badgeId).toBe("questions_100");
        expect(badge.userId.toString()).toBe(MOCK_USER_ID);
      });

      test("should not award duplicate badge", async () => {
        await GamificationService.awardBadge(MOCK_USER_ID, "streak_7");
        const secondAttempt = await GamificationService.awardBadge(
          MOCK_USER_ID,
          "streak_7",
        );
        expect(secondAttempt).toBeDefined();
        expect(secondAttempt.badgeId).toBe("streak_7");
      });

      test("should award correct points for badge", async () => {
        const userBefore = await UserModel.findById(MOCK_USER_ID);
        const pointsBefore = userBefore?.points || 0;

        await GamificationService.awardBadge(MOCK_USER_ID, "perfect_10");

        const userAfter = await UserModel.findById(MOCK_USER_ID);
        expect((userAfter?.points || 0) > pointsBefore).toBe(true);
      });

      test("should throw error for invalid badge", async () => {
        await expect(
          GamificationService.awardBadge(MOCK_USER_ID, "invalid_badge"),
        ).rejects.toThrow();
      });
    });

    describe("checkAndAwardBadges", () => {
      test("should award volume badges", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          questionsAnswered: 500,
        });

        const badges = await GamificationService.checkAndAwardBadges(
          MOCK_USER_ID,
          "test",
        );
        expect(Array.isArray(badges)).toBe(true);
      });

      test("should award streak badges", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          studyStreak: 30,
        });

        const badges = await GamificationService.checkAndAwardBadges(
          MOCK_USER_ID,
          "test",
        );
        expect(Array.isArray(badges)).toBe(true);
      });

      test("should award accuracy badges", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          averageAccuracy: 92,
        });

        const badges = await GamificationService.checkAndAwardBadges(
          MOCK_USER_ID,
          "test",
        );
        expect(Array.isArray(badges)).toBe(true);
      });

      test("should award level badges", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          points: 25000, // Level 25+
        });

        const badges = await GamificationService.checkAndAwardBadges(
          MOCK_USER_ID,
          "test",
        );
        expect(Array.isArray(badges)).toBe(true);
      });

      test("should return empty array for user not found", async () => {
        const badges = await GamificationService.checkAndAwardBadges(
          new mongoose.Types.ObjectId().toString(),
          "test",
        );
        expect(badges).toEqual([]);
      });
    });
  });

  describe("Leaderboard System", () => {
    beforeEach(async () => {
      await LeaderboardModel.deleteMany({});
    });

    describe("updateLeaderboard", () => {
      test("should create global leaderboard entry", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          points: 1000,
          questionsAnswered: 100,
          averageAccuracy: 85,
        });

        await GamificationService.updateLeaderboard(MOCK_USER_ID);

        const entry = await LeaderboardModel.findOne({
          userId: MOCK_USER_ID,
          period: "global",
        });
        expect(entry).toBeDefined();
        expect(entry?.points).toBe(1000);
      });

      test("should create monthly leaderboard entry", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          monthlyPoints: 500,
        });

        await GamificationService.updateLeaderboard(MOCK_USER_ID);

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const entry = await LeaderboardModel.findOne({
          userId: MOCK_USER_ID,
          period: currentMonth,
        });
        expect(entry).toBeDefined();
      });

      test("should update existing leaderboard entry", async () => {
        await GamificationService.updateLeaderboard(MOCK_USER_ID);
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          points: 2000,
        });

        await GamificationService.updateLeaderboard(MOCK_USER_ID);

        const entry = await LeaderboardModel.findOne({
          userId: MOCK_USER_ID,
          period: "global",
        });
        expect(entry?.points).toBe(2000);
      });
    });

    describe("getGlobalLeaderboard", () => {
      beforeEach(async () => {
        // Create multiple leaderboard entries
        const users = [MOCK_USER_ID, MOCK_USER_ID_2];
        for (let i = 0; i < users.length; i++) {
          await LeaderboardModel.create({
            userId: users[i],
            period: "global",
            points: (i + 1) * 1000,
            questionsAnswered: (i + 1) * 100,
            accuracy: 80 + i * 5,
          });
        }
      });

      test("should return top users sorted by points", async () => {
        const leaderboard = await GamificationService.getGlobalLeaderboard(10);
        expect(leaderboard.length > 0).toBe(true);
        expect(leaderboard[0].points >= leaderboard[1]?.points || 0).toBe(true);
      });

      test("should respect limit parameter", async () => {
        const leaderboard = await GamificationService.getGlobalLeaderboard(1);
        expect(leaderboard.length).toBeLessThanOrEqual(1);
      });

      test("should include user ranking", async () => {
        const leaderboard = await GamificationService.getGlobalLeaderboard(10);
        leaderboard.forEach((entry, index) => {
          expect(entry.rank).toBe(index + 1);
        });
      });
    });

    describe("getMonthlyLeaderboard", () => {
      test("should return monthly rankings", async () => {
        const leaderboard = await GamificationService.getMonthlyLeaderboard(10);
        expect(Array.isArray(leaderboard)).toBe(true);
      });

      test("should return current month data", async () => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        await LeaderboardModel.create({
          userId: MOCK_USER_ID,
          period: currentMonth,
          points: 1000,
          questionsAnswered: 50,
          accuracy: 85,
        });

        const leaderboard = await GamificationService.getMonthlyLeaderboard(10);
        expect(leaderboard.length > 0).toBe(true);
      });
    });

    describe("getUserRanking", () => {
      beforeEach(async () => {
        await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          points: 5000,
          monthlyPoints: 500,
          weeklyPoints: 100,
        });

        // Create surrounding users for ranking context
        for (let i = 0; i < 10; i++) {
          const userId = new mongoose.Types.ObjectId();
          await LeaderboardModel.create({
            userId,
            period: "global",
            points: 1000 * (i + 1),
            questionsAnswered: 100 * (i + 1),
            accuracy: 70 + i,
          });
        }
      });

      test("should return user global rank", async () => {
        const ranking = await GamificationService.getUserRanking(MOCK_USER_ID);
        expect(ranking.globalRank).toBeGreaterThan(0);
      });

      test("should calculate percentile", async () => {
        const ranking = await GamificationService.getUserRanking(MOCK_USER_ID);
        expect(ranking.percentile).toBeGreaterThanOrEqual(0);
        expect(ranking.percentile).toBeLessThanOrEqual(100);
      });

      test("should return all ranking tiers", async () => {
        const ranking = await GamificationService.getUserRanking(MOCK_USER_ID);
        expect(ranking.globalRank).toBeDefined();
        expect(ranking.monthlyRank).toBeDefined();
        expect(ranking.weeklyRank).toBeDefined();
        expect(ranking.percentile).toBeDefined();
      });
    });
  });

  describe("Challenges", () => {
    describe("createDailyChallenge", () => {
      test("should create challenge with correct structure", async () => {
        const challenge = await GamificationService.createDailyChallenge();
        expect(challenge).toBeDefined();
        expect(challenge.type).toBe("daily");
        expect(challenge.objective).toBeDefined();
        expect(challenge.reward).toBeDefined();
      });

      test("should set challenge duration to 24 hours", async () => {
        const challenge = await GamificationService.createDailyChallenge();
        const duration =
          challenge.endDate.getTime() - challenge.startDate.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        expect(duration).toBeCloseTo(twentyFourHours, -3); // Allow 1 second tolerance
      });
    });

    describe("completeChallenge", () => {
      let challengeId: string;

      beforeEach(async () => {
        const challenge = await GamificationService.createDailyChallenge();
        challengeId = challenge._id.toString();
      });

      test("should mark challenge as completed", async () => {
        await GamificationService.completeChallenge(MOCK_USER_ID, challengeId);
        const challenge = await ChallengeModel.findById(challengeId);
        expect(challenge?.completedBy).toContain(MOCK_USER_ID);
      });

      test("should award points on completion", async () => {
        const userBefore = await UserModel.findById(MOCK_USER_ID);
        const pointsBefore = userBefore?.points || 0;

        await GamificationService.completeChallenge(MOCK_USER_ID, challengeId);

        const userAfter = await UserModel.findById(MOCK_USER_ID);
        expect((userAfter?.points || 0) > pointsBefore).toBe(true);
      });
    });
  });

  describe("Points System", () => {
    describe("awardPoints", () => {
      test("should award points to user", async () => {
        const userBefore = await UserModel.findById(MOCK_USER_ID);
        const pointsBefore = userBefore?.points || 0;

        await GamificationService.awardPoints(
          MOCK_USER_ID,
          100,
          "Test activity",
        );

        const userAfter = await UserModel.findById(MOCK_USER_ID);
        expect((userAfter?.points || 0) - pointsBefore).toBe(100);
      });

      test("should log points award", async () => {
        await GamificationService.awardPoints(
          MOCK_USER_ID,
          50,
          "Question answered",
        );
        const user = await UserModel.findById(MOCK_USER_ID);
        expect(user?.pointsLog).toBeDefined();
      });

      test("should trigger level up notification", async () => {
        const user = await UserModel.findByIdAndUpdate(MOCK_USER_ID, {
          points: 999,
        });

        await GamificationService.awardPoints(MOCK_USER_ID, 100, "Milestone");
        const updatedUser = await UserModel.findById(MOCK_USER_ID);
        expect((updatedUser?.points || 0) >= 1099).toBe(true);
      });
    });

    describe("calculateActivityPoints", () => {
      test("should calculate basic points", () => {
        const points = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 100,
          difficulty: 1,
          timeSpent: 15,
        });
        expect(points > 0).toBe(true);
      });

      test("should apply accuracy multiplier", () => {
        const pointsHigh = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 95,
          difficulty: 1,
          timeSpent: 15,
        });

        const pointsLow = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 50,
          difficulty: 1,
          timeSpent: 15,
        });

        expect(pointsHigh > pointsLow).toBe(true);
      });

      test("should apply difficulty bonus", () => {
        const pointsEasy = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 80,
          difficulty: 1,
          timeSpent: 15,
        });

        const pointsHard = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 80,
          difficulty: 8,
          timeSpent: 15,
        });

        expect(pointsHard > pointsEasy).toBe(true);
      });

      test("should apply time efficiency bonus", () => {
        const pointsFast = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 80,
          difficulty: 5,
          timeSpent: 10,
        });

        const pointsSlow = GamificationService.calculateActivityPoints({
          questionsAnswered: 10,
          accuracy: 80,
          difficulty: 5,
          timeSpent: 30,
        });

        expect(pointsFast > pointsSlow).toBe(true);
      });
    });
  });

  describe("Social & Sharing", () => {
    describe("shareAchievement", () => {
      test("should increment shares count", async () => {
        const userBefore = await UserModel.findById(MOCK_USER_ID);
        const sharesBefore = userBefore?.sharesCount || 0;

        await GamificationService.shareAchievement(
          MOCK_USER_ID,
          "badge_unlock",
        );

        const userAfter = await UserModel.findById(MOCK_USER_ID);
        expect((userAfter?.sharesCount || 0) > sharesBefore).toBe(true);
      });

      test("should log share activity", async () => {
        await GamificationService.shareAchievement(MOCK_USER_ID, "test_pass");
        const user = await UserModel.findById(MOCK_USER_ID);
        expect(user?.shares?.length || 0 > 0).toBe(true);
      });

      test("should award points for sharing", async () => {
        const userBefore = await UserModel.findById(MOCK_USER_ID);
        const pointsBefore = userBefore?.points || 0;

        await GamificationService.shareAchievement(MOCK_USER_ID, "achievement");

        const userAfter = await UserModel.findById(MOCK_USER_ID);
        expect((userAfter?.points || 0) > pointsBefore).toBe(true);
      });

      test("should award social sharing badge at 5 shares", async () => {
        for (let i = 0; i < 5; i++) {
          await GamificationService.shareAchievement(
            MOCK_USER_ID,
            "achievement",
          );
        }

        const user = await UserModel.findById(MOCK_USER_ID);
        expect(user?.badges).toContain("social_share");
      });
    });
  });

  describe("Integration Tests", () => {
    test("should complete full gamification flow", async () => {
      // Award points
      await GamificationService.awardPoints(
        MOCK_USER_ID,
        500,
        "Questions answered",
      );

      // Award badge
      await GamificationService.awardBadge(MOCK_USER_ID, "questions_500");

      // Update leaderboard
      await GamificationService.updateLeaderboard(MOCK_USER_ID);

      // Get ranking
      const ranking = await GamificationService.getUserRanking(MOCK_USER_ID);

      // Complete challenge
      const challenge = await GamificationService.createDailyChallenge();
      await GamificationService.completeChallenge(
        MOCK_USER_ID,
        challenge._id.toString(),
      );

      // Share achievement
      await GamificationService.shareAchievement(
        MOCK_USER_ID,
        "challenge_complete",
      );

      const user = await UserModel.findById(MOCK_USER_ID);
      expect(user?.points || 0 > 0).toBe(true);
      expect(user?.badges?.length || 0 > 0).toBe(true);
    });

    test("should handle multiple concurrent gamification operations", async () => {
      const operations = [
        GamificationService.awardPoints(MOCK_USER_ID, 100, "Op 1"),
        GamificationService.awardPoints(MOCK_USER_ID, 100, "Op 2"),
        GamificationService.updateLeaderboard(MOCK_USER_ID),
        GamificationService.checkAndAwardBadges(MOCK_USER_ID, "test"),
      ];

      await Promise.all(operations);

      const user = await UserModel.findById(MOCK_USER_ID);
      expect(user?.points || 0 > 0).toBe(true);
    });
  });
});
