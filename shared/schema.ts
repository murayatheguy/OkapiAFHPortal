import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp, decimal, index, json } from "drizzle-orm/pg-core";
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

// Admins table for admin dashboard
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // super_admin, admin, moderator
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("admins_email_idx").on(table.email),
}));

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Owners table for facility management
export const owners = pgTable("owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("pending_verification"), // pending_verification, active, suspended
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: index("owners_email_idx").on(table.email),
  statusIdx: index("owners_status_idx").on(table.status),
}));

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

// Owner Invites table for magic link invitations
export const ownerInvites = pgTable("owner_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  email: text("email").notNull(),
  inviteToken: text("invite_token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tokenIdx: index("owner_invites_token_idx").on(table.inviteToken),
  statusIdx: index("owner_invites_status_idx").on(table.status),
}));

export const insertOwnerInviteSchema = createInsertSchema(ownerInvites).omit({ id: true, createdAt: true });
export type InsertOwnerInvite = z.infer<typeof insertOwnerInviteSchema>;
export type OwnerInvite = typeof ownerInvites.$inferSelect;

// Claim Requests table for facility ownership claims
export const claimRequests = pgTable("claim_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  ownerId: varchar("owner_id"), // Set when claim is approved
  
  // Requester Info
  requesterEmail: text("requester_email").notNull(),
  requesterName: text("requester_name").notNull(),
  requesterPhone: text("requester_phone"),
  relationship: text("relationship"), // owner, operator, manager, authorized_rep
  
  // Verification
  verificationMethod: text("verification_method"), // dshs_email_match, dshs_phone_match, document, manual
  verificationDocumentUrl: text("verification_document_url"),
  verificationCode: text("verification_code"),
  verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
  verificationAttempts: integer("verification_attempts").default(0),
  
  // Status & Review
  status: text("status").notNull().default("pending"), // pending, verified, approved, rejected, expired
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by"), // admin ID
  reviewedAt: timestamp("reviewed_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("claim_requests_facility_idx").on(table.facilityId),
  ownerIdx: index("claim_requests_owner_idx").on(table.ownerId),
  statusIdx: index("claim_requests_status_idx").on(table.status),
}));

export const insertClaimRequestSchema = createInsertSchema(claimRequests).omit({ 
  id: true, createdAt: true, updatedAt: true, reviewedAt: true 
});
export type InsertClaimRequest = z.infer<typeof insertClaimRequestSchema>;
export type ClaimRequest = typeof claimRequests.$inferSelect;

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  ownerIdx: index("password_reset_tokens_owner_idx").on(table.ownerId),
}));

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ 
  id: true, createdAt: true, usedAt: true 
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Activity Log table for audit trail
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type"), // home, owner, claim, admin
  entityId: varchar("entity_id"),
  action: text("action").notNull(), // ownership_claimed, ownership_revoked, claim_approved, etc.
  performedByType: text("performed_by_type"), // admin, owner, system
  performedById: varchar("performed_by_id"),
  details: json("details"), // Additional context as JSON
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  entityIdx: index("activity_log_entity_idx").on(table.entityType, table.entityId),
  actionIdx: index("activity_log_action_idx").on(table.action),
  createdIdx: index("activity_log_created_idx").on(table.createdAt),
}));

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// Facilities table (Adult Family Homes)
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default("WA"),
  zipCode: text("zip_code").notNull(),
  county: text("county").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  capacity: integer("capacity").notNull(),
  availableBeds: integer("available_beds").notNull(),
  
  // Pricing
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  
  // Ratings
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  
  // DSHS Compliance Data
  licenseNumber: text("license_number").notNull(),
  licenseStatus: text("license_status").notNull(), // Active, Provisional, Suspended
  lastInspectionDate: date("last_inspection_date"),
  violationsCount: integer("violations_count").default(0),
  dshsReportUrl: text("dshs_report_url"), // Link to DSHS inspection reports
  
  // Features & Specialties
  acceptsMedicaid: boolean("accepts_medicaid").default(false),
  acceptsPrivatePay: boolean("accepts_private_pay").default(false),
  specialties: text("specialties").array().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  careTypes: text("care_types").array().default(sql`ARRAY[]::text[]`),
  certifications: text("certifications").array().default(sql`ARRAY[]::text[]`),
  
  // Media
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  description: text("description"),
  
  // Business Info
  yearEstablished: integer("year_established"),
  ownerId: varchar("owner_id"),
  
  // Claim Status
  claimStatus: text("claim_status").notNull().default("unclaimed"), // unclaimed, pending, claimed
  claimedAt: timestamp("claimed_at"),
  
  // Status
  status: text("status").notNull().default("active"), // active, pending, inactive
  featured: boolean("featured").default(false),
  acceptingInquiries: text("accepting_inquiries").default("accepting"), // accepting, waitlist, not_accepting
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("facilities_slug_idx").on(table.slug),
  cityIdx: index("facilities_city_idx").on(table.city),
  statusIdx: index("facilities_status_idx").on(table.status),
  featuredIdx: index("facilities_featured_idx").on(table.featured),
  ownerIdx: index("facilities_owner_idx").on(table.ownerId),
  claimStatusIdx: index("facilities_claim_status_idx").on(table.claimStatus),
}));

export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

// Inquiries table for family inquiries
export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  
  // Contact Info
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  
  // Care Details
  careType: text("care_type"),
  moveInTimeline: text("move_in_timeline"),
  
  // Status
  status: text("status").notNull().default("new"), // new, contacted, toured, admitted, closed
  ownerNotes: text("owner_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("inquiries_facility_idx").on(table.facilityId),
  statusIdx: index("inquiries_status_idx").on(table.status),
  createdIdx: index("inquiries_created_idx").on(table.createdAt),
}));

export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

// Reviews table for facility reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  
  // Author Info
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  
  // Review Content
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content").notNull(),
  
  // Owner Response
  ownerResponse: text("owner_response"),
  ownerRespondedAt: timestamp("owner_responded_at"),
  
  // Moderation
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("reviews_facility_idx").on(table.facilityId),
  statusIdx: index("reviews_status_idx").on(table.status),
}));

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

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
export const facilitiesRelations = relations(facilities, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  inquiries: many(inquiries),
  reviews: many(reviews),
  owner: one(owners, {
    fields: [facilities.ownerId],
    references: [owners.id],
  }),
}));

export const ownersRelations = relations(owners, ({ many }) => ({
  facilities: many(facilities),
  claimRequests: many(claimRequests),
  passwordResetTokens: many(passwordResetTokens),
}));

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  facility: one(facilities, {
    fields: [claimRequests.facilityId],
    references: [facilities.id],
  }),
  owner: one(owners, {
    fields: [claimRequests.ownerId],
    references: [owners.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  owner: one(owners, {
    fields: [passwordResetTokens.ownerId],
    references: [owners.id],
  }),
}));

export const ownerInvitesRelations = relations(ownerInvites, ({ one }) => ({
  facility: one(facilities, {
    fields: [ownerInvites.facilityId],
    references: [facilities.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  facility: one(facilities, {
    fields: [inquiries.facilityId],
    references: [facilities.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  facility: one(facilities, {
    fields: [reviews.facilityId],
    references: [facilities.id],
  }),
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
