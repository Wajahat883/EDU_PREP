/**
 * Admin Dashboard Page
 *
 * Modern admin interface with:
 * - Overview metrics and stats
 * - Quick navigation to management modules
 * - Recent activity feed
 * - System health status
 * - Key performance indicators
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

interface AdminStats {
  totalQuestions: number;
  questionsInReview: number;
  totalTests: number;
  publishedTests: number;
  activeUsers: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: "question" | "test" | "user" | "payment";
  action: string;
  user: string;
  timestamp: string;
  status: "pending" | "success" | "error";
}

export default function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalQuestions: 10245,
    questionsInReview: 156,
    totalTests: 324,
    publishedTests: 287,
    activeUsers: 15432,
    totalRevenue: 125000,
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "user",
      action: "New user registered",
      user: "john@example.com",
      timestamp: "5 min ago",
      status: "success",
    },
    {
      id: "2",
      type: "payment",
      action: "Subscription upgraded",
      user: "sarah@example.com",
      timestamp: "15 min ago",
      status: "success",
    },
    {
      id: "3",
      type: "question",
      action: "Question submitted for review",
      user: "admin@eduprep.com",
      timestamp: "30 min ago",
      status: "pending",
    },
    {
      id: "4",
      type: "test",
      action: "New test published",
      user: "admin@eduprep.com",
      timestamp: "1 hour ago",
      status: "success",
    },
    {
      id: "5",
      type: "user",
      action: "Password reset requested",
      user: "mike@example.com",
      timestamp: "2 hours ago",
      status: "pending",
    },
  ]);

  const systemHealth = {
    uptime: 99.9,
    responseTime: 145,
    errorRate: 0.02,
    databaseSize: 85,
  };

  const adminNavItems = [
    { icon: "📊", label: "Dashboard", href: "/admin/dashboard", active: true },
    { icon: "👥", label: "Users", href: "/admin/users" },
    { icon: "📚", label: "Questions", href: "/admin/questions" },
    { icon: "📝", label: "Tests", href: "/admin/tests" },
    { icon: "💳", label: "Payments", href: "/admin/payments" },
    { icon: "📈", label: "Analytics", href: "/admin/analytics" },
    { icon: "⚙️", label: "Settings", href: "/admin/settings" },
  ];

  const statCards = [
    {
      label: "Total Questions",
      value: stats.totalQuestions.toLocaleString(),
      change: "+12%",
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-blue-500",
      bgLight: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      change: "+8%",
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      color: "bg-green-500",
      bgLight: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Published Tests",
      value: stats.publishedTests.toString(),
      change: "+5%",
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
      color: "bg-purple-500",
      bgLight: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Total Revenue",
      value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`,
      change: "+24%",
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-amber-500",
      bgLight: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <>
      <Head>
        <title>Admin Dashboard - EduPrep</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Admin Sidebar */}
        <aside
          className={`${sidebarCollapsed ? "w-20" : "w-64"} bg-[#1E3A8A] text-white flex-shrink-0 transition-all duration-300 hidden lg:block`}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <p className="font-bold text-lg">EduPrep</p>
                  <p className="text-xs text-blue-200">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          <nav className="p-4">
            <ul className="space-y-1">
              {adminNavItems.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      item.active
                        ? "bg-white/20 text-white"
                        : "text-blue-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-gray-600 dark:text-gray-300">
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 w-48"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Admin User
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Super Admin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}
                      >
                        {stat.icon}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <button className="text-sm text-[#3B82F6] hover:text-[#1E3A8A] font-medium">
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === "user"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                : activity.type === "payment"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                  : activity.type === "question"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                            }`}
                          >
                            {activity.type === "user" && "👤"}
                            {activity.type === "payment" && "💳"}
                            {activity.type === "question" && "❓"}
                            {activity.type === "test" && "📝"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.action}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.user}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              activity.status === "success"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : activity.status === "pending"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {activity.status}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      System Health
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Uptime
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {systemHealth.uptime}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${systemHealth.uptime}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Response Time
                        </span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {systemHealth.responseTime}ms
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: "30%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Error Rate
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {systemHealth.errorRate}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: "2%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Database Usage
                        </span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {systemHealth.databaseSize}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${systemHealth.databaseSize}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/admin/questions/create"
                    className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Add Question
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Create new question
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/admin/tests/create"
                    className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Create Test
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Design a new test
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Manage Users
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        View all users
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        View Analytics
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        See insights
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pending Reviews
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {stats.questionsInReview} items
                  </span>
                </div>
                <div className="p-5">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white text-lg">
                          ❓
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                            {stats.questionsInReview}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Questions to review
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg">
                          👤
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                            23
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            User verifications
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white text-lg">
                          💬
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                            8
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            Support tickets
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
