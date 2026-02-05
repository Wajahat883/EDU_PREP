/**
 * Performance Metrics Service
 * Calculates comprehensive performance statistics
 */

import UserAnalytics from "../models/UserAnalytics";

export class PerformanceMetricsService {
  /**
   * Calculate overall performance summary
   */
  static calculateSummary(analytics: any): {
    totalExams: number;
    averageScore: number;
    scoreRange: { min: number; max: number };
    consistencyScore: number;
    studyTimeHours: number;
    strengthAreas: number;
    weakAreas: number;
  } {
    const performanceHistory = analytics.performanceHistory || [];
    const scores = performanceHistory.map((p: any) => p.scorePercentage);

    const totalExams = performanceHistory.length;
    const averageScore =
      totalExams > 0
        ? Math.round(
            (scores.reduce((a: number, b: number) => a + b, 0) / totalExams) *
              100,
          ) / 100
        : 0;

    const minScore = totalExams > 0 ? Math.min(...scores) : 0;
    const maxScore = totalExams > 0 ? Math.max(...scores) : 0;

    // Calculate consistency (standard deviation)
    const variance =
      totalExams > 0
        ? scores.reduce(
            (sum: number, s: number) => sum + Math.pow(s - averageScore, 2),
            0,
          ) / totalExams
        : 0;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, Math.min(100, 100 - stdDev)); // Higher consistency = lower variance

    const studyTimeHours =
      Math.round(((analytics.totalStudyTime || 0) / 3600) * 100) / 100;
    const strengthAreas = (analytics.strengthAreas || []).length;
    const weakAreas = (analytics.weakAreas || []).length;

