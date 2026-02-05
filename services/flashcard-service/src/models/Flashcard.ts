import mongoose, { Schema, Document } from "mongoose";

/**
 * Flashcard Document Schema
 *
 * Stores individual flashcard data including:
 * - Card content (front/back)
 * - SM-2 spaced repetition state
 * - Review history
 * - User performance metrics
 */
export interface IFlashcard extends Document {
  // Core card data
  userId: string;
  deckId: string;
  front: string; // Question/prompt
  back: string; // Answer
  explanation?: string; // Optional detailed explanation

  // SM-2 spaced repetition state
  sm2: {
    easeFactor: number; // EF value
    interval: number; // Days until review
    repetition: number; // Total successful reviews
    nextReviewDate: Date;
    lastReviewDate: Date;
    quality?: number; // Last quality rating
  };

  // Performance tracking
  statistics: {
    totalReviews: number;
    correctReviews: number;
    incorrectReviews: number;
    correctRate: number; // 0-100
    averageResponseTime: number; // milliseconds
    lastReviewDate: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  // Review history
  reviewHistory: Array<{
    date: Date;
    quality: number; // 0-5
    responseTime: number; // milliseconds
    correct: boolean;
  }>;

  // Additional metadata
  tags?: string[];
  difficulty: "easy" | "medium" | "hard"; // Initial difficulty
  source?: string; // Origin (qbank, user-created, etc.)
  isStarred?: boolean;
  lastAttempt?: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    deckId: {
      type: String,
      required: true,
      index: true,
    },
    front: {
      type: String,
      required: true,
      trim: true,
    },
    back: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    sm2: {
      easeFactor: {
        type: Number,
        default: 2.5,
        min: 1.3,
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
      },
      repetition: {
        type: Number,
        default: 0,
        min: 0,
      },
      nextReviewDate: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setDate(date.getDate() + 1);
          return date;
        },
      },
      lastReviewDate: {
        type: Date,
        default: Date.now,
      },
      quality: {
        type: Number,
        min: 0,
        max: 5,
      },
    },
    statistics: {
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      correctReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      incorrectReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      correctRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastReviewDate: {
        type: Date,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    reviewHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        quality: {
          type: Number,
          required: true,
          min: 0,
          max: 5,
        },
        responseTime: {
          type: Number,
          required: true,
          min: 0,
        },
        correct: {
          type: Boolean,
          required: true,
        },
        _id: false,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    source: {
      type: String,
      trim: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    lastAttempt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
flashcardSchema.index({ userId: 1, deckId: 1 });
flashcardSchema.index({ userId: 1, "sm2.nextReviewDate": 1 });
flashcardSchema.index({ userId: 1, isStarred: 1 });
flashcardSchema.index({ userId: 1, tags: 1 });

export const Flashcard = mongoose.model<IFlashcard>(
  "Flashcard",
  flashcardSchema,
);

/**
 * Flashcard Deck Schema
 *
 * Groups flashcards into organized decks/sets
 * Tracks deck-level statistics and settings
 */
export interface IFlashcardDeck extends Document {
  userId: string;
  name: string;
  description?: string;
  cardCount: number;

  // Deck statistics
  statistics: {
    totalReviews: number;
    averageEase: number;
    averageInterval: number;
    matureCards: number; // Cards with >3 reviews
    learningCards: number; // Cards with 0-3 reviews
    newCards: number; // Cards not yet reviewed
  };

  // Deck settings
  settings: {
    dailyNewCardLimit: number; // Max new cards per day
    dailyReviewLimit: number; // Max reviews per day
    timeLimit?: number; // Minutes per session
    cardOrder: "mixed" | "newest" | "oldest" | "due";
  };

  // Metadata
  isPublic: boolean;
  tags?: string[];
  color?: string; // For UI representation
  createdAt: Date;
  updatedAt: Date;
}

const flashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cardCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    statistics: {
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageEase: {
        type: Number,
        default: 2.5,
        min: 1.3,
      },
      averageInterval: {
        type: Number,
        default: 1,
        min: 1,
      },
      matureCards: {
        type: Number,
        default: 0,
        min: 0,
      },
      learningCards: {
        type: Number,
        default: 0,
        min: 0,
      },
      newCards: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    settings: {
      dailyNewCardLimit: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
      dailyReviewLimit: {
        type: Number,
        default: 200,
        min: 1,
        max: 1000,
      },
      timeLimit: {
        type: Number,
        min: 5,
        max: 180,
      },
      cardOrder: {
        type: String,
        enum: ["mixed", "newest", "oldest", "due"],
        default: "mixed",
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    color: {
      type: String,
      match: /^#[0-9A-F]{6}$/i,
      default: "#1976d2",
    },
  },
  {
    timestamps: true,
  },
);

flashcardDeckSchema.index({ userId: 1 });

export const FlashcardDeck = mongoose.model<IFlashcardDeck>(
  "FlashcardDeck",
  flashcardDeckSchema,
);

/**
 * Review Session Schema
 *
 * Tracks individual study sessions for analytics
 */
export interface IReviewSession extends Document {
  userId: string;
  deckId: string;
  startTime: Date;
  endTime: Date;
  cardCount: number; // Cards reviewed in session
  correctCount: number;
  incorrectCount: number;
  totalTime: number; // Seconds
  sessionType: "review" | "new" | "mixed";
  notes?: string;
}

const reviewSessionSchema = new Schema<IReviewSession>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    deckId: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },
    cardCount: {
      type: Number,
      required: true,
      min: 1,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTime: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionType: {
      type: String,
      enum: ["review", "new", "mixed"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const ReviewSession = mongoose.model<IReviewSession>(
  "ReviewSession",
  reviewSessionSchema,
);
