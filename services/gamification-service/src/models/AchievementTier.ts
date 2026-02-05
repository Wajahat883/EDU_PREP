/**
 * Achievement Tier Model
 * Location: services/gamification-service/src/models/AchievementTier.ts
 *
 * Represents user progression through achievement tiers
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IAchievementTier extends Document {
  userId: mongoose.Types.ObjectId;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  progress: number; // 0-100%
  pointsRequired: number;
  currentPoints: number;
  achievementsUnlocked: string[];
  unlockedAt: Date;
  nextTierAt?: Date;
}

const achievementTierSchema = new Schema<IAchievementTier>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    pointsRequired: {
      type: Number,
      default: 1000, // Bronze: 1,000, Silver: 5,000, Gold: 15,000, Platinum: 50,000, Diamond: 100,000+
    },
    currentPoints: {
      type: Number,
      default: 0,
    },
    achievementsUnlocked: [
      {
        type: String,
        ref: "Badge",
      },
    ],
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    nextTierAt: Date,
  },
  { timestamps: true },
);

achievementTierSchema.index({ userId: 1, tier: 1 });
achievementTierSchema.index({ tier: 1, currentPoints: -1 });

export const AchievementTierModel = mongoose.model<IAchievementTier>(
  "AchievementTier",
  achievementTierSchema,
);
