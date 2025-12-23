// ============================================================================
// EHR SYSTEM - API ROUTES
// Add these routes to server/routes.ts
// ============================================================================

import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ============================================================================
// STAFF AUTHENTICATION ROUTES
// ============================================================================

// Staff login
app.post("/api/staff/login", async (req, res) => {
  try {
    const { email, password, pin } = req.body;
    
    const staff = await storage.getStaffByEmail(email);
    if (!staff) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (staff.status !== 'active') {
      return res.status(401).json({ message: "Account is not active" });
    }
    
    // Check password or PIN
    let isValid = false;
    if (password) {
      isValid = await bcrypt.compare(password, staff.passwordHash || '');
    } else if (pin) {
      isValid = await bcrypt.compare(pin, staff.pin || '');
    }
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Update last login
    await storage.updateStaffAuth(staff.id, { lastLoginAt: new Date() });
    
    // Set session
    req.session.staffId = staff.id;
    req.session.facilityId = staff.facilityId;
    
    res.json({
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      permissions: staff.permissions,
      facilityId: staff.facilityId,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Staff logout
app.post("/api/staff/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// Get current staff
app.get("/api/staff/me", requireStaffAuth, async (req, res) => {
  try {
    const staff = await storage.getStaffById(req.session.staffId!);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Failed to get staff info" });
  }
});

// Staff setup (from invite)
app.post("/api/staff/setup", async (req, res) => {
  try {
    const { token, password, pin } = req.body;
    
    const staff = await storage.getStaffByInviteToken(token);
    if (!staff) {
      return res.status(400).json({ message: "Invalid or expired invite" });
    }
    
    if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
      return res.status(400).json({ message: "Invite has expired" });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    
    await storage.updateStaffAuth(staff.id, {
      passwordHash,
      pin: pinHash,
      inviteToken: null,
      inviteExpiresAt: null,
      status: 'active',
    });
    
    res.json({ message: "Account setup complete" });
  } catch (error) {
    res.status(500).json({ message: "Setup failed" });
  }
});

// Validate invite token
app.get("/api/staff/setup/validate", async (req, res) => {
  try {
    const { token } = req.query;
    
    const staff = await storage.getStaffByInviteToken(token as string);
    if (!staff) {
      return res.status(400).json({ valid: false, message: "Invalid invite" });
    }
    
    if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
      return res.status(400).json({ valid: false, message: "Invite expired" });
    }
    
    res.json({
      valid: true,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: "Validation failed" });
  }
});

// ============================================================================
// OWNER ROUTES - STAFF MANAGEMENT
// ============================================================================

// Owner invites staff member
app.post("/api/owner/staff/invite", requireOwnerAuth, async (req, res) => {
  try {
    const owner = await storage.getOwner(req.session.ownerId!);
    const facilities = await storage.getOwnerFacilities(owner!.id);
    
    const { email, firstName, lastName, role, teamMemberId, facilityId } = req.body;
    
    // Verify owner owns this facility
    const facility = facilities.find(f => f.id === facilityId);
    if (!facility) {
      return res.status(403).json({ message: "Not authorized for this facility" });
    }
    
    // Check if email already exists
    const existing = await storage.getStaffByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create staff auth record
    const staff = await storage.createStaffAuth({
      email,
      firstName,
      lastName,
      role: role || 'caregiver',
      facilityId,
      teamMemberId: teamMemberId || null,
      invitedBy: owner!.id,
      inviteToken,
      inviteExpiresAt,
      status: 'inactive', // Will be activated on setup
      permissions: getDefaultPermissions(role),
    });
    
    // TODO: Send invite email with link to /staff/setup?token={inviteToken}
    
    res.json({
      message: "Invite sent",
      staffId: staff.id,
      setupLink: `/staff/setup?token=${inviteToken}`,
    });
  } catch (error) {
    console.error("Staff invite error:", error);
    res.status(500).json({ message: "Failed to send invite" });
  }
});

// Owner gets staff list for facility
app.get("/api/owner/facilities/:facilityId/staff", requireOwnerAuth, async (req, res) => {
  try {
    const facilityId = parseInt(req.params.facilityId);
    
    // Verify ownership
    const facilities = await storage.getOwnerFacilities(req.session.ownerId!);
    if (!facilities.find(f => f.id === facilityId)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const staff = await storage.getStaffByFacility(facilityId);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Failed to get staff" });
  }
});

// Owner updates staff status/permissions
app.patch("/api/owner/staff/:id", requireOwnerAuth, async (req, res) => {
  try {
    const staffId = parseInt(req.params.id);
    const staff = await storage.getStaffById(staffId);
    
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    
    // Verify ownership
    const facilities = await storage.getOwnerFacilities(req.session.ownerId!);
    if (!facilities.find(f => f.id === staff.facilityId)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const { status, role, permissions } = req.body;
    
    await storage.updateStaffAuth(staffId, {
      ...(status && { status }),
      ...(role && { role }),
      ...(permissions && { permissions }),
    });
    
    res.json({ message: "Staff updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update staff" });
  }
});

// ============================================================================
// RESIDENTS ROUTES
// ============================================================================

// Get all residents for facility
app.get("/api/staff/residents", requireStaffAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const residents = await storage.getResidentsByFacility(
      req.session.facilityId!,
      status as string
    );
    res.json(residents);
  } catch (error) {
    res.status(500).json({ message: "Failed to get residents" });
  }
});

// Get single resident
app.get("/api/staff/residents/:id", requireStaffAuth, async (req, res) => {
  try {
    const resident = await storage.getResident(parseInt(req.params.id));
    
    if (!resident || resident.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Resident not found" });
    }
    
    res.json(resident);
  } catch (error) {
    res.status(500).json({ message: "Failed to get resident" });
  }
});

// Get resident with full details (meds, care plans, recent notes)
app.get("/api/staff/residents/:id/full", requireStaffAuth, async (req, res) => {
  try {
    const residentId = parseInt(req.params.id);
    
    const [resident, medications, carePlans, recentNotes, recentIncidents] = await Promise.all([
      storage.getResident(residentId),
      storage.getResidentMedications(residentId, 'active'),
      storage.getResidentCarePlans(residentId, 'active'),
      storage.getRecentDailyNotes(residentId, 7),
      storage.getRecentIncidents(residentId, 30),
    ]);
    
    if (!resident || resident.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Resident not found" });
    }
    
    res.json({
      ...resident,
      medications,
      carePlans,
      recentNotes,
      recentIncidents,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get resident details" });
  }
});

// Create resident
app.post("/api/staff/residents", requireStaffAuth, async (req, res) => {
  try {
    const resident = await storage.createResident({
      ...req.body,
      facilityId: req.session.facilityId!,
      createdBy: req.session.staffId!,
    });
    res.status(201).json(resident);
  } catch (error) {
    res.status(500).json({ message: "Failed to create resident" });
  }
});

// Update resident
app.patch("/api/staff/residents/:id", requireStaffAuth, async (req, res) => {
  try {
    const residentId = parseInt(req.params.id);
    const resident = await storage.getResident(residentId);
    
    if (!resident || resident.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Resident not found" });
    }
    
    const updated = await storage.updateResident(residentId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update resident" });
  }
});

// ============================================================================
// MEDICATIONS ROUTES
// ============================================================================

// Get medications for resident
app.get("/api/staff/residents/:residentId/medications", requireStaffAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const medications = await storage.getResidentMedications(
      parseInt(req.params.residentId),
      status as string
    );
    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: "Failed to get medications" });
  }
});

// Create medication
app.post("/api/staff/medications", requireStaffAuth, async (req, res) => {
  try {
    // Verify resident belongs to staff's facility
    const resident = await storage.getResident(req.body.residentId);
    if (!resident || resident.facilityId !== req.session.facilityId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const medication = await storage.createMedication({
      ...req.body,
      facilityId: req.session.facilityId!,
      createdBy: req.session.staffId!,
    });
    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ message: "Failed to create medication" });
  }
});

// Update medication
app.patch("/api/staff/medications/:id", requireStaffAuth, async (req, res) => {
  try {
    const medication = await storage.getMedication(parseInt(req.params.id));
    if (!medication || medication.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Medication not found" });
    }
    
    const updated = await storage.updateMedication(medication.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update medication" });
  }
});

// Discontinue medication
app.post("/api/staff/medications/:id/discontinue", requireStaffAuth, async (req, res) => {
  try {
    const medication = await storage.getMedication(parseInt(req.params.id));
    if (!medication || medication.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Medication not found" });
    }
    
    await storage.updateMedication(medication.id, {
      status: 'discontinued',
      discontinuedDate: new Date().toISOString().split('T')[0],
      discontinuedReason: req.body.reason,
      discontinuedBy: req.session.staffId!,
    });
    
    res.json({ message: "Medication discontinued" });
  } catch (error) {
    res.status(500).json({ message: "Failed to discontinue medication" });
  }
});

// ============================================================================
// MEDICATION ADMINISTRATION RECORD (MAR) ROUTES
// ============================================================================

// Get MAR for facility (today or specific date)
app.get("/api/staff/mar", requireStaffAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const mar = await storage.getMARForFacility(
      req.session.facilityId!,
      targetDate
    );
    res.json(mar);
  } catch (error) {
    res.status(500).json({ message: "Failed to get MAR" });
  }
});

// Get MAR for specific resident
app.get("/api/staff/residents/:residentId/mar", requireStaffAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const mar = await storage.getMARForResident(
      parseInt(req.params.residentId),
      targetDate
    );
    res.json(mar);
  } catch (error) {
    res.status(500).json({ message: "Failed to get MAR" });
  }
});

