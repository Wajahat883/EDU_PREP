import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

interface StoredCredentials {
  token: string;
  refreshToken: string;
  userId: string;
  expiresAt: number;
}

export class MobileApiClient {
  private api: AxiosInstance;
  private baseURL: string;
  private credentials: StoredCredentials | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(baseURL: string = "https://api.eduprep.com") {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        "User-Agent": `EduPrepMobile/${Platform.OS}`,
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
    this.initializeCredentials();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            await this.clearCredentials();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async initializeCredentials(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem("authCredentials");
      if (stored) {
        this.credentials = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  }

  private async getValidToken(): Promise<string | null> {
    if (!this.credentials) return null;

    // Check if token is expired
    if (this.credentials.expiresAt < Date.now()) {
      try {
        return await this.refreshToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
      }
    }

    return this.credentials.token;
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      if (!this.credentials) throw new Error("No credentials stored");

      try {
        const response = await axios.post(`${this.baseURL}/api/auth/refresh`, {
          refreshToken: this.credentials.refreshToken,
        });

        const { token, expiresIn } = response.data;
        this.credentials = {
          ...this.credentials,
          token,
          expiresAt: Date.now() + expiresIn * 1000,
        };

        await AsyncStorage.setItem(
          "authCredentials",
          JSON.stringify(this.credentials),
        );
        return token;
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  async register(
    email: string,
    password: string,
    name: string,
    role: string,
  ): Promise<any> {
    const response = await this.api.post("/api/auth/register", {
      email,
      password,
      name,
      role,
    });
    await this.storeCredentials(response.data);
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.api.post("/api/auth/login", {
      email,
      password,
    });
    await this.storeCredentials(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/api/auth/logout");
    } finally {
      await this.clearCredentials();
    }
  }

  async getQuestions(
    filters?: any,
    limit: number = 10,
    skip: number = 0,
  ): Promise<any> {
    const response = await this.api.get("/api/questions", {
      params: { ...filters, limit, skip },
    });
    return response.data;
  }

  async getQuestion(id: string): Promise<any> {
    const response = await this.api.get(`/api/questions/${id}`);
    return response.data;
  }

  async submitAnswer(questionId: string, answer: any): Promise<any> {
    const response = await this.api.post(
      `/api/questions/${questionId}/answer`,
      {
        answer,
      },
    );
    return response.data;
  }

  async getTests(filters?: any): Promise<any> {
    const response = await this.api.get("/api/tests", { params: filters });
    return response.data;
  }

  async getTest(id: string): Promise<any> {
    const response = await this.api.get(`/api/tests/${id}`);
    return response.data;
  }

  async startTest(testId: string): Promise<any> {
    const response = await this.api.post(`/api/tests/${testId}/start`);
    return response.data;
  }

  async submitTestAnswer(
    testId: string,
    questionId: string,
    answer: any,
  ): Promise<any> {
    const response = await this.api.post(`/api/tests/${testId}/answer`, {
      questionId,
      answer,
    });
    return response.data;
  }

  async endTest(testId: string): Promise<any> {
    const response = await this.api.post(`/api/tests/${testId}/end`);
    return response.data;
  }

  async getTestResults(testId: string): Promise<any> {
    const response = await this.api.get(`/api/tests/${testId}/results`);
    return response.data;
  }

  async getRecommendations(): Promise<any> {
    const response = await this.api.get("/api/ai/recommendations");
    return response.data;
  }

  async getAdaptiveLearningPath(): Promise<any> {
    const response = await this.api.get("/api/ai/learning-paths");
    return response.data;
  }

  async predictTestScore(testId: string): Promise<any> {
    const response = await this.api.post("/api/ai/predictions/test-score", {
      testId,
    });
    return response.data;
  }

  async getUserStats(): Promise<any> {
    const response = await this.api.get("/api/analytics/users/me/stats");
    return response.data;
  }

  async getUserPerformance(subject?: string): Promise<any> {
    const response = await this.api.get("/api/analytics/users/me/performance", {
      params: { subject },
    });
    return response.data;
  }

  async getSubscriptionInfo(): Promise<any> {
    const response = await this.api.get("/api/payments/subscription");
    return response.data;
  }

  async getSubscriptionPlans(): Promise<any> {
    const response = await this.api.get("/api/payments/plans");
    return response.data;
  }

  async createSubscription(
    planId: string,
    paymentMethodId: string,
  ): Promise<any> {
    const response = await this.api.post("/api/payments/subscribe", {
      planId,
      paymentMethodId,
    });
    return response.data;
  }

  private async storeCredentials(authData: any): Promise<void> {
    const { token, refreshToken, user } = authData;
    this.credentials = {
      token,
      refreshToken,
      userId: user.id,
      expiresAt: Date.now() + 3600000, // 1 hour
    };
    await AsyncStorage.setItem(
      "authCredentials",
      JSON.stringify(this.credentials),
    );
  }

  private async clearCredentials(): Promise<void> {
    this.credentials = null;
    await AsyncStorage.removeItem("authCredentials");
  }

  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  getCurrentUserId(): string | null {
    return this.credentials?.userId || null;
  }
}

export const apiClient = new MobileApiClient();
