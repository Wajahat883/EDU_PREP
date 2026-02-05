/**
 * Performance Prediction Service
 *
 * ML-based service that predicts:
 * - Test scores based on practice performance
 * - Time to answer questions
 * - Areas where student will struggle
 * - Intervention triggers
 * - Success probability
 */

import { injectable, inject } from "tsyringe";
import { Logger } from "winston";
import { StudentPerformance } from "../models/StudentPerformance";
import { Test } from "../models/Test";
import * as math from "mathjs";

interface PredictionResult {
  predictedScore: number;
  confidence: number; // 0-1
  scoreRange: { min: number; max: number };
  strugglingTopics: string[];
  interventionNeeded: boolean;
  estimatedTimeMinutes: number;
  successProbability: number; // 0-1
}

interface StrugglePrediction {
  topic: string;
  struggleProbability: number; // 0-1
  interventionType: "practice" | "tutoring" | "review" | "simplify";
  suggestedResources: string[];
}

@injectable()
export class PerformancePredictionService {
  private readonly MIN_DATA_POINTS = 5;

  constructor(@inject("Logger") private logger: Logger) {}

  /**
   * Predict test score based on practice performance
   */
  async predictTestScore(
    userId: string,
    testId: string,
  ): Promise<PredictionResult> {
    try {
      const test = await Test.findById(testId);
      if (!test) throw new Error("Test not found");

      const performance = await StudentPerformance.findOne({ userId });
      if (
        !performance ||
        performance.attemptHistory.length < this.MIN_DATA_POINTS
      ) {
        // Not enough data for prediction
        return {
          predictedScore: 50,
          confidence: 0.2,
          scoreRange: { min: 30, max: 70 },
          strugglingTopics: [],
          interventionNeeded: false,
          estimatedTimeMinutes: test.questions.length * 3,
          successProbability: 0.5,
        };
      }

      // Calculate prediction features
      const features = this.extractPredictionFeatures(performance, test);

      // Run prediction model
      const prediction = this.runPredictionModel(features);

      // Identify struggling topics
      const strugglingTopics = this.predictStruggleConcepts(performance, test);

      // Determine if intervention needed
      const interventionNeeded =
        prediction.predictedScore < 60 || strugglingTopics.length > 0;

      this.logger.info(`Predicted test score for user ${userId}`, {
        testId,
        predictedScore: prediction.score,
        confidence: prediction.confidence,
      });

      return {
        predictedScore: Math.round(prediction.score),
        confidence: prediction.confidence,
        scoreRange: {
          min: Math.max(0, Math.round(prediction.score - prediction.stdDev)),
          max: Math.min(100, Math.round(prediction.score + prediction.stdDev)),
        },
        strugglingTopics,
        interventionNeeded,
        estimatedTimeMinutes: this.estimateTestDuration(test, performance),
        successProbability: this.calculateSuccessProbability(prediction.score),
      };
    } catch (error) {
      this.logger.error("Error predicting test score", {
        userId,
        testId,
        error,
      });
      throw error;
    }
  }

  /**
   * Extract features for ML prediction
   */
  private extractPredictionFeatures(performance: any, test: any): any {
    const topicScores: Record<string, number[]> = {};
    const topicAttempts: Record<string, number> = {};

    // Aggregate scores by topic
    performance.attemptHistory.forEach((attempt: any) => {
      if (!topicScores[attempt.topic]) {
        topicScores[attempt.topic] = [];
        topicAttempts[attempt.topic] = 0;
      }
      topicScores[attempt.topic].push(attempt.score);
      topicAttempts[attempt.topic]++;
    });

    // Calculate statistics for each topic
    const topicStats: Record<string, any> = {};
    Object.keys(topicScores).forEach((topic) => {
      const scores = topicScores[topic];
      topicStats[topic] = {
        mean: math.mean(scores),
        stdDev: math.std(scores),
        median: math.median(scores),
        min: Math.min(...scores),
        max: Math.max(...scores),
        trend: this.calculateTrend(scores),
        recentPerformance: math.mean(scores.slice(-5)),
      };
    });

    // Calculate test coverage
    const testTopics = this.extractTestTopics(test);
    const topicCoverage = testTopics.map((topic) => ({
      topic,
      studentScore: topicStats[topic]?.mean || 0,
      studentTrend: topicStats[topic]?.trend || 0,
      difficulty: this.estimateTopicDifficulty(topic, testTopics),
      weight: this.estimateTopicWeight(test, topic),
    }));

    return {
      overallMean: performance.averageScore,
      overallStdDev: this.calculateOverallStdDev(performance),
      recentPerformance: math.mean(
        performance.attemptHistory.slice(-10).map((a: any) => a.score),
      ),
      attemptCount: performance.attemptHistory.length,
      consistencyScore: this.calculateConsistency(performance),
      topicCoverage,
      learningVelocity: this.calculateLearningVelocity(performance),
    };
  }

