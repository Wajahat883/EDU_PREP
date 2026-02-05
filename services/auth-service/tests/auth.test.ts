/**
 * Authentication Service Test Suite
 *
 * Tests for:
 * - User registration and login
 * - JWT token generation and validation
 * - Password hashing and verification
 * - Role-based access control
 * - Token refresh and revocation
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { AuthService } from "../services/authService";

describe("Authentication Service", () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup: Connect to test database
    // In real scenario, use separate test DB
  });

  afterAll(async () => {
    // Cleanup: Clear test data
    await User.deleteMany({});
  });

  describe("User Registration", () => {
    it("should register a new user with valid credentials", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "SecurePass123!",
        name: "Test User",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.token).toBeDefined();
    });

    it("should fail registration with duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        email: "duplicate@example.com",
        password: "SecurePass123!",
        name: "User 1",
      });

      const res = await request(app).post("/api/auth/register").send({
        email: "duplicate@example.com",
        password: "DifferentPass123!",
        name: "User 2",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("already exists");
    });

    it("should fail registration with invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: "SecurePass123!",
        name: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should fail registration with weak password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "123", // Too weak
        name: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should hash password and not store plaintext", async () => {
      await request(app).post("/api/auth/register").send({
        email: "hash@example.com",
        password: "SecurePass123!",
        name: "Hash Test",
      });

      const user = await User.findOne({ email: "hash@example.com" });
      expect(user).toBeDefined();
      expect(user!.password).not.toBe("SecurePass123!");
      expect(user!.password.length).toBeGreaterThan(20); // Hash is longer
    });
  });

  describe("User Login", () => {
    beforeEach(async () => {
      // Create test user
      await request(app).post("/api/auth/register").send({
        email: "login@example.com",
        password: "TestPass123!",
        name: "Login Test",
      });
    });

    it("should login user with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "TestPass123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("login@example.com");

      authToken = res.body.token;
    });

    it("should fail login with incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "WrongPassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("password");
    });

    it("should fail login with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "AnyPass123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("JWT Token Validation", () => {
    beforeEach(async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "TestPass123!",
      });
      authToken = res.body.token;
    });

    it("should access protected route with valid token", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/profile");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject request with invalid token", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", "Bearer invalid_token_here");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject expired token", async () => {
      // Create expired token
      const expiredToken = AuthService.generateToken(
        { userId: "test_id", role: "user" },
        -3600, // Negative expiration = already expired
      );

      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("expired");
    });
  });

  describe("Role-Based Access Control", () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
      // Create admin user
      await User.create({
        email: "admin@example.com",
        password: "AdminPass123!",
        name: "Admin User",
        role: "admin",
      });

      // Create regular user
      await User.create({
        email: "user@example.com",
        password: "UserPass123!",
        name: "Regular User",
        role: "user",
      });

      // Get tokens
      const adminRes = await request(app).post("/api/auth/login").send({
        email: "admin@example.com",
        password: "AdminPass123!",
      });
      adminToken = adminRes.body.token;

      const userRes = await request(app).post("/api/auth/login").send({
        email: "user@example.com",
        password: "UserPass123!",
      });
      userToken = userRes.body.token;
    });

    it("should allow admin to access admin routes", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject user accessing admin routes", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("not authorized");
    });
  });

  describe("Password Reset", () => {
    it("should generate reset token for valid email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "login@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("reset link");
    });

    it("should reset password with valid token", async () => {
      // First request reset token
      const resetRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "login@example.com" });

      const resetToken = resetRes.body.resetToken;

      // Then reset password
      const res = await request(app).post("/api/auth/reset-password").send({
        token: resetToken,
        newPassword: "NewSecurePass123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject reset with invalid token", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "invalid_token",
        newPassword: "NewPass123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Token Refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "TestPass123!",
      });
      refreshToken = res.body.refreshToken;
    });

    it("should refresh token with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.token).not.toBe(refreshToken);
    });

    it("should reject refresh with invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid_token" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
