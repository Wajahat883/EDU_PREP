/**
 * AI Question Recommender Service
 *
 * Uses machine learning to recommend relevant questions based on:
 * - Student performance patterns
 * - Knowledge gaps
 * - Difficulty progression
 * - Topic relevance
 * - Similar student cohorts
 */

import { injectable, inject } from "tsyringe";
import { Logger } from "winston";
import { Question } from "../models/Question";
import { StudentPerformance } from "../models/StudentPerformance";
import * as math from "mathjs";

interface StudentProfile {
  userId: string;
  performanceBySubject: Record<string, number>;
  performanceByDifficulty: Record<string, number>;
  masteredTopics: string[];
  strugglingTopics: string[];
  recentAttempts: number;
  averageScore: number;
}

interface RecommendationResult {
  questionId: string;
  relevanceScore: number;
  reason: string;
  estimatedDifficulty: "easy" | "medium" | "hard";
  estimatedDuration: number;
}

@injectable()
export class QuestionRecommenderService {
  constructor(@inject("Logger") private logger: Logger) {}

  /**
   * Get personalized question recommendations for a student
   */
  async getRecommendations(
    userId: string,
    count: number = 5,
    options?: {
      subject?: string;
      difficulty?: "easy" | "medium" | "hard";
      avoidRecent?: boolean;
      focusOnWeakness?: boolean;
    },
  ): Promise<RecommendationResult[]> {
    try {
      // Build student profile
      const profile = await this.buildStudentProfile(userId);

      // Get candidate questions
      let candidates = await this.getCandidateQuestions(profile, options);

      // Calculate relevance scores for each question
      const scoredQuestions = candidates.map((q) => ({
        ...q,
        relevanceScore: this.calculateRelevanceScore(q, profile, options),
      }));

      // Sort by relevance and take top N
      const topRecommendations = scoredQuestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, count)
        .map((q) => ({
          questionId: q._id.toString(),
          relevanceScore: q.relevanceScore,
          reason: this.getRecommendationReason(q, profile, options),
          estimatedDifficulty: q.difficulty,
          estimatedDuration: q.timeEstimate || 5,
        }));

      this.logger.info(
        `Generated ${topRecommendations.length} recommendations for user ${userId}`,
        {
          recommendations: topRecommendations,
        },
      );

      return topRecommendations;
    } catch (error) {
      this.logger.error("Error generating recommendations", { userId, error });
      throw error;
    }
  }

  /**
   * Build comprehensive student profile for ML
   */
  private async buildStudentProfile(userId: string): Promise<StudentProfile> {
    const performance = await StudentPerformance.findOne({ userId });

    if (!performance) {
      return {
        userId,
        performanceBySubject: {},
        performanceByDifficulty: {},
        masteredTopics: [],
        strugglingTopics: [],
        recentAttempts: 0,
        averageScore: 50,
      };
    }

    // Calculate performance metrics
    const performanceBySubject: Record<string, number> = {};
    const performanceByDifficulty: Record<string, number> = {};

    performance.attemptHistory.forEach((attempt) => {
      const subject = attempt.subject;
      const difficulty = attempt.difficulty;

      performanceBySubject[subject] =
        (performanceBySubject[subject] || 0) + attempt.score;
      performanceByDifficulty[difficulty] =
        (performanceByDifficulty[difficulty] || 0) + attempt.score;
    });

    // Average the scores
    Object.keys(performanceBySubject).forEach((subject) => {
      const attempts = performance.attemptHistory.filter(
        (a) => a.subject === subject,
      ).length;
      performanceBySubject[subject] = performanceBySubject[subject] / attempts;
    });

    Object.keys(performanceByDifficulty).forEach((difficulty) => {
      const attempts = performance.attemptHistory.filter(
        (a) => a.difficulty === difficulty,
      ).length;
      performanceByDifficulty[difficulty] =
        performanceByDifficulty[difficulty] / attempts;
    });

    // Identify mastered and struggling topics
    const masteredTopics = Object.entries(performanceBySubject)
      .filter(([_, score]) => score >= 80)
      .map(([topic]) => topic);

    const strugglingTopics = Object.entries(performanceBySubject)
      .filter(([_, score]) => score <= 50)
      .map(([topic]) => topic);

    return {
      userId,
      performanceBySubject,
      performanceByDifficulty,
      masteredTopics,
      strugglingTopics,
      recentAttempts: performance.attemptHistory.length,
      averageScore: performance.averageScore,
    };
  }

  /**
   * Get candidate questions for recommendation
   */
  private async getCandidateQuestions(
    profile: StudentProfile,
    options?: any,
  ): Promise<any[]> {
    const filter: any = {
      status: "approved",
      deletedAt: null,
    };

    // Filter by subject if specified
    if (options?.subject) {
      filter.subject = options.subject;
    }

    // Filter by difficulty
    if (options?.difficulty) {
      filter.difficulty = options.difficulty;
    } else {
      // Recommend appropriate difficulty level based on performance
      const recommendedDifficulties = this.getRecommendedDifficulties(profile);
      filter.difficulty = { $in: recommendedDifficulties };
    }

    // Exclude recently attempted questions if specified
    if (options?.avoidRecent) {
      const performance = await StudentPerformance.findOne({
        userId: profile.userId,
      });
      if (performance) {
        const recentQuestionIds = performance.attemptHistory
          .slice(-50)
          .map((a) => a.questionId);
        filter._id = { $nin: recentQuestionIds };
      }
    }

    // Focus on weak topics if specified
    if (options?.focusOnWeakness && profile.strugglingTopics.length > 0) {
      filter.topic = { $in: profile.strugglingTopics };
    }

    return await Question.find(filter).limit(50).lean();
  }

  /**
   * Calculate relevance score using multiple factors
   */
  private calculateRelevanceScore(
    question: any,
    profile: StudentProfile,
    options?: any,
  ): number {
    let score = 0;

    // Factor 1: Difficulty alignment (0-25 points)
    const performanceByDifficulty =
      profile.performanceByDifficulty[question.difficulty] || 50;
    if (Math.abs(performanceByDifficulty - 70) < 15) {
      score += 25; // Ideal difficulty (70% success rate)
    } else if (Math.abs(performanceByDifficulty - 70) < 30) {
      score += 15; // Acceptable difficulty
    } else {
      score += 5; // Too easy or too hard
    }

    // Factor 2: Topic strength (0-25 points)
    const topicPerformance =
      profile.performanceBySubject[question.subject] || profile.averageScore;
    if (profile.strugglingTopics.includes(question.topic)) {
      score += 25; // High priority to improve weakness
    } else if (topicPerformance >= 70) {
      score += 10; // Not mastered yet, but progressing
    } else {
      score += 15; // Medium priority
    }

    // Factor 3: Learning progression (0-20 points)
    const masteredCount = profile.masteredTopics.length;
    const strugglingCount = profile.strugglingTopics.length;
    const isFoundational = question.tags?.includes("fundamentals") || false;

    if (masteredCount > 0 && !isFoundational) {
      score += 20; // Building on existing knowledge
    } else if (isFoundational && strugglingCount === 0) {
      score += 10; // Reinforce fundamentals
    } else {
      score += 15;
    }

    // Factor 4: Recency boost (0-15 points)
    const daysSinceLastAttempt = this.daysSinceLastAttemptOnTopic(
      profile,
      question.topic,
    );
    if (daysSinceLastAttempt > 7) {
      score += 15; // Encourage spaced repetition
    } else if (daysSinceLastAttempt > 3) {
      score += 8;
    }

    // Factor 5: Focus on weakness (0-15 points)
    if (
      options?.focusOnWeakness &&
      profile.strugglingTopics.includes(question.topic)
    ) {
      score += 15;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Determine recommended difficulty levels based on performance
   */
  private getRecommendedDifficulties(profile: StudentProfile): string[] {
    const avgPerformance = profile.averageScore;

    if (avgPerformance >= 80) {
      return ["hard", "medium"]; // Challenging but not impossible
    } else if (avgPerformance >= 60) {
      return ["medium", "hard"]; // Mix of medium and hard
    } else if (avgPerformance >= 40) {
      return ["easy", "medium"]; // Build foundation first
    } else {
      return ["easy"]; // Master basics
    }
  }

  /**
   * Get human-readable explanation for recommendation
   */
  private getRecommendationReason(
    question: any,
    profile: StudentProfile,
    options?: any,
  ): string {
    if (profile.strugglingTopics.includes(question.topic)) {
      return `Strengthen your weak area: ${question.topic}`;
    }

    const topicPerformance = profile.performanceBySubject[question.subject];
    if (topicPerformance >= 80) {
      return `Challenge yourself with ${question.difficulty} difficulty`;
    }

    if (options?.focusOnWeakness) {
      return `Targeted practice on ${question.topic}`;
    }

    return `Continue practicing ${question.subject}`;
  }

  /**
   * Calculate days since last attempt on a topic
   */
  private daysSinceLastAttemptOnTopic(
    profile: StudentProfile,
    topic: string,
  ): number {
    const performance = StudentPerformance.findOne({ userId: profile.userId });
    if (!performance) return 999;

    const lastAttempt = performance.attemptHistory
      .reverse()
      .find((a) => a.topic === topic);

    if (!lastAttempt) return 999;

    const daysDiff = Math.floor(
      (Date.now() - lastAttempt.timestamp.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff;
  }

  /**
   * Get similar students for cohort-based recommendations
   */
  async getSimilarStudents(
    userId: string,
    limit: number = 10,
  ): Promise<string[]> {
    const profile = await this.buildStudentProfile(userId);

    // Find students with similar performance patterns
    const students = await StudentPerformance.find({
      userId: { $ne: userId },
      averageScore: {
        $gte: profile.averageScore - 10,
        $lte: profile.averageScore + 10,
      },
    })
      .select("userId")
      .limit(limit);

    return students.map((s) => s.userId);
  }

  /**
   * Get what similar students are answering
   */
  async getCohortRecommendations(
    userId: string,
    count: number = 5,
  ): Promise<RecommendationResult[]> {
    const similarStudents = await this.getSimilarStudents(userId);

    // Get questions attempted by similar students but not by current student
    const currentAttempts = await StudentPerformance.findOne({ userId });
    const currentQuestionIds =
      currentAttempts?.attemptHistory.map((a) => a.questionId) || [];

    const cohortAttempts = await StudentPerformance.find({
      userId: { $in: similarStudents },
    }).select("attemptHistory");

    const frequencyMap: Record<string, number> = {};

    cohortAttempts.forEach((student) => {
      student.attemptHistory.forEach((attempt) => {
        if (!currentQuestionIds.includes(attempt.questionId)) {
          frequencyMap[attempt.questionId] =
            (frequencyMap[attempt.questionId] || 0) + 1;
        }
      });
    });

    // Get top questions by frequency
    const topQuestionIds = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([id]) => id);

    const questions = await Question.find({ _id: { $in: topQuestionIds } });

    return questions.map((q, index) => ({
      questionId: q._id.toString(),
      relevanceScore: 100 - index * 10,
      reason: "Popular with students similar to you",
      estimatedDifficulty: q.difficulty as any,
      estimatedDuration: q.timeEstimate || 5,
    }));
  }

  /**
   * Predict question difficulty for a new question
   */
  async predictQuestionDifficulty(
    questionText: string,
    options?: any,
  ): Promise<string> {
    // Heuristic-based difficulty prediction
    const complexity = this.analyzeTextComplexity(questionText);
    const wordCount = questionText.split(" ").length;
    const hasMultipleParts = (questionText.match(/,|;|\?/g) || []).length > 2;

    let score = 0;

    // Complexity analysis
    if (complexity > 0.7) score += 40;
    else if (complexity > 0.5) score += 20;
    else score += 10;

    // Word count (longer = more complex)
    if (wordCount > 100) score += 30;
    else if (wordCount > 50) score += 15;
    else score += 5;

    // Multiple parts
    if (hasMultipleParts) score += 20;

    if (score >= 60) return "hard";
    if (score >= 35) return "medium";
    return "easy";
  }

  /**
   * Analyze text complexity using simple metrics
   */
  private analyzeTextComplexity(text: string): number {
    // Average word length as complexity proxy
    const words = text.split(" ");
    const avgLength =
      words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Normalize to 0-1 scale (assuming 3-10 char words)
    return Math.min(avgLength / 10, 1);
  }

  /**
   * Get learning analytics for adaptive recommendations
   */
  async getLearningAnalytics(userId: string): Promise<any> {
    const profile = await this.buildStudentProfile(userId);
    const performance = await StudentPerformance.findOne({ userId });

    return {
      overallProgress: profile.averageScore,
      strengthAreas: profile.masteredTopics,
      improvementAreas: profile.strugglingTopics,
      learningVelocity: this.calculateLearningVelocity(performance),
      recommendedFocusArea: profile.strugglingTopics[0] || "General Practice",
      nextRecommendedDifficulty: this.getRecommendedDifficulties(profile)[0],
    };
  }

  /**
   * Calculate rate of improvement
   */
  private calculateLearningVelocity(performance: any): number {
    if (!performance || performance.attemptHistory.length < 5) {
      return 0;
    }

    const recent = performance.attemptHistory.slice(-10);
    const old = performance.attemptHistory.slice(-20, -10);

    const recentAvg =
      recent.reduce((sum: number, a: any) => sum + a.score, 0) / recent.length;
    const oldAvg =
      old.reduce((sum: number, a: any) => sum + a.score, 0) / old.length;

    return Math.round((recentAvg - oldAvg) * 100) / 100; // Points per question
  }
}

export default QuestionRecommenderService;
