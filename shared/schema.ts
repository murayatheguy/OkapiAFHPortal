import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp, decimal, index, json, jsonb, serial } from "drizzle-orm/pg-core";
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

// Activity Log table for comprehensive audit trail
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Who performed the action
  userId: varchar("user_id"),
  userType: text("user_type"), // 'owner', 'staff', 'admin', 'system'
  userName: text("user_name"),
  performedByType: text("performed_by_type"), // Legacy: admin, owner, system
  performedById: varchar("performed_by_id"), // Legacy

  // What action was performed
  action: text("action").notNull(), // 'create', 'update', 'delete', 'login', 'logout', 'print', 'submit', 'give', 'miss', 'refuse', 'expire', 'renew', 'resolve', 'discharge'
  category: text("category"), // 'auth', 'resident', 'staff', 'medication', 'incident', 'form', 'credential', 'settings', 'transport', 'inquiry', 'facility'
  description: text("description"),

  // Where (which facility)
  facilityId: varchar("facility_id"),

  // What entity was affected
  entityType: text("entity_type"), // 'resident', 'staff', 'medication', 'incident', 'form', 'home', 'owner', 'claim', etc.
  entityId: varchar("entity_id"),
  entityName: text("entity_name"),

  // Additional context
  details: json("details").$type<Record<string, any>>(), // Additional context as JSON (legacy name)
  metadata: json("metadata").$type<Record<string, any>>(), // Additional context (new name)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  entityIdx: index("activity_log_entity_idx").on(table.entityType, table.entityId),
  actionIdx: index("activity_log_action_idx").on(table.action),
  createdIdx: index("activity_log_created_idx").on(table.createdAt),
  facilityIdx: index("activity_log_facility_idx").on(table.facilityId),
  categoryIdx: index("activity_log_category_idx").on(table.category),
  userIdx: index("activity_log_user_idx").on(table.userId),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  facility: one(facilities, {
    fields: [activityLog.facilityId],
    references: [facilities.id],
  }),
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

  // Staff Access
  facilityPin: text("facility_pin"), // 4-digit PIN for staff quick login

  // Listing customization fields
  ownerBio: text("owner_bio"),
  carePhilosophy: text("care_philosophy"),
  dailyRoutine: text("daily_routine"),
  uniqueFeatures: text("unique_features"),
  roomTypes: text("room_types").array(),
  acceptsLTCInsurance: boolean("accepts_ltc_insurance").default(false),
  acceptsVABenefits: boolean("accepts_va_benefits").default(false),

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

// Facility Images table - gallery images for facilities
export const facilityImages = pgTable("facility_images", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("facility_images_facility_idx").on(table.facilityId),
  sortIdx: index("facility_images_sort_idx").on(table.facilityId, table.sortOrder),
}));

export const insertFacilityImageSchema = createInsertSchema(facilityImages).omit({ id: true, createdAt: true });
export type InsertFacilityImage = z.infer<typeof insertFacilityImageSchema>;
export type FacilityImage = typeof facilityImages.$inferSelect;

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
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),

  // Basic Info
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  role: text("role").notNull(), // Owner, Administrator, Caregiver, Manager
  hireDate: date("hire_date"),

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
}, (table) => ({
  facilityIdx: index("team_members_facility_idx").on(table.facilityId),
  statusIdx: index("team_members_status_idx").on(table.status),
}));

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Credentials table (certifications and training)
export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "cascade" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),

  // Credential Info - credentialType is the type of certification
  credentialType: text("credential_type").notNull(), // NAR, NAC, HCA, BBP, CPR, FirstAid, FoodHandler, Dementia, MentalHealth, MedAdmin, TBTest, BackgroundCheck
  credentialNumber: text("credential_number"), // License/cert number
  issuingAuthority: text("issuing_authority"), // WA DOH, American Red Cross, etc

  // Legacy fields for backwards compatibility
  name: text("name"), // Optional display name override
  type: text("type"), // Required, Specialty, Optional (category)
  status: text("status"), // Calculated: Active, Expiring Soon, Expired
  source: text("source"), // "Okapi Academy" or "External"

  // Dates
  issueDate: date("issue_date"),
  expirationDate: date("expiration_date"),

  // Legacy date fields
  issuedDate: date("issued_date"),
  expiryDate: date("expiry_date"),

  // Files
  documentUrl: text("document_url"),
  certificateUrl: text("certificate_url"), // Legacy alias

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teamMemberIdx: index("credentials_team_member_idx").on(table.teamMemberId),
  facilityIdx: index("credentials_facility_idx").on(table.facilityId),
  expirationIdx: index("credentials_expiration_idx").on(table.expirationDate),
}));

export const insertCredentialSchema = createInsertSchema(credentials).omit({ id: true, createdAt: true, updatedAt: true });
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
  images: many(facilityImages),
  owner: one(owners, {
    fields: [facilities.ownerId],
    references: [owners.id],
  }),
}));

