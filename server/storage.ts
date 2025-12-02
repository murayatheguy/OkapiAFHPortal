import { 
  users, 
  facilities, 
  teamMembers, 
  credentials,
  inquiries,
  type User, 
  type InsertUser,
  type Facility,
  type InsertFacility,
  type TeamMember,
  type InsertTeamMember,
  type Credential,
  type InsertCredential,
  type Inquiry,
  type InsertInquiry
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, sql, inArray, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
