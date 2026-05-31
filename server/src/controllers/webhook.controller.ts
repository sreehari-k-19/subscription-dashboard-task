import { Request, Response } from "express";
import { stripe } from "../services/stripe.service";
import { Subscription } from "../models/Subscription.model";
import { Plan } from "../models/Plan.model";
import { User } from "../models/User.model";
import { env } from "../config/env";
import { createNotification } from "../utils/notification";
import { createAuditLog } from "../utils/auditLog";
import {
  sendSubscriptionConfirmationEmail,
  sendPaymentFailedEmail,
} from "../services/email.service";

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event;
  try {
    // req.body is a raw Buffer when express.raw() middleware is used
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error(`Stripe webhook error: ${message}`);
    return res.status(400).json({ error: `Webhook error: ${message}` });
  }

  console.log(`Stripe event received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = session.metadata?.subscriptionId;

      if (!subscriptionId) {
        console.warn("checkout.session.completed: no subscriptionId in metadata");
        break;
      }

      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        console.warn(`checkout.session.completed: subscription ${subscriptionId} not found`);
        break;
      }

      subscription.status = "active";
      subscription.stripeSessionId = session.id;
      await subscription.save();

      await createNotification({
        userId: subscription.userId.toString(),
        type: "payment",
        title: "Payment Successful",
        message: `Your subscription is now active. Welcome!`,
        metadata: { sessionId: session.id, subscriptionId },
      });

      await createAuditLog({
        userId: subscription.userId.toString(),
        action: "STRIPE_WEBHOOK",
        resource: "Subscription",
        resourceId: subscriptionId,
        metadata: { event: event.type, sessionId: session.id },
      });

      // Send confirmation email — look up user and plan for display names
      const [subUser, subPlan] = await Promise.all([
        User.findById(subscription.userId).lean(),
        Plan.findById(subscription.planId).lean(),
      ]);
      if (subUser && subPlan) {
        sendSubscriptionConfirmationEmail(
          subUser.email,
          subUser.name,
          subPlan.name,
          subscription.billingCycle,
          subscription.endDate
        );
      }

      console.log(`Subscription ${subscriptionId} activated via Stripe`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const subscriptionId = session.metadata?.subscriptionId;
      if (subscriptionId) {
        await Subscription.findByIdAndUpdate(subscriptionId, {
          status: "cancelled",
          cancellationReason: "Stripe checkout session expired",
          cancelledAt: new Date(),
        });
        console.log(`Subscription ${subscriptionId} cancelled — session expired`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const sessionList = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });
      const session = sessionList.data[0];
      const subscriptionId = session?.metadata?.subscriptionId;

      if (subscriptionId) {
        const gracePeriodEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await Subscription.findByIdAndUpdate(subscriptionId, {
          status: "grace_period",
          gracePeriodEndsAt,
        });

        const sub = await Subscription.findById(subscriptionId);
        if (sub) {
          await createNotification({
            userId: sub.userId.toString(),
            type: "payment",
            title: "Payment Failed",
            message: `Payment failed. Your access continues until ${gracePeriodEndsAt.toLocaleDateString()}. Please update your payment method.`,
          });

          const failedUser = await User.findById(sub.userId).lean();
          if (failedUser) {
            sendPaymentFailedEmail(failedUser.email, failedUser.name, gracePeriodEndsAt);
          }
        }
        console.log(`Subscription ${subscriptionId} set to grace_period`);
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
