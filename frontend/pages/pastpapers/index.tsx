import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

interface PastPaper {
  _id: string;
  title: string;
  examType: string;
  year: number;
  difficulty: string;
  totalQuestions: number;
  rating: number;
  subjects: string[];
  description: string;
}

const PastPapersPage: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    difficulty: "",
    examType: "",
    year: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchPastPapers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.difficulty) params.append("difficulty", filters.difficulty);
        if (filters.examType) params.append("examType", filters.examType);
        if (filters.year) params.append("year", filters.year);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/content/pastpapers?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setPapers(response.data.data);
      } catch (error) {
        console.error("Error fetching past papers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPastPapers();
  }, [isMounted, filters, router]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleViewPaper = (paperId: string) => {
    router.push(`/pastpapers/${paperId}`);
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Past Papers</h1>
          <p className="text-gray-600 mt-2">
            Practice with real exam questions from previous years
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search papers..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                value={filters.examType}
                onChange={(e) => handleFilterChange("examType", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Exams</option>
                <option value="MCAT">MCAT</option>
                <option value="BOARD_EXAM">Board Exam</option>
                <option value="ENTRANCE_TEST">Entrance Test</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  handleFilterChange("difficulty", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                placeholder="e.g., 2024"
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Past Papers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading past papers...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">
              No past papers found matching your criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <div
                key={paper._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <h3 className="font-bold text-lg">{paper.examType}</h3>
                  <p className="text-blue-100">{paper.year}</p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {paper.title}
                  </h4>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {paper.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium text-gray-900">
                        {paper.totalQuestions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {paper.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium text-gray-900">
                        ⭐ {paper.rating}
                      </span>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {paper.subjects?.slice(0, 2).map((subject) => (
                      <span
                        key={subject}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleViewPaper(paper._id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    View & Practice →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastPapersPage;
