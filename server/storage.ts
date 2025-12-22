import {
  users,
  facilities,
  teamMembers,
  credentials,
  inquiries,
  admins,
  reviews,
  owners,
  claimRequests,
  passwordResetTokens,
  activityLog,
  dshsSyncLogs,
  dshsHomeSync,
  dshsInspections,
  transportProviders,
  transportBookings,
  providerReviews,
  ownerSavedProviders,
  // EHR tables
  staffAuth,
  residents,
  medications,
  medicationLogs,
  dailyNotes,
  incidentReports,
  type User,
  type InsertUser,
  type Facility,
  type InsertFacility,
  type TeamMember,
  type InsertTeamMember,
  type Credential,
  type InsertCredential,
  type Inquiry,
  type InsertInquiry,
  type Admin,
  type InsertAdmin,
  type Review,
  type InsertReview,
  type Owner,
  type InsertOwner,
  type ClaimRequest,
  type InsertClaimRequest,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type ActivityLog,
  type InsertActivityLog,
  type DshsSyncLog,
  type DshsInspection,
  type InsertDshsInspection,
  type TransportProvider,
  type InsertTransportProvider,
  type TransportBooking,
  type InsertTransportBooking,
  type ProviderReview,
  type InsertProviderReview,
  type OwnerSavedProvider,
  type InsertOwnerSavedProvider,
  // EHR types
  type StaffAuth,
  type InsertStaffAuth,
  type Resident,
  type InsertResident,
  type Medication,
  type InsertMedication,
  type MedicationLog,
  type InsertMedicationLog,
  type DailyNote,
  type InsertDailyNote,
  type IncidentReport,
  type InsertIncidentReport
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, sql, inArray, desc, count, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Facilities
  getFacility(id: string): Promise<Facility | undefined>;
  getFacilityBySlug(slug: string): Promise<Facility | undefined>;
  getFacilityByIdOrSlug(idOrSlug: string): Promise<Facility | undefined>;
  getFacilityByPin(pin: string): Promise<Facility | undefined>;
  getFacilityWithTeam(idOrSlug: string): Promise<{ facility: Facility; team: Array<TeamMember & { credentials: Credential[] }> } | undefined>;
  searchFacilities(params: {
    city?: string;
    county?: string;
    specialties?: string[];
    acceptsMedicaid?: boolean;
    availableBeds?: boolean;
  }): Promise<Facility[]>;
  getAllFacilities(): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: string, facility: Partial<InsertFacility> & { claimedAt?: Date | null; googlePlaceId?: string; googleRating?: string; googleReviewCount?: number; googlePhotos?: string[]; googleSyncedAt?: Date }): Promise<Facility | undefined>;

  // Team Members
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  getTeamMembersByFacility(facilityId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<void>;

  // Credentials
  getCredential(id: string): Promise<Credential | undefined>;
  getCredentialsByTeamMember(teamMemberId: string): Promise<Credential[]>;
  getCredentialsByFacility(facilityId: string): Promise<Credential[]>;
  getExpiringCredentials(facilityId: string, daysAhead: number): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: string, credential: Partial<InsertCredential>): Promise<Credential | undefined>;
  deleteCredential(id: string): Promise<void>;

  // Inquiries
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiriesByFacility(facilityId: string): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined>;

  // Featured Facilities
  getFeaturedFacilities(limit?: number): Promise<Facility[]>;

  // Autocomplete search
  autocompleteFacilities(query: string, limit?: number): Promise<Pick<Facility, 'id' | 'name' | 'city' | 'zipCode'>[]>;

  // Admins
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdmin(id: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByFacility(facilityId: string): Promise<Review[]>;
  getApprovedReviewsByFacility(facilityId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  getReviewsByStatus(status: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<void>;

  // Owners
  getOwner(id: string): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  getAllOwners(): Promise<Owner[]>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: string, owner: Partial<InsertOwner> & { lastLoginAt?: Date }): Promise<Owner | undefined>;

  // Stats for Admin Dashboard
  getStats(): Promise<{
    totalFacilities: number;
    activeFacilities: number;
    totalOwners: number;
    pendingReviews: number;
    newInquiries: number;
  }>;

  // All inquiries for admin
  getAllInquiries(): Promise<Inquiry[]>;

  // Claim Requests
  getClaimRequest(id: string): Promise<ClaimRequest | undefined>;
  getClaimRequestsByFacility(facilityId: string): Promise<ClaimRequest[]>;
  getClaimRequestsByOwner(ownerId: string): Promise<ClaimRequest[]>;
  getClaimRequestsByStatus(status: string): Promise<ClaimRequest[]>;
  getClaimRequestsByEmail(email: string): Promise<ClaimRequest[]>;
  getPendingClaimRequests(): Promise<(ClaimRequest & { facility?: Facility })[]>;
  getAllClaimRequests(): Promise<ClaimRequest[]>;
  createClaimRequest(claimRequest: InsertClaimRequest): Promise<ClaimRequest>;
  updateClaimRequest(id: string, data: Partial<InsertClaimRequest> & { reviewedAt?: Date }): Promise<ClaimRequest | undefined>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // Activity Log
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogByEntity(entityType: string, entityId: string): Promise<ActivityLog[]>;
  getRecentActivityLog(limit?: number): Promise<ActivityLog[]>;

  // Facilities by Owner
  getFacilitiesByOwner(ownerId: string): Promise<Facility[]>;

  // Extended Stats
  getClaimStats(): Promise<{
    pendingClaims: number;
    approvedClaims: number;
    claimedFacilities: number;
    unclaimedFacilities: number;
  }>;

  // DSHS Sync
  getDshsSyncLogs(limit?: number): Promise<DshsSyncLog[]>;
  getFacilityCount(): Promise<number>;
  getSyncedHomesCount(): Promise<number>;

  // Transport Providers
  getTransportProvider(id: string): Promise<TransportProvider | undefined>;
  getTransportProviderBySlug(slug: string): Promise<TransportProvider | undefined>;
  getActiveTransportProviders(filters?: {
    county?: string;
    vehicleType?: string;
    acceptsMedicaid?: boolean;
  }): Promise<TransportProvider[]>;
  getAllTransportProviders(): Promise<TransportProvider[]>;
  createTransportProvider(provider: InsertTransportProvider): Promise<TransportProvider>;
  updateTransportProvider(id: string, data: Partial<InsertTransportProvider>): Promise<TransportProvider | undefined>;
  deleteTransportProvider(id: string): Promise<void>;

  // Transport Bookings
  getTransportBooking(id: string): Promise<TransportBooking | undefined>;
  getTransportBookingsByOwner(ownerId: string): Promise<TransportBooking[]>;
  getTransportBookingsByProvider(providerId: string): Promise<TransportBooking[]>;
  getAllTransportBookings(filters?: { status?: string }): Promise<TransportBooking[]>;
  createTransportBooking(booking: InsertTransportBooking): Promise<TransportBooking>;
  updateTransportBooking(id: string, data: Partial<TransportBooking>): Promise<TransportBooking | undefined>;

  // Provider Reviews
  getProviderReview(id: string): Promise<ProviderReview | undefined>;
  getProviderReviewsByProvider(providerId: string, status?: string): Promise<ProviderReview[]>;
  getProviderReviewsByOwner(ownerId: string): Promise<ProviderReview[]>;
  getAllProviderReviews(status?: string): Promise<ProviderReview[]>;
  createProviderReview(review: InsertProviderReview): Promise<ProviderReview>;
  updateProviderReview(id: string, data: Partial<ProviderReview>): Promise<ProviderReview | undefined>;

  // Owner Saved Providers
  getSavedProvidersByOwner(ownerId: string): Promise<(OwnerSavedProvider & { provider: TransportProvider })[]>;
  saveProvider(ownerId: string, providerId: string, notes?: string): Promise<OwnerSavedProvider>;
  unsaveProvider(ownerId: string, providerId: string): Promise<void>;
  isProviderSaved(ownerId: string, providerId: string): Promise<boolean>;
  updateSavedProviderNotes(ownerId: string, providerId: string, notes: string): Promise<OwnerSavedProvider | undefined>;

  // DSHS Inspections
  getInspectionsByFacility(facilityId: string): Promise<DshsInspection[]>;
  createInspection(inspection: InsertDshsInspection): Promise<DshsInspection>;
  deleteInspectionsByFacility(facilityId: string): Promise<void>;

  // ============================================================================
  // EHR STORAGE METHODS
  // ============================================================================

  // Staff Auth
  getStaffAuth(id: string): Promise<StaffAuth | undefined>;
  getStaffAuthByEmail(email: string): Promise<StaffAuth | undefined>;
  getStaffAuthByInviteToken(token: string): Promise<StaffAuth | undefined>;
  getStaffAuthByFacility(facilityId: string): Promise<StaffAuth[]>;
  getStaffAuthByLinkedOwner(ownerId: string, facilityId: string): Promise<StaffAuth | undefined>;
  createStaffAuth(staff: InsertStaffAuth): Promise<StaffAuth>;
  updateStaffAuth(id: string, data: Partial<InsertStaffAuth> & { lastLoginAt?: Date }): Promise<StaffAuth | undefined>;
  deleteStaffAuth(id: string): Promise<void>;

  // Residents
  getResident(id: string): Promise<Resident | undefined>;
  getResidentsByFacility(facilityId: string, status?: string): Promise<Resident[]>;
  createResident(resident: InsertResident): Promise<Resident>;
  updateResident(id: string, data: Partial<InsertResident>): Promise<Resident | undefined>;
  deleteResident(id: string): Promise<void>;

  // Medications
  getMedication(id: string): Promise<Medication | undefined>;
  getMedicationsByResident(residentId: string, activeOnly?: boolean): Promise<Medication[]>;
  getMedicationsByFacility(facilityId: string): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, data: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<void>;

  // Medication Logs (MAR)
  getMedicationLog(id: string): Promise<MedicationLog | undefined>;
  getMedicationLogsByResident(residentId: string, startDate?: Date, endDate?: Date): Promise<MedicationLog[]>;
  getMedicationLogsByFacility(facilityId: string, date: string): Promise<MedicationLog[]>;
  createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog>;
  updateMedicationLog(id: string, data: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined>;

  // Daily Notes
  getDailyNote(id: string): Promise<DailyNote | undefined>;
  getDailyNotesByResident(residentId: string, limit?: number): Promise<DailyNote[]>;
  getDailyNotesByFacility(facilityId: string, date: string): Promise<DailyNote[]>;
  createDailyNote(note: InsertDailyNote): Promise<DailyNote>;
  updateDailyNote(id: string, data: Partial<InsertDailyNote>): Promise<DailyNote | undefined>;
  deleteDailyNote(id: string): Promise<void>;

  // Incident Reports
  getIncidentReport(id: string): Promise<IncidentReport | undefined>;
  getIncidentReportsByFacility(facilityId: string, filters?: { status?: string; dshsReportable?: boolean }): Promise<IncidentReport[]>;
  getIncidentReportsByResident(residentId: string): Promise<IncidentReport[]>;
  createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport>;
  updateIncidentReport(id: string, data: Partial<InsertIncidentReport>): Promise<IncidentReport | undefined>;
  deleteIncidentReport(id: string): Promise<void>;

  // EHR Dashboard & Advanced Features
  getEhrDashboardStats(facilityId: string): Promise<{
    activeResidents: number;
    totalMedications: number;
    pendingMedications: number;
    openIncidents: number;
    dshsReportableIncidents: number;
    todayNotes: number;
  }>;
  getResidentSummary(residentId: string): Promise<{
    resident: Resident;
    activeMedications: Medication[];
    recentNotes: DailyNote[];
    recentIncidents: IncidentReport[];
    recentMar: MedicationLog[];
  } | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Facilities
  async getFacility(id: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility || undefined;
  }

  async getFacilityBySlug(slug: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.slug, slug));
    return facility || undefined;
  }

  async getFacilityByIdOrSlug(idOrSlug: string): Promise<Facility | undefined> {
    // Try by ID first (UUIDs are 36 chars with dashes)
    if (idOrSlug.length === 36 && idOrSlug.includes('-')) {
      const facility = await this.getFacility(idOrSlug);
      if (facility) return facility;
    }
    // Try by slug
    return this.getFacilityBySlug(idOrSlug);
  }

  async getFacilityByPin(pin: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.facilityPin, pin));
    return facility || undefined;
  }

  async getFacilityWithTeam(idOrSlug: string): Promise<{ facility: Facility; team: Array<TeamMember & { credentials: Credential[] }> } | undefined> {
    // Support both ID and slug
    const facility = await this.getFacilityByIdOrSlug(idOrSlug);
    if (!facility) return undefined;

    // Use the actual facility ID for team lookup
    const team = await this.getTeamMembersByFacility(facility.id);
    const teamWithCredentials = await Promise.all(
      team.map(async (member) => {
        const creds = await this.getCredentialsByTeamMember(member.id);
        return { ...member, credentials: creds };
      })
    );

    return { facility, team: teamWithCredentials };
  }

  async searchFacilities(params: {
    city?: string;
    county?: string;
    specialties?: string[];
    acceptsMedicaid?: boolean;
    availableBeds?: boolean;
  }): Promise<Facility[]> {
    const conditions = [];

    if (params.city) {
      conditions.push(ilike(facilities.city, `%${params.city}%`));
    }

    if (params.county) {
      conditions.push(eq(facilities.county, params.county));
    }

    if (params.acceptsMedicaid !== undefined) {
      conditions.push(eq(facilities.acceptsMedicaid, params.acceptsMedicaid));
    }

    if (params.availableBeds) {
      conditions.push(sql`${facilities.availableBeds} > 0`);
    }

    if (params.specialties && params.specialties.length > 0) {
      conditions.push(sql`${facilities.specialties} && ARRAY[${sql.join(params.specialties.map(s => sql`${s}`), sql`, `)}]::text[]`);
    }

    if (conditions.length === 0) {
      return await db.select().from(facilities);
    }

    return await db.select().from(facilities).where(and(...conditions));
  }

  async getAllFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities);
  }

  async createFacility(insertFacility: InsertFacility): Promise<Facility> {
    const [facility] = await db.insert(facilities).values(insertFacility as any).returning();
    return facility;
  }

  async updateFacility(id: string, updateData: Partial<InsertFacility> & { claimedAt?: Date | null; googlePlaceId?: string; googleRating?: string; googleReviewCount?: number; googlePhotos?: string[]; googleSyncedAt?: Date }): Promise<Facility | undefined> {
    const [facility] = await db
      .update(facilities)
      .set(updateData as any)
      .where(eq(facilities.id, id))
      .returning();
    return facility || undefined;
  }

  // Team Members
  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member || undefined;
  }

  async getTeamMembersByFacility(facilityId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.facilityId, facilityId));
  }

  async createTeamMember(insertMember: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(insertMember).returning();
    return member;
  }

  async updateTeamMember(id: string, updateData: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, id))
      .returning();
    return member || undefined;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Credentials
  async getCredential(id: string): Promise<Credential | undefined> {
    const [credential] = await db.select().from(credentials).where(eq(credentials.id, id));
    return credential || undefined;
  }

  async getCredentialsByTeamMember(teamMemberId: string): Promise<Credential[]> {
    return await db.select().from(credentials).where(eq(credentials.teamMemberId, teamMemberId));
  }

  async getCredentialsByFacility(facilityId: string): Promise<Credential[]> {
    return await db.select().from(credentials).where(eq(credentials.facilityId, facilityId));
  }

  async getExpiringCredentials(facilityId: string, daysAhead: number): Promise<Credential[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const today = new Date().toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return await db.select().from(credentials)
      .where(
        and(
          eq(credentials.facilityId, facilityId),
          sql`(${credentials.expirationDate} IS NOT NULL AND ${credentials.expirationDate} <= ${futureDateStr} AND ${credentials.expirationDate} >= ${today})`
        )
      );
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    const [credential] = await db.insert(credentials).values(insertCredential).returning();
    return credential;
  }

  async updateCredential(id: string, updateData: Partial<InsertCredential>): Promise<Credential | undefined> {
    const [credential] = await db
      .update(credentials)
      .set(updateData)
      .where(eq(credentials.id, id))
      .returning();
    return credential || undefined;
  }

  async deleteCredential(id: string): Promise<void> {
    await db.delete(credentials).where(eq(credentials.id, id));
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || undefined;
  }

  async getInquiriesByFacility(facilityId: string): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.facilityId, facilityId))
      .orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values(insertInquiry).returning();
    return inquiry;
  }

  async updateInquiry(id: string, updateData: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .update(inquiries)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry || undefined;
  }

  // Featured Facilities
  async getFeaturedFacilities(limit: number = 6): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .where(and(
        eq(facilities.featured, true),
        eq(facilities.status, "active")
      ))
      .orderBy(desc(facilities.rating))
      .limit(limit);
  }

  // Autocomplete search - returns facilities matching query prefix
  async autocompleteFacilities(query: string, limit: number = 10): Promise<Pick<Facility, 'id' | 'name' | 'city' | 'zipCode'>[]> {
    if (!query || query.length < 2) return [];
    
    const searchPattern = `%${query}%`;
    return await db
      .select({
        id: facilities.id,
        name: facilities.name,
        city: facilities.city,
        zipCode: facilities.zipCode,
      })
      .from(facilities)
      .where(ilike(facilities.name, searchPattern))
      .orderBy(facilities.name)
      .limit(limit);
  }

  // Admins
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(desc(admins.createdAt));
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsByFacility(facilityId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.facilityId, facilityId))
      .orderBy(desc(reviews.createdAt));
  }

  async getApprovedReviewsByFacility(facilityId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.facilityId, facilityId),
        eq(reviews.status, "approved")
      ))
      .orderBy(desc(reviews.createdAt));
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByStatus(status: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async updateReview(id: string, updateData: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return review || undefined;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Owners
  async getOwner(id: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner || undefined;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.email, email));
    return owner || undefined;
  }

  async getAllOwners(): Promise<Owner[]> {
    return await db.select().from(owners).orderBy(desc(owners.createdAt));
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const [owner] = await db.insert(owners).values(insertOwner).returning();
    return owner;
  }

  async updateOwner(id: string, updateData: Partial<InsertOwner> & { lastLoginAt?: Date }): Promise<Owner | undefined> {
    const [owner] = await db
      .update(owners)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(owners.id, id))
      .returning();
    return owner || undefined;
  }

  // Stats for Admin Dashboard
  async getStats(): Promise<{
    totalFacilities: number;
    activeFacilities: number;
    totalOwners: number;
    pendingReviews: number;
    newInquiries: number;
  }> {
    const [totalFacilitiesResult] = await db.select({ count: count() }).from(facilities);
    const [activeFacilitiesResult] = await db.select({ count: count() }).from(facilities).where(eq(facilities.status, "active"));
    const [totalOwnersResult] = await db.select({ count: count() }).from(owners);
    const [pendingReviewsResult] = await db.select({ count: count() }).from(reviews).where(eq(reviews.status, "pending"));
    const [newInquiriesResult] = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "new"));

    return {
      totalFacilities: totalFacilitiesResult?.count || 0,
      activeFacilities: activeFacilitiesResult?.count || 0,
      totalOwners: totalOwnersResult?.count || 0,
      pendingReviews: pendingReviewsResult?.count || 0,
      newInquiries: newInquiriesResult?.count || 0,
    };
  }

  // All inquiries for admin
  async getAllInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  // Claim Requests
  async getClaimRequest(id: string): Promise<ClaimRequest | undefined> {
    const [claim] = await db.select().from(claimRequests).where(eq(claimRequests.id, id));
    return claim || undefined;
  }

  async getClaimRequestsByFacility(facilityId: string): Promise<ClaimRequest[]> {
    return await db
      .select()
      .from(claimRequests)
      .where(eq(claimRequests.facilityId, facilityId))
      .orderBy(desc(claimRequests.createdAt));
  }

  async getClaimRequestsByOwner(ownerId: string): Promise<ClaimRequest[]> {
    return await db
      .select()
      .from(claimRequests)
      .where(eq(claimRequests.ownerId, ownerId))
      .orderBy(desc(claimRequests.createdAt));
  }

  async getClaimRequestsByStatus(status: string): Promise<ClaimRequest[]> {
    return await db
      .select()
      .from(claimRequests)
      .where(eq(claimRequests.status, status))
      .orderBy(desc(claimRequests.createdAt));
  }

  async getClaimRequestsByEmail(email: string): Promise<ClaimRequest[]> {
    return await db
      .select()
      .from(claimRequests)
      .where(eq(claimRequests.requesterEmail, email))
      .orderBy(desc(claimRequests.createdAt));
  }

  async getPendingClaimRequests(): Promise<(ClaimRequest & { facility?: Facility })[]> {
    const claims = await db
      .select()
      .from(claimRequests)
      .where(or(
        eq(claimRequests.status, "pending"),
        eq(claimRequests.status, "verified")
      ))
      .orderBy(desc(claimRequests.createdAt));

    const claimsWithFacilities = await Promise.all(
      claims.map(async (claim) => {
        const facility = await this.getFacility(claim.facilityId);
        return { ...claim, facility };
      })
    );

    return claimsWithFacilities;
  }

  async getAllClaimRequests(): Promise<ClaimRequest[]> {
    return await db.select().from(claimRequests).orderBy(desc(claimRequests.createdAt));
  }

  async createClaimRequest(insertClaim: InsertClaimRequest): Promise<ClaimRequest> {
    const [claim] = await db.insert(claimRequests).values(insertClaim).returning();
    return claim;
  }

  async updateClaimRequest(id: string, updateData: Partial<InsertClaimRequest> & { reviewedAt?: Date }): Promise<ClaimRequest | undefined> {
    const [claim] = await db
      .update(claimRequests)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(claimRequests.id, id))
      .returning();
    return claim || undefined;
  }

  // Password Reset Tokens
  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(insertToken).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  // Activity Log
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLog).values(insertLog).returning();
    return log;
  }

  async getActivityLogByEntity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(and(
        eq(activityLog.entityType, entityType),
        eq(activityLog.entityId, entityId)
      ))
      .orderBy(desc(activityLog.createdAt));
  }

  async getRecentActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  // Facilities by Owner
  async getFacilitiesByOwner(ownerId: string): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .where(eq(facilities.ownerId, ownerId))
      .orderBy(facilities.name);
  }

  // Extended Stats for Claims
  async getClaimStats(): Promise<{
    pendingClaims: number;
    approvedClaims: number;
    claimedFacilities: number;
    unclaimedFacilities: number;
  }> {
    const [pendingClaimsResult] = await db
      .select({ count: count() })
      .from(claimRequests)
      .where(or(
        eq(claimRequests.status, "pending"),
        eq(claimRequests.status, "verified")
      ));
    
    const [approvedClaimsResult] = await db
      .select({ count: count() })
      .from(claimRequests)
      .where(eq(claimRequests.status, "approved"));
    
    const [claimedFacilitiesResult] = await db
      .select({ count: count() })
      .from(facilities)
      .where(eq(facilities.claimStatus, "claimed"));
    
    const [unclaimedFacilitiesResult] = await db
      .select({ count: count() })
      .from(facilities)
      .where(eq(facilities.claimStatus, "unclaimed"));

    return {
      pendingClaims: pendingClaimsResult?.count || 0,
      approvedClaims: approvedClaimsResult?.count || 0,
      claimedFacilities: claimedFacilitiesResult?.count || 0,
      unclaimedFacilities: unclaimedFacilitiesResult?.count || 0,
    };
  }

  // DSHS Sync Methods
  async getDshsSyncLogs(limit: number = 10): Promise<DshsSyncLog[]> {
    return await db
      .select()
      .from(dshsSyncLogs)
      .orderBy(desc(dshsSyncLogs.createdAt))
      .limit(limit);
  }

  async getFacilityCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(facilities);
    return result?.count || 0;
  }

  async getSyncedHomesCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(dshsHomeSync)
      .where(eq(dshsHomeSync.syncStatus, 'synced'));
    return result?.count || 0;
  }

  // Transport Providers
  async getTransportProvider(id: string): Promise<TransportProvider | undefined> {
    const [provider] = await db.select().from(transportProviders).where(eq(transportProviders.id, id));
    return provider || undefined;
  }

  async getTransportProviderBySlug(slug: string): Promise<TransportProvider | undefined> {
    const [provider] = await db.select().from(transportProviders).where(eq(transportProviders.slug, slug));
    return provider || undefined;
  }

  async getActiveTransportProviders(filters?: {
    county?: string;
    vehicleType?: string;
    acceptsMedicaid?: boolean;
  }): Promise<TransportProvider[]> {
    const conditions = [eq(transportProviders.status, 'active')];
    
    if (filters?.acceptsMedicaid) {
      conditions.push(eq(transportProviders.acceptsMedicaid, true));
    }
    
    let results = await db
      .select()
      .from(transportProviders)
      .where(and(...conditions))
      .orderBy(desc(transportProviders.isFeatured), transportProviders.displayOrder, desc(transportProviders.rating));
    
    if (filters?.county) {
      results = results.filter(p => {
        const counties = p.serviceCounties as string[] || [];
        return counties.some(c => c.toLowerCase() === filters.county!.toLowerCase());
      });
    }
    
    if (filters?.vehicleType) {
      results = results.filter(p => {
        const types = p.vehicleTypes as string[] || [];
        return types.includes(filters.vehicleType!);
      });
    }
    
    return results;
  }

  async getAllTransportProviders(): Promise<TransportProvider[]> {
    return await db
      .select()
      .from(transportProviders)
      .orderBy(transportProviders.displayOrder, transportProviders.name);
  }

  async createTransportProvider(provider: InsertTransportProvider): Promise<TransportProvider> {
    const [newProvider] = await db.insert(transportProviders).values(provider as any).returning();
    return newProvider;
  }

  async updateTransportProvider(id: string, data: Partial<InsertTransportProvider>): Promise<TransportProvider | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db
      .update(transportProviders)
      .set(updateData as any)
      .where(eq(transportProviders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTransportProvider(id: string): Promise<void> {
    await db.delete(transportProviders).where(eq(transportProviders.id, id));
  }

  // Transport Bookings
  async getTransportBooking(id: string): Promise<TransportBooking | undefined> {
    const [booking] = await db.select().from(transportBookings).where(eq(transportBookings.id, id));
    return booking || undefined;
  }

  async getTransportBookingsByOwner(ownerId: string): Promise<TransportBooking[]> {
    return await db
      .select()
      .from(transportBookings)
      .where(eq(transportBookings.ownerId, ownerId))
      .orderBy(desc(transportBookings.createdAt));
  }

  async getTransportBookingsByProvider(providerId: string): Promise<TransportBooking[]> {
    return await db
      .select()
      .from(transportBookings)
      .where(eq(transportBookings.providerId, providerId))
      .orderBy(desc(transportBookings.createdAt));
  }

  async getAllTransportBookings(filters?: { status?: string }): Promise<TransportBooking[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(transportBookings.status, filters.status));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(transportBookings).orderBy(desc(transportBookings.createdAt));
    }
    
    return await db
      .select()
      .from(transportBookings)
      .where(and(...conditions))
      .orderBy(desc(transportBookings.createdAt));
  }

  async createTransportBooking(booking: InsertTransportBooking): Promise<TransportBooking> {
    const [newBooking] = await db.insert(transportBookings).values(booking).returning();
    return newBooking;
  }

  async updateTransportBooking(id: string, data: Partial<TransportBooking>): Promise<TransportBooking | undefined> {
    const [updated] = await db
      .update(transportBookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transportBookings.id, id))
      .returning();
    return updated || undefined;
  }

  // Provider Reviews
  async getProviderReview(id: string): Promise<ProviderReview | undefined> {
    const [review] = await db.select().from(providerReviews).where(eq(providerReviews.id, id));
    return review || undefined;
  }

  async getProviderReviewsByProvider(providerId: string, status?: string): Promise<ProviderReview[]> {
    const conditions = [eq(providerReviews.providerId, providerId)];
    if (status) {
      conditions.push(eq(providerReviews.status, status));
    }
    
    return await db
      .select()
      .from(providerReviews)
      .where(and(...conditions))
      .orderBy(desc(providerReviews.createdAt));
  }

  async getProviderReviewsByOwner(ownerId: string): Promise<ProviderReview[]> {
    return await db
      .select()
      .from(providerReviews)
      .where(eq(providerReviews.ownerId, ownerId))
      .orderBy(desc(providerReviews.createdAt));
  }

  async getAllProviderReviews(status?: string): Promise<ProviderReview[]> {
    if (status) {
      return await db
        .select()
        .from(providerReviews)
        .where(eq(providerReviews.status, status))
        .orderBy(desc(providerReviews.createdAt));
    }
    return await db.select().from(providerReviews).orderBy(desc(providerReviews.createdAt));
  }

  async createProviderReview(review: InsertProviderReview): Promise<ProviderReview> {
    const [newReview] = await db.insert(providerReviews).values(review).returning();
    
    // Update provider's review count and rating
    const allReviews = await this.getProviderReviewsByProvider(review.providerId, 'approved');
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '0';
    
    await db
      .update(transportProviders)
      .set({ 
        reviewCount: allReviews.length,
        rating: avgRating
      })
      .where(eq(transportProviders.id, review.providerId));
    
    return newReview;
  }

  async updateProviderReview(id: string, data: Partial<ProviderReview>): Promise<ProviderReview | undefined> {
    const [updated] = await db
      .update(providerReviews)
      .set(data)
      .where(eq(providerReviews.id, id))
      .returning();
    
    // Recalculate provider rating if review was approved
    if (updated && data.status === 'approved') {
      const allReviews = await this.getProviderReviewsByProvider(updated.providerId, 'approved');
      const avgRating = allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : '0';
      
      await db
        .update(transportProviders)
        .set({ 
          reviewCount: allReviews.length,
          rating: avgRating
        })
        .where(eq(transportProviders.id, updated.providerId));
    }
    
    return updated || undefined;
  }

  // Owner Saved Providers
  async getSavedProvidersByOwner(ownerId: string): Promise<(OwnerSavedProvider & { provider: TransportProvider })[]> {
    const saved = await db
      .select()
      .from(ownerSavedProviders)
      .where(eq(ownerSavedProviders.ownerId, ownerId))
      .orderBy(desc(ownerSavedProviders.createdAt));
    
    const results: (OwnerSavedProvider & { provider: TransportProvider })[] = [];
    for (const s of saved) {
      const provider = await this.getTransportProvider(s.providerId);
      if (provider) {
        results.push({ ...s, provider });
      }
    }
    return results;
  }

  async saveProvider(ownerId: string, providerId: string, notes?: string): Promise<OwnerSavedProvider> {
    const [saved] = await db
      .insert(ownerSavedProviders)
      .values({ ownerId, providerId, notes })
      .onConflictDoNothing()
      .returning();
    
    if (!saved) {
      const [existing] = await db
        .select()
        .from(ownerSavedProviders)
        .where(and(
          eq(ownerSavedProviders.ownerId, ownerId),
          eq(ownerSavedProviders.providerId, providerId)
        ));
      return existing;
    }
    return saved;
  }

  async unsaveProvider(ownerId: string, providerId: string): Promise<void> {
    await db
      .delete(ownerSavedProviders)
      .where(and(
        eq(ownerSavedProviders.ownerId, ownerId),
        eq(ownerSavedProviders.providerId, providerId)
      ));
  }

  async isProviderSaved(ownerId: string, providerId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(ownerSavedProviders)
      .where(and(
        eq(ownerSavedProviders.ownerId, ownerId),
        eq(ownerSavedProviders.providerId, providerId)
      ));
    return !!result;
  }

  async updateSavedProviderNotes(ownerId: string, providerId: string, notes: string): Promise<OwnerSavedProvider | undefined> {
    const [updated] = await db
      .update(ownerSavedProviders)
      .set({ notes })
      .where(and(
        eq(ownerSavedProviders.ownerId, ownerId),
        eq(ownerSavedProviders.providerId, providerId)
      ))
      .returning();
    return updated || undefined;
  }

  // DSHS Inspections
  async getInspectionsByFacility(facilityId: string): Promise<DshsInspection[]> {
    return await db.select().from(dshsInspections)
      .where(eq(dshsInspections.facilityId, facilityId))
      .orderBy(desc(dshsInspections.inspectionDate));
  }

  async createInspection(inspection: InsertDshsInspection): Promise<DshsInspection> {
    const [result] = await db.insert(dshsInspections).values(inspection).returning();
    return result;
  }

  async deleteInspectionsByFacility(facilityId: string): Promise<void> {
    await db.delete(dshsInspections).where(eq(dshsInspections.facilityId, facilityId));
  }

  // ============================================================================
  // EHR STORAGE IMPLEMENTATIONS
  // ============================================================================

  // Staff Auth
  async getStaffAuth(id: string): Promise<StaffAuth | undefined> {
    const [staff] = await db.select().from(staffAuth).where(eq(staffAuth.id, id));
    return staff || undefined;
  }

  async getStaffAuthByEmail(email: string): Promise<StaffAuth | undefined> {
    const [staff] = await db.select().from(staffAuth).where(eq(staffAuth.email, email));
    return staff || undefined;
  }

  async getStaffAuthByInviteToken(token: string): Promise<StaffAuth | undefined> {
    const [staff] = await db.select().from(staffAuth).where(eq(staffAuth.inviteToken, token));
    return staff || undefined;
  }

  async getStaffAuthByFacility(facilityId: string): Promise<StaffAuth[]> {
    return await db
      .select()
      .from(staffAuth)
      .where(eq(staffAuth.facilityId, facilityId))
      .orderBy(staffAuth.lastName, staffAuth.firstName);
  }

  async getStaffAuthByLinkedOwner(ownerId: string, facilityId: string): Promise<StaffAuth | undefined> {
    const [staff] = await db
      .select()
      .from(staffAuth)
      .where(and(eq(staffAuth.linkedOwnerId, ownerId), eq(staffAuth.facilityId, facilityId)));
    return staff || undefined;
  }

  async createStaffAuth(staff: InsertStaffAuth): Promise<StaffAuth> {
    const [newStaff] = await db.insert(staffAuth).values(staff).returning();
    return newStaff;
  }

  async updateStaffAuth(id: string, data: Partial<InsertStaffAuth> & { lastLoginAt?: Date }): Promise<StaffAuth | undefined> {
    const [updated] = await db
      .update(staffAuth)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(staffAuth.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStaffAuth(id: string): Promise<void> {
    await db.delete(staffAuth).where(eq(staffAuth.id, id));
  }

  // Residents
  async getResident(id: string): Promise<Resident | undefined> {
    const [resident] = await db.select().from(residents).where(eq(residents.id, id));
    return resident || undefined;
  }

  async getResidentsByFacility(facilityId: string, status?: string): Promise<Resident[]> {
    const conditions = [eq(residents.facilityId, facilityId)];
    if (status) {
      conditions.push(eq(residents.status, status));
    }
    return await db
      .select()
      .from(residents)
      .where(and(...conditions))
      .orderBy(residents.lastName, residents.firstName);
  }

  async createResident(resident: InsertResident): Promise<Resident> {
    const [newResident] = await db.insert(residents).values(resident as any).returning();
    return newResident;
  }

  async updateResident(id: string, data: Partial<InsertResident>): Promise<Resident | undefined> {
    const [updated] = await db
      .update(residents)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(residents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteResident(id: string): Promise<void> {
    await db.delete(residents).where(eq(residents.id, id));
  }

  // Medications
  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication || undefined;
  }

  async getMedicationsByResident(residentId: string, activeOnly?: boolean): Promise<Medication[]> {
    const conditions = [eq(medications.residentId, residentId)];
    if (activeOnly) {
      conditions.push(eq(medications.status, 'active'));
    }
    return await db
      .select()
      .from(medications)
      .where(and(...conditions))
      .orderBy(medications.name);
  }

  async getMedicationsByFacility(facilityId: string): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.facilityId, facilityId))
      .orderBy(medications.name);
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db.insert(medications).values(medication as any).returning();
    return newMedication;
  }

  async updateMedication(id: string, data: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updated] = await db
      .update(medications)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(medications.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMedication(id: string): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  // Medication Logs (MAR)
  async getMedicationLog(id: string): Promise<MedicationLog | undefined> {
    const [log] = await db.select().from(medicationLogs).where(eq(medicationLogs.id, id));
    return log || undefined;
  }

  async getMedicationLogsByResident(residentId: string, startDate?: Date, endDate?: Date): Promise<MedicationLog[]> {
    const conditions = [eq(medicationLogs.residentId, residentId)];
    if (startDate) {
      conditions.push(gte(medicationLogs.scheduledTime, startDate));
    }
    if (endDate) {
      conditions.push(lt(medicationLogs.scheduledTime, endDate));
    }
    return await db
      .select()
      .from(medicationLogs)
      .where(and(...conditions))
      .orderBy(desc(medicationLogs.scheduledTime));
  }

  async getMedicationLogsByFacility(facilityId: string, date: string): Promise<MedicationLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(medicationLogs)
      .where(and(
        eq(medicationLogs.facilityId, facilityId),
        gte(medicationLogs.scheduledTime, startOfDay),
        lt(medicationLogs.scheduledTime, endOfDay)
      ))
      .orderBy(medicationLogs.scheduledTime);
  }

  async createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog> {
    const [newLog] = await db.insert(medicationLogs).values(log).returning();
    return newLog;
  }

  async updateMedicationLog(id: string, data: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined> {
    const [updated] = await db
      .update(medicationLogs)
      .set(data)
      .where(eq(medicationLogs.id, id))
      .returning();
    return updated || undefined;
  }

  // Daily Notes
  async getDailyNote(id: string): Promise<DailyNote | undefined> {
    const [note] = await db.select().from(dailyNotes).where(eq(dailyNotes.id, id));
    return note || undefined;
  }

  async getDailyNotesByResident(residentId: string, limit: number = 30): Promise<DailyNote[]> {
    return await db
      .select()
      .from(dailyNotes)
      .where(eq(dailyNotes.residentId, residentId))
      .orderBy(desc(dailyNotes.date))
      .limit(limit);
  }

  async getDailyNotesByFacility(facilityId: string, date: string): Promise<DailyNote[]> {
    return await db
      .select()
      .from(dailyNotes)
      .where(and(
        eq(dailyNotes.facilityId, facilityId),
        eq(dailyNotes.date, date)
      ))
      .orderBy(dailyNotes.shift);
  }

  async createDailyNote(note: InsertDailyNote): Promise<DailyNote> {
    const [newNote] = await db.insert(dailyNotes).values(note as any).returning();
    return newNote;
  }

  async updateDailyNote(id: string, data: Partial<InsertDailyNote>): Promise<DailyNote | undefined> {
    const [updated] = await db
      .update(dailyNotes)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(dailyNotes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDailyNote(id: string): Promise<void> {
    await db.delete(dailyNotes).where(eq(dailyNotes.id, id));
  }

  // Incident Reports
  async getIncidentReport(id: string): Promise<IncidentReport | undefined> {
    const [report] = await db.select().from(incidentReports).where(eq(incidentReports.id, id));
    return report || undefined;
  }

  async getIncidentReportsByFacility(facilityId: string, filters?: { status?: string; dshsReportable?: boolean }): Promise<IncidentReport[]> {
    const conditions = [eq(incidentReports.facilityId, facilityId)];
    if (filters?.status) {
      conditions.push(eq(incidentReports.status, filters.status));
    }
    if (filters?.dshsReportable !== undefined) {
      conditions.push(eq(incidentReports.dshsReportable, filters.dshsReportable));
    }
    return await db
      .select()
      .from(incidentReports)
      .where(and(...conditions))
      .orderBy(desc(incidentReports.incidentDate));
  }

  async getIncidentReportsByResident(residentId: string): Promise<IncidentReport[]> {
    return await db
      .select()
      .from(incidentReports)
      .where(eq(incidentReports.residentId, residentId))
      .orderBy(desc(incidentReports.incidentDate));
  }

  async createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport> {
    const [newReport] = await db.insert(incidentReports).values(report as any).returning();
    return newReport;
  }

  async updateIncidentReport(id: string, data: Partial<InsertIncidentReport>): Promise<IncidentReport | undefined> {
    const [updated] = await db
      .update(incidentReports)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(incidentReports.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteIncidentReport(id: string): Promise<void> {
    await db.delete(incidentReports).where(eq(incidentReports.id, id));
  }

  // EHR Dashboard & Advanced Features
  async getEhrDashboardStats(facilityId: string): Promise<{
    activeResidents: number;
    totalMedications: number;
    pendingMedications: number;
    openIncidents: number;
    dshsReportableIncidents: number;
    todayNotes: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    const [activeResidentsResult] = await db
      .select({ count: count() })
      .from(residents)
      .where(and(eq(residents.facilityId, facilityId), eq(residents.status, "active")));

    const [totalMedicationsResult] = await db
      .select({ count: count() })
      .from(medications)
      .where(and(eq(medications.facilityId, facilityId), eq(medications.status, "active")));

    // Get pending medications (scheduled for today, not yet administered)
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [pendingMedicationsResult] = await db
      .select({ count: count() })
      .from(medicationLogs)
      .where(and(
        eq(medicationLogs.facilityId, facilityId),
        eq(medicationLogs.status, "pending"),
        gte(medicationLogs.scheduledTime, startOfDay),
        lt(medicationLogs.scheduledTime, endOfDay)
      ));

    const [openIncidentsResult] = await db
      .select({ count: count() })
      .from(incidentReports)
      .where(and(eq(incidentReports.facilityId, facilityId), eq(incidentReports.status, "open")));

    const [dshsReportableResult] = await db
      .select({ count: count() })
      .from(incidentReports)
      .where(and(
        eq(incidentReports.facilityId, facilityId),
        eq(incidentReports.dshsReportable, true),
        eq(incidentReports.status, "open")
      ));

    const [todayNotesResult] = await db
      .select({ count: count() })
      .from(dailyNotes)
      .where(and(eq(dailyNotes.facilityId, facilityId), eq(dailyNotes.date, today)));

    return {
      activeResidents: activeResidentsResult?.count || 0,
      totalMedications: totalMedicationsResult?.count || 0,
      pendingMedications: pendingMedicationsResult?.count || 0,
      openIncidents: openIncidentsResult?.count || 0,
      dshsReportableIncidents: dshsReportableResult?.count || 0,
      todayNotes: todayNotesResult?.count || 0,
    };
  }

  async getResidentSummary(residentId: string): Promise<{
    resident: Resident;
    activeMedications: Medication[];
    recentNotes: DailyNote[];
    recentIncidents: IncidentReport[];
    recentMar: MedicationLog[];
  } | undefined> {
    const resident = await this.getResident(residentId);
    if (!resident) return undefined;

    const activeMedications = await this.getMedicationsByResident(residentId, true);
    const recentNotes = await this.getDailyNotesByResident(residentId, 7);
    const recentIncidents = await this.getIncidentReportsByResident(residentId);

    // Get last 7 days of MAR
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMar = await this.getMedicationLogsByResident(residentId, sevenDaysAgo, new Date());

    return {
      resident,
      activeMedications,
      recentNotes,
      recentIncidents: recentIncidents.slice(0, 10), // Limit to 10 most recent
      recentMar,
    };
  }
}

export const storage = new DatabaseStorage();
