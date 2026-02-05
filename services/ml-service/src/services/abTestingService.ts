import { EventEmitter } from "events";

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  hypothesis: string;
  controlGroup: string; // variant ID
  treatmentGroups: string[]; // variant IDs
  startDate: Date;
  endDate?: Date;
  targetSampleSize: number;
  currentSampleSize: number;
  status: "planning" | "running" | "paused" | "completed" | "cancelled";
  metrics: string[]; // metric names to track
  successCriteria?: Record<string, number>; // metric -> threshold
}

export interface Variant {
  variantId: string;
  testId: string;
  name: string;
  description: string;
  isControl: boolean;
  traffic: number; // 0-100 percentage
  config: Record<string, any>;
  createdDate: Date;
}

export interface TestResult {
  testId: string;
  variantId: string;
  sampleSize: number;
  metric: string;
  value: number;
  standardError?: number;
  confidenceInterval?: { lower: number; upper: number };
  pValue?: number;
  isSignificant: boolean;
}

export interface ABTestData {
  userId: string;
  testId: string;
  variantId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  sessionDuration?: number;
  completionRate?: number;
}

export class ABTestingService extends EventEmitter {
  private tests: Map<string, ABTestConfig> = new Map();
  private variants: Map<string, Variant> = new Map();
  private testData: ABTestData[] = [];
  private results: Map<string, TestResult[]> = new Map();
  private userVariantAssignment: Map<
    string,
    { testId: string; variantId: string }
  > = new Map();

  constructor() {
    super();
  }

  // Create A/B test
  createTest(
    config: Omit<ABTestConfig, "testId" | "currentSampleSize" | "status">,
  ): ABTestConfig {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const test: ABTestConfig = {
      ...config,
      testId,
      currentSampleSize: 0,
      status: "planning",
    };

    this.tests.set(testId, test);
    this.results.set(testId, []);

    this.emit("test:created", {
      testId,
      name: test.name,
      hypothesis: test.hypothesis,
      targetSampleSize: test.targetSampleSize,
    });

    return test;
  }

