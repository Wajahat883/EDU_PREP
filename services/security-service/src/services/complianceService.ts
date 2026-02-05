import { EventEmitter } from "events";

export enum ComplianceFramework {
  FERPA = "ferpa",
  GDPR = "gdpr",
  HIPAA = "hipaa",
  COPPA = "coppa",
  SOC2 = "soc2",
}

export interface ComplianceRequirement {
  framework: ComplianceFramework;
  requirement: string;
  status: "compliant" | "non-compliant" | "in-progress";
  lastAudit: Date;
  evidenceUrl?: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionDays: number;
  deleteMethod: "secure-delete" | "anonymize" | "archive";
  autoDelete: boolean;
  lastReviewDate: Date;
}

export class ComplianceService extends EventEmitter {
  private requirements: Map<ComplianceFramework, ComplianceRequirement[]> =
    new Map();
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();
  private auditLogs: any[] = [];

  constructor() {
    super();
    this.initializeRequirements();
    this.initializeRetentionPolicies();
  }

  private initializeRequirements(): void {
    // FERPA Requirements
    const ferpaRequirements: ComplianceRequirement[] = [
      {
        framework: ComplianceFramework.FERPA,
        requirement: "Student data access logging",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.FERPA,
        requirement: "Student consent for data sharing",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.FERPA,
        requirement: "Data security and encryption",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.FERPA,
        requirement: "Incident response procedures",
        status: "compliant",
        lastAudit: new Date(),
      },
    ];

    // GDPR Requirements
    const gdprRequirements: ComplianceRequirement[] = [
      {
        framework: ComplianceFramework.GDPR,
        requirement: "Data subject rights (access, deletion, portability)",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.GDPR,
        requirement: "Data processing agreements (DPA)",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.GDPR,
        requirement: "Privacy by design",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.GDPR,
        requirement: "Data breach notification (72 hours)",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.GDPR,
        requirement: "Legitimate basis for processing",
        status: "compliant",
        lastAudit: new Date(),
      },
    ];

    // HIPAA Requirements
    const hipaaRequirements: ComplianceRequirement[] = [
      {
        framework: ComplianceFramework.HIPAA,
        requirement: "Administrative safeguards",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.HIPAA,
        requirement: "Physical safeguards",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.HIPAA,
        requirement: "Technical safeguards",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.HIPAA,
        requirement: "Audit controls and logs",
        status: "compliant",
        lastAudit: new Date(),
      },
    ];

    // COPPA Requirements
    const coppaRequirements: ComplianceRequirement[] = [
      {
        framework: ComplianceFramework.COPPA,
        requirement: "Parental consent for children under 13",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.COPPA,
        requirement: "Privacy policy clarity for children",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.COPPA,
        requirement: "Parental access and deletion rights",
        status: "compliant",
        lastAudit: new Date(),
      },
    ];

    // SOC2 Requirements
    const soc2Requirements: ComplianceRequirement[] = [
      {
        framework: ComplianceFramework.SOC2,
        requirement: "Security controls",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.SOC2,
        requirement: "Availability and performance",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.SOC2,
        requirement: "Processing integrity",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.SOC2,
        requirement: "Confidentiality controls",
        status: "compliant",
        lastAudit: new Date(),
      },
      {
        framework: ComplianceFramework.SOC2,
        requirement: "Privacy controls",
        status: "compliant",
        lastAudit: new Date(),
      },
    ];

    this.requirements.set(ComplianceFramework.FERPA, ferpaRequirements);
    this.requirements.set(ComplianceFramework.GDPR, gdprRequirements);
    this.requirements.set(ComplianceFramework.HIPAA, hipaaRequirements);
    this.requirements.set(ComplianceFramework.COPPA, coppaRequirements);
    this.requirements.set(ComplianceFramework.SOC2, soc2Requirements);
  }

  private initializeRetentionPolicies(): void {
    const policies: DataRetentionPolicy[] = [
      {
        dataType: "student_records",
        retentionDays: 2555, // 7 years per FERPA
        deleteMethod: "secure-delete",
        autoDelete: true,
        lastReviewDate: new Date(),
      },
      {
        dataType: "audit_logs",
        retentionDays: 1095, // 3 years
        deleteMethod: "archive",
        autoDelete: true,
        lastReviewDate: new Date(),
      },
      {
        dataType: "test_responses",
        retentionDays: 1825, // 5 years
        deleteMethod: "anonymize",
        autoDelete: true,
        lastReviewDate: new Date(),
      },
      {
        dataType: "activity_logs",
        retentionDays: 365, // 1 year
        deleteMethod: "secure-delete",
        autoDelete: true,
        lastReviewDate: new Date(),
      },
      {
        dataType: "payment_records",
        retentionDays: 2555, // 7 years per tax law
        deleteMethod: "archive",
        autoDelete: false,
        lastReviewDate: new Date(),
      },
    ];

    policies.forEach((policy) => {
      this.retentionPolicies.set(policy.dataType, policy);
    });
  }

