import { EventEmitter } from "events";

export interface ProctorSession {
  sessionId: string;
  examId: string;
  studentId: string;
  studentName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  status: "in-progress" | "completed" | "flagged" | "cancelled";
  recordingUrl?: string;
  suspiciousActivities: SuspiciousActivity[];
  overallScore: number; // 0-100 confidence
  passed: boolean;
  flaggedForReview: boolean;
  reviewerComments?: string;
}

export interface SuspiciousActivity {
  activityId: string;
  activityType:
    | "multiple-faces"
    | "head-movement"
    | "eye-gaze-away"
    | "phone-detected"
    | "paper-detected"
    | "audio-detected"
    | "unusual-pattern";
  timestamp: Date;
  confidence: number; // 0-100
  description: string;
  severity: "low" | "medium" | "high";
  frameUrl?: string;
}

export interface AIAnalysisResult {
  resultId: string;
  sessionId: string;
  analysisTime: Date;
  facesDetected: number;
  facePresence: number; // percentage of time face visible
  gazeDirection: string; // center, left, right, up, down
  eyeGazeAwayCount: number;
  eyeGazeAwayDuration: number; // seconds
  audioDetected: boolean;
  audioSegments: number;
  movementScore: number; // 0-100 (sudden movements = higher)
  overallRiskScore: number; // 0-100
  recommendations: string[];
}

export interface ProctorAction {
  actionId: string;
  sessionId: string;
  actionType: "warning" | "pause-exam" | "terminate-exam" | "flag-for-review";
  timestamp: Date;
  reason: string;
  takenBy: "system" | "human-proctor";
  description: string;
}

export class ProctorService extends EventEmitter {
  private sessions: Map<string, ProctorSession> = new Map();
  private analysisResults: Map<string, AIAnalysisResult> = new Map();
  private actions: Map<string, ProctorAction[]> = new Map();
  private studentRecordings: Map<string, string[]> = new Map(); // studentId -> sessionIds

