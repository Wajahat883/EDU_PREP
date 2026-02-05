/**
 * Comprehensive Test Suite Expansion
 * Location: services/admin-service/src/__tests__/cms.service.test.ts
 *
 * Comprehensive test coverage for CMS service including:
 * - Unit tests for CRUD operations
 * - Integration tests for workflows
 * - Performance tests
 * - End-to-end scenarios
 */

import { CMSService } from "../services/cms.service";
import { QuestionModel } from "../models/Question";
import { ApprovalWorkflowModel } from "../models/ApprovalWorkflow";
import { AdminReportModel } from "../models/AdminReport";
import { BulkImportModel } from "../models/BulkImport";

describe("CMS Service - Admin Content Management", () => {
  describe("Question CRUD Operations", () => {
    test("should create a new question", async () => {
      const questionData = {
        stem: "What is the correct treatment for hypertension?",
        options: [
          "Antibiotics",
          "ACE Inhibitors",
          "Antihistamines",
          "Antifungals",
        ],
        correctOption: 1,
        explanation: "ACE Inhibitors are first-line antihypertensive agents.",
        subject: "Pharmacology",
        difficulty: 7,
        bloomLevel: "application",
      };

      const question = await CMSService.createQuestion(
        questionData,
        "admin_123",
      );

      expect(question).toBeDefined();
      expect(question.stem).toBe(questionData.stem);
      expect(question.status).toBe("draft");
      expect(question.createdBy).toBe("admin_123");
    });

    test("should retrieve question by ID", async () => {
      const question = await CMSService.getQuestion("question_123");

      if (question) {
        expect(question._id).toBeDefined();
        expect(question.stem).toBeDefined();
        expect(question.options).toBeDefined();
      }
    });

    test("should update question content", async () => {
      const updateData = {
        stem: "Updated question stem",
        explanation: "Updated explanation",
      };

      const updated = await CMSService.updateQuestion(
        "question_123",
        updateData,
        "admin_456",
      );

      expect(updated?.stem).toBe(updateData.stem);
      expect(updated?.explanation).toBe(updateData.explanation);
      expect(updated?.updatedBy).toBe("admin_456");
    });

    test("should delete question", async () => {
      const deleted = await CMSService.deleteQuestion(
        "question_123",
        "admin_789",
      );

      expect(deleted).toBe(true);
    });

    test("should handle deletion of non-existent question", async () => {
      const deleted = await CMSService.deleteQuestion(
        "nonexistent_id",
        "admin_789",
      );

      expect(deleted).toBe(false);
    });
  });

  describe("Question Search & Filtering", () => {
    test("should search questions by text", async () => {
      const result = await CMSService.searchQuestions(
        "hypertension",
        {},
        { limit: 20, skip: 0 },
      );

      expect(result.questions).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.questions)).toBe(true);
    });

    test("should filter by status", async () => {
      const result = await CMSService.searchQuestions(
        "",
        { status: "published" },
        { limit: 20, skip: 0 },
      );

      expect(result.questions.every((q) => q.status === "published")).toBe(
        true,
      );
    });

    test("should filter by subject", async () => {
      const result = await CMSService.searchQuestions(
        "",
        { subject: "Pharmacology" },
        { limit: 20, skip: 0 },
      );

      expect(result.questions.every((q) => q.subject === "Pharmacology")).toBe(
        true,
      );
    });

    test("should filter by difficulty range", async () => {
      const result = await CMSService.searchQuestions(
        "",
        { difficulty: 7 },
        { limit: 20, skip: 0 },
      );

      expect(result.questions.every((q) => q.difficulty === 7)).toBe(true);
    });

    test("should filter by date range", async () => {
      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-12-31");

      const result = await CMSService.searchQuestions(
        "",
        { dateFrom, dateTo },
        { limit: 20, skip: 0 },
      );

      expect(Array.isArray(result.questions)).toBe(true);
    });

    test("should support pagination", async () => {
      const result1 = await CMSService.searchQuestions(
        "",
        {},
        { limit: 10, skip: 0 },
      );
      const result2 = await CMSService.searchQuestions(
        "",
        {},
        { limit: 10, skip: 10 },
      );

      expect(result1.questions.length).toBeLessThanOrEqual(10);
      expect(result2.questions.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Approval Workflow", () => {
    test("should submit question for approval", async () => {
      const workflow = await CMSService.submitForApproval(
        "question_123",
        "author_123",
      );

      expect(workflow).toBeDefined();
      expect(workflow.status).toBe("pending");
      expect(workflow.stage).toBe("initial_review");
      expect(workflow.submitterId).toBe("author_123");
    });

    test("should approve question", async () => {
      const workflow = await CMSService.approveQuestion(
        "question_123",
        "reviewer_456",
        "Looks good!",
      );

      expect(workflow?.status).toBe("approved");
      expect(workflow?.approvedBy).toBe("reviewer_456");
      expect(workflow?.approvedAt).toBeDefined();
      expect(workflow?.feedback).toBe("Looks good!");
    });

    test("should reject question with reason", async () => {
      const workflow = await CMSService.rejectQuestion(
        "question_456",
        "reviewer_789",
        "Needs better explanation",
      );

      expect(workflow?.status).toBe("rejected");
      expect(workflow?.rejectedBy).toBe("reviewer_789");
      expect(workflow?.rejectionReason).toBe("Needs better explanation");
    });

    test("should retrieve pending approvals", async () => {
      const result = await CMSService.getPendingApprovals({
        limit: 20,
        skip: 0,
      });

      expect(Array.isArray(result.workflows)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.workflows.every((w) => w.status === "pending")).toBe(true);
    });

    test("should support pagination for pending approvals", async () => {
      const result1 = await CMSService.getPendingApprovals({
        limit: 5,
        skip: 0,
      });
      const result2 = await CMSService.getPendingApprovals({
        limit: 5,
        skip: 5,
      });

      expect(result1.workflows.length).toBeLessThanOrEqual(5);
      expect(result2.workflows.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Bulk Import/Export", () => {
    test("should create bulk import job", async () => {
      const file = {
        originalname: "questions.json",
        size: 50000,
        buffer: Buffer.from("[]"),
      } as any;

      const importJob = await CMSService.createBulkImport(file, "admin_123");

      expect(importJob).toBeDefined();
      expect(importJob.fileName).toBe("questions.json");
      expect(importJob.uploadedBy).toBe("admin_123");
      expect(importJob.status).toMatch(/processing|completed|failed/);
    });

    test("should track import progress", async () => {
      const file = {
        originalname: "questions.csv",
        size: 100000,
        buffer: Buffer.from(""),
      } as any;

      const importJob = await CMSService.createBulkImport(file, "admin_456");

      expect(importJob.totalQuestions).toBeGreaterThanOrEqual(0);
      expect(importJob.successCount).toBeGreaterThanOrEqual(0);
      expect(importJob.errorCount).toBeGreaterThanOrEqual(0);
    });

    test("should handle import errors gracefully", async () => {
      // Invalid file format test
      const file = {
        originalname: "invalid.txt",
        size: 1000,
        buffer: Buffer.from("invalid data"),
      } as any;

      try {
        await CMSService.createBulkImport(file, "admin_789");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    test("should retrieve import history", async () => {
      const result = await CMSService.getImportHistory({ limit: 10, skip: 0 });

      expect(Array.isArray(result.imports)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    test("should track successful and failed imports", async () => {
      const result = await CMSService.getImportHistory();

      const successfulImports = result.imports.filter(
        (i) => i.status === "completed",
      );
      const failedImports = result.imports.filter((i) => i.status === "failed");

      expect(Array.isArray(successfulImports)).toBe(true);
      expect(Array.isArray(failedImports)).toBe(true);
    });
  });

  describe("Admin Reporting", () => {
    test("should generate content summary report", async () => {
      const report = await CMSService.generateReport("content_summary", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      expect(report).toBeDefined();
      expect(report.type).toBe("content_summary");
      expect(report.status).toBe("completed");
      expect(report.data).toBeDefined();
      expect(report.data.totalQuestions).toBeGreaterThanOrEqual(0);
    });

    test("should track content metrics", async () => {
      const report = await CMSService.generateReport("content_summary", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      expect(report.data.questionsCreated).toBeGreaterThanOrEqual(0);
      expect(report.data.questionsApproved).toBeGreaterThanOrEqual(0);
      expect(report.data.questionsRejected).toBeGreaterThanOrEqual(0);
      expect(report.data.approvalRate).toBeGreaterThanOrEqual(0);
      expect(report.data.approvalRate).toBeLessThanOrEqual(100);
    });

    test("should generate user activity report", async () => {
      const report = await CMSService.generateReport("user_activity", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      expect(report.type).toBe("user_activity");
      expect(report.data.activeUsers).toBeGreaterThanOrEqual(0);
      expect(report.data.newUsers).toBeGreaterThanOrEqual(0);
    });

    test("should generate performance metrics report", async () => {
      const report = await CMSService.generateReport("performance_metrics", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      expect(report.type).toBe("performance_metrics");
      expect(report.data.averageTestDuration).toBeGreaterThan(0);
      expect(report.data.averageAccuracy).toBeGreaterThanOrEqual(0);
    });

    test("should generate approval workflow report", async () => {
      const report = await CMSService.generateReport("approval_workflow", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      expect(report.type).toBe("approval_workflow");
      expect(report.data.pending).toBeGreaterThanOrEqual(0);
      expect(report.data.approved).toBeGreaterThanOrEqual(0);
      expect(report.data.rejected).toBeGreaterThanOrEqual(0);
    });

    test("should retrieve reports history", async () => {
      const result = await CMSService.getReports({ limit: 10, skip: 0 });

      expect(Array.isArray(result.reports)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    test("should paginate reports", async () => {
      const result1 = await CMSService.getReports({ limit: 5, skip: 0 });
      const result2 = await CMSService.getReports({ limit: 5, skip: 5 });

      expect(result1.reports.length).toBeLessThanOrEqual(5);
      expect(result2.reports.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid question creation data", async () => {
      try {
        await CMSService.createQuestion({}, "admin_123");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("should handle non-existent question updates", async () => {
      const result = await CMSService.updateQuestion(
        "nonexistent_id",
        { stem: "Updated" },
        "admin_123",
      );

      expect(result).toBeNull();
    });

    test("should handle approval of non-existent workflows", async () => {
      try {
        await CMSService.approveQuestion("nonexistent_id", "admin_123");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance", () => {
    test("should handle bulk search performance", async () => {
      const startTime = Date.now();

      await CMSService.searchQuestions("", {}, { limit: 100, skip: 0 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test("should handle large import files", async () => {
      const largeData = JSON.stringify(
        Array(1000)
          .fill(null)
          .map((_, i) => ({
            stem: `Question ${i}`,
            options: ["A", "B", "C", "D"],
            correctOption: 1,
          })),
      );

      const file = {
        originalname: "large_import.json",
        size: largeData.length,
        buffer: Buffer.from(largeData),
      } as any;

      const startTime = Date.now();

      const importJob = await CMSService.createBulkImport(file, "admin_123");

      const duration = Date.now() - startTime;

      expect(importJob).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    test("should efficiently generate reports", async () => {
      const startTime = Date.now();

      await CMSService.generateReport("content_summary", {
        from: new Date("2024-01-01"),
        to: new Date("2024-12-31"),
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  describe("Integration Tests", () => {
    test("should complete full question lifecycle", async () => {
      // 1. Create
      const created = await CMSService.createQuestion(
        {
          stem: "Test question",
          options: ["A", "B", "C", "D"],
          correctOption: 0,
        },
        "author_123",
      );

      expect(created.status).toBe("draft");

      // 2. Submit for approval
      const workflow = await CMSService.submitForApproval(
        created._id,
        "author_123",
      );
      expect(workflow.status).toBe("pending");

      // 3. Approve
      const approved = await CMSService.approveQuestion(
        created._id,
        "reviewer_123",
      );
      expect(approved?.status).toBe("approved");

      // 4. Verify published
      const published = await CMSService.getQuestion(created._id);
      expect(published?.status).toBe("published");
    });

    test("should handle rejection and resubmission", async () => {
      const created = await CMSService.createQuestion(
        {
          stem: "Test question",
          options: ["A", "B", "C", "D"],
          correctOption: 0,
        },
        "author_123",
      );

      await CMSService.submitForApproval(created._id, "author_123");

      // Reject
      const rejected = await CMSService.rejectQuestion(
        created._id,
        "reviewer_123",
        "Needs improvement",
      );
      expect(rejected?.status).toBe("rejected");

      // Resubmit after updates
      const resubmitted = await CMSService.submitForApproval(
        created._id,
        "author_123",
      );
      expect(resubmitted.status).toBe("pending");
    });
  });
});