// Get upcoming meds (next N hours)
app.get("/api/staff/mar/upcoming", requireStaffAuth, async (req, res) => {
  try {
    const { hours = 2 } = req.query;
    
    const upcoming = await storage.getUpcomingMeds(
      req.session.facilityId!,
      parseInt(hours as string)
    );
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: "Failed to get upcoming meds" });
  }
});

// Log medication administration
app.post("/api/staff/mar", requireStaffAuth, async (req, res) => {
  try {
    const staff = await storage.getStaffById(req.session.staffId!);
    const medication = await storage.getMedication(req.body.medicationId);
    
    if (!medication || medication.facilityId !== req.session.facilityId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Check permissions for controlled substances
    if (medication.isControlled && !staff?.permissions?.canAdministerControlled) {
      return res.status(403).json({ message: "Not authorized to administer controlled substances" });
    }
    
    // Require witness for controlled substances
    if (medication.isControlled && req.body.status === 'given' && !req.body.witnessedBy) {
      return res.status(400).json({ message: "Controlled substances require a witness" });
    }
    
    const log = await storage.createMedicationLog({
      ...req.body,
      facilityId: req.session.facilityId!,
      administeredBy: req.session.staffId!,
      administeredTime: req.body.status === 'given' ? new Date() : null,
    });
    
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: "Failed to log medication" });
  }
});

