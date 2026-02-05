/**
 * Scoring and Results Service
 * Calculates scores, grades, and generates detailed results
 */

import TestSession from "../models/TestSession";

export interface ScoringResult {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  grade: string;
  performanceLevel: "excellent" | "good" | "average" | "below_average" | "poor";
  timeAnalysis: {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    timeEfficiency: number; // percentage
  };
  questionAnalysis: {
    byBloomLevel: Record<
      string,
      { correct: number; total: number; percentage: number }
    >;
    byDifficulty: Record<
      number,
      { correct: number; total: number; percentage: number }
    >;
    bySubject: Record<
      string,
      { correct: number; total: number; percentage: number }
    >;
  };
  recommendations: string[];
  detailedBreakdown: any[];
}

export class ScoringService {
  /**
   * Calculate score based on answers
   */
  static calculateScore(
    answers: any[],
    totalQuestions: number,
  ): {
    correctCount: number;
    scorePercentage: number;
  } {
    const correctCount = answers.filter((a) => a.isCorrect === true).length;
    const scorePercentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      correctCount,
      scorePercentage: Math.round(scorePercentage * 100) / 100,
    };
  }

  /**
   * Convert percentage to letter grade
   */
  static getGrade(scorePercentage: number): {
    grade: string;
    performanceLevel: string;
  } {
    if (scorePercentage >= 90)
      return { grade: "A", performanceLevel: "excellent" };
    if (scorePercentage >= 80) return { grade: "B", performanceLevel: "good" };
    if (scorePercentage >= 70)
      return { grade: "C", performanceLevel: "average" };
    if (scorePercentage >= 60)
      return { grade: "D", performanceLevel: "below_average" };
    return { grade: "F", performanceLevel: "poor" };
  }

  /**
   * Analyze time efficiency
   */
  static analyzeTimeEfficiency(
    answers: any[],
    timeLimit?: number,
  ): {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    timeEfficiency: number;
  } {
    const totalTimeSpent = answers.reduce(
      (sum, a) => sum + (a.timeSpent || 0),
      0,
    );
    const averageTimePerQuestion =
      answers.length > 0 ? Math.round(totalTimeSpent / answers.length) : 0;

    // Time efficiency: % of available time used (lower is better if accuracy maintained)
    let timeEfficiency = 100;
    if (timeLimit) {
      timeEfficiency = Math.round((totalTimeSpent / timeLimit) * 100);
    }

    return {
      totalTimeSpent,
      averageTimePerQuestion,
      timeEfficiency,
    };
  }

  /**
   * Analyze performance by question attributes
   */
  static analyzePerformanceByAttribute(
    answers: any[],
    questionData: Record<string, any>,
  ): {
    byBloomLevel: Record<
      string,
      { correct: number; total: number; percentage: number }
    >;
    byDifficulty: Record<
      number,
      { correct: number; total: number; percentage: number }
    >;
    bySubject: Record<
      string,
      { correct: number; total: number; percentage: number }
    >;
  } {
    const byBloomLevel: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};
    const byDifficulty: Record<
      number,
      { correct: number; total: number; percentage: number }
    > = {};
    const bySubject: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};

    for (const answer of answers) {
      const q = questionData[answer.questionId];
      if (!q) continue;

      // By Bloom Level
      const bloomLevel = q.bloomLevel || "Unknown";
      if (!byBloomLevel[bloomLevel]) {
        byBloomLevel[bloomLevel] = { correct: 0, total: 0, percentage: 0 };
      }
      byBloomLevel[bloomLevel].total++;
      if (answer.isCorrect) byBloomLevel[bloomLevel].correct++;

      // By Difficulty
      const difficulty = q.difficulty || 5;
      if (!byDifficulty[difficulty]) {
        byDifficulty[difficulty] = { correct: 0, total: 0, percentage: 0 };
      }
      byDifficulty[difficulty].total++;
      if (answer.isCorrect) byDifficulty[difficulty].correct++;

      // By Subject
      const subject = q.subject || "Unknown";
      if (!bySubject[subject]) {
        bySubject[subject] = { correct: 0, total: 0, percentage: 0 };
      }
      bySubject[subject].total++;
      if (answer.isCorrect) bySubject[subject].correct++;
    }

    // Calculate percentages
    for (const level in byBloomLevel) {
      const stat = byBloomLevel[level];
      stat.percentage =
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    for (const diff in byDifficulty) {
      const stat = byDifficulty[diff];
      stat.percentage =
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    for (const subj in bySubject) {
      const stat = bySubject[subj];
      stat.percentage =
        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    return { byBloomLevel, byDifficulty, bySubject };
  }

  /**
   * Generate personalized recommendations
   */
  static generateRecommendations(
    scorePercentage: number,
    performanceByAttribute: any,
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance
    if (scorePercentage < 60) {
      recommendations.push(
        "Focus on foundational concepts before attempting more advanced questions.",
      );
      recommendations.push(
        "Consider studying with a tutor or joining a study group.",
      );
      recommendations.push(
        "Review the explanations for incorrect answers carefully.",
      );
    } else if (scorePercentage < 75) {
      recommendations.push("Review areas where you struggled most.");
      recommendations.push("Practice more questions in challenging topics.");
      recommendations.push(
        "Consider taking longer to understand explanations.",
      );
    } else if (scorePercentage < 85) {
      recommendations.push("You're on the right track! Continue practicing.");
      recommendations.push("Focus on difficult questions to improve further.");
    } else {
      recommendations.push("Excellent performance! Keep up the great work.");
      recommendations.push(
        "Try taking more challenging exams to test your limits.",
      );
    }

    // By Bloom Level
    for (const level in performanceByAttribute.byBloomLevel) {
      const stat = performanceByAttribute.byBloomLevel[level];
      if (stat.percentage < 60) {
        recommendations.push(
          `Strengthen your ${level.toLowerCase()} level skills - you scored only ${stat.percentage}% on these questions.`,
        );
      }
    }

    // By Difficulty
    const hardQuestions = performanceByAttribute.byDifficulty[8];
    if (hardQuestions && hardQuestions.percentage < 50) {
      recommendations.push(
        "Spend extra time on difficult (8-10) level questions.",
      );
    }

    return recommendations;
  }

  /**
   * Generate detailed results report
   */
  static generateDetailedResults(
    session: any,
    answers: any[],
    questionData: Record<string, any>,
  ): ScoringResult {
    const { correctCount, scorePercentage } = this.calculateScore(
      answers,
      session.questionIds.length,
    );
    const { grade, performanceLevel } = this.getGrade(scorePercentage);
    const timeAnalysis = this.analyzeTimeEfficiency(answers, session.timeLimit);
    const questionAnalysis = this.analyzePerformanceByAttribute(
      answers,
      questionData,
    );
    const recommendations = this.generateRecommendations(
      scorePercentage,
      questionAnalysis,
    );

    // Detailed breakdown by question
    const detailedBreakdown = answers.map((answer) => {
      const q = questionData[answer.questionId];
      return {
        questionId: answer.questionId,
        questionNumber: session.questionIds.indexOf(answer.questionId) + 1,
        stem: q?.stemText,
        userAnswer: answer.selectedOption,
        correctAnswer: q?.correctOption,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        difficulty: q?.difficulty,
        bloomLevel: q?.bloomLevel,
        subject: q?.subject,
        explanation: q?.explanationText,
        markedForReview: answer.markedForReview,
        hintsUsed: answer.hints?.length || 0,
      };
    });

    return {
      correctCount,
      totalQuestions: session.questionIds.length,
      scorePercentage,
      grade,
      performanceLevel: performanceLevel as any,
      timeAnalysis,
      questionAnalysis,
      recommendations,
      detailedBreakdown,
    };
  }

  /**
   * Compare with previous attempts (for learning progress)
   */
  static compareWithPreviousAttempt(
    currentResult: ScoringResult,
    previousResult?: ScoringResult,
  ): {
    scoreImprovement: number;
    isImproving: boolean;
    comparison: string;
  } {
    if (!previousResult) {
      return {
        scoreImprovement: 0,
        isImproving: false,
        comparison: "This is your first attempt on this exam",
      };
    }

    const improvement =
      currentResult.scorePercentage - previousResult.scorePercentage;
    const isImproving = improvement > 0;

    let comparison = "";
    if (improvement > 10) {
      comparison = `Excellent improvement! You improved by ${Math.round(improvement)}%`;
    } else if (improvement > 0) {
      comparison = `Good progress! You improved by ${Math.round(improvement)}%`;
    } else if (improvement === 0) {
      comparison = "Same score as previous attempt";
    } else {
      comparison = `Score decreased by ${Math.round(Math.abs(improvement))}%. Review your study approach.`;
    }

    return {
      scoreImprovement: improvement,
      isImproving,
      comparison,
    };
  }

  /**
   * Percentile ranking (mock implementation)
   */
  static calculatePercentileRank(
    userScore: number,
    allScores: number[],
  ): number {
    const scoresBelow = allScores.filter((s) => s < userScore).length;
    return Math.round((scoresBelow / allScores.length) * 100);
  }

  /**
   * Standards-based scoring (MCAT/USMLE percentile equivalents)
   */
  static getStandardScore(
    scorePercentage: number,
    examType: string,
  ): {
    percentile: number;
    equivalent: string;
    interpretation: string;
  } {
    const mappings: Record<
      string,
      Record<number, { percentile: number; equivalent: string }>
    > = {
      mcat: {
        95: { percentile: 99, equivalent: "528-532" },
        90: { percentile: 98, equivalent: "524-527" },
        85: { percentile: 95, equivalent: "519-523" },
        80: { percentile: 90, equivalent: "514-518" },
        75: { percentile: 85, equivalent: "509-513" },
      },
      usmle: {
        90: { percentile: 99, equivalent: "270-300" },
        85: { percentile: 95, equivalent: "260-269" },
        80: { percentile: 90, equivalent: "250-259" },
        75: { percentile: 85, equivalent: "240-249" },
        70: { percentile: 80, equivalent: "230-239" },
      },
    };

    const mapping = mappings[examType] || mappings.mcat;
    const keys = Object.keys(mapping)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of keys) {
      if (scorePercentage >= threshold) {
        const { percentile, equivalent } = mapping[threshold];
        return {
          percentile,
          equivalent,
          interpretation: `Your performance is in the ${percentile}th percentile range`,
        };
      }
    }

    return {
      percentile: 50,
      equivalent: "Below average range",
      interpretation: "Score below benchmark",
    };
  }
}

export default ScoringService;
