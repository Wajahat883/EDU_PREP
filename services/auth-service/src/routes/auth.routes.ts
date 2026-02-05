import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import User from "../models/User";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Register endpoint
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { email, password, firstName, lastName } = value;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        email,
        passwordHash,
        firstName,
        lastName,
      });

      await user.save();

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_SECRET || "refresh-secret",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Login endpoint
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { email, password } = value;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_SECRET || "refresh-secret",
        { expiresIn: "7d" },
      );

      res.json({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Refresh token endpoint
router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_SECRET || "refresh-secret",
        ) as any;

        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        const newAccessToken = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "15m" },
        );

        res.json({ accessToken: newAccessToken });
      } catch (err) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
    } catch (error) {
      next(error);
    }
  },
);

// Get current user
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById((req as any).userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update profile
router.put(
  "/profile",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, timezone } = req.body;

      const user = await User.findByIdAndUpdate(
        (req as any).userId,
        {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(timezone && { timezone }),
        },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get subscription
router.get(
  "/subscription",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById((req as any).userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        subscription: user.subscription || {
          status: "inactive",
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update subscription
router.put(
  "/subscription",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tierId, status, startDate, endDate, renewalDate } = req.body;

      const user = await User.findByIdAndUpdate(
        (req as any).userId,
        {
          subscription: {
            tierId: tierId || undefined,
            status: status || "active",
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined,
            renewalDate: renewalDate ? new Date(renewalDate) : undefined,
          },
        },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        subscription: user.subscription,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
