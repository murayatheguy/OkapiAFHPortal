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

// Facility type enum for different care facility types
export const facilityTypeEnum = {
  AFH: 'afh',
  ALF: 'alf',
  SNF: 'snf',
  HOSPICE: 'hospice'
} as const;

export type FacilityType = typeof facilityTypeEnum[keyof typeof facilityTypeEnum];

export const facilityTypeLabels: Record<FacilityType, { full: string; short: string; description: string }> = {
  afh: { full: 'Adult Family Home', short: 'AFH', description: 'Small residential homes, 2-6 beds' },
  alf: { full: 'Assisted Living Facility', short: 'Assisted Living', description: 'Larger facilities, 20-100+ beds' },
  snf: { full: 'Skilled Nursing Facility', short: 'Skilled Nursing', description: 'Medical care and rehabilitation' },
  hospice: { full: 'Hospice Care', short: 'Hospice', description: 'End of life care' },
};

// Facilities table (Care Facilities)
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  facilityType: text("facility_type").notNull().default('afh'), // afh, alf, snf, hospice
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
  isDemo: boolean("is_demo").default(false), // Mark fictional/demo facilities
  
  // Google Places Data
  googlePlaceId: text("google_place_id"),
  googleRating: decimal("google_rating", { precision: 2, scale: 1 }),
  googleReviewCount: integer("google_review_count"),
  googlePhotos: json("google_photos").$type<string[]>().default([]),
  googleSyncedAt: timestamp("google_synced_at"),
  
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
  facilityTypeIdx: index("facilities_facility_type_idx").on(table.facilityType),
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

// Transport Providers table - NEMT marketplace providers
export const transportProviders = pgTable("transport_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  
  // Contact
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  
  // Branding
  logoUrl: text("logo_url"),
  description: text("description"),
  
  // Service details (JSONB arrays)
  serviceCounties: json("service_counties").$type<string[]>().default([]),
  vehicleTypes: json("vehicle_types").$type<string[]>().default([]),
  services: json("services").$type<string[]>().default([]),
  
  // Hours
  operatingHours: text("operating_hours"),
  
  // Payment options
  acceptsMedicaid: boolean("accepts_medicaid").default(false),
  acceptsMedicare: boolean("accepts_medicare").default(false),
  acceptsPrivatePay: boolean("accepts_private_pay").default(true),
  acceptsInsurance: boolean("accepts_insurance").default(false),
  acceptedInsuranceList: text("accepted_insurance_list"),
  
  // Pricing
  baseRateCents: integer("base_rate_cents"),
  pricePerMileCents: integer("price_per_mile_cents"),
  pricingNotes: text("pricing_notes"),
  
  // Ratings & Stats
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  totalBookings: integer("total_bookings").default(0),
  onTimePercentage: integer("on_time_percentage"),
  
  // Verification
  isVerified: boolean("is_verified").default(false),
  licenseNumber: text("license_number"),
  insuranceVerified: boolean("insurance_verified").default(false),
  
  // Status & Display
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").default(100),
  status: text("status").notNull().default("active"), // active, pending, suspended, inactive
  
  // Provider self-management (future)
  providerUserId: varchar("provider_user_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("transport_providers_status_idx").on(table.status),
  featuredIdx: index("transport_providers_featured_idx").on(table.isFeatured),
  slugIdx: index("transport_providers_slug_idx").on(table.slug),
}));

export const insertTransportProviderSchema = createInsertSchema(transportProviders).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export type InsertTransportProvider = z.infer<typeof insertTransportProviderSchema>;
export type TransportProvider = typeof transportProviders.$inferSelect;

