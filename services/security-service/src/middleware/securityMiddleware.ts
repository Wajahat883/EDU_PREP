import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

// Rate limiting by endpoint
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 100,
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: "Too many requests from this IP",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, else IP
      return req.user?.id || req.ip || "unknown";
    },
  });
};

// Specific rate limiters
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 min
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 min
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

// Content Security Policy
export const cspMiddleware = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.eduprep.com"],
    fontSrc: ["'self'", "data:"],
    frameSrc: ["'none'"],
  },
});

// CORS Configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3006"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Security headers
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // HSTS (HTTP Strict Transport Security)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // X-Frame-Options (clickjacking protection)
  res.setHeader("X-Frame-Options", "DENY");

  // X-Content-Type-Options (MIME sniffing prevention)
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  next();
};

// Input validation and sanitization
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /(<iframe|<object|<embed)/gi, // Iframes/embeds
    /union.*select/gi, // SQL injection
    /drop.*table/gi, // SQL injection
  ];

  const bodyStr = JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyStr)) {
      return res.status(400).json({
        error: "Invalid input detected",
      });
    }
  }

  next();
};

// API key validation
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  // Would verify against database
  if (apiKey.length < 32) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};

// Request signing for sensitive operations
export const requireSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers["x-signature"] as string;
  const timestamp = req.headers["x-timestamp"] as string;

  if (!signature || !timestamp) {
    return res.status(401).json({ error: "Signature required" });
  }

  // Check timestamp is within 5 minutes
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (Math.abs(currentTime - requestTime) > maxAge) {
    return res.status(401).json({ error: "Request timestamp too old" });
  }

  // Verify signature (would use HMAC)
  // ...signature verification logic...

  next();
};

// Data residency enforcement
export const enforceDataResidency = (requiredRegion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRegion = req.user?.dataRegion || process.env.DATA_REGION || "US";

    if (userRegion !== requiredRegion) {
      return res.status(403).json({
        error: `Data residency violation. Expected region: ${requiredRegion}`,
      });
    }

    next();
  };
};

// Encryption middleware for sensitive responses
export const encryptSensitiveData = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Only encrypt if response contains sensitive data markers
    if (data?.sensitive || req.user?.requiresEncryption) {
      // Would apply field-level encryption
      console.log("Sensitive data marked for encryption");
    }

    return originalJson(data);
  };

  next();
};

// Password policy enforcement
export class PasswordPolicyValidator {
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push("Password must be at least 12 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain number");
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Password must contain special character (!@#$%^&*)");
    }

    // Check against common passwords
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "letmein",
    ];
    if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
      errors.push("Password too common, choose more unique password");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Session security
export const sessionSecurity = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevent XSS access
    sameSite: "strict" as const, // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  resave: false,
  saveUninitialized: false,
};

// Two-factor authentication setup
export class TwoFactorAuth {
  generateSecret(): { secret: string; qrCode: string } {
    // Would use speakeasy or similar library
    const secret = Math.random().toString(36).substring(2, 15);
    const qrCode = `otpauth://totp/EduPrep?secret=${secret}`;

    return { secret, qrCode };
  }

  verify(secret: string, token: string): boolean {
    // Would verify TOTP token
    // Using speakeasy: speakeasy.totp.verify({secret, encoding: 'base32', token})
    return token.length === 6 && /^\d+$/.test(token);
  }

  generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );
  }
}

// Multi-factor authentication provider
export const mfaProvider = new TwoFactorAuth();

export default {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  cspMiddleware,
  corsOptions,
  securityHeaders,
  validateInput,
  validateApiKey,
  requireSignature,
  enforceDataResidency,
  encryptSensitiveData,
  PasswordPolicyValidator,
  sessionSecurity,
  mfaProvider,
};
