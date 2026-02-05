/**
 * Analytics Service Test Suite
 *
 * Tests for:
 * - Dashboard metrics calculation
 * - User performance tracking
 * - Question difficulty analysis
 * - Test statistics
 * - Trend analysis
 * - Data aggregation
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { AnalyticsService } from "../services/analyticsService";
import { AnalyticsEvent } from "../models/AnalyticsEvent";

describe("Analytics Service", () => {
  const analyticsService = new AnalyticsService();

  beforeAll(async () => {
    // Clear test data
    await AnalyticsEvent.deleteMany({});
  });

  afterAll(async () => {
    await AnalyticsEvent.deleteMany({});
  });

  describe("Track Events", () => {
    it("should track user activity event", async () => {
      const event = await analyticsService.trackEvent({
        userId: "user_1",
        eventType: "test_started",
        testId: "test_1",
        timestamp: new Date(),
      });

      expect(event).toBeDefined();
      expect(event.userId).toBe("user_1");
      expect(event.eventType).toBe("test_started");
    });

    it("should track answer submission event", async () => {
      const event = await analyticsService.trackEvent({
        userId: "user_2",
        eventType: "answer_submitted",
        attemptId: "attempt_1",
        questionId: "question_1",
        isCorrect: true,
        timeSpent: 45,
        timestamp: new Date(),
      });

      expect(event.eventType).toBe("answer_submitted");
      expect(event.isCorrect).toBe(true);
    });

    it("should track test completion event", async () => {
      const event = await analyticsService.trackEvent({
        userId: "user_3",
        eventType: "test_completed",
        testId: "test_2",
        score: 85,
        passed: true,
        timeSpent: 3600,
        timestamp: new Date(),
      });

      expect(event.eventType).toBe("test_completed");
      expect(event.score).toBe(85);
    });
  });

  describe("Dashboard Metrics", () => {
    beforeAll(async () => {
      // Create sample events
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await analyticsService.trackEvent({
        userId: "user_1",
        eventType: "test_started",
        testId: "test_1",
        timestamp: now,
      });

      await analyticsService.trackEvent({
        userId: "user_2",
        eventType: "test_started",
        testId: "test_2",
        timestamp: now,
      });

      await analyticsService.trackEvent({
        userId: "user_1",
        eventType: "test_completed",
        testId: "test_1",
        score: 90,
        passed: true,
        timestamp: now,
      });

      await analyticsService.trackEvent({
        userId: "user_3",
        eventType: "test_completed",
        testId: "test_2",
        score: 45,
        passed: false,
        timestamp: yesterday,
      });
    });

    it("should calculate active users metric", async () => {
      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics.activeUsers).toBeGreaterThan(0);
      expect(typeof metrics.activeUsers).toBe("number");
    });

    it("should calculate tests completed metric", async () => {
      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics.testsCompleted).toBeGreaterThan(0);
    });

    it("should calculate average score metric", async () => {
      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics.averageScore).toBeGreaterThan(0);
      expect(metrics.averageScore).toBeLessThanOrEqual(100);
    });

    it("should calculate pass rate metric", async () => {
      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics.passRate).toBeGreaterThanOrEqual(0);
      expect(metrics.passRate).toBeLessThanOrEqual(100);
    });

    it("should include time period in metrics", async () => {
      const metrics = await analyticsService.getDashboardMetrics({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(metrics.period).toBeDefined();
    });
  });

  describe("User Performance Analytics", () => {
    it("should get user overall performance", async () => {
      const userId = "user_perf_1";

      // Track some attempts
      await analyticsService.trackEvent({
        userId,
        eventType: "test_completed",
        testId: "test_1",
        score: 85,
        passed: true,
        timestamp: new Date(),
      });

      await analyticsService.trackEvent({
        userId,
        eventType: "test_completed",
        testId: "test_2",
        score: 75,
        passed: true,
        timestamp: new Date(),
      });

      const performance = await analyticsService.getUserPerformance(userId);

      expect(performance).toBeDefined();
      expect(performance.avgScore).toBe(80);
      expect(performance.totalTests).toBe(2);
      expect(performance.passedTests).toBe(2);
    });

    it("should calculate user progress over time", async () => {
      const userId = "user_progress_1";

      const progress = await analyticsService.getUserProgress(userId, {
        days: 30,
      });

      expect(progress).toBeDefined();
      expect(Array.isArray(progress.dailyData)).toBe(true);
    });

    it("should identify user strengths and weaknesses", async () => {
      const userId = "user_strength_1";

      // Track answers to different topics
      await analyticsService.trackEvent({
        userId,
        eventType: "answer_submitted",
        subject: "Math",
        isCorrect: true,
        timestamp: new Date(),
      });

      await analyticsService.trackEvent({
        userId,
        eventType: "answer_submitted",
        subject: "Science",
        isCorrect: false,
        timestamp: new Date(),
      });

      const analysis = await analyticsService.getSubjectAnalysis(userId);

      expect(analysis).toBeDefined();
      expect(analysis.Math).toBeDefined();
      expect(analysis.Science).toBeDefined();
    });
  });

  describe("Question Difficulty Analysis", () => {
    it("should calculate question difficulty based on performance", async () => {
      const questionId = "question_diff_1";

      // Track 10 attempts, 3 correct
      for (let i = 0; i < 10; i++) {
        await analyticsService.trackEvent({
          userId: `user_${i}`,
          eventType: "answer_submitted",
          questionId,
          isCorrect: i < 3,
          timestamp: new Date(),
        });
      }

      const difficulty =
        await analyticsService.getQuestionDifficulty(questionId);

      expect(difficulty).toBeDefined();
      expect(difficulty.successRate).toBe(30);
      expect(difficulty.estimatedLevel).toBeDefined();
    });

    it("should identify discriminating questions", async () => {
      const questionId = "question_disc_1";

      const analysis =
        await analyticsService.getQuestionDiscrimination(questionId);

      expect(analysis).toBeDefined();
      expect(analysis.discriminationIndex).toBeDefined();
    });
  });

  describe("Test Statistics", () => {
    let testId: string;

    beforeAll(() => {
      testId = "test_stats_1";
    });

    it("should aggregate test attempt statistics", async () => {
      // Create sample attempts
      for (let i = 0; i < 5; i++) {
        await analyticsService.trackEvent({
          userId: `user_${i}`,
          eventType: "test_completed",
          testId,
          score: 60 + i * 10,
          passed: i < 4,
          timeSpent: 2400 + i * 300,
          timestamp: new Date(),
        });
      }

      const stats = await analyticsService.getTestStatistics(testId);

      expect(stats).toBeDefined();
      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.averageScore).toBeGreaterThan(0);
      expect(stats.passRate).toBeGreaterThan(0);
      expect(stats.averageTime).toBeGreaterThan(0);
    });

    it("should compare test difficulty vs student performance", async () => {
      const analysis = await analyticsService.compareTestToDifficulty(testId);

      expect(analysis).toBeDefined();
      expect(analysis.testAverageDifficulty).toBeDefined();
      expect(analysis.studentPerformanceVsDifficulty).toBeDefined();
    });
  });

  describe("Trend Analysis", () => {
    it("should calculate performance trends over time", async () => {
      const userId = "user_trends_1";

      const trends = await analyticsService.getPerformanceTrends(userId);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends.weeklyTrend)).toBe(true);
      expect(Array.isArray(trends.monthlyTrend)).toBe(true);
    });

    it("should identify learning patterns", async () => {
      const userId = "user_pattern_1";

      const patterns = await analyticsService.getLearningPatterns(userId);

      expect(patterns).toBeDefined();
      expect(patterns.mostActiveTimes).toBeDefined();
      expect(patterns.preferredSubjects).toBeDefined();
      expect(patterns.improvementRate).toBeDefined();
    });
  });

  describe("Cohort Analysis", () => {
    it("should compare user to cohort", async () => {
      const userId = "user_cohort_1";
      const testId = "test_cohort_1";

      const comparison = await analyticsService.getCohortComparison(
        userId,
        testId,
      );

      expect(comparison).toBeDefined();
      expect(comparison.userScore).toBeDefined();
      expect(comparison.cohortAverage).toBeDefined();
      expect(comparison.percentile).toBeDefined();
    });

    it("should generate cohort statistics", async () => {
      const testId = "test_cohort_2";

      const cohortStats = await analyticsService.getCohortStatistics(testId);

      expect(cohortStats).toBeDefined();
      expect(cohortStats.totalStudents).toBeGreaterThanOrEqual(0);
      expect(cohortStats.scoreDistribution).toBeDefined();
    });
  });

  describe("Custom Reports", () => {
    it("should generate user performance report", async () => {
      const userId = "user_report_1";

      const report = await analyticsService.generateUserReport(userId);

      expect(report).toBeDefined();
      expect(report.userId).toBe(userId);
      expect(report.summary).toBeDefined();
      expect(report.detailedStats).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });

    it("should generate test performance report", async () => {
      const testId = "test_report_1";

      const report = await analyticsService.generateTestReport(testId);

      expect(report).toBeDefined();
      expect(report.testId).toBe(testId);
      expect(report.summary).toBeDefined();
      expect(report.questionAnalysis).toBeDefined();
    });

    it("should export analytics data", async () => {
      const data = await analyticsService.exportAnalytics({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        format: "csv",
      });

      expect(data).toBeDefined();
      expect(typeof data).toBe("string");
    });
  });

  describe("Real-time Analytics", () => {
    it("should track real-time user activity", async () => {
      const userId = "user_realtime_1";

      await analyticsService.trackEvent({
        userId,
        eventType: "question_viewed",
        questionId: "q_1",
        timestamp: new Date(),
      });

      const activity = await analyticsService.getRealtimeActivity(userId);

      expect(activity).toBeDefined();
      expect(activity.currentActivity).toBeDefined();
      expect(activity.lastUpdate).toBeDefined();
    });

    it("should provide session insights", async () => {
      const userId = "user_session_1";

      const session = await analyticsService.getSessionInsights(userId);

      expect(session).toBeDefined();
      expect(session.sessionDuration).toBeDefined();
      expect(session.questionsAttempted).toBeDefined();
      expect(session.correctAnswers).toBeDefined();
    });
  });

  describe("Data Aggregation", () => {
    it("should aggregate metrics by time period", async () => {
      const metrics = await analyticsService.aggregateMetrics("daily", {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics[0]).toHaveProperty("date");
      expect(metrics[0]).toHaveProperty("value");
    });

    it("should aggregate metrics by subject", async () => {
      const metrics = await analyticsService.aggregateMetricsBySubject();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe("object");
    });
  });
});