  /**
   * Extract topics covered in test
   */
  private extractTestTopics(test: any): string[] {
    const topicSet = new Set<string>();
    test.questions.forEach((q: any) => {
      if (q.topic) topicSet.add(q.topic);
    });
    return Array.from(topicSet);
  }

  /**
   * Run ML prediction model (simplified linear regression)
   */
  private runPredictionModel(features: any): {
    score: number;
    confidence: number;
    stdDev: number;
  } {
    // Weighted model based on features
    let predictedScore = 0;
    let weights = 0;

    // Weight 1: Overall mean (40%)
    predictedScore += features.overallMean * 0.4;
    weights += 0.4;

    // Weight 2: Recent performance (30%)
    predictedScore += features.recentPerformance * 0.3;
    weights += 0.3;

    // Weight 3: Topic-specific performance (20%)
    const topicScore =
      features.topicCoverage.reduce(
        (sum: number, t: any) => sum + t.studentScore,
        0,
      ) / features.topicCoverage.length;
    predictedScore += topicScore * 0.2;
    weights += 0.2;

    // Weight 4: Learning velocity (10%)
    const velocityBoost = Math.min(features.learningVelocity, 5); // Cap at +5 points
    predictedScore += velocityBoost * 0.1;
    weights += 0.1;

    // Normalize
    predictedScore = predictedScore / weights;

    // Apply consistency as confidence factor
    const confidence = Math.min(0.95, features.consistencyScore);

    // Standard deviation based on topic variation
    const topicVariance = Math.max(
      ...features.topicCoverage.map((t: any) =>
        Math.abs(t.studentScore - predictedScore),
      ),
    );
    const stdDev = Math.min(20, topicVariance + 10);

    return {
      score: Math.max(0, Math.min(100, predictedScore)),
      confidence,
      stdDev,
    };
  }

  /**
   * Predict areas where student will struggle
   */
  private predictStruggleConcepts(performance: any, test: any): string[] {
    const strugglingConcepts: string[] = [];
    const testTopics = this.extractTestTopics(test);

    testTopics.forEach((topic) => {
      const topicAttempts = performance.attemptHistory.filter(
        (a: any) => a.topic === topic,
      );

      if (topicAttempts.length === 0) {
        // No practice on this topic - high risk
        strugglingConcepts.push(topic);
      } else {
        const topicScore =
          topicAttempts.reduce((sum: number, a: any) => sum + a.score, 0) /
          topicAttempts.length;
        if (topicScore < 60) {
          strugglingConcepts.push(topic);
        }
      }
    });

    return strugglingConcepts;
  }

  /**
   * Predict areas where student needs intervention
   */
  async predictInterventionNeeds(
    userId: string,
  ): Promise<StrugglePrediction[]> {
    const performance = await StudentPerformance.findOne({ userId });
    if (!performance) return [];

    const predictions: StrugglePrediction[] = [];

    // Analyze performance by topic
    const topicScores: Record<string, number[]> = {};

    performance.attemptHistory.forEach((attempt: any) => {
      if (!topicScores[attempt.topic]) {
        topicScores[attempt.topic] = [];
      }
      topicScores[attempt.topic].push(attempt.score);
    });

    Object.entries(topicScores).forEach(([topic, scores]) => {
      const avgScore = math.mean(scores);
      const trend = this.calculateTrend(scores);

      if (avgScore < 70 || (trend < 0 && avgScore < 75)) {
        // Student is struggling
        const interventionType = this.recommendInterventionType(
          avgScore,
          trend,
        );
        const resources = this.recommendResources(topic, interventionType);

        predictions.push({
          topic,
          struggleProbability: 1 - avgScore / 100,
          interventionType,
          suggestedResources: resources,
        });
      }
    });

    return predictions.sort(
      (a, b) => b.struggleProbability - a.struggleProbability,
    );
  }

  /**
   * Estimate time to complete test
   */
  private estimateTestDuration(test: any, performance: any): number {
    const avgTimePerQuestion =
      this.calculateAverageTimePerQuestion(performance);
    const testDifficulty = this.estimateTestDifficulty(test);

    // Adjust time based on difficulty
    let adjustedTime = avgTimePerQuestion * test.questions.length;
    if (testDifficulty === "hard") {
      adjustedTime *= 1.3;
    } else if (testDifficulty === "easy") {
      adjustedTime *= 0.8;
    }

    return Math.round(adjustedTime);
  }

  /**
   * Calculate average time per question
   */
  private calculateAverageTimePerQuestion(performance: any): number {
    if (!performance.timeTracking || performance.timeTracking.length === 0) {
      return 3; // Default 3 minutes per question
    }

    const times = performance.timeTracking.map((t: any) => t.timeSpent);
    return math.mean(times);
  }

  /**
   * Estimate test difficulty
   */
  private estimateTestDifficulty(test: any): "easy" | "medium" | "hard" {
    const difficulties = test.questions.map((q: any) => q.difficulty);
    const hardCount = difficulties.filter((d: string) => d === "hard").length;
    const easyCount = difficulties.filter((d: string) => d === "easy").length;

    if (hardCount > difficulties.length * 0.6) return "hard";
    if (easyCount > difficulties.length * 0.6) return "easy";
    return "medium";
  }

