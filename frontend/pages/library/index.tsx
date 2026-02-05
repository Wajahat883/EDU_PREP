import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

interface LibraryItem {
  _id: string;
  bookId: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  percentageComplete: number;
  lastAccessedAt: string;
  addedAt: string;
}

const LibraryPage: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "reading" | "completed" | "wishlist"
  >("reading");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchLibrary = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/content/library`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setLibraryItems(response.data.data);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [isMounted, router]);

  const handleContinueReading = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 33) return "bg-red-500";
    if (percentage < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
          <p className="text-gray-600 mt-2">
            Track your reading progress and continue from where you left off
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("reading")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "reading"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Currently Reading
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "completed"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "wishlist"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Wishlist
          </button>
        </div>

        {/* Library Items */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading library...</p>
          </div>
        ) : libraryItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">
              No items in your {activeTab} list yet
            </p>
            <button
              onClick={() => router.push("/books")}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Browse Books →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {libraryItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  {/* Book Info */}
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      by {item.author}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">
                          {item.currentPage} / {item.totalPages} pages
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(item.percentageComplete)} transition-all`}
                          style={{ width: `${item.percentageComplete}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      {item.percentageComplete}% Complete
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="md:col-span-1">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">Last Accessed</p>
                      <p className="font-medium text-gray-900">
                        {new Date(item.lastAccessedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="md:col-span-1">
                    <button
                      onClick={() => handleContinueReading(item.bookId)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      Continue Reading
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
