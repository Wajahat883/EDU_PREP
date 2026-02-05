/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * The SM-2 algorithm is a scientific approach to spaced repetition that
 * optimizes the timing of review intervals to maximize learning efficiency.
 *
 * Key Concepts:
 * - Quality: Rating of answer (0-5 scale)
 * - Ease Factor: Difficulty multiplier (starts at 2.5, min 1.3)
 * - Interval: Days until next review
 * - Repetition: Number of times card has been reviewed
 */

export interface ReviewMetrics {
  quality: number; // 0-5 (0=fail, 5=perfect)
  responseTime: number; // milliseconds
  date: Date;
}

export interface SM2CardState {
  id: string;
  easeFactor: number; // EF (starts at 2.5)
  interval: number; // Days until next review
  repetition: number; // Total reviews completed
  nextReviewDate: Date;
  lastReviewDate: Date;
  reviewHistory: ReviewMetrics[];
}

export interface SM2CalculationResult {
  newEaseFactor: number;
  newInterval: number;
  newRepetition: number;
  nextReviewDate: Date;
  quality: number;
}

/**
 * SM-2 Algorithm - Core Spaced Repetition Logic
 *
 * The algorithm adjusts review intervals based on how well user remembers.
 * - Correct answers → longer intervals
 * - Incorrect answers → shorter intervals
 * - Difficulty affects future intervals (ease factor)
 */
export class SM2Algorithm {
  /**
   * Initialize a new flashcard with SM-2 defaults
   *
   * Defaults:
   * - Ease Factor: 2.5 (standard difficulty)
   * - Interval: 1 (first review tomorrow)
   * - Repetition: 0 (not yet reviewed)
   */
  static initializeCard(cardId: string): SM2CardState {
    return {
      id: cardId,
      easeFactor: 2.5, // Default ease factor
      interval: 1, // First review: 1 day
      repetition: 0, // Not yet reviewed
      nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      lastReviewDate: new Date(),
      reviewHistory: [],
    };
  }

  /**
   * Calculate new SM-2 parameters after review
   *
   * Formula:
   * - If quality >= 3: schedule for next interval
   * - If quality < 3: reset to interval 1 (failed)
   *
   * Ease Factor (EF) Formula:
   * EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
   *
   * Interval Formula:
   * - If repetition = 1: I(1) = 1
   * - If repetition = 2: I(2) = 3
   * - If repetition > 2: I(n) = I(n-1) * EF
   *
   * @param cardState Current SM-2 state
   * @param quality Rating 0-5 (0=fail, 5=perfect)
   * @param responseTime Time taken to answer (ms)
   * @returns Calculation result with new parameters
   */
  static calculateNextReview(
    cardState: SM2CardState,
    quality: number,
    responseTime: number = 0,
  ): SM2CalculationResult {
    // Validate input
    if (quality < 0 || quality > 5) {
      throw new Error("Quality must be between 0 and 5");
    }

    let newRepetition = cardState.repetition + 1;
    let newInterval: number;
    let newEaseFactor = cardState.easeFactor;

    /**
     * Step 1: Calculate new Ease Factor
     * EF' = max(1.3, EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
     */
    newEaseFactor =
      cardState.easeFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum ease factor is 1.3
    newEaseFactor = Math.max(1.3, newEaseFactor);

    /**
     * Step 2: Determine interval based on quality
     * If quality < 3: Card was forgotten, reset interval
     * If quality >= 3: Card was remembered, increase interval
     */
    if (quality < 3) {
      // Forgotten - reset to first review
      newRepetition = 1;
      newInterval = 1; // Review tomorrow
    } else {
      // Remembered - apply interval formula
      if (newRepetition === 1) {
        newInterval = 1; // First successful review: 1 day
      } else if (newRepetition === 2) {
        newInterval = 3; // Second review: 3 days
      } else {
        // Subsequent reviews: multiply by ease factor
        newInterval = Math.round(cardState.interval * newEaseFactor);
      }
    }

    /**
     * Step 3: Calculate next review date
     * Add interval days to today
     */
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    nextReviewDate.setHours(0, 0, 0, 0); // Midnight

    return {
      newEaseFactor: parseFloat(newEaseFactor.toFixed(2)),
      newInterval,
      newRepetition,
      nextReviewDate,
      quality,
    };
  }

  /**
   * Update card state with review result
   *
   * @param cardState Current card state
   * @param calculation Result from calculateNextReview
   * @param responseTime Time taken to answer
   * @returns Updated SM2CardState
   */
  static updateCardState(
    cardState: SM2CardState,
    calculation: SM2CalculationResult,
    responseTime: number = 0,
  ): SM2CardState {
    const updatedCard = { ...cardState };

    updatedCard.easeFactor = calculation.newEaseFactor;
    updatedCard.interval = calculation.newInterval;
    updatedCard.repetition = calculation.newRepetition;
    updatedCard.nextReviewDate = calculation.nextReviewDate;
    updatedCard.lastReviewDate = new Date();

    // Add to review history
    updatedCard.reviewHistory.push({
      quality: calculation.quality,
      responseTime,
      date: new Date(),
    });

    return updatedCard;
  }

