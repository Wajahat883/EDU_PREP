import { EventEmitter } from "events";

export interface IdentityVerification {
  verificationId: string;
  studentId: string;
  studentName: string;
  verificationStatus: "pending" | "verified" | "rejected" | "expired";
  verificationDate?: Date;
  expiryDate?: Date;
  verificationMethods: VerificationMethod[];
  biometricData: BiometricMatch[];
  confidenceScore: number; // 0-100
  reviewerNotes?: string;
  attemptCount: number;
}

export interface VerificationMethod {
  methodId: string;
  verificationId: string;
  method:
    | "facial-recognition"
    | "fingerprint"
    | "photo-id"
    | "liveness-check"
    | "government-id";
  status: "pending" | "matched" | "not-matched" | "inconclusive";
  matchScore: number; // 0-100
  timestamp: Date;
  evidence?: string; // URL to evidence
}

export interface BiometricMatch {
  matchId: string;
  verificationId: string;
  biometricType: "face" | "fingerprint";
  referenceScan: string;
  currentScan: string;
  matchPercentage: number; // 0-100
  livenessScore: number; // 0-100 (for face: how likely real person vs spoofed)
  timestamp: Date;
}

export interface GovernmentID {
  idId: string;
  verificationId: string;
  idType: "passport" | "drivers-license" | "national-id" | "student-id";
  issuingCountry: string;
  expiryDate: Date;
  status: "valid" | "expired" | "invalid";
  ocrResults: {
    name: string;
    dateOfBirth: string;
    idNumber: string;
  };
  manualReviewRequired: boolean;
  ocrAccuracy: number; // 0-100
}

export interface LivenessCheck {
  checkId: string;
  verificationId: string;
  timestamp: Date;
  status: "passed" | "failed" | "inconclusive";
  videoUrl: string;
  challenges: string[]; // List of random movements/expressions requested
  completedChallenges: number;
  detectedLiveness: boolean;
  spoofingRisk: number; // 0-100 (higher = more likely spoofed)
  analysisDetails: string;
}

export class IdentityVerificationService extends EventEmitter {
  private verifications: Map<string, IdentityVerification> = new Map();
  private methods: Map<string, VerificationMethod> = new Map();
  private biometrics: Map<string, BiometricMatch> = new Map();
  private livenessChecks: Map<string, LivenessCheck> = new Map();
  private governmentIds: Map<string, GovernmentID> = new Map();
  private verificationHistory: Map<string, IdentityVerification[]> = new Map(); // studentId -> history

  // Start identity verification
  startIdentityVerification(
    studentId: string,
    studentName: string,
  ): IdentityVerification {
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const verification: IdentityVerification = {
      verificationId,
      studentId,
      studentName,
      verificationStatus: "pending",
      verificationMethods: [],
      biometricData: [],
      confidenceScore: 0,
      attemptCount: 0,
    };

    this.verifications.set(verificationId, verification);

    const history = this.verificationHistory.get(studentId) || [];
    history.push(verification);
    this.verificationHistory.set(studentId, history);

    this.emit("verification:started", {
      verificationId,
      studentId,
      studentName,
    });

    return verification;
  }

  // Perform facial recognition
  performFacialRecognition(
    verificationId: string,
    referenceFaceData: string,
    currentFaceData: string,
  ): VerificationMethod {
    const verification = this.verifications.get(verificationId);
    if (!verification) return {} as VerificationMethod;

    const methodId = `method_${Date.now()}`;

    // Simulate facial recognition matching
    const matchScore = this.calculateFacialMatch(
      referenceFaceData,
      currentFaceData,
    );
    const status =
      matchScore >= 90
        ? "matched"
        : matchScore >= 70
          ? "inconclusive"
          : "not-matched";

    const method: VerificationMethod = {
      methodId,
      verificationId,
      method: "facial-recognition",
      status,
      matchScore,
      timestamp: new Date(),
    };

    this.methods.set(methodId, method);
    verification.verificationMethods.push(method);

    // Add biometric match data
    const matchId = `match_${Date.now()}`;
    const biometricMatch: BiometricMatch = {
      matchId,
      verificationId,
      biometricType: "face",
      referenceScan: referenceFaceData,
      currentScan: currentFaceData,
      matchPercentage: matchScore,
      livenessScore: 85, // Simulated liveness check
      timestamp: new Date(),
    };

    this.biometrics.set(matchId, biometricMatch);
    verification.biometricData.push(biometricMatch);

    this.emit("facial-recognition:completed", {
      methodId,
      verificationId,
      matchScore,
      status,
    });

    return method;
  }

