/**
 * Flashcard Service API Routes
 *
 * Core endpoints:
 * - Deck management (CRUD)
 * - Card management (Create, Get, Update, Delete)
 * - Review workflow (Get queue, Record review)
 * - Statistics and analytics
 */

import express, { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  Flashcard,
  IFlashcard,
  FlashcardDeck,
  IFlashcardDeck,
  ReviewSession,
} from "../models/Flashcard";
import {
  ReviewQueueService,
  DailySchedulerService,
} from "../services/reviewQueueService";
import { SM2Algorithm } from "../services/sm2Algorithm";

const router = Router();

// ============================================================================
// DECK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/flashcards/decks
 * Get all decks for current user
 */
router.get("/decks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decks = await FlashcardDeck.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: decks.length,
      decks,
    });
  } catch (error) {
    console.error("Error fetching decks:", error);
    res.status(500).json({ error: "Failed to fetch decks" });
  }
});

/**
 * POST /api/flashcards/decks
 * Create a new flashcard deck
 *
 * Body: { name, description?, tags?, color? }
 */
router.post(
  "/decks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { name, description, tags, color } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Deck name is required" });
      }

      const deck = new FlashcardDeck({
        userId,
        name: name.trim(),
        description,
        tags,
        color: color || "#1976d2",
        cardCount: 0,
        statistics: {
          totalReviews: 0,
          averageEase: 2.5,
          averageInterval: 1,
          matureCards: 0,
          learningCards: 0,
          newCards: 0,
        },
      });

      await deck.save();

      res.status(201).json({
        success: true,
        message: "Deck created successfully",
        deck,
      });
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ error: "Failed to create deck" });
    }
  },
);

/**
 * PUT /api/flashcards/decks/:deckId
 * Update deck information
 */
router.put(
  "/decks/:deckId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;
      const { name, description, tags, color, settings } = req.body;

      const deck = await FlashcardDeck.findOne({
        _id: deckId,
        userId,
      });

      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }

      if (name) deck.name = name.trim();
      if (description !== undefined) deck.description = description;
      if (tags) deck.tags = tags;
      if (color) deck.color = color;
      if (settings) deck.settings = { ...deck.settings, ...settings };

      await deck.save();

      res.json({
        success: true,
        message: "Deck updated successfully",
        deck,
      });
    } catch (error) {
      console.error("Error updating deck:", error);
      res.status(500).json({ error: "Failed to update deck" });
    }
  },
);

/**
 * DELETE /api/flashcards/decks/:deckId
 * Delete a deck and all its cards
 */
router.delete(
  "/decks/:deckId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;

      const deck = await FlashcardDeck.findOneAndDelete({
        _id: deckId,
        userId,
      });

      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }

      // Delete all cards in this deck
      await Flashcard.deleteMany({ deckId });

      res.json({
        success: true,
        message: "Deck deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ error: "Failed to delete deck" });
    }
  },
);

// ============================================================================
// CARD MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/flashcards/decks/:deckId/cards
 * Get all cards in a deck
 */
router.get(
  "/decks/:deckId/cards",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;
      const { sort = "createdAt", order = -1 } = req.query;

      const cards = await Flashcard.find({
        userId,
        deckId,
      })
        .sort({ [sort as string]: order })
        .select("-back -reviewHistory");

      res.json({
        success: true,
        count: cards.length,
        cards,
      });
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  },
);

/**
 * POST /api/flashcards/decks/:deckId/cards
 * Create a new flashcard
 *
 * Body: { front, back, explanation?, tags?, difficulty? }
 */
router.post(
  "/decks/:deckId/cards",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;
      const { front, back, explanation, tags, difficulty } = req.body;

      if (!front || !back) {
        return res.status(400).json({ error: "Front and back are required" });
      }

      const card = new Flashcard({
        userId,
        deckId,
        front: front.trim(),
        back: back.trim(),
        explanation,
        tags,
        difficulty: difficulty || "medium",
        sm2: SM2Algorithm.initializeCard(Math.random().toString()),
      });

      await card.save();

      // Update deck card count
      await FlashcardDeck.findByIdAndUpdate(deckId, {
        $inc: { cardCount: 1 },
        $inc: { "statistics.newCards": 1 },
      });

      res.status(201).json({
        success: true,
        message: "Card created successfully",
        card,
      });
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Failed to create card" });
    }
  },
);

/**
 * PUT /api/flashcards/cards/:cardId
 * Update a flashcard
 */
router.put(
  "/cards/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { front, back, explanation, tags, difficulty, isStarred } =
        req.body;

      const card = await Flashcard.findOne({
        _id: cardId,
        userId,
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      if (front) card.front = front.trim();
      if (back) card.back = back.trim();
      if (explanation !== undefined) card.explanation = explanation;
      if (tags) card.tags = tags;
      if (difficulty) card.difficulty = difficulty;
      if (isStarred !== undefined) card.isStarred = isStarred;

      await card.save();

      res.json({
        success: true,
        message: "Card updated successfully",
        card,
      });
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Failed to update card" });
    }
  },
);

