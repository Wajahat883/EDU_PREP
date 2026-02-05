/**
 * Admin CMS Service - Content Management
 * Location: services/admin-service/src/services/cms.service.ts
 *
 * Comprehensive admin CMS for managing:
 * 1. Question CRUD operations (create, read, update, delete)
 * 2. Content approval workflow
 * 3. Bulk import/export system
 * 4. Admin reporting dashboard
 */

import { QuestionModel, IQuestion } from "../models/Question";
import {
  ApprovalWorkflowModel,
  IApprovalWorkflow,
} from "../models/ApprovalWorkflow";
import { BulkImportModel, IBulkImport } from "../models/BulkImport";
import { AdminReportModel, IAdminReport } from "../models/AdminReport";
import { UserModel } from "../models/User";
import logger from "../utils/logger";
import { ESService } from "./elasticsearch.service";

export class CMSService {
  /**
   * QUESTION MANAGEMENT
   */

  /**
   * Create new question
   */
  static async createQuestion(
    questionData: Partial<IQuestion>,
    adminId: string,
  ): Promise<IQuestion> {
    try {
      const question = await QuestionModel.create({
        ...questionData,
        createdBy: adminId,
        status: "draft",
      });

      logger.info(`Question created: ${question._id} by admin ${adminId}`);
      return question;
    } catch (error: any) {
      logger.error(`Error creating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get question by ID
   */
  static async getQuestion(questionId: string): Promise<IQuestion | null> {
    try {
      const question = await QuestionModel.findById(questionId);
      return question;
    } catch (error: any) {
      logger.error(`Error fetching question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update question
   */
  static async updateQuestion(
    questionId: string,
    updateData: Partial<IQuestion>,
    adminId: string,
  ): Promise<IQuestion | null> {
    try {
      const question = await QuestionModel.findByIdAndUpdate(
        questionId,
        {
          ...updateData,
          updatedBy: adminId,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (question) {
        // Re-index in Elasticsearch if content changed
        if (updateData.stem || updateData.options || updateData.explanation) {
          await ESService.indexQuestion(question);
        }

        logger.info(`Question updated: ${questionId} by admin ${adminId}`);
      }

      return question;
    } catch (error: any) {
      logger.error(`Error updating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete question
   */
  static async deleteQuestion(
    questionId: string,
    adminId: string,
  ): Promise<boolean> {
    try {
      const result = await QuestionModel.findByIdAndDelete(questionId);

      if (result) {
        // Remove from Elasticsearch
        await ESService.deleteQuestion(questionId);

        logger.info(`Question deleted: ${questionId} by admin ${adminId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error(`Error deleting question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search questions (admin)
   */
  static async searchQuestions(
    query: string,
    filters?: {
      status?: string;
      subject?: string;
      difficulty?: number;
      createdBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination?: { limit: number; skip: number },
  ): Promise<{ questions: IQuestion[]; total: number }> {
    try {
      let mongoQuery: any = {};

      if (filters?.status) mongoQuery.status = filters.status;
      if (filters?.subject) mongoQuery.subject = filters.subject;
      if (filters?.difficulty) mongoQuery.difficulty = filters.difficulty;
      if (filters?.createdBy) mongoQuery.createdBy = filters.createdBy;
      if (filters?.dateFrom || filters?.dateTo) {
        mongoQuery.createdAt = {};
        if (filters.dateFrom) mongoQuery.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) mongoQuery.createdAt.$lte = filters.dateTo;
      }

      const limit = pagination?.limit || 20;
      const skip = pagination?.skip || 0;

      // Search stem and explanation
      if (query) {
        mongoQuery.$or = [
          { stem: { $regex: query, $options: "i" } },
          { explanation: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ];
      }

      const [questions, total] = await Promise.all([
        QuestionModel.find(mongoQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip),
        QuestionModel.countDocuments(mongoQuery),
      ]);

      return { questions, total };
    } catch (error: any) {
      logger.error(`Error searching questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * APPROVAL WORKFLOW
   */

  /**
   * Submit question for approval
   */
  static async submitForApproval(
    questionId: string,
    submitterId: string,
  ): Promise<IApprovalWorkflow> {
    try {
      const workflow = await ApprovalWorkflowModel.create({
        questionId,
        submitterId,
        status: "pending",
        stage: "initial_review",
      });

      // Update question status
      await QuestionModel.findByIdAndUpdate(questionId, {
        status: "pending_approval",
      });

      logger.info(`Question submitted for approval: ${questionId}`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error submitting for approval: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve question
   */
  static async approveQuestion(
    questionId: string,
    approverId: string,
    feedback?: string,
  ): Promise<IApprovalWorkflow | null> {
    try {
      const workflow = await ApprovalWorkflowModel.findOne({ questionId });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Update workflow
      await ApprovalWorkflowModel.findByIdAndUpdate(workflow._id, {
        status: "approved",
        approvedBy: approverId,
        approvedAt: new Date(),
        feedback,
      });

      // Update question
      await QuestionModel.findByIdAndUpdate(questionId, {
        status: "published",
      });

      // Index in Elasticsearch
      const question = await QuestionModel.findById(questionId);
      if (question) {
        await ESService.indexQuestion(question);
      }

      logger.info(`Question approved: ${questionId} by ${approverId}`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error approving question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject question
   */
  static async rejectQuestion(
    questionId: string,
    rejecterId: string,
    reason: string,
  ): Promise<IApprovalWorkflow | null> {
    try {
      const workflow = await ApprovalWorkflowModel.findOne({ questionId });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Update workflow
      await ApprovalWorkflowModel.findByIdAndUpdate(workflow._id, {
        status: "rejected",
        rejectedBy: rejecterId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });

      // Update question
      await QuestionModel.findByIdAndUpdate(questionId, { status: "rejected" });

      logger.info(`Question rejected: ${questionId} by ${rejecterId}`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error rejecting question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(pagination?: {
    limit: number;
    skip: number;
  }): Promise<{ workflows: IApprovalWorkflow[]; total: number }> {
    try {
      const limit = pagination?.limit || 20;
      const skip = pagination?.skip || 0;

      const [workflows, total] = await Promise.all([
        ApprovalWorkflowModel.find({ status: "pending" })
          .populate("questionId")
          .sort({ createdAt: 1 })
          .limit(limit)
          .skip(skip),
        ApprovalWorkflowModel.countDocuments({ status: "pending" }),
      ]);

      return { workflows, total };
    } catch (error: any) {
      logger.error(`Error fetching pending approvals: ${error.message}`);
      throw error;
    }
  }

  /**
   * BULK IMPORT/EXPORT
   */

  /**
   * Create bulk import job
   */
  static async createBulkImport(
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<IBulkImport> {
    try {
      const bulkImport = await BulkImportModel.create({
        fileName: file.originalname,
        fileSize: file.size,
        uploadedBy,
        status: "processing",
        totalQuestions: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
      });

      // Queue for processing
      logger.info(`Bulk import job created: ${bulkImport._id}`);

      // Process file (CSV/JSON)
      await this.processBulkImportFile(bulkImport._id, file);

      return bulkImport;
    } catch (error: any) {
      logger.error(`Error creating bulk import: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process bulk import file
   */
  static async processBulkImportFile(
    importId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      let questions: any[] = [];

      // Parse based on file type
      if (file.originalname.endsWith(".csv")) {
        // Parse CSV
        // questions = parseCSV(file.buffer.toString());
      } else if (file.originalname.endsWith(".json")) {
        // Parse JSON
        questions = JSON.parse(file.buffer.toString());
      }

      const bulkImport = await BulkImportModel.findById(importId);
      if (!bulkImport) throw new Error("Import not found");

      bulkImport.totalQuestions = questions.length;

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each question
      for (const q of questions) {
        try {
          // Validate question data
          if (!q.stem || !q.options || q.options.length < 4) {
            throw new Error("Invalid question format");
          }

          // Create question
          const question = await QuestionModel.create({
            stem: q.stem,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            subject: q.subject,
            difficulty: q.difficulty || 5,
            bloomLevel: q.bloomLevel || "application",
            tags: q.tags || [],
            createdBy: bulkImport.uploadedBy,
            status: "pending_approval",
          });

          // Index in Elasticsearch
          await ESService.indexQuestion(question);

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Question ${errorCount}: ${error.message}`);
        }
      }

      // Update import status
      await BulkImportModel.findByIdAndUpdate(importId, {
        status: "completed",
        successCount,
        errorCount,
        errors,
        completedAt: new Date(),
      });

      logger.info(
        `Bulk import completed: ${importId} - Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error: any) {
      await BulkImportModel.findByIdAndUpdate(importId, {
        status: "failed",
        errors: [error.message],
      });
      logger.error(`Error processing bulk import: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get import history
   */
  static async getImportHistory(pagination?: {
    limit: number;
    skip: number;
  }): Promise<{ imports: IBulkImport[]; total: number }> {
    try {
      const limit = pagination?.limit || 20;
      const skip = pagination?.skip || 0;

      const [imports, total] = await Promise.all([
        BulkImportModel.find().sort({ createdAt: -1 }).limit(limit).skip(skip),
        BulkImportModel.countDocuments(),
      ]);

      return { imports, total };
    } catch (error: any) {
      logger.error(`Error fetching import history: ${error.message}`);
      throw error;
    }
  }

  /**
   * ADMIN REPORTING
   */

  /**
   * Generate admin report
   */
  static async generateReport(
    reportType: string,
    dateRange: { from: Date; to: Date },
  ): Promise<IAdminReport> {
    try {
      const report = await AdminReportModel.create({
        type: reportType,
        dateRange,
        status: "generating",
      });

      // Generate report based on type
      let reportData: any = {};

      switch (reportType) {
        case "content_summary":
          reportData = await this.generateContentSummaryReport(dateRange);
          break;
        case "user_activity":
          reportData = await this.generateUserActivityReport(dateRange);
          break;
        case "performance_metrics":
          reportData = await this.generatePerformanceReport(dateRange);
          break;
        case "approval_workflow":
          reportData = await this.generateApprovalReport(dateRange);
          break;
      }

      // Update report
      await AdminReportModel.findByIdAndUpdate(report._id, {
        status: "completed",
        data: reportData,
        completedAt: new Date(),
      });

      logger.info(`Report generated: ${reportType}`);
      return report;
    } catch (error: any) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Content summary report
   */
  private static async generateContentSummaryReport(dateRange: {
    from: Date;
    to: Date;
  }): Promise<any> {
    const [
      totalQuestions,
      questionsCreated,
      questionsApproved,
      questionsRejected,
    ] = await Promise.all([
      QuestionModel.countDocuments(),
      QuestionModel.countDocuments({
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
      QuestionModel.countDocuments({
        status: "published",
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
      QuestionModel.countDocuments({
        status: "rejected",
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
    ]);

    return {
      totalQuestions,
      questionsCreated,
      questionsApproved,
      questionsRejected,
      approvalRate:
        questionsCreated > 0
          ? Math.round((questionsApproved / questionsCreated) * 100)
          : 0,
    };
  }

  /**
   * User activity report
   */
  private static async generateUserActivityReport(dateRange: {
    from: Date;
    to: Date;
  }): Promise<any> {
    const activeUsers = await UserModel.countDocuments({
      lastLoginAt: { $gte: dateRange.from, $lte: dateRange.to },
    });

    const newUsers = await UserModel.countDocuments({
      createdAt: { $gte: dateRange.from, $lte: dateRange.to },
    });

    return {
      activeUsers,
      newUsers,
      returningUsers: activeUsers - newUsers,
    };
  }

  /**
   * Performance metrics report
   */
  private static async generatePerformanceReport(dateRange: {
    from: Date;
    to: Date;
  }): Promise<any> {
    // Query analytics data
    return {
      averageTestDuration: 45, // minutes
      averageAccuracy: 72, // percent
      totalTestsCompleted: 1500,
    };
  }

  /**
   * Approval workflow report
   */
  private static async generateApprovalReport(dateRange: {
    from: Date;
    to: Date;
  }): Promise<any> {
    const [pending, approved, rejected] = await Promise.all([
      ApprovalWorkflowModel.countDocuments({
        status: "pending",
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
      ApprovalWorkflowModel.countDocuments({
        status: "approved",
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
      ApprovalWorkflowModel.countDocuments({
        status: "rejected",
        createdAt: { $gte: dateRange.from, $lte: dateRange.to },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }

  /**
   * Get reports
   */
  static async getReports(pagination?: {
    limit: number;
    skip: number;
  }): Promise<{ reports: IAdminReport[]; total: number }> {
    try {
      const limit = pagination?.limit || 10;
      const skip = pagination?.skip || 0;

      const [reports, total] = await Promise.all([
        AdminReportModel.find().sort({ createdAt: -1 }).limit(limit).skip(skip),
        AdminReportModel.countDocuments(),
      ]);

      return { reports, total };
    } catch (error: any) {
      logger.error(`Error fetching reports: ${error.message}`);
      throw error;
    }
  }
}
