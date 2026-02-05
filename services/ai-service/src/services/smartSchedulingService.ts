/**
 * Smart Test Scheduling Service
 *
 * Optimizes test scheduling:
 * - Optimal timing recommendations based on readiness
 * - Schedule conflict resolution
 * - Preparation time calculation
 * - Group scheduling optimization
 * - Study hour prediction
 */

import { injectable, inject } from "tsyringe";
import { Logger } from "winston";
import { StudentPerformance } from "../models/StudentPerformance";
import { Test } from "../models/Test";

interface ScheduleRecommendation {
  recommendedDate: Date;
  recommendedTime: string;
  prepDaysNeeded: number;
  readinessScore: number; // 0-100
  confidence: number; // 0-1
  alternativeDates: Date[];
}

interface TestReadiness {
  isReady: boolean;
  readinessScore: number;
  prepPercentage: number;
  topicsToReview: string[];
  estimatedPrepTime: number; // hours
  recommendedAction: string;
}

interface GroupSchedule {
  optimalDateTime: Date;
  participantIds: string[];
  conflictCount: number;
  averageReadiness: number;
}

@injectable()
export class SmartTestSchedulingService {
  private readonly PREP_TIME_PER_SUBJECT_HOUR = 1.5; // 1.5 hours prep per subject study hour

  constructor(@inject("Logger") private logger: Logger) {}

  /**
   * Get optimal test schedule recommendation
   */
  async getScheduleRecommendation(
    userId: string,
    testId: string,
  ): Promise<ScheduleRecommendation> {
    try {
      const test = await Test.findById(testId);
      if (!test) throw new Error("Test not found");

      const performance = await StudentPerformance.findOne({ userId });
      const readiness = await this.assessTestReadiness(userId, testId);

      // Calculate prep time needed
      const prepDaysNeeded = this.calculatePrepDays(readiness);

      // Get optimal scheduling window
      const optimalDates = this.getOptimalDates(prepDaysNeeded);
      const recommendedDate = optimalDates[0];

      // Get optimal time of day
      const recommendedTime = await this.getOptimalTimeOfDay(userId);

      // Calculate readiness score
      const readinessScore = readiness.readinessScore;

      const recommendation: ScheduleRecommendation = {
        recommendedDate,
        recommendedTime,
        prepDaysNeeded,
        readinessScore,
        confidence: Math.min(readinessScore / 100, 0.95),
        alternativeDates: optimalDates.slice(1, 4),
      };

      this.logger.info(
        `Generated schedule recommendation for user ${userId}, test ${testId}`,
        {
          recommendedDate,
          prepDays: prepDaysNeeded,
          readiness: readinessScore,
        },
      );

      return recommendation;
    } catch (error) {
      this.logger.error("Error generating schedule recommendation", {
        userId,
        testId,
        error,
      });
      throw error;
    }
  }

  /**
   * Assess readiness for test
   */
  async assessTestReadiness(
    userId: string,
    testId: string,
  ): Promise<TestReadiness> {
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test not found");

    const performance = await StudentPerformance.findOne({ userId });

    // Get test topics
    const testTopics = this.extractTestTopics(test);

    // Calculate prep percentage
    let prepPercentage = 0;
    const topicsToReview: string[] = [];

    if (performance) {
      const topicScores: Record<string, number> = {};

      performance.attemptHistory.forEach((attempt: any) => {
        if (testTopics.includes(attempt.topic)) {
          if (!topicScores[attempt.topic]) {
            topicScores[attempt.topic] = 0;
          }
          topicScores[attempt.topic] += attempt.score;
        }
      });

      // Calculate average for covered topics
      const coveredTopics = Object.keys(topicScores);
      if (coveredTopics.length > 0) {
        const avgScore =
          Object.values(topicScores).reduce(
            (a: number, b: number) => a + b,
            0,
          ) / coveredTopics.length;
        prepPercentage = Math.min(avgScore, 100);
      }

      // Identify topics needing review
      testTopics.forEach((topic) => {
        if (!topicScores[topic]) {
          topicsToReview.push(topic); // Not practiced
        } else if (topicScores[topic] < 70) {
          topicsToReview.push(topic); // Weak performance
        }
      });
    } else {
      // No practice data
      topicsToReview.push(...testTopics);
    }

    // Calculate readiness score
    const readinessScore = this.calculateReadinessScore(
      prepPercentage,
      topicsToReview.length,
      testTopics.length,
    );

    // Estimate prep time
    const estimatedPrepTime = this.estimatePrepTime(
      topicsToReview,
      prepPercentage,
    );

    return {
      isReady: readinessScore >= 75,
      readinessScore,
      prepPercentage,
      topicsToReview,
      estimatedPrepTime,
      recommendedAction: this.getReadinessRecommendation(readinessScore),
    };
  }

  /**
   * Calculate readiness score
   */
  private calculateReadinessScore(
    prepPercentage: number,
    topicsToReview: number,
    totalTopics: number,
  ): number {
    // 60% weight on performance, 40% weight on topic coverage
    const topicCoverageScore =
      ((totalTopics - topicsToReview) / totalTopics) * 100;
    return prepPercentage * 0.6 + topicCoverageScore * 0.4;
  }

  /**
   * Get readiness recommendation
   */
  private getReadinessRecommendation(score: number): string {
    if (score >= 85) {
      return "You are very well prepared. Consider taking the test soon.";
    } else if (score >= 70) {
      return "You are adequately prepared. A few more practice sessions would help.";
    } else if (score >= 50) {
      return "You need more preparation. Focus on weak topics.";
    } else {
      return "You need significant preparation before taking this test.";
    }
  }

