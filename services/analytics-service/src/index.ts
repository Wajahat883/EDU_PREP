import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3004;
const DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/eduprep_analytics";

app.use(express.json());

// Database connection
mongoose
  .connect(DATABASE_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "analytics-service",
    timestamp: new Date().toISOString(),
  });
});

// Get progress summary
app.get("/api/progress/summary", async (req: Request, res: Response) => {
  try {
    const summary = {
      totalQuestionsAnswered: 4320,
      overallAccuracy: 72.5,
      accuracyTrend: "improving",
      bySubject: {
        cardiology: { accuracy: 85, attempted: 450 },
        pathology: { accuracy: 68, attempted: 380 },
      },
      streaks: { currentDayStreak: 5 },
      predictedPassProbability: 0.87,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Get performance trends
app.get("/api/progress/trends", async (req: Request, res: Response) => {
  try {
    const trends = [
      { date: "2024-01-01", accuracy: 0.65, questions: 40 },
      { date: "2024-01-02", accuracy: 0.72, questions: 45 },
      { date: "2024-01-03", accuracy: 0.75, questions: 42 },
    ];

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

app.listen(PORT, () => {
  console.log(`Analytics Service running on http://localhost:${PORT}`);
});

export default app;