  private calculateFacialMatch(ref: string, current: string): number {
    // Simplified facial matching (in production, use ML model like FaceAPI)
    if (!ref || !current) return 0;

    const similarity = Math.random() * 30 + 70; // Simulate 70-100 match score
    return Math.round(similarity * 10) / 10;
  }

  // Perform fingerprint verification
  performFingerprintVerification(
    verificationId: string,
    referencePrint: string,
    currentPrint: string,
  ): VerificationMethod {
    const verification = this.verifications.get(verificationId);
    if (!verification) return {} as VerificationMethod;

    const methodId = `method_${Date.now()}`;

    // Simulate fingerprint matching
    const matchScore = this.calculateFingerprintMatch(
      referencePrint,
      currentPrint,
    );
    const status =
      matchScore >= 95
        ? "matched"
        : matchScore >= 80
          ? "inconclusive"
          : "not-matched";

    const method: VerificationMethod = {
      methodId,
      verificationId,
      method: "fingerprint",
      status,
      matchScore,
      timestamp: new Date(),
    };

    this.methods.set(methodId, method);
    verification.verificationMethods.push(method);

    this.emit("fingerprint:verified", {
      methodId,
      verificationId,
      matchScore,
      status,
    });

    return method;
  }

  private calculateFingerprintMatch(ref: string, current: string): number {
    if (!ref || !current) return 0;

    const similarity = Math.random() * 25 + 75; // Simulate 75-100 match score
    return Math.round(similarity * 10) / 10;
  }

  // Verify government ID
  verifyGovernmentId(
    verificationId: string,
    idType: "passport" | "drivers-license" | "national-id" | "student-id",
    idNumber: string,
    documentUrl: string,
  ): GovernmentID {
    const verification = this.verifications.get(verificationId);
    if (!verification) return {} as GovernmentID;

    const idId = `id_${Date.now()}`;

    // Simulate OCR on document
    const ocrResults = {
      name: verification.studentName,
      dateOfBirth: "1998-05-15",
      idNumber,
    };

    const governmentId: GovernmentID = {
      idId,
      verificationId,
      idType,
      issuingCountry: "US",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: "valid",
      ocrResults,
      manualReviewRequired: false,
      ocrAccuracy: 98,
    };

    this.governmentIds.set(idId, governmentId);

    // Add as verification method
    const methodId = `method_${Date.now()}`;
    const method: VerificationMethod = {
      methodId,
      verificationId,
      method: "government-id",
      status: "matched",
      matchScore: 98,
      timestamp: new Date(),
      evidence: documentUrl,
    };

    this.methods.set(methodId, method);
    verification.verificationMethods.push(method);

    this.emit("government-id:verified", {
      idId,
      verificationId,
      idType,
      valid: governmentId.status === "valid",
    });

    return governmentId;
  }

  // Perform liveness check
  performLivenessCheck(
    verificationId: string,
    videoUrl: string,
  ): LivenessCheck {
    const verification = this.verifications.get(verificationId);
    if (!verification) return {} as LivenessCheck;

    const checkId = `liveness_${Date.now()}`;

    // Simulate liveness analysis
    const challenges = ["blink", "smile", "nod", "turn-left", "turn-right"];
    const completedChallenges = 5;
    const detectedLiveness = true;
    const spoofingRisk = Math.random() * 10; // 0-10% risk

    const check: LivenessCheck = {
      checkId,
      verificationId,
      timestamp: new Date(),
      status: spoofingRisk < 5 ? "passed" : "inconclusive",
      videoUrl,
      challenges,
      completedChallenges,
      detectedLiveness,
      spoofingRisk,
      analysisDetails:
        "Face detected in all frames, natural movements confirmed",
    };

    this.livenessChecks.set(checkId, check);

    // Add as verification method
    const methodId = `method_${Date.now()}`;
    const method: VerificationMethod = {
      methodId,
      verificationId,
      method: "liveness-check",
      status: check.status === "passed" ? "matched" : "inconclusive",
      matchScore: check.detectedLiveness ? 95 : 40,
      timestamp: new Date(),
    };

    this.methods.set(methodId, method);
    verification.verificationMethods.push(method);

    this.emit("liveness:checked", {
      checkId,
      verificationId,
      passed: check.status === "passed",
      spoofingRisk,
    });

    return check;
  }

