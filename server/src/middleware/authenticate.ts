import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt.service";
import { UnauthorizedError } from "../errors/AppError";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
