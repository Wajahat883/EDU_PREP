import { EventEmitter } from "events";

export interface ExamQuestion {
  questionId: string;
  examId: string;
  originalPosition: number;
  questionText: string;
  questionType:
    | "multiple-choice"
    | "short-answer"
    | "essay"
    | "matching"
    | "true-false";
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export interface ExamInstance {
  instanceId: string;
  examId: string;
  studentId: string;
  questions: ExamQuestion[];
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  status: "not-started" | "in-progress" | "submitted" | "graded";
  score?: number;
  totalPoints: number;
  responses: StudentResponse[];
  flaggedQuestions: Set<number>; // indices
  timeRemainingWarnings: number;
  suspiciousSubmissions: string[];
  submissionHash: string;
  ipAddress?: string;
}

export interface StudentResponse {
  responseId: string;
  questionId: string;
  studentId: string;
  response: string;
  timestamp: Date;
  timeSpent: number; // seconds on this question
  attemptCount: number;
  confidence: number; // 0-100 how confident student is
}

export interface AuditLog {
  logId: string;
  examInstanceId: string;
  eventType:
    | "exam-started"
    | "question-viewed"
    | "response-submitted"
    | "response-changed"
    | "time-warning"
    | "exam-submitted"
    | "suspicious-activity";
  timestamp: Date;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CheatDetectionResult {
  detectionId: string;
  examInstanceId: string;
  timestamp: Date;
  suspiciousPatterns: string[];
  flagCount: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  similarSubmissions?: string[]; // Other exam IDs with similar patterns
}

export class ExamSecurityService extends EventEmitter {
  private exams: Map<string, ExamQuestion[]> = new Map();
  private instances: Map<string, ExamInstance> = new Map();
  private auditLogs: Map<string, AuditLog[]> = new Map();
  private cheatDetections: Map<string, CheatDetectionResult> = new Map();
  private questionBank: Map<string, Set<string>> = new Map(); // topicId -> questionIds
  private submissionHashes: Map<string, ExamInstance[]> = new Map(); // hash -> instances

  // Create secure exam
  createExam(examId: string, questions: ExamQuestion[]): void {
    // Randomize question order
    const randomizedQuestions = [...questions].sort(() => Math.random() - 0.5);

    // Store with randomized positions
    randomizedQuestions.forEach((q, i) => {
      q.originalPosition = i;
    });

    this.exams.set(examId, randomizedQuestions);

    // Index by topic
    for (const question of questions) {
      const topicQuestions = this.questionBank.get(question.topic) || new Set();
      topicQuestions.add(question.questionId);
      this.questionBank.set(question.topic, topicQuestions);
    }

    this.emit("exam:created", {
      examId,
      questionCount: questions.length,
      randomized: true,
    });
  }

  // Generate exam instance (randomize for each student)
  generateExamInstance(
    examId: string,
    studentId: string,
    duration: number,
  ): ExamInstance {
    const examQuestions = this.exams.get(examId);
    if (!examQuestions) return {} as ExamInstance;

    const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Shuffle questions for this student
    const shuffledQuestions = [...examQuestions].sort(
      () => Math.random() - 0.5,
    );

    // Shuffle answer options for multiple choice
    const processedQuestions = shuffledQuestions.map((q) => {
      const question = { ...q };

      if (question.options && question.options.length > 0) {
        // Shuffle options
        question.options = [...question.options].sort(
          () => Math.random() - 0.5,
        );
      }

      return question;
    });

    const totalPoints = processedQuestions.reduce(
      (sum, q) => sum + q.points,
      0,
    );

    const instance: ExamInstance = {
      instanceId,
      examId,
      studentId,
      questions: processedQuestions,
      startTime: new Date(),
      duration,
      status: "not-started",
      totalPoints,
      responses: [],
      flaggedQuestions: new Set(),
      timeRemainingWarnings: 0,
      suspiciousSubmissions: [],
      submissionHash: this.generateHash(studentId, examId),
    };

    this.instances.set(instanceId, instance);
    this.auditLogs.set(instanceId, []);

    this.emit("exam-instance:generated", {
      instanceId,
      examId,
      studentId,
      questionCount: processedQuestions.length,
    });

    return instance;
  }

  private generateHash(studentId: string, examId: string): string {
    // Simplified hash - in production use crypto
    return `hash_${studentId}_${examId}_${Date.now()}`;
  }

  // Start exam
  startExam(instanceId: string, ipAddress?: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.status = "in-progress";
    instance.ipAddress = ipAddress;

    this.logAuditEvent(
      instanceId,
      "exam-started",
      `Exam started for student ${instance.studentId}`,
      ipAddress,
    );

    this.emit("exam:started", {
      instanceId,
      studentId: instance.studentId,
      questionCount: instance.questions.length,
    });
  }

