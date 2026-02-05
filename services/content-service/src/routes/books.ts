import express, { Request, Response } from "express";
import { Book } from "../models/Book";
import { ChapterTest } from "../models/ChapterTest";
import { authenticateToken, authorizeAdmin } from "../middleware/auth";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

const router = express.Router();

// GET all books with search and filters
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        search,
        category,
        subject,
        difficulty,
        page = 1,
        limit = 20,
        isFree,
      } = req.query;

      const filter: any = {};

      if (search) {
        filter.$text = { $search: String(search) };
      }

      if (category) {
        filter.category = category;
      }

      if (subject) {
        filter.subject = subject;
      }

      if (difficulty) {
        filter.difficulty = difficulty;
      }

      if (isFree === "true") {
        filter.isFree = true;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const books = await Book.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Book.countDocuments(filter);

      res.json({
        success: true,
        data: books,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching books" });
    }
  },
);

// GET single book with chapters
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const book = await Book.findById(req.params.id);

      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      // Increment view count
      book.viewCount += 1;
      await book.save();

      res.json({ success: true, data: book });
    } catch (error) {
      res.status(500).json({ error: "Error fetching book" });
    }
  },
);

// GET book chapter
router.get(
  "/:id/chapters/:chapterId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id, chapterId } = req.params;

      const book = await Book.findById(id);
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      const chapter = book.chapters.find((ch) => ch.chapterId === chapterId);
      if (!chapter) {
        res.status(404).json({ error: "Chapter not found" });
        return;
      }

      res.json({ success: true, data: { book: book._id, chapter } });
    } catch (error) {
      res.status(500).json({ error: "Error fetching chapter" });
    }
  },
);

// GET book chapter test
router.get(
  "/:id/chapters/:chapterId/test",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id, chapterId } = req.params;

      const test = await ChapterTest.findOne({
        bookId: id,
        chapterId,
      }).populate("questions");
      if (!test) {
        res.status(404).json({ error: "Test not found for this chapter" });
        return;
      }

      res.json({ success: true, data: test });
    } catch (error) {
      res.status(500).json({ error: "Error fetching test" });
    }
  },
);

// GET book read/view page (protected stream)
router.get(
  "/:id/read",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { page = 1 } = req.query;

      const book = await Book.findById(id);
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      // Log access for DRM
      console.log(`User ${req.user?.id} accessing page ${page} of book ${id}`);

      // Return page image URL with watermark
      res.json({
        success: true,
        data: {
          pageNumber: Number(page),
          pdfUrl: book.pdfUrl,
          totalPages: book.totalPages,
          watermark: {
            userId: req.user?.id,
            timestamp: new Date(),
            page: Number(page),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error streaming book" });
    }
  },
);

// GET related tests for book
router.get(
  "/:id/related-tests",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { chapterId } = req.query;

      const book = await Book.findById(id);
      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      let tests;
      if (chapterId) {
        tests = await ChapterTest.find({ bookId: id, chapterId }).populate(
          "questions",
        );
      } else {
        tests = await ChapterTest.find({ bookId: id }).populate("questions");
      }

      res.json({
        success: true,
        data: {
          bookId: id,
          relatedTests: tests,
          message: `Found ${tests.length} tests for this book`,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching related tests" });
    }
  },
);

// CREATE new book (admin only)
router.post(
  "/",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        author,
        publisher,
        isbn,
        category,
        subject,
        description,
        coverImageUrl,
        pdfUrl,
        chapters,
        totalPages,
        difficulty,
        edition,
        publishDate,
        language,
        tags,
        isFree,
        price,
        relatedTopics,
      } = req.body;

      const newBook = new Book({
        title,
        author,
        publisher,
        isbn,
        category,
        subject,
        description,
        coverImageUrl,
        pdfUrl,
        chapters,
        totalPages,
        difficulty,
        edition,
        publishDate,
        language,
        tags,
        isFree,
        price,
        relatedTopics,
      });

      await newBook.save();

      res.status(201).json({
        success: true,
        message: "Book created successfully",
        data: newBook,
      });
    } catch (error) {
      res.status(500).json({ error: "Error creating book" });
    }
  },
);

// UPDATE book (admin only)
router.put(
  "/:id",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        author,
        publisher,
        category,
        subject,
        description,
        chapters,
        difficulty,
        tags,
        relatedTopics,
      } = req.body;

      const book = await Book.findByIdAndUpdate(
        req.params.id,
        {
          title,
          author,
          publisher,
          category,
          subject,
          description,
          chapters,
          difficulty,
          tags,
          relatedTopics,
        },
        { new: true },
      );

      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      res.json({
        success: true,
        message: "Book updated successfully",
        data: book,
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating book" });
    }
  },
);

// DELETE book (admin only)
router.delete(
  "/:id",
  authorizeAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const book = await Book.findByIdAndDelete(req.params.id);

      if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
      }

      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting book" });
    }
  },
);

export default router;
