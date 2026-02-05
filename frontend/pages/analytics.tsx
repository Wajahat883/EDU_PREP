import React from "react";
import { MainLayout } from "@/components/layouts";
import { Card, CardContent, CardHeader, Tabs, Badge } from "@/components/ui";

export default function AnalyticsPage() {
  const performanceData = [
    { subject: "Anatomy", score: 82, questions: 250, time: "12.5h" },
    { subject: "Biochemistry", score: 76, questions: 180, time: "9.5h" },
    { subject: "Pharmacology", score: 91, questions: 320, time: "16h" },
    { subject: "Pathology", score: 68, questions: 145, time: "7.5h" },
  ];

  const weeklyStats = [
    { day: "Mon", questions: 45, time: 2.5 },
    { day: "Tue", questions: 52, time: 3 },
    { day: "Wed", questions: 38, time: 2.2 },
    { day: "Thu", questions: 61, time: 3.5 },
    { day: "Fri", questions: 48, time: 2.8 },
    { day: "Sat", questions: 55, time: 3.2 },
    { day: "Sun", questions: 42, time: 2.4 },
  ];

  const tabs = [
    {
      id: "performance",
      label: "Performance",
      content: (
        <div className="space-y-4">
          {performanceData.map((subject, idx) => (
            <div
              key={idx}
              className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{subject.subject}</h3>
                <Badge
                  variant={
                    subject.score >= 80
                      ? "success"
                      : subject.score >= 70
                        ? "warning"
                        : "error"
                  }
                >
                  {subject.score}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Questions
                  </p>
                  <p className="font-semibold">{subject.questions}</p>
                </div>
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Time Spent
                  </p>
                  <p className="font-semibold">{subject.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "activity",
      label: "Weekly Activity",
      content: (
        <div className="space-y-4">
          {weeklyStats.map((stat, idx) => (
            <div key={idx} className="flex items-end gap-4">
              <div className="w-12 text-center">
                <p className="text-sm font-semibold mb-2">{stat.day}</p>
                <div className="h-32 bg-gradient-to-t from-primary-400 to-primary-600 rounded-t-lg relative group">
                  <div className="absolute -top-8 left-0 right-0 text-center text-xs font-semibold text-neutral-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.questions}
                  </div>
                </div>
              </div>
              <div className="flex-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p>{stat.questions} Q</p>
                <p>{stat.time}h</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "trends",
      label: "Trends",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-success-50 dark:bg-success-950 rounded-lg">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              📈 Trending Up
            </p>
            <p className="font-semibold text-success-900 dark:text-success-200">
              Pharmacology: +8% improvement
            </p>
          </div>

          <div className="p-4 bg-warning-50 dark:bg-warning-950 rounded-lg">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              ⚠️ Needs Attention
            </p>
            <p className="font-semibold text-warning-900 dark:text-warning-200">
              Pathology: Declining by 3%
            </p>
          </div>

          <div className="p-4 bg-primary-50 dark:bg-primary-950 rounded-lg">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              🎯 Best Performance
            </p>
            <p className="font-semibold text-primary-900 dark:text-primary-200">
              Pharmacology: 91% accuracy
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MainLayout
      navLinks={[
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/qbank", label: "Question Bank", icon: "📚" },
        { href: "/flashcards", label: "Flashcards", icon: "🧠" },
        { href: "/analytics", label: "Analytics", icon: "📈" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Your Analytics
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Track your progress and identify areas to improve
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              label: "Average Score",
              value: "79%",
              icon: "📊",
              color: "primary",
            },
            {
              label: "Total Questions",
              value: "895",
              icon: "📚",
              color: "secondary",
            },
            {
              label: "Study Hours",
              value: "45.5h",
              icon: "⏱️",
              color: "success",
            },
            {
              label: "Current Streak",
              value: "15 days",
              icon: "🔥",
              color: "warning",
            },
          ].map((metric, idx) => (
            <Card key={idx} elevated>
              <CardContent className="p-4">
                <p className="text-2xl mb-1">{metric.icon}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Analytics */}
        <Card elevated>
          <CardHeader>
            <h2 className="text-lg font-semibold">Detailed Analytics</h2>
          </CardHeader>
          <CardContent>
            <Tabs tabs={tabs} />
          </CardContent>
        </Card>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card elevated>
            <CardHeader>
              <h3 className="text-lg font-semibold">Strengths 💪</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-success-50 dark:bg-success-950 rounded-lg">
                <p className="font-medium">Pharmacology</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  91% accuracy - Keep it up!
                </p>
              </div>

              <div className="p-3 bg-success-50 dark:bg-success-950 rounded-lg">
                <p className="font-medium">Anatomy</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  82% accuracy - Strong performance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <h3 className="text-lg font-semibold">Areas to Improve 🎯</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-warning-50 dark:bg-warning-950 rounded-lg">
                <p className="font-medium">Pathology</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  68% accuracy - Focus on inflammatory responses
                </p>
              </div>

              <div className="p-3 bg-warning-50 dark:bg-warning-950 rounded-lg">
                <p className="font-medium">Biochemistry</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  76% accuracy - Review enzyme kinetics
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
