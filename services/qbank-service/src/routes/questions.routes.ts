import { Router, Request, Response } from "express";
import Question from "../models/Question";
import { authenticate } from "../middleware/authenticate";
import { validateQueryParams } from "../middleware/validation";
import { SearchService } from "../services/search.service";
import { createClient } from "redis";

const router = Router();
const searchService = new SearchService();
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

/**
 * GET /api/questions
 * List questions with filtering, pagination, and caching
 *
 * Query Parameters:
 * - exam_type: string (MCAT, USMLE, etc)
 * - subject: string (Biology, Chemistry, etc)
 * - difficulty_min: number (1-10)
 * - difficulty_max: number (1-10)
 * - tags: string[] (comma-separated)
 * - bloom_level: string (Remember, Understand, Apply, etc)
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 * - sort: string (newest, difficulty, flags)
 */
router.get("/", validateQueryParams, async (req: Request, res: Response) => {
  try {
    const {
      exam_type,
      subject,
      difficulty_min,
      difficulty_max,
      tags,
      bloom_level,
      limit = "20",
      offset = "0",
      sort = "newest",
    } = req.query;

    const pageLimit = Math.min(parseInt(limit as string), 100);
    const pageOffset = parseInt(offset as string);

    // Build cache key
    const cacheKey = `questions:${JSON.stringify({
      exam_type,
      subject,
      difficulty_min,
      difficulty_max,
      tags,
      bloom_level,
      limit: pageLimit,
      offset: pageOffset,
      sort,
    })}`;

    // Check Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        status: "success",
        data: JSON.parse(cached),
        source: "cache",
      });
    }

    // Build MongoDB query
    const query: any = { isActive: true };

    if (exam_type) query.examTypeId = exam_type;
    if (subject) query.subjectId = subject;

    if (difficulty_min || difficulty_max) {
      query.difficulty = {};
      if (difficulty_min)
        query.difficulty.$gte = parseInt(difficulty_min as string);
      if (difficulty_max)
        query.difficulty.$lte = parseInt(difficulty_max as string);
    }

    if (tags) {
      const tagArray = (tags as string).split(",").map((t) => t.trim());
      query.tags = { $in: tagArray };
    }

    if (bloom_level) query.bloomLevel = bloom_level;

    // Build sort object
    const sortObj: any = {};
    switch (sort) {
      case "difficulty":
        sortObj.difficulty = -1;
        break;
      case "flags":
        sortObj["statistics.reportedIssues"] = -1;
        break;
      case "newest":
      default:
        sortObj.createdAt = -1;
    }

    // Execute query
    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .select(
        "_id examTypeId subjectId questionType stemText difficulty bloomLevel tags statistics.attempts statistics.correctPercentage createdAt",
      )
      .sort(sortObj)
      .limit(pageLimit)
      .skip(pageOffset)
      .lean();

    const response = {
      data: questions,
      pagination: {
        limit: pageLimit,
        offset: pageOffset,
        total,
        hasMore: pageOffset + pageLimit < total,
      },
    };

    // Cache for 1 hour (3600 seconds)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));

    return res.json({
      status: "success",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch questions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/questions/search
 * Full-text search with Elasticsearch
 *
 * Query Parameters:
 * - q: string (required) - search query
 * - exam_type: string (filter)
 * - subject: string (filter)
 * - difficulty_min/max: number (filter)
 * - limit: number (default 20)
 * - offset: number (default 0)
 */
router.get(
  "/search",
  validateQueryParams,
  async (req: Request, res: Response) => {
    try {
      const {
        q,
        exam_type,
        subject,
        difficulty_min,
        difficulty_max,
        limit = "20",
        offset = "0",
      } = req.query;

      if (!q || (q as string).trim().length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Search query (q) is required",
        });
      }

      const pageLimit = Math.min(parseInt(limit as string), 100);
      const pageOffset = parseInt(offset as string);

      // Build search filters
      const filters: any = { isActive: true };
      if (exam_type) filters.examTypeId = exam_type;
      if (subject) filters.subjectId = subject;
      if (difficulty_min)
        filters.difficulty = { $gte: parseInt(difficulty_min as string) };
      if (difficulty_max) {
        filters.difficulty = filters.difficulty || {};
        filters.difficulty.$lte = parseInt(difficulty_max as string);
      }

      // Perform Elasticsearch search
      const results = await searchService.search(q as string, {
        ...filters,
        limit: pageLimit,
        offset: pageOffset,
      });

      return res.json({
        status: "success",
        data: results.questions,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
          total: results.total,
          hasMore: pageOffset + pageLimit < results.total,
        },
      });
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({
        status: "error",
        message: "Search failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/questions/:id
 * Get single question with all details
 */
router.get("/:id", validateQueryParams, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `question:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        status: "success",
        data: JSON.parse(cached),
        source: "cache",
      });
    }

    const question = await Question.findById(id)
      .populate("learningObjective")
      .lean();

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    // Increment view count (async, don't await)
    Question.updateOne(
      { _id: id },
      { $inc: { "statistics.viewCount": 1 } },
    ).catch(console.error);

    // Cache for 6 hours
    await redisClient.setEx(cacheKey, 21600, JSON.stringify(question));

    return res.json({
      status: "success",
      data: question,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch question",
    });
  }
});

/**
 * GET /api/questions/:id/explanation
 * Get question explanation (LaTeX supported)
 */
router.get("/:id/explanation", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .select("explanationText options")
      .lean();

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    return res.json({
      status: "success",
      data: {
        explanation: question.explanationText,
        correctOption:
          question.options.find((o: any) => o.isCorrect)?.text ||
          (question.options.find((o: any) => o.isCorrect) as any)?.label,
        allOptions: question.options.map((o: any) => ({
          label: (o as any).label || o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          explanation: (o as any).explanation,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching explanation:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch explanation",
    });
  }
});

/**
 * GET /api/questions/:id/statistics
 * Get question statistics (attempts, accuracy, etc)
 */
router.get("/:id/statistics", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .select("statistics difficulty bloomLevel tags createdAt")
      .lean();

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    return res.json({
      status: "success",
      data: {
        ...question.statistics,
        difficulty: question.difficulty,
        bloomLevel: question.bloomLevel,
        createdAt: question.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics",
    });
  }
});

/**
 * POST /api/questions/:id/flags
 * Flag a question with an issue
 */
router.post("/:id/flags", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = (req as any).userId;

    // Validate reason
    const validReasons = [
      "incorrect_answer",
      "unclear",
      "outdated",
      "duplicate",
      "poor_quality",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid reason. Must be one of: " + validReasons.join(", "),
      });
    }

    // Check if question exists
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    // Create flag (would be in a separate collection in production)
    const flag = {
      questionId: id,
      userId,
      reason,
      description,
      status: "open",
      createdAt: new Date(),
    };

    // Increment flag count on question
    await Question.updateOne(
      { _id: id },
      { $inc: { "statistics.reportedIssues": 1 } },
    );

    // In production, save to flagsCollection.insertOne(flag)

    return res.status(201).json({
      status: "success",
      message: "Flag submitted successfully",
      data: flag,
    });
  } catch (error) {
    console.error("Error creating flag:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to submit flag",
    });
  }
});

/**
 * POST /api/admin/questions/bulk
 * Bulk import questions from CSV or JSON
 * Admin only
 */
router.post(
  "/admin/bulk",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).userRole;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Only admins can bulk import questions",
        });
      }

      const { questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Questions array is required and must not be empty",
        });
      }

      if (questions.length > 10000) {
        return res.status(400).json({
          status: "error",
          message: "Maximum 10,000 questions per import",
        });
      }

      // Validate each question
      const validated: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const validation = validateQuestion(q);

        if (!validation.valid) {
          errors.push({
            row: i + 1,
            errors: validation.errors,
          });
        } else {
          validated.push({
            ...q,
            createdBy: (req as any).userId,
            version: 1,
            statistics: {
              attempts: 0,
              averageTime: 0,
              correctPercentage: 0,
              reportedIssues: 0,
            },
          });
        }
      }

      // Return errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: `Validation failed for ${errors.length} questions`,
          errors,
        });
      }

      // Insert in batches
      const batchSize = 1000;
      let insertedCount = 0;

      for (let i = 0; i < validated.length; i += batchSize) {
        const batch = validated.slice(i, i + batchSize);
        const result = await Question.insertMany(batch);
        insertedCount += result.length;

        // Index to Elasticsearch
        for (const doc of result) {
          await searchService.indexQuestion(doc);
        }
      }

      return res.status(201).json({
        status: "success",
        message: `Successfully imported ${insertedCount} questions`,
        data: {
          importedCount: insertedCount,
          totalProcessed: questions.length,
          failedCount: errors.length,
        },
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      return res.status(500).json({
        status: "error",
        message: "Bulk import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Helper function to validate question data
 */
function validateQuestion(q: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!q.examTypeId) errors.push("examTypeId is required");
  if (!q.subjectId) errors.push("subjectId is required");
  if (!q.questionType) errors.push("questionType is required");
  if (!q.stemText) errors.push("stemText is required");
  if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
    errors.push("options must be an array with at least 2 items");
  }
  if (!q.options?.some((o: any) => o.isCorrect)) {
    errors.push("At least one option must be marked as correct");
  }
  if (!q.explanationText) errors.push("explanationText is required");
  if (q.difficulty < 1 || q.difficulty > 10)
    errors.push("difficulty must be 1-10");

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export default router;
