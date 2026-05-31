import { ISubscription, type BillingCycle } from "../models/Subscription.model";

// Accepts lean or Document — only needs plain fields
export interface PlanLike {
  name: string;
  tier: number;
  duration: number;
  price: { monthly: number; yearly: number };
}

export interface ProrationPreview {
  currentPlanName: string;
  newPlanName: string;
  type: "upgrade" | "downgrade" | "same";
  remainingDays: number;
  totalDays: number;
  creditAmount: number;
  currentPlanPrice: number;
  newPlanPrice: number;
  chargeToday: number;
  newEndDate: Date;
  daysExtended: number;
  billingCycle: BillingCycle;
}

export function calculateProration(
  subscription: ISubscription,
  currentPlan: PlanLike,
  newPlan: PlanLike,
  billingCycle: BillingCycle = "monthly"
): ProrationPreview {
  const now = new Date();
  const endDate = new Date(subscription.endDate);

  const remainingMs = Math.max(0, endDate.getTime() - now.getTime());
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const totalDays = currentPlan.duration;

  const currentPrice =
    billingCycle === "yearly" ? currentPlan.price.yearly : currentPlan.price.monthly;
  const newPrice =
    billingCycle === "yearly" ? newPlan.price.yearly : newPlan.price.monthly;

  // Credit = proportional value remaining on current plan
  const creditAmount = parseFloat(
    ((remainingDays / totalDays) * currentPrice).toFixed(2)
  );

  const type: "upgrade" | "downgrade" | "same" =
    newPlan.tier > currentPlan.tier
      ? "upgrade"
      : newPlan.tier < currentPlan.tier
      ? "downgrade"
      : "same";

  let chargeToday = 0;
  let newEndDate: Date;
  let daysExtended = 0;

  if (type === "upgrade") {
    // User pays difference now, gets full new plan duration from today
    chargeToday = parseFloat(Math.max(0, newPrice - creditAmount).toFixed(2));
    newEndDate = new Date(now.getTime() + newPlan.duration * 24 * 60 * 60 * 1000);
  } else if (type === "downgrade") {
    // Credit extends the new plan's end date
    daysExtended =
      newPrice > 0
        ? Math.floor((creditAmount / newPrice) * newPlan.duration)
        : 0;
    chargeToday = 0;
    newEndDate = new Date(
      now.getTime() + (newPlan.duration + daysExtended) * 24 * 60 * 60 * 1000
    );
  } else {
    // Same tier — no change
    chargeToday = 0;
    newEndDate = endDate;
  }

  return {
    currentPlanName: currentPlan.name,
    newPlanName: newPlan.name,
    type,
    remainingDays,
    totalDays,
    creditAmount,
    currentPlanPrice: currentPrice,
    newPlanPrice: newPrice,
    chargeToday,
    newEndDate,
    daysExtended,
    billingCycle,
  };
}
