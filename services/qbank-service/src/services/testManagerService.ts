/**
 * Test Manager Service
 *
 * Manages test creation and configuration:
 * - Create and edit test templates
 * - Question selection and ordering
 * - Test settings (time limits, passing score, etc.)
 * - Test deployment to users/courses
 * - Performance analytics per test
 * - Test versioning and archival
 */

import { Test, ITest } from "../models/Test";
import { Question } from "../models/Question";

interface TestConfig {
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
}

interface TestSection {
  name: string;
  description?: string;
  questions: string[]; // Question IDs
  timeLimit?: number;
  pointsPerQuestion: number;
}

class TestManagerService {
  /**
   * Create a new test
   */
  async createTest(
    config: TestConfig,
    sections: TestSection[],
    userId: string,
  ): Promise<ITest> {
    try {
      // Validate questions exist
      for (const section of sections) {
        const questions = await Question.find({
          _id: { $in: section.questions },
        });
        if (questions.length !== section.questions.length) {
          throw new Error("One or more questions not found");
        }
      }

      // Calculate total points from sections
      const totalPoints = sections.reduce((sum, section) => {
        return sum + section.questions.length * section.pointsPerQuestion;
      }, 0);

      const test = new Test({
        ...config,
        totalPoints,
        sections,
        createdBy: userId,
        status: "draft",
        version: 1,
        questionCount: sections.reduce((sum, s) => sum + s.questions.length, 0),
        createdAt: new Date(),
      });

      await test.save();
      console.log(`[TestManager] Test created: ${test._id}`);
      return test;
    } catch (error) {
      console.error("[TestManager] Error creating test:", error);
      throw error;
    }
  }

  /**
   * Update test configuration
   */
  async updateTest(
    testId: string,
    updates: Partial<TestConfig>,
    userId: string,
  ): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      // Only allow updates to draft tests
      if (test.status === "published") {
        throw new Error("Cannot modify published tests");
      }

      Object.assign(test, updates);
      test.updatedAt = new Date();
      test.updatedBy = userId;

