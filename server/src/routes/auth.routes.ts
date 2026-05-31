import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, logout } from "../controllers/auth.controller";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT",
        message: "Too many auth attempts — try again in 1 minute.",
      },
    });
  },
});

authRouter.use(authLimiter);

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
// No access token required — the refresh cookie alone identifies the session to revoke.
// Requiring authenticate here would block logout when the access token is already expired.
authRouter.post("/logout", logout);