export const facilityImagesRelations = relations(facilityImages, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityImages.facilityId],
    references: [facilities.id],
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

// ============================================================================
// EHR SYSTEM TABLES
// ============================================================================

// Staff role enum
export const staffRoleEnum = {
  CAREGIVER: 'caregiver',
  MED_TECH: 'med_tech',
  SHIFT_LEAD: 'shift_lead',
  NURSE: 'nurse',
} as const;

export type StaffRole = typeof staffRoleEnum[keyof typeof staffRoleEnum];

// Staff permissions type
export type StaffPermissions = {
  canAdministerMeds: boolean;
  canAdministerControlled: boolean;
  canFileIncidents: boolean;
  canEditResidents: boolean;
};

// Staff Auth table - login credentials for facility staff
export const staffAuth = pgTable("staff_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  linkedOwnerId: varchar("linked_owner_id").references(() => owners.id, { onDelete: "set null" }),

  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  pin: text("pin"), // Hashed PIN for quick login

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),

  role: text("role").notNull().default("caregiver"),
  permissions: json("permissions").$type<StaffPermissions>(),
  status: text("status").notNull().default("inactive"), // inactive, active, suspended

  inviteToken: text("invite_token").unique(),
  inviteExpiresAt: timestamp("invite_expires_at"),
  lastLoginAt: timestamp("last_login_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("staff_auth_email_idx").on(table.email),
  facilityIdx: index("staff_auth_facility_idx").on(table.facilityId),
  inviteTokenIdx: index("staff_auth_invite_token_idx").on(table.inviteToken),
  linkedOwnerIdx: index("staff_auth_linked_owner_idx").on(table.linkedOwnerId),
}));

export const insertStaffAuthSchema = createInsertSchema(staffAuth).omit({
  id: true, createdAt: true, updatedAt: true, lastLoginAt: true
});
export type InsertStaffAuth = z.infer<typeof insertStaffAuthSchema>;
export type StaffAuth = typeof staffAuth.$inferSelect;

// Residents table - resident profiles
export const residents = pgTable("residents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),

  // Basic Info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name"),
  dateOfBirth: date("date_of_birth").notNull(),
  photo: text("photo"),
  roomNumber: text("room_number"),

  admissionDate: date("admission_date"),
  status: text("status").notNull().default("active"), // active, discharged, deceased, hospital

  // Previous Address
  previousAddress: text("previous_address"),
  previousCity: text("previous_city"),
  previousState: text("previous_state"),
  previousZip: text("previous_zip"),

  // JSON fields for complex data
  primaryPhysician: json("primary_physician").$type<{
    name: string;
    phone?: string;
    fax?: string;
  }>(),
  emergencyContacts: json("emergency_contacts").$type<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean;
  }[]>().default([]),
  diagnoses: json("diagnoses").$type<string[]>().default([]),
  allergies: json("allergies").$type<string[]>().default([]),
  dietaryRestrictions: json("dietary_restrictions").$type<string[]>().default([]),
  codeStatus: text("code_status"), // full_code, dnr, dnr_dni, comfort_care
  insuranceInfo: json("insurance_info").$type<{
    primary?: string;
    primaryId?: string;
    medicaidId?: string;
    groupNumber?: string;
  }>(),
  preferences: json("preferences").$type<Record<string, any>>(),
  notes: text("notes"),

  // Pharmacy
  pharmacyName: text("pharmacy_name"),
  pharmacyPhone: text("pharmacy_phone"),
  pharmacyAddress: text("pharmacy_address"),

  // End of Life Preferences
  funeralHome: text("funeral_home"),
  funeralHomePhone: text("funeral_home_phone"),
  advanceDirectives: boolean("advance_directives").default(false),
  dnrStatus: boolean("dnr_status").default(false),

  // Personal Preferences
  religion: text("religion"),
  culturalNotes: text("cultural_notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("residents_facility_idx").on(table.facilityId),
  statusIdx: index("residents_status_idx").on(table.status),
}));

export const insertResidentSchema = createInsertSchema(residents).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type Resident = typeof residents.$inferSelect;

