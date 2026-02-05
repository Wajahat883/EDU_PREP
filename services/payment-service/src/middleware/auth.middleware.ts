/**
 * Authentication Middleware
 * Location: services/payment-service/src/middleware/auth.middleware.ts
 *
 * Validates JWT tokens and provides user context to protected routes
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      logger.warn("No token provided in request");
      return res.status(401).json({
        error: "Access token required",
        code: "NO_TOKEN",
      });
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";

    jwt.verify(token, secret, (err, decoded: any) => {
      if (err) {
        logger.warn(`Token verification failed: ${err.message}`);
        return res.status(403).json({
          error: "Invalid or expired token",
          code: "INVALID_TOKEN",
        });
      }

      req.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        role: decoded.role || "student",
      };

      next();
    });
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";

    jwt.verify(token, secret, (err, decoded: any) => {
      if (!err && decoded) {
        req.user = {
          id: decoded.sub || decoded.userId,
          email: decoded.email,
          role: decoded.role || "student",
        };
      }
      next();
    });
  } catch (error) {
    logger.error("Optional auth error:", error);
    next();
  }
};
