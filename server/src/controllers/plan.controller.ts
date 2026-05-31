import { Request, Response } from "express";
import { Plan } from "../models/Plan.model";
import { sendSuccess } from "../utils/apiResponse";
import { NotFoundError } from "../errors/AppError";

export async function getPlans(_req: Request, res: Response) {
  const plans = await Plan.find({ isActive: true }).sort({ tier: 1 }).lean();
  return sendSuccess(res, plans);
}

export async function getPlanBySlug(req: Request, res: Response) {
  const plan = await Plan.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!plan) throw new NotFoundError("Plan");
  return sendSuccess(res, plan);
}
