/**
 * Test Engine Service Test Suite
 *
 * Tests for:
 * - Test attempt creation
 * - Answer submission and validation
 * - Score calculation
 * - Test completion workflow
 * - Answer review and feedback
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { TestEngineService } from "../services/testEngineService";
import { TestAttempt } from "../models/TestAttempt";
import { Answer } from "../models/Answer";

describe("Test Engine Service", () => {
  const testEngine = new TestEngineService();
  const studentId = "student_123";
  const testId = "test_456";

  beforeAll(async () => {
    // Clear test data
    await TestAttempt.deleteMany({});
    await Answer.deleteMany({});
  });

  afterAll(async () => {
    await TestAttempt.deleteMany({});
    await Answer.deleteMany({});
  });

  describe("Start Test Attempt", () => {
    it("should create a new test attempt", async () => {
      const attempt = await testEngine.startAttempt(testId, studentId);

      expect(attempt).toBeDefined();
      expect(attempt._id).toBeDefined();
      expect(attempt.testId).toBe(testId);
      expect(attempt.studentId).toBe(studentId);
      expect(attempt.status).toBe("in_progress");
      expect(attempt.startedAt).toBeDefined();
    });

    it("should initialize attempt with empty answers", async () => {
      const attempt = await testEngine.startAttempt(testId, studentId);

      expect(attempt.answers).toBeDefined();
      expect(attempt.answers.length).toBe(0);
    });

    it("should record start time", async () => {
      const before = Date.now();
      const attempt = await testEngine.startAttempt(testId, studentId);
      const after = Date.now();

      expect(attempt.startedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(attempt.startedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("should prevent multiple simultaneous attempts", async () => {
      await testEngine.startAttempt(testId, studentId);

      expect(async () => {
        await testEngine.startAttempt(testId, studentId);
      }).rejects.toThrow();
    });
  });

  describe("Submit Answer", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(testId, studentId);
      attemptId = attempt._id.toString();
    });

    it("should submit answer to multiple choice question", async () => {
      const updated = await testEngine.submitAnswer(attemptId, "question_1", {
        type: "multiple-choice",
        selectedOption: "option_b",
      });

      expect(updated.answers.length).toBeGreaterThan(0);
      const answer = updated.answers.find((a) => a.questionId === "question_1");
      expect(answer?.text).toBe("option_b");
    });

    it("should submit answer to short answer question", async () => {
      const updated = await testEngine.submitAnswer(attemptId, "question_2", {
        type: "short-answer",
        text: "The capital of France is Paris",
      });

      const answer = updated.answers.find((a) => a.questionId === "question_2");
      expect(answer?.text).toBe("The capital of France is Paris");
    });

    it("should submit answer to essay question", async () => {
      const essayText = `This is a comprehensive essay about the topic...
      It contains multiple paragraphs and discusses various points.
      The conclusion summarizes the main ideas.`;

      const updated = await testEngine.submitAnswer(attemptId, "question_3", {
        type: "essay",
        text: essayText,
      });

      const answer = updated.answers.find((a) => a.questionId === "question_3");
      expect(answer?.text).toContain("comprehensive essay");
    });

    it("should update answer if resubmitted", async () => {
      // First submission
      await testEngine.submitAnswer(attemptId, "question_4", {
        type: "true-false",
        selectedOption: "true",
      });

      // Second submission (update)
      const updated = await testEngine.submitAnswer(attemptId, "question_4", {
        type: "true-false",
        selectedOption: "false",
      });

      expect(updated.answers.length).toBeLessThanOrEqual(4);
      const answer = updated.answers.find((a) => a.questionId === "question_4");
      expect(answer?.text).toBe("false");
    });

    it("should record submission time", async () => {
      const before = Date.now();
      await testEngine.submitAnswer(attemptId, "question_5", {
        type: "short-answer",
        text: "Answer text",
      });
      const after = Date.now();

      const attempt = await testEngine.getAttempt(attemptId);
      const lastAnswer = attempt?.answers[attempt.answers.length - 1];

      expect(lastAnswer?.submittedAt?.getTime()).toBeGreaterThanOrEqual(before);
      expect(lastAnswer?.submittedAt?.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("Validate Answers", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_validate",
        studentId,
      );
      attemptId = attempt._id.toString();
    });

    it("should validate multiple choice answer", async () => {
      await testEngine.submitAnswer(attemptId, "question_mc", {
        type: "multiple-choice",
        selectedOption: "option_a",
      });

      const validation = await testEngine.validateAnswer(
        attemptId,
        "question_mc",
        { correctOption: "option_a" },
      );

      expect(validation.isCorrect).toBe(true);
      expect(validation.points).toBeGreaterThan(0);
    });

    it("should fail validation for incorrect option", async () => {
      await testEngine.submitAnswer(attemptId, "question_mc_2", {
        type: "multiple-choice",
        selectedOption: "option_c",
      });

      const validation = await testEngine.validateAnswer(
        attemptId,
        "question_mc_2",
        { correctOption: "option_a" },
      );

      expect(validation.isCorrect).toBe(false);
      expect(validation.points).toBe(0);
    });

    it("should validate true/false answer", async () => {
      await testEngine.submitAnswer(attemptId, "question_tf", {
        type: "true-false",
        selectedOption: "true",
      });

      const validation = await testEngine.validateAnswer(
        attemptId,
        "question_tf",
        { correctAnswer: "true" },
      );

      expect(validation.isCorrect).toBe(true);
    });

    it("should validate short answer", async () => {
      await testEngine.submitAnswer(attemptId, "question_sa", {
        type: "short-answer",
        text: "Paris",
      });

      const validation = await testEngine.validateAnswer(
        attemptId,
        "question_sa",
        { correctAnswers: ["Paris", "paris", "PARIS"] },
      );

      expect(validation.isCorrect).toBe(true);
    });

    it("should mark essay as pending review", async () => {
      await testEngine.submitAnswer(attemptId, "question_essay", {
        type: "essay",
        text: "Essay response",
      });

      const validation = await testEngine.validateAnswer(
        attemptId,
        "question_essay",
        { requiresManualReview: true },
      );

      expect(validation.isCorrect).toBeNull();
      expect(validation.status).toBe("pending_review");
    });
  });

  describe("Calculate Score", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_scoring",
        studentId,
      );
      attemptId = attempt._id.toString();

      // Submit 3 correct, 2 incorrect answers (each worth 10 points)
      await testEngine.submitAnswer(attemptId, "q1", {
        type: "multiple-choice",
        selectedOption: "a",
      });
      await testEngine.submitAnswer(attemptId, "q2", {
        type: "true-false",
        selectedOption: "true",
      });
      await testEngine.submitAnswer(attemptId, "q3", {
        type: "short-answer",
        text: "Correct",
      });
      await testEngine.submitAnswer(attemptId, "q4", {
        type: "multiple-choice",
        selectedOption: "c",
      });
      await testEngine.submitAnswer(attemptId, "q5", {
        type: "true-false",
        selectedOption: "false",
      });
    });

    it("should calculate total score", async () => {
      const score = await testEngine.calculateScore(attemptId, [
        { questionId: "q1", isCorrect: true, points: 10 },
        { questionId: "q2", isCorrect: true, points: 10 },
        { questionId: "q3", isCorrect: true, points: 10 },
        { questionId: "q4", isCorrect: false, points: 0 },
        { questionId: "q5", isCorrect: false, points: 0 },
      ]);

      expect(score.totalPoints).toBe(30);
      expect(score.maxPoints).toBe(50);
      expect(score.percentage).toBe(60);
    });

    it("should determine pass/fail", async () => {
      const score = await testEngine.calculateScore(
        attemptId,
        [
          { questionId: "q1", isCorrect: true, points: 10 },
          { questionId: "q2", isCorrect: true, points: 10 },
          { questionId: "q3", isCorrect: true, points: 10 },
          { questionId: "q4", isCorrect: false, points: 0 },
          { questionId: "q5", isCorrect: false, points: 0 },
        ],
        60, // passing score
      );

      expect(score.passed).toBe(true);
    });

    it("should determine failure", async () => {
      const score = await testEngine.calculateScore(
        attemptId,
        [
          { questionId: "q1", isCorrect: false, points: 0 },
          { questionId: "q2", isCorrect: false, points: 0 },
          { questionId: "q3", isCorrect: false, points: 0 },
          { questionId: "q4", isCorrect: false, points: 0 },
          { questionId: "q5", isCorrect: false, points: 0 },
        ],
        60,
      );

      expect(score.passed).toBe(false);
      expect(score.totalPoints).toBe(0);
    });
  });

  describe("Complete Attempt", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_complete",
        studentId,
      );
      attemptId = attempt._id.toString();

      // Submit some answers
      await testEngine.submitAnswer(attemptId, "q1", {
        type: "short-answer",
        text: "Answer 1",
      });
      await testEngine.submitAnswer(attemptId, "q2", {
        type: "short-answer",
        text: "Answer 2",
      });
    });

    it("should complete attempt", async () => {
      const completed = await testEngine.completeAttempt(attemptId, {
        totalPoints: 20,
        maxPoints: 50,
        percentage: 40,
        passed: false,
      });

      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeDefined();
      expect(completed.score?.totalPoints).toBe(20);
    });

    it("should calculate time spent", async () => {
      const attempt = await testEngine.getAttempt(attemptId);

      expect(attempt?.timeSpent).toBeDefined();
      expect(attempt?.timeSpent).toBeGreaterThan(0);
    });

    it("should prevent modification after completion", async () => {
      expect(async () => {
        await testEngine.submitAnswer(attemptId, "q3", {
          type: "short-answer",
          text: "New answer",
        });
      }).rejects.toThrow();
    });
  });

  describe("Review Answers", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_review",
        studentId,
      );
      attemptId = attempt._id.toString();

      await testEngine.submitAnswer(attemptId, "q1", {
        type: "short-answer",
        text: "Student answer",
      });
    });

    it("should provide answer feedback", async () => {
      const feedback = await testEngine.getAnswerFeedback(attemptId, "q1", {
        explanation: "This is the correct explanation",
        correctAnswer: "Expected answer",
      });

      expect(feedback).toBeDefined();
      expect(feedback.explanation).toBe("This is the correct explanation");
      expect(feedback.correctAnswer).toBe("Expected answer");
    });

    it("should show student answer with feedback", async () => {
      const review = await testEngine.getAnswerReview(attemptId, "q1");

      expect(review.studentAnswer).toBeDefined();
      expect(review.questionId).toBe("q1");
      expect(review.submittedAt).toBeDefined();
    });
  });

  describe("Retrieve Attempt", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_retrieve",
        studentId,
      );
      attemptId = attempt._id.toString();

      await testEngine.submitAnswer(attemptId, "q1", {
        type: "short-answer",
        text: "Answer 1",
      });
    });

    it("should get attempt by ID", async () => {
      const attempt = await testEngine.getAttempt(attemptId);

      expect(attempt).toBeDefined();
      expect(attempt?._id.toString()).toBe(attemptId);
      expect(attempt?.studentId).toBe(studentId);
    });

    it("should get student attempts", async () => {
      const attempts = await testEngine.getStudentAttempts(studentId, 1, 10);

      expect(Array.isArray(attempts.data)).toBe(true);
      expect(attempts.total).toBeGreaterThanOrEqual(1);
    });

    it("should get test attempts", async () => {
      const attempts = await testEngine.getTestAttempts(
        testId + "_retrieve",
        1,
        10,
      );

      expect(Array.isArray(attempts.data)).toBe(true);
      expect(attempts.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Suspend Attempt", () => {
    let attemptId: string;

    beforeAll(async () => {
      const attempt = await testEngine.startAttempt(
        testId + "_suspend",
        studentId,
      );
      attemptId = attempt._id.toString();

      await testEngine.submitAnswer(attemptId, "q1", {
        type: "short-answer",
        text: "Incomplete answer",
      });
    });

    it("should suspend in-progress attempt", async () => {
      const suspended = await testEngine.suspendAttempt(attemptId);

      expect(suspended.status).toBe("suspended");
      expect(suspended.suspendedAt).toBeDefined();
    });

    it("should allow resuming suspended attempt", async () => {
      const resumed = await testEngine.resumeAttempt(attemptId);

      expect(resumed.status).toBe("in_progress");
      expect(resumed.resumedAt).toBeDefined();
    });
  });
});
