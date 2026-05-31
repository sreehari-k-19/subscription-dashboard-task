import mongoose, { Document, Schema, Types } from "mongoose";

export type DiscountType = "percent" | "fixed";

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  applicablePlans: Types.ObjectId[];
  expiresAt?: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    maxUses: {
      type: Number,
      required: true,
      min: [1, "Max uses must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicablePlans: [
      {
        type: Schema.Types.ObjectId,
        ref: "Plan",
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
