import "express-session";

declare module "express-session" {
  interface SessionData {
    // Owner authentication
    ownerId?: string | null;

    // Staff authentication (EHR)
    staffId?: string | null;
    staffFacilityId?: string | null;
    staffRole?: string | null;
  }
}