  // Complete verification
  completeVerification(verificationId: string): void {
    const verification = this.verifications.get(verificationId);
    if (!verification) return;

    // Calculate confidence score based on all methods
    const scores = verification.verificationMethods.map((m) => m.matchScore);
    const confidenceScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b) / scores.length)
        : 0;

    verification.confidenceScore = confidenceScore;
    verification.verificationStatus =
      confidenceScore >= 85 ? "verified" : "rejected";
    verification.verificationDate = new Date();
    verification.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    this.emit("verification:completed", {
      verificationId,
      studentId: verification.studentId,
      status: verification.verificationStatus,
      confidenceScore,
    });
  }

  // Get verification
  getVerification(verificationId: string): IdentityVerification | undefined {
    return this.verifications.get(verificationId);
  }

  // Get liveness check
  getLivenessCheck(checkId: string): LivenessCheck | undefined {
    return this.livenessChecks.get(checkId);
  }

  // Get government ID
  getGovernmentId(idId: string): GovernmentID | undefined {
    return this.governmentIds.get(idId);
  }

  // Verify student before exam
  verifyStudentForExam(studentId: string): {
    verified: boolean;
    confidenceScore: number;
    message: string;
  } {
    const history = this.verificationHistory.get(studentId) || [];
    const latestVerification = history[history.length - 1];

    if (!latestVerification) {
      return {
        verified: false,
        confidenceScore: 0,
        message: "No verification on file",
      };
    }

    if (latestVerification.verificationStatus !== "verified") {
      return {
        verified: false,
        confidenceScore: 0,
        message: "Identity verification failed",
      };
    }

    if (
      latestVerification.expiryDate &&
      latestVerification.expiryDate < new Date()
    ) {
      return {
        verified: false,
        confidenceScore: 0,
        message: "Identity verification expired",
      };
    }

    return {
      verified: true,
      confidenceScore: latestVerification.confidenceScore,
      message: "Identity verified for exam access",
    };
  }

  // Get verification history
  getVerificationHistory(studentId: string): IdentityVerification[] {
    return this.verificationHistory.get(studentId) || [];
  }

  // Reject verification
  rejectVerification(verificationId: string, reason: string): void {
    const verification = this.verifications.get(verificationId);
    if (verification) {
      verification.verificationStatus = "rejected";
      verification.reviewerNotes = reason;

      this.emit("verification:rejected", {
        verificationId,
        studentId: verification.studentId,
        reason,
      });
    }
  }

  // Re-attempt verification
  reAttemptVerification(verificationId: string): void {
    const verification = this.verifications.get(verificationId);
    if (verification) {
      verification.verificationStatus = "pending";
      verification.attemptCount++;
      verification.verificationMethods = [];
      verification.biometricData = [];

      this.emit("verification:reattempted", {
        verificationId,
        studentId: verification.studentId,
        attemptNumber: verification.attemptCount,
      });
    }
  }

  // Get verification stats
  getVerificationStats(): {
    totalVerifications: number;
    verified: number;
    rejected: number;
    averageConfidenceScore: number;
    methodsUsed: Map<string, number>;
  } {
    const verifications = Array.from(this.verifications.values());
    const methodUsage = new Map<string, number>();

    for (const verification of verifications) {
      for (const method of verification.verificationMethods) {
        methodUsage.set(
          method.method,
          (methodUsage.get(method.method) || 0) + 1,
        );
      }
    }

    return {
      totalVerifications: verifications.length,
      verified: verifications.filter((v) => v.verificationStatus === "verified")
        .length,
      rejected: verifications.filter((v) => v.verificationStatus === "rejected")
        .length,
      averageConfidenceScore:
        verifications.length > 0
          ? Math.round(
              verifications.reduce((sum, v) => sum + v.confidenceScore, 0) /
                verifications.length,
            )
          : 0,
      methodsUsed: methodUsage,
    };
  }
}

export const identityVerificationService = new IdentityVerificationService();

export default IdentityVerificationService;
