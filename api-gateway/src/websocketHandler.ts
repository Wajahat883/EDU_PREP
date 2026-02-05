import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { videoConferencingService } from "../services/video-service/src/services/videoConferencingService";
import { screenSharingService } from "../services/video-service/src/services/screenSharingService";
import { whiteboardService } from "../services/video-service/src/services/whiteboardService";
import { messagingService } from "../services/social-service/src/services/messagingService";
import { activityFeedService } from "../services/social-service/src/services/activityFeedService";

class WebSocketHandler {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map();
  private roomParticipants: Map<string, Set<string>> = new Map();
  private conversationConnections: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupConnections();
    this.setupEventHandlers();
  }

  private setupConnections(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      socket.on("user:join", (data: { userId: string; userName: string }) => {
        this.userSockets.set(data.userId, socket.id);
        console.log(`👤 ${data.userName} joined as ${socket.id}`);
      });

      socket.on("disconnect", () => {
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`❌ User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  private setupEventHandlers(): void {
    // Video Conference Events
    this.io.on("connection", (socket: Socket) => {
      socket.on(
        "conference:join",
        (data: { roomId: string; userId: string }) => {
          socket.join(`conference:${data.roomId}`);
          if (!this.roomParticipants.has(data.roomId)) {
            this.roomParticipants.set(data.roomId, new Set());
          }
          this.roomParticipants.get(data.roomId)?.add(data.userId);

          this.io.to(`conference:${data.roomId}`).emit("participant:joined", {
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "conference:leave",
        (data: { roomId: string; userId: string }) => {
          socket.leave(`conference:${data.roomId}`);
          this.roomParticipants.get(data.roomId)?.delete(data.userId);

          this.io.to(`conference:${data.roomId}`).emit("participant:left", {
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Video Stream Events
      socket.on(
        "video:stream",
        (data: { roomId: string; userId: string; stream: any }) => {
          this.io
            .to(`conference:${data.roomId}`)
            .emit("video:stream:received", {
              userId: data.userId,
              stream: data.stream,
              timestamp: new Date().toISOString(),
            });
        },
      );

      socket.on(
        "audio:toggle",
        (data: { roomId: string; userId: string; enabled: boolean }) => {
          this.io.to(`conference:${data.roomId}`).emit("audio:status", {
            userId: data.userId,
            enabled: data.enabled,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "video:toggle",
        (data: { roomId: string; userId: string; enabled: boolean }) => {
          this.io.to(`conference:${data.roomId}`).emit("video:status", {
            userId: data.userId,
            enabled: data.enabled,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Chat Events
      socket.on(
        "conference:chat",
        (data: {
          roomId: string;
          userId: string;
          userName: string;
          message: string;
        }) => {
          this.io
            .to(`conference:${data.roomId}`)
            .emit("chat:message:received", {
              userId: data.userId,
              userName: data.userName,
              message: data.message,
              timestamp: new Date().toISOString(),
            });
        },
      );

      // Screen Sharing Events
      socket.on(
        "screen:share:start",
        (data: { roomId: string; userId: string }) => {
          this.io.to(`conference:${data.roomId}`).emit("screen:share:started", {
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "screen:share:stop",
        (data: { roomId: string; userId: string }) => {
          this.io.to(`conference:${data.roomId}`).emit("screen:share:stopped", {
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "screen:stream",
        (data: { roomId: string; userId: string; stream: any }) => {
          this.io
            .to(`conference:${data.roomId}`)
            .emit("screen:stream:received", {
              userId: data.userId,
              stream: data.stream,
              timestamp: new Date().toISOString(),
            });
        },
      );

      // Whiteboard Events
      socket.on(
        "whiteboard:draw",
        (data: { roomId: string; userId: string; drawData: any }) => {
          this.io
            .to(`conference:${data.roomId}`)
            .emit("whiteboard:draw:received", {
              userId: data.userId,
              drawData: data.drawData,
              timestamp: new Date().toISOString(),
            });
        },
      );

      socket.on(
        "whiteboard:undo",
        (data: { roomId: string; userId: string }) => {
          this.io.to(`conference:${data.roomId}`).emit("whiteboard:action", {
            action: "undo",
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "whiteboard:redo",
        (data: { roomId: string; userId: string }) => {
          this.io.to(`conference:${data.roomId}`).emit("whiteboard:action", {
            action: "redo",
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "whiteboard:clear",
        (data: { roomId: string; userId: string }) => {
          this.io.to(`conference:${data.roomId}`).emit("whiteboard:cleared", {
            userId: data.userId,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Messaging Events
      socket.on(
        "message:send",
        (data: {
          conversationId: string;
          userId: string;
          userName: string;
          text: string;
        }) => {
          socket.join(`conversation:${data.conversationId}`);
          if (!this.conversationConnections.has(data.conversationId)) {
            this.conversationConnections.set(data.conversationId, new Set());
          }

          this.io
            .to(`conversation:${data.conversationId}`)
            .emit("message:received", {
              conversationId: data.conversationId,
              userId: data.userId,
              userName: data.userName,
              text: data.text,
              timestamp: new Date().toISOString(),
            });
        },
      );

      socket.on(
        "typing:start",
        (data: {
          conversationId: string;
          userId: string;
          userName: string;
        }) => {
          this.io
            .to(`conversation:${data.conversationId}`)
            .emit("typing:indicator", {
              userId: data.userId,
              userName: data.userName,
              typing: true,
            });
        },
      );

      socket.on(
        "typing:stop",
        (data: { conversationId: string; userId: string }) => {
          this.io
            .to(`conversation:${data.conversationId}`)
            .emit("typing:indicator", {
              userId: data.userId,
              typing: false,
            });
        },
      );

      // Activity Feed Events
      socket.on(
        "activity:notify",
        (data: { userId: string; type: string; content: any }) => {
          const socketId = this.userSockets.get(data.userId);
          if (socketId) {
            this.io.to(socketId).emit("activity:new", {
              type: data.type,
              content: data.content,
              timestamp: new Date().toISOString(),
            });
          }
        },
      );

      // Live Class Events
      socket.on(
        "class:join",
        (data: { classId: string; userId: string; userName: string }) => {
          socket.join(`class:${data.classId}`);

          this.io.to(`class:${data.classId}`).emit("class:participant:joined", {
            userId: data.userId,
            userName: data.userName,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "class:attendance",
        (data: { classId: string; userId: string; status: string }) => {
          this.io.to(`class:${data.classId}`).emit("attendance:updated", {
            userId: data.userId,
            status: data.status,
            timestamp: new Date().toISOString(),
          });
        },
      );

      socket.on(
        "class:participation",
        (data: {
          classId: string;
          userId: string;
          userName: string;
          action: string;
        }) => {
          this.io.to(`class:${data.classId}`).emit("participation:recorded", {
            userId: data.userId,
            userName: data.userName,
            action: data.action,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Poll/Quiz Events
      socket.on(
        "class:poll:response",
        (data: { classId: string; userId: string; answer: string }) => {
          this.io.to(`class:${data.classId}`).emit("poll:response:received", {
            userId: data.userId,
            answer: data.answer,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Study Group Events
      socket.on(
        "group:message",
        (data: {
          groupId: string;
          userId: string;
          userName: string;
          text: string;
        }) => {
          socket.join(`group:${data.groupId}`);

          this.io.to(`group:${data.groupId}`).emit("group:message:received", {
            userId: data.userId,
            userName: data.userName,
            text: data.text,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Error handling
      socket.on("error", (error: any) => {
        console.error(`Socket error: ${error}`);
        socket.emit("error:notification", {
          message: "An error occurred",
          timestamp: new Date().toISOString(),
        });
      });
    });
  }

  // Utility methods
  public broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(`conference:${roomId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public getRoomParticipants(roomId: string): string[] {
    return Array.from(this.roomParticipants.get(roomId) || []);
  }

  public getConnectedUsers(): number {
    return this.io.engine.clientsCount;
  }
}

export { WebSocketHandler };
