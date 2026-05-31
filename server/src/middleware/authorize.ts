import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";
import type { UserRole } from "../models/User.model";

export function authorize(...roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError(`Role '${req.user.role}' is not permitted`);
    }
    next();
  };
}
