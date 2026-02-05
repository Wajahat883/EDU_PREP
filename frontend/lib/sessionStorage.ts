/**
 * Session Storage API Utilities
 * Handles all session data storage in MongoDB via API calls
 * Replaces localStorage usage for test sessions and subscription data
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface SessionAnswer {
  questionId: string;
  selectedOption: string;
  timeSpent?: number;
  markedForReview?: boolean;
}

export interface TestSessionData {
  sessionId: string;
  examTypeId: string;
  mode: "timed" | "tutor" | "untimed";
  answers: SessionAnswer[];
  currentQuestionIndex: number;
  timeRemaining?: number;
}

/**
 * Create a new test session in MongoDB
 */
export const createTestSession = async (
  examTypeId: string,
  mode: "timed" | "tutor" | "untimed" = "tutor",
  token: string,
): Promise<{ sessionId: string }> => {
  const response = await fetch(`${API_BASE}/api/test-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      examTypeId,
      mode,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create test session");
  }

  return response.json();
};

/**
 * Save test session progress to MongoDB
 */
export const saveTestSessionProgress = async (
  sessionId: string,
  data: Partial<TestSessionData>,
  token: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/api/test-sessions/${sessionId}/progress`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save test progress");
  }
};

/**
 * Save answers to MongoDB
 */
export const saveTestAnswers = async (
  sessionId: string,
  answers: SessionAnswer[],
  currentQuestionIndex: number,
  token: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/api/test-sessions/${sessionId}/answers`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answers,
        currentQuestionIndex,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save answers");
  }
};

/**
 * Load test session from MongoDB
 */
export const loadTestSession = async (
  sessionId: string,
  token: string,
): Promise<TestSessionData> => {
  const response = await fetch(`${API_BASE}/api/test-sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load test session");
  }

  return response.json();
};

/**
 * Get user's subscription from MongoDB
 */
export const getUserSubscription = async (token: string) => {
  const response = await fetch(`${API_BASE}/api/auth/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subscription");
  }

  return response.json();
};

/**
 * Update user's subscription in MongoDB
 */
export const updateUserSubscription = async (
  subscriptionData: {
    tierId: string;
    status: "active" | "inactive" | "cancelled";
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
  },
  token: string,
) => {
  const response = await fetch(`${API_BASE}/api/auth/subscription`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    throw new Error("Failed to update subscription");
  }

  return response.json();
};

/**
 * Complete and submit test session to MongoDB
 */
export const submitTestSession = async (
  sessionId: string,
  token: string,
): Promise<{ score: number; totalQuestions: number; result: string }> => {
  const response = await fetch(
    `${API_BASE}/api/test-sessions/${sessionId}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to submit test session");
  }

  return response.json();
};
