/**
 * Analytics Routes
 * Provides comprehensive analytics endpoints for dashboard
 */

import express, { Router, Response } from "express";
import { Document } from "mongodb";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { validateObjectId } from "../middleware/validation";
import UserAnalytics from "../models/UserAnalytics";
import PerformanceMetricsService from "../services/performance-metrics.service";
import TrendAnalysisService from "../services/trend-analysis.service";
import PredictionService from "../services/prediction.service";

const router: Router = express.Router();

/**
 * GET /api/analytics/:userId/summary
 * Get dashboard summary for a user
 */
router.get(
  "/:userId/summary",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await UserAnalytics.findOne({ userId }).lean();

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      // Calculate summary metrics
      const summary = PerformanceMetricsService.calculateSummary(
        analytics as any,
      );

      return res.json({
        userId,
        summary,
        lastUpdated: new Date(),
        nextUpdateIn: 3600000, // milliseconds
      });
    } catch (error) {
      console.error("Summary endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/analytics/:userId/performance
 * Get detailed performance metrics
 */
router.get(
  "/:userId/performance",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { mode, examType } = req.query;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await UserAnalytics.findOne({ userId }).lean();

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      const metricsAnalytics = analytics as any;

      const response: Record<string, any> = {
        userId,
        summary: PerformanceMetricsService.calculateSummary(metricsAnalytics),
        byMode: PerformanceMetricsService.analyzeByMode(metricsAnalytics),
        byExamType:
          PerformanceMetricsService.analyzeByExamType(metricsAnalytics),
        timeEfficiency:
          PerformanceMetricsService.analyzeTimeEfficiency(metricsAnalytics),
        strengthAreas:
          PerformanceMetricsService.identifyStrengthAreas(metricsAnalytics),
        weakAreas:
          PerformanceMetricsService.identifyWeakAreas(metricsAnalytics),
      };

      // Filter by mode if specified
      if (mode) {
        response.modeFilter = response.byMode[mode as string];
      }

      // Filter by exam type if specified
      if (examType) {
        response.examTypeFilter = response.byExamType.get(examType as string);
      }

      return res.json(response);
    } catch (error) {
      console.error("Performance endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/analytics/:userId/trends
 * Get trend analysis
 */
router.get(
  "/:userId/trends",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await UserAnalytics.findOne({ userId }).lean();

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      const metricsAnalytics = analytics as any;

      // Convert performance history to TrendData format
      const trendData = (metricsAnalytics.performanceHistory || []).map(
        (perf: any) => ({
          date: perf.date,
          score: perf.score,
          examType: perf.examType,
          mode: perf.mode,
        }),
      );

      const trendAnalysis = TrendAnalysisService.analyzeTrend(trendData);
      const velocity =
        TrendAnalysisService.calculateLearningVelocity(trendData);
      const patterns = TrendAnalysisService.identifyPatterns(trendData);
      const report = TrendAnalysisService.generateTrendReport(trendData);

      return res.json({
        userId,
        trendAnalysis,
        learningVelocity: velocity,
        patterns,
        report,
      });
    } catch (error) {
      console.error("Trends endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/analytics/:userId/predictions
 * Get score predictions and projections
 */
router.get(
  "/:userId/predictions",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { targetScore } = req.query;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await UserAnalytics.findOne({ userId }).lean();

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      const metricsAnalytics = analytics as any;

      // Convert performance history to prediction format
      const historyData = (metricsAnalytics.performanceHistory || []).map(
        (perf: any) => ({
          date: perf.date,
          score: perf.score,
        }),
      );

      const prediction30Days = PredictionService.predict30DayScore(historyData);
      const projection = PredictionService.generateScoreProjection(historyData);
      const ceiling = PredictionService.calculateScoreCeiling(
        metricsAnalytics.performanceHistory || [],
      );
      const roiData = historyData.map((h: any, i: number) => ({
        ...h,
        studyTimeMinutes:
          (metricsAnalytics.performanceHistory?.[i]?.studyTime || 0) / 60,
      }));
      const roi = PredictionService.calculateStudyTimeROI(roiData);
      const frequency =
        PredictionService.identifyOptimalStudyFrequency(historyData);

      const response: Record<string, any> = {
        userId,
        prediction30Days,
        projection,
        scoreCeiling: ceiling,
        studyTimeROI: roi,
        optimalStudyFrequency: frequency,
      };

      // If target score provided, calculate time to target
      if (targetScore) {
        const timeToTarget = PredictionService.predictTimeToTargetScore(
          historyData,
          parseInt(targetScore as string),
        );
        response.timeToTarget = timeToTarget;
      }

      return res.json(response);
    } catch (error) {
      console.error("Predictions endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/analytics/:userId/recommendations
 * Get personalized recommendations
 */
router.get(
  "/:userId/recommendations",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const analytics = await UserAnalytics.findOne({ userId }).lean();

      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      const metricsAnalytics = analytics as any;

      // Generate recommendations from multiple analyses
      const weakAreas =
        PerformanceMetricsService.identifyWeakAreas(metricsAnalytics);
      const studyTime =
        PerformanceMetricsService.calculateRecommendedStudyTime(
          metricsAnalytics,
        );

      const trendData = (metricsAnalytics.performanceHistory || []).map(
        (perf: any) => ({
          date: perf.date,
          score: perf.score,
          examType: perf.examType,
          mode: perf.mode,
        }),
      );

      const trendReport = TrendAnalysisService.generateTrendReport(trendData);

      const recommendations = {
        focusAreas: weakAreas.map((area) => ({
          area: area.area,
          currentAccuracy: `${area.correctPercentage}%`,
          recommendedQuestions: area.recommendedQuestionCount,
          reason: "This area needs improvement",
        })),
        studyTime: {
          recommendedMinutesPerDay: studyTime,
          reason: "Based on your current performance and exam count",
        },
        trendInsights: trendReport.recommendations,
        nextSteps: generateNextSteps(metricsAnalytics, weakAreas, studyTime),
      };

      return res.json({
        userId,
        recommendations,
        generatedAt: new Date(),
      });
    } catch (error) {
      console.error("Recommendations endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/analytics/:userId/comparison
 * Get peer comparison and benchmarking
 */
router.get(
  "/:userId/comparison",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const userAnalytics = await UserAnalytics.findOne({ userId }).lean();

      if (!userAnalytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }

      // Get aggregate statistics for all users
      const allAnalytics = await UserAnalytics.find({}).lean();

      const userMetrics = PerformanceMetricsService.calculateSummary(
        userAnalytics as any,
      );
      const allAverageScore =
        allAnalytics.length > 0
          ? allAnalytics.reduce(
              (sum, a: any) => sum + (a.averageScore || 0),
              0,
            ) / allAnalytics.length
          : 0;

      const allAverageExams =
        allAnalytics.length > 0
          ? allAnalytics.reduce(
              (sum, a: any) => sum + (a.totalExamsAttempted || 0),
              0,
            ) / allAnalytics.length
          : 0;

      const percentileRank =
        allAnalytics.length > 0
          ? (
              (allAnalytics.filter(
                (a: any) => (a.averageScore || 0) < userMetrics.averageScore,
              ).length /
                allAnalytics.length) *
              100
            ).toFixed(1)
          : "0";

      return res.json({
        userId,
        userMetrics,
        benchmarks: {
          averageScoreAllUsers: Math.round(allAverageScore * 100) / 100,
          averageExamsAllUsers: Math.round(allAverageExams * 100) / 100,
          userPercentile: `${percentileRank}%`,
          totalComparingUsers: allAnalytics.length,
        },
        ranking: {
          position:
            allAnalytics.filter(
              (a: any) => (a.averageScore || 0) > userMetrics.averageScore,
            ).length + 1,
          outOf: allAnalytics.length,
        },
      });
    } catch (error) {
      console.error("Comparison endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/analytics/:userId/sync
 * Sync analytics with test results
 */
router.post(
  "/:userId/sync",
  authenticateToken,
  validateObjectId("userId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { examResult } = req.body;

      // Verify user is syncing their own analytics
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!examResult) {
        return res.status(400).json({ error: "examResult is required" });
      }

      // Update analytics with new exam result
      let analytics = await UserAnalytics.findOne({ userId });

      if (!analytics) {
        analytics = new UserAnalytics({ userId });
      }

      // Update performance history
      (analytics as any).performanceHistory =
        (analytics as any).performanceHistory || [];
      (analytics as any).performanceHistory.push({
        examType: examResult.examType || "general",
        mode: examResult.mode || "untimed",
        score: examResult.score,
        correctPercentage: examResult.correctPercentage || 0,
        bloomDistribution: examResult.bloomDistribution,
        timeSpent: examResult.timeSpent,
        date: new Date(),
      });

      // Update summary metrics
      const scores = (analytics as any).performanceHistory.map(
        (p: any) => p.score,
      );
      (analytics as any).totalExamsAttempted = scores.length;
      (analytics as any).averageScore =
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      (analytics as any).highestScore = Math.max(...scores);
      (analytics as any).lowestScore = Math.min(...scores);

      await analytics.save();

      return res.json({
        success: true,
        message: "Analytics synced successfully",
        analytics: {
          totalExamsAttempted: (analytics as any).totalExamsAttempted,
          averageScore: (analytics as any).averageScore,
        },
      });
    } catch (error) {
      console.error("Sync endpoint error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Helper function to generate next steps
function generateNextSteps(
  analytics: any,
  weakAreas: any[],
  recommendedStudyTime: number,
): string[] {
  const steps: string[] = [];

  if ((analytics.totalExamsAttempted || 0) < 10) {
    steps.push(
      "Complete at least 10 exams to establish a performance baseline",
    );
  }

  if (weakAreas.length > 0) {
    steps.push(
      `Focus on improving ${weakAreas[0].area} - your current accuracy is ${weakAreas[0].correctPercentage}%`,
    );
  }

  if ((analytics.averageScore || 0) < 70) {
    steps.push(
      "Try the Tutor mode for personalized hints and immediate feedback",
    );
  }

  if (recommendedStudyTime > 60) {
    steps.push(
      `Allocate ${recommendedStudyTime} minutes daily for optimal progress`,
    );
  }

  steps.push("Review practice questions from your weak areas");
  steps.push("Take timed mode exams to simulate real testing conditions");

  return steps;
}

export default router;
