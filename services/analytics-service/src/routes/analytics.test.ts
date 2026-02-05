/**
 * Analytics Service Tests
 * Comprehensive test coverage for analytics calculations and routes
 */

import request from "supertest";
import express, { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import UserAnalytics from "../models/UserAnalytics";
import PerformanceMetricsService from "../services/performance-metrics.service";
import TrendAnalysisService from "../services/trend-analysis.service";
import PredictionService from "../services/prediction.service";
import analyticsRoutes from "../routes/analytics.routes";

let mongoServer: MongoMemoryServer;
let app: Express;

// Mock auth middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    id: req.params.userId || "test-user-id",
    isAdmin: false,
  };
  next();
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());

  // Register routes with mock auth
  app.use("/api/analytics", mockAuthMiddleware, analyticsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserAnalytics.deleteMany({});
});

describe("PerformanceMetricsService", () => {
  describe("calculateSummary", () => {
    it("should calculate correct summary for user with exams", () => {
      const analytics = {
        totalExamsAttempted: 10,
        averageScore: 75.5,
        highestScore: 95,
        lowestScore: 55,
        performanceHistory: [
          { score: 75, bloomLevel: "memory" },
          { score: 80, bloomLevel: "comprehension" },
          { score: 65, bloomLevel: "application" },
        ],
        totalStudyTime: 36000,
        timedModeStats: { attempts: 5, averageScore: 72 },
        tutorModeStats: { attempts: 3, averageScore: 78 },
        untimedModeStats: { attempts: 2, averageScore: 70 },
      } as any;

      const summary = PerformanceMetricsService.calculateSummary(analytics);

      expect(summary.totalExams).toBe(10);
      expect(summary.averageScore).toBe(75.5);
      expect(summary.studyTimeHours).toBe(10);
      expect(summary.scoreRange).toEqual({ min: 55, max: 95 });
      expect(summary.consistencyScore).toBeGreaterThan(0);
    });

    it("should handle empty performance history", () => {
      const analytics = {
        totalExamsAttempted: 0,
        averageScore: 0,
        performanceHistory: [],
      } as any;

      const summary = PerformanceMetricsService.calculateSummary(analytics);

      expect(summary.totalExams).toBe(0);
      expect(summary.averageScore).toBe(0);
    });
  });

  describe("analyzeByMode", () => {
    it("should analyze performance by exam mode", () => {
      const analytics = {
        timedModeStats: {
          attempts: 5,
          averageScore: 72,
          performanceHistory: [70, 75, 68, 74, 70],
        },
        tutorModeStats: {
          attempts: 3,
          averageScore: 78,
          performanceHistory: [75, 80, 79],
        },
        untimedModeStats: {
          attempts: 2,
          averageScore: 70,
          performanceHistory: [68, 72],
        },
      } as any;

      const analysis = PerformanceMetricsService.analyzeByMode(analytics);

      expect(analysis.timed).toBeDefined();
      expect(analysis.tutor).toBeDefined();
      expect(analysis.untimed).toBeDefined();
      expect(analysis.timed.attempts).toBe(5);
      expect(analysis.tutor.averageScore).toBe(78);
    });
  });

  describe("analyzeTimeEfficiency", () => {
    it("should calculate time efficiency metrics", () => {
      const analytics = {
        totalStudyTime: 36000,
        performanceHistory: [
          {
            timeSpent: 3600,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          { timeSpent: 3600, date: new Date() },
        ],
        totalExamsAttempted: 10,
      } as any;

      const efficiency =
        PerformanceMetricsService.analyzeTimeEfficiency(analytics);

      expect(efficiency.totalStudyTime).toBe(36000);
      expect(efficiency.averageTimePerExam).toBeGreaterThan(0);
      expect(efficiency.recommendedDailyTime).toBeGreaterThan(0);
    });
  });

  describe("identifyStrengthAreas", () => {
    it("should identify areas with high performance", () => {
      const analytics = {
        performanceHistory: [
          { bloomLevel: "memory", correctPercentage: 85 },
          { bloomLevel: "comprehension", correctPercentage: 75 },
          { bloomLevel: "application", correctPercentage: 90 },
        ],
      } as any;

      const strengths =
        PerformanceMetricsService.identifyStrengthAreas(analytics);

      expect(strengths.length).toBeGreaterThan(0);
      expect(strengths[0].correctPercentage).toBeGreaterThanOrEqual(80);
    });

    it("should return empty array if no strength areas", () => {
      const analytics = {
        performanceHistory: [
          { bloomLevel: "memory", correctPercentage: 60 },
          { bloomLevel: "comprehension", correctPercentage: 75 },
        ],
      } as any;

      const strengths =
        PerformanceMetricsService.identifyStrengthAreas(analytics);

      expect(strengths.length).toBeLessThanOrEqual(1);
    });
  });

  describe("identifyWeakAreas", () => {
    it("should identify areas with low performance", () => {
      const analytics = {
        performanceHistory: [
          { bloomLevel: "memory", correctPercentage: 85 },
          { bloomLevel: "comprehension", correctPercentage: 60 },
          { bloomLevel: "application", correctPercentage: 55 },
        ],
      } as any;

      const weakAreas = PerformanceMetricsService.identifyWeakAreas(analytics);

      expect(weakAreas.length).toBeGreaterThan(0);
      expect(weakAreas[0].correctPercentage).toBeLessThan(70);
      expect(weakAreas[0].recommendedQuestionCount).toBeGreaterThan(0);
    });
  });

  describe("calculateRecommendedStudyTime", () => {
    it("should recommend more study time for low scores", () => {
      const analytics = {
        averageScore: 60,
        totalExamsAttempted: 5,
      } as any;

      const recommendedTime =
        PerformanceMetricsService.calculateRecommendedStudyTime(analytics);

      expect(recommendedTime).toBeGreaterThan(45);
      expect(recommendedTime).toBeLessThanOrEqual(120);
    });

    it("should recommend less study time for high scores", () => {
      const analytics = {
        averageScore: 95,
        totalExamsAttempted: 20,
      } as any;

      const recommendedTime =
        PerformanceMetricsService.calculateRecommendedStudyTime(analytics);

      expect(recommendedTime).toBeGreaterThanOrEqual(45);
      expect(recommendedTime).toBeLessThanOrEqual(80);
    });
  });
});

describe("TrendAnalysisService", () => {
  describe("analyzeTrend", () => {
    it("should detect improving trend", () => {
      const performanceHistory = [
        {
          date: new Date("2024-01-01"),
          score: 50,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-08"),
          score: 55,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-15"),
          score: 60,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-22"),
          score: 65,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-29"),
          score: 70,
          examType: "practice",
          mode: "untimed",
        },
      ];

      const analysis = TrendAnalysisService.analyzeTrend(performanceHistory);

      expect(analysis.overall.direction).toBe("improving");
      expect(analysis.overall.momentum).toBeGreaterThan(0);
    });

    it("should detect declining trend", () => {
      const performanceHistory = [
        {
          date: new Date("2024-01-01"),
          score: 80,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-08"),
          score: 75,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-15"),
          score: 70,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-22"),
          score: 65,
          examType: "practice",
          mode: "untimed",
        },
      ];

      const analysis = TrendAnalysisService.analyzeTrend(performanceHistory);

      expect(analysis.overall.direction).toBe("declining");
      expect(analysis.overall.momentum).toBeLessThan(0);
    });

    it("should calculate volatility", () => {
      const performanceHistory = [
        {
          date: new Date("2024-01-01"),
          score: 50,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-08"),
          score: 90,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-15"),
          score: 55,
          examType: "practice",
          mode: "untimed",
        },
        {
          date: new Date("2024-01-22"),
          score: 85,
          examType: "practice",
          mode: "untimed",
        },
      ];

      const analysis = TrendAnalysisService.analyzeTrend(performanceHistory);

      expect(analysis.volatility).toBeGreaterThan(20);
    });
  });

  describe("calculateLearningVelocity", () => {
    it("should calculate positive learning velocity", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 50 },
        { date: new Date("2024-01-11"), score: 60 },
        { date: new Date("2024-01-21"), score: 70 },
        { date: new Date("2024-01-31"), score: 80 },
      ];

      const velocity =
        TrendAnalysisService.calculateLearningVelocity(performanceHistory);

      expect(velocity.ratePerDay).toBeGreaterThan(0);
      expect(velocity.ratePerExam).toBeGreaterThan(0);
    });

    it("should handle insufficient data", () => {
      const performanceHistory = [{ date: new Date(), score: 50 }];

      const velocity =
        TrendAnalysisService.calculateLearningVelocity(performanceHistory);

      expect(velocity.ratePerDay).toBe(0);
      expect(velocity.ratePerExam).toBe(0);
    });
  });

  describe("identifyPatterns", () => {
    it("should identify best performing exam type", () => {
      const performanceHistory = [
        { date: new Date(), score: 50, examType: "practice", mode: "untimed" },
        { date: new Date(), score: 60, examType: "practice", mode: "untimed" },
        { date: new Date(), score: 90, examType: "full-length", mode: "timed" },
        { date: new Date(), score: 95, examType: "full-length", mode: "timed" },
      ];

      const patterns =
        TrendAnalysisService.identifyPatterns(performanceHistory);

      expect(patterns.bestExamType).toBe("full-length");
      expect(patterns.averageScoreAtPeak).toBeGreaterThan(0);
    });
  });
});