// Transport Bookings table
export const transportBookings = pgTable("transport_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingNumber: text("booking_number").notNull().unique(),
  
  // Who's booking
  ownerId: varchar("owner_id").references(() => owners.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "set null" }),
  providerId: varchar("provider_id").references(() => transportProviders.id, { onDelete: "set null" }),
  
  // Resident info
  residentInitials: text("resident_initials"),
  residentMobility: text("resident_mobility"), // wheelchair, gurney, ambulatory, bariatric
  specialNeeds: text("special_needs"),
  
  // Trip details
  tripType: text("trip_type"), // one_way, round_trip, wait_and_return
  
  // Pickup
  pickupDate: date("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  pickupAddress: text("pickup_address"),
  pickupCity: text("pickup_city"),
  pickupZip: text("pickup_zip"),
  pickupNotes: text("pickup_notes"),
  
  // Dropoff
  dropoffLocation: text("dropoff_location").notNull(),
  dropoffAddress: text("dropoff_address"),
  dropoffCity: text("dropoff_city"),
  dropoffZip: text("dropoff_zip"),
  dropoffNotes: text("dropoff_notes"),
  
  // Return (if round trip)
  returnDate: date("return_date"),
  returnTime: text("return_time"),
  returnPickupTimeFlexible: boolean("return_pickup_time_flexible").default(false),
  returnNotes: text("return_notes"),
  
  // Appointment info
  appointmentTime: text("appointment_time"),
  appointmentType: text("appointment_type"),
  
  // Payment
  paymentMethod: text("payment_method"),
  medicaidId: text("medicaid_id"),
  insuranceInfo: text("insurance_info"),
  quotedPriceCents: integer("quoted_price_cents"),
  finalPriceCents: integer("final_price_cents"),
  
  // Status tracking
  status: text("status").notNull().default("pending"),
  // pending, confirmed, dispatched, picked_up, in_transit, dropped_off, 
  // return_pending, completed, cancelled, no_show
  
  // Provider response
  providerConfirmation: text("provider_confirmation"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  vehicleInfo: text("vehicle_info"),
  estimatedArrival: text("estimated_arrival"),
  
  // Timestamps
  confirmedAt: timestamp("confirmed_at"),
  pickedUpAt: timestamp("picked_up_at"),
  droppedOffAt: timestamp("dropped_off_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  cancelledBy: text("cancelled_by"), // owner, provider, admin
  
  // Notes
  ownerNotes: text("owner_notes"),
  providerNotes: text("provider_notes"),
  adminNotes: text("admin_notes"),
  
  // Review prompt
  reviewRequested: boolean("review_requested").default(false),
  reviewId: varchar("review_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("transport_bookings_owner_idx").on(table.ownerId),
  providerIdx: index("transport_bookings_provider_idx").on(table.providerId),
  statusIdx: index("transport_bookings_status_idx").on(table.status),
  dateIdx: index("transport_bookings_date_idx").on(table.pickupDate),
}));

export const insertTransportBookingSchema = createInsertSchema(transportBookings).omit({ 
  id: true, createdAt: true, updatedAt: true, confirmedAt: true, pickedUpAt: true,
  droppedOffAt: true, completedAt: true, cancelledAt: true
});
export type InsertTransportBooking = z.infer<typeof insertTransportBookingSchema>;
export type TransportBooking = typeof transportBookings.$inferSelect;

// Provider Reviews table
export const providerReviews = pgTable("provider_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => transportProviders.id, { onDelete: "cascade" }).notNull(),
  ownerId: varchar("owner_id").references(() => owners.id, { onDelete: "set null" }),
  bookingId: varchar("booking_id").references(() => transportBookings.id, { onDelete: "set null" }),
  
  rating: integer("rating").notNull(),
  title: text("title"),
  reviewText: text("review_text"),
  
  // Specific ratings
  punctualityRating: integer("punctuality_rating"),
  driverRating: integer("driver_rating"),
  vehicleRating: integer("vehicle_rating"),
  
  // Moderation
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  
  // Provider response
  providerResponse: text("provider_response"),
  providerRespondedAt: timestamp("provider_responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  providerIdx: index("provider_reviews_provider_idx").on(table.providerId),
  statusIdx: index("provider_reviews_status_idx").on(table.status),
}));

export const insertProviderReviewSchema = createInsertSchema(providerReviews).omit({ 
  id: true, createdAt: true, providerRespondedAt: true 
});
export type InsertProviderReview = z.infer<typeof insertProviderReviewSchema>;
export type ProviderReview = typeof providerReviews.$inferSelect;

// Owner Saved Providers table
export const ownerSavedProviders = pgTable("owner_saved_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => owners.id, { onDelete: "cascade" }).notNull(),
  providerId: varchar("provider_id").references(() => transportProviders.id, { onDelete: "cascade" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ownerProviderIdx: index("owner_saved_providers_owner_provider_idx").on(table.ownerId, table.providerId),
}));

export const insertOwnerSavedProviderSchema = createInsertSchema(ownerSavedProviders).omit({ 
  id: true, createdAt: true 
});
export type InsertOwnerSavedProvider = z.infer<typeof insertOwnerSavedProviderSchema>;
export type OwnerSavedProvider = typeof ownerSavedProviders.$inferSelect;

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

