/**
 * AI Service Routes
 *
 * Express routes for AI-powered features:
 * - Question recommendations
 * - Adaptive learning paths
 * - Performance predictions
 * - Plagiarism detection
 * - Smart test scheduling
 */

import { Router, Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { authenticate, authorize } from "../middleware/auth";
import QuestionRecommenderService from "../services/questionRecommenderService";
import AdaptiveLearningPathsService from "../services/adaptiveLearningService";
import PerformancePredictionService from "../services/performancePredictionService";
import PlagiarismDetectionService from "../services/plagiarismDetectionService";
import SmartTestSchedulingService from "../services/smartSchedulingService";
import { Logger } from "winston";

const router = Router();

// Middleware
const logger = container.resolve<Logger>("Logger");
const questionRecommender = container.resolve(QuestionRecommenderService);
const adaptiveLearning = container.resolve(AdaptiveLearningPathsService);
const performancePrediction = container.resolve(PerformancePredictionService);
const plagiarismDetection = container.resolve(PlagiarismDetectionService);
const smartScheduling = container.resolve(SmartTestSchedulingService);

// Error handler wrapper
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ========== QUESTION RECOMMENDER ROUTES ==========

/**
 * GET /api/ai/recommendations
 * Get personalized question recommendations for current user
 */
router.get(
  "/recommendations",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { count = 5, subject, difficulty, focusOnWeakness } = req.query;
    const userId = req.user.id;

    const recommendations = await questionRecommender.getRecommendations(
      userId,
      parseInt(count as string),
      {
        subject: subject as string,
        difficulty: difficulty as string,
        focusOnWeakness: focusOnWeakness === "true",
      },
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  }),
);

/**
 * GET /api/ai/recommendations/cohort
 * Get recommendations based on similar students
 */
router.get(
  "/recommendations/cohort",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { count = 5 } = req.query;
    const userId = req.user.id;

    const recommendations = await questionRecommender.getCohortRecommendations(
      userId,
      parseInt(count as string),
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  }),
);

/**
 * GET /api/ai/recommendations/analytics
 * Get learning analytics for recommendations
 */
router.get(
  "/recommendations/analytics",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const analytics = await questionRecommender.getLearningAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
    });
  }),
);

// ========== ADAPTIVE LEARNING PATHS ROUTES ==========

/**
 * POST /api/ai/learning-paths
 * Create adaptive learning path
 */
router.post(
  "/learning-paths",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { subject, targetLevel = "intermediate" } = req.body;
    const userId = req.user.id;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: "Subject is required",
      });
    }

    const path = await adaptiveLearning.createAdaptivePath(
      userId,
      subject,
      targetLevel,
    );

    res.status(201).json({
      success: true,
      data: path,
    });
  }),
);

/**
 * GET /api/ai/learning-paths/:pathId
 * Get learning path details
 */
router.get(
  "/learning-paths/:pathId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { pathId } = req.params;

    const path = await adaptiveLearning.getAdaptivePath(pathId);

    res.json({
      success: true,
      data: path,
    });
  }),
);

/**
 * PUT /api/ai/learning-paths/:pathId/progress
 * Update learning path progress
 */
router.put(
  "/learning-paths/:pathId/progress",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { pathId } = req.params;
    const { nodeId, score } = req.body;
    const userId = req.user.id;

    if (!nodeId || score === undefined) {
      return res.status(400).json({
        success: false,
        error: "NodeId and score are required",
      });
    }

    const updatedPath = await adaptiveLearning.updatePathProgress(
      pathId,
      userId,
      nodeId,
      score,
    );

    res.json({
      success: true,
      data: updatedPath,
    });
  }),
);

/**
 * GET /api/ai/learning-paths/:pathId/next-steps
 * Get next recommended steps
 */
router.get(
  "/learning-paths/:pathId/next-steps",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { pathId } = req.params;
    const userId = req.user.id;

    const nextSteps = await adaptiveLearning.getNextSteps(pathId, userId);

    res.json({
      success: true,
      data: nextSteps,
    });
  }),
);

/**
 * GET /api/ai/learning-paths/:pathId/analytics
 * Get learning path analytics
 */
router.get(
  "/learning-paths/:pathId/analytics",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { pathId } = req.params;

    const analytics = await adaptiveLearning.getPathAnalytics(pathId);

    res.json({
      success: true,
      data: analytics,
    });
  }),
);

// ========== PERFORMANCE PREDICTION ROUTES ==========

/**
 * POST /api/ai/predictions/test-score
 * Predict test score
 */
router.post(
  "/predictions/test-score",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.body;
    const userId = req.user.id;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: "TestId is required",
      });
    }

    const prediction = await performancePrediction.predictTestScore(
      userId,
      testId,
    );

    res.json({
      success: true,
      data: prediction,
    });
  }),
);

