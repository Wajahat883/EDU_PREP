import { EventEmitter } from "events";

export type AccessibilityFeature =
  | "screen-reader"
  | "text-to-speech"
  | "speech-to-text"
  | "captions"
  | "transcripts"
  | "high-contrast"
  | "dyslexia-friendly"
  | "keyboard-nav"
  | "font-size"
  | "color-blind-mode";

export interface AccessibilityPreference {
  userId: string;
  enabledFeatures: AccessibilityFeature[];
  fontSizeMultiplier: number; // 0.75 - 2.0
  contrastLevel: "normal" | "high" | "maximum";
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  dyslexiaFriendly: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  lineHeight: "normal" | "loose" | "very-loose";
  screenReaderMode: boolean;
  keyboardNavOnly: boolean;
  reduceMotion: boolean;
  focusIndicatorSize: "thin" | "normal" | "thick";
  lastUpdated: Date;
}

export interface AccessibilityAuditResult {
  pageUrl: string;
  timestamp: Date;
  wcagLevel: "A" | "AA" | "AAA";
  issues: Array<{
    id: string;
    criterion: string;
    severity: "error" | "warning" | "notice";
    description: string;
    element?: string;
    remediation: string;
  }>;
  score: number; // 0-100
  totalIssues: number;
  criticalIssues: number;
}

export interface AccessibilityReport {
  reportId: string;
  userId: string;
  feature: AccessibilityFeature;
  usageTime: number; // minutes
  successRate: number; // 0-100
  issuesEncountered: string[];
  feedbackRating: number; // 1-5
  timestamp: Date;
}

export class AccessibilityService extends EventEmitter {
  private userPreferences: Map<string, AccessibilityPreference> = new Map();
  private auditResults: Map<string, AccessibilityAuditResult> = new Map();
  private usageReports: AccessibilityReport[] = [];
  private wcagCriteria: Map<string, string> = new Map();

  constructor() {
    super();
    this.initializeWCAGCriteria();
  }

  private initializeWCAGCriteria(): void {
    // WCAG 2.1 AAA Criteria
    const criteria = [
      // Perceivable
      "1.1.1 Non-text Content (A)",
      "1.2.1 Audio-only and Video-only (Prerecorded) (A)",
      "1.2.2 Captions (Prerecorded) (A)",
      "1.2.3 Audio Description or Media Alternative (Prerecorded) (A)",
      "1.2.4 Captions (Live) (AA)",
      "1.2.5 Audio Description (Prerecorded) (AA)",
      "1.2.6 Sign Language (Prerecorded) (AAA)",
      "1.2.7 Extended Audio Description (Prerecorded) (AAA)",
      "1.2.8 Media Alternative (Prerecorded) (AAA)",
      "1.2.9 Audio-only (Live) (AAA)",
      "1.3.1 Info and Relationships (A)",
      "1.3.2 Meaningful Sequence (A)",
      "1.3.3 Sensory Characteristics (A)",
      "1.3.4 Orientation (AA)",
      "1.3.5 Identify Input Purpose (AA)",
      "1.3.6 Identify Purpose (AAA)",
      "1.4.1 Use of Color (A)",
      "1.4.2 Audio Control (A)",
      "1.4.3 Contrast (Minimum) (AA)",
      "1.4.4 Resize Text (AA)",
      "1.4.5 Images of Text (AA)",
      "1.4.6 Contrast (Enhanced) (AAA)",
      "1.4.7 Low or No Background Audio (AAA)",
      "1.4.8 Visual Presentation (AAA)",
      "1.4.9 Images of Text (No Exception) (AAA)",
      "1.4.10 Reflow (AA)",
      "1.4.11 Non-text Contrast (AA)",
      "1.4.12 Text Spacing (AA)",
      "1.4.13 Content on Hover or Focus (AA)",
      // Operable
      "2.1.1 Keyboard (A)",
      "2.1.2 No Keyboard Trap (A)",
      "2.1.3 Keyboard (No Exception) (AAA)",
      "2.1.4 Character Key Shortcuts (A)",
      "2.2.1 Timing Adjustable (A)",
      "2.2.2 Pause, Stop, Hide (A)",
      "2.2.3 No Timing (AAA)",
      "2.2.4 Interruptions (AAA)",
      "2.2.5 Re-authenticating (AAA)",
      "2.2.6 Timeouts (AAA)",
      "2.3.1 Three Flashes or Below (A)",
      "2.3.2 Three Flashes (AAA)",
      "2.3.3 Animation from Interactions (AAA)",
      "2.4.1 Bypass Blocks (A)",
      "2.4.2 Page Titled (A)",
      "2.4.3 Focus Order (A)",
      "2.4.4 Link Purpose (In Context) (A)",
      "2.4.5 Multiple Ways (AA)",
      "2.4.6 Headings and Labels (AA)",
      "2.4.7 Focus Visible (AA)",
      "2.4.8 Focus Visible (Enhanced) (AAA)",
      "2.4.9 Link Purpose (Link Only) (AAA)",
      "2.4.10 Section Headings (AAA)",
      "2.5.1 Pointer Gestures (A)",
      "2.5.2 Pointer Cancellation (A)",
      "2.5.3 Label in Name (A)",
      "2.5.4 Motion Actuation (A)",
      "2.5.5 Target Size (Enhanced) (AAA)",
      "2.5.6 Concurrent Input Mechanisms (AAA)",
      // Understandable
      "3.1.1 Language of Page (A)",
      "3.1.2 Language of Parts (AA)",
      "3.1.3 Unusual Words (AAA)",
      "3.1.4 Abbreviations (AAA)",
      "3.1.5 Reading Level (AAA)",
      "3.1.6 Pronunciation (AAA)",
      "3.2.1 On Focus (A)",
      "3.2.2 On Input (A)",
      "3.2.3 Consistent Navigation (AA)",
      "3.2.4 Consistent Identification (AA)",
      "3.2.5 Change on Request (AAA)",
      "3.3.1 Error Identification (A)",
      "3.3.2 Labels or Instructions (A)",
      "3.3.3 Error Suggestion (AA)",
      "3.3.4 Error Prevention (Legal, Financial, Data) (AA)",
      "3.3.5 Help (AAA)",
      "3.3.6 Error Prevention (All) (AAA)",
      // Robust
      "4.1.1 Parsing (A)",
      "4.1.2 Name, Role, Value (A)",
      "4.1.3 Status Messages (AA)",
    ];

    criteria.forEach((c) => {
      const key = c.split(" ")[0];
      this.wcagCriteria.set(key, c);
    });
  }

