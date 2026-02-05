import { EventEmitter } from "events";

export interface ConferenceRoom {
  roomId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdDate: Date;
  maxParticipants: number;
  participants: ConferenceParticipant[];
  status: "idle" | "active" | "recording" | "ended";
  recordingId?: string;
  startTime?: Date;
  endTime?: Date;
  duration: number; // seconds
  settings: {
    allowScreenShare: boolean;
    allowRecording: boolean;
    allowWhiteboard: boolean;
    muteOnEntry: boolean;
    requirePassword: boolean;
    password?: string;
    allowChatting: boolean;
  };
}

export interface ConferenceParticipant {
  participantId: string;
  userId: string;
  username: string;
  email: string;
  joinTime: Date;
  leaveTime?: Date;
  status: "joined" | "left" | "idle" | "away";
  role: "host" | "participant";
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  bandwidth: number; // kbps
  videoResolution?: string;
}

export interface Recording {
  recordingId: string;
  roomId: string;
  createdBy: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  fileSize: number; // bytes
  url: string;
  format: "mp4" | "webm" | "mkv";
  quality: "720p" | "1080p" | "2k" | "4k";
  hasAudio: boolean;
  hasVideo: boolean;
  transcript?: string;
  accessLevel: "private" | "shared" | "public";
  viewers: string[];
  downloadCount: number;
}

export class VideoConferencingService extends EventEmitter {
  private rooms: Map<string, ConferenceRoom> = new Map();
  private recordings: Map<string, Recording> = new Map();
  private activeRooms: Set<string> = new Set();
  private participantConnections: Map<string, Set<string>> = new Map(); // roomId -> participantIds
  private chatMessages: Map<
    string,
    Array<{ userId: string; message: string; timestamp: Date }>
  > = new Map();

  constructor() {
    super();
  }

  // Create conference room
  createRoom(
    name: string,
    createdBy: string,
    maxParticipants: number = 100,
    settings?: Partial<ConferenceRoom["settings"]>,
  ): ConferenceRoom {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const room: ConferenceRoom = {
      roomId,
      name,
      createdBy,
      createdDate: new Date(),
      maxParticipants,
      participants: [],
      status: "idle",
      duration: 0,
      settings: {
        allowScreenShare: true,
        allowRecording: true,
        allowWhiteboard: true,
        muteOnEntry: false,
        requirePassword: false,
        allowChatting: true,
        ...settings,
      },
    };

    this.rooms.set(roomId, room);
    this.participantConnections.set(roomId, new Set());
    this.chatMessages.set(roomId, []);

    this.emit("room:created", {
      roomId,
      name,
      createdBy,
      maxParticipants,
    });

    return room;
  }

  // Join conference
  joinConference(
    roomId: string,
    userId: string,
    username: string,
    email: string,
    password?: string,
    role: "host" | "participant" = "participant",
  ): {
    success: boolean;
    room?: ConferenceRoom;
    participant?: ConferenceParticipant;
    message?: string;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (room.settings.requirePassword && room.settings.password !== password) {
      return { success: false, message: "Invalid password" };
    }

    if (room.participants.length >= room.maxParticipants) {
      return { success: false, message: "Room is full" };
    }

    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const participant: ConferenceParticipant = {
      participantId,
      userId,
      username,
      email,
      joinTime: new Date(),
      status: "joined",
      role,
      audioEnabled: !room.settings.muteOnEntry,
      videoEnabled: true,
      isScreenSharing: false,
      isMuted: room.settings.muteOnEntry,
      connectionQuality: "good",
      bandwidth: 5000,
    };

    room.participants.push(participant);
    this.participantConnections.get(roomId)!.add(participantId);

    if (room.status === "idle" && room.participants.length > 0) {
      room.status = "active";
      room.startTime = new Date();
      this.activeRooms.add(roomId);

      this.emit("room:started", {
        roomId,
        name: room.name,
        startTime: room.startTime,
      });
    }

    this.emit("participant:joined", {
      roomId,
      participantId,
      username,
      role,
      totalParticipants: room.participants.length,
    });

    return { success: true, room, participant };
  }

  // Leave conference
  leaveConference(roomId: string, participantId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find(
      (p) => p.participantId === participantId,
    );
    if (!participant) return;

    participant.status = "left";
    participant.leaveTime = new Date();

    this.participantConnections.get(roomId)?.delete(participantId);

    this.emit("participant:left", {
      roomId,
      participantId,
      username: participant.username,
      duration: Math.floor(
        (participant.leaveTime.getTime() - participant.joinTime.getTime()) /
          1000,
      ),
      totalParticipants: room.participants.filter((p) => p.status === "joined")
        .length,
    });

    // End room if no more participants
    if (!room.participants.some((p) => p.status === "joined")) {
      this.endConference(roomId);
    }
  }

  // Mute/unmute participant
  toggleAudio(roomId: string, participantId: string, enable: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find(
      (p) => p.participantId === participantId,
    );
    if (!participant) return;

    participant.audioEnabled = enable;
    participant.isMuted = !enable;

    this.emit("audio:toggled", {
      roomId,
      participantId,
      enabled: enable,
    });
  }