  // Create variant
  createVariant(
    testId: string,
    variantName: string,
    config: Record<string, any>,
    isControl: boolean = false,
    traffic: number = 50,
  ): Variant {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const variantId = `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const variant: Variant = {
      variantId,
      testId,
      name: variantName,
      description: "",
      isControl,
      traffic,
      config,
      createdDate: new Date(),
    };

    this.variants.set(variantId, variant);

    if (isControl) {
      test.controlGroup = variantId;
    } else {
      test.treatmentGroups.push(variantId);
    }

    this.emit("variant:created", {
      variantId,
      testId,
      name: variantName,
      isControl,
      traffic,
    });

    return variant;
  }

  // Start test
  startTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error("Test not found");
    }

    test.status = "running";
    test.startDate = new Date();

    this.emit("test:started", {
      testId,
      name: test.name,
      startDate: test.startDate,
      targetSampleSize: test.targetSampleSize,
    });
  }

  // Assign variant to user
  assignVariant(
    userId: string,
    testId: string,
  ): { variantId: string; config: Record<string, any> } {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") {
      throw new Error("Test not found or not running");
    }

    // Check if user already assigned
    const key = `${userId}_${testId}`;
    const existing = this.userVariantAssignment.get(key);
    if (existing) {
      const variant = this.variants.get(existing.variantId);
      return {
        variantId: existing.variantId,
        config: variant?.config || {},
      };
    }

    // Probabilistically assign variant
    const allVariants = [test.controlGroup, ...test.treatmentGroups]
      .map((id) => this.variants.get(id)!)
      .filter((v) => v !== undefined);

    const random = Math.random() * 100;
    let cumulative = 0;
    let assignedVariant = allVariants[0];

    for (const variant of allVariants) {
      cumulative += variant.traffic;
      if (random <= cumulative) {
        assignedVariant = variant;
        break;
      }
    }

    this.userVariantAssignment.set(key, {
      testId,
      variantId: assignedVariant.variantId,
    });

    test.currentSampleSize++;

    this.emit("variant:assigned", {
      userId,
      testId,
      variantId: assignedVariant.variantId,
      variantName: assignedVariant.name,
    });

    return {
      variantId: assignedVariant.variantId,
      config: assignedVariant.config,
    };
  }

  // Track user event
  trackEvent(
    userId: string,
    testId: string,
    metric: string,
    value: number,
  ): void {
    const key = `${userId}_${testId}`;
    const assignment = this.userVariantAssignment.get(key);

    if (!assignment) {
      return; // User not assigned to test
    }

    const data: ABTestData = {
      userId,
      testId,
      variantId: assignment.variantId,
      timestamp: new Date(),
      metrics: { [metric]: value },
    };

    this.testData.push(data);

    // Check if test should be completed
    const test = this.tests.get(testId)!;
    if (test.currentSampleSize >= test.targetSampleSize) {
      this.emit("test:target-reached", {
        testId,
        name: test.name,
        sampleSize: test.currentSampleSize,
      });
    }
  }

  // Analyze test results
  analyzeTest(testId: string): TestResult[] {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const testDataForTest = this.testData.filter((d) => d.testId === testId);

    const results: TestResult[] = [];

    for (const metric of test.metrics) {
      const controlData = testDataForTest
        .filter((d) => d.variantId === test.controlGroup)
        .flatMap((d) => d.metrics[metric] || []);

      for (const treatmentId of test.treatmentGroups) {
        const treatmentData = testDataForTest
          .filter((d) => d.variantId === treatmentId)
          .flatMap((d) => d.metrics[metric] || []);

        if (controlData.length === 0 || treatmentData.length === 0) {
          continue;
        }

        // Calculate statistics
        const controlMean =
          controlData.reduce((a, b) => a + b, 0) / controlData.length;
        const treatmentMean =
          treatmentData.reduce((a, b) => a + b, 0) / treatmentData.length;

        // Calculate standard error
        const controlVar =
          controlData.reduce(
            (sum, x) => sum + Math.pow(x - controlMean, 2),
            0,
          ) / controlData.length;
        const treatmentVar =
          treatmentData.reduce(
            (sum, x) => sum + Math.pow(x - treatmentMean, 2),
            0,
          ) / treatmentData.length;

        const se = Math.sqrt(
          controlVar / controlData.length + treatmentVar / treatmentData.length,
        );

        // Calculate t-statistic
        const tStat = (treatmentMean - controlMean) / se;
        const pValue = 2 * (1 - this.normCDF(Math.abs(tStat)));

        // Calculate confidence interval
        const ci = {
          lower: treatmentMean - controlMean - 1.96 * se,
          upper: treatmentMean - controlMean + 1.96 * se,
        };

        const isSignificant = pValue < 0.05;

        const result: TestResult = {
          testId,
          variantId: treatmentId,
          sampleSize: treatmentData.length,
          metric,
          value: treatmentMean - controlMean,
          standardError: se,
          confidenceInterval: ci,
          pValue,
          isSignificant,
        };

        results.push(result);

        // Check success criteria
        if (test.successCriteria && test.successCriteria[metric]) {
          const threshold = test.successCriteria[metric];
          if (result.value > threshold) {
            this.emit("test:success-criteria-met", {
              testId,
              variant: treatmentId,
              metric,
              value: result.value,
              threshold,
            });
          }
        }
      }
    }

    this.results.set(testId, results);

    this.emit("test:analyzed", {
      testId,
      resultsCount: results.length,
      significantResults: results.filter((r) => r.isSignificant).length,
    });

    return results;
  }

  private normCDF(z: number): number {
    // Approximation of standard normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  // Get test results
  getTestResults(testId: string): TestResult[] {
    return this.results.get(testId) || [];
  }

  // End test
  endTest(testId: string, winner?: string): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error("Test not found");
    }

    test.status = "completed";
    test.endDate = new Date();

    // Analyze before marking complete
    const results = this.analyzeTest(testId);
    const significantResults = results.filter((r) => r.isSignificant);

    this.emit("test:ended", {
      testId,
      name: test.name,
      status: "completed",
      sampleSize: test.currentSampleSize,
      duration: Math.floor(
        (test.endDate.getTime() - test.startDate.getTime()) / 1000 / 60,
      ), // minutes
      significantResults: significantResults.length,
      winner,
    });
  }

  // Get test
  getTest(testId: string): ABTestConfig | undefined {
    return this.tests.get(testId);
  }

  // Get all tests
  getAllTests(): ABTestConfig[] {
    return Array.from(this.tests.values());
  }

  // Get running tests
  getRunningTests(): ABTestConfig[] {
    return Array.from(this.tests.values()).filter(
      (t) => t.status === "running",
    );
  }
}

export const abTestingService = new ABTestingService();

export default ABTestingService;
