import { Router } from "express";
import { facilitiesRouter } from "./facilities";
import { publicLimiter } from "../../middleware/rateLimit";

export const publicRoutes = Router();

// Apply rate limiting to all public routes
publicRoutes.use(publicLimiter);

// Public facility search and details
publicRoutes.use("/facilities", facilitiesRouter);
