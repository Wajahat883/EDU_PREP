/**
 * Question Manager Service Test Suite
 *
 * Tests for:
 * - Question CRUD operations
 * - Question approval workflow
 * - Revision history and restoration
 * - Bulk import/export functionality
 * - Filtering and searching
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { QuestionManagerService } from "../services/questionManagerService";
import { Question } from "../models/Question";

describe("Question Manager Service", () => {
  const questionManager = new QuestionManagerService();
  const testUserId = "user_123";
  const adminId = "admin_123";

  beforeAll(async () => {
    // Clear test data
    await Question.deleteMany({});
  });

  afterAll(async () => {
    await Question.deleteMany({});
  });

  describe("Create Question", () => {
    it("should create a new question with valid data", async () => {
      const questionData = {
        subject: "Mathematics",
        topic: "Algebra",
        difficulty: "medium" as const,
        text: "What is 2 + 2?",
        type: "multiple-choice" as const,
        options: [
          { text: "4", isCorrect: true },
          { text: "5", isCorrect: false },
          { text: "3", isCorrect: false },
        ],
        explanation: "Basic addition: 2 + 2 = 4",
        tags: ["arithmetic", "basics"],
      };

      const question = await questionManager.createQuestion(
        questionData,
        testUserId,
      );

      expect(question).toBeDefined();
      expect(question._id).toBeDefined();
      expect(question.subject).toBe("Mathematics");
      expect(question.status).toBe("draft");
      expect(question.version).toBe(1);
      expect(question.createdBy).toBe(testUserId);
    });

    it("should initialize revision history", async () => {
      const questionData = {
        subject: "Science",
        topic: "Physics",
        difficulty: "hard" as const,
        text: "What is Newton's first law?",
        type: "short-answer" as const,
        explanation: "An object in motion stays in motion...",
      };

      const question = await questionManager.createQuestion(
        questionData,
        testUserId,
      );

      expect(question.revisions).toBeDefined();
      expect(question.revisions.length).toBe(1);
      expect(question.revisions[0].version).toBe(1);
      expect(question.revisions[0].content).toBe(questionData.text);
    });
  });

  describe("Update Question", () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await questionManager.createQuestion(
        {
          subject: "History",
          topic: "Ancient Rome",
          difficulty: "medium" as const,
          text: "When did Rome fall?",
          type: "short-answer" as const,
          explanation: "476 AD",
        },
        testUserId,
      );
      questionId = question._id.toString();
    });

    it("should update question text and track revision", async () => {
      const updatedQuestion = await questionManager.updateQuestion(
        questionId,
        { text: "When did the Western Roman Empire fall?" },
        testUserId,
      );

      expect(updatedQuestion.text).toBe(
        "When did the Western Roman Empire fall?",
      );
      expect(updatedQuestion.version).toBe(2);
      expect(updatedQuestion.revisions.length).toBe(2);
    });

    it("should prevent unauthorized edits to approved questions", async () => {
      // First approve the question
      await questionManager.approveQuestion(questionId, adminId);

      // Try to edit as different user
      expect(async () => {
        await questionManager.updateQuestion(
          questionId,
          { text: "Updated text" },
          "different_user",
        );
      }).rejects.toThrow();
    });

    it("should allow creator to edit approved question", async () => {
      const updated = await questionManager.updateQuestion(
        questionId,
        { explanation: "Updated explanation" },
        testUserId,
      );

      expect(updated.explanation).toBe("Updated explanation");
    });
  });

  describe("Question Approval Workflow", () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await questionManager.createQuestion(
        {
          subject: "English",
          topic: "Grammar",
          difficulty: "easy" as const,
          text: "What is a noun?",
          type: "short-answer" as const,
          explanation: "A noun is a person, place, or thing",
        },
        testUserId,
      );
      questionId = question._id.toString();
    });

    it("should submit question for review", async () => {
      const submitted = await questionManager.submitForReview(
        questionId,
        testUserId,
      );

      expect(submitted.status).toBe("review");
      expect(submitted.submittedAt).toBeDefined();
      expect(submitted.submittedBy).toBe(testUserId);
    });

    it("should approve question as admin", async () => {
      const approved = await questionManager.approveQuestion(
        questionId,
        adminId,
        "Good quality",
      );

      expect(approved.status).toBe("approved");
      expect(approved.approvedAt).toBeDefined();
      expect(approved.approvedBy).toBe(adminId);
      expect(approved.approvalNotes).toBe("Good quality");
    });

    it("should reject question with reason", async () => {
      const newQuestion = await questionManager.createQuestion(
        {
          subject: "Science",
          topic: "Chemistry",
          difficulty: "medium" as const,
          text: "Incomplete question...",
          type: "true-false" as const,
          explanation: "Not explained",
        },
        testUserId,
      );

      await questionManager.submitForReview(
        newQuestion._id.toString(),
        testUserId,
      );

      const rejected = await questionManager.rejectQuestion(
        newQuestion._id.toString(),
        adminId,
        "Lacks sufficient explanation",
      );

      expect(rejected.status).toBe("rejected");
      expect(rejected.rejectionReason).toBe("Lacks sufficient explanation");
      expect(rejected.rejectedAt).toBeDefined();
    });
  });

  describe("Revision History", () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await questionManager.createQuestion(
        {
          subject: "Math",
          topic: "Calculus",
          difficulty: "hard" as const,
          text: "What is a derivative?",
          type: "essay" as const,
          explanation: "A derivative measures rate of change",
        },
        testUserId,
      );
      questionId = question._id.toString();
    });

    it("should track all revisions", async () => {
      // Make several updates
      await questionManager.updateQuestion(
        questionId,
        { text: "What is a derivative in calculus?" },
        testUserId,
      );
      await questionManager.updateQuestion(
        questionId,
        { text: "What is a derivative? Explain thoroughly." },
        testUserId,
      );

      const history = await questionManager.getRevisionHistory(questionId);

      expect(history.length).toBe(3);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
      expect(history[2].version).toBe(3);
    });

    it("should restore to previous revision", async () => {
      const restored = await questionManager.restoreRevision(
        questionId,
        1,
        testUserId,
      );

      expect(restored.text).toBe("What is a derivative?");
      expect(restored.version).toBe(4);
    });
  });

  describe("Filtering and Searching", () => {
    beforeAll(async () => {
      // Create diverse questions
      await questionManager.createQuestion(
        {
          subject: "Math",
          topic: "Algebra",
          difficulty: "easy" as const,
          text: "Easy algebra problem",
          type: "multiple-choice" as const,
          explanation: "Simple explanation",
          tags: ["algebra", "easy"],
        },
        testUserId,
      );

      await questionManager.createQuestion(
        {
          subject: "Math",
          topic: "Geometry",
          difficulty: "hard" as const,
          text: "Hard geometry problem",
          type: "short-answer" as const,
          explanation: "Complex explanation",
          tags: ["geometry", "hard"],
        },
        testUserId,
      );

      await questionManager.createQuestion(
        {
          subject: "Science",
          topic: "Physics",
          difficulty: "medium" as const,
          text: "Medium physics problem",
          type: "true-false" as const,
          explanation: "Average explanation",
          tags: ["physics", "medium"],
        },
        testUserId,
      );
    });

    it("should filter by subject", async () => {
      const { questions } = await questionManager.listQuestions({
        subject: "Math",
      });

      expect(questions.length).toBeGreaterThanOrEqual(2);
      questions.forEach((q) => {
        expect(q.subject).toBe("Math");
      });
    });

    it("should filter by difficulty", async () => {
      const { questions } = await questionManager.listQuestions({
        difficulty: "easy",
      });

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q.difficulty).toBe("easy");
      });
    });

    it("should filter by tags", async () => {
      const { questions } = await questionManager.listQuestions({
        tags: ["geometry"],
      });

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q.tags).toContain("geometry");
      });
    });

    it("should search by text", async () => {
      const { questions } = await questionManager.listQuestions({
        search: "algebra",
      });

      expect(questions.length).toBeGreaterThan(0);
    });

    it("should paginate results", async () => {
      const { questions: page1, total } = await questionManager.listQuestions(
        {},
        1,
        2,
      );

      expect(page1.length).toBeLessThanOrEqual(2);

      if (total > 2) {
        const { questions: page2 } = await questionManager.listQuestions(
          {},
          2,
          2,
        );
        expect(page2.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Bulk Import/Export", () => {
    it("should import questions from CSV", async () => {
      const csvData = `Subject,Topic,Difficulty,Text,Type,Explanation
Math,Arithmetic,easy,1+1=?,multiple-choice,Two
Science,Biology,medium,What is photosynthesis?,short-answer,Process of plants making food`;

      const result = await questionManager.bulkImportQuestions(
        csvData,
        testUserId,
      );

      expect(result.total).toBe(2);
      expect(result.successful).toBeGreaterThan(0);
    });

    it("should export questions to CSV", async () => {
      const csv = await questionManager.exportQuestions({
        subject: "Math",
      });

      expect(csv).toBeDefined();
      expect(csv.includes("Subject")).toBe(true);
      expect(csv.includes("Math")).toBe(true);
    });

    it("should handle import errors gracefully", async () => {
      const csvData = `Subject,Topic,Difficulty,Text,Type,Explanation
InvalidData`;

      const result = await questionManager.bulkImportQuestions(
        csvData,
        testUserId,
      );

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Statistics", () => {
    it("should calculate question statistics", async () => {
      const stats = await questionManager.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byDifficulty).toBeDefined();
      expect(stats.bySubject).toBeDefined();
    });
  });

  describe("Delete Question", () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await questionManager.createQuestion(
        {
          subject: "Test",
          topic: "Delete",
          difficulty: "easy" as const,
          text: "Will be deleted",
          type: "short-answer" as const,
          explanation: "To be deleted",
        },
        testUserId,
      );
      questionId = question._id.toString();
    });

    it("should soft delete question", async () => {
      await questionManager.deleteQuestion(questionId, testUserId);

      const question = await questionManager.getQuestion(questionId);
      expect(question).toBeNull(); // Soft-deleted questions are filtered out

      // But still in database with deletedAt
      const raw = await Question.findById(questionId);
      expect(raw?.deletedAt).toBeDefined();
    });
  });
});
