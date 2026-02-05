/**
 * Prediction Service
 * Predicts future performance based on historical trends
 */

export interface ScorePrediction {
  predictedScore: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  timeframe: string;
  recommendation: string;
}

export interface PerformanceProjection {
  days: number;
  projectedScore: number;
}

export class PredictionService {
  /**
   * Predict score 30 days from now using linear regression
   */
  static predict30DayScore(
    performanceHistory: { date: Date; score: number }[],
  ): ScorePrediction {
    if (performanceHistory.length < 2) {
      return {
        predictedScore: 0,
        confidenceInterval: { low: 0, high: 0 },
        timeframe: "30 days",
        recommendation: "Complete more exams to generate accurate predictions",
      };
    }

    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Linear regression: score = a + b*days
    const n = sorted.length;
    const startDate = new Date(sorted[0].date);
    const xValues = sorted.map(
      (exam) =>
        (new Date(exam.date).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const yValues = sorted.map((exam) => exam.score);

    const xMean = xValues.reduce((a, b) => a + b) / n;
    const yMean = yValues.reduce((a, b) => a + b) / n;

    const numerator = xValues.reduce(
      (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
      0,
    );
    const denominator = xValues.reduce(
      (sum, x) => sum + Math.pow(x - xMean, 2),
      0,
    );

    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Predict 30 days from now
    const daysSinceStart = xValues[n - 1];
    const daysSince30 = daysSinceStart + 30;
    const predictedScore = Math.max(
      0,
      Math.min(100, intercept + slope * daysSince30),
    );

    // Calculate confidence interval based on residuals
    const residuals = yValues.map((y, i) =>
      Math.abs(y - (intercept + slope * xValues[i])),
    );
    const stdError = Math.sqrt(
      residuals.reduce((sum, r) => sum + Math.pow(r, 2), 0) / (n - 2),
    );

    const confidenceMargin = 1.96 * stdError; // 95% confidence interval

    // Adjust confidence interval to stay within 0-100 bounds
    const low = Math.max(0, predictedScore - confidenceMargin);
    const high = Math.min(100, predictedScore + confidenceMargin);

    // Generate recommendation
    const currentScore = yValues[n - 1];
    const improvement = predictedScore - currentScore;
    let recommendation = "";

    if (improvement > 5) {
      recommendation =
        "Keep up your current study routine for continued improvement";
    } else if (improvement > 0) {
      recommendation =
        "You're on the right track, but consider increasing study time for faster progress";
    } else if (improvement > -5) {
      recommendation = "Your progress has plateaued; try new study strategies";
    } else {
      recommendation = "Consider a significant change in your study approach";
    }

    return {
      predictedScore: Math.round(predictedScore * 100) / 100,
      confidenceInterval: {
        low: Math.round(low * 100) / 100,
        high: Math.round(high * 100) / 100,
      },
      timeframe: "30 days",
      recommendation,
    };
  }

  /**
   * Generate score projections for next 30 days
   */
  static generateScoreProjection(
    performanceHistory: { date: Date; score: number }[],
    days: number = 30,
    interval: number = 3,
  ): PerformanceProjection[] {
    if (performanceHistory.length < 2) {
      return [];
    }

    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const n = sorted.length;
    const startDate = new Date(sorted[0].date);
    const xValues = sorted.map(
      (exam) =>
        (new Date(exam.date).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const yValues = sorted.map((exam) => exam.score);

    const xMean = xValues.reduce((a, b) => a + b) / n;
    const yMean = yValues.reduce((a, b) => a + b) / n;

    const numerator = xValues.reduce(
      (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
      0,
    );
    const denominator = xValues.reduce(
      (sum, x) => sum + Math.pow(x - xMean, 2),
      0,
    );

    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    const projections: PerformanceProjection[] = [];
    const lastXValue = xValues[n - 1];

    for (let i = interval; i <= days; i += interval) {
      const projectedX = lastXValue + i;
      const projectedScore = Math.max(
        0,
        Math.min(100, intercept + slope * projectedX),
      );

      projections.push({
        days: i,
        projectedScore: Math.round(projectedScore * 100) / 100,
      });
    }

    return projections;
  }

  /**
   * Calculate score ceiling (maximum realistic score)
   */
  static calculateScoreCeiling(performanceHistory: { score: number }[]): {
    ceiling: number;
    confidence: number;
  } {
    if (performanceHistory.length === 0) {
      return { ceiling: 100, confidence: 0 };
    }

    const scores = performanceHistory.map((e) => e.score).sort((a, b) => b - a);
    const topScores = scores.slice(
      0,
      Math.max(3, Math.ceil(scores.length * 0.1)),
    );
    const average = topScores.reduce((a, b) => a + b) / topScores.length;

    // Ceiling is slightly above the average of top scores
    const ceiling = Math.min(100, average + 5);

    // Confidence based on how many top performances exist
    const confidence = Math.min(1, topScores.length / 5);

    return {
      ceiling: Math.round(ceiling * 100) / 100,
      confidence: Math.round(confidence * 100),
    };
  }

  /**
   * Calculate study time ROI (return on investment)
   */
  static calculateStudyTimeROI(
    performanceHistory: { score: number; studyTimeMinutes: number }[],
  ): {
    scorePerHour: number;
    ROI: number;
    recommendation: string;
  } {
    if (performanceHistory.length === 0) {
      return {
        scorePerHour: 0,
        ROI: 0,
        recommendation: "Start studying to measure ROI",
      };
    }

    const totalStudyTimeHours =
      performanceHistory.reduce(
        (sum, e) => sum + (e.studyTimeMinutes || 0),
        0,
      ) / 60;

    if (totalStudyTimeHours === 0) {
      return {
        scorePerHour: 0,
        ROI: 0,
        recommendation: "Track study time to measure ROI",
      };
    }

    const scoreImprovement =
      performanceHistory.length > 1
        ? performanceHistory[performanceHistory.length - 1].score -
          performanceHistory[0].score
        : 0;

    const scorePerHour = scoreImprovement / totalStudyTimeHours;

    // ROI calculation: (improvement / initial score * investment)
    const initialScore = performanceHistory[0].score || 50;
    const roi = initialScore > 0 ? (scoreImprovement / initialScore) * 100 : 0;

    let recommendation = "";
    if (scorePerHour > 2) {
      recommendation = "Excellent ROI - Continue your current study strategy";
    } else if (scorePerHour > 1) {
      recommendation = "Good ROI - Your study time is paying off";
    } else if (scorePerHour > 0) {
      recommendation = "Moderate ROI - Consider optimizing your study methods";
    } else {
      recommendation = "Low ROI - Try different study approaches";
    }

    return {
      scorePerHour: Math.round(scorePerHour * 100) / 100,
      ROI: Math.round(roi * 100) / 100,
      recommendation,
    };
  }

  /**
   * Predict time to reach target score
   */
  static predictTimeToTargetScore(
    performanceHistory: { date: Date; score: number }[],
    targetScore: number,
  ): {
    daysToTarget: number;
    targetDate: Date;
    confidence: string;
    isAchievable: boolean;
  } {
    if (performanceHistory.length < 2) {
      return {
        daysToTarget: -1,
        targetDate: new Date(),
        confidence: "very low",
        isAchievable: false,
      };
    }

    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const n = sorted.length;
    const startDate = new Date(sorted[0].date);
    const xValues = sorted.map(
      (exam) =>
        (new Date(exam.date).getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const yValues = sorted.map((exam) => exam.score);

    const xMean = xValues.reduce((a, b) => a + b) / n;
    const yMean = yValues.reduce((a, b) => a + b) / n;

    const numerator = xValues.reduce(
      (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
      0,
    );
    const denominator = xValues.reduce(
      (sum, x) => sum + Math.pow(x - xMean, 2),
      0,
    );

    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    const currentScore = yValues[n - 1];
    const lastX = xValues[n - 1];

    // Solve for x when y = targetScore: targetScore = intercept + slope*x
    let daysToTarget = -1;
    let isAchievable = false;

    if (slope > 0 && targetScore > currentScore) {
      daysToTarget = Math.ceil((targetScore - intercept) / slope - lastX);
      isAchievable = targetScore <= 100;
    } else if (slope <= 0 && targetScore > currentScore) {
      isAchievable = false;
    } else if (slope > 0 && targetScore <= currentScore) {
      daysToTarget = 0;
      isAchievable = true;
    }

    const confidenceResiduals = yValues.map((y, i) =>
      Math.abs(y - (intercept + slope * xValues[i])),
    );
    const stdError = Math.sqrt(
      confidenceResiduals.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
        Math.max(1, n - 2),
    );

    let confidence = "low";
    if (stdError < 5 && daysToTarget > 0 && daysToTarget < 365) {
      confidence = "high";
    } else if (stdError < 10 || (daysToTarget > 0 && daysToTarget < 180)) {
      confidence = "medium";
    }

    const targetDate = new Date(
      startDate.getTime() + daysToTarget * 24 * 60 * 60 * 1000,
    );

    return {
      daysToTarget: Math.max(-1, daysToTarget),
      targetDate,
      confidence,
      isAchievable,
    };
  }

  /**
   * Identify optimal study frequency
   */
  static identifyOptimalStudyFrequency(
    performanceHistory: { date: Date; score: number }[],
  ): {
    recommendedExamsPerWeek: number;
    explanation: string;
  } {
    if (performanceHistory.length < 7) {
      return {
        recommendedExamsPerWeek: 3,
        explanation: "Complete more exams to analyze optimal frequency",
      };
    }

    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate average exams per week
    const timeSpanDays =
      (new Date(sorted[sorted.length - 1].date).getTime() -
        new Date(sorted[0].date).getTime()) /
      (1000 * 60 * 60 * 24);

    const examsPerWeek = (performanceHistory.length / timeSpanDays) * 7;

    // Calculate score improvement
    const recentScores = sorted.slice(-10).map((e) => e.score);
    const earlyScores = sorted.slice(0, 10).map((e) => e.score);

    const recentAvg =
      recentScores.reduce((a, b) => a + b) / recentScores.length;
    const earlyAvg = earlyScores.reduce((a, b) => a + b) / earlyScores.length;

    const improvement = recentAvg - earlyAvg;

    let recommended = 3;
    let explanation = "Maintain a balanced study schedule of 3 exams per week";

    if (improvement < 2) {
      if (examsPerWeek < 3) {
        recommended = 4;
        explanation = "Increase to 4 exams per week for better progress";
      } else {
        recommended = 2;
        explanation = "Reduce to 2 exams per week and focus on quality study";
      }
    } else if (improvement > 5) {
      recommended = Math.min(5, Math.ceil(examsPerWeek + 1));
      explanation = `Great progress! You can handle ${recommended} exams per week`;
    }

    return {
      recommendedExamsPerWeek: recommended,
      explanation,
    };
  }
}

export default PredictionService;
