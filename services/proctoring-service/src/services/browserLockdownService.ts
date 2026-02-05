import { EventEmitter } from "events";

export interface LockdownSession {
  sessionId: string;
  examId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  status: "active" | "paused" | "ended" | "breached";
  restrictedActions: RestrictedAction[];
  breachAttempts: BreachAttempt[];
  allowedUrls: string[];
  blockedUrls: string[];
}

export interface RestrictedAction {
  actionId: string;
  action:
    | "copy-paste"
    | "screenshot"
    | "print"
    | "new-tab"
    | "alt-tab"
    | "developer-tools"
    | "right-click"
    | "minimize"
    | "maximize"
    | "close-window"
    | "task-manager"
    | "url-bar-access";
  allowed: boolean;
  reason: string;
}

export interface BreachAttempt {
  attemptId: string;
  sessionId: string;
  timestamp: Date;
  breachType:
    | "tab-switch"
    | "copy-attempt"
    | "paste-attempt"
    | "screenshot-attempt"
    | "new-window"
    | "dev-tools-opened"
    | "url-change"
    | "minimize-window"
    | "right-click"
    | "keyboard-shortcut";
  severity: "low" | "medium" | "high";
  details: string;
  blocked: boolean;
  ipAddress?: string;
}

export interface KeystrokePattern {
  patternId: string;
  sessionId: string;
  averageWPM: number; // words per minute
  averageKeyInterval: number; // milliseconds
  pauseFrequency: number;
  suspiciousPattern: boolean;
  notes: string;
}

export class BrowserLockdownService extends EventEmitter {
  private sessions: Map<string, LockdownSession> = new Map();
  private keystrokePatterns: Map<string, KeystrokePattern> = new Map();
  private breachLog: BreachAttempt[] = [];