  // Submit response
  submitResponse(
    instanceId: string,
    questionId: string,
    studentResponse: string,
    timeSpent: number,
    confidence: number = 50,
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const responseId = `response_${Date.now()}`;

    const response: StudentResponse = {
      responseId,
      questionId,
      studentId: instance.studentId,
      response: studentResponse,
      timestamp: new Date(),
      timeSpent,
      attemptCount: 1,
      confidence,
    };

    // Check for previous response to same question
    const existingResponse = instance.responses.find(
      (r) => r.questionId === questionId,
    );
    if (existingResponse) {
      existingResponse.attemptCount++;
      existingResponse.response = studentResponse;
      existingResponse.timestamp = new Date();
    } else {
      instance.responses.push(response);
    }

    this.logAuditEvent(
      instanceId,
      "response-submitted",
      `Response submitted for question ${questionId}`,
    );

    // Detect suspicious patterns
    this.detectCheatPatterns(instanceId);
  }

  // Flag question
  flagQuestion(instanceId: string, questionIndex: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.flaggedQuestions.add(questionIndex);

      this.logAuditEvent(
        instanceId,
        "question-viewed",
        `Question ${questionIndex} flagged for review`,
      );
    }
  }

  // Submit exam
  submitExam(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.endTime = new Date();
    instance.status = "submitted";

    // Calculate score
    let score = 0;
    for (const response of instance.responses) {
      const question = instance.questions.find(
        (q) => q.questionId === response.questionId,
      );
      if (question && response.response === question.correctAnswer) {
        score += question.points;
      }
    }

    instance.score = score;

    // Store hash for similarity detection
    const hashInstances =
      this.submissionHashes.get(instance.submissionHash) || [];
    hashInstances.push(instance);
    this.submissionHashes.set(instance.submissionHash, hashInstances);

    this.logAuditEvent(
      instanceId,
      "exam-submitted",
      `Exam submitted. Score: ${score}/${instance.totalPoints}`,
    );

    // Final cheat detection
    const detection = this.performFinalCheatDetection(instanceId);

    if (
      detection &&
      (detection.riskLevel === "high" || detection.riskLevel === "critical")
    ) {
      instance.suspiciousSubmissions.push(detection.detectionId);
    }

    this.emit("exam:submitted", {
      instanceId,
      studentId: instance.studentId,
      score,
      totalPoints: instance.totalPoints,
      percentage: Math.round((score / instance.totalPoints) * 100),
    });
  }

  // Detect cheat patterns
  private detectCheatPatterns(instanceId: string): CheatDetectionResult | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    const patterns: string[] = [];
    let flagCount = 0;

    // Pattern 1: Too fast responses (< 10 seconds per question)
    const avgTimePerQuestion =
      instance.responses.reduce((sum, r) => sum + r.timeSpent, 0) /
      instance.responses.length;
    if (avgTimePerQuestion < 10) {
      patterns.push("Unusually fast response time");
      flagCount += 2;
    }

    // Pattern 2: Perfect or near-perfect score
    const perfectScore =
      instance.responses.length > 0 &&
      instance.responses.every((r) => r.response);
    if (
      perfectScore &&
      instance.responses.length >= instance.questions.length * 0.8
    ) {
      patterns.push("Suspiciously high accuracy");
      flagCount += 1;
    }

    // Pattern 3: High confidence on difficult questions
    const difficult = instance.responses.filter((r) => {
      const q = instance.questions.find((q) => q.questionId === r.questionId);
      return q && q.difficulty === "hard" && r.confidence > 80;
    });

    if (difficult.length > instance.responses.length * 0.5) {
      patterns.push("High confidence on difficult questions");
      flagCount += 1;
    }

    // Pattern 4: Similar to other submissions
    const similarCount = this.findSimilarSubmissions(instanceId);
    if (similarCount > 2) {
      patterns.push(`${similarCount} similar submissions detected`);
      flagCount += 3;
    }

    if (patterns.length > 0) {
      const detectionId = `detection_${Date.now()}`;
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";

      if (flagCount >= 5) riskLevel = "critical";
      else if (flagCount >= 3) riskLevel = "high";
      else if (flagCount >= 2) riskLevel = "medium";

      const detection: CheatDetectionResult = {
        detectionId,
        examInstanceId: instanceId,
        timestamp: new Date(),
        suspiciousPatterns: patterns,
        flagCount,
        riskLevel,
        recommendations: this.generateRecommendations(riskLevel, patterns),
        similarSubmissions: this.findSimilarSubmissionIds(instanceId),
      };

      this.cheatDetections.set(detectionId, detection);

      this.emit("cheat-pattern:detected", {
        detectionId,
        instanceId,
        riskLevel,
        patterns,
      });

      return detection;
    }

    return null;
  }

  private performFinalCheatDetection(
    instanceId: string,
  ): CheatDetectionResult | null {
    return this.detectCheatPatterns(instanceId);
  }

