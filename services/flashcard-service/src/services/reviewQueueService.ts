/**
 * Review Queue Service
 *
 * Manages daily review schedules and queue prioritization
 * Handles the workflow for presenting cards to users in optimal order
 */

import { Flashcard, IFlashcard, FlashcardDeck } from "../models/Flashcard";
import { SM2Algorithm, SM2BatchCalculator } from "./sm2Algorithm";

export interface ReviewQueueCard {
  id: string;
  front: string;
  explanation?: string;
  difficulty: string;
  priority: "OVERDUE" | "TODAY" | "TOMORROW" | "FUTURE";
  reviewType: "new" | "learning" | "review";
  daysOverdue: number;
}

export interface ReviewQueue {
  userId: string;
  deckId: string;
  totalDue: number;
  overdue: ReviewQueueCard[];
  today: ReviewQueueCard[];
  learning: ReviewQueueCard[];
  newCards: ReviewQueueCard[];
  summary: {
    newCards: number;
    reviewCards: number;
    learningCards: number;
    overdueCards: number;
    estimatedTime: number; // minutes
  };
}

export interface ScheduledReview {
  cardId: string;
  front: string;
  back?: string; // Hidden until answered
  explanation?: string;
  difficulty: string;
  currentInterval: number;
  currentEase: number;
  lastReviewDate: Date;
}

/**
 * Queue Manager Service
 *
 * Responsibility:
 * - Load cards due for review
 * - Prioritize cards by urgency (overdue first)
 * - Track queue position
 * - Manage session flow
 */