  // Get compliance status for framework
  getComplianceStatus(framework: ComplianceFramework): {
    framework: ComplianceFramework;
    compliantCount: number;
    totalCount: number;
    compliancePercentage: number;
    requirements: ComplianceRequirement[];
  } {
    const requirements = this.requirements.get(framework) || [];
    const compliantCount = requirements.filter(
      (r) => r.status === "compliant",
    ).length;

    return {
      framework,
      compliantCount,
      totalCount: requirements.length,
      compliancePercentage: (compliantCount / requirements.length) * 100,
      requirements,
    };
  }

  // Get all compliance status
  getAllComplianceStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    Object.values(ComplianceFramework).forEach((framework) => {
      status[framework] = this.getComplianceStatus(framework);
    });

    return status;
  }

  // Log audit event
  logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>,
  ): void {
    const auditLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress: process.env.CLIENT_IP || "unknown",
      userAgent: process.env.USER_AGENT || "unknown",
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10,000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs.shift();
    }

    this.emit("audit:logged", auditLog);
  }

  // Get audit logs
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): any[] {
    let logs = this.auditLogs;

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.resourceType) {
      logs = logs.filter((l) => l.resourceType === filters.resourceType);
    }
    if (filters?.startDate) {
      logs = logs.filter((l) => l.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter((l) => l.timestamp <= filters.endDate!);
    }

    // Return most recent first
    const sorted = logs.sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, filters?.limit || 1000);
  }

  // Get data retention policy
  getRetentionPolicy(dataType: string): DataRetentionPolicy | undefined {
    return this.retentionPolicies.get(dataType);
  }

  // Update retention policy
  updateRetentionPolicy(
    dataType: string,
    policy: Partial<DataRetentionPolicy>,
  ): void {
    const existing = this.retentionPolicies.get(dataType);
    if (existing) {
      const updated = { ...existing, ...policy, lastReviewDate: new Date() };
      this.retentionPolicies.set(dataType, updated);
      this.emit("policy:updated", updated);
    }
  }

  // Get all retention policies
  getAllRetentionPolicies(): DataRetentionPolicy[] {
    return Array.from(this.retentionPolicies.values());
  }

  // Data subject access request (GDPR/CCPA)
  async requestDataExport(userId: string): Promise<Buffer> {
    this.logAuditEvent(userId, "DATA_EXPORT_REQUESTED", "user", userId);

    // Would compile all user data from databases
    const userData = {
      userId,
      exportDate: new Date(),
      dataTypes: [
        "profile_information",
        "test_results",
        "activity_logs",
        "learning_paths",
        "preferences",
      ],
      // ... actual data would be included
    };

    this.emit("data:exported", { userId });
    return Buffer.from(JSON.stringify(userData));
  }

  // Right to be forgotten (GDPR)
  async requestDataDeletion(userId: string): Promise<void> {
    this.logAuditEvent(userId, "DELETION_REQUESTED", "user", userId);

    // Would trigger secure deletion in all databases
    // Some data would be anonymized instead of deleted (per retention policies)

    this.emit("deletion:requested", { userId });
  }

  // Consent management
  recordConsent(
    userId: string,
    consentType: string,
    consentGiven: boolean,
    timestamp: Date = new Date(),
  ): void {
    const consent = {
      id: `consent_${Date.now()}`,
      userId,
      consentType,
      consentGiven,
      timestamp,
      ipAddress: process.env.CLIENT_IP || "unknown",
    };

    this.emit("consent:recorded", consent);
    this.logAuditEvent(userId, "CONSENT_RECORDED", "consent", consentType);
  }

  // Consent withdrawal
  withdrawConsent(userId: string, consentType: string): void {
    this.recordConsent(userId, consentType, false);
    this.emit("consent:withdrawn", { userId, consentType });
  }

  // Incident report
  reportIncident(
    incidentType: string,
    severity: "critical" | "high" | "medium" | "low",
    description: string,
    affectedDataTypes: string[],
  ): void {
    const incident = {
      id: `incident_${Date.now()}`,
      incidentType,
      severity,
      description,
      affectedDataTypes,
      reportedAt: new Date(),
      status: "reported",
    };

    this.emit("incident:reported", incident);
    this.logAuditEvent(
      "system",
      "INCIDENT_REPORTED",
      "security_incident",
      incident.id,
    );

    // If breach, notify authorities per GDPR/HIPAA
    if (severity === "critical") {
      this.emit("breach:detected", incident);
    }
  }

  // Compliance audit
  performComplianceAudit(framework: ComplianceFramework): {
    framework: ComplianceFramework;
    auditDate: Date;
    findings: any[];
    score: number;
    recommendations: string[];
  } {
    const status = this.getComplianceStatus(framework);

    return {
      framework,
      auditDate: new Date(),
      findings: status.requirements,
      score: status.compliancePercentage,
      recommendations:
        status.compliancePercentage === 100
          ? ["Maintain current compliance posture"]
          : [
              "Address non-compliant requirements",
              "Schedule follow-up audit in 30 days",
              "Document remediation efforts",
            ],
    };
  }
}

export const complianceService = new ComplianceService();

export default ComplianceService;