  // Enable/disable video
  toggleVideo(roomId: string, participantId: string, enable: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find(
      (p) => p.participantId === participantId,
    );
    if (!participant) return;

    participant.videoEnabled = enable;

    this.emit("video:toggled", {
      roomId,
      participantId,
      enabled: enable,
    });
  }

  // Start recording
  startRecording(
    roomId: string,
    userId: string,
    quality: "720p" | "1080p" | "2k" | "4k" = "1080p",
  ): { recordingId: string; startTime: Date } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    room.recordingId = recordingId;
    room.status = "recording";

    this.emit("recording:started", {
      roomId,
      recordingId,
      quality,
      startTime: new Date(),
    });

    return { recordingId, startTime: new Date() };
  }

  // Stop recording
  stopRecording(roomId: string): Recording {
    const room = this.rooms.get(roomId);
    if (!room || !room.recordingId) {
      throw new Error("No recording in progress");
    }

    const startTime = room.startTime || new Date();
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    const recording: Recording = {
      recordingId: room.recordingId,
      roomId,
      createdBy: room.createdBy,
      startTime,
      endTime,
      duration,
      fileSize: Math.floor(Math.random() * 5000000000) + 1000000, // 1MB - 5GB
      url: `https://recordings.example.com/${room.recordingId}`,
      format: "mp4",
      quality: "1080p",
      hasAudio: true,
      hasVideo: true,
      accessLevel: "private",
      viewers: [],
      downloadCount: 0,
    };

    this.recordings.set(recording.recordingId, recording);
    room.status = "active";
    room.recordingId = undefined;

    this.emit("recording:stopped", {
      roomId,
      recordingId: recording.recordingId,
      duration,
      fileSize: recording.fileSize,
    });

    return recording;
  }

  // End conference
  endConference(roomId: string): {
    duration: number;
    participantCount: number;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    room.status = "ended";
    room.endTime = new Date();
    room.duration = Math.floor(
      (room.endTime.getTime() - (room.startTime?.getTime() || 0)) / 1000,
    );

    this.activeRooms.delete(roomId);

    this.emit("room:ended", {
      roomId,
      duration: room.duration,
      totalParticipants: room.participants.length,
      endTime: room.endTime,
    });

    return {
      duration: room.duration,
      participantCount: room.participants.length,
    };
  }

  // Send chat message
  sendChatMessage(roomId: string, userId: string, message: string): void {
    const messages = this.chatMessages.get(roomId);
    if (!messages) return;

    messages.push({
      userId,
      message,
      timestamp: new Date(),
    });

    this.emit("chat:message", {
      roomId,
      userId,
      message,
      timestamp: new Date(),
    });
  }

  // Get chat history
  getChatHistory(
    roomId: string,
    limit: number = 100,
  ): Array<{ userId: string; message: string; timestamp: Date }> {
    const messages = this.chatMessages.get(roomId) || [];
    return messages.slice(-limit);
  }

  // Update connection quality
  updateConnectionQuality(
    roomId: string,
    participantId: string,
    quality: "excellent" | "good" | "fair" | "poor",
    bandwidth: number,
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find(
      (p) => p.participantId === participantId,
    );
    if (!participant) return;

    participant.connectionQuality = quality;
    participant.bandwidth = bandwidth;

    this.emit("connection:quality-updated", {
      roomId,
      participantId,
      quality,
      bandwidth,
    });

    // Auto-adjust video if poor connection
    if (quality === "poor" && participant.videoEnabled) {
      participant.videoResolution = "360p";
    } else if (quality === "excellent") {
      participant.videoResolution = "1080p";
    }
  }

  // Get room
  getRoom(roomId: string): ConferenceRoom | undefined {
    return this.rooms.get(roomId);
  }

  // Get active participants
  getActiveParticipants(roomId: string): ConferenceParticipant[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return room.participants.filter((p) => p.status === "joined");
  }

  // Get recording
  getRecording(recordingId: string): Recording | undefined {
    return this.recordings.get(recordingId);
  }

  // Get recordings for room
  getRoomRecordings(roomId: string): Recording[] {
    return Array.from(this.recordings.values()).filter(
      (r) => r.roomId === roomId,
    );
  }

  // Get room statistics
  getRoomStatistics(roomId: string): {
    totalParticipants: number;
    activeParticipants: number;
    duration: number;
    recordings: number;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return {
        totalParticipants: 0,
        activeParticipants: 0,
        duration: 0,
        recordings: 0,
      };
    }

    const recordings = Array.from(this.recordings.values()).filter(
      (r) => r.roomId === roomId,
    ).length;

    return {
      totalParticipants: room.participants.length,
      activeParticipants: room.participants.filter((p) => p.status === "joined")
        .length,
      duration: room.duration,
      recordings,
    };
  }
}

export const videoConferencingService = new VideoConferencingService();

export default VideoConferencingService;
