import "express-session";

declare module "express-session" {
  interface SessionData {
    // Owner authentication
    ownerId?: string | null;

    // Staff authentication (EHR)
    staffId?: string | null;
    staffFacilityId?: string | null;
    staffRole?: string | null;
    staffName?: string | null;
    isTempStaff?: boolean;

    // Admin authentication (separate from owners)
    adminId?: string | null;
    adminRole?: "admin" | "super_admin" | null;
    impersonatedFacilityId?: string | null; // Set when admin is impersonating a facility
  }
}
