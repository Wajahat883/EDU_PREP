import express, { Request, Response } from "express";
import { PastPaper } from "../models/PastPaper";
import { authenticateToken, authorizeAdmin } from "../middleware/auth";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

const router = express.Router();

// GET all past papers with search and filters
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        search,
        difficulty,
        examType,
        year,
        subject,
        page = 1,
        limit = 20,
      } = req.query;

      const filter: any = {};

      if (search) {
        filter.$text = { $search: String(search) };
      }

      if (difficulty) {
        filter.difficulty = difficulty;
      }

      if (examType) {
        filter.examType = examType;
      }

      if (year) {
        filter.year = Number(year);
      }

      if (subject) {
        filter.subjects = { $in: [subject] };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const papers = await PastPaper.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await PastPaper.countDocuments(filter);

      res.json({
        success: true,
        data: papers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching past papers" });
    }
  },
);

// GET single past paper
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const paper = await PastPaper.findById(req.params.id).populate("reviews");

      if (!paper) {
        res.status(404).json({ error: "Past paper not found" });
        return;
      }

      // Increment view count
      paper.downloadCount += 1;
      await paper.save();

      res.json({ success: true, data: paper });
    } catch (error) {
      res.status(500).json({ error: "Error fetching past paper" });
    }
  },
);

// GET past paper PDF stream (protected view)
router.get(
  "/:id/read",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { page = 1 } = req.query;

      const paper = await PastPaper.findById(id);
      if (!paper) {
        res.status(404).json({ error: "Past paper not found" });
        return;
      }

      // Log access for DRM
      console.log(`User ${req.user?.id} accessing page ${page} of paper ${id}`);

      // Return page image URL (implementation depends on S3/storage)
      // For now, return the PDF URL with authentication
      res.json({
        success: true,
        data: {
          pageNumber: Number(page),
          pdfUrl: paper.pdfUrl,
          totalPages: paper.totalQuestions, // Estimate based on questions
          watermark: {
            userId: req.user?.id,
            timestamp: new Date(),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error streaming past paper" });
    }
  },
);

// GET related tests for past paper
router.get(
  "/:id/related-tests",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const paper = await PastPaper.findById(id).populate("questions");
      if (!paper) {
        res.status(404).json({ error: "Past paper not found" });
        return;
      }

      // Find related tests from test-engine-service
      // This would be implemented with a call to test-engine-service
      res.json({
        success: true,
        data: {
          paperId: id,
          relatedTests: [],
          message: "Related tests for this past paper",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching related tests" });
    }
  },
);

// CREATE new past paper (admin only)
router.post(
  "/",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        examType,
        year,
        month,
        difficulty,
        totalQuestions,
        duration,
        subjects,
        description,
        pdfUrl,
        solutionUrl,
        fileSize,
        tags,
      } = req.body;

      const newPaper = new PastPaper({
        title,
        examType,
        year,
        month,
        difficulty,
        totalQuestions,
        duration,
        subjects,
        description,
        pdfUrl,
        solutionUrl,
        fileSize,
        uploadedBy: req.user?.id,
        tags,
      });

      await newPaper.save();

      res.status(201).json({
        success: true,
        message: "Past paper created successfully",
        data: newPaper,
      });
    } catch (error) {
      res.status(500).json({ error: "Error creating past paper" });
    }
  },
);

// UPDATE past paper (admin only)
router.put(
  "/:id",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        examType,
        year,
        month,
        difficulty,
        totalQuestions,
        duration,
        subjects,
        description,
        tags,
      } = req.body;

      const paper = await PastPaper.findByIdAndUpdate(
        req.params.id,
        {
          title,
          examType,
          year,
          month,
          difficulty,
          totalQuestions,
          duration,
          subjects,
          description,
          tags,
        },
        { new: true },
      );

      if (!paper) {
        res.status(404).json({ error: "Past paper not found" });
        return;
      }

      res.json({
        success: true,
        message: "Past paper updated successfully",
        data: paper,
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating past paper" });
    }
  },
);

// DELETE past paper (admin only)
router.delete(
  "/:id",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const paper = await PastPaper.findByIdAndDelete(req.params.id);

      if (!paper) {
        res.status(404).json({ error: "Past paper not found" });
        return;
      }

      res.json({ success: true, message: "Past paper deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting past paper" });
    }
  },
);

export default router;
