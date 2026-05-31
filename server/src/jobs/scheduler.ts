import cron from "node-cron";
import { Subscription } from "../models/Subscription.model";
import { User } from "../models/User.model";
import { createNotification } from "../utils/notification";
import {
  sendExpiryWarningEmail,
  sendPaymentFailedEmail,
} from "../services/email.service";

export function startScheduler(): void {
  // Every midnight: expire subscriptions past endDate, notify each user
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();

      const expiring = await Subscription.find({
        status: "active",
        endDate: { $lte: now },
      }).lean();

      if (expiring.length === 0) return;

      const ids = expiring.map((s) => s._id);
      await Subscription.updateMany({ _id: { $in: ids } }, { $set: { status: "expired" } });

      for (const sub of expiring) {
        createNotification({
          userId: sub.userId.toString(),
          type: "subscription",
          title: "Subscription Expired",
          message: "Your subscription has expired. Visit Plans to renew.",
        });
      }

      console.log(`[Cron] Expired ${expiring.length} subscriptions`);
    } catch (err) {
      console.error("[Cron] Expiry job failed:", err);
    }
  });

  // Every 6 hours: expire grace_period subscriptions, notify each user
  cron.schedule("0 */6 * * *", async () => {
    try {
      const now = new Date();

      const expiring = await Subscription.find({
        status: "grace_period",
        gracePeriodEndsAt: { $lte: now },
      }).lean();

      if (expiring.length === 0) return;

      const ids = expiring.map((s) => s._id);
      await Subscription.updateMany({ _id: { $in: ids } }, { $set: { status: "expired" } });

      for (const sub of expiring) {
        createNotification({
          userId: sub.userId.toString(),
          type: "payment",
          title: "Grace Period Ended",
          message: "Your grace period has ended and access is suspended. Please renew your plan.",
        });

        const user = await User.findById(sub.userId).lean();
        if (user) {
          sendPaymentFailedEmail(user.email, user.name, now);
        }
      }

      console.log(`[Cron] Grace period expired: ${expiring.length} subscriptions`);
    } catch (err) {
      console.error("[Cron] Grace period job failed:", err);
    }
  });

  // Daily at 9am: warn users whose subscription expires in ~3 days
  // Window [now+2d, now+3d] means each subscription is matched exactly once
  cron.schedule("0 9 * * *", async () => {
    try {
      const now = new Date();
      const in2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const expiringSoon = await Subscription.find({
        status: "active",
        endDate: { $gte: in2d, $lte: in3d },
      }).lean();

      for (const sub of expiringSoon) {
        createNotification({
          userId: sub.userId.toString(),
          type: "subscription",
          title: "Subscription Expiring Soon",
          message: `Your plan expires on ${sub.endDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}. Renew now to keep access.`,
        });

        const user = await User.findById(sub.userId).lean();
        if (user) {
          sendExpiryWarningEmail(user.email, user.name, sub.endDate);
        }
      }

      if (expiringSoon.length > 0) {
        console.log(`[Cron] Sent expiry warnings for ${expiringSoon.length} subscriptions`);
      }
    } catch (err) {
      console.error("[Cron] Expiry warning job failed:", err);
    }
  });

  console.log(" Scheduler started");
}
