import { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { User } from "../models/User.model";
import { Plan } from "../models/Plan.model";
import { Subscription } from "../models/Subscription.model";
import { AuditLog } from "../models/AuditLog.model";
import { Coupon } from "../models/Coupon.model";
import { sendSuccess, buildPaginationMeta } from "../utils/apiResponse";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/AppError";
import { createAuditLog } from "../utils/auditLog";
import { createNotification } from "../utils/notification";

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(_req: Request, res: Response) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    activeCount,
    activeCountPrev,
    cancelledThisMonth,
    planDistribution,
    signupsTimeline,
    recentActivity,
    totalUsers,
  ] = await Promise.all([
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({
      status: "active",
      createdAt: { $lte: thirtyDaysAgo },
    }),
    Subscription.countDocuments({
      status: "cancelled",
      cancelledAt: { $gte: thirtyDaysAgo },
    }),
    Subscription.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $group: {
          _id: "$plan._id",
          name: { $first: "$plan.name" },
          count: { $sum: 1 },
          mrr: {
            $sum: {
              $cond: [
                { $eq: ["$billingCycle", "yearly"] },
                { $divide: ["$plan.price.yearly", 12] },
                "$plan.price.monthly",
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Subscription.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]),
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select("userEmail action createdAt metadata")
      .lean(),
    User.countDocuments({ role: "user" }),
  ]);

  const mrr = planDistribution.reduce((sum: number, p: { mrr: number }) => sum + p.mrr, 0);

  const momGrowth =
    activeCountPrev > 0
      ? parseFloat((((activeCount - activeCountPrev) / activeCountPrev) * 100).toFixed(1))
      : 0;

  const activeStartOfMonth = await Subscription.countDocuments({
    status: "active",
    createdAt: { $lte: thirtyDaysAgo },
  });
  const churnRate =
    activeStartOfMonth > 0
      ? parseFloat(((cancelledThisMonth / activeStartOfMonth) * 100).toFixed(1))
      : 0;

  const prevPlanDistribution = await Subscription.aggregate([
    {
      $match: {
        status: "active",
        createdAt: { $lte: thirtyDaysAgo, $gte: sixtyDaysAgo },
      },
    },
    {
      $lookup: {
        from: "plans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    { $unwind: "$plan" },
    {
      $group: {
        _id: null,
        mrr: {
          $sum: {
            $cond: [
              { $eq: ["$billingCycle", "yearly"] },
              { $divide: ["$plan.price.yearly", 12] },
              "$plan.price.monthly",
            ],
          },
        },
      },
    },
  ]);
  const prevMrr = prevPlanDistribution[0]?.mrr ?? 0;
  const mrrGrowth =
    prevMrr > 0 ? parseFloat((((mrr - prevMrr) / prevMrr) * 100).toFixed(1)) : 0;

  return sendSuccess(res, {
    metrics: {
      mrr: parseFloat(mrr.toFixed(2)),
      mrrGrowth,
      activeSubscribers: activeCount,
      momGrowth,
      churnRate,
      totalUsers,
    },
    planDistribution,
    signupsTimeline,
    recentActivity,
  });
}

// ─── All Subscriptions ────────────────────────────────────────────────────────

export async function getAllSubscriptions(req: Request, res: Response) {
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? "20")));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status as string;
  if (req.query.planId) filter.planId = new Types.ObjectId(req.query.planId as string);

  let userFilter: Record<string, unknown> | undefined;
  if (req.query.search) {
    const regex = new RegExp(req.query.search as string, "i");
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select("_id")
      .lean();
    const userIds = users.map((u) => u._id);
    filter.userId = { $in: userIds };
    userFilter = { userId: { $in: userIds } };
  }

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .populate("userId", "name email avatar")
      .populate("planId", "name slug price tier")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Subscription.countDocuments(userFilter ?? filter),
  ]);

  return sendSuccess(res, subscriptions, 200, {
    pagination: buildPaginationMeta(page, limit, total),
  });
}

// ─── Export Subscriptions as CSV ──────────────────────────────────────────────

