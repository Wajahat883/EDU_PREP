/**
 * Challenge Model
 * Location: services/gamification-service/src/models/Challenge.ts
 *
 * Represents daily/weekly/seasonal challenges
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IChallenge extends Document {
  type: "daily" | "weekly" | "seasonal" | "event";
  name: string;
  description: string;
  objective: {
    questionsToAnswer: number;
    minAccuracy: number;
    timeLimit: number;
    specificTopics?: string[];
    difficulty?: number;
  };
  reward: {
    points: number;
    badge: string;
    booster?: string;
  };
  startDate: Date;
  endDate: Date;
  completedBy: mongoose.Types.ObjectId[];
  difficultyTier: number;
  featured: boolean;
  maxParticipants?: number;
}

const challengeSchema = new Schema<IChallenge>(
  {
    type: {
      type: String,
      enum: ["daily", "weekly", "seasonal", "event"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    objective: {
      questionsToAnswer: {
        type: Number,
        required: true,
      },
      minAccuracy: {
        type: Number,
        required: true,
      },
      timeLimit: {
        type: Number,
        required: true,
      },
      specificTopics: [String],
      difficulty: Number,
    },
    reward: {
      points: Number,
      badge: String,
      booster: String,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    difficultyTier: {
      type: Number,
      default: 1,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    maxParticipants: Number,
  },
  { timestamps: true },
);

// Index for active challenges
challengeSchema.index({ type: 1, startDate: 1, endDate: 1 });

export const ChallengeModel = mongoose.model<IChallenge>(
  "Challenge",
  challengeSchema,
);