/**
 * GET /api/ai/predictions/interventions
 * Get intervention needs
 */
router.get(
  "/predictions/interventions",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const interventions =
      await performancePrediction.predictInterventionNeeds(userId);

    res.json({
      success: true,
      data: interventions,
      count: interventions.length,
    });
  }),
);

/**
 * GET /api/ai/predictions/alerts
 * Get performance alerts
 */
router.get(
  "/predictions/alerts",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const alerts = await performancePrediction.getPerformanceAlerts(userId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  }),
);

// ========== PLAGIARISM DETECTION ROUTES ==========

/**
 * POST /api/ai/plagiarism/check
 * Check essay for plagiarism
 */
router.post(
  "/plagiarism/check",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { essayId, essayText, sources } = req.body;

    if (!essayId || !essayText) {
      return res.status(400).json({
        success: false,
        error: "EssayId and essayText are required",
      });
    }

    const result = await plagiarismDetection.checkPlagiarism(
      essayId,
      essayText,
      sources,
    );

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * POST /api/ai/plagiarism/detect-paraphrasing
 * Detect paraphrasing similarity
 */
router.post(
  "/plagiarism/detect-paraphrasing",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { essayText, sourceText } = req.body;

    if (!essayText || !sourceText) {
      return res.status(400).json({
        success: false,
        error: "EssayText and sourceText are required",
      });
    }

    const paraphrasingScore = await plagiarismDetection.detectParaphrasing(
      essayText,
      sourceText,
    );

    res.json({
      success: true,
      data: {
        paraphrasingScore,
        message:
          paraphrasingScore > 70
            ? "High similarity detected"
            : "Low similarity detected",
      },
    });
  }),
);

/**
 * POST /api/ai/plagiarism/detect-patterns
 * Detect suspicious patterns
 */
router.post(
  "/plagiarism/detect-patterns",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { essayText } = req.body;

    if (!essayText) {
      return res.status(400).json({
        success: false,
        error: "EssayText is required",
      });
    }

    const patterns = plagiarismDetection.detectSuspiciousPatterns(essayText);

    res.json({
      success: true,
      data: {
        patterns,
        suspiciousCount: patterns.length,
      },
    });
  }),
);

/**
 * POST /api/ai/plagiarism/report
 * Generate plagiarism report
 */
router.post(
  "/plagiarism/report",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { essayId, essayText } = req.body;

    if (!essayId || !essayText) {
      return res.status(400).json({
        success: false,
        error: "EssayId and essayText are required",
      });
    }

    const report = await plagiarismDetection.generatePlagiarismReport(
      essayId,
      essayText,
    );

    res.json({
      success: true,
      data: report,
    });
  }),
);

// ========== SMART TEST SCHEDULING ROUTES ==========

/**
 * POST /api/ai/scheduling/recommend
 * Get schedule recommendation
 */
router.post(
  "/scheduling/recommend",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.body;
    const userId = req.user.id;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: "TestId is required",
      });
    }

    const recommendation = await smartScheduling.getScheduleRecommendation(
      userId,
      testId,
    );

    res.json({
      success: true,
      data: recommendation,
    });
  }),
);

/**
 * POST /api/ai/scheduling/readiness
 * Assess test readiness
 */
router.post(
  "/scheduling/readiness",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.body;
    const userId = req.user.id;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: "TestId is required",
      });
    }

    const readiness = await smartScheduling.assessTestReadiness(userId, testId);

    res.json({
      success: true,
      data: readiness,
    });
  }),
);

/**
 * POST /api/ai/scheduling/group
 * Get optimal group schedule
 */
router.post(
  "/scheduling/group",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req: Request, res: Response) => {
    const { participantIds, testId } = req.body;

    if (!participantIds || !testId || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "ParticipantIds and testId are required",
      });
    }

    const groupSchedule = await smartScheduling.getOptimalGroupSchedule(
      participantIds,
      testId,
    );

    res.json({
      success: true,
      data: groupSchedule,
    });
  }),
);

/**
 * POST /api/ai/scheduling/study-plan
 * Get study schedule recommendations
 */
router.post(
  "/scheduling/study-plan",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.body;
    const userId = req.user.id;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: "TestId is required",
      });
    }

    const studyPlan = await smartScheduling.getStudySchedule(userId, testId);

    res.json({
      success: true,
      data: studyPlan,
    });
  }),
);

// ========== HEALTH CHECK ==========

/**
 * GET /api/ai/health
 * Health check endpoint
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "ai-service",
    timestamp: new Date(),
  });
});

export default router;
