import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  subject: string;
  difficulty: string;
  totalPages: number;
  rating: number;
  chapters: Array<{
    chapterId: string;
    title: string;
    pageStart: number;
    pageEnd: number;
  }>;
  description: string;
  pdfUrl: string;
}

interface ReadingProgress {
  currentPage: number;
  percentageComplete: number;
  lastAccessedAt: string;
}

const BookDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isMounted, setIsMounted] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !id) return;

    const fetchBook = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/content/books/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setBook(response.data.data);
        // Fetch reading progress
        const progressRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/content/library/progress?bookId=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (progressRes.data.data) {
          setProgress(progressRes.data.data);
          setCurrentPage(progressRes.data.data.currentPage);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [isMounted, id, router]);

  const handlePageChange = async (newPage: number) => {
    if (!book || newPage < 1 || newPage > book.totalPages) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/content/library/progress`,
        {
          bookId: book._id,
          currentPage: newPage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Book not found</p>
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
              onClick={() => router.push("/books")}
              className="text-blue-500 hover:text-blue-700 font-medium mb-2"
            >
              ← Back to Books
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
            <p className="text-gray-600">by {book.author}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Reading Progress</p>
            <div className="text-2xl font-bold text-blue-600">
              {progress?.percentageComplete || 0}%
            </div>
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
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600">
                    Page {currentPage} of {book.totalPages}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF Viewer - Watermarked
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex-1 mx-4">
                    <input
                      type="range"
                      min="1"
                      max={book.totalPages}
                      value={currentPage}
                      onChange={(e) =>
                        handlePageChange(parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === book.totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    Next →
                  </button>
                </div>

                <div className="text-center text-sm text-gray-600">
                  Page {currentPage} / {book.totalPages}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">About this Book</h2>
              <p className="text-gray-600 leading-relaxed">
                {book.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Book Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-24">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">{book.category}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{book.subject}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="px-3 py-1 inline-block bg-blue-100 text-blue-800 rounded font-medium">
                  {book.difficulty}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-xl font-bold">⭐ {book.rating.toFixed(1)}</p>
              </div>

              <button
                onClick={() => setShowTest(!showTest)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                📝 Take Chapter Test
              </button>
            </div>

            {/* Chapters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Chapters</h3>
              <div className="space-y-2">
                {book.chapters.map((chapter) => (
                  <div
                    key={chapter.chapterId}
                    className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-gray-900">{chapter.title}</p>
                    <p className="text-sm text-gray-600">
                      Pages {chapter.pageStart}-{chapter.pageEnd}
                    </p>
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

export default BookDetailPage;
