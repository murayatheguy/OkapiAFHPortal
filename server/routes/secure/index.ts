import { Router } from "express";
import { residentsRouter } from "./residents";
import { imagesRouter } from "./images";
import { adlRouter } from "./adl";
import { medicationsRouter } from "./medications";
import { notesRouter } from "./notes";
import { requireFacilityAccess } from "../../middleware/facility-scope";

export const secureRoutes = Router();

// All secure routes require facility scoping (owner or admin)
secureRoutes.use(requireFacilityAccess);

// EHR routes
secureRoutes.use("/residents", residentsRouter);
secureRoutes.use("/adl", adlRouter);
secureRoutes.use("/medications", medicationsRouter);
secureRoutes.use("/notes", notesRouter);

// Facility management
secureRoutes.use("/images", imagesRouter);