describe("PredictionService", () => {
  describe("predict30DayScore", () => {
    it("should predict future score based on trend", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 50 },
        { date: new Date("2024-01-08"), score: 55 },
        { date: new Date("2024-01-15"), score: 60 },
        { date: new Date("2024-01-22"), score: 65 },
      ];

      const prediction =
        PredictionService.predict30DayScore(performanceHistory);

      expect(prediction.predictedScore).toBeGreaterThan(65);
      expect(prediction.confidenceInterval.low).toBeLessThan(
        prediction.predictedScore,
      );
      expect(prediction.confidenceInterval.high).toBeGreaterThan(
        prediction.predictedScore,
      );
    });

    it("should handle insufficient data", () => {
      const performanceHistory = [{ date: new Date(), score: 50 }];

      const prediction =
        PredictionService.predict30DayScore(performanceHistory);

      expect(prediction.predictedScore).toBe(0);
      expect(prediction.recommendation).toContain("More exams");
    });
  });

  describe("generateScoreProjection", () => {
    it("should generate score projections", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 50 },
        { date: new Date("2024-01-08"), score: 55 },
        { date: new Date("2024-01-15"), score: 60 },
        { date: new Date("2024-01-22"), score: 65 },
        { date: new Date("2024-01-29"), score: 70 },
      ];

      const projections = PredictionService.generateScoreProjection(
        performanceHistory,
        30,
        5,
      );

      expect(projections.length).toBeGreaterThan(0);
      expect(projections[0].days).toBe(5);
      expect(projections[projections.length - 1].days).toBeLessThanOrEqual(30);
    });

    it("should return empty array for insufficient data", () => {
      const performanceHistory = [{ date: new Date(), score: 50 }];

      const projections =
        PredictionService.generateScoreProjection(performanceHistory);

      expect(projections.length).toBe(0);
    });
  });

  describe("calculateScoreCeiling", () => {
    it("should estimate realistic score ceiling", () => {
      const performanceHistory = [
        { score: 60 },
        { score: 70 },
        { score: 85 },
        { score: 90 },
        { score: 88 },
      ];

      const ceiling =
        PredictionService.calculateScoreCeiling(performanceHistory);

      expect(ceiling.ceiling).toBeGreaterThan(85);
      expect(ceiling.ceiling).toBeLessThanOrEqual(100);
      expect(ceiling.confidence).toBeGreaterThan(0);
    });
  });

  describe("calculateStudyTimeROI", () => {
    it("should calculate positive ROI for improving scores", () => {
      const performanceHistory = [
        { score: 50, studyTimeMinutes: 60 },
        { score: 65, studyTimeMinutes: 60 },
        { score: 80, studyTimeMinutes: 60 },
      ];

      const roi = PredictionService.calculateStudyTimeROI(performanceHistory);

      expect(roi.scorePerHour).toBeGreaterThan(0);
      expect(roi.ROI).toBeGreaterThan(0);
    });

    it("should handle zero study time", () => {
      const performanceHistory = [
        { score: 50, studyTimeMinutes: 0 },
        { score: 50, studyTimeMinutes: 0 },
      ];

      const roi = PredictionService.calculateStudyTimeROI(performanceHistory);

      expect(roi.scorePerHour).toBe(0);
    });
  });

  describe("predictTimeToTargetScore", () => {
    it("should predict days to reach target score", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 50 },
        { date: new Date("2024-01-08"), score: 55 },
        { date: new Date("2024-01-15"), score: 60 },
        { date: new Date("2024-01-22"), score: 65 },
      ];

      const prediction = PredictionService.predictTimeToTargetScore(
        performanceHistory,
        80,
      );

      expect(prediction.daysToTarget).toBeGreaterThan(0);
      expect(prediction.targetDate).toBeInstanceOf(Date);
      expect(prediction.isAchievable).toBe(true);
    });

    it("should mark unachievable targets", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 80 },
        { date: new Date("2024-01-08"), score: 75 },
        { date: new Date("2024-01-15"), score: 70 },
      ];

      const prediction = PredictionService.predictTimeToTargetScore(
        performanceHistory,
        95,
      );

      expect(prediction.isAchievable).toBe(false);
    });
  });

  describe("identifyOptimalStudyFrequency", () => {
    it("should recommend study frequency based on progress", () => {
      const performanceHistory = [
        { date: new Date("2024-01-01"), score: 50 },
        { date: new Date("2024-01-02"), score: 52 },
        { date: new Date("2024-01-03"), score: 55 },
        { date: new Date("2024-01-04"), score: 58 },
        { date: new Date("2024-01-05"), score: 62 },
        { date: new Date("2024-01-06"), score: 65 },
        { date: new Date("2024-01-07"), score: 68 },
        { date: new Date("2024-01-08"), score: 72 },
      ];

      const frequency =
        PredictionService.identifyOptimalStudyFrequency(performanceHistory);

      expect(frequency.recommendedExamsPerWeek).toBeGreaterThan(0);
      expect(frequency.recommendedExamsPerWeek).toBeLessThanOrEqual(5);
    });
  });
});

