import mongoose, { Schema, Document } from "mongoose";

export interface IAnswer {
  questionId: string;
  selectedOption: string;
  timeSpent: number;
  isCorrect?: boolean;
  markedForReview?: boolean;
  hints?: string[];
}

export interface ITestSession extends Document {
  sessionId: string;
  userId: string;
  examTypeId: string;
  mode: "timed" | "tutor" | "untimed";
  difficulty: number;
  startedAt: Date;
  endedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  totalPausedTime: number;
  status: "in_progress" | "paused" | "completed" | "abandoned";

  // Question metadata
  questionIds: string[];
  currentQuestionIndex: number;

  // Timing (for timed mode)
  timeLimit?: number; // in seconds
  timeRemaining?: number;

  // Answers
  answers: IAnswer[];

  // Statistics
  statistics: {
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
    averageTimePerQuestion: number;
    bloomDistribution: Record<string, number>;
    difficultyStats: {
      attempted: number[];
      correct: number[];
    };
  };

  // Adaptive features
  adaptiveFeatures: {
    nextQuestionDifficulty: number;
    difficultyHistory: number[];
    adaptiveEnabled: boolean;
  };

  // Hints
  hintsUsed: number;
  hintsRemaining: number;

  // Performance tracking
  performance: {
    questionStartedAt: Date;
    questionEndedAt?: Date;
    examStartedAt: Date;
    examEndedAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const testSessionSchema = new Schema<ITestSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    examTypeId: { type: String, required: true },
    mode: {
      type: String,
      enum: ["timed", "tutor", "untimed"],
      default: "tutor",
    },
    difficulty: { type: Number, default: 5, min: 1, max: 10 },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    totalPausedTime: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in_progress", "paused", "completed", "abandoned"],
      default: "in_progress",
    },

    // Question metadata
    questionIds: [String],
    currentQuestionIndex: { type: Number, default: 0 },

    // Timing
    timeLimit: Number,
    timeRemaining: Number,

    // Answers
    answers: [
      {
        questionId: String,
        selectedOption: String,
        timeSpent: Number,
        isCorrect: Boolean,
        markedForReview: { type: Boolean, default: false },
        hints: [String],
      },
    ],

    // Statistics
    statistics: {
      correctCount: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      scorePercentage: { type: Number, default: 0 },
      averageTimePerQuestion: { type: Number, default: 0 },
      bloomDistribution: { type: Map, of: Number, default: new Map() },
      difficultyStats: {
        attempted: [Number],
        correct: [Number],
      },
    },

    // Adaptive features
    adaptiveFeatures: {
      nextQuestionDifficulty: { type: Number, default: 5 },
      difficultyHistory: [Number],
      adaptiveEnabled: { type: Boolean, default: false },
    },

    // Hints
    hintsUsed: { type: Number, default: 0 },
    hintsRemaining: { type: Number, default: 3 },

    // Performance tracking
    performance: {
      questionStartedAt: Date,
      questionEndedAt: Date,
      examStartedAt: Date,
      examEndedAt: Date,
    },
  },
  { timestamps: true },
);

// Indexes for efficient queries
testSessionSchema.index({ userId: 1, createdAt: -1 });
testSessionSchema.index({ sessionId: 1 });
testSessionSchema.index({ examTypeId: 1, mode: 1 });
testSessionSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model<ITestSession>("TestSession", testSessionSchema);