// Medications table - prescribed medications
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "cascade" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),

  name: text("name").notNull(),
  genericName: text("generic_name"),
  dosage: text("dosage").notNull(), // "10mg", "1 tablet", etc.
  route: text("route").notNull(), // oral, topical, injection, etc.
  frequency: json("frequency").$type<{
    times: string[]; // ["08:00", "20:00"]
    daysOfWeek?: number[]; // [0,1,2,3,4,5,6] for daily, or specific days
    interval?: string; // "daily", "bid", "tid", "weekly"
  }>(),
  instructions: text("instructions"),

  prescribedBy: text("prescribed_by"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),

  isControlled: boolean("is_controlled").default(false),
  isPRN: boolean("is_prn").default(false),
  prnReason: text("prn_reason"),

  status: text("status").notNull().default("active"), // active, discontinued, completed

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  residentIdx: index("medications_resident_idx").on(table.residentId),
  facilityIdx: index("medications_facility_idx").on(table.facilityId),
  statusIdx: index("medications_status_idx").on(table.status),
}));

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Medication Logs table - MAR records
export const medicationLogs = pgTable("medication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: varchar("medication_id").references(() => medications.id, { onDelete: "cascade" }).notNull(),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "cascade" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),

  administeredBy: varchar("administered_by").references(() => staffAuth.id, { onDelete: "set null" }).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  administeredTime: timestamp("administered_time"),

  status: text("status").notNull(), // given, refused, held, missed
  missedReason: text("missed_reason"),

  witnessedBy: varchar("witnessed_by").references(() => staffAuth.id, { onDelete: "set null" }),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  medicationIdx: index("medication_logs_medication_idx").on(table.medicationId),
  residentIdx: index("medication_logs_resident_idx").on(table.residentId),
  facilityIdx: index("medication_logs_facility_idx").on(table.facilityId),
  scheduledIdx: index("medication_logs_scheduled_idx").on(table.scheduledTime),
}));

export const insertMedicationLogSchema = createInsertSchema(medicationLogs).omit({
  id: true, createdAt: true
});
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type MedicationLog = typeof medicationLogs.$inferSelect;

// Daily Notes table - ADL tracking
export const dailyNotes = pgTable("daily_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "cascade" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  staffId: varchar("staff_id").references(() => staffAuth.id, { onDelete: "set null" }).notNull(),

  date: date("date").notNull(),
  shift: text("shift").notNull(), // day, swing, night

  adls: json("adls").$type<{
    bathing?: string; // independent, assisted, total, refused
    dressing?: string;
    grooming?: string;
    toileting?: string;
    eating?: string;
    mobility?: string;
  }>(),

  mood: text("mood"),
  appetite: text("appetite"), // good, fair, poor, refused
  painLevel: integer("pain_level"), // 0-10

  vitalSigns: json("vital_signs").$type<{
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
  }>(),

  notes: text("notes"),
  concerns: text("concerns"),
  hasConcerns: boolean("has_concerns").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  residentIdx: index("daily_notes_resident_idx").on(table.residentId),
  facilityIdx: index("daily_notes_facility_idx").on(table.facilityId),
  dateIdx: index("daily_notes_date_idx").on(table.date),
  residentDateShiftIdx: index("daily_notes_resident_date_shift_idx").on(table.residentId, table.date, table.shift),
}));

export const insertDailyNoteSchema = createInsertSchema(dailyNotes).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertDailyNote = z.infer<typeof insertDailyNoteSchema>;
export type DailyNote = typeof dailyNotes.$inferSelect;

// Incident Reports table
export const incidentReports = pgTable("incident_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "set null" }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  reportedBy: varchar("reported_by").references(() => staffAuth.id, { onDelete: "set null" }).notNull(),

  incidentDate: date("incident_date").notNull(),
  incidentTime: text("incident_time").notNull(),
  location: text("location"),

  type: text("type").notNull(), // fall, medication_error, behavior, injury, elopement, other
  description: text("description").notNull(),
  immediateAction: text("immediate_action"),

  hasInjury: boolean("has_injury").default(false),
  injuries: json("injuries").$type<{
    type: string;
    location: string;
    severity: string;
  }[]>(),

  physicianNotified: boolean("physician_notified").default(false),
  familyNotified: boolean("family_notified").default(false),
  dshsReportable: boolean("dshs_reportable").default(false),

  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  followUpNotes: text("follow_up_notes"),
  witnesses: json("witnesses").$type<string[]>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  residentIdx: index("incident_reports_resident_idx").on(table.residentId),
  facilityIdx: index("incident_reports_facility_idx").on(table.facilityId),
  typeIdx: index("incident_reports_type_idx").on(table.type),
  dateIdx: index("incident_reports_date_idx").on(table.incidentDate),
}));

export const insertIncidentReportSchema = createInsertSchema(incidentReports).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertIncidentReport = z.infer<typeof insertIncidentReportSchema>;
export type IncidentReport = typeof incidentReports.$inferSelect;

// ============================================================================
// EHR RELATIONS
// ============================================================================

export const staffAuthRelations = relations(staffAuth, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [staffAuth.facilityId],
    references: [facilities.id],
  }),
  teamMember: one(teamMembers, {
    fields: [staffAuth.teamMemberId],
    references: [teamMembers.id],
  }),
  medicationLogs: many(medicationLogs),
  dailyNotes: many(dailyNotes),
  incidentReports: many(incidentReports),
}));

export const residentsRelations = relations(residents, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [residents.facilityId],
    references: [facilities.id],
  }),
  medications: many(medications),
  medicationLogs: many(medicationLogs),
  dailyNotes: many(dailyNotes),
  incidentReports: many(incidentReports),
  vitals: many(vitals),
}));

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  resident: one(residents, {
    fields: [medications.residentId],
    references: [residents.id],
  }),
  facility: one(facilities, {
    fields: [medications.facilityId],
    references: [facilities.id],
  }),
  logs: many(medicationLogs),
}));

