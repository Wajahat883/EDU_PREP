/**
 * Landing Page API Endpoint
 * Returns dynamic landing page configuration with real-time stats
 */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  defaultLandingConfig,
  LandingPageConfig,
} from "../../lib/config/landingConfig";

interface DynamicStats {
  totalUsers: string;
  totalQuestions: string;
  passRate: string;
  avgRating: string;
}

interface LandingResponse {
  success: boolean;
  data?: LandingPageConfig;
  stats?: DynamicStats;
  error?: string;
}

// Simulated function to fetch real stats from database
async function fetchDynamicStats(): Promise<DynamicStats> {
  // In production, this would fetch from your database
  // Example: const stats = await db.analytics.getGlobalStats();

  try {
    // TODO: Replace with actual database calls
    // const userCount = await prisma.user.count();
    // const questionCount = await prisma.question.count();
    // const passRateData = await prisma.examResult.aggregate({...});

    return {
      totalUsers: "500,000+",
      totalQuestions: "50,000+",
      passRate: "98%",
      avgRating: "4.9",
    };
  } catch (error) {
    console.error("Error fetching dynamic stats:", error);
    // Return defaults if database fails
    return {
      totalUsers: "500,000+",
      totalQuestions: "50,000+",
      passRate: "98%",
      avgRating: "4.9",
    };
  }
}

// Merge dynamic stats into config
function mergeStatsIntoConfig(
  config: LandingPageConfig,
  stats: DynamicStats,
): LandingPageConfig {
  return {
    ...config,
    hero: {
      ...config.hero,
      stats: [
        { value: stats.totalUsers, label: "Active Students" },
        { value: stats.totalQuestions, label: "Questions" },
        { value: stats.passRate, label: "Pass Rate" },
        { value: stats.avgRating, label: "App Rating" },
      ],
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LandingResponse>,
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Fetch dynamic stats
    const stats = await fetchDynamicStats();

    // Merge stats into config
    const configWithStats = mergeStatsIntoConfig(defaultLandingConfig, stats);

    // Set caching headers (cache for 5 minutes, stale-while-revalidate for 1 hour)
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );

    return res.status(200).json({
      success: true,
      data: configWithStats,
      stats,
    });
  } catch (error) {
    console.error("Landing API error:", error);

    // Return default config on error
    return res.status(200).json({
      success: true,
      data: defaultLandingConfig,
    });
  }
}
