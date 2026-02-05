import { EventEmitter } from "events";

export interface ScreenShare {
  shareId: string;
  roomId: string;
  participantId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  screenType: "desktop" | "window" | "tab";
  resolution: string;
  frameRate: number;
  bitrate: number;
  quality: "low" | "medium" | "high" | "ultra";
  viewers: string[];
  isRecording: boolean;
}

export interface ScreenAnnotation {
  annotationId: string;
  shareId: string;
  userId: string;
  type: "arrow" | "circle" | "rectangle" | "freehand" | "text";
  color: string;
  coordinates: Array<{ x: number; y: number }>;
  timestamp: Date;
  duration?: number;
}

export interface ScreenPermission {
  permissionId: string;
  participantId: string;
  canViewScreen: boolean;
  canDrawAnnotations: boolean;
  canControlRemote: boolean;
  canPauseScreen: boolean;
  grantedAt: Date;
  expireAt?: Date;
}

export class ScreenSharingService extends EventEmitter {
  private screenShares: Map<string, ScreenShare> = new Map();
  private annotations: Map<string, ScreenAnnotation[]> = new Map();
  private permissions: Map<string, ScreenPermission> = new Map();
  private cursorPositions: Map<string, { x: number; y: number }> = new Map();
  private screenRecordings: Map<
    string,
    { recordingId: string; frameCount: number }
  > = new Map();

  constructor() {
    super();
  }

  // Start screen share
  startScreenShare(
    roomId: string,
    participantId: string,
    userId: string,
    screenType: "desktop" | "window" | "tab" = "desktop",
    quality: "low" | "medium" | "high" | "ultra" = "high",
  ): ScreenShare {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const qualitySettings: Record<
      string,
      { resolution: string; frameRate: number; bitrate: number }
    > = {
      low: { resolution: "720p", frameRate: 15, bitrate: 1000 },
      medium: { resolution: "1080p", frameRate: 30, bitrate: 2500 },
      high: { resolution: "1440p", frameRate: 30, bitrate: 5000 },
      ultra: { resolution: "4k", frameRate: 60, bitrate: 10000 },
    };

    const settings = qualitySettings[quality];

    const screenShare: ScreenShare = {
      shareId,
      roomId,
      participantId,
      userId,
      startTime: new Date(),
      isActive: true,
      screenType,
      resolution: settings.resolution,
      frameRate: settings.frameRate,
      bitrate: settings.bitrate,
      quality,
      viewers: [],
      isRecording: false,
    };

    this.screenShares.set(shareId, screenShare);
    this.annotations.set(shareId, []);

    this.emit("screen:share-started", {
      shareId,
      roomId,
      participantId,
      screenType,
      quality,
    });

    return screenShare;
  }

  // Stop screen share
  stopScreenShare(shareId: string): {
    duration: number;
    framesCaptured: number;
  } {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) {
      throw new Error("Screen share not found");
    }

    screenShare.isActive = false;
    screenShare.endTime = new Date();

    const duration = Math.floor(
      (screenShare.endTime.getTime() - screenShare.startTime.getTime()) / 1000,
    );

    const framesCaptured = duration * screenShare.frameRate;

    this.emit("screen:share-stopped", {
      shareId,
      duration,
      framesCaptured,
      viewers: screenShare.viewers.length,
    });

