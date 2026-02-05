import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IReadingProgress extends Document {
  _id: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  currentPage: number;
  totalPages: number;
  completedChapters: string[];
  timeSpentMinutes: number;
  lastAccessedAt: Date;
  percentageComplete: number;
  createdAt: Date;
  updatedAt: Date;
}

const readingProgressSchema = new Schema<IReadingProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    chapterId: { type: String, required: true },
    currentPage: { type: Number, default: 0 },
    totalPages: { type: Number, required: true },
    completedChapters: { type: [String], default: [] },
    timeSpentMinutes: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    percentageComplete: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const ReadingProgress = mongoose.model<IReadingProgress>(
  "ReadingProgress",
  readingProgressSchema,
);
