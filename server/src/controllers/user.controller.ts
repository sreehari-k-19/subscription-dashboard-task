import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.model";
import { Notification } from "../models/Notification.model";
import { sendSuccess, buildPaginationMeta } from "../utils/apiResponse";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { createAuditLog } from "../utils/auditLog";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      emailAlerts: z.boolean().optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    })
    .optional(),
});

export async function getProfile(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId).lean();
  if (!user) throw new NotFoundError("User");
  return sendSuccess(res, user);
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);

  const updates: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar;

  if (parsed.data.preferences) {
    const prefs = parsed.data.preferences;
    if (prefs.notifications !== undefined)
      updates["preferences.notifications"] = prefs.notifications;
    if (prefs.emailAlerts !== undefined)
      updates["preferences.emailAlerts"] = prefs.emailAlerts;
    if (prefs.theme !== undefined) updates["preferences.theme"] = prefs.theme;
  }

  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!user) throw new NotFoundError("User");

  await createAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    role: req.user!.role,
    action: "USER_UPDATE",
    resource: "User",
    resourceId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, user);
}

export async function getNotifications(req: Request, res: Response) {
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20")));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId: req.user!.userId };
  if (req.query.unread === "true") filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  const unreadCount = await Notification.countDocuments({
    userId: req.user!.userId,
    isRead: false,
  });

  return sendSuccess(res, { notifications, unreadCount }, 200, {
    pagination: buildPaginationMeta(page, limit, total),
  });
}

export async function markNotificationRead(req: Request, res: Response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    { isRead: true },
    { new: true }
  ).lean();

  if (!notification) throw new NotFoundError("Notification");
  return sendSuccess(res, notification);
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const result = await Notification.updateMany(
    { userId: req.user!.userId, isRead: false },
    { isRead: true }
  );

  return sendSuccess(res, { updatedCount: result.modifiedCount });
}
