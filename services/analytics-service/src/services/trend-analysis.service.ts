/**
 * Trend Analysis Service
 * Analyzes score trends, learning velocity, and patterns
 */

export interface TrendData {
  date: Date;
  score: number;
  examType: string;
  mode: string;
}

export interface TrendAnalysis {
  overall: {
    direction: "improving" | "declining" | "stable";
    momentum: number; // -100 to 100
    confidenceLevel: "high" | "medium" | "low";
  };
  shortTerm: {
    period: string;
    averageScore: number;
    trend: "improving" | "declining" | "stable";
  };
  longTerm: {
    period: string;
    averageScore: number;
    trend: "improving" | "declining" | "stable";
  };
  volatility: number; // 0-100 (score variance)
  peakPerformance: {
    date: Date;
    score: number;
    examType: string;
  };
  lowestPerformance: {
    date: Date;
    score: number;
    examType: string;
  };
}

export class TrendAnalysisService {
  /**
   * Calculate comprehensive trend analysis
   */
  static analyzeTrend(performanceHistory: TrendData[]): TrendAnalysis {
    if (performanceHistory.length === 0) {
      return {
        overall: {
          direction: "stable",
          momentum: 0,
          confidenceLevel: "low",
        },
        shortTerm: {
          period: "last 10 exams",
          averageScore: 0,
          trend: "stable",
        },
        longTerm: {
          period: "all time",
          averageScore: 0,
          trend: "stable",
        },
        volatility: 0,
        peakPerformance: { date: new Date(), score: 0, examType: "" },
        lowestPerformance: { date: new Date(), score: 0, examType: "" },
      };
    }

    const sortedByDate = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const shortTermExams = sortedByDate.slice(-10);
    const longTermExams = sortedByDate;

    const shortTermAvg =
      shortTermExams.reduce((sum, e) => sum + e.score, 0) /
      shortTermExams.length;
    const longTermAvg =
      longTermExams.reduce((sum, e) => sum + e.score, 0) / longTermExams.length;

    const shortTermTrend = this.calculateLinearTrend(shortTermExams);
    const longTermTrend = this.calculateLinearTrend(longTermExams);

    const overallTrend = this.calculateOverallTrend(sortedByDate);
    const momentum = this.calculateMomentum(shortTermExams);
    const volatility = this.calculateVolatility(longTermExams);

    const peak = sortedByDate.reduce((max, e) =>
      e.score > max.score ? e : max,
    );
    const lowest = sortedByDate.reduce((min, e) =>
      e.score < min.score ? e : min,
    );

    return {
      overall: {
        direction: overallTrend as any,
        momentum,
        confidenceLevel: this.getConfidenceLevel(
          sortedByDate.length,
          volatility,
        ),
      },
      shortTerm: {
        period: "last 10 exams",
        averageScore: Math.round(shortTermAvg * 100) / 100,
        trend: shortTermTrend as any,
      },
      longTerm: {
        period: "all time",
        averageScore: Math.round(longTermAvg * 100) / 100,
        trend: longTermTrend as any,
      },
      volatility: Math.round(volatility),
      peakPerformance: {
        date: peak.date,
        score: peak.score,
        examType: peak.examType,
      },
      lowestPerformance: {
        date: lowest.date,
        score: lowest.score,
        examType: lowest.examType,
      },
    };
  }

  /**
   * Calculate linear trend using least squares regression
   */
  private static calculateLinearTrend(data: TrendData[]): string {
    if (data.length < 2) return "stable";

    const n = data.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const scores = data.map((d) => d.score);

    // Calculate slope using least squares
    const xMean = indices.reduce((a, b) => a + b) / n;
    const yMean = scores.reduce((a, b) => a + b) / n;

    const numerator = indices.reduce(
      (sum, x, i) => sum + (x - xMean) * (scores[i] - yMean),
      0,
    );
    const denominator = indices.reduce(
      (sum, x) => sum + Math.pow(x - xMean, 2),
      0,
    );

    const slope = denominator > 0 ? numerator / denominator : 0;

    // Determine trend based on slope
    if (slope > 0.5) return "improving";
    if (slope < -0.5) return "declining";
    return "stable";
  }

