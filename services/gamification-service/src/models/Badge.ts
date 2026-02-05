/**
 * Badge Model
 * Location: services/gamification-service/src/models/Badge.ts
 *
 * Stores awarded badges to users with metadata
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: string;
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon: string;
  awardedAt: Date;
  progress?: number;
  progressRequired?: number;
  unlockedAt?: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeId: {
      type: String,
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
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary"],
      default: "common",
    },
    icon: {
      type: String,
      default: "https://via.placeholder.com/100",
    },
    awardedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    progress: Number,
    progressRequired: Number,
    unlockedAt: Date,
  },
  { timestamps: true },
);

// Index for finding user's badges
badgeSchema.index({ userId: 1, awardedAt: -1 });

export const BadgeModel = mongoose.model<IBadge>("Badge", badgeSchema);
