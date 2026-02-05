import { Router, Request, Response } from "express";
import { videoConferencingService } from "../services/videoConferencingService";
import { screenSharingService } from "../services/screenSharingService";
import { whiteboardService } from "../services/whiteboardService";
import { liveClassService } from "../services/liveClassService";

const router = Router();

// Video Conferencing Routes

router.post("/conferences", (req: Request, res: Response) => {
  try {
    const { instructorId, instructorName, maxParticipants, settings } =
      req.body;
    const room = videoConferencingService.createRoom(
      instructorId,
      instructorName,
      maxParticipants,
      settings,
    );
    res.status(201).json({ success: true, room });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/conferences/:roomId/join", (req: Request, res: Response) => {
  try {
    const { userId, userName, password } = req.body;
    videoConferencingService.joinConference(
      req.params.roomId,
      userId,
      userName,
      password,
    );
    res.json({ success: true, message: "Joined conference" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/conferences/:roomId/leave", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    videoConferencingService.leaveConference(req.params.roomId, userId);
    res.json({ success: true, message: "Left conference" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/conferences/:roomId/audio/toggle",
  (req: Request, res: Response) => {
    try {
      const { userId, enabled } = req.body;
      videoConferencingService.toggleAudio(req.params.roomId, userId, enabled);
      res.json({
        success: true,
        message: `Audio ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/conferences/:roomId/video/toggle",
  (req: Request, res: Response) => {
    try {
      const { userId, enabled } = req.body;
      videoConferencingService.toggleVideo(req.params.roomId, userId, enabled);
      res.json({
        success: true,
        message: `Video ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/conferences/:roomId/recording/start",
  (req: Request, res: Response) => {
    try {
      const { initiatorId } = req.body;
      videoConferencingService.startRecording(req.params.roomId, initiatorId);
      res.json({ success: true, message: "Recording started" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/conferences/:roomId/recording/stop",
  (req: Request, res: Response) => {
    try {
      const { initiatorId } = req.body;
      const recording = videoConferencingService.stopRecording(
        req.params.roomId,
        initiatorId,
      );
      res.json({ success: true, recording });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/conferences/:roomId/chat", (req: Request, res: Response) => {
  try {
    const { userId, userName, message } = req.body;
    videoConferencingService.sendChatMessage(
      req.params.roomId,
      userId,
      userName,
      message,
    );
    res.json({ success: true, message: "Chat message sent" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/conferences/:roomId", (req: Request, res: Response) => {
  try {
    const room = videoConferencingService.getActiveRoom(req.params.roomId);
    res.json(room);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get(
  "/conferences/:roomId/participants",
  (req: Request, res: Response) => {
    try {
      const participants = videoConferencingService.getActiveParticipants(
        req.params.roomId,
      );
      res.json({ participants });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.get("/conferences/:roomId/statistics", (req: Request, res: Response) => {
  try {
    const stats = videoConferencingService.getRoomStatistics(req.params.roomId);
    res.json(stats);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/conferences/:roomId/end", (req: Request, res: Response) => {
  try {
    const { instructorId } = req.body;
    videoConferencingService.endConference(req.params.roomId, instructorId);
    res.json({ success: true, message: "Conference ended" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Screen Sharing Routes

router.post("/screen-share/start", (req: Request, res: Response) => {
  try {
    const { userId, userName, quality } = req.body;
    const share = screenSharingService.startScreenShare(
      userId,
      userName,
      quality,
    );
    res.status(201).json({ success: true, share });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/screen-share/:shareId/stop", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const metrics = screenSharingService.stopScreenShare(
      req.params.shareId,
      userId,
    );
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/screen-share/:shareId/annotation",
  (req: Request, res: Response) => {
    try {
      const { userId, shapeType, color, coordinates } = req.body;
      screenSharingService.addAnnotation(
        req.params.shareId,
        userId,
        shapeType,
        color,
        coordinates,
      );
      res.json({ success: true, message: "Annotation added" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/screen-share/:shareId/annotations",
  (req: Request, res: Response) => {
    try {
      const annotations = screenSharingService.getAnnotations(
        req.params.shareId,
      );
      res.json({ annotations });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post(
  "/screen-share/:shareId/permission",
  (req: Request, res: Response) => {
    try {
      const { granteeId, permission } = req.body;
      screenSharingService.grantScreenPermission(
        req.params.shareId,
        granteeId,
        permission,
      );
      res.json({ success: true, message: "Permission granted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Whiteboard Routes

router.post("/whiteboards", (req: Request, res: Response) => {
  try {
    const { userId, userName, width, height } = req.body;
    const whiteboard = whiteboardService.createWhiteboard(
      userId,
      userName,
      width,
      height,
    );
    res.status(201).json({ success: true, whiteboard });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/whiteboards/:boardId/draw", (req: Request, res: Response) => {
  try {
    const { userId, shapeType, color, coordinates } = req.body;
    whiteboardService.draw(
      req.params.boardId,
      userId,
      shapeType,
      color,
      coordinates,
    );
    res.json({ success: true, message: "Drawing created" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/whiteboards/:boardId/undo", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    whiteboardService.undo(req.params.boardId, userId);
    res.json({ success: true, message: "Undone" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/whiteboards/:boardId/redo", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    whiteboardService.redo(req.params.boardId, userId);
    res.json({ success: true, message: "Redone" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/whiteboards/:boardId/comment", (req: Request, res: Response) => {
  try {
    const { userId, userName, text, x, y } = req.body;
    whiteboardService.addComment(
      req.params.boardId,
      userId,
      userName,
      text,
      x,
      y,
    );
    res.json({ success: true, message: "Comment added" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/whiteboards/:boardId/snapshot", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const snapshot = whiteboardService.createSnapshot(
      req.params.boardId,
      userId,
    );
    res.status(201).json({ success: true, snapshot });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/whiteboards/:boardId", (req: Request, res: Response) => {
  try {
    const session = whiteboardService.getWhiteboard(req.params.boardId);
    res.json(session);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Live Class Routes

router.post("/live-classes", (req: Request, res: Response) => {
  try {
    const {
      instructorId,
      instructorName,
      courseId,
      courseName,
      capacity,
      scheduledDate,
    } = req.body;
    const liveClass = liveClassService.createLiveClass(
      instructorId,
      instructorName,
      courseId,
      courseName,
      capacity,
      new Date(scheduledDate),
    );
    res.status(201).json({ success: true, liveClass });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/live-classes/:classId/enroll", (req: Request, res: Response) => {
  try {
    const { studentId, studentName } = req.body;
    liveClassService.enrollStudent(req.params.classId, studentId, studentName);
    res.json({ success: true, message: "Enrolled in class" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/live-classes/:classId/start", (req: Request, res: Response) => {
  try {
    const { instructorId } = req.body;
    liveClassService.startClass(req.params.classId, instructorId);
    res.json({ success: true, message: "Class started" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/live-classes/:classId/attendance",
  (req: Request, res: Response) => {
    try {
      const { studentId } = req.body;
      liveClassService.recordAttendance(req.params.classId, studentId);
      res.json({ success: true, message: "Attendance recorded" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/live-classes/:classId/participation",
  (req: Request, res: Response) => {
    try {
      const { studentId, questionsAsked, answersGiven, level } = req.body;
      liveClassService.updateParticipation(
        req.params.classId,
        studentId,
        questionsAsked,
        answersGiven,
        level,
      );
      res.json({ success: true, message: "Participation updated" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/live-classes/:classId/assignment",
  (req: Request, res: Response) => {
    try {
      const { title, description, dueDate, points } = req.body;
      liveClassService.createAssignment(
        req.params.classId,
        title,
        description,
        new Date(dueDate),
        points,
      );
      res.status(201).json({ success: true, message: "Assignment created" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/live-classes/:classId/submit-assignment",
  (req: Request, res: Response) => {
    try {
      const { studentId, assignmentId, submission } = req.body;
      liveClassService.submitAssignment(
        req.params.classId,
        studentId,
        assignmentId,
        submission,
      );
      res.json({ success: true, message: "Assignment submitted" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/live-classes/:classId/grade", (req: Request, res: Response) => {
  try {
    const { submissionId, score, feedback } = req.body;
    liveClassService.gradeSubmission(
      req.params.classId,
      submissionId,
      score,
      feedback,
    );
    res.json({ success: true, message: "Submission graded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/live-classes/:classId", (req: Request, res: Response) => {
  try {
    const liveClass = liveClassService.getLiveClass(req.params.classId);
    res.json(liveClass);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get(
  "/live-classes/:classId/analytics",
  (req: Request, res: Response) => {
    try {
      const analytics = liveClassService.getClassAnalytics(req.params.classId);
      res.json(analytics);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post("/live-classes/:classId/end", (req: Request, res: Response) => {
  try {
    const { instructorId } = req.body;
    liveClassService.endClass(req.params.classId, instructorId);
    res.json({ success: true, message: "Class ended" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
