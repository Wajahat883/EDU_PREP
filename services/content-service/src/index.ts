import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDatabase } from "./middleware/database";
import pastpapersRouter from "./routes/pastpapers";
import booksRouter from "./routes/books";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response): void => {
  res.json({ status: "OK", service: "Content Service" });
});

// Routes
app.use("/api/content/pastpapers", pastpapersRouter);
app.use("/api/content/books", booksRouter);

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Content Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
