import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
import questionRoutes from "./routes/questions.routes";
import { SearchService } from "./services/search.service";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;
const DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/eduprep_qbank";

// Initialize search service
const searchService = new SearchService();

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("MongoDB connected");
    // Initialize Elasticsearch index
    searchService.initializeIndex().catch(console.error);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "qbank-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/questions", questionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Server startup
app.listen(PORT, () => {
  console.log(`QBank Service running on http://localhost:${PORT}`);
});

export default app;
