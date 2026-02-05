import { EventEmitter } from "events";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  totalPoints: number;
  streak: number;
  averageScore: number;
  testsCompleted: number;
  lastActivityDate: Date;
}

export interface LeaderboardFilter {
  timeframe?: "weekly" | "monthly" | "all-time";
  subject?: string;
  region?: string;
  gradeLevel?: string;
}

export class LeaderboardService extends EventEmitter {
  private globalLeaderboard: Map<string, LeaderboardEntry> = new Map();
  private classLeaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private subjectLeaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private weeklySnapshots: Map<string, LeaderboardEntry[]> = new Map();
  private monthlySnapshots: Map<string, LeaderboardEntry[]> = new Map();

  constructor() {
    super();
    this.initializeSnapshots();
  }

  private initializeSnapshots(): void {
    // Take weekly snapshot at start
    const weekKey = this.getWeekKey();
    this.weeklySnapshots.set(weekKey, []);

    // Take monthly snapshot at start
    const monthKey = this.getMonthKey();
    this.monthlySnapshots.set(monthKey, []);
  }

  private getWeekKey(): string {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return weekStart.toISOString().split("T")[0];
  }

  private getMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // Update user entry in leaderboards
  updateUserLeaderboard(entry: Omit<LeaderboardEntry, "rank">): void {
    // Update global leaderboard
    this.globalLeaderboard.set(entry.userId, {
      ...entry,
      rank: 0, // Will be calculated on retrieval
    });

    this.emit("leaderboard:updated", {
      userId: entry.userId,
      points: entry.totalPoints,
      level: entry.level,
    });
  }