  // Start lockdown session
  startLockdownSession(
    examId: string,
    studentId: string,
    allowedUrls: string[] = [],
    blockedUrls: string[] = [],
  ): LockdownSession {
    const sessionId = `lockdown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: LockdownSession = {
      sessionId,
      examId,
      studentId,
      startTime: new Date(),
      status: "active",
      restrictedActions: this.getDefaultRestrictedActions(),
      breachAttempts: [],
      allowedUrls,
      blockedUrls,
    };

    this.sessions.set(sessionId, session);

    this.emit("lockdown:started", {
      sessionId,
      examId,
      studentId,
      startTime: session.startTime,
    });

    return session;
  }

  private getDefaultRestrictedActions(): RestrictedAction[] {
    return [
      {
        actionId: "action_1",
        action: "copy-paste",
        allowed: false,
        reason: "Prevent cheating",
      },
      {
        actionId: "action_2",
        action: "screenshot",
        allowed: false,
        reason: "Prevent content sharing",
      },
      {
        actionId: "action_3",
        action: "print",
        allowed: false,
        reason: "Prevent document capture",
      },
      {
        actionId: "action_4",
        action: "new-tab",
        allowed: false,
        reason: "Keep focus on exam",
      },
      {
        actionId: "action_5",
        action: "alt-tab",
        allowed: false,
        reason: "Prevent app switching",
      },
      {
        actionId: "action_6",
        action: "developer-tools",
        allowed: false,
        reason: "Prevent exam manipulation",
      },
      {
        actionId: "action_7",
        action: "right-click",
        allowed: false,
        reason: "Prevent access to context menu",
      },
      {
        actionId: "action_8",
        action: "minimize",
        allowed: false,
        reason: "Keep exam window visible",
      },
      {
        actionId: "action_9",
        action: "close-window",
        allowed: false,
        reason: "Prevent window closure",
      },
      {
        actionId: "action_10",
        action: "task-manager",
        allowed: false,
        reason: "Prevent process monitoring",
      },
    ];
  }

  // Handle action attempt
  handleActionAttempt(
    sessionId: string,
    action: string,
    ipAddress?: string,
  ): { allowed: boolean; message: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { allowed: false, message: "Session not found" };
    }

    const restrictedAction = session.restrictedActions.find(
      (r) => r.action === action,
    );

    if (!restrictedAction) {
      return { allowed: true, message: "Action permitted" };
    }

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const attempt: BreachAttempt = {
      attemptId,
      sessionId,
      timestamp: new Date(),
      breachType: action as BreachAttempt["breachType"],
      severity: restrictedAction.allowed ? "low" : "high",
      details: `User attempted to ${action.replace(/-/g, " ")}`,
      blocked: !restrictedAction.allowed,
      ipAddress,
    };

    session.breachAttempts.push(attempt);
    this.breachLog.push(attempt);

    // Flag session if blocked attempts exceed threshold
    if (
      session.breachAttempts.filter((b) => b.blocked && b.severity === "high")
        .length > 5
    ) {
      session.status = "breached";

      this.emit("lockdown:breached", {
        sessionId,
        studentId: session.studentId,
        attemptCount: session.breachAttempts.length,
      });
    }

    this.emit("action:attempted", {
      attemptId,
      sessionId,
      action,
      allowed: restrictedAction.allowed,
      blocked: !restrictedAction.allowed,
    });

    return {
      allowed: restrictedAction.allowed,
      message: restrictedAction.allowed
        ? "Action permitted"
        : `Action blocked: ${restrictedAction.reason}`,
    };
  }

  // Monitor keystroke pattern
  monitorKeystroke(
    sessionId: string,
    keystrokeData: { keyCode: number; timestamp: number }[],
  ): void {
    if (keystrokeData.length < 20) return; // Need enough data for analysis

    // Calculate WPM (simplified - average of ~5 chars per word)
    const timeSpanSeconds =
      (keystrokeData[keystrokeData.length - 1].timestamp -
        keystrokeData[0].timestamp) /
      1000;
    const averageWPM = (keystrokeData.length * 60) / (timeSpanSeconds * 5);

    // Calculate average key interval
    let totalInterval = 0;
    for (let i = 1; i < keystrokeData.length; i++) {
      totalInterval +=
        keystrokeData[i].timestamp - keystrokeData[i - 1].timestamp;
    }
    const averageKeyInterval = totalInterval / (keystrokeData.length - 1);

    // Detect unusual patterns
    let suspiciousPattern = false;
    if (averageWPM > 150 || averageWPM < 10) {
      suspiciousPattern = true; // Too fast or too slow
    }

    if (averageKeyInterval > 2000) {
      suspiciousPattern = true; // Long pauses between keystrokes
    }

    const patternId = `pattern_${Date.now()}`;

    const pattern: KeystrokePattern = {
      patternId,
      sessionId,
      averageWPM: Math.round(averageWPM * 10) / 10,
      averageKeyInterval: Math.round(averageKeyInterval),
      pauseFrequency: keystrokeData.filter(
        (k, i, arr) => i > 0 && arr[i].timestamp - arr[i - 1].timestamp > 1000,
      ).length,
      suspiciousPattern,
      notes: suspiciousPattern
        ? "Unusual keystroke pattern detected"
        : "Normal keystroke pattern",
    };

    this.keystrokePatterns.set(patternId, pattern);

    if (suspiciousPattern) {
      this.emit("keystroke:suspicious", {
        patternId,
        sessionId,
        averageWPM: pattern.averageWPM,
        averageKeyInterval: pattern.averageKeyInterval,
      });
    }
  }

  // End lockdown session
  endLockdownSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.status = session.status === "breached" ? "breached" : "ended";

    this.emit("lockdown:ended", {
      sessionId,
      studentId: session.studentId,
      duration: Math.round(
        (session.endTime.getTime() - session.startTime.getTime()) / 60000,
      ),
      breachAttempts: session.breachAttempts.filter((b) => b.blocked).length,
      status: session.status,
    });
  }

  // Pause lockdown
  pauseLockdown(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "paused";

      this.emit("lockdown:paused", {
        sessionId,
        studentId: session.studentId,
      });
    }
  }

  // Resume lockdown
  resumeLockdown(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "active";

      this.emit("lockdown:resumed", {
        sessionId,
        studentId: session.studentId,
      });
    }
  }

  // Get session details
  getSession(sessionId: string): LockdownSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Whitelist URL
  whitelistUrl(sessionId: string, url: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.allowedUrls.includes(url)) {
      session.allowedUrls.push(url);

      this.emit("url:whitelisted", {
        sessionId,
        url,
      });
    }
  }

  // Blacklist URL
  blacklistUrl(sessionId: string, url: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.blockedUrls.includes(url)) {
      session.blockedUrls.push(url);

      this.emit("url:blacklisted", {
        sessionId,
        url,
      });
    }
  }

  // Get breach attempts
  getBreachAttempts(sessionId: string): BreachAttempt[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.breachAttempts;
  }

  // Get keystroke pattern
  getKeystrokePattern(patternId: string): KeystrokePattern | undefined {
    return this.keystrokePatterns.get(patternId);
  }

  // Get security report
  getSecurityReport(sessionId: string): {
    sessionId: string;
    totalBreachAttempts: number;
    blockedAttempts: number;
    allowedAttempts: number;
    severity: "low" | "medium" | "high" | "critical";
    status: string;
    recommendations: string[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) return {} as any;

    const blockedAttempts = session.breachAttempts.filter(
      (b) => b.blocked,
    ).length;
    const allowedAttempts = session.breachAttempts.length - blockedAttempts;

    let severity: "low" | "medium" | "high" | "critical" = "low";
    if (blockedAttempts > 10) severity = "critical";
    else if (blockedAttempts > 5) severity = "high";
    else if (blockedAttempts > 2) severity = "medium";

    const recommendations: string[] = [];

    if (severity === "critical") {
      recommendations.push(
        "Multiple breach attempts detected - exam may be compromised",
      );
      recommendations.push("Recommend manual review and exam invalidation");
    } else if (severity === "high") {
      recommendations.push("Several suspicious activities detected");
      recommendations.push("Flag for proctor review");
    } else if (severity === "medium") {
      recommendations.push("Minor security concerns detected");
      recommendations.push("Monitor closely");
    }

    return {
      sessionId,
      totalBreachAttempts: session.breachAttempts.length,
      blockedAttempts,
      allowedAttempts,
      severity,
      status: session.status,
      recommendations,
    };
  }

  // Get all breach attempts
  getAllBreachAttempts(): BreachAttempt[] {
    return this.breachLog;
  }

  // Block action for session
  blockAction(sessionId: string, actionType: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const action = session.restrictedActions.find(
      (a) => a.action === actionType,
    );
    if (action) {
      action.allowed = false;

      this.emit("action:blocked", {
        sessionId,
        actionType,
      });
    }
  }

  // Allow action for session
  allowAction(sessionId: string, actionType: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const action = session.restrictedActions.find(
      (a) => a.action === actionType,
    );
    if (action) {
      action.allowed = true;

      this.emit("action:allowed", {
        sessionId,
        actionType,
      });
    }
  }
}

export const browserLockdownService = new BrowserLockdownService();

export default BrowserLockdownService;
