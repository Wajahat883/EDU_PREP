import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
    ) as any;
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    (req as any).userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
