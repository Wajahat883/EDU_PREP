import mongoose, { Schema, Document } from "mongoose";

export interface PerformanceMetric {
  examType: string;
  mode: "timed" | "tutor" | "untimed";
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  grade: string;
  timeSpent: number;
  date: Date;
  bloomLevelBreakdown: Record<string, { correct: number; total: number }>;
  difficultyBreakdown: Record<number, { correct: number; total: number }>;
  subjectBreakdown: Record<string, { correct: number; total: number }>;
  hintsUsed: number;
  markedForReview: number;
}

export interface StrengthArea {
  area: string;
  type: "bloomLevel" | "difficulty" | "subject";
  correctPercentage: number;
  questionCount: number;
  trend: "improving" | "stable" | "declining";
}

export interface WeakArea {
  area: string;
  type: "bloomLevel" | "difficulty" | "subject";
  correctPercentage: number;
  questionCount: number;
  trend: "improving" | "stable" | "declining";
  recommendedQuestionCount: number;
}

export interface UserAnalytics extends Document {
  userId: string;
  totalExamsAttempted: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;

  // Performance by mode
  timedModeStats: {
    attempts: number;
    averageScore: number;
    averageTimePerQuestion: number;
  };
  tutorModeStats: {
    attempts: number;
    averageScore: number;
    averageHintsUsed: number;
    adaptiveDifficultyProgression: number;
  };
  untimedModeStats: {
    attempts: number;
    averageScore: number;
    averageReviewCount: number;
  };

  // Performance by exam type
  examTypeStats: Record<
    string,
    {
      attempts: number;
      averageScore: number;
      bestScore: number;
    }
  >;

  // Recent performance
  performanceHistory: PerformanceMetric[];

  // Analytics insights
  strengthAreas: StrengthArea[];
  weakAreas: WeakArea[];

  // Study metrics
  totalStudyTime: number; // in seconds
  consistencyScore: number; // 0-100 (how consistent is the user)
  learningVelocity: number; // score improvement per 10 exams

  // Predictions
  predictedScoreTrend: "improving" | "stable" | "declining";
  projectedScoreIn30Days: number;
  improvementRate: number; // % per day
  recommendedDailyStudyTime: number; // minutes

  // Milestones
  milestones: {
    firstExam: Date;
    exam50: Date;
    exam100: Date;
    personalBest: {
      score: number;
      date: Date;
      examType: string;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

const userAnalyticsSchema = new Schema<UserAnalytics>(
  {
    userId: { type: String, required: true, unique: true },
    totalExamsAttempted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 100 },

    // Performance by mode
    timedModeStats: {
      attempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageTimePerQuestion: { type: Number, default: 0 },
    },
    tutorModeStats: {
      attempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageHintsUsed: { type: Number, default: 0 },
      adaptiveDifficultyProgression: { type: Number, default: 0 },
    },
    untimedModeStats: {
      attempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageReviewCount: { type: Number, default: 0 },
    },

    // Performance by exam type
    examTypeStats: { type: Map, of: Object, default: new Map() },

    // Recent performance
    performanceHistory: [
      {
        examType: String,
        mode: String,
        scorePercentage: Number,
        correctCount: Number,
        totalQuestions: Number,
        grade: String,
        timeSpent: Number,
        date: Date,
        bloomLevelBreakdown: { type: Map, of: Object },
        difficultyBreakdown: { type: Map, of: Object },
        subjectBreakdown: { type: Map, of: Object },
        hintsUsed: Number,
        markedForReview: Number,
      },
    ],

    // Analytics insights
    strengthAreas: [
      {
        area: String,
        type: String,
        correctPercentage: Number,
        questionCount: Number,
        trend: String,
      },
    ],
    weakAreas: [
      {
        area: String,
        type: String,
        correctPercentage: Number,
        questionCount: Number,
        trend: String,
        recommendedQuestionCount: Number,
      },
    ],

    // Study metrics
    totalStudyTime: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
    learningVelocity: { type: Number, default: 0 },

    // Predictions
    predictedScoreTrend: {
      type: String,
      enum: ["improving", "stable", "declining"],
      default: "stable",
    },
    projectedScoreIn30Days: { type: Number, default: 0 },
    improvementRate: { type: Number, default: 0 },
    recommendedDailyStudyTime: { type: Number, default: 60 },

    // Milestones
    milestones: {
      firstExam: Date,
      exam50: Date,
      exam100: Date,
      personalBest: {
        score: Number,
        date: Date,
        examType: String,
      },
    },
  },
  { timestamps: true },
);

userAnalyticsSchema.index({ userId: 1 });
userAnalyticsSchema.index({ averageScore: -1 });
userAnalyticsSchema.index({ totalExamsAttempted: -1 });
userAnalyticsSchema.index({ "performanceHistory.date": -1 });

export default mongoose.model<UserAnalytics>(
  "UserAnalytics",
  userAnalyticsSchema,
);