  /**
   * Estimate topic difficulty
   */
  private estimateTopicDifficulty(topic: string, allTopics: string[]): number {
    // 0-1 scale
    return allTopics.indexOf(topic) / allTopics.length;
  }

  /**
   * Estimate topic weight in test
   */
  private estimateTopicWeight(test: any, topic: string): number {
    const topicCount = test.questions.filter(
      (q: any) => q.topic === topic,
    ).length;
    return topicCount / test.questions.length;
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessProbability(score: number): number {
    // Normal distribution CDF approximation
    // 60+ = passing
    const passingScore = 60;
    const z = (score - passingScore) / 15; // Assume stdDev of 15
    return 0.5 * (1 + math.erf(z / Math.sqrt(2)));
  }

  /**
   * Calculate consistency of performance
   */
  private calculateConsistency(performance: any): number {
    const scores = performance.attemptHistory.map((a: any) => a.score);
    if (scores.length < 2) return 0.5;

    const mean = math.mean(scores);
    const stdDev = math.std(scores);
    const cv = stdDev / mean; // Coefficient of variation

    return 1 / (1 + cv); // Convert to 0-1 where 1 is most consistent
  }

  /**
   * Calculate overall standard deviation
   */
  private calculateOverallStdDev(performance: any): number {
    const scores = performance.attemptHistory.map((a: any) => a.score);
    return scores.length > 1 ? math.std(scores) : 10;
  }

  /**
   * Calculate trend (positive = improving, negative = declining)
   */
  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const recent = scores.slice(-5);
    const old = scores.slice(-10, -5);

    if (old.length === 0) return 0;

    const recentAvg = math.mean(recent);
    const oldAvg = math.mean(old);

    return recentAvg - oldAvg;
  }

  /**
   * Calculate learning velocity
   */
  private calculateLearningVelocity(performance: any): number {
    const scores = performance.attemptHistory.map((a: any) => a.score);
    if (scores.length < 10) return 0;

    const recent = scores.slice(-5);
    const old = scores.slice(-10, -5);

    const recentAvg = math.mean(recent);
    const oldAvg = math.mean(old);

    return recentAvg - oldAvg;
  }

  /**
   * Recommend intervention type based on performance
   */
  private recommendInterventionType(
    avgScore: number,
    trend: number,
  ): "practice" | "tutoring" | "review" | "simplify" {
    if (avgScore < 40) return "simplify"; // Fundamentals needed
    if (avgScore < 60) return "tutoring"; // Need expert help
    if (trend < -5) return "review"; // Declining performance
    return "practice"; // Need more practice
  }

  /**
   * Recommend resources based on topic and intervention type
   */
  private recommendResources(
    topic: string,
    interventionType: string,
  ): string[] {
    const resources: string[] = [];

    switch (interventionType) {
      case "simplify":
        resources.push(`Video: ${topic} Fundamentals`);
        resources.push(`Worksheet: Basic ${topic} Concepts`);
        resources.push(`Interactive Tool: ${topic} Practice`);
        break;
      case "tutoring":
        resources.push(`1-on-1 Tutoring: ${topic}`);
        resources.push(`Study Group: ${topic}`);
        resources.push(`Office Hours: ${topic} Q&A`);
        break;
      case "review":
        resources.push(`Summary: ${topic} Key Points`);
        resources.push(`Practice Problems: ${topic}`);
        resources.push(`Cheat Sheet: ${topic}`);
        break;
      case "practice":
        resources.push(`Problem Set: ${topic}`);
        resources.push(`Mock Test: ${topic}`);
        resources.push(`Timed Quiz: ${topic}`);
        break;
    }

    return resources;
  }

  /**
   * Get real-time performance alerts
   */
  async getPerformanceAlerts(userId: string): Promise<string[]> {
    const performance = await StudentPerformance.findOne({ userId });
    if (!performance) return [];

    const alerts: string[] = [];

    // Check for declining performance
    const recent = performance.attemptHistory.slice(-5);
    const previous = performance.attemptHistory.slice(-10, -5);

    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = math.mean(recent.map((a: any) => a.score));
      const previousAvg = math.mean(previous.map((a: any) => a.score));

      if (recentAvg < previousAvg - 10) {
        alerts.push(
          "Your performance has declined recently. Consider reviewing the material.",
        );
      }
    }

    // Check for inactivity
    const lastAttempt =
      performance.attemptHistory[performance.attemptHistory.length - 1];
    const daysSinceLastAttempt = Math.floor(
      (Date.now() - lastAttempt.timestamp.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastAttempt > 7) {
      alerts.push(
        "You have not practiced in over a week. Resume your studies!",
      );
    }

    return alerts;
  }
}

export default PerformancePredictionService;
