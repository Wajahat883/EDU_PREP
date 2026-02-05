import { Request, Response, NextFunction } from "express";
import axios from "axios";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No authentication token provided" });
      return;
    }

    // Validate token with auth-service
    try {
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      req.user = response.data.user;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    res.status(500).json({ error: "Authentication error" });
  }
};

export const authorizeAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No authentication token provided" });
      return;
    }

    // Check if user is admin
    try {
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      req.user = response.data.user;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    res.status(500).json({ error: "Authorization error" });
  }
};
