import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Type definitions
interface LoginResponse {
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

// Create axios instance with auth header
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API hooks for Authentication
export const useAuth = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post<LoginResponse>("/api/auth/login", credentials),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: any) => apiClient.post("/api/auth/register", data),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiClient.get("/api/auth/me"),
    enabled: !!localStorage.getItem("accessToken"),
  });
};

// API hooks for Questions
export const useQuestions = (filters?: any) => {
  return useQuery({
    queryKey: ["questions", filters],
    queryFn: () =>
      apiClient.get("/api/questions", { params: filters }),
  });
};

export const useQuestion = (questionId: string) => {
  return useQuery({
    queryKey: ["question", questionId],
    queryFn: () =>
      apiClient.get(`/api/questions/${questionId}`),
  });
};

// API hooks for Tests
export const useCreateSession = () => {
  return useMutation({
    mutationFn: (config: any) => apiClient.post("/api/sessions", config),
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: ({ sessionId, ...answer }: any) =>
      apiClient.post(`/api/sessions/${sessionId}/answer`, answer),
  });
};

export const useCompleteSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post(`/api/sessions/${sessionId}/complete`),
  });
};

// API hooks for Analytics
export const useProgressSummary = () => {
  return useQuery({
    queryKey: ["progressSummary"],
    queryFn: () =>
      apiClient.get("/api/progress/summary"),
  });
};

export const useProgressTrends = () => {
  return useQuery({
    queryKey: ["progressTrends"],
    queryFn: () =>
      apiClient.get("/api/progress/trends"),
  });
};

// API hooks for Payments
export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => apiClient.get("/api/plans"),
  });
};

export const useCheckout = () => {
  return useMutation({
    mutationFn: (data: any) => apiClient.post("/api/checkout", data),
  });
};
};
