import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

interface PastPaper {
  _id: string;
  title: string;
  examType: string;
  year: number;
  month?: string;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  subjects: string[];
  description: string;
  rating: number;
  pdfUrl: string;
  solutionUrl?: string;
}

const PastPaperDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isMounted, setIsMounted] = useState(false);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !id) return;

    const fetchPaper = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/content/pastpapers/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setPaper(response.data.data);
        // Estimate pages based on questions
        setTotalPages(Math.ceil(response.data.data.totalQuestions / 4));
      } catch (error) {
        console.error("Error fetching past paper:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [isMounted, id, router]);

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading past paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Past paper not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/pastpapers")}
              className="text-blue-500 hover:text-blue-700 font-medium mb-2"
            >
              ← Back to Papers
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{paper.title}</h1>
            <p className="text-gray-600">
              {paper.examType} • {paper.year}
              {paper.month && ` • ${paper.month}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* PDF Viewer */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-gray-200 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-600">
                    Page {currentPage} of {totalPages || 1}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {showSolution ? "Solutions" : "Questions"} - Watermarked
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex-1 mx-4">
                    <input
                      type="range"
                      min="1"
                      max={totalPages || 1}
                      value={currentPage}
                      onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages || 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    Next →
                  </button>
                </div>

                <div className="text-center text-sm text-gray-600">
                  Page {currentPage} / {totalPages || 1}
                </div>
              </div>
            </div>

            {/* Solution Toggle */}
            {paper.solutionUrl && (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`w-full mb-8 py-3 rounded-lg font-medium transition-colors ${
                  showSolution
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {showSolution ? "✓ Viewing Solutions" : "View Solutions"}
              </button>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">About this Paper</h2>
              <p className="text-gray-600 leading-relaxed">
                {paper.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Paper Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-24">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Exam Type</p>
                <p className="font-medium text-gray-900">{paper.examType}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Year</p>
                <p className="text-2xl font-bold text-blue-600">{paper.year}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-medium text-gray-900">
                  {paper.totalQuestions}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">
                  {paper.duration} minutes
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="px-3 py-1 inline-block bg-blue-100 text-blue-800 rounded font-medium">
                  {paper.difficulty}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-xl font-bold">
                  ⭐ {paper.rating.toFixed(1)}
                </p>
              </div>

              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors">
                📝 Take Test
              </button>
            </div>

            {/* Subjects */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Subjects Covered</h3>
              <div className="space-y-2">
                {paper.subjects.map((subject) => (
                  <div
                    key={subject}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded font-medium"
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastPaperDetailPage;
