import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/user.controller";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/profile", getProfile);
userRouter.patch("/profile", updateProfile);
userRouter.get("/notifications", getNotifications);
userRouter.patch("/notifications/:id/read", markNotificationRead);
userRouter.patch("/notifications/read-all", markAllNotificationsRead);
