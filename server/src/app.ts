import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { env } from "./config/env";
import { registerRoutes } from "./routes";
import { AppError } from "./errors/AppError";

export function buildApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === "production" }));

  // CORS
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  app.use(cookieParser());

  // Global rate limit (per IP)
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests — slow down.",
          },
        });
      },
    })
  );

  // Request ID
  app.use((req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    req.requestId = id;
    res.locals.requestId = id;
    next();
  });

  // Register all routes (webhook route registers raw body parser before json)
  registerRoutes(app);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.url} not found`,
      },
      meta: { requestId: req.requestId },
    });
  });

  // Global error handler
  app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = (error as AppError).statusCode ?? 500;
    const isOperational = statusCode < 500;

    if (!isOperational) {
      console.error({ err: error, requestId: req.requestId }, "Unhandled error");
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: (error as AppError).code ?? "INTERNAL_SERVER_ERROR",
        message: isOperational ? error.message : "Internal server error",
        ...((error as AppError).details ? { details: (error as AppError).details } : {}),
      },
      meta: { requestId: req.requestId },
    });
  });

  return app;
}
