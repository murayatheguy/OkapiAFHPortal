import { Router } from "express";
import { residentsRouter } from "./residents";
import { enforceFacilityScope } from "../../middleware/facilityScope";

export const secureRoutes = Router();

// All secure routes require facility scoping
secureRoutes.use(enforceFacilityScope);

// EHR routes
secureRoutes.use("/residents", residentsRouter);
