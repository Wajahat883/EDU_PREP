import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "student" | "instructor" | "admin";
    iat: number;
    exp: number;
  };
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Token generation
export const generateToken = (
  id: string,
  email: string,
  role: "student" | "instructor" | "admin",
  expiresIn: string = "7d",
): string => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn });
};

// Token verification middleware
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

// Role-based access control
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

// Login endpoint
export const login = (req: Request, res: Response): void => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // TODO: Validate credentials against database
    // For now, mock authentication
    if (password.length < 6) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = generateToken(`user_${Date.now()}`, email, role || "student");

    res.json({
      success: true,
      token,
      user: {
        email,
        role: role || "student",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Login failed" });
  }
};

// Logout endpoint (client-side mainly, but can invalidate token server-side if needed)
export const logout = (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Refresh token endpoint
export const refreshToken = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const newToken = generateToken(
      req.user.id,
      req.user.email,
      req.user.role,
      "7d",
    );

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Token refresh failed" });
  }
};

// Verify token endpoint
export const verifyToken = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Token verification failed" });
  }
};

// Register endpoint
export const register = (req: Request, res: Response): void => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // TODO: Check if user already exists
    // TODO: Hash password and store in database
    // Mock registration
    const userId = `user_${Date.now()}`;
    const token = generateToken(userId, email, role || "student");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        email,
        name,
        role: role || "student",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// Student-only access
export const studentOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role !== "student") {
    res.status(403).json({ error: "This resource is for students only" });
    return;
  }

  next();
};

// Instructor-only access
export const instructorOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role !== "instructor" && req.user.role !== "admin") {
    res.status(403).json({ error: "This resource is for instructors only" });
    return;
  }

  next();
};

// Admin-only access
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "This resource is for admins only" });
    return;
  }

  next();
};

export default {
  generateToken,
  authenticateToken,
  authorizeRole,
  login,
  logout,
  refreshToken,
  verifyToken,
  register,
  studentOnly,
  instructorOnly,
  adminOnly,
};