  // Get global leaderboard
  getGlobalLeaderboard(
    limit: number = 100,
    filter?: LeaderboardFilter,
  ): LeaderboardEntry[] {
    let entries = Array.from(this.globalLeaderboard.values());

    // Apply filters
    if (filter?.region) {
      // Would filter by region if region data available
    }
    if (filter?.gradeLevel) {
      // Would filter by grade level if grade data available
    }

    // Sort by points, then by streak, then by level
    entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }
      return b.level - a.level;
    });

    // Add ranks and limit
    return entries.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Get top 10 global leaders
  getTopLeaders(limit: number = 10): LeaderboardEntry[] {
    return this.getGlobalLeaderboard(limit);
  }

  // Get user rank
  getUserRank(userId: string): number {
    const entries = this.getGlobalLeaderboard(10000);
    const userEntry = entries.find((e) => e.userId === userId);
    return userEntry?.rank ?? -1;
  }

  // Get user percentile
  getUserPercentile(userId: string): number {
    const entries = this.getGlobalLeaderboard(10000);
    const userEntry = entries.find((e) => e.userId === userId);
    if (!userEntry) return 0;

    return ((entries.length - userEntry.rank) / entries.length) * 100;
  }

  // Get class leaderboard
  getClassLeaderboard(classId: string, limit: number = 50): LeaderboardEntry[] {
    const classEntries = this.classLeaderboards.get(classId) || [];

    // Sort and add ranks
    const sorted = classEntries
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.level - a.level;
      })
      .slice(0, limit);

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Update class leaderboard
  updateClassLeaderboard(
    classId: string,
    entry: Omit<LeaderboardEntry, "rank">,
  ): void {
    let classEntries = this.classLeaderboards.get(classId) || [];

    // Update or add entry
    const existingIndex = classEntries.findIndex(
      (e) => e.userId === entry.userId,
    );
    if (existingIndex >= 0) {
      classEntries[existingIndex] = { ...entry, rank: 0 };
    } else {
      classEntries.push({ ...entry, rank: 0 });
    }

    this.classLeaderboards.set(classId, classEntries);

    this.emit("class-leaderboard:updated", {
      classId,
      userId: entry.userId,
      points: entry.totalPoints,
    });
  }

  // Get subject leaderboard
  getSubjectLeaderboard(
    subject: string,
    limit: number = 50,
  ): LeaderboardEntry[] {
    const subjectEntries = this.subjectLeaderboards.get(subject) || [];

    const sorted = subjectEntries
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.averageScore - a.averageScore;
      })
      .slice(0, limit);

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Update subject leaderboard
  updateSubjectLeaderboard(
    subject: string,
    entry: Omit<LeaderboardEntry, "rank">,
  ): void {
    let subjectEntries = this.subjectLeaderboards.get(subject) || [];

    const existingIndex = subjectEntries.findIndex(
      (e) => e.userId === entry.userId,
    );
    if (existingIndex >= 0) {
      subjectEntries[existingIndex] = { ...entry, rank: 0 };
    } else {
      subjectEntries.push({ ...entry, rank: 0 });
    }

    this.subjectLeaderboards.set(subject, subjectEntries);

    this.emit("subject-leaderboard:updated", {
      subject,
      userId: entry.userId,
      points: entry.totalPoints,
    });
  }

  // Get weekly leaderboard
  getWeeklyLeaderboard(limit: number = 50): LeaderboardEntry[] {
    const weekKey = this.getWeekKey();
    const weeklyEntries = this.weeklySnapshots.get(weekKey) || [];

    const sorted = weeklyEntries
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Get monthly leaderboard
  getMonthlyLeaderboard(limit: number = 50): LeaderboardEntry[] {
    const monthKey = this.getMonthKey();
    const monthlyEntries = this.monthlySnapshots.get(monthKey) || [];

    const sorted = monthlyEntries
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Record weekly snapshot (should be called weekly)
  recordWeeklySnapshot(): void {
    const weekKey = this.getWeekKey();
    const current = this.getGlobalLeaderboard(1000);
    this.weeklySnapshots.set(weekKey, current);

    this.emit("snapshot:weekly", {
      timestamp: new Date(),
      topEntries: current.slice(0, 10),
    });
  }

  // Record monthly snapshot (should be called monthly)
  recordMonthlySnapshot(): void {
    const monthKey = this.getMonthKey();
    const current = this.getGlobalLeaderboard(1000);
    this.monthlySnapshots.set(monthKey, current);

    this.emit("snapshot:monthly", {
      timestamp: new Date(),
      topEntries: current.slice(0, 10),
    });
  }

  // Get user comparison
  getUserComparison(
    userId: string,
    compareWith: string[],
  ): {
    userRank: number;
    userPoints: number;
    competitors: Array<{
      rank: number;
      userId: string;
      points: number;
      level: number;
      difference: number;
    }>;
  } {
    const userEntry = this.globalLeaderboard.get(userId);
    if (!userEntry) {
      return {
        userRank: -1,
        userPoints: 0,
        competitors: [],
      };
    }

    const allEntries = this.getGlobalLeaderboard(10000);
    const userRank = allEntries.findIndex((e) => e.userId === userId) + 1;

    const competitors = compareWith
      .map((id) => {
        const entry = this.globalLeaderboard.get(id);
        if (!entry) return null;

        const rank = allEntries.findIndex((e) => e.userId === id) + 1;
        return {
          rank,
          userId: id,
          points: entry.totalPoints,
          level: entry.level,
          difference: userEntry.totalPoints - entry.totalPoints,
        };
      })
      .filter((c) => c !== null) as any[];

    return {
      userRank,
      userPoints: userEntry.totalPoints,
      competitors: competitors.sort((a, b) => b.points - a.points),
    };
  }

  // Get leaderboard analytics
  getLeaderboardAnalytics(): {
    totalParticipants: number;
    averagePoints: number;
    medianPoints: number;
    topScore: number;
    bottomScore: number;
    averageLevel: number;
  } {
    const entries = Array.from(this.globalLeaderboard.values());
    if (entries.length === 0) {
      return {
        totalParticipants: 0,
        averagePoints: 0,
        medianPoints: 0,
        topScore: 0,
        bottomScore: 0,
        averageLevel: 0,
      };
    }

    const points = entries.map((e) => e.totalPoints).sort((a, b) => a - b);
    const levels = entries.map((e) => e.level);

    return {
      totalParticipants: entries.length,
      averagePoints: Math.floor(
        entries.reduce((sum, e) => sum + e.totalPoints, 0) / entries.length,
      ),
      medianPoints: points[Math.floor(points.length / 2)],
      topScore: Math.max(...points),
      bottomScore: Math.min(...points),
      averageLevel: Math.floor(
        levels.reduce((sum, l) => sum + l, 0) / levels.length,
      ),
    };
  }
}

export const leaderboardService = new LeaderboardService();

export default LeaderboardService;
