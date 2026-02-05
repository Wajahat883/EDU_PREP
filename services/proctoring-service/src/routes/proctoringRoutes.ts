import { Router, Request, Response } from "express";
import { proctorService } from "../services/proctorService";
import { browserLockdownService } from "../services/browserLockdownService";
import { identityVerificationService } from "../services/identityVerificationService";
import { examSecurityService } from "../services/examSecurityService";

const router = Router();

// Proctor Routes

router.post("/proctor/sessions", (req: Request, res: Response) => {
  try {
    const { studentId, studentName, examId, examTitle, duration, startTime } =
      req.body;
    const session = proctorService.initiateProctoringSession(
      studentId,
      studentName,
      examId,
      examTitle,
      duration,
      new Date(startTime),
    );
    res.status(201).json({ success: true, session });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/proctor/sessions/:sessionId", (req: Request, res: Response) => {
  try {
    const session = proctorService.getProctoringSession(req.params.sessionId);
    res.json(session);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/proctor/sessions/:sessionId/analyze",
  (req: Request, res: Response) => {
    try {
      const { videoFeed, screenCapture } = req.body;
      const analysis = proctorService.analyzeStudentBehavior(
        req.params.sessionId,
        videoFeed,
        screenCapture,
      );
      res.json(analysis);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/proctor/sessions/:sessionId/flag-suspicious",
  (req: Request, res: Response) => {
    try {
      const { activityType, description, confidence, timestamp } = req.body;
      proctorService.flagSuspiciousActivity(
        req.params.sessionId,
        activityType,
        description,
        confidence,
        new Date(timestamp),
      );
      res.json({ success: true, message: "Activity flagged" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/proctor/sessions/:sessionId/flags",
  (req: Request, res: Response) => {
    try {
      const flags = proctorService.getSessionFlags(req.params.sessionId);
      res.json({ flags });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post(
  "/proctor/sessions/:sessionId/action",
  (req: Request, res: Response) => {
    try {
      const { action, reason } = req.body;
      proctorService.takeProctorAction(req.params.sessionId, action, reason);
      res.json({ success: true, message: "Action taken" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/proctor/sessions/:sessionId/end",
  (req: Request, res: Response) => {
    try {
      proctorService.endProctoringSession(req.params.sessionId);
      res.json({ success: true, message: "Session ended" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/proctor/sessions/:sessionId/report",
  (req: Request, res: Response) => {
    try {
      const report = proctorService.generateSessionReport(req.params.sessionId);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post("/proctor/monitor/face", (req: Request, res: Response) => {
  try {
    const { sessionId, faceData, timestamp } = req.body;
    const analysis = proctorService.analyzeFacePresence(
      sessionId,
      faceData,
      new Date(timestamp),
    );
    res.json(analysis);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/proctor/monitor/eye-gaze", (req: Request, res: Response) => {
  try {
    const { sessionId, gazeData, timestamp } = req.body;
    const analysis = proctorService.analyzeEyeGaze(
      sessionId,
      gazeData,
      new Date(timestamp),
    );
    res.json(analysis);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/proctor/monitor/audio", (req: Request, res: Response) => {
  try {
    const { sessionId, audioData, timestamp } = req.body;
    const analysis = proctorService.analyzeAudio(
      sessionId,
      audioData,
      new Date(timestamp),
    );
    res.json(analysis);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/proctor/review/:sessionId", (req: Request, res: Response) => {
  try {
    const { reviewerId, reviewerName, verdict, comments } = req.body;
    proctorService.submitProctorReview(
      req.params.sessionId,
      reviewerId,
      reviewerName,
      verdict,
      comments,
    );
    res.json({ success: true, message: "Review submitted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Browser Lockdown Routes

router.post("/browser-lock/enable", (req: Request, res: Response) => {
  try {
    const { sessionId, restrictions, allowedUrls } = req.body;
    browserLockdownService.enableBrowserLockdown(
      sessionId,
      restrictions,
      allowedUrls,
    );
    res.json({ success: true, message: "Browser lockdown enabled" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/browser-lock/disable", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    browserLockdownService.disableBrowserLockdown(sessionId);
    res.json({ success: true, message: "Browser lockdown disabled" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/browser-lock/monitor", (req: Request, res: Response) => {
  try {
    const { sessionId, keystrokeData, windowData, timestamp } = req.body;
    const monitoring = browserLockdownService.monitorBrowserActivity(
      sessionId,
      keystrokeData,
      windowData,
      new Date(timestamp),
    );
    res.json(monitoring);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/browser-lock/detect-breach", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const breachDetected =
      browserLockdownService.detectLockdownBreach(sessionId);
    res.json({ breachDetected });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/browser-lock/tab-switch", (req: Request, res: Response) => {
  try {
    const { sessionId, newTab, timestamp } = req.body;
    browserLockdownService.recordTabSwitch(
      sessionId,
      newTab,
      new Date(timestamp),
    );
    res.json({ success: true, message: "Tab switch recorded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get(
  "/browser-lock/sessions/:sessionId/breaches",
  (req: Request, res: Response) => {
    try {
      const breaches = browserLockdownService.getSessionBreaches(
        req.params.sessionId,
      );
      res.json({ breaches });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post(
  "/browser-lock/keystroke-pattern",
  (req: Request, res: Response) => {
    try {
      const { sessionId, keystrokeData } = req.body;
      const pattern = browserLockdownService.analyzeKeystrokePattern(
        sessionId,
        keystrokeData,
      );
      res.json(pattern);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Identity Verification Routes

router.post("/identity/verify", (req: Request, res: Response) => {
  try {
    const { studentId, studentName, verificationMethod } = req.body;
    const verification = identityVerificationService.initiateVerification(
      studentId,
      studentName,
      verificationMethod,
    );
    res.status(201).json({ success: true, verification });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get(
  "/identity/verify/:verificationId",
  (req: Request, res: Response) => {
    try {
      const verification = identityVerificationService.getVerification(
        req.params.verificationId,
      );
      res.json(verification);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post(
  "/identity/verify/:verificationId/facial",
  (req: Request, res: Response) => {
    try {
      const { biometricData } = req.body;
      identityVerificationService.processFacialRecognition(
        req.params.verificationId,
        biometricData,
      );
      res.json({ success: true, message: "Facial recognition processed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/identity/verify/:verificationId/fingerprint",
  (req: Request, res: Response) => {
    try {
      const { biometricData } = req.body;
      identityVerificationService.processFingerprintScan(
        req.params.verificationId,
        biometricData,
      );
      res.json({ success: true, message: "Fingerprint processed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/identity/verify/:verificationId/government-id",
  (req: Request, res: Response) => {
    try {
      const { idData } = req.body;
      identityVerificationService.verifyGovernmentID(
        req.params.verificationId,
        idData,
      );
      res.json({ success: true, message: "Government ID verified" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/identity/verify/:verificationId/liveness",
  (req: Request, res: Response) => {
    try {
      const { livenessData } = req.body;
      identityVerificationService.performLivenessCheck(
        req.params.verificationId,
        livenessData,
      );
      res.json({ success: true, message: "Liveness check performed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/identity/verify/:verificationId/complete",
  (req: Request, res: Response) => {
    try {
      const result = identityVerificationService.completeVerification(
        req.params.verificationId,
      );
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get("/identity/student/:studentId", (req: Request, res: Response) => {
  try {
    const status = identityVerificationService.getStudentVerificationStatus(
      req.params.studentId,
    );
    res.json(status);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/identity/methods", (req: Request, res: Response) => {
  try {
    const { studentId, method } = req.body;
    identityVerificationService.addVerificationMethod(studentId, method);
    res.json({ success: true, message: "Verification method added" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/identity/badge/:studentId", (req: Request, res: Response) => {
  try {
    const badge = identityVerificationService.getVerificationBadge(
      req.params.studentId,
    );
    res.json(badge);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Exam Security Routes

router.post("/exam-security/exams", (req: Request, res: Response) => {
  try {
    const { instructorId, instructorName, title, totalQuestions, duration } =
      req.body;
    const exam = examSecurityService.createSecureExam(
      instructorId,
      instructorName,
      title,
      totalQuestions,
      duration,
    );
    res.status(201).json({ success: true, exam });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/exam-security/exams/:examId/instance",
  (req: Request, res: Response) => {
    try {
      const { studentId, studentName, startTime } = req.body;
      const instance = examSecurityService.createExamInstance(
        req.params.examId,
        studentId,
        studentName,
        new Date(startTime),
      );
      res.status(201).json({ success: true, instance });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/exam-security/exams/:examId/instance/:instanceId",
  (req: Request, res: Response) => {
    try {
      const instance = examSecurityService.getExamInstance(
        req.params.examId,
        req.params.instanceId,
      );
      res.json(instance);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post(
  "/exam-security/exams/:examId/randomize",
  (req: Request, res: Response) => {
    try {
      examSecurityService.randomizeQuestionOrder(req.params.examId);
      res.json({ success: true, message: "Questions randomized" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/exam-security/exams/:examId/shuffle-answers",
  (req: Request, res: Response) => {
    try {
      examSecurityService.shuffleAnswerOptions(req.params.examId);
      res.json({ success: true, message: "Answer options shuffled" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/exam-security/instances/:instanceId/submit",
  (req: Request, res: Response) => {
    try {
      const { answers, timeSpent } = req.body;
      const submission = examSecurityService.submitExam(
        req.params.instanceId,
        answers,
        timeSpent,
      );
      res.json({ success: true, submission });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/exam-security/instances/:instanceId/detect-cheating",
  (req: Request, res: Response) => {
    try {
      const { answersPattern, timePatterns, behaviorFlags } = req.body;
      const detection = examSecurityService.detectCheatAttempts(
        req.params.instanceId,
        answersPattern,
        timePatterns,
        behaviorFlags,
      );
      res.json(detection);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/exam-security/instances/:instanceId/flag-answer",
  (req: Request, res: Response) => {
    try {
      const { questionId, reason } = req.body;
      examSecurityService.flagPotentialCheat(
        req.params.instanceId,
        questionId,
        reason,
      );
      res.json({ success: true, message: "Answer flagged" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/exam-security/instances/:instanceId/audit-log",
  (req: Request, res: Response) => {
    try {
      const log = examSecurityService.getAuditLog(req.params.instanceId);
      res.json({ log });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.get(
  "/exam-security/exams/:examId/security-report",
  (req: Request, res: Response) => {
    try {
      const report = examSecurityService.generateSecurityReport(
        req.params.examId,
      );
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

export default router;
