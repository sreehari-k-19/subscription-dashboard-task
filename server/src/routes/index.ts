import { Application } from "express";
import express from "express";
import { authRouter } from "./auth.routes";
import { planRouter } from "./plan.routes";
import { subscriptionRouter } from "./subscription.routes";
import { userRouter } from "./user.routes";
import { adminRouter } from "./admin.routes";
import { webhookRouter } from "./webhook.routes";

export function registerRoutes(app: Application) {
  // Webhooks MUST be registered before global JSON body parser
  app.use("/api/v1/webhooks", webhookRouter);

  // Global JSON body parser for all other routes
  app.use(express.json());

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/plans", planRouter);
  app.use("/api/v1/subscriptions", subscriptionRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/admin", adminRouter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
