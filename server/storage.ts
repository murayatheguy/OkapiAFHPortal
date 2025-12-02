import { 
  users, 
  facilities, 
  teamMembers, 
  credentials,
  inquiries,
  admins,
  reviews,
  owners,
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
  type InsertOwner
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, sql, inArray, desc, count, gte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Facilities
  getFacility(id: string): Promise<Facility | undefined>;
  getFacilityWithTeam(id: string): Promise<{ facility: Facility; team: Array<TeamMember & { credentials: Credential[] }> } | undefined>;
  searchFacilities(params: {
    city?: string;
    county?: string;
    specialties?: string[];
    acceptsMedicaid?: boolean;
    availableBeds?: boolean;
  }): Promise<Facility[]>;
  getAllFacilities(): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: string, facility: Partial<InsertFacility>): Promise<Facility | undefined>;

  // Team Members
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  getTeamMembersByFacility(facilityId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<void>;

  // Credentials
  getCredential(id: string): Promise<Credential | undefined>;
  getCredentialsByTeamMember(teamMemberId: string): Promise<Credential[]>;
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
  updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | undefined>;

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

  async getFacilityWithTeam(id: string): Promise<{ facility: Facility; team: Array<TeamMember & { credentials: Credential[] }> } | undefined> {
    const facility = await this.getFacility(id);
    if (!facility) return undefined;

    const team = await this.getTeamMembersByFacility(id);
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
    const [facility] = await db.insert(facilities).values(insertFacility).returning();
    return facility;
  }

  async updateFacility(id: string, updateData: Partial<InsertFacility>): Promise<Facility | undefined> {
    const [facility] = await db
      .update(facilities)
      .set(updateData)
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

  async updateOwner(id: string, updateData: Partial<InsertOwner>): Promise<Owner | undefined> {
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
}

export const storage = new DatabaseStorage();
