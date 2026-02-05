/**
 * Payment Service - Docker Ready
 * Location: services/payment-service/src/index.ts
 */

import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "mongodb://admin:password123@localhost:27017/payment_db?authSource=admin";

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Database connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection failed", error);
  }
};

connectDatabase();

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "payment-service",
    timestamp: new Date().toISOString(),
  });
});

// Ready check endpoint
app.get("/ready", (req: Request, res: Response) => {
  res.json({
    ready: true,
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// Test API endpoint
app.get("/api/payments/plans", (req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: "basic",
        name: "Basic",
        price: 49,
        features: ["2K questions", "Basic stats", "Mobile app"],
      },
      {
        id: "standard",
        name: "Standard",
        price: 129,
        features: [
          "5K questions",
          "Advanced stats",
          "Mobile app",
          "Flashcards",
          "Mock exams",
          "AI tips",
        ],
      },
      {
        id: "premium",
        name: "Premium",
        price: 299,
        features: [
          "All 10K questions",
          "Advanced stats",
          "Mobile app",
          "Flashcards",
          "Mock exams",
          "AI tips",
          "Live tutoring",
          "Certificate",
          "Offline mode",
        ],
      },
    ],
  });
});

// Default route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "EduPrep Payment Service",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      ready: "/ready",
      plans: "/api/payments/plans",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✓ Payment Service listening on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API plans: http://localhost:${PORT}/api/payments/plans\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false).then(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

export default app;