/**
 * DELETE /api/flashcards/cards/:cardId
 * Delete a flashcard
 */
router.delete(
  "/cards/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      const card = await Flashcard.findOneAndDelete({
        _id: cardId,
        userId,
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Update deck card count
      await FlashcardDeck.findByIdAndUpdate(card.deckId, {
        $inc: { cardCount: -1 },
      });

      res.json({
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Failed to delete card" });
    }
  },
);

// ============================================================================
// REVIEW WORKFLOW ENDPOINTS
// ============================================================================

/**
 * GET /api/flashcards/decks/:deckId/queue
 * Get review queue for a deck
 */
router.get(
  "/decks/:deckId/queue",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;

      const queue = await ReviewQueueService.getDailyQueue(userId, deckId);

      res.json({
        success: true,
        queue,
      });
    } catch (error) {
      console.error("Error getting queue:", error);
      res.status(500).json({ error: "Failed to get queue" });
    }
  },
);

/**
 * GET /api/flashcards/decks/:deckId/next-card
 * Get next card to review
 */
router.get(
  "/decks/:deckId/next-card",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;
      const { exclude } = req.query;

      const excludeIds = exclude ? (exclude as string).split(",") : [];
      const card = await ReviewQueueService.getNextCard(
        userId,
        deckId,
        excludeIds,
      );

      if (!card) {
        return res.status(404).json({ error: "No cards to review" });
      }

      res.json({
        success: true,
        card,
      });
    } catch (error) {
      console.error("Error getting next card:", error);
      res.status(500).json({ error: "Failed to get next card" });
    }
  },
);

/**
 * POST /api/flashcards/cards/:cardId/review
 * Record a card review
 *
 * Body: { quality, responseTime }
 */
router.post(
  "/cards/:cardId/review",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { quality, responseTime } = req.body;

      if (typeof quality !== "number" || quality < 0 || quality > 5) {
        return res
          .status(400)
          .json({ error: "Quality must be between 0 and 5" });
      }

      if (typeof responseTime !== "number" || responseTime < 0) {
        return res
          .status(400)
          .json({ error: "Response time must be non-negative" });
      }

      const result = await ReviewQueueService.recordReview(
        userId,
        cardId,
        quality,
        responseTime,
      );

      res.json({
        success: true,
        message: "Review recorded successfully",
        result,
      });
    } catch (error: any) {
      console.error("Error recording review:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to record review" });
    }
  },
);

/**
 * POST /api/flashcards/decks/:deckId/session
 * Create a review session
 *
 * Body: { cardCount, correctCount, totalTime, sessionType, notes? }
 */
router.post(
  "/decks/:deckId/session",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;
      const { cardCount, correctCount, totalTime, sessionType, notes } =
        req.body;

      const session = new ReviewSession({
        userId,
        deckId,
        startTime: new Date(Date.now() - totalTime * 1000),
        endTime: new Date(),
        cardCount,
        correctCount,
        incorrectCount: cardCount - correctCount,
        totalTime,
        sessionType,
        notes,
      });

      await session.save();

      res.status(201).json({
        success: true,
        message: "Session recorded successfully",
        session,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  },
);

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/flashcards/decks/:deckId/stats
 * Get deck statistics
 */
router.get(
  "/decks/:deckId/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { deckId } = req.params;

      const stats = await ReviewQueueService.getDeckStats(userId, deckId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  },
);

/**
 * GET /api/flashcards/daily-plan
 * Get daily study plan
 */
router.get(
  "/daily-plan",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { decks } = req.query;

      const deckIds = decks
        ? (decks as string).split(",")
        : (await FlashcardDeck.find({ userId }).select("_id")).map((d) =>
            d._id.toString(),
          );

      const plan = await DailySchedulerService.getDailyPlan(userId, deckIds);

      res.json({
        success: true,
        plan,
      });
    } catch (error) {
      console.error("Error getting daily plan:", error);
      res.status(500).json({ error: "Failed to get daily plan" });
    }
  },
);

/**
 * GET /api/flashcards/streak
 * Get study streak
 */
router.get(
  "/streak",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const streak = await DailySchedulerService.getStreak(userId);

      res.json({
        success: true,
        streak,
      });
    } catch (error) {
      console.error("Error getting streak:", error);
      res.status(500).json({ error: "Failed to get streak" });
    }
  },
);

/**
 * GET /api/flashcards/cards/:cardId
 * Get card details with full history
 */
router.get(
  "/cards/:cardId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      const card = await Flashcard.findOne({
        _id: cardId,
        userId,
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      const stats = SM2Algorithm.getCardStatistics(card.sm2 as any);

      res.json({
        success: true,
        card,
        sm2Stats: stats,
      });
    } catch (error) {
      console.error("Error getting card:", error);
      res.status(500).json({ error: "Failed to get card" });
    }
  },
);

export default router;
