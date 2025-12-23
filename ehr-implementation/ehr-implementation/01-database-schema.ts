// ============================================================================
// EHR SYSTEM - DATABASE SCHEMA
// Add these tables to shared/schema.ts
// ============================================================================

import { pgTable, text, serial, integer, boolean, timestamp, json, date, time, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { facilities, teamMembers, owners } from "./schema"; // existing imports

// ============================================================================
// ENUMS
// ============================================================================

export const staffRoleEnum = pgEnum('staff_role', ['caregiver', 'med_tech', 'shift_lead', 'nurse']);
export const staffStatusEnum = pgEnum('staff_status', ['active', 'suspended', 'inactive']);
export const shiftEnum = pgEnum('shift', ['day', 'swing', 'night']);
export const residentStatusEnum = pgEnum('resident_status', ['active', 'discharged', 'hospitalized', 'deceased', 'on_leave']);
export const medicationStatusEnum = pgEnum('medication_status', ['active', 'discontinued', 'on_hold']);
export const medicationRouteEnum = pgEnum('medication_route', ['oral', 'topical', 'injection', 'inhaled', 'sublingual', 'rectal', 'transdermal', 'ophthalmic', 'otic']);
export const medLogStatusEnum = pgEnum('med_log_status', ['given', 'missed', 'refused', 'held', 'not_available', 'self_administered']);
export const adlLevelEnum = pgEnum('adl_level', ['independent', 'supervision', 'minimal_assist', 'moderate_assist', 'max_assist', 'total_care']);
export const moodEnum = pgEnum('mood', ['happy', 'calm', 'anxious', 'agitated', 'depressed', 'withdrawn', 'confused', 'cooperative']);
export const appetiteEnum = pgEnum('appetite', ['excellent', 'good', 'fair', 'poor', 'refused']);
export const incidentTypeEnum = pgEnum('incident_type', ['fall', 'injury', 'medication_error', 'behavioral', 'elopement', 'abuse_allegation', 'medical_emergency', 'property_damage', 'other']);
export const incidentStatusEnum = pgEnum('incident_status', ['open', 'under_review', 'closed']);
export const carePlanStatusEnum = pgEnum('care_plan_status', ['active', 'inactive', 'completed', 'discontinued']);
export const carePlanCategoryEnum = pgEnum('care_plan_category', ['adl', 'behavioral', 'medical', 'social', 'nutritional', 'mobility', 'cognitive']);
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'synced', 'failed']);
export const dshsReportTypeEnum = pgEnum('dshs_report_type', ['monthly_summary', 'incident', 'inspection_prep', 'mar_export', 'care_plan_summary']);

// ============================================================================
// STAFF AUTHENTICATION (Links to existing teamMembers)
// ============================================================================