  // Start proctoring session
  startProctorSession(
    examId: string,
    studentId: string,
    studentName: string,
    duration: number,
  ): ProctorSession {
    const sessionId = `proctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ProctorSession = {
      sessionId,
      examId,
      studentId,
      studentName,
      startTime: new Date(),
      duration,
      status: "in-progress",
      suspiciousActivities: [],
      overallScore: 100,
      passed: true,
      flaggedForReview: false,
    };

    this.sessions.set(sessionId, session);
    this.actions.set(sessionId, []);

    const recordings = this.studentRecordings.get(studentId) || [];
    recordings.push(sessionId);
    this.studentRecordings.set(studentId, recordings);

    this.emit("session:started", {
      sessionId,
      examId,
      studentName,
      startTime: session.startTime,
    });

    return session;
  }

  // Add suspicious activity
  addSuspiciousActivity(
    sessionId: string,
    activityType: string,
    confidence: number,
    description: string,
    severity: "low" | "medium" | "high" = "medium",
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const activity: SuspiciousActivity = {
      activityId,
      activityType: activityType as SuspiciousActivity["activityType"],
      timestamp: new Date(),
      confidence,
      description,
      severity,
    };

    session.suspiciousActivities.push(activity);

    // Update overall score based on severity
    if (severity === "high") {
      session.overallScore = Math.max(0, session.overallScore - 15);
    } else if (severity === "medium") {
      session.overallScore = Math.max(0, session.overallScore - 8);
    } else {
      session.overallScore = Math.max(0, session.overallScore - 3);
    }

    // Flag for review if score drops below threshold
    if (session.overallScore < 70) {
      session.flaggedForReview = true;
    }

    this.emit("activity:detected", {
      activityId,
      sessionId,
      activityType,
      confidence,
      severity,
    });
  }

  // AI analysis
  performAIAnalysis(sessionId: string): AIAnalysisResult {
    const session = this.sessions.get(sessionId);
    if (!session) return {} as AIAnalysisResult;

    const resultId = `analysis_${Date.now()}`;

    // Simulate AI analysis results
    let facesDetected = 1;
    let eyeGazeAwayCount = 0;
    let audioDetected = false;
    let overallRiskScore = 0;
    const recommendations: string[] = [];

    // Check suspicious activities to derive AI metrics
    for (const activity of session.suspiciousActivities) {
      if (activity.activityType === "multiple-faces") {
        facesDetected = 2;
        overallRiskScore += activity.confidence;
        recommendations.push(
          "Multiple faces detected - potential cheating indicator",
        );
      } else if (activity.activityType === "eye-gaze-away") {
        eyeGazeAwayCount++;
        overallRiskScore += activity.confidence * 0.7;
        recommendations.push("Student looking away from screen frequently");
      } else if (activity.activityType === "audio-detected") {
        audioDetected = true;
        overallRiskScore += activity.confidence * 0.8;
        recommendations.push("Audio detected - possible external assistance");
      }
    }

    overallRiskScore = Math.min(100, overallRiskScore);

    const result: AIAnalysisResult = {
      resultId,
      sessionId,
      analysisTime: new Date(),
      facesDetected,
      facePresence: Math.random() * 20 + 80, // 80-100%
      gazeDirection: "center",
      eyeGazeAwayCount,
      eyeGazeAwayDuration: eyeGazeAwayCount * 5,
      audioDetected,
      audioSegments: audioDetected ? Math.floor(Math.random() * 3) + 1 : 0,
      movementScore: Math.floor(Math.random() * 40) + 30, // 30-70
      overallRiskScore,
      recommendations,
    };

    this.analysisResults.set(resultId, result);

    this.emit("analysis:completed", {
      resultId,
      sessionId,
      overallRiskScore,
      recommendations: recommendations.length,
    });

    return result;
  }

  // Take action on session
  takeProctorAction(
    sessionId: string,
    actionType: "warning" | "pause-exam" | "terminate-exam" | "flag-for-review",
    reason: string,
    takenBy: "system" | "human-proctor" = "system",
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const action: ProctorAction = {
      actionId,
      sessionId,
      actionType,
      timestamp: new Date(),
      reason,
      takenBy,
      description: `${actionType}: ${reason}`,
    };

    const actions = this.actions.get(sessionId) || [];
    actions.push(action);
    this.actions.set(sessionId, actions);

    if (actionType === "terminate-exam") {
      session.status = "flagged";
      session.flaggedForReview = true;
    } else if (actionType === "flag-for-review") {
      session.flaggedForReview = true;
    }

    this.emit("action:taken", {
      actionId,
      sessionId,
      actionType,
      reason,
      takenBy,
    });
  }

  // End proctoring session
  endProctorSession(sessionId: string, recordingUrl?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.status = session.flaggedForReview ? "flagged" : "completed";
    session.recordingUrl = recordingUrl;

    // Final score
    session.passed = session.overallScore >= 70 && !session.flaggedForReview;

    this.emit("session:ended", {
      sessionId,
      studentName: session.studentName,
      status: session.status,
      score: session.overallScore,
      passed: session.passed,
      flaggedForReview: session.flaggedForReview,
    });
  }

  // Review session
  reviewSession(sessionId: string, approved: boolean, comments: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.reviewerComments = comments;
    session.passed = approved;
    session.flaggedForReview = false;

    this.emit("session:reviewed", {
      sessionId,
      approved,
      studentName: session.studentName,
      comments,
    });
  }

  // Get session details
  getSession(sessionId: string): ProctorSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get analysis result
  getAnalysisResult(resultId: string): AIAnalysisResult | undefined {
    return this.analysisResults.get(resultId);
  }

  // Get session actions
  getSessionActions(sessionId: string): ProctorAction[] {
    return this.actions.get(sessionId) || [];
  }

  // Get flagged sessions
  getFlaggedSessions(): ProctorSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.flaggedForReview)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // Get student recording history
  getStudentRecordingHistory(studentId: string): ProctorSession[] {
    const sessionIds = this.studentRecordings.get(studentId) || [];
    return sessionIds
      .map((id) => this.sessions.get(id))
      .filter((s) => s !== undefined) as ProctorSession[];
  }

  // Generate proctoring report
  generateReport(sessionId: string): {
    sessionId: string;
    studentName: string;
    duration: number;
    overallScore: number;
    suspiciousActivities: number;
    passed: boolean;
    flaggedForReview: boolean;
    recommendations: string[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) return {} as any;

    const recommendations: string[] = [];

    if (session.suspiciousActivities.length > 5) {
      recommendations.push(
        "Multiple suspicious activities detected - recommend manual review",
      );
    }

    const highSeverityCount = session.suspiciousActivities.filter(
      (a) => a.severity === "high",
    ).length;
    if (highSeverityCount > 0) {
      recommendations.push("High severity activities detected");
    }

    if (session.overallScore < 50) {
      recommendations.push("Low proctoring score - recommend exam retake");
    }

    return {
      sessionId,
      studentName: session.studentName,
      duration: session.duration,
      overallScore: session.overallScore,
      suspiciousActivities: session.suspiciousActivities.length,
      passed: session.passed,
      flaggedForReview: session.flaggedForReview,
      recommendations,
    };
  }

  // Get proctoring statistics
  getProctoringStats(): {
    totalSessions: number;
    flaggedSessions: number;
    passedExams: number;
    failedExams: number;
    avgScore: number;
    averageSuspiciousActivities: number;
  } {
    const sessions = Array.from(this.sessions.values());

    return {
      totalSessions: sessions.length,
      flaggedSessions: sessions.filter((s) => s.flaggedForReview).length,
      passedExams: sessions.filter((s) => s.passed).length,
      failedExams: sessions.filter((s) => !s.passed).length,
      avgScore:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.overallScore, 0) /
            sessions.length
          : 0,
      averageSuspiciousActivities:
        sessions.length > 0
          ? sessions.reduce(
              (sum, s) => sum + s.suspiciousActivities.length,
              0,
            ) / sessions.length
          : 0,
    };
  }
}

export const proctorService = new ProctorService();

export default ProctorService;
