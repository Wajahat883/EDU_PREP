/**
 * WebSocket Service for Real-time Exam Updates
 * Handles timer updates, pause/resume, and real-time synchronization
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import ExamModeService from "./exam-mode.service";
import TestSession from "../models/TestSession";

export class WebSocketService {
  private io: SocketIOServer;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private activeSessions: Map<string, any> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join session room
      socket.on(
        "join_session",
        (data: { sessionId: string; userId: string }) => {
          const { sessionId, userId } = data;
          socket.join(sessionId);
          console.log(`User ${userId} joined session ${sessionId}`);

          // Notify others in session
          this.io
            .to(sessionId)
            .emit("user_joined", { userId, timestamp: Date.now() });
        },
      );

      // Start timer for timed exam
      socket.on(
        "start_timer",
        (data: { sessionId: string; examMode: string; timeLimit?: number }) => {
          const { sessionId, examMode, timeLimit } = data;

          if (examMode === "timed" && timeLimit) {
            this.startTimer(sessionId, timeLimit);
          }
        },
      );

      // Pause exam
      socket.on("pause_exam", (data: { sessionId: string }) => {
        this.pauseExam(data.sessionId);
      });

      // Resume exam
      socket.on("resume_exam", (data: { sessionId: string }) => {
        this.resumeExam(data.sessionId);
      });

      // Get time update
      socket.on("get_time_remaining", (data: { sessionId: string }) => {
        this.sendTimeUpdate(socket, data.sessionId);
      });

      // Question answered
      socket.on(
        "question_answered",
        (data: { sessionId: string; questionId: string; answer: string }) => {
          this.broadcastQuestionAnswer(data.sessionId, data);
        },
      );

      // Flag question for review
      socket.on(
        "flag_question",
        (data: { sessionId: string; questionId: string }) => {
          this.broadcastFlaggedQuestion(data.sessionId, data);
        },
      );

      // Leave session
      socket.on("leave_session", (data: { sessionId: string }) => {
        socket.leave(data.sessionId);
        console.log(`User left session ${data.sessionId}`);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Start countdown timer for timed exam
   */
  private startTimer(sessionId: string, totalTimeSeconds: number): void {
    // Clear existing timer if any
    if (this.activeTimers.has(sessionId)) {
      clearInterval(this.activeTimers.get(sessionId));
    }

    // Store session start time
    const sessionData = {
      sessionId,
      startTime: Date.now(),
      totalTime: totalTimeSeconds,
      timeRemaining: totalTimeSeconds,
      status: "running",
    };

    this.activeSessions.set(sessionId, sessionData);

    // Send timer update every second
    const timerInterval = setInterval(() => {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        clearInterval(timerInterval);
        this.activeTimers.delete(sessionId);
        return;
      }

      if (session.status === "running") {
        const elapsedSeconds = Math.floor(
          (Date.now() - session.startTime) / 1000,
        );
        session.timeRemaining = Math.max(0, totalTimeSeconds - elapsedSeconds);

        // Emit timer update
        this.io.to(sessionId).emit("timer_update", {
          sessionId,
          timeRemaining: session.timeRemaining,
          totalTime: totalTimeSeconds,
          warningLevel: ExamModeService.getTimeWarningLevel(
            session.timeRemaining,
            totalTimeSeconds,
          ),
          timestamp: Date.now(),
        });

        // Time up
        if (session.timeRemaining <= 0) {
          clearInterval(timerInterval);
          this.activeTimers.delete(sessionId);
          this.io.to(sessionId).emit("time_expired", {
            sessionId,
            message: "Time is up! Exam submitted automatically.",
            timestamp: Date.now(),
          });
          session.status = "completed";
        }
      }
    }, 1000);

    this.activeTimers.set(sessionId, timerInterval);
  }

  /**
   * Pause exam and timer
   */
  private pauseExam(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);

    if (session && session.status === "running") {
      session.status = "paused";
      session.pauseStartTime = Date.now();

      this.io.to(sessionId).emit("exam_paused", {
        sessionId,
        timeRemaining: session.timeRemaining,
        timestamp: Date.now(),
      });

      console.log(`Exam paused: ${sessionId}`);
    }
  }

  /**
   * Resume exam and timer
   */
  private resumeExam(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);

    if (session && session.status === "paused") {
      // Calculate pause duration
      const pauseDuration = Math.floor(
        (Date.now() - session.pauseStartTime) / 1000,
      );
      session.totalPausedTime = (session.totalPausedTime || 0) + pauseDuration;
      session.status = "running";
      session.startTime =
        Date.now() - (session.totalTime - session.timeRemaining) * 1000;

      this.io.to(sessionId).emit("exam_resumed", {
        sessionId,
        timeRemaining: session.timeRemaining,
        timestamp: Date.now(),
      });

      console.log(`Exam resumed: ${sessionId}`);
    }
  }

  /**
   * Send time update to specific socket
   */
  private sendTimeUpdate(socket: Socket, sessionId: string): void {
    const session = this.activeSessions.get(sessionId);

    if (session) {
      socket.emit("time_update", {
        sessionId,
        timeRemaining: session.timeRemaining,
        totalTime: session.totalTime,
        status: session.status,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Broadcast question answer to all in session
   */
  private broadcastQuestionAnswer(sessionId: string, data: any): void {
    this.io.to(sessionId).emit("question_answered", {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast flagged question
   */
  private broadcastFlaggedQuestion(sessionId: string, data: any): void {
    this.io.to(sessionId).emit("question_flagged", {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup session
   */
  public cleanupSession(sessionId: string): void {
    if (this.activeTimers.has(sessionId)) {
      clearInterval(this.activeTimers.get(sessionId));
      this.activeTimers.delete(sessionId);
    }

    this.activeSessions.delete(sessionId);
    console.log(`Session cleaned up: ${sessionId}`);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): Map<string, any> {
    return this.activeSessions;
  }

  /**
   * Send system notification to session
   */
  public sendNotification(
    sessionId: string,
    message: string,
    level: "info" | "warning" | "error" = "info",
  ): void {
    this.io.to(sessionId).emit("notification", {
      message,
      level,
      timestamp: Date.now(),
    });
  }
}

export default WebSocketService;