  // Initialize user accessibility preferences
  initializeAccessibilityPreference(userId: string): AccessibilityPreference {
    const pref: AccessibilityPreference = {
      userId,
      enabledFeatures: [],
      fontSizeMultiplier: 1.0,
      contrastLevel: "normal",
      colorBlindMode: "none",
      dyslexiaFriendly: false,
      fontSize: "medium",
      lineHeight: "normal",
      screenReaderMode: false,
      keyboardNavOnly: false,
      reduceMotion: false,
      focusIndicatorSize: "normal",
      lastUpdated: new Date(),
    };

    this.userPreferences.set(userId, pref);
    return pref;
  }

  // Get user preferences
  getUserPreference(userId: string): AccessibilityPreference {
    return (
      this.userPreferences.get(userId) ||
      this.initializeAccessibilityPreference(userId)
    );
  }

  // Update user preferences
  updateUserPreference(
    userId: string,
    updates: Partial<AccessibilityPreference>,
  ): void {
    let pref = this.getUserPreference(userId);

    pref = {
      ...pref,
      ...updates,
      userId,
      lastUpdated: new Date(),
    };

    this.userPreferences.set(userId, pref);

    this.emit("preference:updated", {
      userId,
      features: pref.enabledFeatures,
      contrastLevel: pref.contrastLevel,
    });
  }

  // Enable accessibility feature
  enableFeature(userId: string, feature: AccessibilityFeature): void {
    const pref = this.getUserPreference(userId);

    if (!pref.enabledFeatures.includes(feature)) {
      pref.enabledFeatures.push(feature);
      pref.lastUpdated = new Date();

      this.emit("feature:enabled", {
        userId,
        feature,
        enabledFeatures: pref.enabledFeatures,
      });
    }
  }

  // Disable accessibility feature
  disableFeature(userId: string, feature: AccessibilityFeature): void {
    const pref = this.getUserPreference(userId);

    const index = pref.enabledFeatures.indexOf(feature);
    if (index > -1) {
      pref.enabledFeatures.splice(index, 1);
      pref.lastUpdated = new Date();

      this.emit("feature:disabled", {
        userId,
        feature,
        enabledFeatures: pref.enabledFeatures,
      });
    }
  }

  // Set font size
  setFontSize(
    userId: string,
    size: "small" | "medium" | "large" | "extra-large",
  ): void {
    const pref = this.getUserPreference(userId);

    const multipliers: Record<string, number> = {
      small: 0.75,
      medium: 1.0,
      large: 1.25,
      "extra-large": 1.5,
    };

    pref.fontSize = size;
    pref.fontSizeMultiplier = multipliers[size];
    pref.lastUpdated = new Date();

    this.emit("font-size:changed", {
      userId,
      size,
      multiplier: pref.fontSizeMultiplier,
    });
  }

  // Set color blind mode
  setColorBlindMode(
    userId: string,
    mode: "none" | "protanopia" | "deuteranopia" | "tritanopia",
  ): void {
    const pref = this.getUserPreference(userId);

    pref.colorBlindMode = mode;
    pref.lastUpdated = new Date();

    if (mode !== "none") {
      pref.contrastLevel = "high"; // Auto-enable high contrast for color blind users
    }

    this.emit("color-blind-mode:changed", {
      userId,
      mode,
    });
  }

