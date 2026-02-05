import { create } from "zustand";

interface AuthState {
  user: any | null;
  token: string | null;
  setUser: (user: any) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, token: null });
  },
}));

interface TestState {
  currentSession: any | null;
  currentQuestion: number;
  answers: Record<string, string>;
  setCurrentSession: (session: any) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  resetTest: () => void;
  syncToServer: (sessionId: string) => Promise<void>;
}

export const useTestStore = create<TestState>((set, get) => ({
  currentSession: null,
  currentQuestion: 0,
  answers: {},
  setCurrentSession: (session) => set({ currentSession: session }),
  setCurrentQuestion: (index) => set({ currentQuestion: index }),
  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),
  resetTest: () =>
    set({
      currentSession: null,
      currentQuestion: 0,
      answers: {},
    }),
  syncToServer: async (sessionId: string) => {
    try {
      const { answers, currentQuestion } = get();
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003"}/api/test-sessions/${sessionId}/answers`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: Object.entries(answers).map(([questionId, answer]) => ({
              questionId,
              selectedOption: answer,
            })),
            currentQuestionIndex: currentQuestion,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to sync test session");
      }
    } catch (error) {
      console.error("Error syncing test session:", error);
      throw error;
    }
  },
}));
