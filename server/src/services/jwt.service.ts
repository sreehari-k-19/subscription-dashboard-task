import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env";

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  tokenFamily: string; // rotation family for detecting reuse
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  return parseInt(match[1]) * units[match[2]];
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(env.JWT_ACCESS_EXPIRES_IN)}s`)
    .setIssuer("subscription-dashboard")
    .setAudience("subscription-dashboard-client")
    .sign(accessSecret);
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(env.JWT_REFRESH_EXPIRES_IN)}s`)
    .setIssuer("subscription-dashboard")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: "subscription-dashboard",
    audience: "subscription-dashboard-client",
  });
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret, {
    issuer: "subscription-dashboard",
  });
  return payload as RefreshTokenPayload;
}

export function getRefreshTokenExpiryDate(): Date {
  const seconds = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + seconds * 1000);
}
