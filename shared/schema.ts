import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication (facility owners)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  facilityId: varchar("facility_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Facilities table (Adult Family Homes)
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county").notNull(),
  phone: text("phone"),
  email: text("email"),
  capacity: integer("capacity").notNull(),
  availableBeds: integer("available_beds").notNull(),
  
  // DSHS Compliance Data
  licenseNumber: text("license_number").notNull(),
  licenseStatus: text("license_status").notNull(), // Active, Provisional, Suspended
  lastInspectionDate: date("last_inspection_date"),
  violationsCount: integer("violations_count").default(0),
  
  // Features & Specialties
  acceptsMedicaid: boolean("accepts_medicaid").default(false),
  acceptsPrivatePay: boolean("accepts_private_pay").default(false),
  specialties: text("specialties").array().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  
  // Media
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  description: text("description"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true });
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

// Team Members table (caregivers and staff)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  
  // Basic Info
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull(), // Owner, Administrator, Caregiver, Manager
  
  // Account Status
  status: text("status").notNull(), // Active, Invited, Inactive
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
  
  // Manual vs Self-Managed
  isManualEntry: boolean("is_manual_entry").default(false),
  userId: varchar("user_id"), // If they have an account
  
  // Avatar
  avatarUrl: text("avatar_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Credentials table (certifications and training)
export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  
  // Credential Info
  name: text("name").notNull(),
  type: text("type").notNull(), // Required, Specialty, Optional
  status: text("status").notNull(), // Current, Expiring Soon, Expired, Pending
  
  // Dates
  issuedDate: date("issued_date"),
  expiryDate: date("expiry_date"),
  
  // Source
  source: text("source").notNull(), // "Okapi Academy" or "External"
  issuer: text("issuer"), // Organization that issued it
  
  // Files
  certificateUrl: text("certificate_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCredentialSchema = createInsertSchema(credentials).omit({ id: true, createdAt: true });
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentials.$inferSelect;

// Relations
export const facilitiesRelations = relations(facilities, ({ many }) => ({
  teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [teamMembers.facilityId],
    references: [facilities.id],
  }),
  credentials: many(credentials),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [credentials.teamMemberId],
    references: [teamMembers.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  facility: one(facilities, {
    fields: [users.facilityId],
    references: [facilities.id],
  }),
}));
