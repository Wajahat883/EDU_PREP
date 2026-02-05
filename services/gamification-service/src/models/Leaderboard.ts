/**
 * Leaderboard Model
 * Location: services/gamification-service/src/models/Leaderboard.ts
 *
 * Tracks user rankings across different time periods
 */

import mongoose, { Document, Schema } from "mongoose";

export interface ILeaderboard extends Document {
  userId: mongoose.Types.ObjectId;
  period: string; // 'global', 'YYYY-MM', 'YYYY-Www'
  points: number;
  questionsAnswered: number;
  accuracy: number;
  rank: number;
  percentile: number;
  updatedAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
      // Values like 'global', '2024-01', '2024-W01'
    },
    points: {
      type: Number,
      default: 0,
      index: true,
    },
    questionsAnswered: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    percentile: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Compound index for ranking queries
leaderboardSchema.index({ period: 1, points: -1 });
leaderboardSchema.index({ userId: 1, period: 1 }, { unique: true });

export const LeaderboardModel = mongoose.model<ILeaderboard>(
  "Leaderboard",
  leaderboardSchema,
);
