import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { AppLayout } from "@/components/layouts";

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("week");

  const stats = [
    {
      label: "Questions Attempted",
      value: "1,245",
      change: "+12%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      label: "Accuracy Rate",
      value: "78%",
      change: "+5%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      label: "Study Streak",
      value: "15 days",
      change: "+2 days",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
        </svg>
      ),
      color: "bg-orange-500",
    },
    {
      label: "Time Spent",
      value: "42 hrs",
      change: "+8 hrs",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-purple-500",
    },
  ];

  const recentActivity = [
    {
      type: "Completed",
      subject: "Anatomy - Upper Limb",
      score: 82,
      time: "2 hours ago",
      icon: "✅",
    },
    {
      type: "Started",
      subject: "Biochemistry - Enzymes",
      score: null,
      time: "1 day ago",
      icon: "📖",
    },
    {
      type: "Completed",
      subject: "Pharmacology - NSAIDs",
      score: 91,
      time: "2 days ago",
      icon: "✅",
    },
    {
      type: "Reviewed",
      subject: "Pathology - Cell Injury",
      score: 78,
      time: "3 days ago",
      icon: "🔄",
    },
  ];

  const topics = [
    { name: "Anatomy", completed: 75, total: 100, color: "bg-blue-500" },
    { name: "Biochemistry", completed: 45, total: 100, color: "bg-amber-500" },
    { name: "Pharmacology", completed: 88, total: 100, color: "bg-green-500" },
    { name: "Pathology", completed: 62, total: 100, color: "bg-purple-500" },
    { name: "Physiology", completed: 55, total: 100, color: "bg-cyan-500" },
  ];

  const upcomingTests = [
    {
      name: "Anatomy Mock Test",
      date: "Tomorrow",
      questions: 50,
      duration: "60 min",
    },
    {
      name: "Biochemistry Review",
      date: "In 3 days",
      questions: 30,
      duration: "45 min",
    },
    {
      name: "Full Length Practice",
      date: "Next Week",
      questions: 200,
      duration: "3 hrs",
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard - EduPrep</title>
      </Head>

      <AppLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-2xl p-6 lg:p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Welcome back, John! 👋
                </h1>
                <p className="text-blue-100">
                  You're on a{" "}
                  <span className="font-semibold text-[#F59E0B]">
                    15-day study streak
                  </span>
                  . Keep up the great work!
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/qbank"
                  className="px-5 py-2.5 bg-white text-[#1E3A8A] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Continue Studying
                </Link>
                <Link
                  href="/test"
                  className="px-5 py-2.5 bg-[#F59E0B] text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Take Mock Exam
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}
                  >
                    {stat.icon}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.changeType === "positive"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress by Subject */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Progress by Subject
                    </h2>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      {(["day", "week", "month"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setSelectedPeriod(period)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            selectedPeriod === period
                              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {topics.map((topic, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {topic.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {topic.completed}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${topic.color} rounded-full transition-all duration-500`}
                          style={{ width: `${topic.completed}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Link
                  href="/qbank"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Question Bank
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      10K+ questions
                    </p>
                  </div>
                </Link>

                <Link
                  href="/flashcards"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🧠
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Flashcards
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Review cards
                    </p>
                  </div>
                </Link>

                <Link
                  href="/analytics"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📈
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Analytics
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View insights
                    </p>
                  </div>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h2>
                  <Link
                    href="/analytics"
                    className="text-sm text-[#3B82F6] hover:text-[#1E3A8A] font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                          {activity.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                activity.type === "Completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : activity.type === "Started"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {activity.type}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {activity.subject}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      {activity.score && (
                        <span
                          className={`text-lg font-bold ${
                            activity.score >= 80
                              ? "text-green-600 dark:text-green-400"
                              : activity.score >= 60
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {activity.score}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Recommendations Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Recommendations
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📉</span>
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
                          Focus Area
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Biochemistry needs attention - only 45% complete
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⭐</span>
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-200 text-sm">
                          Strong Subject
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Pharmacology - 88% mastery level
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">
                          Today's Goal
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Complete 50 questions in Biochemistry
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Tests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upcoming Tests
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {upcomingTests.map((test, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {test.name}
                        </p>
                        <span className="text-xs text-[#F59E0B] font-medium">
                          {test.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{test.questions} questions</span>
                        <span>•</span>
                        <span>{test.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 pt-0">
                  <Link
                    href="/test"
                    className="block w-full py-2.5 text-center text-sm font-medium text-[#3B82F6] hover:text-[#1E3A8A] border border-[#3B82F6] hover:border-[#1E3A8A] rounded-lg transition-colors"
                  >
                    View All Tests
                  </Link>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    This Week's Goals
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Questions
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        250/500
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-[#3B82F6] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Study Time
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        18/20 hrs
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-[90%] bg-green-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Flashcards
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        120/200
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
