import { Notification, type NotificationType } from "../models/Notification.model";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: NotifyParams): Promise<void> {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Notification failure must never crash the main request
  }
}
