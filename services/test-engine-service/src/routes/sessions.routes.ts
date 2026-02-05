import { Router, Request, Response } from "express";
import TestSession from "../models/TestSession";
import ExamModeService from "../services/exam-mode.service";
import ScoringService from "../services/scoring.service";
import { authenticate } from "../middleware/authenticate";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * POST /api/sessions
 * Create new exam session
 */
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { examTypeId, mode, questionIds, timeLimit } = req.body;

    // Validate mode
    const validModes = ["timed", "tutor", "untimed"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid mode. Must be: timed, tutor, or untimed",
      });
    }

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "questionIds must be a non-empty array",
      });
    }

    // Get mode configuration
    let modeConfig: any;
    switch (mode) {
      case "timed":
        modeConfig = ExamModeService.getTimedModeConfig(questionIds.length);
        break;
      case "tutor":
        modeConfig = ExamModeService.getTutorModeConfig();
        break;
      case "untimed":
        modeConfig = ExamModeService.getUntimedModeConfig();
        break;
    }

    // Create session
    const sessionId = `sess_${uuidv4()}`;
    const session = new TestSession({
      sessionId,
      userId,
      examTypeId,
      mode,
      questionIds,
      currentQuestionIndex: 0,
      status: "in_progress",
      timeLimit:
        mode === "timed" ? timeLimit || questionIds.length * 60 : undefined,
      timeRemaining:
        mode === "timed" ? timeLimit || questionIds.length * 60 : undefined,
      answers: [],
      statistics: {
        correctCount: 0,
        totalQuestions: questionIds.length,
        scorePercentage: 0,
        averageTimePerQuestion: 0,
        bloomDistribution: {},
        difficultyStats: {
          attempted: [],
          correct: [],
        },
      },
      adaptiveFeatures: {
        nextQuestionDifficulty: 5,
        difficultyHistory: [],
        adaptiveEnabled: mode === "tutor",
      },
      hintsRemaining: mode === "timed" ? 0 : mode === "tutor" ? 3 : 5,
      performance: {
        questionStartedAt: new Date(),
        examStartedAt: new Date(),
      },
    });

    await session.save();

    return res.status(201).json({
      status: "success",
      data: {
        sessionId,
        userId,
        examTypeId,
        mode,
        questionCount: questionIds.length,
        currentQuestionIndex: 0,
        timeLimit: session.timeLimit,
        hintsRemaining: session.hintsRemaining,
        status: "in_progress",
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get("/:sessionId", authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const session = await TestSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found",
      });
    }

    // Verify ownership
    if (session.userId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You do not have access to this session",
      });
    }

    // Calculate time remaining if timed
    let timeRemaining = session.timeRemaining;
    if (
      session.mode === "timed" &&
      session.timeLimit &&
      session.status === "in_progress"
    ) {
      timeRemaining = ExamModeService.calculateTimeRemaining(
        session.timeLimit,
        session.startedAt,
        session.totalPausedTime,
      );
    }

    return res.json({
      status: "success",
      data: {
        sessionId: session.sessionId,
        mode: session.mode,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.questionIds.length,
        timeRemaining,
        hintsRemaining: session.hintsRemaining,
        answersCount: session.answers.length,
        markedForReview: session.answers.filter((a) => a.markedForReview)
          .length,
      },
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get session",
    });
  }
});

/**
 * POST /api/sessions/:sessionId/answer
 * Submit answer to a question
 */
router.post(
  "/:sessionId/answer",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;
      const { questionId, selectedOption, timeSpent, isCorrect } = req.body;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      // Check if session is still active
      if (session.status !== "in_progress") {
        return res.status(400).json({
          status: "error",
          message: "Session is not active",
        });
      }

      // Add answer
      const answer = {
        questionId,
        selectedOption,
        timeSpent: timeSpent || 0,
        isCorrect,
        markedForReview: false,
        hints: [],
      };

      session.answers.push(answer);

      // Update adaptive difficulty if enabled
      if (session.adaptiveFeatures.adaptiveEnabled) {
        const nextDifficulty = ExamModeService.calculateAdaptiveDifficulty(
          session,
          isCorrect ? 1 : 0,
        );
        session.adaptiveFeatures.nextQuestionDifficulty = nextDifficulty;
        session.adaptiveFeatures.difficultyHistory.push(nextDifficulty);
      }

      // Move to next question
      session.currentQuestionIndex++;

      // Auto-save
      await session.save();

      return res.json({
        status: "success",
        message: "Answer submitted",
        data: {
          sessionId,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.questionIds.length,
          answersSubmitted: session.answers.length,
          isComplete:
            session.currentQuestionIndex >= session.questionIds.length,
        },
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to submit answer",
      });
    }
  },
);

/**
 * POST /api/sessions/:sessionId/pause
 * Pause exam (timed mode)
 */
router.post(
  "/:sessionId/pause",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (
        !session.adaptiveFeatures.adaptiveEnabled &&
        session.mode !== "timed"
      ) {
        return res.status(400).json({
          status: "error",
          message: "Only timed exams can be paused",
        });
      }

      session.status = "paused";
      session.pausedAt = new Date();

      await session.save();

      return res.json({
        status: "success",
        message: "Exam paused",
        data: {
          sessionId,
          status: "paused",
        },
      });
    } catch (error) {
      console.error("Error pausing session:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to pause session",
      });
    }
  },
);