    return {
      totalExams,
      averageScore,
      scoreRange: { min: minScore, max: maxScore },
      consistencyScore: Math.round(consistencyScore),
      studyTimeHours,
      strengthAreas,
      weakAreas,
    };
  }

  /**
   * Analyze performance by exam mode
   */
  static analyzeByMode(analytics: any): {
    timed: { attempts: number; averageScore: number; trend: string };
    tutor: { attempts: number; averageScore: number; trend: string };
    untimed: { attempts: number; averageScore: number; trend: string };
  } {
    const history = analytics.performanceHistory || [];

    const timedExams = history.filter((p: any) => p.mode === "timed");
    const tutorExams = history.filter((p: any) => p.mode === "tutor");
    const untimedExams = history.filter((p: any) => p.mode === "untimed");

    const calculateTrend = (exams: any[]): string => {
      if (exams.length < 2) return "insufficient_data";
      const recent = exams.slice(-5);
      const recentAvg =
        recent.reduce((sum: number, e: any) => sum + e.scorePercentage, 0) /
        recent.length;
      const older = exams.slice(0, Math.min(5, exams.length - 1));
      const olderAvg =
        older.reduce((sum: number, e: any) => sum + e.scorePercentage, 0) /
        older.length;

      const diff = recentAvg - olderAvg;
      if (diff > 2) return "improving";
      if (diff < -2) return "declining";
      return "stable";
    };

    return {
      timed: {
        attempts: timedExams.length,
        averageScore:
          timedExams.length > 0
            ? Math.round(
                (timedExams.reduce(
                  (sum: number, e: any) => sum + e.scorePercentage,
                  0,
                ) /
                  timedExams.length) *
                  100,
              ) / 100
            : 0,
        trend: calculateTrend(timedExams),
      },
      tutor: {
        attempts: tutorExams.length,
        averageScore:
          tutorExams.length > 0
            ? Math.round(
                (tutorExams.reduce(
                  (sum: number, e: any) => sum + e.scorePercentage,
                  0,
                ) /
                  tutorExams.length) *
                  100,
              ) / 100
            : 0,
        trend: calculateTrend(tutorExams),
      },
      untimed: {
        attempts: untimedExams.length,
        averageScore:
          untimedExams.length > 0
            ? Math.round(
                (untimedExams.reduce(
                  (sum: number, e: any) => sum + e.scorePercentage,
                  0,
                ) /
                  untimedExams.length) *
                  100,
              ) / 100
            : 0,
        trend: calculateTrend(untimedExams),
      },
    };
  }

  /**
   * Analyze performance by exam type
   */
  static analyzeByExamType(analytics: any): Record<
    string,
    {
      attempts: number;
      averageScore: number;
      bestScore: number;
      trend: string;
    }
  > {
    const history = analytics.performanceHistory || [];
    const byExamType: Record<string, any[]> = {};

    for (const exam of history) {
      if (!byExamType[exam.examType]) {
        byExamType[exam.examType] = [];
      }
      byExamType[exam.examType].push(exam);
    }

    const result: Record<string, any> = {};

    for (const examType in byExamType) {
      const exams = byExamType[examType];
      const scores = exams.map((e: any) => e.scorePercentage);

      const calculateTrend = (): string => {
        if (exams.length < 2) return "insufficient_data";
        const recent = exams.slice(-3);
        const recentAvg =
          recent.reduce((sum: number, e: any) => sum + e.scorePercentage, 0) /
          recent.length;
        const older = exams.slice(0, Math.min(3, exams.length - 1));
        const olderAvg =
          older.reduce((sum: number, e: any) => sum + e.scorePercentage, 0) /
          older.length;

        const diff = recentAvg - olderAvg;
        if (diff > 3) return "improving";
        if (diff < -3) return "declining";
        return "stable";
      };

      result[examType] = {
        attempts: exams.length,
        averageScore:
          Math.round(
            (scores.reduce((a: number, b: number) => a + b, 0) / exams.length) *
              100,
          ) / 100,
        bestScore: Math.max(...scores),
        trend: calculateTrend(),
      };
    }

    return result;
  }

  /**
   * Analyze time efficiency
   */
  static analyzeTimeEfficiency(analytics: any): {
    totalStudyTime: number;
    averageTimePerExam: number;
    averageTimePerQuestion: number;
    studyStreak: number;
    recommendedDailyTime: number;
  } {
    const history = analytics.performanceHistory || [];

    const totalTimeSpent = history.reduce(
      (sum: number, e: any) => sum + (e.timeSpent || 0),
      0,
    );
    const averageTimePerExam =
      history.length > 0 ? Math.round(totalTimeSpent / history.length) : 0;

    const totalQuestionsAttempted = history.reduce(
      (sum: number, e: any) => sum + (e.totalQuestions || 0),
      0,
    );
    const averageTimePerQuestion =
      totalQuestionsAttempted > 0
        ? Math.round(totalTimeSpent / totalQuestionsAttempted)
        : 0;

    // Calculate study streak (consecutive days with activity)
    const studyStreak = PerformanceMetricsService.calculateStudyStreak(history);

    // Recommended study time (based on improvement needs)
    const recommendedDailyTime =
      PerformanceMetricsService.calculateRecommendedStudyTime(analytics);

    return {
      totalStudyTime: analytics.totalStudyTime || 0,
      averageTimePerExam,
      averageTimePerQuestion,
      studyStreak,
      recommendedDailyTime,
    };
  }

  /**
   * Calculate study streak
   */
  static calculateStudyStreak(history: any[]): number {
    if (history.length === 0) return 0;

    const sortedByDate = history.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let streak = 0;
    let currentDate = new Date();

    for (const exam of sortedByDate) {
      const examDate = new Date(exam.date);
      const daysDiff = Math.floor(
        (currentDate.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff <= streak + 1) {
        streak++;
        currentDate = new Date(examDate);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate recommended daily study time
   */
  static calculateRecommendedStudyTime(analytics: any): number {
    const averageScore = analytics.averageScore || 0;
    const totalExams = analytics.totalExamsAttempted || 0;

    // Base recommendation: 60 minutes per day
    let recommendedTime = 60;

    // Adjust based on score
    if (averageScore < 70) {
      recommendedTime = 90; // More time needed for improvement
    } else if (averageScore < 80) {
      recommendedTime = 75;
    } else if (averageScore > 90) {
      recommendedTime = 45; // Less time needed for maintenance
    }

    // Adjust based on exams taken (more exams = good progress)
    if (totalExams < 10) {
      recommendedTime = Math.min(recommendedTime + 20, 120);
    }

    return recommendedTime;
  }

  /**
   * Identify strength areas
   */
  static identifyStrengthAreas(history: any[]): Array<{
    area: string;
    type: "bloomLevel" | "difficulty" | "subject";
    correctPercentage: number;
    questionCount: number;
  }> {
    const areaStats: Record<
      string,
      { correct: number; total: number; type: string }
    > = {};

    for (const exam of history) {
      // Bloom levels
      for (const [level, stats] of Object.entries(
        exam.bloomLevelBreakdown || {},
      )) {
        const key = `bloom_${level}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "bloomLevel" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }

      // Difficulty levels
      for (const [level, stats] of Object.entries(
        exam.difficultyBreakdown || {},
      )) {
        const key = `difficulty_${level}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "difficulty" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }

      // Subjects
      for (const [subject, stats] of Object.entries(
        exam.subjectBreakdown || {},
      )) {
        const key = `subject_${subject}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "subject" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }
    }

    const results = [];
    for (const [key, stats] of Object.entries(areaStats)) {
      const percentage =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      if (percentage >= 80) {
        // Strength = 80%+
        const [type, area] = key.split("_");
        results.push({
          area,
          type: stats.type as any,
          correctPercentage: percentage,
          questionCount: stats.total,
        });
      }
    }

    return results.sort((a, b) => b.correctPercentage - a.correctPercentage);
  }

  /**
   * Identify weak areas
   */
  static identifyWeakAreas(history: any[]): Array<{
    area: string;
    type: "bloomLevel" | "difficulty" | "subject";
    correctPercentage: number;
    questionCount: number;
    recommendedQuestionCount: number;
  }> {
    const areaStats: Record<
      string,
      { correct: number; total: number; type: string }
    > = {};

    for (const exam of history) {
      for (const [level, stats] of Object.entries(
        exam.bloomLevelBreakdown || {},
      )) {
        const key = `bloom_${level}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "bloomLevel" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }

      for (const [level, stats] of Object.entries(
        exam.difficultyBreakdown || {},
      )) {
        const key = `difficulty_${level}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "difficulty" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }

      for (const [subject, stats] of Object.entries(
        exam.subjectBreakdown || {},
      )) {
        const key = `subject_${subject}`;
        if (!areaStats[key]) {
          areaStats[key] = { correct: 0, total: 0, type: "subject" };
        }
        areaStats[key].correct += (stats as any).correct || 0;
        areaStats[key].total += (stats as any).total || 0;
      }
    }

    const results = [];
    for (const [key, stats] of Object.entries(areaStats)) {
      const percentage =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      if (percentage < 70) {
        // Weak = < 70%
        const [type, area] = key.split("_");
        const recommendedQuestionCount = Math.max(
          20,
          Math.round(stats.total * 1.5),
        ); // 50% more practice
        results.push({
          area,
          type: stats.type as any,
          correctPercentage: percentage,
          questionCount: stats.total,
          recommendedQuestionCount,
        });
      }
    }

    return results.sort((a, b) => a.correctPercentage - b.correctPercentage);
  }
}

export default PerformanceMetricsService;