export const medicationLogsRelations = relations(medicationLogs, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationLogs.medicationId],
    references: [medications.id],
  }),
  resident: one(residents, {
    fields: [medicationLogs.residentId],
    references: [residents.id],
  }),
  facility: one(facilities, {
    fields: [medicationLogs.facilityId],
    references: [facilities.id],
  }),
  administeredByStaff: one(staffAuth, {
    fields: [medicationLogs.administeredBy],
    references: [staffAuth.id],
  }),
  witnessStaff: one(staffAuth, {
    fields: [medicationLogs.witnessedBy],
    references: [staffAuth.id],
  }),
}));

export const dailyNotesRelations = relations(dailyNotes, ({ one }) => ({
  resident: one(residents, {
    fields: [dailyNotes.residentId],
    references: [residents.id],
  }),
  facility: one(facilities, {
    fields: [dailyNotes.facilityId],
    references: [facilities.id],
  }),
  staff: one(staffAuth, {
    fields: [dailyNotes.staffId],
    references: [staffAuth.id],
  }),
}));

export const incidentReportsRelations = relations(incidentReports, ({ one }) => ({
  facility: one(facilities, {
    fields: [incidentReports.facilityId],
    references: [facilities.id],
  }),
  resident: one(residents, {
    fields: [incidentReports.residentId],
    references: [residents.id],
  }),
  reportedByStaff: one(staffAuth, {
    fields: [incidentReports.reportedBy],
    references: [staffAuth.id],
  }),
}));

// Vitals table - vital signs logging
export const vitals = pgTable("vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "cascade" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  recordedBy: text("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at").notNull(),

  // Vital signs
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  heartRate: integer("heart_rate"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  respiratoryRate: integer("respiratory_rate"),
  oxygenSaturation: integer("oxygen_saturation"),
  weight: decimal("weight", { precision: 5, scale: 1 }),
  bloodSugar: integer("blood_sugar"),
  painLevel: integer("pain_level"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  residentIdx: index("vitals_resident_idx").on(table.residentId),
  facilityIdx: index("vitals_facility_idx").on(table.facilityId),
  recordedAtIdx: index("vitals_recorded_at_idx").on(table.recordedAt),
}));

export const insertVitalsSchema = createInsertSchema(vitals).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertVitals = z.infer<typeof insertVitalsSchema>;
export type Vitals = typeof vitals.$inferSelect;

// Vitals relations
export const vitalsRelations = relations(vitals, ({ one }) => ({
  resident: one(residents, {
    fields: [vitals.residentId],
    references: [residents.id],
  }),
  facility: one(facilities, {
    fields: [vitals.facilityId],
    references: [facilities.id],
  }),
}));

// Form Submissions table - for fillable DSHS forms (NCP, etc.)
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).notNull(),
  residentId: varchar("resident_id").references(() => residents.id, { onDelete: "set null" }), // optional - some forms aren't resident-specific
  formType: text("form_type").notNull(), // 'ncp', 'resident_rights', 'incident_detailed', etc.
  formTitle: text("form_title").notNull(),
  status: text("status").notNull().default("draft"), // draft, completed
  currentSection: integer("current_section").default(1),
  totalSections: integer("total_sections").notNull(),
  completionPercentage: integer("completion_percentage").default(0),
  formData: text("form_data").notNull(), // JSON string of all form fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by"), // staff/owner who created
}, (table) => ({
  facilityIdx: index("form_submissions_facility_idx").on(table.facilityId),
  residentIdx: index("form_submissions_resident_idx").on(table.residentId),
  typeIdx: index("form_submissions_type_idx").on(table.formType),
}));

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

// Form Submissions relations
export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  facility: one(facilities, {
    fields: [formSubmissions.facilityId],
    references: [facilities.id],
  }),
  resident: one(residents, {
    fields: [formSubmissions.residentId],
    references: [residents.id],
  }),
}));

// Facility Events table - for calendar/upcoming events
export const facilityEvents = pgTable("facility_events", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull(),
  residentId: varchar("resident_id"), // optional - if event is resident-specific
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  // Types: 'appointment', 'care_conference', 'fire_drill', 'inspection', 'training', 'custom'
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time", { length: 10 }), // "14:00" format
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("facility_events_facility_idx").on(table.facilityId),
  dateIdx: index("facility_events_date_idx").on(table.eventDate),
}));

export const insertFacilityEventSchema = createInsertSchema(facilityEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type FacilityEvent = typeof facilityEvents.$inferSelect;
export type InsertFacilityEvent = z.infer<typeof insertFacilityEventSchema>;

// Facility Activity Log - for dashboard activity feed
export const facilityActivity = pgTable("facility_activity", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  // Types: 'medication_given', 'incident_filed', 'incident_resolved', 'note_added',
  //        'inquiry_received', 'resident_added', 'credential_updated', 'form_completed', 'event_created'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  performedBy: varchar("performed_by", { length: 255 }), // staff name or system
  relatedId: varchar("related_id"), // ID of related record
  relatedType: varchar("related_type", { length: 50 }), // 'incident', 'resident', 'medication', etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("facility_activity_facility_idx").on(table.facilityId),
  createdIdx: index("facility_activity_created_idx").on(table.createdAt),
}));