describe("Analytics Routes", () => {
  describe("GET /api/analytics/:userId/summary", () => {
    it("should return user summary", async () => {
      const userId = "test-user-123";

      // Create test analytics
      const analytics = new UserAnalytics({
        userId,
        totalExamsAttempted: 10,
        averageScore: 75,
        performanceHistory: Array(10).fill({ score: 75 }),
      });
      await analytics.save();

      const response = await request(app)
        .get(`/api/analytics/${userId}/summary`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalExams).toBe(10);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/analytics/non-existent-user/summary")
        .expect(404);

      expect(response.body.error).toBe("Analytics not found");
    });
  });

  describe("GET /api/analytics/:userId/performance", () => {
    it("should return detailed performance metrics", async () => {
      const userId = "test-user-456";

      const analytics = new UserAnalytics({
        userId,
        totalExamsAttempted: 5,
        averageScore: 70,
        performanceHistory: [{ score: 70 }],
      });
      await analytics.save();

      const response = await request(app)
        .get(`/api/analytics/${userId}/performance`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
      expect(response.body.summary).toBeDefined();
      expect(response.body.byMode).toBeDefined();
      expect(response.body.timeEfficiency).toBeDefined();
    });
  });

  describe("GET /api/analytics/:userId/trends", () => {
    it("should return trend analysis", async () => {
      const userId = "test-user-789";

      const analytics = new UserAnalytics({
        userId,
        performanceHistory: [
          {
            date: new Date("2024-01-01"),
            score: 50,
            examType: "practice",
            mode: "untimed",
          },
          {
            date: new Date("2024-01-08"),
            score: 60,
            examType: "practice",
            mode: "untimed",
          },
          {
            date: new Date("2024-01-15"),
            score: 70,
            examType: "practice",
            mode: "untimed",
          },
        ],
      });
      await analytics.save();

      const response = await request(app)
        .get(`/api/analytics/${userId}/trends`)
        .expect(200);

      expect(response.body.trendAnalysis).toBeDefined();
      expect(response.body.learningVelocity).toBeDefined();
      expect(response.body.patterns).toBeDefined();
    });
  });

  describe("GET /api/analytics/:userId/predictions", () => {
    it("should return score predictions", async () => {
      const userId = "test-user-pred";

      const analytics = new UserAnalytics({
        userId,
        performanceHistory: [
          { date: new Date("2024-01-01"), score: 50 },
          { date: new Date("2024-01-08"), score: 60 },
          { date: new Date("2024-01-15"), score: 70 },
        ],
      });
      await analytics.save();

      const response = await request(app)
        .get(`/api/analytics/${userId}/predictions`)
        .expect(200);

      expect(response.body.prediction30Days).toBeDefined();
      expect(response.body.projection).toBeDefined();
      expect(response.body.scoreCeiling).toBeDefined();
    });
  });

  describe("GET /api/analytics/:userId/recommendations", () => {
    it("should return personalized recommendations", async () => {
      const userId = "test-user-rec";

      const analytics = new UserAnalytics({
        userId,
        totalExamsAttempted: 3,
        averageScore: 60,
        performanceHistory: [
          { bloomLevel: "memory", correctPercentage: 65 },
          { bloomLevel: "comprehension", correctPercentage: 55 },
        ],
      });
      await analytics.save();

      const response = await request(app)
        .get(`/api/analytics/${userId}/recommendations`)
        .expect(200);

      expect(response.body.recommendations).toBeDefined();
      expect(response.body.recommendations.focusAreas).toBeDefined();
      expect(response.body.recommendations.nextSteps).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/analytics/:userId/sync", () => {
    it("should sync exam results to analytics", async () => {
      const userId = "test-user-sync";

      const response = await request(app)
        .post(`/api/analytics/${userId}/sync`)
        .send({
          examResult: {
            examType: "practice",
            mode: "untimed",
            score: 85,
            correctPercentage: 85,
            timeSpent: 1800,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics.totalExamsAttempted).toBe(1);
      expect(response.body.analytics.averageScore).toBe(85);

      // Verify stored
      const stored = await UserAnalytics.findOne({ userId });
      expect(stored).toBeDefined();
      expect((stored as any).performanceHistory.length).toBe(1);
    });
  });
});

export {};