// Update medication log
app.patch("/api/staff/mar/:id", requireStaffAuth, async (req, res) => {
  try {
    const log = await storage.getMedicationLog(parseInt(req.params.id));
    if (!log || log.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Log not found" });
    }
    
    const updated = await storage.updateMedicationLog(log.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update log" });
  }
});

// ============================================================================
// DAILY NOTES ROUTES
// ============================================================================

// Get daily notes for facility
app.get("/api/staff/daily-notes", requireStaffAuth, async (req, res) => {
  try {
    const { date, shift, residentId } = req.query;
    
    const notes = await storage.getDailyNotes({
      facilityId: req.session.facilityId!,
      date: date as string,
      shift: shift as string,
      residentId: residentId ? parseInt(residentId as string) : undefined,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Failed to get daily notes" });
  }
});

// Get daily note for specific resident/date/shift
app.get("/api/staff/residents/:residentId/daily-notes/:date/:shift", requireStaffAuth, async (req, res) => {
  try {
    const note = await storage.getDailyNote(
      parseInt(req.params.residentId),
      req.params.date,
      req.params.shift
    );
    res.json(note || null);
  } catch (error) {
    res.status(500).json({ message: "Failed to get daily note" });
  }
});

// Create or update daily note
app.post("/api/staff/daily-notes", requireStaffAuth, async (req, res) => {
  try {
    // Check if note already exists for this resident/date/shift
    const existing = await storage.getDailyNote(
      req.body.residentId,
      req.body.date,
      req.body.shift
    );
    
    let note;
    if (existing) {
      // Update existing
      note = await storage.updateDailyNote(existing.id, {
        ...req.body,
        staffId: req.session.staffId!,
      });
    } else {
      // Create new
      note = await storage.createDailyNote({
        ...req.body,
        facilityId: req.session.facilityId!,
        staffId: req.session.staffId!,
      });
    }
    
    res.status(existing ? 200 : 201).json(note);
  } catch (error) {
    res.status(500).json({ message: "Failed to save daily note" });
  }
});

// Get residents with missing notes for today
app.get("/api/staff/daily-notes/missing", requireStaffAuth, async (req, res) => {
  try {
    const { shift } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const missing = await storage.getResidentsMissingNotes(
      req.session.facilityId!,
      today,
      shift as string
    );
    res.json(missing);
  } catch (error) {
    res.status(500).json({ message: "Failed to get missing notes" });
  }
});

// ============================================================================
// INCIDENT REPORTS ROUTES
// ============================================================================

// Get incidents
app.get("/api/staff/incidents", requireStaffAuth, async (req, res) => {
  try {
    const { status, residentId, startDate, endDate } = req.query;
    
    const incidents = await storage.getIncidents({
      facilityId: req.session.facilityId!,
      status: status as string,
      residentId: residentId ? parseInt(residentId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Failed to get incidents" });
  }
});

// Get single incident
app.get("/api/staff/incidents/:id", requireStaffAuth, async (req, res) => {
  try {
    const incident = await storage.getIncident(parseInt(req.params.id));
    if (!incident || incident.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Incident not found" });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Failed to get incident" });
  }
});

// Create incident
app.post("/api/staff/incidents", requireStaffAuth, async (req, res) => {
  try {
    // Auto-flag DSHS reportable incidents
    const DSHS_REPORTABLE_TYPES = ['abuse_allegation', 'elopement', 'death'];
    const dshsReportable = DSHS_REPORTABLE_TYPES.includes(req.body.type) ||
      (req.body.type === 'fall' && req.body.hasInjury) ||
      (req.body.injuries?.severity === 'severe');
    
    const incident = await storage.createIncident({
      ...req.body,
      facilityId: req.session.facilityId!,
      reportedBy: req.session.staffId!,
      dshsReportable,
    });
    
    // Notify owner for DSHS reportable incidents
    if (dshsReportable) {
      await notifyOwnerOfIncident(incident);
    }
    
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: "Failed to create incident" });
  }
});

// Update incident
app.patch("/api/staff/incidents/:id", requireStaffAuth, async (req, res) => {
  try {
    const incident = await storage.getIncident(parseInt(req.params.id));
    if (!incident || incident.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Incident not found" });
    }
    
    const updated = await storage.updateIncident(incident.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update incident" });
  }
});

// ============================================================================
// CARE PLANS ROUTES
// ============================================================================

// Get care plans for resident
app.get("/api/staff/residents/:residentId/care-plans", requireStaffAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const carePlans = await storage.getResidentCarePlans(
      parseInt(req.params.residentId),
      status as string
    );
    res.json(carePlans);
  } catch (error) {
    res.status(500).json({ message: "Failed to get care plans" });
  }
});

// Create care plan (shift_lead or higher)
app.post("/api/staff/care-plans", requireStaffAuth, async (req, res) => {
  try {
    const staff = await storage.getStaffById(req.session.staffId!);
    if (!staff?.permissions?.canEditCarePlans) {
      return res.status(403).json({ message: "Not authorized to create care plans" });
    }
    
    const carePlan = await storage.createCarePlan({
      ...req.body,
      facilityId: req.session.facilityId!,
      createdBy: req.session.staffId!,
    });
    res.status(201).json(carePlan);
  } catch (error) {
    res.status(500).json({ message: "Failed to create care plan" });
  }
});

// Update care plan
app.patch("/api/staff/care-plans/:id", requireStaffAuth, async (req, res) => {
  try {
    const staff = await storage.getStaffById(req.session.staffId!);
    if (!staff?.permissions?.canEditCarePlans) {
      return res.status(403).json({ message: "Not authorized to edit care plans" });
    }
    
    const carePlan = await storage.getCarePlan(parseInt(req.params.id));
    if (!carePlan || carePlan.facilityId !== req.session.facilityId) {
      return res.status(404).json({ message: "Care plan not found" });
    }
    
    const updated = await storage.updateCarePlan(carePlan.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update care plan" });
  }
});

// ============================================================================
// VITALS ROUTES
// ============================================================================

// Get vitals history for resident
app.get("/api/staff/residents/:residentId/vitals", requireStaffAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const vitals = await storage.getResidentVitals(
      parseInt(req.params.residentId),
      parseInt(days as string)
    );
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ message: "Failed to get vitals" });
  }
});