export const insertFacilityActivitySchema = createInsertSchema(facilityActivity).omit({ id: true, createdAt: true });
export type FacilityActivity = typeof facilityActivity.$inferSelect;
export type InsertFacilityActivity = z.infer<typeof insertFacilityActivitySchema>;

// ============================================================================
// HIPAA SECURITY TABLES
// ============================================================================

// Security configuration per facility
export const securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }).unique(),

  // Session settings
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(15),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(3),

  // Login settings
  maxFailedLoginAttempts: integer("max_failed_login_attempts").default(5),
  lockoutDurationMinutes: integer("lockout_duration_minutes").default(15),

  // Password policy
  minPasswordLength: integer("min_password_length").default(12),
  requireUppercase: boolean("require_uppercase").default(true),
  requireLowercase: boolean("require_lowercase").default(true),
  requireNumbers: boolean("require_numbers").default(true),
  requireSpecialChars: boolean("require_special_chars").default(true),
  passwordExpiryDays: integer("password_expiry_days").default(90),
  passwordHistoryCount: integer("password_history_count").default(12),

  // MFA settings (for Phase 2)
  requireMfaOwners: boolean("require_mfa_owners").default(false),
  requireMfaStaff: boolean("require_mfa_staff").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({ id: true, createdAt: true, updatedAt: true });
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;

// Failed login attempts tracking
export const failedLoginAttempts = pgTable("failed_login_attempts", {
  id: serial("id").primaryKey(),

  // Who
  email: text("email"), // For owner logins
  staffName: text("staff_name"), // For staff logins
  facilityId: varchar("facility_id"),
  userType: text("user_type").notNull(), // 'owner' or 'staff'

  // What
  attemptedAt: timestamp("attempted_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Lockout tracking
  isLocked: boolean("is_locked").default(false),
  lockedUntil: timestamp("locked_until"),
}, (table) => ({
  emailIdx: index("failed_login_email_idx").on(table.email),
  staffNameIdx: index("failed_login_staff_name_idx").on(table.staffName),
  attemptedAtIdx: index("failed_login_attempted_at_idx").on(table.attemptedAt),
}));

export const insertFailedLoginAttemptSchema = createInsertSchema(failedLoginAttempts).omit({ id: true });
export type FailedLoginAttempt = typeof failedLoginAttempts.$inferSelect;
export type InsertFailedLoginAttempt = z.infer<typeof insertFailedLoginAttemptSchema>;

// Active sessions tracking
export const activeSessions = pgTable("active_sessions", {
  id: varchar("id").primaryKey(), // Session token ID

  userId: varchar("user_id"),
  userType: text("user_type").notNull(), // 'owner' or 'staff'
  facilityId: varchar("facility_id"),

  createdAt: timestamp("created_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: text("device_info"),

  isValid: boolean("is_valid").default(true),
}, (table) => ({
  userIdx: index("active_sessions_user_idx").on(table.userId),
  expiresIdx: index("active_sessions_expires_idx").on(table.expiresAt),
}));

export const insertActiveSessionSchema = createInsertSchema(activeSessions);
export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = z.infer<typeof insertActiveSessionSchema>;

// Password history (prevent reuse)
export const passwordHistory = pgTable("password_history", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => owners.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("password_history_owner_idx").on(table.ownerId),
}));

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({ id: true, createdAt: true });
export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type InsertPasswordHistory = z.infer<typeof insertPasswordHistorySchema>;

// ============================================
// FACILITY CAPABILITIES FOR CARE MATCHING
// ============================================

// Type definitions for facility capabilities JSON fields
export type CareTypesCapability = {
  afh: boolean;
  assistedLiving: boolean;
  skilledNursing: boolean;
  hospice: boolean;
  respiteCare: boolean;
  adultDaycare: boolean;
};

export type SpecializationsCapability = {
  dementia: boolean;
  alzheimers: boolean;
  mentalHealth: boolean;
  developmentalDisabilities: boolean;
  traumaticBrainInjury: boolean;
  parkinsons: boolean;
  diabetes: boolean;
  dialysis: boolean;
  hospicePalliative: boolean;
  postSurgeryRehab: boolean;
  bariatric: boolean;
  youngAdults: boolean;
  veterans: boolean;
};