  private findSimilarSubmissions(instanceId: string): number {
    const instance = this.instances.get(instanceId);
    if (!instance) return 0;

    let similarCount = 0;

    // Check against other instances
    for (const [id, other] of this.instances.entries()) {
      if (id === instanceId) continue;

      if (other.examId === instance.examId) {
        // Count matching responses
        let matches = 0;
        for (const response of instance.responses) {
          const otherResponse = other.responses.find(
            (r) => r.questionId === response.questionId,
          );
          if (otherResponse && otherResponse.response === response.response) {
            matches++;
          }
        }

        if (matches > instance.responses.length * 0.7) {
          similarCount++;
        }
      }
    }

    return similarCount;
  }

  private findSimilarSubmissionIds(instanceId: string): string[] {
    const instance = this.instances.get(instanceId);
    if (!instance) return [];

    const similar: string[] = [];

    for (const [id, other] of this.instances.entries()) {
      if (id === instanceId) continue;

      if (other.examId === instance.examId) {
        let matches = 0;
        for (const response of instance.responses) {
          const otherResponse = other.responses.find(
            (r) => r.questionId === response.questionId,
          );
          if (otherResponse && otherResponse.response === response.response) {
            matches++;
          }
        }

        if (matches > instance.responses.length * 0.7) {
          similar.push(id);
        }
      }
    }

    return similar;
  }

  private generateRecommendations(
    riskLevel: string,
    patterns: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === "critical") {
      recommendations.push("Recommend exam invalidation and manual review");
      recommendations.push("Consider disciplinary action");
    } else if (riskLevel === "high") {
      recommendations.push("Flag for manual review by instructor");
      recommendations.push("Consider requiring retake under supervision");
    } else if (riskLevel === "medium") {
      recommendations.push("Monitor for future suspicious patterns");
    }

    for (const pattern of patterns) {
      if (pattern.includes("fast")) {
        recommendations.push(
          "Verify student has sufficient test-taking experience",
        );
      }
      if (pattern.includes("similar")) {
        recommendations.push(
          "Cross-reference with similar high-scoring submissions",
        );
      }
    }

    return recommendations;
  }

  // Log audit event
  private logAuditEvent(
    instanceId: string,
    eventType: string,
    details: string,
    ipAddress?: string,
  ): void {
    const logId = `log_${Date.now()}`;

    const log: AuditLog = {
      logId,
      examInstanceId: instanceId,
      eventType: eventType as AuditLog["eventType"],
      timestamp: new Date(),
      details,
      ipAddress,
    };

    const logs = this.auditLogs.get(instanceId) || [];
    logs.push(log);
    this.auditLogs.set(instanceId, logs);
  }

  // Get audit log
  getAuditLog(instanceId: string): AuditLog[] {
    return this.auditLogs.get(instanceId) || [];
  }

  // Get cheat detection result
  getCheatDetection(detectionId: string): CheatDetectionResult | undefined {
    return this.cheatDetections.get(detectionId);
  }

  // Get exam instance
  getExamInstance(instanceId: string): ExamInstance | undefined {
    return this.instances.get(instanceId);
  }

  // Generate security report
  generateSecurityReport(instanceId: string): {
    instanceId: string;
    studentId: string;
    examId: string;
    submissionScore: number;
    totalPoints: number;
    riskLevel: string;
    flaggedQuestions: number;
    auditLogEntries: number;
    recommendations: string[];
    passed: boolean;
  } {
    const instance = this.instances.get(instanceId);
    if (!instance) return {} as any;

    const detections = Array.from(this.cheatDetections.values()).filter(
      (d) => d.examInstanceId === instanceId,
    );
    const highestRisk = detections.length > 0 ? detections[0].riskLevel : "low";

    const percentage = instance.score
      ? Math.round((instance.score / instance.totalPoints) * 100)
      : 0;

    return {
      instanceId,
      studentId: instance.studentId,
      examId: instance.examId,
      submissionScore: instance.score || 0,
      totalPoints: instance.totalPoints,
      riskLevel: highestRisk,
      flaggedQuestions: instance.flaggedQuestions.size,
      auditLogEntries: (this.auditLogs.get(instanceId) || []).length,
      recommendations:
        detections.length > 0 ? detections[0].recommendations : [],
      passed: percentage >= 70,
    };
  }

  // Invalidate exam
  invalidateExam(instanceId: string, reason: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = "submitted";
      instance.score = 0;

      this.logAuditEvent(
        instanceId,
        "suspicious-activity",
        `Exam invalidated: ${reason}`,
      );

      this.emit("exam:invalidated", {
        instanceId,
        studentId: instance.studentId,
        reason,
      });
    }
  }
}

export const examSecurityService = new ExamSecurityService();

export default ExamSecurityService;