// Log vitals
app.post("/api/staff/vitals", requireStaffAuth, async (req, res) => {
  try {
    const vitals = await storage.createVitalsLog({
      ...req.body,
      facilityId: req.session.facilityId!,
      recordedBy: req.session.staffId!,
      recordedAt: new Date(),
    });
    res.status(201).json(vitals);
  } catch (error) {
    res.status(500).json({ message: "Failed to log vitals" });
  }
});

// ============================================================================
// SHIFT HANDOFF ROUTES
// ============================================================================

// Get handoff for shift
app.get("/api/staff/handoff/:date/:fromShift", requireStaffAuth, async (req, res) => {
  try {
    const handoff = await storage.getShiftHandoff(
      req.session.facilityId!,
      req.params.date,
      req.params.fromShift
    );
    res.json(handoff);
  } catch (error) {
    res.status(500).json({ message: "Failed to get handoff" });
  }
});

// Create/update handoff
app.post("/api/staff/handoff", requireStaffAuth, async (req, res) => {
  try {
    const existing = await storage.getShiftHandoff(
      req.session.facilityId!,
      req.body.date,
      req.body.fromShift
    );
    
    let handoff;
    if (existing) {
      handoff = await storage.updateShiftHandoff(existing.id, {
        ...req.body,
        outgoingStaff: req.session.staffId!,
      });
    } else {
      handoff = await storage.createShiftHandoff({
        ...req.body,
        facilityId: req.session.facilityId!,
        outgoingStaff: req.session.staffId!,
      });
    }
    
    res.json(handoff);
  } catch (error) {
    res.status(500).json({ message: "Failed to save handoff" });
  }
});

