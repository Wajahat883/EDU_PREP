import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
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
      return res.status(401).json({ error: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user as AuthRequest["user"];
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Authentication error" });
  }
};
