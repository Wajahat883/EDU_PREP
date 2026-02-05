import express, { Express, Request, Response, NextFunction } from "express";
import videoRoutes from "../services/video-service/src/routes/videoRoutes";
import marketplaceRoutes from "../services/marketplace-service/src/routes/marketplaceRoutes";
import socialRoutes from "../services/social-service/src/routes/socialRoutes";
import schedulingRoutes from "../services/scheduling-service/src/routes/schedulingRoutes";
import proctoringRoutes from "../services/proctoring-service/src/routes/proctoringRoutes";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Service Routes
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);
app.use("/api/v1/social", socialRoutes);
app.use("/api/v1/scheduling", schedulingRoutes);
app.use("/api/v1/proctoring", proctoringRoutes);

// Health Check
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      video: "operational",
      marketplace: "operational",
      social: "operational",
      scheduling: "operational",
      proctoring: "operational",
    },
  });
});

// API Documentation
app.get("/api/v1/docs", (req: Request, res: Response) => {
  res.json({
    title: "EduPrep Platform API",
    version: "1.0.0",
    description: "Comprehensive educational platform API",
    services: {
      video: {
        baseUrl: "/api/v1/video",
        endpoints: {
          conferences: "Manage video conferences",
          "screen-share": "Screen sharing and annotations",
          whiteboards: "Collaborative whiteboarding",
          "live-classes": "Live class management",
        },
      },
      marketplace: {
        baseUrl: "/api/v1/marketplace",
        endpoints: {
          tutors: "Tutor profiles and discovery",
          courses: "Course listings and management",
          cart: "Shopping cart operations",
          transactions: "Payment processing",
        },
      },
      social: {
        baseUrl: "/api/v1/social",
        endpoints: {
          forums: "Discussion forums",
          groups: "Study groups",
          messages: "Direct messaging",
          feed: "Activity feeds",
          help: "Peer help system",
        },
      },
      scheduling: {
        baseUrl: "/api/v1/scheduling",
        endpoints: {
          schedule: "Class scheduling",
          calendar: "Event calendar",
          timezone: "Timezone management",
          conflicts: "Conflict detection",
        },
      },
      proctoring: {
        baseUrl: "/api/v1/proctoring",
        endpoints: {
          proctor: "Exam proctoring",
          "browser-lock": "Browser lockdown",
          identity: "Identity verification",
          "exam-security": "Exam security",
        },
      },
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Endpoint ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EduPrep Platform API running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/v1/health`);
});

export default app;