// Acknowledge handoff
app.post("/api/staff/handoff/:id/acknowledge", requireStaffAuth, async (req, res) => {
  try {
    await storage.updateShiftHandoff(parseInt(req.params.id), {
      incomingStaff: req.session.staffId!,
      acknowledgedAt: new Date(),
    });
    res.json({ message: "Handoff acknowledged" });
  } catch (error) {
    res.status(500).json({ message: "Failed to acknowledge handoff" });
  }
});

// ============================================================================
// OFFLINE SYNC ROUTES
// ============================================================================

// Sync offline data
app.post("/api/staff/sync", requireStaffAuth, async (req, res) => {
  try {
    const { items } = req.body; // Array of { tableName, localId, action, payload }
    
    const results = [];
    
    for (const item of items) {
      try {
        let result;
        
        switch (item.tableName) {
          case 'medication_logs':
            if (item.action === 'create') {
              result = await storage.createMedicationLog({
                ...item.payload,
                localId: item.localId,
                facilityId: req.session.facilityId!,
                administeredBy: req.session.staffId!,
                syncStatus: 'synced',
                syncedAt: new Date(),
              });
            }
            break;
            
          case 'daily_notes':
            if (item.action === 'create') {
              result = await storage.createDailyNote({
                ...item.payload,
                localId: item.localId,
                facilityId: req.session.facilityId!,
                staffId: req.session.staffId!,
                syncStatus: 'synced',
                syncedAt: new Date(),
              });
            }
            break;
            
          case 'incident_reports':
            if (item.action === 'create') {
              result = await storage.createIncident({
                ...item.payload,
                localId: item.localId,
                facilityId: req.session.facilityId!,
                reportedBy: req.session.staffId!,
                syncStatus: 'synced',
                syncedAt: new Date(),
              });
            }
            break;
            
          case 'vitals_log':
            if (item.action === 'create') {
              result = await storage.createVitalsLog({
                ...item.payload,
                localId: item.localId,
                facilityId: req.session.facilityId!,
                recordedBy: req.session.staffId!,
                syncStatus: 'synced',
              });
            }
            break;
        }
        
        results.push({
          localId: item.localId,
          success: true,
          serverId: result?.id,
        });
      } catch (err) {
        results.push({
          localId: item.localId,
          success: false,
          error: (err as Error).message,
        });
      }
    }
    
    // Update staff's last sync time
    await storage.updateStaffAuth(req.session.staffId!, {
      lastSyncAt: new Date(),
    });
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: "Sync failed" });
  }
});

