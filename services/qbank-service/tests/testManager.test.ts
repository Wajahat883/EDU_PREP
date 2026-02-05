/**
 * Test Manager Service Test Suite
 *
 * Tests for:
 * - Test creation and configuration
 * - Section management
 * - Question assignment to tests
 * - Test publishing workflow
 * - Test templating and duplication
 * - Test analytics
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { TestManagerService } from "../services/testManagerService";
import { Test } from "../models/Test";

describe("Test Manager Service", () => {
  const testManager = new TestManagerService();
  const creatorId = "creator_123";
  const adminId = "admin_123";

  beforeAll(async () => {
    // Clear test data
    await Test.deleteMany({});
  });

  afterAll(async () => {
    await Test.deleteMany({});
  });

  describe("Create Test", () => {
    it("should create a test with sections", async () => {
      const testData = {
        name: "Math Final Exam",
        description: "Comprehensive math assessment",
        subject: "Mathematics",
        totalPoints: 100,
        passingScore: 60,
        timeLimit: 120,
        sections: [
          {
            name: "Algebra",
            description: "Algebra questions",
            questions: [],
            timeLimit: 40,
            pointsPerQuestion: 5,
          },
          {
            name: "Geometry",
            description: "Geometry questions",
            questions: [],
            timeLimit: 40,
            pointsPerQuestion: 5,
          },
        ],
      };

      const test = await testManager.createTest(testData, creatorId);

      expect(test).toBeDefined();
      expect(test._id).toBeDefined();
      expect(test.name).toBe("Math Final Exam");
      expect(test.status).toBe("draft");
      expect(test.sections.length).toBe(2);
      expect(test.createdBy).toBe(creatorId);
    });

    it("should calculate total points from sections", async () => {
      const testData = {
        name: "Science Quiz",
        subject: "Science",
        totalPoints: 50,
        passingScore: 30,
        sections: [
          {
            name: "Biology",
            questions: [],
            pointsPerQuestion: 5,
          },
        ],
      };

      const test = await testManager.createTest(testData, creatorId);

      expect(test.totalPoints).toBe(50);
    });

    it("should validate passing score", async () => {
      const testData = {
        name: "Invalid Test",
        subject: "Test",
        totalPoints: 100,
        passingScore: 150, // Invalid - higher than total
        sections: [],
      };

      expect(async () => {
        await testManager.createTest(testData, creatorId);
      }).rejects.toThrow();
    });
  });

  describe("Add Questions to Section", () => {
    let testId: string;
    const questionIds = ["question_1", "question_2", "question_3"];

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Question Assignment Test",
          subject: "Test",
          totalPoints: 30,
          passingScore: 20,
          sections: [
            {
              name: "Section 1",
              questions: [],
              pointsPerQuestion: 10,
            },
          ],
        },
        creatorId,
      );
      testId = test._id.toString();
    });

    it("should add questions to section", async () => {
      const updated = await testManager.addQuestionsToSection(
        testId,
        0,
        questionIds,
        { checkAvailability: false },
      );

      expect(updated.sections[0].questions).toEqual(questionIds);
    });

    it("should prevent duplicate questions", async () => {
      expect(async () => {
        await testManager.addQuestionsToSection(testId, 0, ["question_1"], {
          checkAvailability: false,
        });
      }).rejects.toThrow();
    });

    it("should reorder questions", async () => {
      const updated = await testManager.reorderQuestions(testId, 0, [
        "question_2",
        "question_1",
        "question_3",
      ]);

      expect(updated.sections[0].questions).toEqual([
        "question_2",
        "question_1",
        "question_3",
      ]);
    });

    it("should remove questions from section", async () => {
      const updated = await testManager.removeQuestionsFromSection(testId, 0, [
        "question_3",
      ]);

      expect(updated.sections[0].questions).not.toContain("question_3");
      expect(updated.sections[0].questions.length).toBe(2);
    });
  });

  describe("Test Publishing Workflow", () => {
    let testId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Publishable Test",
          subject: "Test",
          totalPoints: 50,
          passingScore: 30,
          sections: [
            {
              name: "Section 1",
              questions: ["q1", "q2", "q3"],
              pointsPerQuestion: 10,
            },
          ],
        },
        creatorId,
      );
      testId = test._id.toString();
    });

    it("should publish test when ready", async () => {
      const published = await testManager.publishTest(testId, creatorId);

      expect(published.status).toBe("published");
      expect(published.publishedAt).toBeDefined();
      expect(published.publishedBy).toBe(creatorId);
    });

    it("should prevent publishing empty test", async () => {
      const emptyTest = await testManager.createTest(
        {
          name: "Empty Test",
          subject: "Test",
          totalPoints: 50,
          passingScore: 30,
          sections: [
            {
              name: "Empty Section",
              questions: [],
              pointsPerQuestion: 10,
            },
          ],
        },
        creatorId,
      );

      expect(async () => {
        await testManager.publishTest(emptyTest._id.toString(), creatorId);
      }).rejects.toThrow();
    });

    it("should archive published test", async () => {
      const archived = await testManager.archiveTest(testId, creatorId);

      expect(archived.status).toBe("archived");
      expect(archived.archivedAt).toBeDefined();
    });
  });

  describe("Test Duplication", () => {
    let templateId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Template Test",
          description: "Test to be duplicated",
          subject: "Math",
          totalPoints: 100,
          passingScore: 60,
          sections: [
            {
              name: "Basic Math",
              description: "Basic problems",
              questions: ["q1", "q2", "q3"],
              pointsPerQuestion: 10,
            },
            {
              name: "Advanced Math",
              description: "Advanced problems",
              questions: ["q4", "q5"],
              pointsPerQuestion: 20,
            },
          ],
          settings: {
            allowReview: true,
            allowCalculator: true,
            randomizeQuestions: true,
          },
        },
        creatorId,
      );
      templateId = test._id.toString();
    });

    it("should duplicate test with all settings", async () => {
      const duplicate = await testManager.duplicateTest(
        templateId,
        "Duplicate Test",
        creatorId,
      );

      expect(duplicate._id).not.toEqual(templateId);
      expect(duplicate.name).toBe("Duplicate Test");
      expect(duplicate.subject).toBe("Math");
      expect(duplicate.totalPoints).toBe(100);
      expect(duplicate.sections.length).toBe(2);
      expect(duplicate.status).toBe("draft");
    });

    it("should preserve section structure in duplicate", async () => {
      const duplicate = await testManager.duplicateTest(
        templateId,
        "Copy Test",
        creatorId,
      );

      expect(duplicate.sections[0].name).toBe("Basic Math");
      expect(duplicate.sections[0].questions).toEqual(["q1", "q2", "q3"]);
      expect(duplicate.sections[1].name).toBe("Advanced Math");
      expect(duplicate.sections[1].questions).toEqual(["q4", "q5"]);
    });

    it("should preserve test settings in duplicate", async () => {
      const duplicate = await testManager.duplicateTest(
        templateId,
        "Settings Copy",
        creatorId,
      );

      expect(duplicate.settings?.allowReview).toBe(true);
      expect(duplicate.settings?.allowCalculator).toBe(true);
      expect(duplicate.settings?.randomizeQuestions).toBe(true);
    });
  });

  describe("Update Test", () => {
    let testId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Updatable Test",
          subject: "English",
          totalPoints: 50,
          passingScore: 30,
          sections: [],
        },
        creatorId,
      );
      testId = test._id.toString();
    });

    it("should update test configuration", async () => {
      const updated = await testManager.updateTest(
        testId,
        {
          name: "Updated Test Name",
          timeLimit: 90,
        },
        creatorId,
      );

      expect(updated.name).toBe("Updated Test Name");
      expect(updated.timeLimit).toBe(90);
    });

    it("should prevent updating published test", async () => {
      const publishableTest = await testManager.createTest(
        {
          name: "Locked Test",
          subject: "Test",
          totalPoints: 50,
          passingScore: 30,
          sections: [
            {
              name: "S1",
              questions: ["q1"],
              pointsPerQuestion: 50,
            },
          ],
        },
        creatorId,
      );

      await testManager.publishTest(publishableTest._id.toString(), creatorId);

      expect(async () => {
        await testManager.updateTest(
          publishableTest._id.toString(),
          { name: "Modified" },
          creatorId,
        );
      }).rejects.toThrow();
    });
  });

  describe("Filtering and Listing", () => {
    beforeAll(async () => {
      await testManager.createTest(
        {
          name: "Math Test 1",
          subject: "Mathematics",
          totalPoints: 100,
          passingScore: 60,
          sections: [],
        },
        creatorId,
      );

      await testManager.createTest(
        {
          name: "Science Test",
          subject: "Science",
          totalPoints: 80,
          passingScore: 50,
          sections: [],
        },
        creatorId,
      );
    });

    it("should list tests with pagination", async () => {
      const { tests, total, page, limit } = await testManager.listTests(
        {},
        1,
        10,
      );

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
      expect(page).toBe(1);
      expect(limit).toBe(10);
      expect(total).toBeGreaterThan(0);
    });

    it("should filter by subject", async () => {
      const { tests } = await testManager.listTests({ subject: "Mathematics" });

      tests.forEach((t) => {
        expect(t.subject).toBe("Mathematics");
      });
    });

    it("should filter by status", async () => {
      const { tests } = await testManager.listTests({ status: "draft" });

      tests.forEach((t) => {
        expect(t.status).toBe("draft");
      });
    });

    it("should filter by creator", async () => {
      const { tests } = await testManager.listTests({ createdBy: creatorId });

      tests.forEach((t) => {
        expect(t.createdBy).toBe(creatorId);
      });
    });
  });

  describe("Test Statistics", () => {
    let publishedTestId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Analytics Test",
          subject: "Test",
          totalPoints: 100,
          passingScore: 60,
          sections: [
            {
              name: "Section 1",
              questions: ["q1", "q2"],
              pointsPerQuestion: 50,
            },
          ],
        },
        creatorId,
      );
      publishedTestId = test._id.toString();
      await testManager.publishTest(publishedTestId, creatorId);
    });

    it("should retrieve test statistics", async () => {
      const stats = await testManager.getTestStatistics(publishedTestId);

      expect(stats).toBeDefined();
      expect(stats.attempts).toBeDefined();
      expect(stats.averageScore).toBeDefined();
      expect(stats.completionRate).toBeDefined();
      expect(stats.averageTime).toBeDefined();
    });

    it("should calculate statistics by subject", async () => {
      const stats = await testManager.getStatisticsBySubject("Mathematics");

      expect(stats).toBeDefined();
      expect(stats.totalTests).toBeGreaterThanOrEqual(0);
    });

    it("should get test overview for students", async () => {
      const overview = await testManager.getTestOverview(publishedTestId);

      expect(overview).toBeDefined();
      expect(overview.name).toBeDefined();
      expect(overview.totalPoints).toBeDefined();
      expect(overview.timeLimit).toBeDefined();
      expect(overview.sections).toBeDefined();
    });
  });

  describe("Retrieve Tests", () => {
    let testId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Retrievable Test",
          subject: "History",
          totalPoints: 50,
          passingScore: 30,
          sections: [
            {
              name: "Ancient History",
              questions: ["q1", "q2"],
              pointsPerQuestion: 25,
            },
          ],
        },
        creatorId,
      );
      testId = test._id.toString();
    });

    it("should retrieve full test with questions", async () => {
      const test = await testManager.getTest(testId);

      expect(test).toBeDefined();
      expect(test._id.toString()).toBe(testId);
      expect(test.name).toBe("Retrievable Test");
      expect(test.sections).toBeDefined();
      expect(test.sections[0].questions).toEqual(["q1", "q2"]);
    });

    it("should get tests by subject", async () => {
      const tests = await testManager.getTestsBySubject("History");

      expect(Array.isArray(tests)).toBe(true);
      tests.forEach((t) => {
        expect(t.subject).toBe("History");
      });
    });
  });

  describe("Delete Test", () => {
    let testId: string;

    beforeAll(async () => {
      const test = await testManager.createTest(
        {
          name: "Deletable Test",
          subject: "Test",
          totalPoints: 50,
          passingScore: 30,
          sections: [],
        },
        creatorId,
      );
      testId = test._id.toString();
    });

    it("should soft delete test", async () => {
      await testManager.deleteTest(testId, creatorId);

      const test = await testManager.getTest(testId);
      expect(test).toBeNull();
    });

    it("should still exist in database as soft-deleted", async () => {
      const test = await Test.findById(testId);
      expect(test?.deletedAt).toBeDefined();
    });
  });
});
