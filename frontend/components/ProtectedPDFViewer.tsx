import React, { useState, useEffect } from "react";
import axios from "axios";

interface ProtectedPDFViewerProps {
  bookId: string;
  userId: string;
  totalPages: number;
}

interface ScreenshotAttemptLog {
  userId: string;
  bookId: string;
  attemptedAt: Date;
  action: string;
}

const ProtectedPDFViewer: React.FC<ProtectedPDFViewerProps> = ({
  bookId,
  userId,
  totalPages,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const [contentBlurred, setContentBlurred] = useState(false);

  // Detect screenshot attempts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        logScreenshotAttempt("print_screen");
        blurContentTemporarily();
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 3000);
      }

      // Detect Shift+PrintScreen (alternative)
      if (e.shiftKey && e.key === "PrintScreen") {
        e.preventDefault();
        logScreenshotAttempt("shift_print_screen");
        blurContentTemporarily();
      }
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logScreenshotAttempt("right_click");
      return false;
    };

    // Monitor copy attempts
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logScreenshotAttempt("copy_attempt");
      return false;
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
    };
  }, [bookId, userId]);

  const logScreenshotAttempt = async (action: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/content/security/log-attempt`,
        {
          userId,
          bookId,
          action,
          timestamp: new Date(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error("Error logging screenshot attempt:", error);
    }
  };

  const blurContentTemporarily = () => {
    setContentBlurred(true);
    setTimeout(() => setContentBlurred(false), 3000);
  };

  const saveReadingProgress = async (page: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/content/library/progress`,
        {
          bookId,
          currentPage: page,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await saveReadingProgress(nextPage);
    }
  };

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      await saveReadingProgress(prevPage);
    }
  };

  const handleGoToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      await saveReadingProgress(page);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Screenshot Warning Banner */}
      {screenshotDetected && (
        <div className="bg-red-600 text-white p-4 text-center font-medium animate-pulse">
          ⚠️ Screenshots are not permitted. All attempts are logged.
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between border-b border-gray-700">
        <h2 className="text-lg font-semibold">Protected Content Viewer</h2>

        <div className="flex items-center gap-4">
          {/* Page Navigation Input */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => handleGoToPage(Number(e.target.value))}
                className="w-12 px-2 py-2 bg-gray-700 text-white rounded text-center"
              />
              <span className="text-sm">/</span>
              <span className="text-sm">{totalPages}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Next →
            </button>
          </div>

          {/* User Session Info */}
          <div className="text-xs text-gray-400 ml-4">
            Session: {userId.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className={`flex-1 overflow-auto flex items-center justify-center bg-gray-900 transition-all ${
          contentBlurred ? "blur-md" : ""
        }`}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          msUserSelect: "none",
          MozUserSelect: "none",
        }}
      >
        {isLoading ? (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p>Loading page {currentPage}...</p>
          </div>
        ) : (
          <div className="bg-white p-8 shadow-2xl max-w-4xl w-full mx-4">
            {/* Page Container */}
            <div className="relative bg-gray-100 rounded overflow-hidden aspect-[8.5/11]">
              {/* Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-gray-500 text-center rotate-45 z-0"
                style={{
                  fontSize: "4rem",
                  fontWeight: "bold",
                  wordWrap: "break-word",
                }}
              >
                {userId}
              </div>

              {/* Page Content */}
              <div className="relative z-10 w-full h-full bg-white p-8 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <p className="text-gray-600 text-sm mb-2">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>

                {/* Placeholder for PDF page image */}
                <div className="flex-1 bg-gray-50 rounded flex items-center justify-center mb-8">
                  <div className="text-center text-gray-400">
                    <div className="text-5xl mb-2">📄</div>
                    <p>Page {currentPage} content would render here</p>
                    <p className="text-sm mt-2">
                      In production, actual PDF page images would be streamed
                      from server
                    </p>
                  </div>
                </div>

                {/* Watermark Bottom */}
                <div className="text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
                  <p>Generated for: {userId}</p>
                  <p>Time: {new Date().toLocaleString()}</p>
                  <p className="mt-2 font-semibold">
                    CONFIDENTIAL - PERSONAL USE ONLY
                  </p>
                </div>
              </div>
            </div>

            {/* Page Info */}
            <div className="mt-6 text-center text-gray-600 text-sm">
              <p>
                Progress: {Math.round((currentPage / totalPages) * 100)}%
                complete
              </p>
              <p className="text-xs mt-2 text-gray-500">
                ⚠️ Screenshotting and copying are disabled. All access is
                logged.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gray-800 text-gray-400 text-xs p-3 border-t border-gray-700 text-center">
        Protected Content • Screenshots Logged • Session Active
      </div>
    </div>
  );
};

export default ProtectedPDFViewer;