export async function exportSubscriptions(_req: Request, res: Response) {
  const subscriptions = await Subscription.find({})
    .populate<{ userId: { name: string; email: string } }>("userId", "name email")
    .populate<{ planId: { name: string; price: { monthly: number } } }>(
      "planId",
      "name price"
    )
    .sort({ createdAt: -1 })
    .lean();

  const header = "ID,User Name,User Email,Plan,Status,Billing Cycle,Start Date,End Date,Auto Renew\n";
  const rows = subscriptions
    .map((s) => {
      const user = s.userId as unknown as { name: string; email: string };
      const plan = s.planId as unknown as { name: string };
      return [
        s._id.toString(),
        `"${user?.name ?? ""}"`,
        `"${user?.email ?? ""}"`,
        `"${plan?.name ?? ""}"`,
        s.status,
        s.billingCycle,
        new Date(s.startDate).toISOString().split("T")[0],
        new Date(s.endDate).toISOString().split("T")[0],
        s.autoRenew,
      ].join(",");
    })
    .join("\n");

  res
    .setHeader("Content-Type", "text/csv")
    .setHeader("Content-Disposition", `attachment; filename="subscriptions-${Date.now()}.csv"`)
    .send(header + rows);
}

// ─── All Users ────────────────────────────────────────────────────────────────

export async function getAllUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? "20")));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role as string;
  if (req.query.search) {
    const regex = new RegExp(req.query.search as string, "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, users, 200, {
    pagination: buildPaginationMeta(page, limit, total),
  });
}

// ─── Toggle User Active ───────────────────────────────────────────────────────

export async function toggleUserActive(req: Request, res: Response) {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User");

  if (user.role === "admin") {
    throw new BadRequestError("Cannot deactivate admin accounts");
  }

  user.isActive = !user.isActive;
  await user.save();

  await createAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "USER_DEACTIVATE",
    resource: "User",
    resourceId: req.params.id,
    metadata: { isActive: user.isActive },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, {
    id: user._id,
    isActive: user.isActive,
    message: `User ${user.isActive ? "activated" : "deactivated"}`,
  });
}

// ─── Admin Assign Plan ────────────────────────────────────────────────────────

const assignPlanSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  note: z.string().max(200).optional(),
});

export async function adminAssignPlan(req: Request, res: Response) {
  const parsed = assignPlanSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const { userId, planId, billingCycle, note } = parsed.data;

  const [user, plan] = await Promise.all([
    User.findById(userId).lean(),
    Plan.findById(planId).lean(),
  ]);

  if (!user) throw new NotFoundError("User");
  if (!plan || !plan.isActive) throw new NotFoundError("Plan");

  await Subscription.findOneAndUpdate(
    { userId, status: "active" },
    { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Admin override" }
  );

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    userId,
    planId: plan._id,
    status: "active",
    billingCycle,
    startDate,
    endDate,
    autoRenew: false,
    history: [
      {
        planId: plan._id,
        planName: plan.name,
        price: 0,
        type: "admin_assign",
        changedAt: new Date(),
        changedBy: new Types.ObjectId(req.user!.userId),
        note: note ?? "Assigned by admin",
      },
    ],
  });

  await createAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "ADMIN_ASSIGN_PLAN",
    resource: "Subscription",
    resourceId: subscription._id.toString(),
    metadata: { targetUserId: userId, planId, planName: plan.name, note },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  await createNotification({
    userId,
    type: "admin",
    title: "Plan Assigned",
    message: `Admin assigned you the ${plan.name} plan.`,
    metadata: { planId: plan._id.toString(), planName: plan.name },
  });

  return sendSuccess(res, subscription, 201);
}

// ─── Create Coupon ────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().min(1).max(200),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().min(0),
  maxUses: z.number().int().min(1),
  applicablePlans: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export async function createCoupon(req: Request, res: Response) {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const coupon = await Coupon.create({
    ...parsed.data,
    applicablePlans: parsed.data.applicablePlans.map((id) => new Types.ObjectId(id)),
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    createdBy: new Types.ObjectId(req.user!.userId),
  });

  await createAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "COUPON_CREATE",
    resource: "Coupon",
    resourceId: coupon._id.toString(),
    metadata: { code: coupon.code, discountValue: coupon.discountValue },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, coupon, 201);
}

export async function getCoupons(_req: Request, res: Response) {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, coupons);
}
