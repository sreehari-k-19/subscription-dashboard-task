import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  subscribe,
  getMySubscription,
  getSubscriptionHistory,
  getProrationPreview,
  switchPlan,
  cancelSubscription,
  toggleAutoRenew,
} from "../controllers/subscription.controller";

export const subscriptionRouter = Router();

subscriptionRouter.use(authenticate);

subscriptionRouter.post("/:planId", subscribe);
subscriptionRouter.get("/me", getMySubscription);
subscriptionRouter.get("/me/history", getSubscriptionHistory);
subscriptionRouter.get("/proration-preview/:newPlanId", getProrationPreview);
subscriptionRouter.patch("/switch/:newPlanId", switchPlan);
subscriptionRouter.patch("/cancel", cancelSubscription);
subscriptionRouter.patch("/auto-renew", toggleAutoRenew);
