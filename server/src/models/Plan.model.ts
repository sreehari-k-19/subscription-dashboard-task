import mongoose, { Document, Schema } from "mongoose";

export interface IPlanPrice {
  monthly: number;
  yearly: number;
}

export interface IPlanFeatureFlags {
  api_access: boolean;
  priority_support: boolean;
  custom_reports: boolean;
  team_members: number;
  storage_gb: number;
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  description: string;
  price: IPlanPrice;
  currency: string;
  tier: number;
  features: string[];
  featureFlags: IPlanFeatureFlags;
  duration: number;
  isActive: boolean;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
  badge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [50, "Plan name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Plan description is required"],
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    price: {
      monthly: { type: Number, required: true, min: 0 },
      yearly: { type: Number, required: true, min: 0 },
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
      maxlength: 3,
    },
    tier: {
      type: Number,
      required: true,
      min: 1,
    },
    features: [{ type: String, trim: true }],
    featureFlags: {
      api_access: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false },
      custom_reports: { type: Boolean, default: false },
      team_members: { type: Number, default: 1 },
      storage_gb: { type: Number, default: 5 },
    },
    duration: {
      type: Number,
      required: true,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripePriceIds: {
      monthly: { type: String, default: "" },
      yearly: { type: String, default: "" },
    },
    badge: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

planSchema.index({ tier: 1 });
planSchema.index({ isActive: 1 });

export const Plan = mongoose.model<IPlan>("Plan", planSchema);