  /**
   * Get learning statistics for a card
   *
   * @param cardState SM-2 card state
   * @returns Statistics object
   */
  static getCardStatistics(cardState: SM2CardState) {
    const history = cardState.reviewHistory;
    const successCount = history.filter((r) => r.quality >= 3).length;
    const failureCount = history.filter((r) => r.quality < 3).length;
    const totalReviews = history.length;
    const successRate =
      totalReviews > 0
        ? ((successCount / totalReviews) * 100).toFixed(1)
        : "N/A";

    const avgResponseTime =
      history.length > 0
        ? Math.round(
            history.reduce((sum, r) => sum + r.responseTime, 0) /
              history.length,
          )
        : 0;

    return {
      successCount,
      failureCount,
      totalReviews,
      successRate,
      avgResponseTime,
      easeFactor: cardState.easeFactor.toFixed(2),
      nextReviewDate: cardState.nextReviewDate.toISOString().split("T")[0],
      daysUntilReview: Math.ceil(
        (cardState.nextReviewDate.getTime() - Date.now()) /
          (24 * 60 * 60 * 1000),
      ),
    };
  }

  /**
   * Determine review priority based on SM-2 state
   *
   * Priority Levels:
   * - OVERDUE: nextReviewDate < today
   * - TODAY: nextReviewDate = today
   * - TOMORROW: nextReviewDate = tomorrow
   * - FUTURE: nextReviewDate > tomorrow
   *
   * @param cardState SM-2 card state
   * @returns Priority level string
   */
  static getPriority(
    cardState: SM2CardState,
  ): "OVERDUE" | "TODAY" | "TOMORROW" | "FUTURE" {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextReview = new Date(cardState.nextReviewDate);
    nextReview.setHours(0, 0, 0, 0);

    if (nextReview < today) return "OVERDUE";
    if (nextReview.getTime() === today.getTime()) return "TODAY";
    if (nextReview.getTime() === tomorrow.getTime()) return "TOMORROW";
    return "FUTURE";
  }

  /**
   * Get recommended daily review targets
   *
   * Based on:
   * - New cards: 20 per day
   * - Review cards: Based on spacing formula
   * - Total daily load: ~50 cards
   *
   * @param cardCount Total cards in deck
   * @param reviewPercentage % of cards that are mature (>3 reviews)
   * @returns Daily targets object
   */
  static getDailyTargets(cardCount: number, reviewPercentage: number = 0.3) {
    const reviewCount = Math.round(cardCount * reviewPercentage);
    const newCards = Math.min(20, cardCount - reviewCount);
    const reviewCards = Math.min(30, reviewCount);

    return {
      newCards,
      reviewCards,
      totalDaily: newCards + reviewCards,
      recommendedStudyTime: newCards * 1.5 + reviewCards * 0.5, // minutes
    };
  }
}

/**
 * Batch SM-2 Calculator
 * Efficiently calculate SM-2 for multiple cards
 */
export class SM2BatchCalculator {
  /**
   * Calculate reviews for multiple cards
   *
   * @param cards Array of SM2CardState
   * @param quality Quality rating for each card
   * @returns Array of calculation results
   */
  static calculateBatch(
    cards: SM2CardState[],
    qualities: number[],
  ): SM2CalculationResult[] {
    return cards.map((card, index) =>
      SM2Algorithm.calculateNextReview(card, qualities[index]),
    );
  }

  /**
   * Get daily review queue
   *
   * Returns cards due for review today, organized by priority
   *
   * @param cards Array of all cards
   * @returns Organized queue
   */
  static getDailyQueue(cards: SM2CardState[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue: SM2CardState[] = [];
    const today_: SM2CardState[] = [];
    const learning: SM2CardState[] = [];

    cards.forEach((card) => {
      if (card.repetition === 0) {
        learning.push(card);
      } else if (card.nextReviewDate < today) {
        overdue.push(card);
      } else if (card.nextReviewDate.toDateString() === today.toDateString()) {
        today_.push(card);
      }
    });

    // Sort by ease factor (harder cards first)
    overdue.sort((a, b) => a.easeFactor - b.easeFactor);
    today_.sort((a, b) => a.easeFactor - b.easeFactor);
    learning.sort((a, b) => b.repetition - a.repetition);

    return {
      overdue,
      today: today_,
      learning,
      totalDue: overdue.length + today_.length + learning.length,
    };
  }
}

/**
 * Heatmap Generator for SM-2
 * Creates visualization data for learning patterns
 */
export class SM2HeatmapGenerator {
  /**
   * Generate 30-day learning activity heatmap
   *
   * @param cards All cards with review history
   * @returns Heatmap data for 30 days
   */
  static generate30DayHeatmap(cards: SM2CardState[]) {
    const heatmap: Record<string, number> = {};
    const today = new Date();

    // Initialize 30-day range
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      heatmap[dateStr] = 0;
    }

    // Count reviews per day
    cards.forEach((card) => {
      card.reviewHistory.forEach((review) => {
        const dateStr = review.date.toISOString().split("T")[0];
        if (heatmap[dateStr] !== undefined) {
          heatmap[dateStr]++;
        }
      });
    });

    return heatmap;
  }

  /**
   * Get intensity level for heatmap visualization
   *
   * @param count Number of reviews on that day
   * @returns Intensity level (0-4)
   */
  static getIntensity(count: number): number {
    if (count === 0) return 0;
    if (count < 5) return 1;
    if (count < 10) return 2;
    if (count < 20) return 3;
    return 4;
  }
}