    return { duration, framesCaptured };
  }

  // Update cursor position (for remote cursor display)
  updateCursorPosition(shareId: string, x: number, y: number): void {
    this.cursorPositions.set(shareId, { x, y });

    this.emit("cursor:position-updated", {
      shareId,
      x,
      y,
    });
  }

  // Get cursor position
  getCursorPosition(shareId: string): { x: number; y: number } | undefined {
    return this.cursorPositions.get(shareId);
  }

  // Add annotation
  addAnnotation(
    shareId: string,
    userId: string,
    type: ScreenAnnotation["type"],
    color: string,
    coordinates: Array<{ x: number; y: number }>,
  ): ScreenAnnotation {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) {
      throw new Error("Screen share not found");
    }

    const annotationId = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const annotation: ScreenAnnotation = {
      annotationId,
      shareId,
      userId,
      type,
      color,
      coordinates,
      timestamp: new Date(),
    };

    this.annotations.get(shareId)?.push(annotation);

    this.emit("annotation:added", {
      annotationId,
      shareId,
      type,
      color,
      pointCount: coordinates.length,
    });

    return annotation;
  }

  // Get annotations
  getAnnotations(shareId: string): ScreenAnnotation[] {
    return this.annotations.get(shareId) || [];
  }

  // Clear annotations
  clearAnnotations(shareId: string): void {
    this.annotations.set(shareId, []);

    this.emit("annotations:cleared", {
      shareId,
    });
  }

  // Grant screen sharing permission
  grantScreenPermission(
    participantId: string,
    canViewScreen: boolean = true,
    canDrawAnnotations: boolean = false,
    canControlRemote: boolean = false,
    canPauseScreen: boolean = false,
    expirationMinutes?: number,
  ): ScreenPermission {
    const permissionId = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const permission: ScreenPermission = {
      permissionId,
      participantId,
      canViewScreen,
      canDrawAnnotations,
      canControlRemote,
      canPauseScreen,
      grantedAt: new Date(),
      expireAt: expirationMinutes
        ? new Date(Date.now() + expirationMinutes * 60 * 1000)
        : undefined,
    };

    this.permissions.set(permissionId, permission);

    this.emit("permission:granted", {
      permissionId,
      participantId,
      capabilities: {
        canViewScreen,
        canDrawAnnotations,
        canControlRemote,
        canPauseScreen,
      },
    });

    return permission;
  }

  // Revoke permission
  revokeScreenPermission(permissionId: string): void {
    this.permissions.delete(permissionId);

    this.emit("permission:revoked", {
      permissionId,
    });
  }

  // Check permission
  checkPermission(permissionId: string): ScreenPermission | undefined {
    const permission = this.permissions.get(permissionId);

    if (permission?.expireAt && permission.expireAt < new Date()) {
      this.permissions.delete(permissionId);
      return undefined;
    }

    return permission;
  }

  // Add viewer to screen share
  addViewer(shareId: string, participantId: string): void {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) return;

    if (!screenShare.viewers.includes(participantId)) {
      screenShare.viewers.push(participantId);

      this.emit("viewer:added", {
        shareId,
        participantId,
        totalViewers: screenShare.viewers.length,
      });
    }
  }

  // Remove viewer from screen share
  removeViewer(shareId: string, participantId: string): void {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) return;

    const index = screenShare.viewers.indexOf(participantId);
    if (index > -1) {
      screenShare.viewers.splice(index, 1);

      this.emit("viewer:removed", {
        shareId,
        participantId,
        totalViewers: screenShare.viewers.length,
      });
    }
  }

  // Adjust quality
  adjustQuality(
    shareId: string,
    quality: "low" | "medium" | "high" | "ultra",
  ): void {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) return;

    const qualitySettings: Record<
      string,
      { resolution: string; frameRate: number; bitrate: number }
    > = {
      low: { resolution: "720p", frameRate: 15, bitrate: 1000 },
      medium: { resolution: "1080p", frameRate: 30, bitrate: 2500 },
      high: { resolution: "1440p", frameRate: 30, bitrate: 5000 },
      ultra: { resolution: "4k", frameRate: 60, bitrate: 10000 },
    };

    const settings = qualitySettings[quality];
    screenShare.quality = quality;
    screenShare.resolution = settings.resolution;
    screenShare.frameRate = settings.frameRate;
    screenShare.bitrate = settings.bitrate;

    this.emit("quality:adjusted", {
      shareId,
      quality,
      resolution: settings.resolution,
      bitrate: settings.bitrate,
    });
  }

  // Start recording screen share
  recordScreenShare(shareId: string): { recordingId: string } {
    const screenShare = this.screenShares.get(shareId);
    if (!screenShare) {
      throw new Error("Screen share not found");
    }

    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    screenShare.isRecording = true;
    this.screenRecordings.set(recordingId, {
      recordingId,
      frameCount: 0,
    });

    this.emit("recording:started", {
      recordingId,
      shareId,
    });

    return { recordingId };
  }

  // Stop recording screen share
  stopRecordingScreenShare(recordingId: string): {
    duration: number;
    fileSize: number;
  } {
    const recording = this.screenRecordings.get(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    const duration = recording.frameCount / 30; // Assume 30fps
    const fileSize = Math.floor(Math.random() * 1000000000) + 10000000; // 10MB - 1GB

    this.screenRecordings.delete(recordingId);

    this.emit("recording:stopped", {
      recordingId,
      duration,
      fileSize,
    });

    return { duration, fileSize };
  }

  // Get screen share
  getScreenShare(shareId: string): ScreenShare | undefined {
    return this.screenShares.get(shareId);
  }

  // Get active screen shares
  getActiveScreenShares(roomId?: string): ScreenShare[] {
    const allShares = Array.from(this.screenShares.values()).filter(
      (s) => s.isActive,
    );

    if (roomId) {
      return allShares.filter((s) => s.roomId === roomId);
    }

    return allShares;
  }
}

export const screenSharingService = new ScreenSharingService();

export default ScreenSharingService;
