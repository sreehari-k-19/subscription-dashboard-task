import { Router } from "express";
import { getPlans, getPlanBySlug } from "../controllers/plan.controller";

export const planRouter = Router();

planRouter.get("/", getPlans);
planRouter.get("/:slug", getPlanBySlug);
