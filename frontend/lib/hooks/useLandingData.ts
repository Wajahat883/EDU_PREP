/**
 * Custom hook for fetching landing page data
 * Handles loading states, caching, and error handling
 */

import { useState, useEffect } from "react";
import {
  LandingPageConfig,
  defaultLandingConfig,
} from "../config/landingConfig";

interface UseLandingDataReturn {
  data: LandingPageConfig;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Cache the data to avoid refetching on navigation
let cachedData: LandingPageConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useLandingData(): UseLandingDataReturn {
  const [data, setData] = useState<LandingPageConfig>(
    cachedData || defaultLandingConfig,
  );
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    // Check if cache is still valid
    const now = Date.now();
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/landing");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        cachedData = result.data;
        cacheTimestamp = now;
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch landing data");
      }
    } catch (err) {
      console.error("Error fetching landing data:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Fall back to default config
      setData(defaultLandingConfig);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Export for server-side usage
export async function getServerSideLandingData(): Promise<LandingPageConfig> {
  // In server context, we can't use fetch to our own API
  // So we return the default config or fetch from a CMS/database directly
  return defaultLandingConfig;
}

export default useLandingData;