export type MedicalServicesCapability = {
  nursingCare24hr: boolean;
  rnOnSite: boolean;
  lpnOnSite: boolean;
  medicationManagement: boolean;
  medicationAdministration: boolean;
  injections: boolean;
  woundCare: boolean;
  catheterCare: boolean;
  ostomyCare: boolean;
  oxygenTherapy: boolean;
  cpapBipap: boolean;
  feedingTube: boolean;
  physicalTherapy: boolean;
  occupationalTherapy: boolean;
  speechTherapy: boolean;
  bloodGlucoseMonitoring: boolean;
  vitalSignsMonitoring: boolean;
  hospiceCoordination: boolean;
};

export type AdlLevel = 'independent-only' | 'some-assistance' | 'full-assistance' | 'all-levels';
export type MobilityLevel = 'ambulatory-only' | 'wheelchair' | 'bedridden' | 'all-levels';
export type TransferLevel = 'independent-only' | 'one-person' | 'two-person' | 'hoyer-lift' | 'all-levels';
export type ContinenceLevel = 'continent-only' | 'incontinent-ok' | 'all-levels';

export type AdlCapabilitiesType = {
  bathing: AdlLevel;
  dressing: AdlLevel;
  eating: AdlLevel;
  mobility: MobilityLevel;
  toileting: AdlLevel;
  transferring: TransferLevel;
  continence: ContinenceLevel;
};

export type PaymentAcceptedCapability = {
  privatePay: boolean;
  medicaidCOPES: boolean;
  medicaidWaiver: boolean;
  medicare: boolean;
  longTermCareInsurance: boolean;
  vaAidAttendance: boolean;
  vaCommunityLiving: boolean;
  slidingScale: boolean;
  financialAssistance: boolean;
};

export type PricingCapability = {
  baseRateMin: number;
  baseRateMax: number;
  medicaidRate: number | null;
  additionalCareRates: {
    level1: number;
    level2: number;
    level3: number;
  };
  includesInPricing: string[];
  additionalFees: { name: string; amount: number }[];
};

export type AmenitiesCapability = {
  privateRooms: boolean;
  sharedRooms: boolean;
  privateBathroom: boolean;
  wheelchairAccessible: boolean;
  hospitalBeds: boolean;
  hoyerLift: boolean;
  walkInShower: boolean;
  emergencyCallSystem: boolean;
  securedMemoryCare: boolean;
  wanderPrevention: boolean;
  outdoorSpace: boolean;
  garden: boolean;
  petFriendly: boolean;
  petsOnSite: boolean;
  smokingAllowed: boolean;
  wifi: boolean;
  cableTV: boolean;
  airConditioning: boolean;
  homeCookedMeals: boolean;
  specialDiets: boolean;
  activities: boolean;
  transportation: boolean;
  laundry: boolean;
  housekeeping: boolean;
};

export type StaffingCapability = {
  staffToResidentRatio: string;
  rnHoursPerWeek: number;
  lpnHoursPerWeek: number;
  cnaCount: number;
  overnightStaffAwake: boolean;
  bilingualStaff: boolean;
  languages: string[];
  specializedTraining: string[];
};

export type CulturalServicesCapability = {
  languagesSpoken: string[];
  culturalFoods: string[];
  religiousServices: boolean;
  religiousAffiliation: string | null;
  lgbtqFriendly: boolean;
  culturalActivities: string[];
};

export type AvailabilityCapability = {
  totalBeds: number;
  currentOccupancy: number;
  availableBeds: number;
  waitlistLength: number;
  acceptingNewResidents: boolean;
  respiteCareAvailable: boolean;
};

export type AdditionalInfoCapability = {
  yearEstablished: number | null;
  ownerOperatedOnSite: boolean;
  visitingHours: string;
  trialStayAvailable: boolean;
  minimumStayDays: number | null;
  maxResidentAge: number | null;
  minResidentAge: number | null;
};

// Facility Capabilities table for detailed matching
export const facilityCapabilities = pgTable("facility_capabilities", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id, { onDelete: "cascade" }).unique(),

  // Care Types Offered
  careTypes: json("care_types").$type<CareTypesCapability>(),

  // Specializations (what conditions/populations they serve)
  specializations: json("specializations").$type<SpecializationsCapability>(),

  // Medical Services Provided
  medicalServices: json("medical_services").$type<MedicalServicesCapability>(),

  // ADL Assistance Levels (what level of care they can provide)
  adlCapabilities: json("adl_capabilities").$type<AdlCapabilitiesType>(),

  // Payment Types Accepted
  paymentAccepted: json("payment_accepted").$type<PaymentAcceptedCapability>(),

  // Pricing
  pricing: json("pricing").$type<PricingCapability>(),

  // Amenities & Features
  amenities: json("amenities").$type<AmenitiesCapability>(),

  // Staff Information
  staffing: json("staffing").$type<StaffingCapability>(),

  // Cultural & Religious
  culturalServices: json("cultural_services").$type<CulturalServicesCapability>(),

  // Availability
  availability: json("availability").$type<AvailabilityCapability>(),

  // Additional Info
  additionalInfo: json("additional_info").$type<AdditionalInfoCapability>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("facility_capabilities_facility_idx").on(table.facilityId),
}));

