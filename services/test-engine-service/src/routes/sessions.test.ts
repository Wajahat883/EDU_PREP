import request from "supertest";
import app from "../index";
import TestSession from "../models/TestSession";
import jwt from "jsonwebtoken";

const generateToken = (userId: string = "test-user") => {
  return jwt.sign({ userId }, process.env.JWT_PRIVATE_KEY || "test-key", {
    algorithm: "RS256",
    expiresIn: "24h",
  });
};

const mockQuestionIds = ["q1", "q2", "q3", "q4", "q5"];

describe("Test Engine Routes", () => {
  afterEach(async () => {
    await TestSession.deleteMany({});
  });

  // POST /api/sessions - Create session
  describe("POST /api/sessions", () => {
    it("should create timed session", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "timed",
          questionIds: mockQuestionIds,
          timeLimit: 300,
        })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.mode).toBe("timed");
      expect(res.body.data.timeLimit).toBe(300);
    });

    it("should create tutor session", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.mode).toBe("tutor");
      expect(res.body.data.hintsRemaining).toBe(3);
    });

    it("should create untimed session", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "untimed",
          questionIds: mockQuestionIds,
        })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.mode).toBe("untimed");
      expect(res.body.data.hintsRemaining).toBe(5);
    });

    it("should reject invalid mode", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "invalid",
          questionIds: mockQuestionIds,
        })
        .expect(400);

      expect(res.body.status).toBe("error");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/sessions")
        .send({
          examTypeId: "mcat",
          mode: "timed",
          questionIds: mockQuestionIds,
        })
        .expect(401);
    });
  });

  // GET /api/sessions/:sessionId - Get session details
  describe("GET /api/sessions/:sessionId", () => {
    let sessionId: string;

    beforeEach(async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "timed",
          questionIds: mockQuestionIds,
          timeLimit: 300,
        });
      sessionId = res.body.data.sessionId;
    });

    it("should return session details", async () => {
      const token = generateToken();
      const res = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.sessionId).toBe(sessionId);
      expect(res.body.data.status).toBe("in_progress");
    });

    it("should return 404 for non-existent session", async () => {
      const token = generateToken();
      const res = await request(app)
        .get("/api/sessions/invalid-session")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body.status).toBe("error");
    });

    it("should prevent access to other user sessions", async () => {
      const otherToken = generateToken("other-user");
      const res = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body.status).toBe("error");
    });
  });

  // POST /api/sessions/:sessionId/answer - Submit answer
  describe("POST /api/sessions/:sessionId/answer", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;
    });

    it("should submit answer", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          questionId: "q1",
          selectedOption: "A",
          timeSpent: 45,
          isCorrect: true,
        })
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.answersSubmitted).toBe(1);
      expect(res.body.data.currentQuestionIndex).toBe(1);
    });

    it("should update adaptive difficulty in tutor mode", async () => {
      await request(app)
        .post(`/api/sessions/${sessionId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          questionId: "q1",
          selectedOption: "A",
          timeSpent: 45,
          isCorrect: true, // Correct answer - difficulty should increase
        });

      const session = await TestSession.findOne({ sessionId });
      expect(session?.adaptiveFeatures.nextQuestionDifficulty).toBeGreaterThan(
        5,
      );
    });

    it("should not allow submission after completion", async () => {
      // Complete session first
      for (let i = 0; i < mockQuestionIds.length; i++) {
        await request(app)
          .post(`/api/sessions/${sessionId}/answer`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            questionId: mockQuestionIds[i],
            selectedOption: "A",
            timeSpent: 45,
            isCorrect: true,
          });
      }

      // Try to submit another answer
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          questionId: "q1",
          selectedOption: "B",
          timeSpent: 30,
          isCorrect: false,
        })
        .expect(400);

      expect(res.body.status).toBe("error");
    });
  });

  // POST /api/sessions/:sessionId/pause - Pause session
  describe("POST /api/sessions/:sessionId/pause", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;
    });

    it("should pause session", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/pause`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("paused");

      const session = await TestSession.findOne({ sessionId });
      expect(session?.status).toBe("paused");
    });
  });

  // POST /api/sessions/:sessionId/resume - Resume session
  describe("POST /api/sessions/:sessionId/resume", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;

      // Pause it
      await request(app)
        .post(`/api/sessions/${sessionId}/pause`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should resume paused session", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/resume`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("in_progress");
    });

    it("should track pause duration", async () => {
      const beforeResume = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post(`/api/sessions/${sessionId}/resume`)
        .set("Authorization", `Bearer ${token}`);

      const session = await TestSession.findOne({ sessionId });
      expect(session?.totalPausedTime).toBeGreaterThan(0);
    });
  });

  // POST /api/sessions/:sessionId/hint - Get hint
  describe("POST /api/sessions/:sessionId/hint", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;

      // Answer first question
      await request(app)
        .post(`/api/sessions/${sessionId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          questionId: "q1",
          selectedOption: "A",
          timeSpent: 45,
          isCorrect: true,
        });
    });

    it("should return hint", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/hint`)
        .set("Authorization", `Bearer ${token}`)
        .send({ hintLevel: 0 })
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.hint).toBeDefined();
      expect(res.body.data.hintsRemaining).toBe(2); // Started with 3
    });

    it("should decrement hints remaining", async () => {
      const session1 = await request(app)
        .post(`/api/sessions/${sessionId}/hint`)
        .set("Authorization", `Bearer ${token}`)
        .send({ hintLevel: 0 });

      const session2 = await request(app)
        .post(`/api/sessions/${sessionId}/hint`)
        .set("Authorization", `Bearer ${token}`)
        .send({ hintLevel: 1 });

      expect(session1.body.data.hintsRemaining).toBe(2);
      expect(session2.body.data.hintsRemaining).toBe(1);
    });

    it("should prevent using hints when none remaining", async () => {
      // Use all hints
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/sessions/${sessionId}/hint`)
          .set("Authorization", `Bearer ${token}`)
          .send({ hintLevel: 0 });
      }

      // Try to get another
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/hint`)
        .set("Authorization", `Bearer ${token}`)
        .send({ hintLevel: 0 })
        .expect(400);

      expect(res.body.status).toBe("error");
    });
  });

  // POST /api/sessions/:sessionId/flag - Flag question
  describe("POST /api/sessions/:sessionId/flag", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;

      // Answer question
      await request(app)
        .post(`/api/sessions/${sessionId}/answer`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          questionId: "q1",
          selectedOption: "A",
          timeSpent: 45,
          isCorrect: true,
        });
    });

    it("should flag question for review", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/flag`)
        .set("Authorization", `Bearer ${token}`)
        .send({ questionId: "q1" })
        .expect(200);

      expect(res.body.status).toBe("success");

      const session = await TestSession.findOne({ sessionId });
      const answer = session?.answers.find((a) => a.questionId === "q1");
      expect(answer?.markedForReview).toBe(true);
    });
  });

  // POST /api/sessions/:sessionId/complete - Complete session
  describe("POST /api/sessions/:sessionId/complete", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;

      // Answer all questions
      for (let i = 0; i < mockQuestionIds.length; i++) {
        await request(app)
          .post(`/api/sessions/${sessionId}/answer`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            questionId: mockQuestionIds[i],
            selectedOption: "A",
            timeSpent: 45,
            isCorrect: i < 3, // 3 correct, 2 incorrect
          });
      }
    });

    it("should complete session and calculate score", async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.correctCount).toBe(3);
      expect(res.body.data.totalQuestions).toBe(5);
      expect(res.body.data.scorePercentage).toBe(60);
      expect(res.body.data.grade).toBe("D");
    });
  });

  // GET /api/sessions/:sessionId/results - Get results
  describe("GET /api/sessions/:sessionId/results", () => {
    let sessionId: string;
    let token: string;

    beforeEach(async () => {
      token = generateToken();
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "timed",
          questionIds: mockQuestionIds,
        });
      sessionId = res.body.data.sessionId;

      // Answer and complete
      for (let i = 0; i < mockQuestionIds.length; i++) {
        await request(app)
          .post(`/api/sessions/${sessionId}/answer`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            questionId: mockQuestionIds[i],
            selectedOption: "A",
            timeSpent: 45,
            isCorrect: i < 4, // 4 correct out of 5 = 80%
          });
      }

      await request(app)
        .post(`/api/sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return detailed results", async () => {
      const res = await request(app)
        .get(`/api/sessions/${sessionId}/results`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.scorePercentage).toBe(80);
      expect(res.body.data.grade).toBe("B");
      expect(res.body.data.performanceLevel).toBe("good");
      expect(res.body.data.standardScore).toBeDefined();
    });

    it("should return error if session not completed", async () => {
      const res2 = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          examTypeId: "mcat",
          mode: "tutor",
          questionIds: mockQuestionIds,
        });

      const incompleteSessionId = res2.body.data.sessionId;

      const res = await request(app)
        .get(`/api/sessions/${incompleteSessionId}/results`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(res.body.status).toBe("error");
    });
  });
});