export class ReviewQueueService {
  /**
   * Get daily review queue for a user in a deck
   *
   * Returns cards organized by:
   * 1. Overdue cards (most urgent)
   * 2. Today's cards (scheduled for today)
   * 3. Learning cards (new cards being learned)
   * 4. New cards (not yet started)
   *
   * @param userId User identifier
   * @param deckId Deck identifier
   * @returns Organized review queue
   */
  static async getDailyQueue(
    userId: string,
    deckId: string,
  ): Promise<ReviewQueue> {
    try {
      // Load all cards from this deck
      const cards = await Flashcard.find({
        userId,
        deckId,
      }).select("front back explanation difficulty sm2 statistics");

      if (cards.length === 0) {
        return {
          userId,
          deckId,
          totalDue: 0,
          overdue: [],
          today: [],
          learning: [],
          newCards: [],
          summary: {
            newCards: 0,
            reviewCards: 0,
            learningCards: 0,
            overdueCards: 0,
            estimatedTime: 0,
          },
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Categorize cards
      const overdue: ReviewQueueCard[] = [];
      const today_: ReviewQueueCard[] = [];
      const learning: ReviewQueueCard[] = [];
      const newCards: ReviewQueueCard[] = [];

      cards.forEach((card) => {
        const queueCard: ReviewQueueCard = {
          id: card._id.toString(),
          front: card.front,
          explanation: card.explanation,
          difficulty: card.difficulty,
          priority: SM2Algorithm.getPriority(card.sm2 as any),
          reviewType: this.getReviewType(card),
          daysOverdue: this.calculateDaysOverdue(card),
        };

        if (card.sm2.repetition === 0) {
          // Never reviewed - new card
          newCards.push(queueCard);
        } else if (card.sm2.repetition < 3) {
          // Few reviews - learning card
          learning.push(queueCard);
        } else if (card.sm2.nextReviewDate < today) {
          // Needs review - overdue
          overdue.push(queueCard);
        } else if (
          card.sm2.nextReviewDate.toDateString() === today.toDateString()
        ) {
          // Scheduled for today
          today_.push(queueCard);
        }
      });

      // Sort by priority
      overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
      today_.sort((a, b) => b.daysOverdue - a.daysOverdue);
      learning.sort((a, b) => {
        const aReps =
          cards.find((c) => c._id.toString() === a.id)?.sm2.repetition || 0;
        const bReps =
          cards.find((c) => c._id.toString() === b.id)?.sm2.repetition || 0;
        return aReps - bReps; // Newer cards first
      });

      // Calculate estimated time
      const totalCards = overdue.length + today_.length + learning.length;
      const estimatedTime = totalCards * 1; // ~1 minute per card (rough estimate)

      return {
        userId,
        deckId,
        totalDue: totalCards,
        overdue,
        today: today_,
        learning,
        newCards,
        summary: {
          newCards: newCards.length,
          reviewCards: overdue.length + today_.length,
          learningCards: learning.length,
          overdueCards: overdue.length,
          estimatedTime,
        },
      };
    } catch (error) {
      console.error("Error getting daily queue:", error);
      throw error;
    }
  }

  /**
   * Get next card to review in session
   *
   * Returns the most urgent card from the queue
   * Priority:
   * 1. Overdue cards (most urgent)
   * 2. Today's cards
   * 3. Learning cards
   * 4. New cards (if queue not full)
   *
   * @param userId User identifier
   * @param deckId Deck identifier
   * @param excludeCardIds Cards to skip in current session
   * @returns Next card to review
   */
  static async getNextCard(
    userId: string,
    deckId: string,
    excludeCardIds: string[] = [],
  ): Promise<ScheduledReview | null> {
    try {
      const queue = await this.getDailyQueue(userId, deckId);

      // Priority order
      const candidateLists = [
        queue.overdue,
        queue.today,
        queue.learning,
        queue.newCards,
      ];

      for (const list of candidateLists) {
        for (const queueCard of list) {
          if (!excludeCardIds.includes(queueCard.id)) {
            // Load full card details
            const card = await Flashcard.findById(queueCard.id);
            if (card) {
              return {
                cardId: card._id.toString(),
                front: card.front,
                back: card.back,
                explanation: card.explanation,
                difficulty: card.difficulty,
                currentInterval: card.sm2.interval,
                currentEase: card.sm2.easeFactor,
                lastReviewDate: card.sm2.lastReviewDate,
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting next card:", error);
      throw error;
    }
  }

  /**
   * Record card review and update SM-2 state
   *
   * @param userId User identifier
   * @param cardId Card identifier
   * @param quality Quality rating (0-5)
   * @param responseTime Time to answer in milliseconds
   * @returns Updated card state
   */
  static async recordReview(
    userId: string,
    cardId: string,
    quality: number,
    responseTime: number,
  ) {
    try {
      const card = await Flashcard.findOne({
        _id: cardId,
        userId,
      });

      if (!card) {
        throw new Error("Card not found");
      }

      // Calculate new SM-2 parameters
      const result = SM2Algorithm.calculateNextReview(
        card.sm2 as any,
        quality,
        responseTime,
      );

      // Update card state
      card.sm2.easeFactor = result.newEaseFactor;
      card.sm2.interval = result.newInterval;
      card.sm2.repetition = result.newRepetition;
      card.sm2.nextReviewDate = result.nextReviewDate;
      card.sm2.lastReviewDate = new Date();
      card.sm2.quality = quality;

      // Update statistics
      const isCorrect = quality >= 3;
      card.statistics.totalReviews++;
      if (isCorrect) {
        card.statistics.correctReviews++;
      } else {
        card.statistics.incorrectReviews++;
      }

      card.statistics.correctRate =
        (card.statistics.correctReviews / card.statistics.totalReviews) * 100;

      const currentAvgTime = card.statistics.averageResponseTime;
      const reviewCount = card.statistics.totalReviews;
      card.statistics.averageResponseTime =
        (currentAvgTime * (reviewCount - 1) + responseTime) / reviewCount;

      card.statistics.lastReviewDate = new Date();
      card.statistics.updatedAt = new Date();
      card.lastAttempt = new Date();

      // Add to review history
      card.reviewHistory.push({
        date: new Date(),
        quality,
        responseTime,
        correct: isCorrect,
      });

      // Save updated card
      await card.save();

      return {
        cardId: card._id.toString(),
        nextReviewDate: result.nextReviewDate,
        newEaseFactor: result.newEaseFactor,
        newInterval: result.newInterval,
        correct: isCorrect,
      };
    } catch (error) {
      console.error("Error recording review:", error);
      throw error;
    }
  }

  /**
   * Batch record reviews for session completion
   *
   * @param userId User identifier
   * @param reviews Array of review results
   * @returns Summary of updates
   */
  static async recordBatchReviews(
    userId: string,
    reviews: Array<{
      cardId: string;
      quality: number;
      responseTime: number;
    }>,
  ) {
    const results = [];
    for (const review of reviews) {
      try {
        const result = await this.recordReview(
          userId,
          review.cardId,
          review.quality,
          review.responseTime,
        );
        results.push({ ...result, status: "success" });
      } catch (error) {
        results.push({
          cardId: review.cardId,
          status: "error",
          error: (error as Error).message,
        });
      }
    }
    return results;
  }

  /**
   * Get learning statistics for deck
   *
   * @param userId User identifier
   * @param deckId Deck identifier
   * @returns Learning statistics
   */
  static async getDeckStats(userId: string, deckId: string) {
    try {
      const cards = await Flashcard.find({ userId, deckId });

      if (cards.length === 0) {
        return {
          totalCards: 0,
          newCards: 0,
          learningCards: 0,
          matureCards: 0,
          totalReviews: 0,
          averageEase: 0,
          averageCorrectRate: 0,
        };
      }

      let totalReviews = 0;
      let totalEase = 0;
      let totalCorrectRate = 0;
      let newCards = 0;
      let learningCards = 0;
      let matureCards = 0;

      cards.forEach((card) => {
        totalReviews += card.statistics.totalReviews;
        totalEase += card.sm2.easeFactor;
        totalCorrectRate += card.statistics.correctRate;

        if (card.sm2.repetition === 0) {
          newCards++;
        } else if (card.sm2.repetition < 3) {
          learningCards++;
        } else {
          matureCards++;
        }
      });

      return {
        totalCards: cards.length,
        newCards,
        learningCards,
        matureCards,
        totalReviews,
        averageEase: parseFloat((totalEase / cards.length).toFixed(2)),
        averageCorrectRate: parseFloat(
          (totalCorrectRate / cards.length).toFixed(1),
        ),
      };
    } catch (error) {
      console.error("Error getting deck stats:", error);
      throw error;
    }
  }

  /**
   * Helper: Determine review type
   */
  private static getReviewType(
    card: IFlashcard,
  ): "new" | "learning" | "review" {
    if (card.sm2.repetition === 0) return "new";
    if (card.sm2.repetition < 3) return "learning";
    return "review";
  }

  /**
   * Helper: Calculate days overdue
   */
  private static calculateDaysOverdue(card: IFlashcard): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = today.getTime() - card.sm2.nextReviewDate.getTime();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));

    return Math.max(0, days);
  }
}

/**
 * Daily Scheduler Service
 *
 * Manages when cards should be reviewed
 * Handles daily limits and recommendations
 */
export class DailySchedulerService {
  /**
   * Get recommended study plan for the day
   *
   * @param userId User identifier
   * @param decks Array of deck IDs to include
   * @returns Daily study plan
   */
  static async getDailyPlan(userId: string, decks: string[]) {
    try {
      const plan: any = {
        date: new Date().toISOString().split("T")[0],
        decks: [],
        totalNewCards: 0,
        totalReviewCards: 0,
        estimatedTime: 0,
      };

      for (const deckId of decks) {
        const queue = await ReviewQueueService.getDailyQueue(userId, deckId);
        const stats = await ReviewQueueService.getDeckStats(userId, deckId);

        plan.decks.push({
          deckId,
          dueCards: queue.summary.reviewCards,
          newCards: Math.min(queue.summary.newCards, stats.newCards),
          estimatedTime: queue.summary.estimatedTime,
          priority: queue.summary.overdueCards > 0 ? "high" : "normal",
        });

        plan.totalNewCards += queue.summary.newCards;
        plan.totalReviewCards += queue.summary.reviewCards;
        plan.estimatedTime += queue.summary.estimatedTime;
      }

      return plan;
    } catch (error) {
      console.error("Error getting daily plan:", error);
      throw error;
    }
  }

  /**
   * Get streak statistics
   *
   * Tracks consecutive days of study
   *
   * @param userId User identifier
   * @returns Streak information
   */
  static async getStreak(userId: string) {
    try {
      const sessions = await require("../models/Flashcard")
        .ReviewSession.find({
          userId,
        })
        .sort({ createdAt: -1 })
        .limit(30);

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const dates = new Set<string>();
      sessions.forEach((session: any) => {
        const date = session.createdAt.toISOString().split("T")[0];
        dates.add(date);
      });

      const sortedDates = Array.from(dates).sort().reverse();
      let lastDate: Date | null = null;

      sortedDates.forEach((dateStr: string) => {
        const currentDate = new Date(dateStr);

        if (!lastDate) {
          tempStreak = 1;
        } else {
          const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = currentDate;
      });

      // Check if today is in the streak
      const today = new Date().toISOString().split("T")[0];
      if (sortedDates[0] === today) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }

      return {
        currentStreak,
        longestStreak,
        totalDaysStudied: dates.size,
      };
    } catch (error) {
      console.error("Error getting streak:", error);
      throw error;
    }
  }
}