export const facilityCapabilitiesRelations = relations(facilityCapabilities, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityCapabilities.facilityId],
    references: [facilities.id],
  }),
}));

export const insertFacilityCapabilitiesSchema = createInsertSchema(facilityCapabilities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFacilityCapabilities = z.infer<typeof insertFacilityCapabilitiesSchema>;
export type FacilityCapabilities = typeof facilityCapabilities.$inferSelect;

// ============================================
// AUDIT LOGS (HIPAA Required)
// ============================================
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),

  // Who
  userId: varchar("user_id").references(() => users.id),
  staffAuthId: varchar("staff_auth_id"),
  userRole: text("user_role"),
  userEmail: text("user_email"),

  // What
  action: text("action").notNull(), // 'view', 'create', 'update', 'delete', 'login', 'logout'
  resourceType: text("resource_type").notNull(), // 'resident', 'medication', 'facility', etc.
  resourceId: varchar("resource_id"),
  facilityId: varchar("facility_id"),

  // Details
  description: text("description"),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),

  // Where
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),

  // Security events
  isSecurityEvent: boolean("is_security_event").default(false),
  securityEventType: text("security_event_type"),

  // When (immutable)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
  facilityIdx: index("audit_logs_facility_idx").on(table.facilityId),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  securityIdx: index("audit_logs_security_idx").on(table.isSecurityEvent),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================
// FACILITY COMPLIANCE (DSHS Tracking)
// ============================================
export const facilityCompliance = pgTable("facility_compliance", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull().unique().references(() => facilities.id, { onDelete: "cascade" }),

  // DSHS Inspection
  lastInspectionDate: date("last_inspection_date"),
  nextInspectionDue: date("next_inspection_due"),
  inspectionScore: integer("inspection_score"),
  monthsViolationFree: integer("months_violation_free").default(0),

  // Violations (24-month window)
  criticalViolations: integer("critical_violations").default(0),
  seriousViolations: integer("serious_violations").default(0),
  moderateViolations: integer("moderate_violations").default(0),
  minorViolations: integer("minor_violations").default(0),

  // Flags
  hasAbuseFinding: boolean("has_abuse_finding").default(false),
  abuseFindingDate: date("abuse_finding_date"),

  // DSHS License
  dshsLicenseNumber: text("dshs_license_number"),
  dshsInceptionDate: date("dshs_inception_date"),
  dshsLastSync: timestamp("dshs_last_sync"),

  // 2025 Requirements
  hasSuccessionPlan: boolean("has_succession_plan").default(false),
  successionPlanDate: date("succession_plan_date"),

  // Calculated Scores
  totalScore: integer("total_score"),
  scoreRating: text("score_rating"),
  scoreCalculatedAt: timestamp("score_calculated_at"),

  // Verification
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("facility_compliance_facility_idx").on(table.facilityId),
}));

export type FacilityCompliance = typeof facilityCompliance.$inferSelect;
export type InsertFacilityCompliance = typeof facilityCompliance.$inferInsert;

// ============================================
// STAFF CREDENTIALS (License Tracking)
// ============================================
export const staffCredentials = pgTable("staff_credentials", {
  id: serial("id").primaryKey(),
  staffAuthId: varchar("staff_auth_id").notNull(),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),

  // License
  licenseType: text("license_type"), // 'NAC', 'CNA', 'HCA', 'RN', 'LPN'
  licenseNumber: text("license_number"),
  licenseState: text("license_state").default("WA"),
  licenseExpiryDate: date("license_expiry_date"),
  licenseVerified: boolean("license_verified").default(false),

  // Required Trainings
  cprExpiryDate: date("cpr_expiry_date"),
  firstAidExpiryDate: date("first_aid_expiry_date"),
  foodHandlerExpiryDate: date("food_handler_expiry_date"),

  // Specialty Certifications
  hasDementiaSpecialty: boolean("has_dementia_specialty").default(false),
  hasMentalHealthSpecialty: boolean("has_mental_health_specialty").default(false),
  hasNurseDelegation: boolean("has_nurse_delegation").default(false),
  nurseDelegationExpiry: date("nurse_delegation_expiry"),

  // Background Check
  backgroundCheckDate: date("background_check_date"),
  backgroundCheckClear: boolean("background_check_clear"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  staffIdx: index("staff_credentials_staff_idx").on(table.staffAuthId),
  facilityIdx: index("staff_credentials_facility_idx").on(table.facilityId),
  licenseExpiryIdx: index("staff_credentials_license_expiry_idx").on(table.licenseExpiryDate),
}));

export type StaffCredentials = typeof staffCredentials.$inferSelect;
export type InsertStaffCredentials = typeof staffCredentials.$inferInsert;

