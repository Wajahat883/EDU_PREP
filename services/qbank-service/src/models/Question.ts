import { Schema, model, Document } from "mongoose";

export interface IQuestion extends Document {
  examTypeId: string;
  subjectId: string;
  subject?: string; // For CSV export compatibility
  topic?: string; // For CSV export compatibility
  text?: string; // Alias for stemText
  type?: string; // Alias for questionType
  questionType: "single" | "multiple" | "drag_drop" | "hotspot";
  stemText: string;
  stemMedia?: {
    images?: string[];
    videos?: string[];
  };
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanationText: string;
  explanation?: string; // For CSV export compatibility
  explanationMedia?: {
    images?: string[];
    links?: string[];
  };
  difficulty: number;
  bloomLevel:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";
  learningObjective?: string;
  keyTakeaway?: string;
  references?: Array<{
    title: string;
    url: string;
  }>;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  reviewedBy?: string;
  version: number;
  status?: string; // For CSV export compatibility
  correctAnswer?: string; // For CSV export compatibility
  revisions?: Array<{
    timestamp?: Date;
    version?: number;
    content: string;
    changedBy?: string;
    createdAt?: Date;
    createdBy?: string;
  }>;
  submittedAt?: Date; // For approval workflow
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  approvalNotes?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  deletedAt?: Date; // Soft delete
  statistics?: {
    correctAttempts: number;
    totalAttempts: number;
    avgTimeSeconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    examTypeId: {
      type: String,
      required: true,
      index: true,
    },
    subjectId: {
      type: String,
      required: true,
      index: true,
    },
    questionType: {
      type: String,
      enum: ["single", "multiple", "drag_drop", "hotspot"],
      default: "single",
    },
    stemText: {
      type: String,
      required: true,
    },
    stemMedia: {
      images: [String],
      videos: [String],
    },
    options: [
      {
        id: String,
        text: String,
        isCorrect: Boolean,
      },
    ],
    explanationText: {
      type: String,
      required: true,
    },
    explanationMedia: {
      images: [String],
      links: [String],
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    bloomLevel: {
      type: String,
      enum: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
    },
    learningObjective: String,
    keyTakeaway: String,
    references: [
      {
        title: String,
        url: String,
      },
    ],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: String,
    reviewedBy: String,
    version: {
      type: Number,
      default: 1,
    },
    statistics: {
      correctAttempts: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      avgTimeSeconds: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
questionSchema.index({ examTypeId: 1, subjectId: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });

export const Question = model<IQuestion>("Question", questionSchema);
export default Question;
