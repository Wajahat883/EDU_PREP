/**
 * Gamification Routes
 * Location: services/gamification-service/src/routes/gamification.routes.ts
 *
 * API endpoints for gamification features
 */

import express, { Request, Response } from "express";
import { GamificationService } from "../services/gamification.service";
import { authMiddleware } from "../middleware/auth";
import logger from "../utils/logger";

export const gamificationRouter = express.Router();

/**
 * BADGE ENDPOINTS
 */

/**
 * GET /api/gamification/badges
 * Get all user's badges
 */
gamificationRouter.get(
  "/badges",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const badges = await GamificationService.checkAndAwardBadges(
        userId,
        "view",
      );
      res.json({ badges });
    } catch (error: any) {
      logger.error(`Error fetching badges: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/gamification/badges/:badgeId/award
 * Award badge to user (admin only)
 */
gamificationRouter.post(
  "/badges/:badgeId/award",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { badgeId } = req.params;
      const userId = req.user?.id;

      const badge = await GamificationService.awardBadge(userId, badgeId);
      res.json({ message: "Badge awarded", badge });
    } catch (error: any) {
      logger.error(`Error awarding badge: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * LEADERBOARD ENDPOINTS
 */

/**
 * GET /api/gamification/leaderboard
 * Get global leaderboard
 */
gamificationRouter.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const leaderboard = await GamificationService.getGlobalLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error: any) {
    logger.error(`Error fetching leaderboard: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/leaderboard/monthly
 * Get monthly leaderboard
 */
gamificationRouter.get(
  "/leaderboard/monthly",
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
      const leaderboard =
        await GamificationService.getMonthlyLeaderboard(limit);
      res.json({ leaderboard });
    } catch (error: any) {
      logger.error(`Error fetching monthly leaderboard: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/gamification/ranking
 * Get user's current ranking
 */
gamificationRouter.get(
  "/ranking",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const ranking = await GamificationService.getUserRanking(userId);
      res.json({ ranking });
    } catch (error: any) {
      logger.error(`Error fetching user ranking: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * CHALLENGES ENDPOINTS
 */

/**
 * POST /api/gamification/challenges/daily
 * Create daily challenge (admin only)
 */
gamificationRouter.post(
  "/challenges/daily",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Check admin role
      const challenge = await GamificationService.createDailyChallenge();
      res.json({ message: "Challenge created", challenge });
    } catch (error: any) {
      logger.error(`Error creating challenge: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/gamification/challenges/:challengeId/complete
 * Mark challenge as completed
 */
gamificationRouter.post(
  "/challenges/:challengeId/complete",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const userId = req.user?.id;

      await GamificationService.completeChallenge(userId, challengeId);
      res.json({ message: "Challenge completed" });
    } catch (error: any) {
      logger.error(`Error completing challenge: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POINTS ENDPOINTS
 */

/**
 * POST /api/gamification/points
 * Award points to user (internal use)
 */
gamificationRouter.post(
  "/points",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { points, reason } = req.body;
      const userId = req.user?.id;

      if (!points || !reason) {
        return res.status(400).json({ error: "Points and reason required" });
      }

      await GamificationService.awardPoints(userId, points, reason);
      res.json({ message: "Points awarded" });
    } catch (error: any) {
      logger.error(`Error awarding points: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/gamification/points/calculate
 * Calculate points for activity
 */
gamificationRouter.post(
  "/points/calculate",
  async (req: Request, res: Response) => {
    try {
      const activity = req.body;
      const points = GamificationService.calculateActivityPoints(activity);
      res.json({ points });
    } catch (error: any) {
      logger.error(`Error calculating points: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * SOCIAL ENDPOINTS
 */

/**
 * POST /api/gamification/share/:achievementType
 * Share achievement
 */
gamificationRouter.post(
  "/share/:achievementType",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { achievementType } = req.params;
      const userId = req.user?.id;

      await GamificationService.shareAchievement(userId, achievementType);
      res.json({ message: "Achievement shared" });
    } catch (error: any) {
      logger.error(`Error sharing achievement: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  },
);

export default gamificationRouter;
