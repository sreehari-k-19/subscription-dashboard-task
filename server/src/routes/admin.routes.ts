import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import {
  getAnalytics,
  getAllSubscriptions,
  exportSubscriptions,
  getAllUsers,
  toggleUserActive,
  adminAssignPlan,
  createCoupon,
  getCoupons,
} from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize("admin"));

adminRouter.get("/analytics", getAnalytics);
adminRouter.get("/subscriptions", getAllSubscriptions);
adminRouter.get("/subscriptions/export", exportSubscriptions);
adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:id/toggle-active", toggleUserActive);
adminRouter.post("/subscriptions/assign", adminAssignPlan);
adminRouter.post("/coupons", createCoupon);
adminRouter.get("/coupons", getCoupons);
