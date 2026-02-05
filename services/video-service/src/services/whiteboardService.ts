import { EventEmitter } from "events";

export interface WhiteboardSession {
  whiteboardId: string;
  roomId: string;
  createdBy: string;
  createdDate: Date;
  isActive: boolean;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  collaborators: string[];
  undoStack: DrawAction[];
  redoStack: DrawAction[];
  drawings: Drawing[];
}

export interface Drawing {
  drawingId: string;
  whiteboardId: string;
  userId: string;
  type:
    | "line"
    | "rectangle"
    | "circle"
    | "ellipse"
    | "polygon"
    | "text"
    | "image";
  color: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  rotation: number;
  coordinates: Array<{ x: number; y: number }>;
  properties?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    imageUrl?: string;
  };
  createdDate: Date;
  lastModified: Date;
  isVisible: boolean;
}

export interface DrawAction {
  actionId: string;
  whiteboardId: string;
  userId: string;
  action: "draw" | "erase" | "move" | "resize" | "delete" | "modify";
  drawing: Drawing;
  timestamp: Date;
}

export interface WhiteboardComment {
  commentId: string;
  whiteboardId: string;
  userId: string;
  username: string;
  text: string;
  position: { x: number; y: number };
  createdDate: Date;
  replies: WhiteboardComment[];
}

export interface WhiteboardSnapshot {
  snapshotId: string;
  whiteboardId: string;
  timestamp: Date;
  thumbnailUrl: string;
  createdBy: string;
  description?: string;
}

export class WhiteboardService extends EventEmitter {
  private whiteboards: Map<string, WhiteboardSession> = new Map();
  private comments: Map<string, WhiteboardComment[]> = new Map();
  private snapshots: Map<string, WhiteboardSnapshot[]> = new Map();
  private cursorPositions: Map<
    string,
    { userId: string; x: number; y: number }
  > = new Map();
  private selectionStates: Map<string, Set<string>> = new Map(); // whiteboardId -> drawingIds

  constructor() {
    super();
  }

  // Create whiteboard
  createWhiteboard(
    roomId: string,
    createdBy: string,
    width: number = 1920,
    height: number = 1080,
  ): WhiteboardSession {
    const whiteboardId = `whiteboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const whiteboard: WhiteboardSession = {
      whiteboardId,
      roomId,
      createdBy,
      createdDate: new Date(),
      isActive: true,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor: "#FFFFFF",
      collaborators: [createdBy],
      undoStack: [],
      redoStack: [],
      drawings: [],
    };

    this.whiteboards.set(whiteboardId, whiteboard);
    this.comments.set(whiteboardId, []);
    this.snapshots.set(whiteboardId, []);
    this.selectionStates.set(whiteboardId, new Set());

    this.emit("whiteboard:created", {
      whiteboardId,
      roomId,
      width,
      height,
    });

    return whiteboard;
  }

  // Draw shape
  draw(
    whiteboardId: string,
    userId: string,
    type: Drawing["type"],
    color: string,
    coordinates: Array<{ x: number; y: number }>,
    strokeWidth: number = 2,
    properties?: Drawing["properties"],
  ): Drawing {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) {
      throw new Error("Whiteboard not found");
    }

    const drawingId = `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const drawing: Drawing = {
      drawingId,
      whiteboardId,
      userId,
      type,
      color,
      strokeWidth,
      opacity: 1,
      rotation: 0,
      coordinates,
      properties,
      createdDate: new Date(),
      lastModified: new Date(),
      isVisible: true,
    };

    whiteboard.drawings.push(drawing);

    // Record action for undo/redo
    const action: DrawAction = {
      actionId: `action_${Date.now()}`,
      whiteboardId,
      userId,
      action: "draw",
      drawing,
      timestamp: new Date(),
    };

    whiteboard.undoStack.push(action);
    whiteboard.redoStack = []; // Clear redo on new action

    this.emit("drawing:created", {
      drawingId,
      whiteboardId,
      type,
      color,
      pointCount: coordinates.length,
    });

    return drawing;
  }

  // Erase drawing
  erase(
    whiteboardId: string,
    userId: string,
    x: number,
    y: number,
    radius: number = 10,
  ): number {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) {
      throw new Error("Whiteboard not found");
    }

    let erasedCount = 0;

    for (const drawing of whiteboard.drawings) {
      for (const coord of drawing.coordinates) {
        const distance = Math.sqrt(
          Math.pow(coord.x - x, 2) + Math.pow(coord.y - y, 2),
        );

        if (distance <= radius) {
          drawing.isVisible = false;
          erasedCount++;

          const action: DrawAction = {
            actionId: `action_${Date.now()}`,
            whiteboardId,
            userId,
            action: "erase",
            drawing,
            timestamp: new Date(),
          };

          whiteboard.undoStack.push(action);
          whiteboard.redoStack = [];

          break;
        }
      }
    }

    this.emit("drawing:erased", {
      whiteboardId,
      erasedCount,
      x,
      y,
      radius,
    });

