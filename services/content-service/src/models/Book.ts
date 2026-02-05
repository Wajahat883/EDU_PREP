import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IChapter {
  chapterId: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  summary?: string;
  keywords: string[];
}

export interface IBook extends Document {
  _id: ObjectId;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  subject: string;
  description: string;
  coverImageUrl: string;
  pdfUrl?: string;
  chapters: IChapter[];
  totalPages: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  edition: number;
  publishDate: Date;
  language: string;
  rating: number;
  reviews: ObjectId[];
  tags: string[];
  isFree: boolean;
  price?: number;
  downloadCount: number;
  viewCount: number;
  relatedTopics: string[];
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema({
  chapterId: { type: String, required: true },
  title: { type: String, required: true },
  pageStart: { type: Number, required: true },
  pageEnd: { type: Number, required: true },
  summary: String,
  keywords: [String],
});

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    publisher: String,
    isbn: { type: String, unique: true, sparse: true },
    category: { type: String, index: true },
    subject: { type: String, index: true },
    description: String,
    coverImageUrl: String,
    pdfUrl: String,
    chapters: [chapterSchema],
    totalPages: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    edition: { type: Number, default: 1 },
    publishDate: Date,
    language: { type: String, default: "English" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    tags: [String],
    isFree: { type: Boolean, default: false },
    price: Number,
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    relatedTopics: [String],
  },
  { timestamps: true },
);

// Text index for search
bookSchema.index({
  title: "text",
  author: "text",
  description: "text",
  subject: "text",
  tags: "text",
});

export const Book = mongoose.model<IBook>("Book", bookSchema);