// Get data for offline cache
app.get("/api/staff/sync/cache", requireStaffAuth, async (req, res) => {
  try {
    const [residents, medications, staff] = await Promise.all([
      storage.getResidentsByFacility(req.session.facilityId!, 'active'),
      storage.getActiveMedicationsByFacility(req.session.facilityId!),
      storage.getStaffByFacility(req.session.facilityId!),
    ]);
    
    res.json({
      residents,
      medications,
      staff,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get cache data" });
  }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

app.get("/api/staff/dashboard", requireStaffAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const currentShift = currentHour < 8 ? 'night' : currentHour < 16 ? 'day' : 'swing';
    
    const [
      residents,
      upcomingMeds,
      pendingNotes,
      openIncidents,
    ] = await Promise.all([
      storage.getResidentsByFacility(req.session.facilityId!, 'active'),
      storage.getUpcomingMeds(req.session.facilityId!, 2),
      storage.getResidentsMissingNotes(req.session.facilityId!, today, currentShift),
      storage.getIncidents({ facilityId: req.session.facilityId!, status: 'open' }),
    ]);
    
    res.json({
      stats: {
        totalResidents: residents.length,
        upcomingMeds: upcomingMeds.length,
        pendingNotes: pendingNotes.length,
        openIncidents: openIncidents.length,
      },
      upcomingMeds: upcomingMeds.slice(0, 10),
      currentShift,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get dashboard" });
  }
});

// ============================================================================
// DSHS REPORTS (Owner only)
// ============================================================================

app.get("/api/owner/ehr/reports", requireOwnerAuth, async (req, res) => {
  try {
    const facilities = await storage.getOwnerFacilities(req.session.ownerId!);
    const facilityIds = facilities.map(f => f.id);
    
    const reports = await storage.getEHRReports(facilityIds);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to get reports" });
  }
});

app.post("/api/owner/ehr/reports/generate", requireOwnerAuth, async (req, res) => {
  try {
    const { facilityId, reportType, periodStart, periodEnd, residentId } = req.body;
    
    // Verify ownership
    const facilities = await storage.getOwnerFacilities(req.session.ownerId!);
    if (!facilities.find(f => f.id === facilityId)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Generate report data based on type
    let data;
    let title;
    
    switch (reportType) {
      case 'monthly_summary':
        data = await generateMonthlySummary(facilityId, periodStart, periodEnd);
        title = `Monthly Summary ${periodStart} to ${periodEnd}`;
        break;
        
      case 'mar_export':
        data = await generateMARExport(facilityId, periodStart, periodEnd, residentId);
        title = `MAR Export ${periodStart} to ${periodEnd}`;
        break;
        
      case 'incident':
        data = await storage.getIncidents({ facilityId, startDate: periodStart, endDate: periodEnd });
        title = `Incident Report ${periodStart} to ${periodEnd}`;
        break;
        
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }
    
    // Save report record
    const report = await storage.createEHRReport({
      facilityId,
      generatedBy: req.session.ownerId!,
      reportType,
      title,
      periodStart,
      periodEnd,
      residentId,
      data,
    });
    
    // TODO: Generate PDF and update fileUrl
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.staffId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function getDefaultPermissions(role: string) {
  switch (role) {
    case 'shift_lead':
      return {
        canAdministerMeds: true,
        canAdministerControlled: true,
        canFileIncidents: true,
        canEditCarePlans: true,
        canViewAllResidents: true,
        canInviteStaff: false,
      };
    case 'med_tech':
      return {
        canAdministerMeds: true,
        canAdministerControlled: true,
        canFileIncidents: true,
        canEditCarePlans: false,
        canViewAllResidents: true,
        canInviteStaff: false,
      };
    case 'nurse':
      return {
        canAdministerMeds: true,
        canAdministerControlled: true,
        canFileIncidents: true,
        canEditCarePlans: true,
        canViewAllResidents: true,
        canInviteStaff: false,
      };
    case 'caregiver':
    default:
      return {
        canAdministerMeds: true,
        canAdministerControlled: false,
        canFileIncidents: true,
        canEditCarePlans: false,
        canViewAllResidents: true,
        canInviteStaff: false,
      };
  }
}

async function notifyOwnerOfIncident(incident: any) {
  // TODO: Implement email/push notification to owner
  console.log('DSHS reportable incident:', incident.id);
}

async function generateMonthlySummary(facilityId: number, start: string, end: string) {
  // TODO: Implement monthly summary generation
  return {};
}

async function generateMARExport(facilityId: number, start: string, end: string, residentId?: number) {
  // TODO: Implement MAR export
  return {};
}