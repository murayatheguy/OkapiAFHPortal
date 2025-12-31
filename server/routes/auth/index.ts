import { Router } from "express";
import { mfaRouter } from "./mfa";
import { staffPinRouter } from "./staffPin";

export const authRoutes = Router();

// MFA routes (require user authentication)
authRoutes.use("/mfa", mfaRouter);

// Staff PIN routes
authRoutes.use("/staff", staffPinRouter);
