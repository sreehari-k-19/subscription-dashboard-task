import { AuditLog, type AuditAction } from "../models/AuditLog.model";

interface AuditParams {
  userId?: string;
  userEmail?: string;
  role?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string | string[];
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await AuditLog.create({
      userId: params.userId ?? null,
      userEmail: params.userEmail ?? null,
      role: params.role ?? null,
      action: params.action,
      resource: params.resource ?? null,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata ?? null,
      ip: params.ip ?? null,
      userAgent: Array.isArray(params.userAgent)
        ? params.userAgent[0]
        : params.userAgent ?? null,
    });
  } catch {
    // Audit log failure must never crash the main request
  }
}
