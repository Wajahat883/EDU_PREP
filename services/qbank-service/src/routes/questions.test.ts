import request from "supertest";
import app from "../index";
import Question from "../models/Question";
import { SearchService } from "../services/search.service";
import jwt from "jsonwebtoken";

// Mock data
const mockQuestion = {
  examTypeId: "mcat",
  subjectId: "biology",
  questionType: "single-choice",
  stemText: "Which organelle is responsible for ATP production?",
  options: [
    {
      label: "A",
      text: "Mitochondria",
      isCorrect: true,
      explanation: "Mitochondria is the powerhouse of the cell",
    },
    {
      label: "B",
      text: "Ribosome",
      isCorrect: false,
      explanation: "Ribosome is for protein synthesis",
    },
    {
      label: "C",
      text: "Nucleus",
      isCorrect: false,
      explanation: "Nucleus stores DNA",
    },
    {
      label: "D",
      text: "Golgi apparatus",
      isCorrect: false,
      explanation: "Golgi apparatus modifies proteins",
    },
  ],
  explanationText:
    "The mitochondria is the powerhouse of the cell and produces ATP through oxidative phosphorylation.",
  difficulty: 5,
  bloomLevel: "Remember",
  tags: ["cell-biology", "organelles", "energy"],
  learningObjective: new "ObjectId"("507f1f77bcf86cd799439011"),
  createdBy: new "ObjectId"("507f1f77bcf86cd799439012"),
};

const generateToken = (
  userId: string = "507f1f77bcf86cd799439012",
  role: string = "student",
) => {
  return jwt.sign({ userId, role }, process.env.JWT_PRIVATE_KEY || "test-key", {
    algorithm: "RS256",
    expiresIn: "24h",
  });
};