  /**
   * Calculate days of prep needed
   */
  private calculatePrepDays(readiness: TestReadiness): number {
    if (readiness.isReady) {
      return 0; // Can take test immediately
    }

    // Estimate based on prep time needed
    const hoursPerDay = 2; // Assume 2 hours per day
    return Math.ceil(readiness.estimatedPrepTime / hoursPerDay);
  }

  /**
   * Get optimal dates for testing
   */
  private getOptimalDates(daysOfPrepNeeded: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysOfPrepNeeded);

    // Suggest dates that are not weekends
    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Avoid weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }

      if (dates.length >= 7) break;
    }

    return dates;
  }

  /**
   * Get optimal time of day for testing
   */
  private async getOptimalTimeOfDay(userId: string): Promise<string> {
    const performance = await StudentPerformance.findOne({ userId });

    if (!performance || !performance.timeTracking) {
      return "09:00"; // Default morning time
    }

    // Analyze when student performs best
    const timeOfDayScores: Record<string, number[]> = {};

    performance.timeTracking.forEach((timing: any) => {
      const hour = new Date(timing.timestamp).getHours();
      const period = this.getPeriodFromHour(hour);

      if (!timeOfDayScores[period]) {
        timeOfDayScores[period] = [];
      }
      timeOfDayScores[period].push(timing.score || 70);
    });

    // Find best performing period
    let bestPeriod = "09:00";
    let bestScore = 0;

    Object.entries(timeOfDayScores).forEach(([period, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestPeriod = period;
      }
    });

    return bestPeriod;
  }

  /**
   * Convert hour to period
   */
  private getPeriodFromHour(hour: number): string {
    if (hour >= 6 && hour < 12) return "09:00"; // Morning
    if (hour >= 12 && hour < 17) return "14:00"; // Afternoon
    if (hour >= 17 && hour < 21) return "18:00"; // Evening
    return "09:00"; // Default
  }

  /**
   * Extract topics from test
   */
  private extractTestTopics(test: any): string[] {
    const topicSet = new Set<string>();
    test.questions.forEach((q: any) => {
      if (q.topic) topicSet.add(q.topic);
    });
    return Array.from(topicSet);
  }

  /**
   * Estimate prep time needed
   */
  private estimatePrepTime(
    topicsToReview: string[],
    prepPercentage: number,
  ): number {
    // Base time per unprepared topic
    const hoursPerTopic = 3;
    const baseTime = topicsToReview.length * hoursPerTopic;

    // Adjust based on current prep level
    const adjustmentFactor = (100 - prepPercentage) / 100;

    return Math.ceil(baseTime * adjustmentFactor);
  }

  /**
   * Get optimal group schedule
   */
  async getOptimalGroupSchedule(
    participantIds: string[],
    testId: string,
  ): Promise<GroupSchedule> {
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test not found");

    // Get readiness for each participant
    const readinesses = await Promise.all(
      participantIds.map((id) => this.assessTestReadiness(id, testId)),
    );

    // Calculate maximum prep days needed
    const maxPrepDays = Math.max(
      ...readinesses.map((r) => this.calculatePrepDays(r)),
    );

    // Get optimal date based on maximum prep needed
    const optimalDates = this.getOptimalDates(maxPrepDays);
    const optimalDate = optimalDates[0];

    // Get optimal time
    // In production, would analyze conflicts and find best time for group
    optimalDate.setHours(9, 0, 0, 0);

    const averageReadiness =
      readinesses.reduce((sum, r) => sum + r.readinessScore, 0) /
      readinesses.length;

    return {
      optimalDateTime: optimalDate,
      participantIds,
      conflictCount: this.calculateScheduleConflicts(participantIds),
      averageReadiness: Math.round(averageReadiness),
    };
  }

  /**
   * Calculate schedule conflicts for group
   */
  private calculateScheduleConflicts(participantIds: string[]): number {
    // In production, would check actual calendar conflicts
    return 0;
  }

  /**
   * Get study schedule recommendations
   */
  async getStudySchedule(userId: string, testId: string): Promise<any> {
    const readiness = await this.assessTestReadiness(userId, testId);
    const test = await Test.findById(testId);

    if (!test) throw new Error("Test not found");

    const schedule = [];
    const topicsToReview = readiness.topicsToReview;
    const daysAvailable = readiness.estimatedPrepTime / 2; // 2 hours per day

    // Distribute topics across available days
    const topicsPerDay = Math.ceil(topicsToReview.length / daysAvailable);

    for (let day = 0; day < daysAvailable; day++) {
      const topicsForDay = topicsToReview.slice(
        day * topicsPerDay,
        (day + 1) * topicsPerDay,
      );

      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + day + 1);

      schedule.push({
        date: scheduleDate,
        topics: topicsForDay,
        hoursNeeded: 2,
        priority: day === 0 ? "high" : "medium",
      });
    }

    return {
      testName: test.name,
      totalPrepTime: readiness.estimatedPrepTime,
      schedule,
      testDate: new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000),
      recommendations: [
        "Study in 25-minute focus blocks with 5-minute breaks",
        "Review weak topics first, then build on strong areas",
        "Take practice tests every other day",
        "Get adequate sleep before test day",
      ],
    };
  }
}

export default SmartTestSchedulingService;
