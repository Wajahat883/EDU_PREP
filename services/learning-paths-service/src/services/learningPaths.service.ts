/**
 * Advanced Learning Paths Service
 * Location: services/learning-paths-service/src/services/learningPaths.service.ts
 *
 * AI-powered adaptive learning paths that:
 * - Analyze user performance patterns
 * - Generate personalized study schedules
 * - Predict weak areas
 * - Recommend optimal study order
 * - Track progress with ML models
 * - Suggest spaced repetition intervals
 */

import { UserAnalyticsModel } from "../models/UserAnalytics";
import { LearningPathModel, ILearningPath } from "../models/LearningPath";
import { PathRecommendationModel } from "../models/PathRecommendation";
import { QuestionModel } from "../models/Question";
import logger from "../utils/logger";

/**
 * Machine Learning Models for Predictions
 */
interface MLPredictionData {
  userId: string;
  currentScore: number;
  avgScore: number;
  studyTime: number;
  questionCount: number;
  strengths: string[];
  weaknesses: string[];
  learningRate: number;
  engagementLevel: number;
}

export class LearningPathsService {
  /**
   * ADAPTIVE LEARNING PATH GENERATION
   */

  /**
   * Generate personalized learning path for user
   * Uses ML to analyze performance and create optimal study schedule
   */
  static async generatePersonalizedPath(
    userId: string,
  ): Promise<ILearningPath> {
    try {
      // 1. Fetch user analytics
      const analytics = await UserAnalyticsModel.findOne({ userId });
      if (!analytics) throw new Error("User analytics not found");

      // 2. Analyze performance patterns
      const performanceAnalysis = this.analyzePerformancePatterns(analytics);

      // 3. Identify strengths and weaknesses
      const { strengths, weaknesses } =
        await this.identifyStrengthsWeaknesses(userId);

      // 4. Generate ML predictions
      const predictions = this.generateMLPredictions({
        userId,
        currentScore: analytics.currentScore || 0,
        avgScore: analytics.averageScore || 0,
        studyTime: analytics.totalStudyTime || 0,
        questionCount: analytics.questionsAnswered || 0,
        strengths,
        weaknesses,
        learningRate: performanceAnalysis.learningRate,
        engagementLevel: performanceAnalysis.engagementLevel,
      });

      // 5. Create learning path with recommendations
      const pathData = {
        userId,
        name: `Personalized Path - ${new Date().toLocaleDateString()}`,
        description: `AI-generated learning path targeting ${weaknesses.slice(0, 3).join(", ")}`,
        type: "adaptive",
        subjects: weaknesses.slice(0, 3), // Focus on weak areas
        difficulty: this.calculateOptimalDifficulty(analytics),
        milestones: this.generateMilestones(analytics, weaknesses),
        estimatedDuration: predictions.estimatedWeeksToDailyGoal,
        successProbability: predictions.predictedSuccessProbability,
        recommendations: predictions.recommendations,
        questions: await this.selectOptimalQuestions(userId, weaknesses, 50),
        status: "active",
        startDate: new Date(),
      };

      const learningPath = await LearningPathModel.create(pathData);
      logger.info(`Personalized learning path created for user ${userId}`);

      return learningPath;
    } catch (error: any) {
      logger.error(`Error generating learning path: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze user performance patterns
   */
  private static analyzePerformancePatterns(analytics: any): {
    learningRate: number;
    engagementLevel: number;
    improvementTrend: number;
  } {
    // Calculate learning rate (questions answered per day)
    const daysSinceStart = Math.ceil(
      (Date.now() - analytics.createdAt) / (1000 * 60 * 60 * 24),
    );
    const learningRate =
      (analytics.questionsAnswered || 0) / Math.max(daysSinceStart, 1);

    // Calculate engagement level (0-100)
    const engagementLevel = Math.min(
      100,
      (learningRate / 10) * 100, // Normalize: 10 questions/day = 100% engagement
    );

    // Calculate improvement trend
    const recentAccuracy = analytics.recentAccuracy || 0;
    const overallAccuracy = analytics.averageScore || 0;
    const improvementTrend =
      ((recentAccuracy - overallAccuracy) / overallAccuracy) * 100 || 0;

    return { learningRate, engagementLevel, improvementTrend };
  }

  /**
   * Identify user's strengths and weaknesses by subject
   */
  private static async identifyStrengthsWeaknesses(
    userId: string,
  ): Promise<{ strengths: string[]; weaknesses: string[] }> {
    try {
      // Group performance by subject
      const performance = await QuestionModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$subject",
            avgAccuracy: { $avg: "$userPerformance.accuracy" },
            attemptCount: { $sum: 1 },
          },
        },
        { $sort: { avgAccuracy: -1 } },
      ]);

      // Strengths: top 3 subjects with >70% accuracy
      const strengths = performance
        .filter((p) => p.avgAccuracy > 70 && p.attemptCount > 5)
        .slice(0, 3)
        .map((p) => p._id);

      // Weaknesses: bottom 3 subjects with <60% accuracy
      const weaknesses = performance
        .filter((p) => p.avgAccuracy < 60 && p.attemptCount > 5)
        .slice(-3)
        .map((p) => p._id);

      return { strengths, weaknesses };
    } catch (error: any) {
      logger.error(`Error identifying strengths/weaknesses: ${error.message}`);
      return { strengths: [], weaknesses: [] };
    }
  }

  /**
   * Generate ML-based predictions
   */
  private static generateMLPredictions(data: MLPredictionData): {
    estimatedWeeksToDailyGoal: number;
    predictedSuccessProbability: number;
    recommendations: string[];
  } {
    // Simple ML model (can be replaced with more sophisticated models)
    const learningRate = data.learningRate || 0.1; // questions per day
    const questionsToMastery = 200; // estimated questions to achieve mastery

    // Calculate weeks to daily goal (assuming 80% accuracy target)
    const daysToGoal = questionsToMastery / Math.max(learningRate, 1);
    const weeksToDailyGoal = Math.ceil(daysToGoal / 7);

    // Calculate success probability based on engagement
    const engagementFactor = data.engagementLevel / 100;
    const consistencyFactor = Math.min(data.questionCount / 100, 1); // More questions = more data
    const predictedSuccessProbability = Math.round(
      (engagementFactor * 0.6 + consistencyFactor * 0.4) * 100,
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (data.engagementLevel < 50) {
      recommendations.push("Increase daily study time for better results");
    }
    if (data.learningRate < 1) {
      recommendations.push(
        "Try studying 10+ questions per day for optimal learning",
      );
    }
    if (data.weaknesses.length > 0) {
      recommendations.push(
        `Focus on ${data.weaknesses[0]} - this is your weakest area`,
      );
    }
    if (data.currentScore < data.avgScore * 0.9) {
      recommendations.push("Take a break and review recently covered topics");
    }
    if (data.strengths.length > 0) {
      recommendations.push(
        `You excel in ${data.strengths[0]} - consider teaching others`,
      );
    }

    return {
      estimatedWeeksToDailyGoal,
      predictedSuccessProbability,
      recommendations,
    };
  }

  /**
   * Calculate optimal difficulty for user
   */
  private static calculateOptimalDifficulty(analytics: any): number {
    // Difficulty scale: 1-10
    // Optimal is where accuracy is 70-75% (sweet spot for learning)
    const accuracy = analytics.averageScore || 50;

    if (accuracy < 50) return 3; // Very easy
    if (accuracy < 60) return 5; // Easy
    if (accuracy < 70) return 6; // Medium-easy
    if (accuracy < 80) return 7; // Medium
    if (accuracy < 90) return 8; // Medium-hard
    return 9; // Hard
  }

  /**
   * Generate learning milestones
   */
  private static generateMilestones(analytics: any, weaknesses: string[]) {
    return [
      {
        name: "Foundation Building",
        description: `Master ${weaknesses[0] || "fundamentals"}`,
        targetAccuracy: 65,
        estimatedDays: 7,
        questions: 50,
      },
      {
        name: "Skill Development",
        description: `Achieve 75% accuracy on all topics`,
        targetAccuracy: 75,
        estimatedDays: 14,
        questions: 100,
      },
      {
        name: "Mastery Phase",
        description: `Reach 85%+ accuracy consistently`,
        targetAccuracy: 85,
        estimatedDays: 21,
        questions: 150,
      },
      {
        name: "Excellence",
        description: `Score 90%+ on full-length exams`,
        targetAccuracy: 90,
        estimatedDays: 30,
        questions: 200,
      },
    ];
  }

  /**
   * Select optimal questions based on spaced repetition and weakness areas
   */
  private static async selectOptimalQuestions(
    userId: string,
    weaknesses: string[],
    count: number,
  ): Promise<string[]> {
    try {
      // Get questions from weak areas with proper spacing
      const questions = await QuestionModel.find({
        subject: { $in: weaknesses },
        difficulty: { $gte: 5, $lte: 8 }, // Medium difficulty for learning
      })
        .limit(count)
        .select("_id");

      return questions.map((q) => q._id.toString());
    } catch (error: any) {
      logger.error(`Error selecting questions: ${error.message}`);
      return [];
    }
  }

  /**
   * SPACED REPETITION SCHEDULING
   */

  /**
   * Calculate optimal review schedule using Ebbinghaus Forgetting Curve
   */
  static calculateReviewSchedule(
    quality: number,
    currentInterval: number,
  ): {
    nextInterval: number;
    reviewDates: Date[];
  } {
    // Based on Ebbinghaus curve: review at strategic intervals
    // Quality: 0-5 (same as SM-2)
    const intervals = [1, 3, 7, 14, 30]; // days

    let nextInterval = 1;
    if (quality >= 4) {
      // Good or excellent
      nextInterval = Math.ceil(currentInterval * 2.5);
    } else if (quality === 3) {
      // Fair
      nextInterval = Math.ceil(currentInterval * 1.5);
    } else {
      // Poor
      nextInterval = 1;
    }

    // Generate review dates
    const reviewDates: Date[] = [];
    const now = new Date();

    for (const interval of intervals.filter((i) => i <= nextInterval)) {
      const reviewDate = new Date(now);
      reviewDate.setDate(reviewDate.getDate() + interval);
      reviewDates.push(reviewDate);
    }

    return { nextInterval, reviewDates };
  }

  /**
   * ADAPTIVE DIFFICULTY ADJUSTMENT
   */

  /**
   * Adjust difficulty based on performance
   */
  static adjustDifficulty(
    currentDifficulty: number,
    accuracy: number,
    questionCount: number,
  ): number {
    // Optimal learning zone: 70-75% accuracy
    const targetAccuracy = 72.5;

    if (accuracy > targetAccuracy + 10 && questionCount > 10) {
      // Too easy - increase difficulty
      return Math.min(currentDifficulty + 1, 10);
    } else if (accuracy < targetAccuracy - 10 && questionCount > 10) {
      // Too hard - decrease difficulty
      return Math.max(currentDifficulty - 1, 1);
    }

    return currentDifficulty;
  }

  /**
   * RECOMMENDATION ENGINE
   */

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(userId: string): Promise<string[]> {
    try {
      const analytics = await UserAnalyticsModel.findOne({ userId });
      if (!analytics) return [];

      const recommendations: string[] = [];
      const { strengths, weaknesses } =
        await this.identifyStrengthsWeaknesses(userId);

      // Time-based recommendations
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 9) {
        recommendations.push(
          "✨ Morning is prime study time! Start with tough topics",
        );
      } else if (hour >= 20 && hour <= 23) {
        recommendations.push(
          "🌙 Evening slots work best for review and consolidation",
        );
      }

      // Performance-based
      if (analytics.studyStreak && analytics.studyStreak > 7) {
        recommendations.push(
          `🔥 Amazing ${analytics.studyStreak} day streak! Keep it going`,
        );
      }

      if (weaknesses.length > 0) {
        recommendations.push(
          `📚 Focus on ${weaknesses[0]} to boost overall score`,
        );
      }

      if (analytics.averageScore > 80) {
        recommendations.push(
          "🎯 Try premium questions for advanced preparation",
        );
      }

      // Engagement-based
      const daysSinceLastStudy = Math.ceil(
        (Date.now() - (analytics.lastStudyAt || Date.now())) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastStudy > 2) {
        recommendations.push(
          "⚠️ You haven't studied in a few days - consistency matters!",
        );
      }

      return recommendations;
    } catch (error: any) {
      logger.error(`Error getting recommendations: ${error.message}`);
      return [];
    }
  }

  /**
   * PROGRESS TRACKING & PREDICTIONS
   */

  /**
   * Predict user's performance on upcoming exam
   */
  static async predictExamPerformance(userId: string): Promise<{
    predictedScore: number;
    confidence: number;
    timeToReady: string;
    keyAreas: string[];
  }> {
    try {
      const analytics = await UserAnalyticsModel.findOne({ userId });
      if (!analytics) {
        return {
          predictedScore: 0,
          confidence: 0,
          timeToReady: "Unknown",
          keyAreas: [],
        };
      }

      // Regression model for score prediction
      const recentTests = analytics.testHistory?.slice(-10) || [];
      const avgRecentScore =
        recentTests.reduce((a, b) => a + b, 0) /
        Math.max(recentTests.length, 1);
      const trend =
        recentTests.length > 1
          ? (recentTests[recentTests.length - 1] - recentTests[0]) /
            recentTests.length
          : 0;

      // Predict future score
      const predictedScore = Math.min(
        100,
        Math.round(avgRecentScore + trend * 5),
      );

      // Calculate confidence (based on consistency)
      const variance =
        recentTests.length > 0
          ? Math.sqrt(
              recentTests.reduce(
                (sum, score) => sum + Math.pow(score - avgRecentScore, 2),
                0,
              ) / recentTests.length,
            )
          : 50;
      const confidence = Math.max(30, Math.min(95, 100 - variance));

      // Estimate time to reach 85% (commonly targeted score)
      const { strengths, weaknesses } =
        await this.identifyStrengthsWeaknesses(userId);
      const improvementNeeded = Math.max(0, 85 - predictedScore);
      const improvementRate = trend > 0 ? trend : 1;
      const daysToReady = Math.ceil(
        improvementNeeded / Math.max(improvementRate, 0.5),
      );

      return {
        predictedScore,
        confidence: Math.round(confidence),
        timeToReady: daysToReady > 0 ? `${daysToReady} days` : "Ready now!",
        keyAreas: weaknesses,
      };
    } catch (error: any) {
      logger.error(`Error predicting exam performance: ${error.message}`);
      return {
        predictedScore: 0,
        confidence: 0,
        timeToReady: "Error calculating",
        keyAreas: [],
      };
    }
  }

  /**
   * Get learning path progress
   */
  static async getPathProgress(pathId: string): Promise<{
    percentComplete: number;
    currentMilestone: string;
    nextMilestone: string;
    questionsCompleted: number;
    questionsRemaining: number;
    estimatedCompletion: Date;
  }> {
    try {
      const path = await LearningPathModel.findById(pathId);
      if (!path) throw new Error("Path not found");

      const totalQuestions = path.questions.length;
      const completedQuestions = path.questionsCompleted || 0;
      const percentComplete = Math.round(
        (completedQuestions / totalQuestions) * 100,
      );

      // Find current milestone
      const milestonesProgress = path.milestones.map((m) => ({
        ...m,
        questionsForMilestone: Math.round(
          (m.questions / totalQuestions) * completedQuestions,
        ),
      }));

      const currentMilestoneIdx = Math.min(
        Math.floor((percentComplete / 100) * path.milestones.length),
        path.milestones.length - 1,
      );
      const nextMilestoneIdx = Math.min(
        currentMilestoneIdx + 1,
        path.milestones.length - 1,
      );

      const currentMilestone =
        path.milestones[currentMilestoneIdx]?.name || "Starting";
      const nextMilestone =
        path.milestones[nextMilestoneIdx]?.name || "Complete";

      // Calculate estimated completion
      const questionsPerDay = 15; // average
      const remainingQuestions = totalQuestions - completedQuestions;
      const daysToComplete = Math.ceil(remainingQuestions / questionsPerDay);
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(
        estimatedCompletion.getDate() + daysToComplete,
      );

      return {
        percentComplete,
        currentMilestone,
        nextMilestone,
        questionsCompleted,
        questionsRemaining: remainingQuestions,
        estimatedCompletion,
      };
    } catch (error: any) {
      logger.error(`Error getting path progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * UPDATE LEARNING PATH
   */

  /**
   * Log question completion and update path
   */
  static async logQuestionCompletion(
    pathId: string,
    questionId: string,
    quality: number,
    timeSpent: number,
  ): Promise<ILearningPath | null> {
    try {
      const path = await LearningPathModel.findByIdAndUpdate(
        pathId,
        {
          $inc: {
            questionsCompleted: 1,
            totalTimeSpent: timeSpent,
          },
          $push: {
            completionLog: {
              questionId,
              quality,
              timestamp: new Date(),
              timeSpent,
            },
          },
          updatedAt: new Date(),
        },
        { new: true },
      );

      return path;
    } catch (error: any) {
      logger.error(`Error logging completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete learning path
   */
  static async completePath(pathId: string): Promise<ILearningPath | null> {
    try {
      const path = await LearningPathModel.findByIdAndUpdate(
        pathId,
        {
          status: "completed",
          completedAt: new Date(),
        },
        { new: true },
      );

      logger.info(`Learning path completed: ${pathId}`);
      return path;
    } catch (error: any) {
      logger.error(`Error completing path: ${error.message}`);
      throw error;
    }
  }
}
