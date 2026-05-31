import mongoose, { Document, Schema, Types } from "mongoose";

export type AuditAction =
  | "USER_REGISTER"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_UPDATE"
  | "USER_DEACTIVATE"
  | "SUBSCRIBE"
  | "PLAN_UPGRADE"
  | "PLAN_DOWNGRADE"
  | "PLAN_CANCEL"
  | "PLAN_RENEW"
  | "ADMIN_ASSIGN_PLAN"
  | "COUPON_CREATE"
  | "COUPON_APPLY"
  | "STRIPE_WEBHOOK";

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  userEmail?: string;
  role?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userEmail: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      enum: [
        "USER_REGISTER",
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_UPDATE",
        "USER_DEACTIVATE",
        "SUBSCRIBE",
        "PLAN_UPGRADE",
        "PLAN_DOWNGRADE",
        "PLAN_CANCEL",
        "PLAN_RENEW",
        "ADMIN_ASSIGN_PLAN",
        "COUPON_CREATE",
        "COUPON_APPLY",
        "STRIPE_WEBHOOK",
      ],
      required: true,
    },
    resource: {
      type: String,
      default: null,
    },
    resourceId: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Auto-delete audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