// ============================================
// OWNER CREDENTIALS
// ============================================
export const ownerCredentials = pgTable("owner_credentials", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull().unique().references(() => facilities.id),
  userId: varchar("user_id").notNull().references(() => users.id),

  // License
  licenseType: text("license_type"),
  licenseNumber: text("license_number"),
  licenseExpiryDate: date("license_expiry_date"),
  licenseVerified: boolean("license_verified").default(false),

  // Involvement
  livesOnSite: boolean("lives_on_site").default(false),
  hoursPerWeekOnSite: integer("hours_per_week_on_site"),

  // Experience
  yearsHealthcareExperience: integer("years_healthcare_experience"),
  yearsAfhExperience: integer("years_afh_experience"),

  // 2025 DSHS Requirement
  hasSuccessionPlan: boolean("has_succession_plan").default(false),
  successorName: text("successor_name"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("owner_credentials_facility_idx").on(table.facilityId),
  userIdx: index("owner_credentials_user_idx").on(table.userId),
}));

export type OwnerCredentials = typeof ownerCredentials.$inferSelect;
export type InsertOwnerCredentials = typeof ownerCredentials.$inferInsert;

// ============================================
// ADL LOGS (Activities of Daily Living)
// ============================================
export const adlLogs = pgTable("adl_logs", {
  id: serial("id").primaryKey(),
  residentId: varchar("resident_id").notNull(),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),

  // Date/Time
  logDate: date("log_date").notNull(),
  shiftType: text("shift_type"), // 'day', 'swing', 'night'

  // ADL Categories (values: 'independent', 'setup', 'supervision', 'limited_assist', 'extensive_assist', 'total_care')
  bathing: text("bathing"),
  dressing: text("dressing"),
  grooming: text("grooming"),
  toileting: text("toileting"),
  transferring: text("transferring"),
  mobility: text("mobility"),
  eating: text("eating"),

  // Additional
  continence: text("continence"),
  sleepQuality: text("sleep_quality"),
  moodBehavior: text("mood_behavior"),
  painLevel: integer("pain_level"),

  // Vitals
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  pulse: integer("pulse"),
  temperature: text("temperature"),
  weight: text("weight"),

  // Notes
  notes: text("notes"),

  // Staff
  recordedBy: varchar("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  residentIdx: index("adl_logs_resident_idx").on(table.residentId),
  facilityIdx: index("adl_logs_facility_idx").on(table.facilityId),
  dateIdx: index("adl_logs_date_idx").on(table.logDate),
}));

export type AdlLog = typeof adlLogs.$inferSelect;
export type InsertAdlLog = typeof adlLogs.$inferInsert;

// ============================================
// CARE PLAN VERSIONS (NCP Versioning)
// ============================================
export const carePlanVersions = pgTable("care_plan_versions", {
  id: serial("id").primaryKey(),
  residentId: varchar("resident_id").notNull(),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),

  // Version
  versionNumber: integer("version_number").notNull(),
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),

  // Plan Data (full NCP as JSON)
  planData: jsonb("plan_data").notNull(),

  // Change Tracking
  changeReason: text("change_reason"),
  changeDescription: text("change_description"),

  // Signatures
  residentSignedAt: timestamp("resident_signed_at"),
  representativeSignedAt: timestamp("representative_signed_at"),
  providerSignedAt: timestamp("provider_signed_at"),

  // PDF
  pdfUrl: text("pdf_url"),

  // Status
  status: text("status").default("draft"), // 'draft', 'active', 'superseded'

  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  residentIdx: index("care_plan_versions_resident_idx").on(table.residentId),
  facilityIdx: index("care_plan_versions_facility_idx").on(table.facilityId),
  statusIdx: index("care_plan_versions_status_idx").on(table.status),
}));

export type CarePlanVersion = typeof carePlanVersions.$inferSelect;
export type InsertCarePlanVersion = typeof carePlanVersions.$inferInsert;

// ============================================
// TRUSTED DEVICES (Staff PIN Security)
// ============================================
export const trustedDevices = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id),

  // Device
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  deviceType: text("device_type"), // "tablet", "phone", "desktop"

  // Authorization
  authorizedBy: varchar("authorized_by").references(() => users.id),
  authorizedAt: timestamp("authorized_at").defaultNow(),

  // Status
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  facilityIdx: index("trusted_devices_facility_idx").on(table.facilityId),
  deviceIdx: index("trusted_devices_device_idx").on(table.deviceId),
}));

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = typeof trustedDevices.$inferInsert;

// ============================================
// USER MFA (Multi-Factor Authentication)
// ============================================
export const userMfa = pgTable("user_mfa", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  // TOTP Secret (encrypted)
  encryptedSecret: text("encrypted_secret").notNull(),

  // Backup Codes (hashed)
  backupCodes: jsonb("backup_codes").$type<string[]>().default([]),

  // Status
  isEnabled: boolean("is_enabled").default(false),
  isRequired: boolean("is_required").default(true),

  // Tracking
  lastUsedAt: timestamp("last_used_at"),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("user_mfa_user_idx").on(table.userId),
}));

export type UserMfa = typeof userMfa.$inferSelect;
export type InsertUserMfa = typeof userMfa.$inferInsert;