export const staffAuth = pgTable("staff_auth", {
  id: serial("id").primaryKey(),
  
  // Links to existing team member (optional - can exist independently)
  teamMemberId: integer("team_member_id").references(() => teamMembers.id),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // Auth credentials
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  pin: text("pin"), // 4-6 digit quick login (hashed)
  
  // Profile
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  photo: text("photo"), // URL
  
  // Role & Permissions
  role: staffRoleEnum("role").notNull().default('caregiver'),
  permissions: json("permissions").$type<{
    canAdministerMeds: boolean;
    canAdministerControlled: boolean;
    canFileIncidents: boolean;
    canEditCarePlans: boolean;
    canViewAllResidents: boolean;
    canInviteStaff: boolean;
  }>().default({
    canAdministerMeds: true,
    canAdministerControlled: false,
    canFileIncidents: true,
    canEditCarePlans: false,
    canViewAllResidents: true,
    canInviteStaff: false
  }),
  
  // Status
  status: staffStatusEnum("status").notNull().default('active'),
  invitedBy: integer("invited_by").references(() => owners.id),
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at"),
  
  // Tracking
  lastLoginAt: timestamp("last_login_at"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RESIDENTS
// ============================================================================

export const residents = pgTable("residents", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // Basic Info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name"), // What staff should call them
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender"), // male, female, other
  photo: text("photo"), // URL
  
  // Location
  roomNumber: text("room_number"),
  bedNumber: text("bed_number"),
  
  // Admission
  admissionDate: date("admission_date").notNull(),
  dischargeDate: date("discharge_date"),
  dischargeReason: text("discharge_reason"),
  status: residentStatusEnum("status").notNull().default('active'),
  
  // Medical Info
  primaryPhysician: json("primary_physician").$type<{
    name: string;
    phone: string;
    fax?: string;
    address?: string;
    specialty?: string;
  }>(),
  
  specialists: json("specialists").$type<Array<{
    name: string;
    specialty: string;
    phone: string;
    lastVisit?: string;
  }>>().default([]),
  
  pharmacy: json("pharmacy").$type<{
    name: string;
    phone: string;
    fax?: string;
    address?: string;
  }>(),
  
  diagnoses: json("diagnoses").$type<string[]>().default([]),
  allergies: json("allergies").$type<Array<{
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>>().default([]),
  
  dietaryRestrictions: json("dietary_restrictions").$type<string[]>().default([]),
  
  // Code Status
  codeStatus: text("code_status").default('FULL'), // FULL, DNR, DNI, DNR-DNI, POLST
  advanceDirective: boolean("advance_directive").default(false),
  advanceDirectiveLocation: text("advance_directive_location"),
  
  // Contacts
  emergencyContacts: json("emergency_contacts").$type<Array<{
    name: string;
    relationship: string;
    phone: string;
    altPhone?: string;
    email?: string;
    isPrimary: boolean;
    canMakeDecisions: boolean;
  }>>().default([]),
  
  // Insurance
  insuranceInfo: json("insurance_info").$type<{
    primary?: {
      company: string;
      policyNumber: string;
      groupNumber?: string;
      phone?: string;
    };
    secondary?: {
      company: string;
      policyNumber: string;
      groupNumber?: string;
      phone?: string;
    };
    medicaidId?: string;
    medicareId?: string;
  }>(),
  
  // Preferences & Notes
  preferences: json("preferences").$type<{
    wakeTime?: string;
    bedTime?: string;
    showerDays?: string[];
    likes?: string[];
    dislikes?: string[];
    routines?: string;
    communication?: string;
    mobility?: string;
  }>(),
  
  notes: text("notes"),
  
  // Tracking
  createdBy: integer("created_by").references(() => staffAuth.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// MEDICATIONS
// ============================================================================

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // Drug Info
  name: text("name").notNull(), // Brand name
  genericName: text("generic_name"),
  dosage: text("dosage").notNull(), // "500mg", "10ml"
  form: text("form"), // tablet, capsule, liquid, cream, patch
  route: medicationRouteEnum("route").notNull().default('oral'),
  
  // Schedule
  frequency: json("frequency").$type<{
    type: 'scheduled' | 'prn';
    times?: string[]; // ["08:00", "12:00", "18:00", "22:00"]
    interval?: string; // "every 6 hours", "twice daily"
    daysOfWeek?: number[]; // [0,1,2,3,4,5,6] for specific days
    maxDaily?: number; // For PRN meds
  }>().notNull(),
  
  instructions: text("instructions"), // "Take with food", "Do not crush"
  indication: text("indication"), // What it's for
  
  // Prescriber
  prescribedBy: text("prescribed_by"),
  prescribedDate: date("prescribed_date"),
  
  // Duration
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  
  // Pharmacy
  pharmacyNotes: text("pharmacy_notes"),
  refillDate: date("refill_date"),
  quantityRemaining: integer("quantity_remaining"),
  
  // Flags
  isControlled: boolean("is_controlled").default(false),
  controlledSchedule: text("controlled_schedule"), // II, III, IV, V
  isPRN: boolean("is_prn").default(false),
  prnReason: text("prn_reason"), // "For pain > 5", "For anxiety"
  requiresVitals: boolean("requires_vitals").default(false), // Check BP before giving
  vitalsParameters: json("vitals_parameters").$type<{
    checkBP?: { min?: number; max?: number };
    checkPulse?: { min?: number; max?: number };
    checkGlucose?: { min?: number; max?: number };
  }>(),
  
  // Status
  status: medicationStatusEnum("status").notNull().default('active'),
  discontinuedDate: date("discontinued_date"),
  discontinuedReason: text("discontinued_reason"),
  discontinuedBy: integer("discontinued_by").references(() => staffAuth.id),
  
  // Tracking
  createdBy: integer("created_by").references(() => staffAuth.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// MEDICATION ADMINISTRATION RECORD (MAR)
// ============================================================================

export const medicationLogs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  
  // References
  medicationId: integer("medication_id").references(() => medications.id).notNull(),
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  administeredBy: integer("administered_by").references(() => staffAuth.id).notNull(),
  
  // Timing
  scheduledTime: timestamp("scheduled_time").notNull(),
  administeredTime: timestamp("administered_time"),
  
  // Status
  status: medLogStatusEnum("status").notNull(),
  missedReason: text("missed_reason"), // If missed/refused/held
  
  // For PRN meds
  prnReason: text("prn_reason"), // Why it was given
  prnEffectiveness: text("prn_effectiveness"), // Follow-up on effectiveness
  prnFollowUpTime: timestamp("prn_follow_up_time"),
  prnFollowUpBy: integer("prn_follow_up_by").references(() => staffAuth.id),
  
  // Vitals (if required)
  vitalsBeforeAdmin: json("vitals_before_admin").$type<{
    bp?: string;
    pulse?: number;
    glucose?: number;
  }>(),
  
  // Controlled substance witness
  witnessedBy: integer("witnessed_by").references(() => staffAuth.id),
  
  // Notes
  notes: text("notes"),
  
  // Offline sync
  localId: text("local_id"), // UUID from device
  syncStatus: syncStatusEnum("sync_status").default('synced'),
  syncedAt: timestamp("synced_at"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// DAILY NOTES (ADLs)
// ============================================================================

export const dailyNotes = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  
  // References
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  staffId: integer("staff_id").references(() => staffAuth.id).notNull(),
  
  // When
  date: date("date").notNull(),
  shift: shiftEnum("shift").notNull(),
  
  // ADLs
  adls: json("adls").$type<{
    bathing?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'refused' | 'not_scheduled';
    dressing?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'refused';
    grooming?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'refused';
    eating?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'refused';
    mobility?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'bedbound';
    transfer?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care' | 'mechanical_lift';
    toileting?: 'independent' | 'supervision' | 'minimal_assist' | 'moderate_assist' | 'max_assist' | 'total_care';
    continence?: 'continent' | 'occasional_accident' | 'frequent_accident' | 'incontinent' | 'catheter' | 'ostomy';
  }>().default({}),
  
  // Status
  mood: moodEnum("mood"),
  appetite: appetiteEnum("appetite"),
  fluidIntake: text("fluid_intake"), // adequate, minimal, refused, amount in ml
  sleepQuality: text("sleep_quality"), // good, fair, poor, awake_frequently
  sleepHours: decimal("sleep_hours"),
  
  // Pain
  painLevel: integer("pain_level"), // 0-10
  painLocation: text("pain_location"),
  painIntervention: text("pain_intervention"),
  
  // Vitals
  vitalSigns: json("vital_signs").$type<{
    bp?: string; // "120/80"
    pulse?: number;
    temp?: number; // Fahrenheit
    respiration?: number;
    weight?: number; // lbs
    glucose?: number;
    o2sat?: number; // percentage
  }>(),
  
  // Activities
  activities: json("activities").$type<string[]>().default([]),
  
  // Notes
  notes: text("notes"),
  concerns: text("concerns"), // Flagged for owner/lead attention
  hasConcerns: boolean("has_concerns").default(false),
  
  // Skin check
  skinCheck: json("skin_check").$type<{
    completed: boolean;
    issues?: Array<{
      location: string;
      description: string;
      stage?: number;
      treatment?: string;
    }>;
  }>(),
  
  // Offline sync
  localId: text("local_id"),
  syncStatus: syncStatusEnum("sync_status").default('synced'),
  syncedAt: timestamp("synced_at"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// INCIDENT REPORTS
// ============================================================================

export const incidentReports = pgTable("incident_reports", {
  id: serial("id").primaryKey(),
  
  // References
  residentId: integer("resident_id").references(() => residents.id), // Can be null for facility-wide incidents
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  reportedBy: integer("reported_by").references(() => staffAuth.id).notNull(),
  
  // When & Where
  incidentDate: date("incident_date").notNull(),
  incidentTime: time("incident_time").notNull(),
  discoveredDate: date("discovered_date"),
  discoveredTime: time("discovered_time"),
  location: text("location").notNull(), // "Bedroom", "Bathroom", "Common area"
  
  // What
  type: incidentTypeEnum("type").notNull(),
  description: text("description").notNull(),
  immediateAction: text("immediate_action").notNull(),
  
  // Injuries
  hasInjury: boolean("has_injury").default(false),
  injuries: json("injuries").$type<{
    description?: string;
    bodyPart?: string;
    severity?: 'minor' | 'moderate' | 'severe';
    treatment?: string;
    photoUrls?: string[];
  }>(),
  
  // Vitals after incident
  vitalsAfter: json("vitals_after").$type<{
    bp?: string;
    pulse?: number;
    temp?: number;
    o2sat?: number;
    neuroCheck?: string;
  }>(),
  
  // Notifications
  physicianNotified: boolean("physician_notified").default(false),
  physicianName: text("physician_name"),
  physicianNotifiedAt: timestamp("physician_notified_at"),
  physicianOrders: text("physician_orders"),
  
  familyNotified: boolean("family_notified").default(false),
  familyMember: text("family_member"),
  familyNotifiedAt: timestamp("family_notified_at"),
  familyResponse: text("family_response"),
  
  // DSHS Reporting
  dshsReportable: boolean("dshs_reportable").default(false),
  dshsReportedAt: timestamp("dshs_reported_at"),
  dshsReportNumber: text("dshs_report_number"),
  
  // Witnesses
  witnesses: json("witnesses").$type<Array<{
    name: string;
    role: string;
    statement?: string;
  }>>().default([]),
  
  // Contributing factors
  contributingFactors: json("contributing_factors").$type<string[]>().default([]),
  
  // Follow-up
  preventionPlan: text("prevention_plan"),
  followUpActions: json("follow_up_actions").$type<Array<{
    action: string;
    assignedTo?: string;
    dueDate?: string;
    completedDate?: string;
    status: 'pending' | 'completed';
  }>>().default([]),
  
  // Review
  status: incidentStatusEnum("status").notNull().default('open'),
  reviewedBy: integer("reviewed_by").references(() => staffAuth.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Attachments
  attachments: json("attachments").$type<Array<{
    type: 'photo' | 'document';
    url: string;
    description?: string;
  }>>().default([]),
  
  // Offline sync
  localId: text("local_id"),
  syncStatus: syncStatusEnum("sync_status").default('synced'),
  syncedAt: timestamp("synced_at"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// CARE PLANS
// ============================================================================

export const carePlans = pgTable("care_plans", {
  id: serial("id").primaryKey(),
  
  // References
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  createdBy: integer("created_by").references(() => staffAuth.id).notNull(),
  
  // Categorization
  category: carePlanCategoryEnum("category").notNull(),
  title: text("title").notNull(), // Brief title
  
  // Dates
  effectiveDate: date("effective_date").notNull(),
  reviewDate: date("review_date").notNull(),
  
  // Problem/Need
  problem: text("problem").notNull(), // "Resident at risk for falls"
  
  // Goal
  goal: text("goal").notNull(), // "Resident will remain free from falls"
  goalMeasurable: text("goal_measurable"), // "for 30 days"
  
  // Interventions
  interventions: json("interventions").$type<Array<{
    intervention: string;
    frequency: string;
    responsible: string; // "All staff", "Nurse", etc.
  }>>().notNull(),
  
  // Progress
  progress: text("progress"), // on_track, needs_adjustment, goal_met, declined
  progressNotes: json("progress_notes").$type<Array<{
    date: string;
    note: string;
    by: string;
  }>>().default([]),
  
  // Status
  status: carePlanStatusEnum("status").notNull().default('active'),
  discontinuedDate: date("discontinued_date"),
  discontinuedReason: text("discontinued_reason"),
  
  // Signatures (for compliance)
  signatures: json("signatures").$type<Array<{
    role: string;
    name: string;
    date: string;
    type: 'created' | 'reviewed' | 'family_acknowledged';
  }>>().default([]),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// VITALS LOG (Separate from daily notes for detailed tracking)
// ============================================================================

export const vitalsLog = pgTable("vitals_log", {
  id: serial("id").primaryKey(),
  
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  recordedBy: integer("recorded_by").references(() => staffAuth.id).notNull(),
  
  recordedAt: timestamp("recorded_at").notNull(),
  
  // Vitals
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  pulse: integer("pulse"),
  temperature: decimal("temperature"), // Fahrenheit
  respiration: integer("respiration"),
  weight: decimal("weight"), // lbs
  glucose: integer("glucose"),
  o2Saturation: integer("o2_saturation"),
  
  // Context
  position: text("position"), // sitting, standing, lying
  notes: text("notes"),
  
  // Offline sync
  localId: text("local_id"),
  syncStatus: syncStatusEnum("sync_status").default('synced'),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// DSHS REPORTS (Generated reports)
// ============================================================================

export const ehrReports = pgTable("ehr_reports", {
  id: serial("id").primaryKey(),
  
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  generatedBy: integer("generated_by").references(() => owners.id),
  
  reportType: dshsReportTypeEnum("report_type").notNull(),
  title: text("title").notNull(),
  
  // Period covered
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  
  // For specific resident/incident
  residentId: integer("resident_id").references(() => residents.id),
  incidentId: integer("incident_id").references(() => incidentReports.id),
  
  // Generated content
  data: json("data"), // Snapshot of report data
  fileUrl: text("file_url"), // PDF location
  
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// OFFLINE SYNC QUEUE
// ============================================================================

export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  
  staffId: integer("staff_id").references(() => staffAuth.id).notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // What to sync
  tableName: text("table_name").notNull(), // "medication_logs", "daily_notes", etc.
  localId: text("local_id").notNull(), // UUID from device
  action: text("action").notNull(), // "create", "update", "delete"
  payload: json("payload").notNull(),
  
  // Status
  syncStatus: syncStatusEnum("sync_status").default('pending'),
  syncedAt: timestamp("synced_at"),
  syncError: text("sync_error"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// SHIFT HANDOFF NOTES
// ============================================================================

export const shiftHandoffs = pgTable("shift_handoffs", {
  id: serial("id").primaryKey(),
  
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  
  // Shift being handed off
  date: date("date").notNull(),
  fromShift: shiftEnum("from_shift").notNull(),
  toShift: shiftEnum("to_shift").notNull(),
  
  // Staff
  outgoingStaff: integer("outgoing_staff").references(() => staffAuth.id).notNull(),
  incomingStaff: integer("incoming_staff").references(() => staffAuth.id),
  
  // General notes
  generalNotes: text("general_notes"),
  
  // Resident-specific handoffs
  residentNotes: json("resident_notes").$type<Array<{
    residentId: number;
    residentName: string;
    notes: string;
    priority: 'routine' | 'important' | 'urgent';
  }>>().default([]),
  
  // Tasks to complete
  pendingTasks: json("pending_tasks").$type<Array<{
    task: string;
    residentId?: number;
    priority: 'routine' | 'important' | 'urgent';
  }>>().default([]),
  
  // Acknowledgment
  acknowledgedAt: timestamp("acknowledged_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
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
  inviter: one(owners, {
    fields: [staffAuth.invitedBy],
    references: [owners.id],
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
  carePlans: many(carePlans),
  vitalsLog: many(vitalsLog),
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
  administeredByStaff: one(staffAuth, {
    fields: [medicationLogs.administeredBy],
    references: [staffAuth.id],
  }),
  witness: one(staffAuth, {
    fields: [medicationLogs.witnessedBy],
    references: [staffAuth.id],
  }),
}));

export const dailyNotesRelations = relations(dailyNotes, ({ one }) => ({
  resident: one(residents, {
    fields: [dailyNotes.residentId],
    references: [residents.id],
  }),
  staff: one(staffAuth, {
    fields: [dailyNotes.staffId],
    references: [staffAuth.id],
  }),
}));

export const incidentReportsRelations = relations(incidentReports, ({ one }) => ({
  resident: one(residents, {
    fields: [incidentReports.residentId],
    references: [residents.id],
  }),
  reporter: one(staffAuth, {
    fields: [incidentReports.reportedBy],
    references: [staffAuth.id],
  }),
  reviewer: one(staffAuth, {
    fields: [incidentReports.reviewedBy],
    references: [staffAuth.id],
  }),
}));

export const carePlansRelations = relations(carePlans, ({ one }) => ({
  resident: one(residents, {
    fields: [carePlans.residentId],
    references: [residents.id],
  }),
  creator: one(staffAuth, {
    fields: [carePlans.createdBy],
    references: [staffAuth.id],
  }),
}));

// ============================================================================
// INSERT SCHEMAS (for validation)
// ============================================================================

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertStaffAuthSchema = createInsertSchema(staffAuth);
export const selectStaffAuthSchema = createSelectSchema(staffAuth);

export const insertResidentSchema = createInsertSchema(residents);
export const selectResidentSchema = createSelectSchema(residents);

export const insertMedicationSchema = createInsertSchema(medications);
export const selectMedicationSchema = createSelectSchema(medications);

export const insertMedicationLogSchema = createInsertSchema(medicationLogs);
export const selectMedicationLogSchema = createSelectSchema(medicationLogs);

export const insertDailyNoteSchema = createInsertSchema(dailyNotes);
export const selectDailyNoteSchema = createSelectSchema(dailyNotes);

export const insertIncidentReportSchema = createInsertSchema(incidentReports);
export const selectIncidentReportSchema = createSelectSchema(incidentReports);

export const insertCarePlanSchema = createInsertSchema(carePlans);
export const selectCarePlanSchema = createSelectSchema(carePlans);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StaffAuth = typeof staffAuth.$inferSelect;
export type InsertStaffAuth = typeof staffAuth.$inferInsert;

export type Resident = typeof residents.$inferSelect;
export type InsertResident = typeof residents.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

export type MedicationLog = typeof medicationLogs.$inferSelect;
export type InsertMedicationLog = typeof medicationLogs.$inferInsert;

export type DailyNote = typeof dailyNotes.$inferSelect;
export type InsertDailyNote = typeof dailyNotes.$inferInsert;