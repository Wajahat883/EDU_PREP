/**
 * Learning Path Models
 * Location: services/learning-paths-service/src/models/LearningPath.ts
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IMilestone {
  name: string;
  description: string;
  targetAccuracy: number;
  estimatedDays: number;
  questions: number;
  completedAt?: Date;
}

export interface ICompletionLog {
  questionId: string;
  quality: number;
  timestamp: Date;
  timeSpent: number;
}

export interface ILearningPath extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: "adaptive" | "custom" | "preset";
  subjects: string[];
  difficulty: number; // 1-10
  milestones: IMilestone[];
  estimatedDuration: number; // weeks
  successProbability: number; // 0-100
  recommendations: string[];
  questions: string[]; // question IDs
  questionsCompleted: number;
  totalTimeSpent: number;
  completionLog: ICompletionLog[];
  status: "active" | "completed" | "paused" | "abandoned";
  startDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    name: String,
    description: String,
    targetAccuracy: Number,
    estimatedDays: Number,
    questions: Number,
    completedAt: Date,
  },
  { _id: false },
);

const completionLogSchema = new Schema<ICompletionLog>(
  {
    questionId: String,
    quality: Number,
    timestamp: Date,
    timeSpent: Number,
  },
  { _id: false },
);

const learningPathSchema = new Schema<ILearningPath>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ["adaptive", "custom", "preset"],
      default: "adaptive",
    },
    subjects: [String],
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    milestones: [milestoneSchema],
    estimatedDuration: {
      type: Number,
      default: 4, // weeks
    },
    successProbability: {
      type: Number,
      min: 0,
      max: 100,
    },
    recommendations: [String],
    questions: [String],
    questionsCompleted: {
      type: Number,
      default: 0,
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    completionLog: [completionLogSchema],
    status: {
      type: String,
      enum: ["active", "completed", "paused", "abandoned"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
learningPathSchema.index({ userId: 1, status: 1 });
learningPathSchema.index({ startDate: 1, completedAt: 1 });
learningPathSchema.index({ type: 1, difficulty: 1 });

export const LearningPathModel = mongoose.model<ILearningPath>(
  "LearningPath",
  learningPathSchema,
);
