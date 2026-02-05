/**
 * Admin Management Routes
 *
 * REST API endpoints for admin operations:
 * - Question management (CRUD)
 * - Test management
 * - User management
 * - Content approval workflow
 * - Analytics and reporting
 */

import express, { Router, Request, Response } from "express";
import { questionManagerService } from "../services/questionManagerService";
import { testManagerService } from "../services/testManagerService";
import { authenticate, authorize } from "../middleware/auth";

const router: Router = express.Router();

// Middleware: All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// ==================== QUESTION MANAGEMENT ====================

/**
 * GET /api/admin/questions - List all questions with filters
 */
router.get("/questions", async (req: Request, res: Response) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      status,
      tags,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      subject: subject as string,
      topic: topic as string,
      difficulty: difficulty as "easy" | "medium" | "hard",
      status: status as "draft" | "review" | "approved" | "rejected",
      tags: tags ? (tags as string).split(",") : undefined,
      search: search as string,
    };

    const { questions, total } = await questionManagerService.listQuestions(
      filter,
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      questions,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions - Create new question
 */
router.post("/questions", async (req: Request, res: Response) => {
  try {
    const question = await questionManagerService.createQuestion(
      req.body,
      req.user._id,
    );

    res.status(201).json({
      success: true,
      question,
      message: "Question created successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/questions/:id - Get single question
 */
router.get("/questions/:id", async (req: Request, res: Response) => {
  try {
    const question = await questionManagerService.getQuestion(req.params.id);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, error: "Question not found" });
    }

    res.json({ success: true, question });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/questions/:id - Update question
 */
router.put("/questions/:id", async (req: Request, res: Response) => {
  try {
    const question = await questionManagerService.updateQuestion(
      req.params.id,
      req.body,
      req.user._id,
    );

    res.json({
      success: true,
      question,
      message: "Question updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/questions/:id - Delete question
 */
router.delete("/questions/:id", async (req: Request, res: Response) => {
  try {
    await questionManagerService.deleteQuestion(req.params.id, req.user._id);

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions/:id/submit - Submit question for review
 */
router.post("/questions/:id/submit", async (req: Request, res: Response) => {
  try {
    const question = await questionManagerService.submitForReview(
      req.params.id,
      req.user._id,
    );

    res.json({
      success: true,
      question,
      message: "Question submitted for review",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions/:id/approve - Approve question
 */
router.post("/questions/:id/approve", async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const question = await questionManagerService.approveQuestion(
      req.params.id,
      req.user._id,
      notes,
    );

    res.json({
      success: true,
      question,
      message: "Question approved",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions/:id/reject - Reject question
 */
router.post("/questions/:id/reject", async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required",
      });
    }

    const question = await questionManagerService.rejectQuestion(
      req.params.id,
      req.user._id,
      reason,
    );

    res.json({
      success: true,
      question,
      message: "Question rejected",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/questions/:id/history - Get question revision history
 */
router.get("/questions/:id/history", async (req: Request, res: Response) => {
  try {
    const history = await questionManagerService.getRevisionHistory(
      req.params.id,
    );

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions/:id/restore - Restore question to revision
 */
router.post("/questions/:id/restore", async (req: Request, res: Response) => {
  try {
    const { revisionVersion } = req.body;
    if (!revisionVersion) {
      return res.status(400).json({
        success: false,
        error: "Revision version is required",
      });
    }

    const question = await questionManagerService.restoreRevision(
      req.params.id,
      revisionVersion,
      req.user._id,
    );

    res.json({
      success: true,
      question,
      message: "Question restored to specified revision",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/questions/import - Bulk import questions from CSV
 */
router.post("/questions/bulk/import", async (req: Request, res: Response) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res
        .status(400)
        .json({ success: false, error: "CSV data required" });
    }

    const result = await questionManagerService.bulkImportQuestions(
      csvData,
      req.user._id,
    );

    res.json({
      success: true,
      result,
      message: `${result.successful} questions imported successfully`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/questions/export - Export questions to CSV
 */
router.get("/questions/bulk/export", async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty, status, tags, search } = req.query;

    const filter = {
      subject: subject as string,
      topic: topic as string,
      difficulty: difficulty as "easy" | "medium" | "hard",
      status: status as "draft" | "review" | "approved" | "rejected",
      tags: tags ? (tags as string).split(",") : undefined,
      search: search as string,
    };

    const csv = await questionManagerService.exportQuestions(filter);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="questions-${new Date().toISOString()}.csv"`,
    );
    res.send(csv);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/questions/stats - Get question statistics
 */
router.get("/questions/stats", async (req: Request, res: Response) => {
  try {
    const stats = await questionManagerService.getStatistics();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== TEST MANAGEMENT ====================

/**
 * GET /api/admin/tests - List all tests
 */
router.get("/tests", async (req: Request, res: Response) => {
  try {
    const { subject, status, search, page = 1, limit = 20 } = req.query;

    const filter = {
      subject: subject as string,
      status: status as "draft" | "published" | "archived",
      search: search as string,
    };

    const { tests, total } = await testManagerService.listTests(
      filter,
      parseInt(page as string),
      parseInt(limit as string),
    );

    res.json({
      success: true,
      tests,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/tests - Create new test
 */
router.post("/tests", async (req: Request, res: Response) => {
  try {
    const { config, sections } = req.body;

    if (!config || !sections) {
      return res.status(400).json({
        success: false,
        error: "Test configuration and sections are required",
      });
    }

    const test = await testManagerService.createTest(
      config,
      sections,
      req.user._id,
    );

    res.status(201).json({
      success: true,
      test,
      message: "Test created successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/tests/:id - Get single test
 */
router.get("/tests/:id", async (req: Request, res: Response) => {
  try {
    const test = await testManagerService.getTest(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, error: "Test not found" });
    }

    res.json({ success: true, test });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/tests/:id - Update test
 */
router.put("/tests/:id", async (req: Request, res: Response) => {
  try {
    const test = await testManagerService.updateTest(
      req.params.id,
      req.body,
      req.user._id,
    );

    res.json({
      success: true,
      test,
      message: "Test updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/tests/:id/publish - Publish test
 */
router.post("/tests/:id/publish", async (req: Request, res: Response) => {
  try {
    const test = await testManagerService.publishTest(
      req.params.id,
      req.user._id,
    );

    res.json({
      success: true,
      test,
      message: "Test published successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/tests/:id/archive - Archive test
 */
router.post("/tests/:id/archive", async (req: Request, res: Response) => {
  try {
    const test = await testManagerService.archiveTest(
      req.params.id,
      req.user._id,
    );

    res.json({
      success: true,
      test,
      message: "Test archived successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/tests/:id/duplicate - Duplicate test
 */
router.post("/tests/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const test = await testManagerService.duplicateTest(
      req.params.id,
      req.user._id,
    );

    res.json({
      success: true,
      test,
      message: "Test duplicated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/tests/:id - Delete test
 */
router.delete("/tests/:id", async (req: Request, res: Response) => {
  try {
    await testManagerService.deleteTest(req.params.id, req.user._id);

    res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/tests/:id/sections/:sectionIndex/add-questions - Add questions to section
 */
router.post(
  "/tests/:id/sections/:sectionIndex/add-questions",
  async (req: Request, res: Response) => {
    try {
      const { questionIds } = req.body;

      if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({
          success: false,
          error: "Valid question IDs array is required",
        });
      }

      const test = await testManagerService.addQuestionsToSection(
        req.params.id,
        parseInt(req.params.sectionIndex),
        questionIds,
        req.user._id,
      );

      res.json({
        success: true,
        test,
        message: "Questions added to section",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

/**
 * POST /api/admin/tests/:id/sections/:sectionIndex/remove-questions - Remove questions from section
 */
router.post(
  "/tests/:id/sections/:sectionIndex/remove-questions",
  async (req: Request, res: Response) => {
    try {
      const { questionIds } = req.body;

      if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({
          success: false,
          error: "Valid question IDs array is required",
        });
      }

      const test = await testManagerService.removeQuestionsFromSection(
        req.params.id,
        parseInt(req.params.sectionIndex),
        questionIds,
        req.user._id,
      );

      res.json({
        success: true,
        test,
        message: "Questions removed from section",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET /api/admin/tests/stats - Get test statistics
 */
router.get("/tests/stats", async (req: Request, res: Response) => {
  try {
    // Would typically aggregate stats across all tests
    res.json({
      success: true,
      stats: {
        totalTests: 0,
        publishedTests: 0,
        totalQuestions: 0,
        averageTestTime: 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
