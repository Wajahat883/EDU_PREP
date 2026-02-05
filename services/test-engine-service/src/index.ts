import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import sessionsRoutes from "./routes/sessions.routes";
import WebSocketService from "./services/websocket.service";

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3003;
const DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/eduprep_tests";

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("MongoDB connected for Test Engine");
    console.log("WebSocket server initialized");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "test-engine-service",
    timestamp: new Date().toISOString(),
    websocket: "connected",
  });
});

// Routes
app.use("/api/sessions", sessionsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

httpServer.listen(PORT, () => {
  console.log(`Test Engine Service running on http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}`);
});

export default app;
export { io, wsService };
