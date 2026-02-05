import { Request, Response, NextFunction } from "express";

/**
 * Validate and sanitize query parameters
 */
export const validateQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void | Response => {
  try {
    const { limit, offset, difficulty_min, difficulty_max } = req.query;

    // Validate limit
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          status: "error",
          message: "Limit must be between 1 and 100",
        });
      }
    }

    // Validate offset
    if (offset) {
      const offsetNum = parseInt(offset as string);
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
          status: "error",
          message: "Offset must be 0 or greater",
        });
      }
    }

    // Validate difficulty range
    if (difficulty_min) {
      const min = parseInt(difficulty_min as string);
      if (isNaN(min) || min < 1 || min > 10) {
        return res.status(400).json({
          status: "error",
          message: "Difficulty min must be between 1 and 10",
        });
      }
    }

    if (difficulty_max) {
      const max = parseInt(difficulty_max as string);
      if (isNaN(max) || max < 1 || max > 10) {
        return res.status(400).json({
          status: "error",
          message: "Difficulty max must be between 1 and 10",
        });
      }
    }

    // Validate difficulty_min <= difficulty_max
    if (difficulty_min && difficulty_max) {
      const min = parseInt(difficulty_min as string);
      const max = parseInt(difficulty_max as string);
      if (min > max) {
        return res.status(400).json({
          status: "error",
          message: "Difficulty min must be less than or equal to max",
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameters",
    });
  }
};

/**
 * Validate JSON request body
 */
export const validateRequestBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          details: error.details.map((d: any) => ({
            field: d.path.join("."),
            message: d.message,
          })),
        });
      }

      req.body = value;
      next();
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: "Request validation failed",
      });
    }
  };
};

/**
 * Sanitize string inputs to prevent injection
 */
export const sanitizeInputs = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, "") // Remove angle brackets
      .trim()
      .substring(0, 5000); // Limit length
  };

  // Sanitize query parameters
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitizeString(req.query[key] as string);
    }
  });

  // Sanitize body
  if (req.body && typeof req.body === "object") {
    const sanitizeObj = (obj: any): any => {
      const result = { ...obj };
      Object.keys(result).forEach((key) => {
        if (typeof result[key] === "string") {
          result[key] = sanitizeString(result[key]);
        } else if (typeof result[key] === "object" && result[key] !== null) {
          result[key] = sanitizeObj(result[key]);
        }
      });
      return result;
    };
    req.body = sanitizeObj(req.body);
  }

  next();
};
