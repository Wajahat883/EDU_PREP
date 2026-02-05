/**
 * Question Manager Service
 *
 * Provides CRUD operations for exam questions:
 * - Create, read, update, delete questions
 * - Bulk import/export functionality
 * - Question categorization and tagging
 * - Difficulty level management
 * - Subject and topic organization
 * - Content approval workflow
 * - Version control for questions
 */

import { Question, IQuestion } from "../models/Question";
import { User, IUser } from "../models/User";

interface QuestionFilter {
  subject?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  status?: "draft" | "review" | "approved" | "rejected";
  tags?: string[];
  createdBy?: string;
  search?: string;
}

interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

class QuestionManagerService {
  /**
   * Create a new question
   */
  async createQuestion(
    data: {
      subject: string;
      topic: string;
      difficulty: "easy" | "medium" | "hard";
      text: string;
      type: "multiple-choice" | "true-false" | "short-answer" | "essay";
      options?: Array<{ text: string; isCorrect: boolean }>;
      correctAnswer?: string;
      explanation: string;
      tags?: string[];
      estimatedTime?: number;
    },
    userId: string,
  ): Promise<IQuestion> {
    try {
      const question = new Question({
        ...data,
        createdBy: userId,
        status: "draft",
        version: 1,
        revisions: [
          {
            version: 1,
            content: data.text,
            createdAt: new Date(),
            createdBy: userId,
          },
        ],
      });

      await question.save();
      console.log(`[QuestionManager] Question created: ${question._id}`);
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error creating question:", error);
      throw error;
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(
    questionId: string,
    updates: Partial<IQuestion>,
    userId: string,
  ): Promise<IQuestion> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      // Only allow draft or review status questions to be edited
      if (
        question.status === "approved" &&
        question.createdBy.toString() !== userId
      ) {
        throw new Error(
          "Approved questions can only be edited by their creator",
        );
      }

      // Track revision history
      if (updates.text && updates.text !== question.text) {
        question.version++;
        question.revisions.push({
          version: question.version,
          content: updates.text,
          createdAt: new Date(),
          createdBy: userId,
        });
      }

      // Update fields
      Object.assign(question, updates);
      question.updatedAt = new Date();
      question.updatedBy = userId;

      await question.save();
      console.log(`[QuestionManager] Question updated: ${questionId}`);
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error updating question:", error);
      throw error;
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string, userId: string): Promise<void> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      // Only creator can delete
      if (question.createdBy.toString() !== userId) {
        throw new Error("Only the creator can delete this question");
      }

      // Soft delete by setting deletedAt
      question.deletedAt = new Date();
      await question.save();

      console.log(`[QuestionManager] Question soft-deleted: ${questionId}`);
    } catch (error) {
      console.error("[QuestionManager] Error deleting question:", error);
      throw error;
    }
  }

  /**
   * Get a single question
   */
  async getQuestion(questionId: string): Promise<IQuestion | null> {
    try {
      return await Question.findById(questionId)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("approvedBy", "name email");
    } catch (error) {
      console.error("[QuestionManager] Error fetching question:", error);
      return null;
    }
  }

  /**
   * List questions with filters
   */
  async listQuestions(
    filter: QuestionFilter,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ questions: IQuestion[]; total: number }> {
    try {
      const query: any = { deletedAt: null };

      if (filter.subject) query.subject = filter.subject;
      if (filter.topic) query.topic = filter.topic;
      if (filter.difficulty) query.difficulty = filter.difficulty;
      if (filter.status) query.status = filter.status;
      if (filter.tags && filter.tags.length > 0) {
        query.tags = { $in: filter.tags };
      }
      if (filter.createdBy) query.createdBy = filter.createdBy;

      // Search in text and explanation
      if (filter.search) {
        query.$or = [
          { text: { $regex: filter.search, $options: "i" } },
          { explanation: { $regex: filter.search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;
      const questions = await Question.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .lean();

      const total = await Question.countDocuments(query);

      return { questions, total };
    } catch (error) {
      console.error("[QuestionManager] Error listing questions:", error);
      throw error;
    }
  }

  /**
   * Submit question for review
   */
  async submitForReview(
    questionId: string,
    userId: string,
  ): Promise<IQuestion> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      if (question.status !== "draft") {
        throw new Error("Only draft questions can be submitted for review");
      }

      question.status = "review";
      question.submittedAt = new Date();
      question.submittedBy = userId;
      await question.save();

      console.log(
        `[QuestionManager] Question submitted for review: ${questionId}`,
      );
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error submitting question:", error);
      throw error;
    }
  }

  /**
   * Approve a question (admin only)
   */
  async approveQuestion(
    questionId: string,
    adminId: string,
    notes?: string,
  ): Promise<IQuestion> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      if (question.status !== "review") {
        throw new Error("Only questions in review can be approved");
      }

      question.status = "approved";
      question.approvedAt = new Date();
      question.approvedBy = adminId;
      if (notes) question.approvalNotes = notes;

      await question.save();
      console.log(`[QuestionManager] Question approved: ${questionId}`);
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error approving question:", error);
      throw error;
    }
  }

  /**
   * Reject a question (admin only)
   */
  async rejectQuestion(
    questionId: string,
    adminId: string,
    reason: string,
  ): Promise<IQuestion> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      if (question.status !== "review") {
        throw new Error("Only questions in review can be rejected");
      }

      question.status = "rejected";
      question.rejectedAt = new Date();
      question.rejectedBy = adminId;
      question.rejectionReason = reason;

      await question.save();
      console.log(`[QuestionManager] Question rejected: ${questionId}`);
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error rejecting question:", error);
      throw error;
    }
  }

  /**
   * Get question revision history
   */
  async getRevisionHistory(questionId: string): Promise<any[]> {
    try {
      const question = await Question.findById(questionId).populate(
        "revisions.createdBy",
        "name email",
      );

      if (!question) {
        throw new Error("Question not found");
      }

      return question.revisions;
    } catch (error) {
      console.error("[QuestionManager] Error fetching revisions:", error);
      throw error;
    }
  }

  /**
   * Restore question to a specific revision
   */
  async restoreRevision(
    questionId: string,
    revisionVersion: number,
    userId: string,
  ): Promise<IQuestion> {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error("Question not found");
      }

      const revision = question.revisions.find(
        (r) => r.version === revisionVersion,
      );
      if (!revision) {
        throw new Error("Revision not found");
      }

      // Create new revision with old content
      question.version++;
      question.text = revision.content;
      question.revisions.push({
        version: question.version,
        content: revision.content,
        createdAt: new Date(),
        createdBy: userId,
      });

      await question.save();
      console.log(
        `[QuestionManager] Question restored to revision ${revisionVersion}: ${questionId}`,
      );
      return question;
    } catch (error) {
      console.error("[QuestionManager] Error restoring revision:", error);
      throw error;
    }
  }

  /**
   * Get statistics about questions
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDifficulty: Record<string, number>;
    bySubject: Record<string, number>;
    averageReviewTime: number;
  }> {
    try {
      const total = await Question.countDocuments({ deletedAt: null });

      const byStatus = await Question.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const byDifficulty = await Question.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ]);

      const bySubject = await Question.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
      ]);

      // Calculate average review time (from submission to approval)
      const reviewedQuestions = await Question.find({
        status: "approved",
        submittedAt: { $exists: true },
        approvedAt: { $exists: true },
      }).lean();

      const averageReviewTime =
        reviewedQuestions.length > 0
          ? reviewedQuestions.reduce((sum, q) => {
              const time =
                (new Date(q.approvedAt).getTime() -
                  new Date(q.submittedAt).getTime()) /
                (1000 * 60 * 60); // hours
              return sum + time;
            }, 0) / reviewedQuestions.length
          : 0;

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byDifficulty: Object.fromEntries(
          byDifficulty.map((d) => [d._id, d.count]),
        ),
        bySubject: Object.fromEntries(bySubject.map((s) => [s._id, s.count])),
        averageReviewTime: Math.round(averageReviewTime * 10) / 10,
      };
    } catch (error) {
      console.error("[QuestionManager] Error getting statistics:", error);
      throw error;
    }
  }

  /**
   * Bulk import questions from CSV
   */
  async bulkImportQuestions(
    csvData: string,
    userId: string,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    try {
      const lines = csvData.split("\n").filter((line) => line.trim());
      result.total = lines.length - 1; // Exclude header

      for (let i = 1; i < lines.length; i++) {
        try {
          const [
            subject,
            topic,
            difficulty,
            text,
            type,
            options,
            answer,
            explanation,
          ] = lines[i].split(",").map((field) => field.trim());

          const question = new Question({
            subject,
            topic,
            difficulty,
            text,
            type,
            options: options ? JSON.parse(options) : [],
            correctAnswer: answer,
            explanation,
            createdBy: userId,
            status: "draft",
            version: 1,
            revisions: [
              {
                version: 1,
                content: text,
                createdAt: new Date(),
                createdBy: userId,
              },
            ],
          });

          await question.save();
          result.successful++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            error: error.message,
          });
        }
      }

      console.log(
        `[QuestionManager] Bulk import completed: ${result.successful}/${result.total} successful`,
      );
      return result;
    } catch (error) {
      console.error("[QuestionManager] Error in bulk import:", error);
      throw error;
    }
  }

  /**
   * Export questions to CSV
   */
  async exportQuestions(filter: QuestionFilter): Promise<string> {
    try {
      const { questions } = await this.listQuestions(filter, 1, 10000);

      const headers = [
        "Subject",
        "Topic",
        "Difficulty",
        "Text",
        "Type",
        "Options",
        "Correct Answer",
        "Explanation",
        "Status",
        "Created By",
      ];

      const rows = questions.map((q) => [
        q.subject,
        q.topic,
        q.difficulty,
        `"${q.text}"`,
        q.type,
        JSON.stringify(q.options || []),
        q.correctAnswer || "",
        `"${q.explanation}"`,
        q.status,
        q.createdBy || "",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      console.log(`[QuestionManager] Exported ${questions.length} questions`);
      return csv;
    } catch (error) {
      console.error("[QuestionManager] Error exporting questions:", error);
      throw error;
    }
  }
}

export const questionManagerService = new QuestionManagerService();
export default QuestionManagerService;
