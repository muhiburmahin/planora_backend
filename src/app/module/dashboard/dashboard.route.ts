import { Router } from "express";
import auth from "../../middleware/auth";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get(
  "/user-stats",
  auth("USER", "ADMIN"),
  DashboardController.getUserDashboardStats
);

export const DashboardRoutes = router;