describe("QBank Routes", () => {
  let createdQuestionId: string;
  let searchService: SearchService;

  beforeAll(async () => {
    searchService = new SearchService();
    await searchService.initializeIndex();
  });

  afterEach(async () => {
    // Clean up
    await Question.deleteMany({});
  });

  // GET /api/questions - List with filters
  describe("GET /api/questions", () => {
    beforeEach(async () => {
      // Create test questions
      await Question.create([
        { ...mockQuestion, difficulty: 3, tags: ["easy"] },
        { ...mockQuestion, difficulty: 7, tags: ["hard"] },
        { ...mockQuestion, examTypeId: "usmle", difficulty: 5 },
      ]);
    });

    it("should return all questions", async () => {
      const res = await request(app).get("/api/questions").expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it("should filter by exam_type", async () => {
      const res = await request(app)
        .get("/api/questions?exam_type=usmle")
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].examTypeId).toBe("usmle");
    });

    it("should filter by difficulty range", async () => {
      const res = await request(app)
        .get("/api/questions?difficulty_min=5&difficulty_max=8")
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((q: any) => {
        expect(q.difficulty).toBeGreaterThanOrEqual(5);
        expect(q.difficulty).toBeLessThanOrEqual(8);
      });
    });

    it("should filter by tags", async () => {
      const res = await request(app)
        .get("/api/questions?tags=hard")
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should support pagination", async () => {
      const res = await request(app)
        .get("/api/questions?limit=2&offset=0")
        .expect(200);

      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.offset).toBe(0);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it("should enforce max limit of 100", async () => {
      const res = await request(app)
        .get("/api/questions?limit=500")
        .expect(200);

      expect(res.body.pagination.limit).toBe(100);
    });

    it("should sort by difficulty", async () => {
      const res = await request(app)
        .get("/api/questions?sort=difficulty")
        .expect(200);

      expect(res.body.data[0].difficulty).toBeGreaterThanOrEqual(
        res.body.data[1].difficulty,
      );
    });

    it("should cache results", async () => {
      // First request
      await request(app).get("/api/questions?exam_type=mcat").expect(200);

      // Second request should return cached
      const res = await request(app)
        .get("/api/questions?exam_type=mcat")
        .expect(200);

      expect(res.body.source).toBe("cache");
    });
  });

  // GET /api/questions/:id - Get single question
  describe("GET /api/questions/:id", () => {
    beforeEach(async () => {
      const created = await Question.create(mockQuestion);
      createdQuestionId = created._id.toString();
    });

    it("should return single question", async () => {
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data._id).toBe(createdQuestionId);
      expect(res.body.data.stemText).toBe(mockQuestion.stemText);
    });

    it("should return 404 for non-existent question", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const res = await request(app)
        .get(`/api/questions/${fakeId}`)
        .expect(404);

      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Question not found");
    });

    it("should increment view count", async () => {
      await request(app).get(`/api/questions/${createdQuestionId}`).expect(200);

      // Small delay for async update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await Question.findById(createdQuestionId);
      expect(updated?.statistics.viewCount).toBeGreaterThan(0);
    });

    it("should cache question details", async () => {
      // First request
      await request(app).get(`/api/questions/${createdQuestionId}`).expect(200);

      // Second request
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}`)
        .expect(200);

      expect(res.body.source).toBe("cache");
    });
  });

  // GET /api/questions/:id/explanation
  describe("GET /api/questions/:id/explanation", () => {
    beforeEach(async () => {
      const created = await Question.create(mockQuestion);
      createdQuestionId = created._id.toString();
    });

    it("should return explanation with options", async () => {
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}/explanation`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.explanation).toBeDefined();
      expect(res.body.data.correctOption).toBe("A");
      expect(res.body.data.allOptions).toHaveLength(4);
    });

    it("should include option explanations", async () => {
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}/explanation`)
        .expect(200);

      res.body.data.allOptions.forEach((opt: any) => {
        expect(opt.explanation).toBeDefined();
      });
    });

    it("should return 404 for non-existent question", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const res = await request(app)
        .get(`/api/questions/${fakeId}/explanation`)
        .expect(404);

      expect(res.body.status).toBe("error");
    });
  });

  // GET /api/questions/:id/statistics
  describe("GET /api/questions/:id/statistics", () => {
    beforeEach(async () => {
      const created = await Question.create({
        ...mockQuestion,
        statistics: {
          attempts: 150,
          averageTime: 45,
          correctPercentage: 72.5,
          reportedIssues: 2,
        },
      });
      createdQuestionId = created._id.toString();
    });

    it("should return question statistics", async () => {
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}/statistics`)
        .expect(200);

      expect(res.body.data.attempts).toBe(150);
      expect(res.body.data.correctPercentage).toBe(72.5);
      expect(res.body.data.reportedIssues).toBe(2);
    });

    it("should include metadata", async () => {
      const res = await request(app)
        .get(`/api/questions/${createdQuestionId}/statistics`)
        .expect(200);

      expect(res.body.data.difficulty).toBeDefined();
      expect(res.body.data.bloomLevel).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
    });
  });

  // POST /api/questions/:id/flags
  describe("POST /api/questions/:id/flags", () => {
    beforeEach(async () => {
      const created = await Question.create(mockQuestion);
      createdQuestionId = created._id.toString();
    });

    it("should create flag with valid reason", async () => {
      const token = generateToken();
      const res = await request(app)
        .post(`/api/questions/${createdQuestionId}/flags`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          reason: "incorrect_answer",
          description: "The correct answer should be B",
        })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.reason).toBe("incorrect_answer");
    });

    it("should reject invalid reason", async () => {
      const token = generateToken();
      const res = await request(app)
        .post(`/api/questions/${createdQuestionId}/flags`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          reason: "invalid_reason",
          description: "Test",
        })
        .expect(400);

      expect(res.body.status).toBe("error");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post(`/api/questions/${createdQuestionId}/flags`)
        .send({
          reason: "incorrect_answer",
          description: "Test",
        })
        .expect(401);
    });

    it("should increment flag count", async () => {
      const token = generateToken();
      await request(app)
        .post(`/api/questions/${createdQuestionId}/flags`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          reason: "unclear",
          description: "Confusing wording",
        })
        .expect(201);

      const updated = await Question.findById(createdQuestionId);
      expect(updated?.statistics.reportedIssues).toBeGreaterThan(0);
    });
  });

  // POST /api/admin/questions/bulk
  describe("POST /api/admin/questions/bulk", () => {
    it("should bulk import valid questions", async () => {
      const token = generateToken("admin-user", "admin");
      const questionsToImport = [
        mockQuestion,
        { ...mockQuestion, stemText: "Question 2" },
        { ...mockQuestion, stemText: "Question 3" },
      ];

      const res = await request(app)
        .post("/api/admin/questions/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ questions: questionsToImport })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.importedCount).toBe(3);
    });

    it("should reject non-admin users", async () => {
      const token = generateToken("user", "student");
      const res = await request(app)
        .post("/api/admin/questions/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ questions: [mockQuestion] })
        .expect(403);

      expect(res.body.status).toBe("error");
    });

    it("should validate questions before import", async () => {
      const token = generateToken("admin", "admin");
      const invalidQuestions = [
        { ...mockQuestion, stemText: undefined }, // Missing required field
        { ...mockQuestion, difficulty: 15 }, // Invalid difficulty
      ];

      const res = await request(app)
        .post("/api/admin/questions/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ questions: invalidQuestions })
        .expect(400);

      expect(res.body.status).toBe("error");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should handle large imports in batches", async () => {
      const token = generateToken("admin", "admin");
      const largeImport = Array(2500)
        .fill(null)
        .map((_, i) => ({
          ...mockQuestion,
          stemText: `Question ${i + 1}`,
        }));

      const res = await request(app)
        .post("/api/admin/questions/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ questions: largeImport })
        .expect(201);

      expect(res.body.data.importedCount).toBe(2500);
    });

    it("should reject imports exceeding 10,000 questions", async () => {
      const token = generateToken("admin", "admin");
      const tooMany = Array(10001)
        .fill(null)
        .map((_, i) => ({
          ...mockQuestion,
          stemText: `Question ${i + 1}`,
        }));

      const res = await request(app)
        .post("/api/admin/questions/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ questions: tooMany })
        .expect(400);

      expect(res.body.status).toBe("error");
    });
  });

  // GET /api/questions/search
  describe("GET /api/questions/search", () => {
    beforeEach(async () => {
      const questions = [
        {
          ...mockQuestion,
          stemText: "Mitochondria and ATP production",
          tags: ["biology"],
        },
        {
          ...mockQuestion,
          stemText: "Photosynthesis in plants",
          tags: ["biology"],
        },
        {
          ...mockQuestion,
          stemText: "Chemical equations in chemistry",
          tags: ["chemistry"],
        },
      ];

      await Question.create(questions);

      // Index to Elasticsearch
      for (const q of questions) {
        await searchService.indexQuestion(q);
      }
    });

    it("should search by query string", async () => {
      const res = await request(app)
        .get("/api/questions/search?q=mitochondria")
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should support filters in search", async () => {
      const res = await request(app)
        .get("/api/questions/search?q=biology&exam_type=mcat&subject=biology")
        .expect(200);

      expect(res.body.status).toBe("success");
    });

    it("should return error without query", async () => {
      const res = await request(app)
        .get("/api/questions/search?q=")
        .expect(400);

      expect(res.body.status).toBe("error");
    });

    it("should paginate search results", async () => {
      const res = await request(app)
        .get("/api/questions/search?q=biology&limit=1&offset=0")
        .expect(200);

      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.hasMore).toBeDefined();
    });
  });
});
