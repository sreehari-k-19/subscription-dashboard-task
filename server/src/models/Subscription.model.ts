import mongoose, { Document, Schema, Types } from "mongoose";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "grace_period"
  | "expired"
  | "cancelled"
  | "suspended";

export type BillingCycle = "monthly" | "yearly";

export type HistoryEventType =
  | "new"
  | "upgrade"
  | "downgrade"
  | "renewal"
  | "cancellation"
  | "admin_assign";

export interface ISubscriptionHistory {
  planId: Types.ObjectId;
  planName: string;
  price: number;
  type: HistoryEventType;
  changedAt: Date;
  credit?: number;
  daysExtended?: number;
  changedBy?: Types.ObjectId;
  note?: string;
}

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;
  couponApplied?: {
    code: string;
    discountPercent: number;
  };
  history: ISubscriptionHistory[];
  gracePeriodEndsAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionHistorySchema = new Schema<ISubscriptionHistory>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    type: {
      type: String,
      enum: ["new", "upgrade", "downgrade", "renewal", "cancellation", "admin_assign"],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    credit: { type: Number, default: null },
    daysExtended: { type: Number, default: null },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: null },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "grace_period", "expired", "cancelled", "suspended"],
      default: "pending",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    couponApplied: {
      code: { type: String, default: null },
      discountPercent: { type: Number, default: 0 },
    },
    history: [subscriptionHistorySchema],
    gracePeriodEndsAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ stripeSessionId: 1 }, { sparse: true });

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
