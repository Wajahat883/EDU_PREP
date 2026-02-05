import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { AppLayout } from "@/components/layouts";

interface Question {
  id: number;
  subject: string;
  topic: string;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  options: string[];
  correct: string;
  explanation: string;
  attempts: number;
  correct_percentage: number;
}

export default function QuestionBankPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const subjects = [
    { value: "all", label: "All Subjects" },
    { value: "anatomy", label: "Anatomy" },
    { value: "biochemistry", label: "Biochemistry" },
    { value: "pharmacology", label: "Pharmacology" },
    { value: "pathology", label: "Pathology" },
    { value: "physiology", label: "Physiology" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const questions: Question[] = [
    {
      id: 1,
      subject: "Anatomy",
      topic: "Upper Limb",
      text: "Which nerve is responsible for innervation of the deltoid muscle?",
      difficulty: "easy",
      options: [
        "Radial nerve",
        "Axillary nerve",
        "Musculocutaneous nerve",
        "Ulnar nerve",
      ],
      correct: "Axillary nerve",
      explanation:
        "The axillary nerve (C5-C6) innervates the deltoid and teres minor muscles. It arises from the posterior cord of the brachial plexus.",
      attempts: 1245,
      correct_percentage: 82,
    },
    {
      id: 2,
      subject: "Biochemistry",
      topic: "Enzymes",
      text: "What is the Km value indicative of in enzyme kinetics?",
      difficulty: "medium",
      options: [
        "Enzyme concentration",
        "Substrate affinity",
        "Reaction rate",
        "pH optimum",
      ],
      correct: "Substrate affinity",
      explanation:
        "Km represents the substrate concentration at which the reaction rate is half of Vmax. A lower Km indicates higher substrate affinity.",
      attempts: 892,
      correct_percentage: 68,
    },
    {
      id: 3,
      subject: "Pharmacology",
      topic: "NSAIDs",
      text: "Which NSAID is selective for COX-2?",
      difficulty: "medium",
      options: ["Aspirin", "Ibuprofen", "Celecoxib", "Naproxen"],
      correct: "Celecoxib",
      explanation:
        "Celecoxib is a selective COX-2 inhibitor, which reduces GI side effects compared to non-selective NSAIDs.",
      attempts: 1567,
      correct_percentage: 75,
    },
    {
      id: 4,
      subject: "Pathology",
      topic: "Cell Injury",
      text: "Which of the following is reversible cell injury?",
      difficulty: "hard",
      options: [
        "Apoptosis",
        "Cellular swelling",
        "Karyolysis",
        "Coagulative necrosis",
      ],
      correct: "Cellular swelling",
      explanation:
        "Cellular swelling (hydropic change) is the earliest manifestation of reversible cell injury due to failure of Na-K pumps.",
      attempts: 654,
      correct_percentage: 54,
    },
    {
      id: 5,
      subject: "Physiology",
      topic: "Cardiovascular",
      text: "What is the normal cardiac output at rest?",
      difficulty: "easy",
      options: ["2-3 L/min", "5-6 L/min", "8-10 L/min", "12-15 L/min"],
      correct: "5-6 L/min",
      explanation:
        "Normal cardiac output at rest is approximately 5-6 L/min (70ml stroke volume × 70-80 beats/min).",
      attempts: 2134,
      correct_percentage: 89,
    },
  ];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || q.subject.toLowerCase() === selectedSubject;
    const matchesDifficulty =
      difficulty === "all" || q.difficulty === difficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const handleAnswer = (option: string) => {
    setUserAnswer(option);
    setShowAnswer(true);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Head>
        <title>Question Bank - EduPrep</title>
      </Head>

      <AppLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Question Bank", href: "/qbank" },
        ]}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Question Bank
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Practice with 10,000+ curated questions across all subjects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/test"
                className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg transition-colors"
              >
                Start Quiz Mode
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-2xl font-bold text-[#1E3A8A] dark:text-[#3B82F6]">
                10,245
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Questions
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                1,245
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Attempted
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                78%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Accuracy Rate
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                156
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bookmarked
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3B82F6]"
              >
                {subjects.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3B82F6]"
              >
                {difficulties.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
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
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="grid gap-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedQuestion(question);
                  setUserAnswer("");
                  setShowAnswer(false);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {question.subject}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {question.topic}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-3">
                      {question.text}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        {question.attempts.toLocaleString()} attempts
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        {question.correct_percentage}% correct
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-[#F59E0B] transition-colors">
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
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Modal */}
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {selectedQuestion.subject}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(selectedQuestion.difficulty)}`}
                  >
                    {selectedQuestion.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {selectedQuestion.text}
                </h3>

                <div className="space-y-3 mb-6">
                  {selectedQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={showAnswer}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        showAnswer
                          ? option === selectedQuestion.correct
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : option === userAnswer &&
                                option !== selectedQuestion.correct
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          : userAnswer === option
                            ? "border-[#3B82F6] bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-[#3B82F6]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            showAnswer
                              ? option === selectedQuestion.correct
                                ? "bg-green-500 text-white"
                                : option === userAnswer &&
                                    option !== selectedQuestion.correct
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {showAnswer && (
                  <div
                    className={`p-4 rounded-xl ${
                      userAnswer === selectedQuestion.correct
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {userAnswer === selectedQuestion.correct ? (
                        <>
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            Correct!
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            Incorrect
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#F59E0B] transition-colors">
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
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  Bookmark
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  {showAnswer && (
                    <button
                      onClick={() => {
                        setUserAnswer("");
                        setShowAnswer(false);
                      }}
                      className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-medium rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </>
  );
}
