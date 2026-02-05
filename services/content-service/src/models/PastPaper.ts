import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IChapter {
  chapterId: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  summary?: string;
  keywords: string[];
}

export interface IPastPaper extends Document {
  _id: ObjectId;
  title: string;
  examType: string; // e.g., "MCAT", "BOARD_EXAM", "ENTRANCE_TEST"
  year: number;
  month?: string;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  duration: number; // in minutes
  subjects: string[];
  description: string;
  pdfUrl: string;
  solutionUrl?: string;
  fileSize: number;
  uploadedBy: ObjectId;
  downloadCount: number;
  rating: number;
  reviews: ObjectId[];
  tags: string[];
  questions?: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const pastPaperSchema = new Schema<IPastPaper>(
  {
    title: { type: String, required: true, index: true },
    examType: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    month: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    totalQuestions: { type: Number, required: true },
    duration: { type: Number, required: true },
    subjects: { type: [String], index: true },
    description: String,
    pdfUrl: { type: String, required: true },
    solutionUrl: String,
    fileSize: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    downloadCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    tags: [String],
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  },
  { timestamps: true },
);

// Text index for search
pastPaperSchema.index({
  title: "text",
  description: "text",
  subjects: "text",
  tags: "text",
});

export const PastPaper = mongoose.model<IPastPaper>(
  "PastPaper",
  pastPaperSchema,
);
