import { Router } from "express";
import { residentsRouter } from "./residents";
import { imagesRouter } from "./images";
import { adlRouter } from "./adl";
import { medicationsRouter } from "./medications";
import { notesRouter } from "./notes";
import { enforceFacilityScope } from "../../middleware/facilityScope";

export const secureRoutes = Router();

// All secure routes require facility scoping
secureRoutes.use(enforceFacilityScope);

// EHR routes
secureRoutes.use("/residents", residentsRouter);
secureRoutes.use("/adl", adlRouter);
secureRoutes.use("/medications", medicationsRouter);
secureRoutes.use("/notes", notesRouter);

// Facility management
secureRoutes.use("/images", imagesRouter);
