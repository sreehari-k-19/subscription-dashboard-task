import { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Subscription } from "../models/Subscription.model";
import { Plan } from "../models/Plan.model";
import { Coupon } from "../models/Coupon.model";
import { sendSuccess } from "../utils/apiResponse";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../errors/AppError";
import { calculateProration } from "../services/proration.service";
import { createAuditLog } from "../utils/auditLog";
import { createNotification } from "../utils/notification";
import { sendSubscriptionConfirmationEmail } from "../services/email.service";
import { stripe } from "../services/stripe.service";
import { env } from "../config/env";
import type { BillingCycle } from "../models/Subscription.model";

const subscribeSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  couponCode: z.string().optional(),
});

const switchPlanSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

// ─── Subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(req: Request, res: Response) {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const { billingCycle, couponCode } = parsed.data;
  const userId = req.user!.userId;

  const existing = await Subscription.findOne({ userId, status: "active" });
  if (existing) throw new ConflictError("Already have active subscription. Use switch plan.");

  const plan = await Plan.findById(req.params.planId).lean();
  if (!plan || !plan.isActive) throw new NotFoundError("Plan");

  // Coupon validation
  let discountPercent = 0;
  let appliedCoupon: { code: string; discountPercent: number } | undefined;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      $expr: { $lt: ["$usedCount", "$maxUses"] },
    });

    if (!coupon) throw new BadRequestError("Invalid or expired coupon code");

    if (coupon.applicablePlans.length > 0) {
      const applicable = coupon.applicablePlans.some(
        (id) => id.toString() === plan._id.toString()
      );
      if (!applicable) throw new BadRequestError("Coupon not valid for this plan");
    }

    discountPercent = coupon.discountValue;
    appliedCoupon = { code: coupon.code, discountPercent: coupon.discountValue };
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  const price =
    billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
  const finalPrice = price * (1 - discountPercent / 100);

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  // Free plan — activate immediately, no Stripe needed
  if (finalPrice === 0) {
    const subscription = await Subscription.create({
      userId,
      planId: plan._id,
      status: "active",
      billingCycle,
      startDate,
      endDate,
      autoRenew: true,
      couponApplied: appliedCoupon ?? { code: null, discountPercent: 0 },
      history: [{
        planId: plan._id,
        planName: plan.name,
        price: 0,
        type: "new",
        changedAt: new Date(),
      }],
    });

    await createAuditLog({
      userId,
      userEmail: req.user!.email,
      role: req.user!.role,
      action: "SUBSCRIBE",
      resource: "Subscription",
      resourceId: subscription._id.toString(),
      metadata: { planId: plan._id, planName: plan.name, billingCycle, finalPrice: 0 },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await createNotification({
      userId,
      type: "subscription",
      title: "Subscription Activated",
      message: `You're now on the ${plan.name} plan — free forever.`,
      metadata: { planId: plan._id.toString() },
    });

    sendSubscriptionConfirmationEmail(
      req.user!.email,
      req.user!.name,
      plan.name,
      billingCycle,
      endDate
    );

    return sendSuccess(res, { subscription, sessionUrl: null }, 201);
  }

  // Paid plan — create pending subscription then Stripe Checkout session
  const pendingSub = await Subscription.create({
    userId,
    planId: plan._id,
    status: "pending",
    billingCycle,
    startDate,
    endDate,
    autoRenew: true,
    couponApplied: appliedCoupon ?? { code: null, discountPercent: 0 },
    history: [{
      planId: plan._id,
      planName: plan.name,
      price: finalPrice,
      type: "new",
      changedAt: new Date(),
    }],
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: `${plan.name} Plan`,
            description: `${billingCycle === "yearly" ? "Yearly" : "Monthly"} subscription — ${plan.description}`,
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      subscriptionId: pendingSub._id.toString(),
      userId,
      planId: plan._id.toString(),
      planName: plan.name,
    },
    success_url: `${env.CLIENT_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/plans?payment=cancelled`,
  });

  await Subscription.findByIdAndUpdate(pendingSub._id, {
    stripeSessionId: session.id,
  });

  await createAuditLog({
    userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "SUBSCRIBE",
    resource: "Subscription",
    resourceId: pendingSub._id.toString(),
    metadata: { planId: plan._id, planName: plan.name, billingCycle, finalPrice, sessionId: session.id },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, { subscription: pendingSub, sessionUrl: session.url }, 201);
}

// ─── Get My Subscription ─────────────────────────────────────────────────────

export async function getMySubscription(req: Request, res: Response) {
  const subscription = await Subscription.findOne({
    userId: req.user!.userId,
    status: { $in: ["active", "grace_period", "pending"] },
  })
    .populate("planId", "name slug price features featureFlags tier badge")
    .lean();

  return sendSuccess(res, subscription ?? null);
}

// ─── Get Subscription History ─────────────────────────────────────────────────

export async function getSubscriptionHistory(req: Request, res: Response) {
  const subscriptions = await Subscription.find({ userId: req.user!.userId })
    .populate("planId", "name slug price")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, subscriptions);
}

// ─── Proration Preview ────────────────────────────────────────────────────────

