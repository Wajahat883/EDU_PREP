import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  HeatMap,
  ScatterChart,
  Scatter,
} from "recharts";
import { AlertCircle, TrendingUp, Users, BookOpen } from "lucide-react";

interface TeacherDashboardProps {
  courseId: string;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

const TeacherAnalyticsDashboard: React.FC<TeacherDashboardProps> = ({
  courseId,
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [courseId]);

  const loadAnalytics = async () => {
    try {
      // Would fetch from API
      const mockData = {
        courseId,
        courseName: "Advanced Mathematics",
        totalStudents: 45,
        averageScore: 78.5,
        classScoreDistribution: [
          { grade: "A (90-100)", count: 12 },
          { grade: "B (80-89)", count: 18 },
          { grade: "C (70-79)", count: 10 },
          { grade: "D (60-69)", count: 5 },
          { grade: "F (<60)", count: 0 },
        ],
        subjectMastery: [
          { subject: "Algebra", score: 82 },
          { subject: "Geometry", score: 75 },
          { subject: "Calculus", score: 68 },
          { subject: "Trigonometry", score: 79 },
          { subject: "Statistics", score: 71 },
        ],
        weeklyProgress: [
          { week: "Week 1", average: 65, target: 75 },
          { week: "Week 2", average: 68, target: 75 },
          { week: "Week 3", average: 72, target: 75 },
          { week: "Week 4", average: 76, target: 75 },
          { week: "Week 5", average: 78, target: 75 },
        ],
        weakStudents: [
          { name: "John Doe", score: 45, improvement: -5 },
          { name: "Jane Smith", score: 52, improvement: 3 },
          { name: "Mike Johnson", score: 58, improvement: 8 },
        ],
        strongStudents: [
          { name: "Alice Wang", score: 98, improvement: 2 },
          { name: "Bob Chen", score: 95, improvement: 5 },
          { name: "Carol Davis", score: 93, improvement: -1 },
        ],
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {analytics.courseName}
        </h1>
        <p className="text-gray-600">Course Analytics & Student Performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<Users className="w-8 h-8" />}
          label="Total Students"
          value={analytics.totalStudents}
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Class Average"
          value={`${analytics.averageScore}%`}
          color="green"
        />
        <MetricCard
          icon={<BookOpen className="w-8 h-8" />}
          label="Avg Topics Mastered"
          value="3.8/5"
          color="purple"
        />
        <MetricCard
          icon={<AlertCircle className="w-8 h-8" />}
          label="At Risk Students"
          value={analytics.weakStudents.length}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Class Score Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Class Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.classScoreDistribution}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Mastery */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Subject Mastery Levels
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.subjectMastery}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="subject"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Weekly Class Progress
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.weeklyProgress}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#45B7D1"
              strokeWidth={2}
              name="Class Average"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#FF6B6B"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Students at Risk & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students Needing Attention */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Students Needing Attention
            </h2>
          </div>
          <div className="space-y-3">
            {analytics.weakStudents.map((student: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded"
              >
                <div>
                  <p className="font-semibold text-gray-800">{student.name}</p>
                  <p className="text-sm text-gray-600">
                    Score: {student.score}%
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    student.improvement >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {student.improvement >= 0 ? "+" : ""}
                  {student.improvement}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Top Performers
            </h2>
          </div>
          <div className="space-y-3">
            {analytics.strongStudents.map((student: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded"
              >
                <div>
                  <p className="font-semibold text-gray-800">{student.name}</p>
                  <p className="text-sm text-gray-600">
                    Score: {student.score}%
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    student.improvement >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {student.improvement >= 0 ? "+" : ""}
                  {student.improvement}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-8 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Export as PDF
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Export as CSV
        </button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Generate Report
        </button>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  color,
}) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    red: "bg-red-50 border-red-200",
  };

  const iconColorClasses: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    red: "text-red-600",
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className={`${iconColorClasses[color]} mb-2`}>{icon}</div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default TeacherAnalyticsDashboard;
