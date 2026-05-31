import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { User } from "../models/User.model";
import { RefreshToken } from "../models/RefreshToken.model";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} from "../services/jwt.service";
import { sendSuccess } from "../utils/apiResponse";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppError";
import { createAuditLog } from "../utils/auditLog";
import { sendWelcomeEmail } from "../services/email.service";
import { env } from "../config/env";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const IS_PROD = env.NODE_ENV === "production";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    // Production: SameSite=None (required for cross-domain AJAX with credentials)
    // Development: SameSite=Lax (same localhost domain, no HTTPS needed)
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD, // SameSite=None requires Secure
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
    path: "/api/v1/auth",
  });
}

async function issueTokenPair(
  userId: string,
  email: string,
  role: string,
  name: string,
  ip?: string,
  userAgent?: string
) {
  const tokenFamily = crypto.randomUUID();

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ userId, email, role, name }),
    signRefreshToken({ userId, tokenFamily }),
  ]);

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(refreshToken),
    tokenFamily,
    expiresAt: getRefreshTokenExpiryDate(),
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  });

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email }).lean();
  if (existing) throw new ConflictError("Email already registered");

  const user = await User.create({ name, email, password, role: "user" });

  const { accessToken, refreshToken } = await issueTokenPair(
    user._id.toString(),
    user.email,
    user.role,
    user.name,
    req.ip,
    req.headers["user-agent"]
  );

  await createAuditLog({
    userId: user._id.toString(),
    userEmail: user.email,
    role: user.role,
    action: "USER_REGISTER",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  setRefreshCookie(res, refreshToken);

  // Fire-and-forget — email failure must not block the response
  sendWelcomeEmail(user.email, user.name);

  return sendSuccess(
    res,
    {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
    201
  );
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isActive) throw new BadRequestError("Invalid credentials");

  const valid = await user.comparePassword(password);
  if (!valid) throw new BadRequestError("Invalid credentials");

  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  const { accessToken, refreshToken } = await issueTokenPair(
    user._id.toString(),
    user.email,
    user.role,
    user.name,
    req.ip,
    req.headers["user-agent"]
  );

  await createAuditLog({
    userId: user._id.toString(),
    userEmail: user.email,
    role: user.role,
    action: "USER_LOGIN",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) throw new UnauthorizedError("Refresh token required");

  let payload;
  try {
    payload = await verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    clearRefreshCookie(res);
    throw new UnauthorizedError("Refresh token not recognized");
  }

  // Reuse detected — entire family is compromised; nuke all sessions
  if (stored.isRevoked) {
    await RefreshToken.deleteMany({ tokenFamily: payload.tokenFamily });
    clearRefreshCookie(res);
    throw new UnauthorizedError("Token reuse detected — all sessions revoked");
  }

  await RefreshToken.findByIdAndUpdate(stored._id, { isRevoked: true });

  const user = await User.findById(payload.userId).lean();
  if (!user || !user.isActive) {
    clearRefreshCookie(res);
    throw new UnauthorizedError("User not found or deactivated");
  }

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    user._id.toString(),
    user.email,
    user.role,
    user.name,
    req.ip,
    req.headers["user-agent"]
  );

  setRefreshCookie(res, newRefreshToken);

  return sendSuccess(res, {
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;

  if (token) {
    const tokenHash = hashToken(token);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  }

  clearRefreshCookie(res);

  if (req.user) {
    await createAuditLog({
      userId: req.user.userId,
      userEmail: req.user.email,
      role: req.user.role,
      action: "USER_LOGOUT",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  return sendSuccess(res, { message: "Logged out successfully" });
}
