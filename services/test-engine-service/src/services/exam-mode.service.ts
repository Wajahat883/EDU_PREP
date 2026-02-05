/**
 * Exam Mode Services
 * Handles different exam modes: Timed, Tutor, Untimed
 */

import TestSession from "../models/TestSession";

export interface ExamModeConfig {
  mode: "timed" | "tutor" | "untimed";
  timePerQuestion?: number; // seconds
  totalTime?: number; // seconds
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
  allowReview?: boolean;
  allowPause?: boolean;
  hintsPerQuestion?: number;
  adaptiveEnabled?: boolean;
  randomizeQuestions?: boolean;
}

export class ExamModeService {
  /**
   * TIMED MODE
   * - Fixed time per question or total time
   * - Real-time timer with WebSocket updates
   * - No pause (or limited pause)
   * - Immediate feedback on time up
   * - Auto-submit when time expires
   * - Minimal hints (0-1 per question)
   */
  static getTimedModeConfig(questionsCount: number): ExamModeConfig {
    return {
      mode: "timed",
      timePerQuestion: 60, // 60 seconds per question
      totalTime: questionsCount * 60, // Total: 1 minute per question
      showCorrectAnswer: false, // Only after exam
      showExplanation: false, // Only after exam
      allowReview: false, // Can't go back
      allowPause: false, // No pause in timed mode
      hintsPerQuestion: 0,
      adaptiveEnabled: false,
      randomizeQuestions: true,
    };
  }

  /**
   * TUTOR MODE
   * - Unlimited time per question
   * - Immediate feedback on answer
   * - Explanation after each question
   * - Can review and go back
   * - Multiple hints per question
   * - Adaptive difficulty based on performance
   * - Educational focus
   */
  static getTutorModeConfig(): ExamModeConfig {
    return {
      mode: "tutor",
      showCorrectAnswer: true, // Immediate feedback
      showExplanation: true, // Show explanation immediately
      allowReview: true, // Can go back and review
      allowPause: true, // Can pause to take a break
      hintsPerQuestion: 3, // Up to 3 hints per question
      adaptiveEnabled: true, // Difficulty adapts to performance
      randomizeQuestions: true,
    };
  }

  /**
   * UNTIMED MODE
   * - No time pressure
   * - Self-paced
   * - Can review any time
   * - Multiple attempts allowed
   * - Full explanations available
   * - Best for practice and learning
   */
  static getUntimedModeConfig(): ExamModeConfig {
    return {
      mode: "untimed",
      showCorrectAnswer: true,
      showExplanation: true,
      allowReview: true,
      allowPause: true,
      hintsPerQuestion: 5, // Unlimited hints
      adaptiveEnabled: false,
      randomizeQuestions: false, // Questions in order
    };
  }

  /**
   * Calculate remaining time based on elapsed time
   */
  static calculateTimeRemaining(
    timeLimit: number,
    startedAt: Date,
    pausedTime: number = 0,
  ): number {
    const now = Date.now();
    const startMs = startedAt.getTime();
    const elapsedMs = now - startMs - pausedTime * 1000;
    const remainingSeconds = Math.max(
      0,
      Math.floor((timeLimit * 1000 - elapsedMs) / 1000),
    );
    return remainingSeconds;
  }

  /**
   * Check if time is up
   */
  static isTimeUp(timeRemaining: number): boolean {
    return timeRemaining <= 0;
  }

  /**
   * Get time warning level
   */
  static getTimeWarningLevel(
    timeRemaining: number,
    totalTime: number,
  ): "normal" | "warning" | "critical" {
    const percentageRemaining = (timeRemaining / totalTime) * 100;

    if (percentageRemaining > 25) return "normal";
    if (percentageRemaining > 10) return "warning";
    return "critical";
  }

  /**
   * Format time for display
   */
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }

  /**
   * Calculate adaptive difficulty for next question
   * Based on Item Response Theory (IRT) principles
   */
  static calculateAdaptiveDifficulty(
    session: any,
    currentScore: number,
  ): number {
    const adaptiveFeatures = session.adaptiveFeatures;
    const currentDifficulty = adaptiveFeatures.nextQuestionDifficulty || 5;

    // If last answer was correct, increase difficulty
    if (currentScore === 1) {
      // Increase by 1, max 10
      const newDifficulty = Math.min(currentDifficulty + 1, 10);
      return newDifficulty;
    }

    // If last answer was incorrect, decrease difficulty
    if (currentScore === 0) {
      // Decrease by 1, min 1
      const newDifficulty = Math.max(currentDifficulty - 1, 1);
      return newDifficulty;
    }

    // Neutral score (0.5) - keep same difficulty
    return currentDifficulty;
  }

  /**
   * Generate hint sequence based on mode
   */
  static generateHintSequence(questionData: any, hintLevel: number): string {
    const hints = [
      `Consider the definition: ${questionData.hint1 || "Review the concept definition"}`,
      `Key concept: ${questionData.hint2 || "Focus on the main concept"}`,
      `Analysis: ${questionData.hint3 || "Eliminate incorrect options"}`,
      `Narrow down: ${questionData.hint4 || "Focus on two most likely options"}`,
      `Final hint: The correct answer is ${questionData.correctAnswerHint || "one of the highlighted options"}`,
    ];

    return hints[Math.min(hintLevel, hints.length - 1)];
  }

  /**
   * Check if session time limit exceeded (background check)
   */
  static hasSessionExpired(session: any): boolean {
    if (session.mode !== "timed" || !session.timeLimit) return false;

    const timeRemaining = this.calculateTimeRemaining(
      session.timeLimit,
      session.startedAt,
      session.totalPausedTime,
    );

    return timeRemaining <= 0;
  }

  /**
   * Calculate statistics for session
   */
  static async calculateSessionStatistics(session: any): Promise<{
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
    averageTimePerQuestion: number;
    bloomDistribution: Record<string, number>;
  }> {
    const answers = session.answers || [];
    const totalQuestions = session.questionIds.length;
    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const scorePercentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Calculate average time
    const totalTime = answers.reduce(
      (sum: number, a: any) => sum + (a.timeSpent || 0),
      0,
    );
    const averageTimePerQuestion =
      answers.length > 0 ? Math.round(totalTime / answers.length) : 0;

    // Bloom distribution (would need to fetch questions to get bloom levels)
    const bloomDistribution: Record<string, number> = {};

    return {
      correctCount,
      totalQuestions,
      scorePercentage: Math.round(scorePercentage * 100) / 100,
      averageTimePerQuestion,
      bloomDistribution,
    };
  }
}

export default ExamModeService;
