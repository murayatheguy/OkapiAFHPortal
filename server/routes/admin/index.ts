import { Router } from "express";
import { adminFacilitiesRouter } from "./facilities";
import { adminAuditRouter } from "./audit";
import { adminUsersRouter } from "./users";
import { adminStatsRouter } from "./stats";
import { requireAdmin } from "../../middleware/admin";

export const adminRoutes = Router();

// All admin routes require admin role
adminRoutes.use(requireAdmin);

// Admin sub-routes
adminRoutes.use("/facilities", adminFacilitiesRouter);
adminRoutes.use("/audit", adminAuditRouter);
adminRoutes.use("/users", adminUsersRouter);
adminRoutes.use("/stats", adminStatsRouter);