/**
 * POST /api/sessions/:sessionId/resume
 * Resume paused exam
 */
router.post(
  "/:sessionId/resume",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (session.status !== "paused") {
        return res.status(400).json({
          status: "error",
          message: "Session is not paused",
        });
      }

      // Calculate pause duration
      const pauseDuration = Math.floor(
        (Date.now() - (session.pausedAt?.getTime() || 0)) / 1000,
      );
      session.totalPausedTime += pauseDuration;
      session.resumedAt = new Date();
      session.status = "in_progress";

      await session.save();

      return res.json({
        status: "success",
        message: "Exam resumed",
        data: {
          sessionId,
          status: "in_progress",
          totalPausedTime: session.totalPausedTime,
        },
      });
    } catch (error) {
      console.error("Error resuming session:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to resume session",
      });
    }
  },
);

/**
 * POST /api/sessions/:sessionId/hint
 * Get hint for current question
 */
router.post(
  "/:sessionId/hint",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;
      const { hintLevel } = req.body;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (session.hintsRemaining <= 0) {
        return res.status(400).json({
          status: "error",
          message: "No hints remaining",
        });
      }

      // Get current question (would fetch from QBank service)
      const currentQuestionId =
        session.questionIds[session.currentQuestionIndex];

      // Generate hint (mock - would call QBank service)
      const hint = ExamModeService.generateHintSequence(
        {
          hint1: "Concept definition",
          hint2: "Key concept",
          hint3: "Analysis",
        },
        hintLevel || 0,
      );

      // Decrement hints
      session.hintsUsed += 1;
      session.hintsRemaining -= 1;

      // Record hint in current answer
      const currentAnswer = session.answers[session.answers.length - 1];
      if (currentAnswer) {
        currentAnswer.hints = currentAnswer.hints || [];
        currentAnswer.hints.push(hint);
      }

      await session.save();

      return res.json({
        status: "success",
        data: {
          hint,
          hintsRemaining: session.hintsRemaining,
          hintsUsed: session.hintsUsed,
        },
      });
    } catch (error) {
      console.error("Error getting hint:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to get hint",
      });
    }
  },
);

/**
 * POST /api/sessions/:sessionId/flag
 * Flag question for review
 */
router.post(
  "/:sessionId/flag",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;
      const { questionId } = req.body;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      // Find and mark answer
      const answer = session.answers.find((a) => a.questionId === questionId);
      if (answer) {
        answer.markedForReview = !answer.markedForReview;
      }

      await session.save();

      return res.json({
        status: "success",
        message: "Question flagged for review",
      });
    } catch (error) {
      console.error("Error flagging question:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to flag question",
      });
    }
  },
);

/**
 * POST /api/sessions/:sessionId/complete
 * Complete exam and generate results
 */
router.post(
  "/:sessionId/complete",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      // Calculate statistics
      const { correctCount, scorePercentage } = ScoringService.calculateScore(
        session.answers,
        session.questionIds.length,
      );

      const { grade } = ScoringService.getGrade(scorePercentage);

      // Update session
      session.status = "completed";
      session.endedAt = new Date();
      session.statistics.correctCount = correctCount;
      session.statistics.scorePercentage = scorePercentage;

      await session.save();

      return res.json({
        status: "success",
        message: "Exam completed",
        data: {
          sessionId,
          correctCount,
          totalQuestions: session.questionIds.length,
          scorePercentage,
          grade,
          timeSpent: Math.floor(
            (session.endedAt.getTime() - session.startedAt.getTime()) / 1000,
          ),
        },
      });
    } catch (error) {
      console.error("Error completing session:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to complete session",
      });
    }
  },
);

/**
 * GET /api/sessions/:sessionId/results
 * Get detailed results
 */
router.get(
  "/:sessionId/results",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).userId;

      const session = await TestSession.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      if (session.status !== "completed") {
        return res.status(400).json({
          status: "error",
          message: "Session is not completed",
        });
      }

      // Generate detailed results
      const { correctCount, scorePercentage } = ScoringService.calculateScore(
        session.answers,
        session.questionIds.length,
      );

      const { grade, performanceLevel } =
        ScoringService.getGrade(scorePercentage);
      const standardScore = ScoringService.getStandardScore(
        scorePercentage,
        session.examTypeId,
      );

      return res.json({
        status: "success",
        data: {
          sessionId,
          mode: session.mode,
          examTypeId: session.examTypeId,
          correctCount,
          totalQuestions: session.questionIds.length,
          scorePercentage,
          grade,
          performanceLevel,
          standardScore,
          timeSpent: Math.floor(
            (session.endedAt?.getTime() || 0 - session.startedAt.getTime()) /
              1000,
          ),
          createdAt: session.createdAt,
          completedAt: session.endedAt,
        },
      });
    } catch (error) {
      console.error("Error getting results:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to get results",
      });
    }
  },
);

export default router;