export async function getProrationPreview(req: Request, res: Response) {
  const body = req.body as { billingCycle?: BillingCycle };
  const billingCycle: BillingCycle = body?.billingCycle ?? "monthly";

  const subscription = await Subscription.findOne({
    userId: req.user!.userId,
    status: "active",
  });
  if (!subscription) throw new BadRequestError("No active subscription found");

  const [currentPlan, newPlan] = await Promise.all([
    Plan.findById(subscription.planId).lean(),
    Plan.findById(req.params.newPlanId).lean(),
  ]);

  if (!currentPlan) throw new NotFoundError("Current plan");
  if (!newPlan || !newPlan.isActive) throw new NotFoundError("New plan");

  if (currentPlan._id.toString() === newPlan._id.toString()) {
    throw new BadRequestError("Already subscribed to this plan");
  }

  const preview = calculateProration(subscription, currentPlan, newPlan, billingCycle);
  return sendSuccess(res, preview);
}

// ─── Switch Plan (Upgrade / Downgrade) ───────────────────────────────────────

export async function switchPlan(req: Request, res: Response) {
  const parsed = switchPlanSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const { billingCycle } = parsed.data;
  const userId = req.user!.userId;

  const subscription = await Subscription.findOne({ userId, status: "active" });
  if (!subscription) throw new BadRequestError("No active subscription to switch");

  const [currentPlan, newPlan] = await Promise.all([
    Plan.findById(subscription.planId).lean(),
    Plan.findById(req.params.newPlanId).lean(),
  ]);

  if (!currentPlan) throw new NotFoundError("Current plan");
  if (!newPlan || !newPlan.isActive) throw new NotFoundError("New plan");

  if (currentPlan._id.toString() === newPlan._id.toString()) {
    throw new BadRequestError("Already on this plan");
  }

  const proration = calculateProration(subscription, currentPlan, newPlan, billingCycle);

  const newPrice =
    billingCycle === "yearly" ? newPlan.price.yearly : newPlan.price.monthly;

  const historyEntry = {
    planId: new Types.ObjectId(newPlan._id.toString()),
    planName: newPlan.name,
    price: newPrice,
    type: proration.type as "upgrade" | "downgrade",
    changedAt: new Date(),
    credit: proration.creditAmount,
    daysExtended: proration.daysExtended,
    changedBy: new Types.ObjectId(userId),
  };

  subscription.planId = new Types.ObjectId(newPlan._id.toString());
  subscription.billingCycle = billingCycle;
  subscription.endDate = proration.newEndDate;
  subscription.history.push(historyEntry);
  await subscription.save();

  const auditAction = proration.type === "upgrade" ? "PLAN_UPGRADE" : "PLAN_DOWNGRADE";
  await createAuditLog({
    userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: auditAction,
    resource: "Subscription",
    resourceId: subscription._id.toString(),
    metadata: {
      from: currentPlan.name,
      to: newPlan.name,
      credit: proration.creditAmount,
      chargeToday: proration.chargeToday,
    },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  await createNotification({
    userId,
    type: "subscription",
    title: `Plan ${proration.type === "upgrade" ? "Upgraded" : "Downgraded"}`,
    message: `Switched from ${currentPlan.name} to ${newPlan.name}. New expiry: ${proration.newEndDate.toLocaleDateString()}.`,
    metadata: { proration },
  });

  const updated = await Subscription.findById(subscription._id)
    .populate("planId", "name slug price features featureFlags tier badge")
    .lean();

  return sendSuccess(res, { subscription: updated, proration });
}

// ─── Cancel Subscription ──────────────────────────────────────────────────────

export async function cancelSubscription(req: Request, res: Response) {
  const body = req.body as { reason?: string };
  const userId = req.user!.userId;

  const subscription = await Subscription.findOne({ userId, status: "active" });
  if (!subscription) throw new BadRequestError("No active subscription to cancel");

  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  subscription.cancellationReason = body?.reason ?? undefined;
  subscription.autoRenew = false;
  subscription.history.push({
    planId: subscription.planId as Types.ObjectId,
    planName: "—",
    price: 0,
    type: "cancellation",
    changedAt: new Date(),
  });

  await subscription.save();

  await createAuditLog({
    userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "PLAN_CANCEL",
    resource: "Subscription",
    resourceId: subscription._id.toString(),
    metadata: { reason: body?.reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  await createNotification({
    userId,
    type: "subscription",
    title: "Subscription Cancelled",
    message: "Your subscription has been cancelled. Access remains until end date.",
  });

  return sendSuccess(res, { message: "Subscription cancelled" });
}

// ─── Toggle Auto-Renew ────────────────────────────────────────────────────────

export async function toggleAutoRenew(req: Request, res: Response) {
  const body = req.body as { autoRenew: boolean };

  if (typeof body?.autoRenew !== "boolean") {
    throw new BadRequestError("autoRenew must be a boolean");
  }

  const subscription = await Subscription.findOneAndUpdate(
    { userId: req.user!.userId, status: "active" },
    { autoRenew: body.autoRenew },
    { new: true }
  );

  if (!subscription) throw new BadRequestError("No active subscription found");

  return sendSuccess(res, {
    autoRenew: subscription.autoRenew,
    message: `Auto-renew ${subscription.autoRenew ? "enabled" : "disabled"}`,
  });
}
