import { Router } from "express";
import { residentsRouter } from "./residents";
import { imagesRouter } from "./images";
import { enforceFacilityScope } from "../../middleware/facilityScope";

export const secureRoutes = Router();

// All secure routes require facility scoping
secureRoutes.use(enforceFacilityScope);

// EHR routes
secureRoutes.use("/residents", residentsRouter);

// Image management
secureRoutes.use("/images", imagesRouter);