    return erasedCount;
  }

  // Move drawing
  moveDrawing(
    whiteboardId: string,
    drawingId: string,
    deltaX: number,
    deltaY: number,
  ): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) return;

    const drawing = whiteboard.drawings.find((d) => d.drawingId === drawingId);
    if (!drawing) return;

    for (const coord of drawing.coordinates) {
      coord.x += deltaX;
      coord.y += deltaY;
    }

    drawing.lastModified = new Date();

    this.emit("drawing:moved", {
      drawingId,
      deltaX,
      deltaY,
    });
  }

  // Resize drawing
  resizeDrawing(
    whiteboardId: string,
    drawingId: string,
    scaleX: number,
    scaleY: number,
  ): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) return;

    const drawing = whiteboard.drawings.find((d) => d.drawingId === drawingId);
    if (!drawing) return;

    for (const coord of drawing.coordinates) {
      coord.x *= scaleX;
      coord.y *= scaleY;
    }

    drawing.lastModified = new Date();

    this.emit("drawing:resized", {
      drawingId,
      scaleX,
      scaleY,
    });
  }

  // Undo
  undo(whiteboardId: string): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard || whiteboard.undoStack.length === 0) return;

    const action = whiteboard.undoStack.pop()!;
    whiteboard.redoStack.push(action);

    // Reverse the action
    if (action.action === "draw") {
      action.drawing.isVisible = false;
    } else if (action.action === "delete") {
      action.drawing.isVisible = true;
    }

    this.emit("drawing:undone", {
      whiteboardId,
      actionType: action.action,
    });
  }

  // Redo
  redo(whiteboardId: string): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard || whiteboard.redoStack.length === 0) return;

    const action = whiteboard.redoStack.pop()!;
    whiteboard.undoStack.push(action);

    // Reapply the action
    if (action.action === "draw") {
      action.drawing.isVisible = true;
    } else if (action.action === "delete") {
      action.drawing.isVisible = false;
    }

    this.emit("drawing:redone", {
      whiteboardId,
      actionType: action.action,
    });
  }

  // Update cursor position
  updateCursorPosition(
    whiteboardId: string,
    userId: string,
    x: number,
    y: number,
  ): void {
    this.cursorPositions.set(`${whiteboardId}_${userId}`, {
      userId,
      x,
      y,
    });

    this.emit("cursor:updated", {
      whiteboardId,
      userId,
      x,
      y,
    });
  }

  // Add comment
  addComment(
    whiteboardId: string,
    userId: string,
    username: string,
    text: string,
    x: number,
    y: number,
  ): WhiteboardComment {
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const comment: WhiteboardComment = {
      commentId,
      whiteboardId,
      userId,
      username,
      text,
      position: { x, y },
      createdDate: new Date(),
      replies: [],
    };

    this.comments.get(whiteboardId)?.push(comment);

    this.emit("comment:added", {
      commentId,
      whiteboardId,
      username,
      text,
    });

    return comment;
  }

  // Reply to comment
  replyToComment(
    whiteboardId: string,
    commentId: string,
    userId: string,
    username: string,
    text: string,
  ): void {
    const comments = this.comments.get(whiteboardId);
    if (!comments) return;

    const comment = comments.find((c) => c.commentId === commentId);
    if (!comment) return;

    const reply: WhiteboardComment = {
      commentId: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      whiteboardId,
      userId,
      username,
      text,
      position: comment.position,
      createdDate: new Date(),
      replies: [],
    };

    comment.replies.push(reply);

    this.emit("comment:replied", {
      commentId,
      repliedBy: username,
      replyText: text,
    });
  }

  // Create snapshot
  createSnapshot(
    whiteboardId: string,
    createdBy: string,
    thumbnailUrl: string,
    description?: string,
  ): WhiteboardSnapshot {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const snapshot: WhiteboardSnapshot = {
      snapshotId,
      whiteboardId,
      timestamp: new Date(),
      thumbnailUrl,
      createdBy,
      description,
    };

    this.snapshots.get(whiteboardId)?.push(snapshot);

    this.emit("snapshot:created", {
      snapshotId,
      whiteboardId,
      createdBy,
    });

    return snapshot;
  }

  // Get snapshots
  getSnapshots(whiteboardId: string): WhiteboardSnapshot[] {
    return this.snapshots.get(whiteboardId) || [];
  }

  // Get whiteboard
  getWhiteboard(whiteboardId: string): WhiteboardSession | undefined {
    return this.whiteboards.get(whiteboardId);
  }

  // Get comments
  getComments(whiteboardId: string): WhiteboardComment[] {
    return this.comments.get(whiteboardId) || [];
  }

  // Add collaborator
  addCollaborator(whiteboardId: string, userId: string): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) return;

    if (!whiteboard.collaborators.includes(userId)) {
      whiteboard.collaborators.push(userId);

      this.emit("collaborator:added", {
        whiteboardId,
        userId,
        totalCollaborators: whiteboard.collaborators.length,
      });
    }
  }

  // Remove collaborator
  removeCollaborator(whiteboardId: string, userId: string): void {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) return;

    const index = whiteboard.collaborators.indexOf(userId);
    if (index > -1) {
      whiteboard.collaborators.splice(index, 1);

      this.emit("collaborator:removed", {
        whiteboardId,
        userId,
        totalCollaborators: whiteboard.collaborators.length,
      });
    }
  }

  // Close whiteboard
  closeWhiteboard(whiteboardId: string): {
    totalDrawings: number;
    totalComments: number;
  } {
    const whiteboard = this.whiteboards.get(whiteboardId);
    if (!whiteboard) {
      throw new Error("Whiteboard not found");
    }

    whiteboard.isActive = false;
    const comments = this.comments.get(whiteboardId) || [];

    this.emit("whiteboard:closed", {
      whiteboardId,
      totalDrawings: whiteboard.drawings.length,
      totalComments: comments.length,
    });

    return {
      totalDrawings: whiteboard.drawings.length,
      totalComments: comments.length,
    };
  }
}

export const whiteboardService = new WhiteboardService();

export default WhiteboardService;
