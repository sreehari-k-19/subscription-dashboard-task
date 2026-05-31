import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";
import { Subscription } from "../models/Subscription.model";
import { Plan, type IPlanFeatureFlags } from "../models/Plan.model";

export function requireFeature(flag: keyof IPlanFeatureFlags) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const subscription = await Subscription.findOne({
      userId: req.user.userId,
      status: "active",
    }).lean();

    if (!subscription) {
      throw new ForbiddenError("No active subscription found");
    }

    const plan = await Plan.findById(subscription.planId).lean();

    if (!plan) {
      throw new ForbiddenError("Subscription plan not found");
    }

    const flagValue = plan.featureFlags[flag];

    if (flagValue === false || flagValue === 0) {
      throw new ForbiddenError(
        `Your current plan does not include '${flag}'. Upgrade to unlock this feature.`
      );
    }

    next();
  };
}