// DSHS Inspections table - stores actual inspection records from DSHS
export const dshsInspections = pgTable("dshs_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  
  inspectionDate: date("inspection_date").notNull(),
  inspectionType: text("inspection_type").notNull(), // Routine, Complaint, Follow-up, Initial, Investigation
  violationCount: integer("violation_count").default(0),
  outcomeSummary: text("outcome_summary"), // "No violations", "1 violation cited", etc.
  enforcementActions: text("enforcement_actions"), // null if none
  
  // Compliance determination data from DSHS forms page
  complianceNumbers: text("compliance_numbers").array().default(sql`ARRAY[]::text[]`), // e.g., ["65016", "66559"]
  documentUrl: text("document_url"), // URL to PDF document
  inspectionYear: integer("inspection_year"), // Year of the inspection
  
  sourceUrl: text("source_url"), // Original DSHS URL
  scrapedAt: timestamp("scraped_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("dshs_inspections_facility_idx").on(table.facilityId),
  dateIdx: index("dshs_inspections_date_idx").on(table.inspectionDate),
}));

export const insertDshsInspectionSchema = createInsertSchema(dshsInspections).omit({ id: true, createdAt: true, scrapedAt: true });
export type InsertDshsInspection = z.infer<typeof insertDshsInspectionSchema>;
export type DshsInspection = typeof dshsInspections.$inferSelect;

// DSHS Inspections Relations
export const dshsInspectionsRelations = relations(dshsInspections, ({ one }) => ({
  facility: one(facilities, {
    fields: [dshsInspections.facilityId],
    references: [facilities.id],
  }),
}));

// DSHS Sync Logs table - tracks sync operations
export const dshsSyncLogs = pgTable("dshs_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // full, incremental, single
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("running"), // running, success, failed
  homesChecked: integer("homes_checked").default(0),
  homesAdded: integer("homes_added").default(0),
  homesUpdated: integer("homes_updated").default(0),
  inspectionsAdded: integer("inspections_added").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDshsSyncLogSchema = createInsertSchema(dshsSyncLogs).omit({ id: true, createdAt: true });
export type InsertDshsSyncLog = z.infer<typeof insertDshsSyncLogSchema>;
export type DshsSyncLog = typeof dshsSyncLogs.$inferSelect;

// DSHS Home Sync table - tracks individual home sync status
export const dshsHomeSync = pgTable("dshs_home_sync", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number").notNull().unique(),
  lastSyncedAt: timestamp("last_synced_at"),
  lastDataHash: text("last_data_hash"),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  licenseIdx: index("dshs_home_sync_license_idx").on(table.licenseNumber),
  facilityIdx: index("dshs_home_sync_facility_idx").on(table.facilityId),
}));

export const insertDshsHomeSyncSchema = createInsertSchema(dshsHomeSync).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDshsHomeSync = z.infer<typeof insertDshsHomeSyncSchema>;
export type DshsHomeSync = typeof dshsHomeSync.$inferSelect;

// DSHS Home Sync Relations
export const dshsHomeSyncRelations = relations(dshsHomeSync, ({ one }) => ({
  facility: one(facilities, {
    fields: [dshsHomeSync.facilityId],
    references: [facilities.id],
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

// Transport marketplace relations
export const transportProvidersRelations = relations(transportProviders, ({ many }) => ({
  bookings: many(transportBookings),
  reviews: many(providerReviews),
  savedBy: many(ownerSavedProviders),
}));

export const transportBookingsRelations = relations(transportBookings, ({ one }) => ({
  owner: one(owners, {
    fields: [transportBookings.ownerId],
    references: [owners.id],
  }),
  facility: one(facilities, {
    fields: [transportBookings.facilityId],
    references: [facilities.id],
  }),
  provider: one(transportProviders, {
    fields: [transportBookings.providerId],
    references: [transportProviders.id],
  }),
}));

export const providerReviewsRelations = relations(providerReviews, ({ one }) => ({
  provider: one(transportProviders, {
    fields: [providerReviews.providerId],
    references: [transportProviders.id],
  }),
  owner: one(owners, {
    fields: [providerReviews.ownerId],
    references: [owners.id],
  }),
  booking: one(transportBookings, {
    fields: [providerReviews.bookingId],
    references: [transportBookings.id],
  }),
}));

export const ownerSavedProvidersRelations = relations(ownerSavedProviders, ({ one }) => ({
  owner: one(owners, {
    fields: [ownerSavedProviders.ownerId],
    references: [owners.id],
  }),
  provider: one(transportProviders, {
    fields: [ownerSavedProviders.providerId],
    references: [transportProviders.id],
  }),
}));