  // Run accessibility audit
  runAccessibilityAudit(
    pageUrl: string,
    wcagLevel: "A" | "AA" | "AAA" = "AA",
  ): AccessibilityAuditResult {
    const resultId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const issues: AccessibilityAuditResult["issues"] = [];

    // Simulate audit checks
    const checks = [
      {
        criterion: "1.1.1",
        severity: "error" as const,
        description: "Image missing alt text",
        remediation: "Add descriptive alt text to all images",
      },
      {
        criterion: "2.1.1",
        severity: "error" as const,
        description: "Page not keyboard accessible",
        remediation: "Ensure all interactive elements are keyboard accessible",
      },
      {
        criterion: "1.4.3",
        severity: "warning" as const,
        description: "Low contrast text",
        remediation: "Increase contrast ratio to at least 4.5:1",
      },
      {
        criterion: "2.4.2",
        severity: "error" as const,
        description: "Page title missing or not descriptive",
        remediation: "Add descriptive page title",
      },
      {
        criterion: "1.2.2",
        severity: "warning" as const,
        description: "Video missing captions",
        remediation: "Add captions to all video content",
      },
    ];

    // Filter by WCAG level
    let filteredChecks = checks;
    if (wcagLevel === "A") {
      filteredChecks = checks.filter((c) => c.severity === "error");
    } else if (wcagLevel === "AA") {
      filteredChecks = checks.filter((c) => c.severity !== "notice");
    }

    // Randomly include/exclude some issues to simulate real audits
    for (let i = 0; i < filteredChecks.length; i++) {
      if (Math.random() > 0.3) {
        // 70% chance to include
        issues.push({
          id: `issue_${i}`,
          criterion: filteredChecks[i].criterion,
          severity: filteredChecks[i].severity,
          description: filteredChecks[i].description,
          remediation: filteredChecks[i].remediation,
        });
      }
    }

    const criticalIssues = issues.filter((i) => i.severity === "error").length;
    const score = Math.max(
      0,
      100 - criticalIssues * 15 - (issues.length - criticalIssues) * 5,
    );

    const result: AccessibilityAuditResult = {
      pageUrl,
      timestamp: new Date(),
      wcagLevel,
      issues,
      score,
      totalIssues: issues.length,
      criticalIssues,
    };

    this.auditResults.set(resultId, result);

    this.emit("audit:completed", {
      pageUrl,
      score,
      issues: issues.length,
      criticalIssues,
    });

    return result;
  }

  // Report accessibility usage
  reportUsage(
    userId: string,
    feature: AccessibilityFeature,
    usageTime: number,
    successRate: number,
    issuesEncountered?: string[],
    feedbackRating?: number,
  ): void {
    const report: AccessibilityReport = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      feature,
      usageTime,
      successRate,
      issuesEncountered: issuesEncountered || [],
      feedbackRating: feedbackRating || 3,
      timestamp: new Date(),
    };

    this.usageReports.push(report);

    this.emit("usage:reported", {
      userId,
      feature,
      usageTime,
      successRate,
      rating: feedbackRating,
    });
  }

  // Get accessibility analytics
  getAccessibilityAnalytics(): {
    totalUsers: number;
    usersWithAccessibility: number;
    mostUsedFeatures: Array<{
      feature: AccessibilityFeature;
      usageCount: number;
    }>;
    averageSuccessRate: number;
    auditScore: number;
  } {
    const usersWithFeatures = new Set(
      Array.from(this.userPreferences.values())
        .filter((p) => p.enabledFeatures.length > 0)
        .map((p) => p.userId),
    );

    const featureCounts = new Map<AccessibilityFeature, number>();
    const allReports = this.usageReports;

    allReports.forEach((r) => {
      featureCounts.set(r.feature, (featureCounts.get(r.feature) || 0) + 1);
    });

    const mostUsedFeatures = Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, usageCount: count }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const averageSuccessRate =
      allReports.length > 0
        ? allReports.reduce((sum, r) => sum + r.successRate, 0) /
          allReports.length
        : 0;

    const auditScores = Array.from(this.auditResults.values()).map(
      (a) => a.score,
    );
    const auditScore =
      auditScores.length > 0
        ? auditScores.reduce((a, b) => a + b, 0) / auditScores.length
        : 0;

    return {
      totalUsers: this.userPreferences.size,
      usersWithAccessibility: usersWithFeatures.size,
      mostUsedFeatures,
      averageSuccessRate,
      auditScore,
    };
  }

  // Get audit results by WCAG level
  getAuditResultsByLevel(
    wcagLevel: "A" | "AA" | "AAA",
  ): AccessibilityAuditResult[] {
    return Array.from(this.auditResults.values()).filter(
      (r) => r.wcagLevel === wcagLevel,
    );
  }

  // Get WCAG criteria
  getWCAGCriteria(): Map<string, string> {
    return this.wcagCriteria;
  }
}

export const accessibilityService = new AccessibilityService();

export default AccessibilityService;
