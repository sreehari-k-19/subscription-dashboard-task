import { Router } from "express";
import express from "express";
import { stripeWebhook } from "../controllers/webhook.controller";

export const webhookRouter = Router();

// Raw body required for Stripe signature verification
webhookRouter.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);
