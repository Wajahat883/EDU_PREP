import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { apiClient } from "../services/mobileApiClient";

interface UserStats {
  totalQuestionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  averageScore: number;
  streakDays: number;
  timeSpentMinutes: number;
  subjectPerformance: Record<string, number>;
}

interface PerformanceTrend {
  week: number;
  averageScore: number;
  questionsAttempted: number;
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, recsRes] = await Promise.all([
        apiClient.getUserStats(),
        apiClient.getRecommendations(),
      ]);

      setStats(statsRes.data);
      setRecommendations(recsRes.data.recommendations || []);

      // Calculate trends from stats
      if (statsRes.data.weeklyPerformance) {
        setTrends(statsRes.data.weeklyPerformance);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  }, [loadDashboardData]);

  if (loading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Summary</Text>

        <View style={styles.statsGrid}>
          <StatCard
            label="Accuracy"
            value={`${stats?.accuracy || 0}%`}
            color="#4CAF50"
          />
          <StatCard
            label="Streak"
            value={`${stats?.streakDays || 0} days`}
            color="#FF9800"
          />
          <StatCard
            label="Questions"
            value={`${stats?.totalQuestionsAttempted || 0}`}
            color="#2196F3"
          />
          <StatCard
            label="Time Spent"
            value={`${Math.round((stats?.timeSpentMinutes || 0) / 60)}h`}
            color="#9C27B0"
          />
        </View>
      </View>

      {/* Subject Performance */}
      {stats?.subjectPerformance &&
        Object.keys(stats.subjectPerformance).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject Performance</Text>
            {Object.entries(stats.subjectPerformance).map(
              ([subject, score]) => (
                <SubjectBar
                  key={subject}
                  subject={subject}
                  score={score as number}
                />
              ),
            )}
          </View>
        )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          {recommendations.slice(0, 3).map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </View>
      )}

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickActionGrid />
      </View>

      {/* Weekly Trend */}
      {trends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
          <WeeklyTrendChart trends={trends} />
        </View>
      )}
    </ScrollView>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface SubjectBarProps {
  subject: string;
  score: number;
}

const SubjectBar: React.FC<SubjectBarProps> = ({ subject, score }) => (
  <View style={styles.subjectBarContainer}>
    <Text style={styles.subjectName}>{subject}</Text>
    <View style={styles.progressBarBackground}>
      <View
        style={[styles.progressBar, { width: `${Math.min(score, 100)}%` }]}
      />
    </View>
    <Text style={styles.subjectScore}>{Math.round(score)}%</Text>
  </View>
);

interface RecommendationCardProps {
  recommendation: any;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
}) => (
  <View style={styles.recommendationCard}>
    <View style={styles.recommendationHeader}>
      <Text style={styles.recommendationTitle}>
        {recommendation.questionText}
      </Text>
      <Text style={styles.relevanceScore}>
        {Math.round(recommendation.relevanceScore)}% match
      </Text>
    </View>
    <Text style={styles.recommendationReason}>{recommendation.reason}</Text>
  </View>
);

const QuickActionGrid: React.FC = () => (
  <View style={styles.actionGrid}>
    <ActionButton label="Practice" icon="📚" />
    <ActionButton label="Tests" icon="📝" />
    <ActionButton label="Analytics" icon="📊" />
    <ActionButton label="Settings" icon="⚙️" />
  </View>
);

interface ActionButtonProps {
  label: string;
  icon: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon }) => (
  <View style={styles.actionButton}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

interface WeeklyTrendChartProps {
  trends: PerformanceTrend[];
}

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ trends }) => {
  const maxScore = Math.max(...trends.map((t) => t.averageScore), 100);

  return (
    <View style={styles.trendChart}>
      {trends.slice(-7).map((trend, index) => (
        <View key={index} style={styles.trendBar}>
          <View
            style={[
              styles.trendBarFill,
              { height: `${(trend.averageScore / maxScore) * 100}%` },
            ]}
          />
          <Text style={styles.trendLabel}>W{trend.week}</Text>
          <Text style={styles.trendValue}>
            {Math.round(trend.averageScore)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 12,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  subjectBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 8,
  },
  subjectName: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  subjectScore: {
    width: 50,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  recommendationCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
  },
  relevanceScore: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  recommendationReason: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  actionButton: {
    width: "22%",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginVertical: 8,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#333",
  },
  trendChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    justifyContent: "space-around",
  },
  trendBar: {
    alignItems: "center",
    width: "12%",
  },
  trendBarFill: {
    width: "100%",
    backgroundColor: "#FF9800",
    borderRadius: 4,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
});

export default StudentDashboard;