  /**
   * Calculate overall trend direction
   */
  private static calculateOverallTrend(data: TrendData[]): string {
    if (data.length < 5) return "stable";

    const firstQuarter = data.slice(0, Math.ceil(data.length / 4));
    const lastQuarter = data.slice(-Math.ceil(data.length / 4));

    const firstAvg =
      firstQuarter.reduce((sum, e) => sum + e.score, 0) / firstQuarter.length;
    const lastAvg =
      lastQuarter.reduce((sum, e) => sum + e.score, 0) / lastQuarter.length;

    const diff = lastAvg - firstAvg;
    if (diff > 3) return "improving";
    if (diff < -3) return "declining";
    return "stable";
  }

  /**
   * Calculate momentum (recent trend strength)
   */
  private static calculateMomentum(recentData: TrendData[]): number {
    if (recentData.length < 2) return 0;

    const n = recentData.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const scores = recentData.map((d) => d.score);

    const xMean = indices.reduce((a, b) => a + b) / n;
    const yMean = scores.reduce((a, b) => a + b) / n;

    const numerator = indices.reduce(
      (sum, x, i) => sum + (x - xMean) * (scores[i] - yMean),
      0,
    );
    const denominator = indices.reduce(
      (sum, x) => sum + Math.pow(x - xMean, 2),
      0,
    );

    const slope = denominator > 0 ? numerator / denominator : 0;

    // Normalize slope to -100 to 100 range
    const maxSlope = 100 / (n - 1);
    const momentum = (slope / maxSlope) * 100;

    return Math.max(-100, Math.min(100, Math.round(momentum)));
  }

  /**
   * Calculate score volatility (variance)
   */
  private static calculateVolatility(data: TrendData[]): number {
    if (data.length < 2) return 0;

    const mean = data.reduce((sum, e) => sum + e.score, 0) / data.length;
    const variance =
      data.reduce((sum, e) => sum + Math.pow(e.score - mean, 2), 0) /
      data.length;

    const stdDev = Math.sqrt(variance);

    // Normalize to 0-100 scale
    const volatility = Math.min(100, stdDev * 2); // Higher std dev = higher volatility

    return volatility;
  }

  /**
   * Determine confidence level based on data points and volatility
   */
  private static getConfidenceLevel(
    dataPoints: number,
    volatility: number,
  ): "high" | "medium" | "low" {
    if (dataPoints < 5 || volatility > 30) return "low";
    if (dataPoints < 15 || volatility > 20) return "medium";
    return "high";
  }

  /**
   * Calculate learning velocity (score improvement rate)
   */
  static calculateLearningVelocity(
    performanceHistory: TrendData[],
    windowSize: number = 10,
  ): {
    ratePerDay: number;
    ratePerExam: number;
    projectedImprovement30Days: number;
  } {
    if (performanceHistory.length < 2) {
      return {
        ratePerDay: 0,
        ratePerExam: 0,
        projectedImprovement30Days: 0,
      };
    }

    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const window = sorted.slice(-windowSize);

    // Rate per exam
    const firstScore = window[0].score;
    const lastScore = window[window.length - 1].score;
    const ratePerExam = (lastScore - firstScore) / (window.length - 1);

    // Rate per day
    const firstDate = new Date(window[0].date);
    const lastDate = new Date(window[window.length - 1].date);
    const daysDiff =
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const ratePerDay = daysDiff > 0 ? (lastScore - firstScore) / daysDiff : 0;

    // Projected improvement in 30 days
    const projectedImprovement30Days = Math.max(
      0,
      Math.min(100, lastScore + ratePerDay * 30),
    );

    return {
      ratePerDay: Math.round(ratePerDay * 100) / 100,
      ratePerExam: Math.round(ratePerExam * 100) / 100,
      projectedImprovement30Days: Math.round(projectedImprovement30Days),
    };
  }

