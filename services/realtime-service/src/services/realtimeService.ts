import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../middleware/auth";

interface UserRoom {
  userId: string;
  socketId: string;
  role: string;
}

interface CollaborativeSession {
  testId: string;
  participants: Map<string, UserRoom>;
  startTime: number;
}

export class RealtimeService {
  private io: SocketIOServer;
  private collaborativeSessions: Map<string, CollaborativeSession> = new Map();
  private userConnections: Map<string, UserRoom> = new Map();
  private roomActivity: Map<string, any[]> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3006",
        credentials: true,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = await verifyToken(token);
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`User connected: ${socket.data.userId}`);

      const userRoom: UserRoom = {
        userId: socket.data.userId,
        socketId: socket.id,
        role: socket.data.role,
      };
      this.userConnections.set(socket.id, userRoom);

      // User online status
      socket.on("user:online", () => {
        this.io.emit("user:status", {
          userId: socket.data.userId,
          status: "online",
          timestamp: Date.now(),
        });
      });

      // Join test collaboration
      socket.on("test:join", (data: { testId: string }) => {
        this.handleTestJoin(socket, data.testId);
      });

      // Leave test collaboration
      socket.on("test:leave", (data: { testId: string }) => {
        this.handleTestLeave(socket, data.testId);
      });

      // Answer submitted
      socket.on("question:answered", (data: any) => {
        this.handleQuestionAnswered(socket, data);
      });

      // Test progress update
      socket.on("test:progress", (data: any) => {
        this.handleTestProgress(socket, data);
      });

      // Real-time question discussion
      socket.on("question:discuss", (data: any) => {
        this.handleQuestionDiscussion(socket, data);
      });

      // Hint request
      socket.on("hint:request", (data: any) => {
        this.handleHintRequest(socket, data);
      });

      // User typing
      socket.on("test:typing", (data: any) => {
        this.broadcastToRoom(`test:${data.testId}`, "user:typing", {
          userId: socket.data.userId,
          questionId: data.questionId,
        });
      });

      // Disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on("error", (error: any) => {
        console.error(`Socket error for ${socket.data.userId}:`, error);
      });
    });
  }

  private handleTestJoin(socket: Socket, testId: string): void {
    const roomName = `test:${testId}`;
    socket.join(roomName);

    let session = this.collaborativeSessions.get(testId);
    if (!session) {
      session = {
        testId,
        participants: new Map(),
        startTime: Date.now(),
      };
      this.collaborativeSessions.set(testId, session);
    }

    const userRoom: UserRoom = {
      userId: socket.data.userId,
      socketId: socket.id,
      role: socket.data.role,
    };
    session.participants.set(socket.data.userId, userRoom);

    this.io.to(roomName).emit("test:participant:joined", {
      userId: socket.data.userId,
      role: socket.data.role,
      participantCount: session.participants.size,
      timestamp: Date.now(),
    });

    // Initialize activity log for room
    if (!this.roomActivity.has(roomName)) {
      this.roomActivity.set(roomName, []);
    }

    this.logRoomActivity(roomName, "participant_joined", {
      userId: socket.data.userId,
    });
  }

  private handleTestLeave(socket: Socket, testId: string): void {
    const roomName = `test:${testId}`;
    socket.leave(roomName);

    const session = this.collaborativeSessions.get(testId);
    if (session) {
      session.participants.delete(socket.data.userId);

      if (session.participants.size === 0) {
        this.collaborativeSessions.delete(testId);
        this.roomActivity.delete(roomName);
      } else {
        this.io.to(roomName).emit("test:participant:left", {
          userId: socket.data.userId,
          participantCount: session.participants.size,
          timestamp: Date.now(),
        });
      }
    }

    this.logRoomActivity(roomName, "participant_left", {
      userId: socket.data.userId,
    });
  }

  private handleQuestionAnswered(socket: Socket, data: any): void {
    const { testId, questionId, answer, timeTaken } = data;
    const roomName = `test:${testId}`;

    this.io.to(roomName).emit("question:answered", {
      userId: socket.data.userId,
      questionId,
      isCorrect: undefined, // Don't reveal answer to others
      timeTaken,
      timestamp: Date.now(),
    });

    this.logRoomActivity(roomName, "answer_submitted", {
      userId: socket.data.userId,
      questionId,
      timeTaken,
    });
  }

  private handleTestProgress(socket: Socket, data: any): void {
    const { testId, progress } = data;
    const roomName = `test:${testId}`;

    this.io.to(roomName).emit("test:progress:updated", {
      userId: socket.data.userId,
      progress, // { currentQuestion, totalQuestions, elapsedTime }
      timestamp: Date.now(),
    });

    this.logRoomActivity(roomName, "progress_updated", {
      userId: socket.data.userId,
      progress,
    });
  }

  private handleQuestionDiscussion(socket: Socket, data: any): void {
    const { testId, questionId, message, messageType } = data;
    const roomName = `test:${testId}`;

    this.io.to(roomName).emit("question:message", {
      userId: socket.data.userId,
      questionId,
      message,
      messageType, // 'comment', 'clarification-request', 'hint-request'
      role: socket.data.role,
      timestamp: Date.now(),
    });

    this.logRoomActivity(roomName, "discussion_message", {
      userId: socket.data.userId,
      questionId,
      messageType,
    });
  }

  private handleHintRequest(socket: Socket, data: any): void {
    const { testId, questionId } = data;
    const roomName = `test:${testId}`;

    // Only instructors/admins can provide hints
    const participants = this.collaborativeSessions.get(testId)?.participants;
    const instructors = Array.from(participants?.values() || []).filter(
      (p) => p.role === "instructor" || p.role === "admin",
    );

    instructors.forEach((instructor) => {
      this.io.to(instructor.socketId).emit("hint:requested", {
        userId: socket.data.userId,
        questionId,
        testId,
        timestamp: Date.now(),
      });
    });

    this.logRoomActivity(roomName, "hint_requested", {
      userId: socket.data.userId,
      questionId,
    });
  }

  private handleDisconnect(socket: Socket): void {
    console.log(`User disconnected: ${socket.data.userId}`);
    this.userConnections.delete(socket.id);

    // Leave all collaborative sessions
    this.collaborativeSessions.forEach((session, testId) => {
      if (session.participants.has(socket.data.userId)) {
        session.participants.delete(socket.data.userId);
        const roomName = `test:${testId}`;

        if (session.participants.size === 0) {
          this.collaborativeSessions.delete(testId);
        } else {
          this.io.to(roomName).emit("test:participant:left", {
            userId: socket.data.userId,
            participantCount: session.participants.size,
          });
        }
      }
    });

    // Broadcast offline status
    this.io.emit("user:status", {
      userId: socket.data.userId,
      status: "offline",
      timestamp: Date.now(),
    });
  }

  private broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  }

  private logRoomActivity(room: string, action: string, details: any): void {
    const activity = {
      action,
      details,
      timestamp: Date.now(),
    };

    const log = this.roomActivity.get(room) || [];
    log.push(activity);

    // Keep only last 100 activities per room
    if (log.length > 100) {
      log.shift();
    }

    this.roomActivity.set(room, log);
  }

  getRoomActivity(testId: string): any[] {
    return this.roomActivity.get(`test:${testId}`) || [];
  }

  getActiveParticipants(testId: string): UserRoom[] {
    const session = this.collaborativeSessions.get(testId);
    return session ? Array.from(session.participants.values()) : [];
  }

  notifyUser(userId: string, event: string, data: any): void {
    const connection = Array.from(this.userConnections.values()).find(
      (c) => c.userId === userId,
    );
    if (connection) {
      this.io.to(connection.socketId).emit(event, {
        ...data,
        timestamp: Date.now(),
      });
    }
  }

  broadcastToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      this.notifyUser(userId, event, data);
    });
  }

  getConnectedUsers(): string[] {
    const uniqueUsers = new Set(
      Array.from(this.userConnections.values()).map((c) => c.userId),
    );
    return Array.from(uniqueUsers);
  }
}

export default RealtimeService;
