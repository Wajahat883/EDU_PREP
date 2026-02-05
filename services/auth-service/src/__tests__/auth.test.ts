import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import app from "../index";
import User from "../models/User";
import jwt from "jsonwebtoken";

describe("Auth Service Tests", () => {
  const testUser = {
    email: "test@example.com",
    password: "Test1234!",
    firstName: "Test",
    lastName: "User",
  };

  beforeEach(async () => {
    // Clear test data before each test
    await User.deleteMany({ email: testUser.email });
  });

  afterEach(async () => {
    // Cleanup after each test
    await User.deleteMany({ email: testUser.email });
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe(testUser.email);
    });

    it("should reject duplicate email", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send(testUser);

      // Try to register again with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body.message).toContain("already exists");
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.message).toContain("email");
    });

    it("should validate password strength", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          password: "weak",
        })
        .expect(400);

      expect(response.body.message).toContain("password");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create user before login tests
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body.message).toContain("invalid");
    });

    it("should reject non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toContain("not found");
    });
  });

  describe("POST /api/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);
      refreshToken = response.body.refreshToken;
    });

    it("should refresh access token with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.accessToken).toBeTruthy();
    });

    it("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.message).toContain("invalid");
    });
  });

  describe("GET /api/auth/me", () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);
      accessToken = response.body.accessToken;
    });

    it("should return current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.message).toContain("token");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.message).toContain("invalid");
    });
  });

  describe("PUT /api/auth/profile", () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);
      accessToken = response.body.accessToken;
    });

    it("should update user profile", async () => {
      const updates = {
        firstName: "Updated",
        phone: "+1234567890",
      };

      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.firstName).toBe(updates.firstName);
      expect(response.body.phone).toBe(updates.phone);
    });

    it("should not allow email change via profile endpoint", async () => {
      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "newemail@example.com" })
        .expect(400);

      expect(response.body.message).toContain("cannot change");
    });
  });
});