      await test.save();
      console.log(`[TestManager] Test updated: ${testId}`);
      return test;
    } catch (error) {
      console.error("[TestManager] Error updating test:", error);
      throw error;
    }
  }

  /**
   * Add questions to a test section
   */
  async addQuestionsToSection(
    testId: string,
    sectionIndex: number,
    questionIds: string[],
    userId: string,
  ): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      if (sectionIndex >= test.sections.length) {
        throw new Error("Section not found");
      }

      // Validate questions exist
      const questions = await Question.find({ _id: { $in: questionIds } });
      if (questions.length !== questionIds.length) {
        throw new Error("One or more questions not found");
      }

      // Add new questions
      test.sections[sectionIndex].questions.push(...questionIds);
      test.questionCount = test.sections.reduce(
        (sum, s) => sum + s.questions.length,
        0,
      );
      test.updatedAt = new Date();
      test.updatedBy = userId;

      await test.save();
      console.log(
        `[TestManager] Added ${questionIds.length} questions to section ${sectionIndex}`,
      );
      return test;
    } catch (error) {
      console.error("[TestManager] Error adding questions:", error);
      throw error;
    }
  }

  /**
   * Remove questions from a section
   */
  async removeQuestionsFromSection(
    testId: string,
    sectionIndex: number,
    questionIds: string[],
    userId: string,
  ): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      if (sectionIndex >= test.sections.length) {
        throw new Error("Section not found");
      }

      test.sections[sectionIndex].questions = test.sections[
        sectionIndex
      ].questions.filter((id) => !questionIds.includes(id.toString()));

      test.questionCount = test.sections.reduce(
        (sum, s) => sum + s.questions.length,
        0,
      );
      test.updatedAt = new Date();
      test.updatedBy = userId;

      await test.save();
      console.log(
        `[TestManager] Removed ${questionIds.length} questions from section ${sectionIndex}`,
      );
      return test;
    } catch (error) {
      console.error("[TestManager] Error removing questions:", error);
      throw error;
    }
  }

  /**
   * Reorder questions in a section
   */
  async reorderQuestions(
    testId: string,
    sectionIndex: number,
    orderedQuestionIds: string[],
    userId: string,
  ): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      if (sectionIndex >= test.sections.length) {
        throw new Error("Section not found");
      }

      // Validate all question IDs are present
      const currentIds = test.sections[sectionIndex].questions.map((id) =>
        id.toString(),
      );
      if (
        orderedQuestionIds.length !== currentIds.length ||
        !orderedQuestionIds.every((id) => currentIds.includes(id))
      ) {
        throw new Error("Invalid question ID list");
      }

      test.sections[sectionIndex].questions = orderedQuestionIds as any;
      test.updatedAt = new Date();
      test.updatedBy = userId;

      await test.save();
      console.log(
        `[TestManager] Reordered questions in section ${sectionIndex}`,
      );
      return test;
    } catch (error) {
      console.error("[TestManager] Error reordering questions:", error);
      throw error;
    }
  }

  /**
   * Publish a test (make it available to users)
   */
  async publishTest(testId: string, userId: string): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      if (test.status === "published") {
        throw new Error("Test is already published");
      }

      if (test.sections.length === 0 || test.questionCount === 0) {
        throw new Error("Test must have at least one question");
      }

      test.status = "published";
      test.publishedAt = new Date();
      test.publishedBy = userId;
      test.updatedAt = new Date();

      await test.save();
      console.log(`[TestManager] Test published: ${testId}`);
      return test;
    } catch (error) {
      console.error("[TestManager] Error publishing test:", error);
      throw error;
    }
  }

  /**
   * Archive a test
   */
  async archiveTest(testId: string, userId: string): Promise<ITest> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      test.status = "archived";
      test.archivedAt = new Date();
      test.updatedAt = new Date();
      test.updatedBy = userId;

      await test.save();
      console.log(`[TestManager] Test archived: ${testId}`);
      return test;
    } catch (error) {
      console.error("[TestManager] Error archiving test:", error);
      throw error;
    }
  }

  /**
   * Duplicate a test
   */
  async duplicateTest(testId: string, userId: string): Promise<ITest> {
    try {
      const originalTest = await Test.findById(testId);
      if (!originalTest) {
        throw new Error("Test not found");
      }

      const newTest = new Test({
        name: `${originalTest.name} (Copy)`,
        description: originalTest.description,
        subject: originalTest.subject,
        totalPoints: originalTest.totalPoints,
        passingScore: originalTest.passingScore,
        timeLimit: originalTest.timeLimit,
        allowReview: originalTest.allowReview,
        allowCalculator: originalTest.allowCalculator,
        randomizeQuestions: originalTest.randomizeQuestions,
        randomizeOptions: originalTest.randomizeOptions,
        showCorrectAnswers: originalTest.showCorrectAnswers,
        courseId: originalTest.courseId,
        sections: JSON.parse(JSON.stringify(originalTest.sections)), // Deep copy
        createdBy: userId,
        status: "draft",
        version: 1,
        questionCount: originalTest.questionCount,
      });

      await newTest.save();
      console.log(
        `[TestManager] Test duplicated: ${originalTest._id} -> ${newTest._id}`,
      );
      return newTest;
    } catch (error) {
      console.error("[TestManager] Error duplicating test:", error);
      throw error;
    }
  }

  /**
   * Get test with populated questions
   */
  async getTest(testId: string): Promise<ITest | null> {
    try {
      const test = await Test.findById(testId)
        .populate("createdBy", "name email")
        .populate("sections.questions");

      return test;
    } catch (error) {
      console.error("[TestManager] Error fetching test:", error);
      return null;
    }
  }

  /**
   * List all tests with filters
   */
  async listTests(
    filter?: {
      subject?: string;
      status?: "draft" | "published" | "archived";
      createdBy?: string;
      courseId?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ tests: ITest[]; total: number }> {
    try {
      const query: any = {};

      if (filter?.subject) query.subject = filter.subject;
      if (filter?.status) query.status = filter.status;
      if (filter?.createdBy) query.createdBy = filter.createdBy;
      if (filter?.courseId) query.courseId = filter.courseId;
      if (filter?.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: "i" } },
          { description: { $regex: filter.search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;
      const tests = await Test.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .lean();

      const total = await Test.countDocuments(query);

      return { tests, total };
    } catch (error) {
      console.error("[TestManager] Error listing tests:", error);
      throw error;
    }
  }

  /**
   * Get test statistics
   */
  async getTestStatistics(testId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    averageTime: number;
    questionAnalytics: Array<{
      questionId: string;
      correctRate: number;
      averageTime: number;
    }>;
  }> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      // These would typically come from a TestAttempt model
      // For now, returning structure
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0,
        questionAnalytics: [],
      };
    } catch (error) {
      console.error("[TestManager] Error getting statistics:", error);
      throw error;
    }
  }

  /**
   * Get all tests by subject
   */
  async getTestsBySubject(subject: string): Promise<ITest[]> {
    try {
      return await Test.find({
        subject,
        status: "published",
      })
        .select("name description totalPoints timeLimit")
        .populate("createdBy", "name")
        .lean();
    } catch (error) {
      console.error("[TestManager] Error fetching tests by subject:", error);
      throw error;
    }
  }

  /**
   * Delete a test (soft delete)
   */
  async deleteTest(testId: string, userId: string): Promise<void> {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test not found");
      }

      test.deletedAt = new Date();
      test.updatedBy = userId;
      await test.save();

      console.log(`[TestManager] Test soft-deleted: ${testId}`);
    } catch (error) {
      console.error("[TestManager] Error deleting test:", error);
      throw error;
    }
  }

  /**
   * Get test overview (for student taking test)
   */
  async getTestOverview(testId: string): Promise<{
    id: string;
    name: string;
    description: string;
    totalPoints: number;
    timeLimit?: number;
    questionCount: number;
    sections: Array<{
      name: string;
      questionCount: number;
      timeLimit?: number;
    }>;
  } | null> {
    try {
      const test = await Test.findById(testId).select(
        "name description totalPoints timeLimit questionCount sections",
      );

      if (!test) return null;

      return {
        id: test._id.toString(),
        name: test.name,
        description: test.description,
        totalPoints: test.totalPoints,
        timeLimit: test.timeLimit,
        questionCount: test.questionCount,
        sections: test.sections.map((s) => ({
          name: s.name,
          questionCount: s.questions.length,
          timeLimit: s.timeLimit,
        })),
      };
    } catch (error) {
      console.error("[TestManager] Error getting test overview:", error);
      return null;
    }
  }
}

export const testManagerService = new TestManagerService();
export default TestManagerService;
