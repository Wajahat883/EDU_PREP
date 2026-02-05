import { Schema, model, Document } from "mongoose";

export interface ITest extends Document {
  name: string;
  description: string;
  subject: string;
  totalPoints: number;
  passingScore: number;
  timeLimit?: number; // in minutes
  allowReview?: boolean;
  allowCalculator?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showCorrectAnswers?: boolean;
  isPublished?: boolean;
  courseId?: string;
  status: "draft" | "published" | "archived";
  sections: Array<{
    name: string;
    description?: string;
    questions: string[]; // Question IDs
    timeLimit?: number;
    pointsPerQuestion: number;
  }>;
  questionCount: number;
  createdBy: string;
  updatedBy?: string;
  version: number;
  attemptCount?: number;
  avgScore?: number;
  publishedAt?: Date;
  publishedBy?: string;
  archivedAt?: Date;
  deletedAt?: Date; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
    },
    timeLimit: {
      type: Number,
    },
    allowReview: {
      type: Boolean,
      default: false,
    },
    allowCalculator: {
      type: Boolean,
      default: false,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeOptions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    courseId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    sections: [
      {
        name: String,
        description: String,
        questions: [String],
        timeLimit: Number,
        pointsPerQuestion: Number,
      },
    ],
    questionCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    updatedBy: String,
    version: {
      type: Number,
      default: 1,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    avgScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
testSchema.index({ subject: 1, status: 1 });
testSchema.index({ courseId: 1 });
testSchema.index({ createdBy: 1 });

export const Test = model<ITest>("Test", testSchema);
export default Test;
