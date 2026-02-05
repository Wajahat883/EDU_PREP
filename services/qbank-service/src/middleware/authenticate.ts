import { Request, Response, NextFunction } from "express";

// Simplified authenticate middleware for development
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // In development, allow all requests
  // In production, this should verify JWT tokens
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV === "production" && !authHeader) {
    return res.status(401).json({ error: "Authorization required" });
  }

  // For development, add a mock user
  (req as any).user = {
    id: "dev-user-id",
    email: "dev@eduprep.com",
    role: "admin",
  };

  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Mock user for development
    (req as any).user = {
      id: "dev-user-id",
      email: "dev@eduprep.com",
      role: "admin",
    };
  }

  next();
};

export default authenticate;
