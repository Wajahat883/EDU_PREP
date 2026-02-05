import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IContentSession extends Document {
  _id: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  chapterId: string;
  contentType: "book" | "pastpaper";
  currentPage: number;
  totalPages: number;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  startedAt: Date;
  endedAt?: Date;
  timeSpentMinutes: number;
  screenshotAttempts: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contentSessionSchema = new Schema<IContentSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", index: true },
    chapterId: String,
    contentType: { type: String, enum: ["book", "pastpaper"], default: "book" },
    currentPage: { type: Number, default: 0 },
    totalPages: { type: Number, required: true },
    sessionToken: { type: String, required: true, unique: true },
    ipAddress: String,
    userAgent: String,
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    timeSpentMinutes: { type: Number, default: 0 },
    screenshotAttempts: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// TTL index - sessions expire after 24 hours
contentSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const ContentSession = mongoose.model<IContentSession>(
  "ContentSession",
  contentSessionSchema,
);