  /**
   * Identify performance patterns
   */
  static identifyPatterns(performanceHistory: TrendData[]): {
    bestTimeOfDay?: string;
    bestDayOfWeek?: string;
    bestExamType?: string;
    bestMode?: string;
    averageScoreAtPeak: number;
  } {
    if (performanceHistory.length === 0) {
      return {
        averageScoreAtPeak: 0,
      };
    }

    // Group by exam type and mode
    const byExamType: Record<string, number[]> = {};
    const byMode: Record<string, number[]> = {};

    for (const exam of performanceHistory) {
      if (!byExamType[exam.examType]) {
        byExamType[exam.examType] = [];
      }
      byExamType[exam.examType].push(exam.score);

      if (!byMode[exam.mode]) {
        byMode[exam.mode] = [];
      }
      byMode[exam.mode].push(exam.score);
    }

    // Find best exam type
    let bestExamType = "";
    let bestExamTypeAvg = 0;
    for (const [type, scores] of Object.entries(byExamType)) {
      const avg = scores.reduce((a, b) => a + b) / scores.length;
      if (avg > bestExamTypeAvg) {
        bestExamTypeAvg = avg;
        bestExamType = type;
      }
    }

    // Find best mode
    let bestMode = "";
    let bestModeAvg = 0;
    for (const [mode, scores] of Object.entries(byMode)) {
      const avg = scores.reduce((a, b) => a + b) / scores.length;
      if (avg > bestModeAvg) {
        bestModeAvg = avg;
        bestMode = mode;
      }
    }

    const averageScoreAtPeak =
      Math.round(
        (performanceHistory.reduce((sum, e) => sum + e.score, 0) /
          performanceHistory.length) *
          100,
      ) / 100;

    return {
      bestExamType,
      bestMode,
      averageScoreAtPeak,
    };
  }

  /**
   * Generate trend report
   */
  static generateTrendReport(performanceHistory: TrendData[]): {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  } {
    if (performanceHistory.length === 0) {
      return {
        summary: "No exams attempted yet",
        strengths: [],
        concerns: ["Start taking exams to build your analytics profile"],
        recommendations: ["Take your first exam to get started"],
      };
    }

    const analysis = this.analyzeTrend(performanceHistory);
    const velocity = this.calculateLearningVelocity(performanceHistory);
    const patterns = this.identifyPatterns(performanceHistory);

    const summary = `Your overall performance is ${analysis.overall.direction}, with a momentum of ${analysis.overall.momentum}. You're improving at a rate of ${velocity.ratePerDay}% per day.`;

    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Build feedback based on analysis
    if (analysis.overall.direction === "improving") {
      strengths.push("Your performance is trending upward");
      if (velocity.ratePerDay > 1) {
        strengths.push("You are making excellent progress");
        recommendations.push("Maintain your current study pace");
      }
    } else if (analysis.overall.direction === "declining") {
      concerns.push("Your performance is declining");
      recommendations.push("Review your study strategy");
      recommendations.push("Focus on weak areas");
    } else {
      concerns.push("Your performance has plateaued");
      recommendations.push("Challenge yourself with more difficult questions");
      recommendations.push("Try different study methods");
    }

    if (analysis.volatility > 30) {
      concerns.push("Your scores are inconsistent");
      recommendations.push("Practice more to improve consistency");
    } else {
      strengths.push("Your performance is consistent");
    }

    if (patterns.bestMode) {
      strengths.push(`You perform best in ${patterns.bestMode} mode`);
      recommendations.push(
        `Focus on ${patterns.bestMode} mode for better results`,
      );
    }

    return {
      summary,
      strengths,
      concerns,
      recommendations,
    };
  }
}

export default TrendAnalysisService;
