/**
 * Test Taking Page
 * Main interface for taking practice tests and exams
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Header } from "../components/Header";

interface TestSession {
  id: string;
  name: string;
  totalQuestions: number;
  timeLimit: number;
  status: "pending" | "in-progress" | "completed";
}

export default function TestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [availableTests, setAvailableTests] = useState<TestSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check if user is logged in
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // Load available tests
    fetchAvailableTests();
  }, [isMounted, router]);

  const fetchAvailableTests = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockTests: TestSession[] = [
        {
          id: "1",
          name: "Practice Test - Biology",
          totalQuestions: 50,
          timeLimit: 60,
          status: "pending",
        },
        {
          id: "2",
          name: "Mock Exam - Chemistry",
          totalQuestions: 100,
          timeLimit: 120,
          status: "pending",
        },
        {
          id: "3",
          name: "Quick Quiz - Physics",
          totalQuestions: 20,
          timeLimit: 30,
          status: "pending",
        },
      ];
      setAvailableTests(mockTests);
    } catch (err) {
      setError("Failed to load tests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startTest = (testId: string) => {
    router.push(`/test/${testId}`);
  };

  if (!isMounted || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Practice Tests</h1>
            <p className="mt-2 text-gray-600">
              Select a test to begin your practice session
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableTests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {test.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-400"
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
                      {test.totalQuestions} Questions
                    </p>
                    <p className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-400"
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
                      {test.timeLimit} Minutes
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => startTest(test.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start Test
                  </button>
                </div>
              </div>
            ))}
          </div>

          {availableTests.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tests available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back later for new practice tests.
              </p>
              <div className="mt-6">
                <Link
                  href="/qbank"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Question Bank
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
