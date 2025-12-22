import { Express } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "../storage";
import {
  requireStaffAuth,
  requireStaffRole,
  requirePermission,
} from "../middleware/staff-auth";

export function registerEhrRoutes(app: Express) {
  // ============================================================================
  // STAFF AUTHENTICATION ROUTES
  // ============================================================================

  /**
   * Staff login with email and password
   */
  app.post("/api/ehr/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const staff = await storage.getStaffAuthByEmail(email);
      if (!staff) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!staff.passwordHash) {
        return res.status(401).json({
          error: "Password not set. Please complete account setup first.",
        });
      }

      if (staff.status !== "active") {
        return res.status(401).json({
          error: "Account is not active. Please contact your administrator.",
        });
      }

      const isValid = await bcrypt.compare(password, staff.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await storage.updateStaffAuth(staff.id, { lastLoginAt: new Date() });

      // Set session
      req.session.staffId = staff.id;
      req.session.staffFacilityId = staff.facilityId;
      req.session.staffRole = staff.role;

      // Return staff data without sensitive fields
      const { passwordHash: _, pin: __, inviteToken: ___, ...staffData } = staff;

      res.json({ staff: staffData });
    } catch (error) {
      console.error("Error during staff login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * Staff login with PIN (for quick access at facility)
   */
  app.post("/api/ehr/auth/pin-login", async (req, res) => {
    try {
      const { facilityId, pin } = req.body;

      if (!facilityId || !pin) {
        return res.status(400).json({ error: "Facility ID and PIN are required" });
      }

      // Get all staff for facility and check PIN
      const facilityStaff = await storage.getStaffAuthByFacility(facilityId);
      const staff = facilityStaff.find((s) => s.pin === pin && s.status === "active");

      if (!staff) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      // Update last login
      await storage.updateStaffAuth(staff.id, { lastLoginAt: new Date() });

      // Set session
      req.session.staffId = staff.id;
      req.session.staffFacilityId = staff.facilityId;
      req.session.staffRole = staff.role;

      // Return staff data without sensitive fields
      const { passwordHash: _, pin: __, inviteToken: ___, ...staffData } = staff;

      res.json({ staff: staffData });
    } catch (error) {
      console.error("Error during PIN login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * Staff quick login with facility PIN + name (no account needed)
   * This creates a temporary session for the staff member
   */
  app.post("/api/ehr/auth/facility-pin-login", async (req, res) => {
    try {
      const { facilityPin, staffName } = req.body;

      if (!facilityPin || !staffName) {
        return res.status(400).json({ error: "Facility PIN and staff name are required" });
      }

      if (facilityPin.length !== 4 || !/^\d{4}$/.test(facilityPin)) {
        return res.status(400).json({ error: "Invalid PIN format" });
      }

      // Find facility by PIN
      const facility = await storage.getFacilityByPin(facilityPin);
      if (!facility) {
        return res.status(401).json({ error: "Invalid facility PIN" });
      }

      // Create a temporary staff session (no persistent staff record needed)
      // We'll store the staff name in the session for display purposes
      req.session.staffId = `temp-${Date.now()}`;
      req.session.staffFacilityId = facility.id;
      req.session.staffRole = "caregiver";
      req.session.staffName = staffName;
      req.session.isTempStaff = true;

      res.json({
        staff: {
          id: req.session.staffId,
          facilityId: facility.id,
          firstName: staffName.split(" ")[0] || staffName,
          lastName: staffName.split(" ").slice(1).join(" ") || "",
          role: "caregiver",
          permissions: {
            canAdministerMeds: true,
            canAdministerControlled: false,
            canFileIncidents: true,
            canEditResidents: false,
          },
        },
        facility: {
          id: facility.id,
          name: facility.name,
        },
      });
    } catch (error) {
      console.error("Error during facility PIN login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * Get current authenticated staff member
   */
  app.get("/api/ehr/auth/me", requireStaffAuth, async (req, res) => {
    try {
      const staff = req.staff!;
      const { passwordHash: _, pin: __, inviteToken: ___, ...staffData } = staff;
      res.json(staffData);
    } catch (error) {
      console.error("Error getting current staff:", error);
      res.status(500).json({ error: "Failed to get staff data" });
    }
  });

  /**
   * Staff logout
   */
  app.post("/api/ehr/auth/logout", (req, res) => {
    req.session.staffId = null;
    req.session.staffFacilityId = null;
    req.session.staffRole = null;
    res.json({ success: true });
  });

  /**
   * Validate staff invite token
   */
  app.get("/api/ehr/auth/invite/validate", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }

      const staff = await storage.getStaffAuthByInviteToken(token);
      if (!staff) {
        return res.status(404).json({ error: "Invalid or expired invite token" });
      }

      if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
        return res.status(400).json({ error: "Invite token has expired" });
      }

      res.json({
        valid: true,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
      });
    } catch (error) {
      console.error("Error validating invite token:", error);
      res.status(500).json({ error: "Failed to validate token" });
    }
  });

  /**
   * Complete staff account setup (set password from invite)
   */
  app.post("/api/ehr/auth/invite/complete", async (req, res) => {
    try {
      const { token, password, pin } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
        return res.status(400).json({ error: "PIN must be 4-6 digits" });
      }

      const staff = await storage.getStaffAuthByInviteToken(token);
      if (!staff) {
        return res.status(404).json({ error: "Invalid or expired invite token" });
      }

      if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
        return res.status(400).json({ error: "Invite token has expired" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update staff account
      await storage.updateStaffAuth(staff.id, {
        passwordHash,
        pin: pin || null,
        status: "active",
        inviteToken: null,
        inviteExpiresAt: null,
        lastLoginAt: new Date(),
      } as any);

      // Set session
      req.session.staffId = staff.id;
      req.session.staffFacilityId = staff.facilityId;
      req.session.staffRole = staff.role;

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing staff setup:", error);
      res.status(500).json({ error: "Failed to complete account setup" });
    }
  });

  // ============================================================================
  // STAFF MANAGEMENT ROUTES (Admin only)
  // ============================================================================

  /**
   * Get all staff for a facility
   */
  app.get(
    "/api/ehr/facilities/:facilityId/staff",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { facilityId } = req.params;

        // Verify access to facility
        if (req.staff!.facilityId !== facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const staffList = await storage.getStaffAuthByFacility(facilityId);

        // Remove sensitive data
        const sanitizedList = staffList.map((s) => {
          const { passwordHash: _, pin: __, inviteToken: ___, ...data } = s;
          return data;
        });

        res.json(sanitizedList);
      } catch (error) {
        console.error("Error getting facility staff:", error);
        res.status(500).json({ error: "Failed to get staff list" });
      }
    }
  );

  /**
   * Invite new staff member
   */
  app.post(
    "/api/ehr/facilities/:facilityId/staff/invite",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { email, firstName, lastName, role, permissions } = req.body;

        // Verify access to facility
        if (req.staff!.facilityId !== facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        if (!email || !firstName || !lastName) {
          return res.status(400).json({
            error: "Email, first name, and last name are required",
          });
        }

        // Check if email already exists
        const existing = await storage.getStaffAuthByEmail(email);
        if (existing) {
          return res.status(400).json({ error: "Email already in use" });
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const inviteExpiresAt = new Date();
        inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days

        const newStaff = await storage.createStaffAuth({
          facilityId,
          email,
          firstName,
          lastName,
          role: role || "caregiver",
          permissions: permissions || {
            canAdministerMeds: true,
            canAdministerControlled: false,
            canFileIncidents: true,
            canEditResidents: false,
          },
          status: "inactive",
          inviteToken,
          inviteExpiresAt,
        });

        // In production, send invite email here
        // await sendInviteEmail(email, inviteToken);

        const { passwordHash: _, pin: __, inviteToken: ___, ...staffData } = newStaff;

        res.json({
          staff: staffData,
          inviteLink: `/ehr/setup?token=${inviteToken}`,
        });
      } catch (error) {
        console.error("Error inviting staff:", error);
        res.status(500).json({ error: "Failed to invite staff member" });
      }
    }
  );

  /**
   * Update staff member
   */
  app.patch(
    "/api/ehr/staff/:staffId",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { staffId } = req.params;
        const { role, permissions, status } = req.body;

        const targetStaff = await storage.getStaffAuth(staffId);
        if (!targetStaff) {
          return res.status(404).json({ error: "Staff member not found" });
        }

        // Verify same facility
        if (req.staff!.facilityId !== targetStaff.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Prevent self-demotion
        if (staffId === req.staff!.id && role && role !== req.staff!.role) {
          return res.status(400).json({ error: "Cannot change your own role" });
        }

        const updateData: any = {};
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;
        if (status) updateData.status = status;

        const updated = await storage.updateStaffAuth(staffId, updateData);
        if (!updated) {
          return res.status(404).json({ error: "Staff member not found" });
        }

        const { passwordHash: _, pin: __, inviteToken: ___, ...staffData } = updated;

        res.json(staffData);
      } catch (error) {
        console.error("Error updating staff:", error);
        res.status(500).json({ error: "Failed to update staff member" });
      }
    }
  );

  /**
   * Delete staff member
   */
  app.delete(
    "/api/ehr/staff/:staffId",
    requireStaffAuth,
    requireStaffRole("admin"),
    async (req, res) => {
      try {
        const { staffId } = req.params;

        const targetStaff = await storage.getStaffAuth(staffId);
        if (!targetStaff) {
          return res.status(404).json({ error: "Staff member not found" });
        }

        // Verify same facility
        if (req.staff!.facilityId !== targetStaff.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Prevent self-deletion
        if (staffId === req.staff!.id) {
          return res.status(400).json({ error: "Cannot delete your own account" });
        }

        await storage.deleteStaffAuth(staffId);

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting staff:", error);
        res.status(500).json({ error: "Failed to delete staff member" });
      }
    }
  );

  /**
   * Update own profile (password, PIN)
   */
  app.patch("/api/ehr/auth/profile", requireStaffAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword, pin } = req.body;
      const staffId = req.staff!.id;

      const staff = await storage.getStaffAuth(staffId);
      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }

      const updateData: any = {};

      // Update password if provided
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required" });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({
            error: "New password must be at least 8 characters",
          });
        }

        const isValid = await bcrypt.compare(currentPassword, staff.passwordHash || "");
        if (!isValid) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      // Update PIN if provided
      if (pin !== undefined) {
        if (pin === null || pin === "") {
          updateData.pin = null;
        } else if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
          return res.status(400).json({ error: "PIN must be 4-6 digits" });
        } else {
          updateData.pin = pin;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }

      await storage.updateStaffAuth(staffId, updateData);

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ============================================================================
  // RESIDENTS ROUTES
  // ============================================================================

  /**
   * Get all residents for the staff's facility
   */
  app.get("/api/ehr/residents", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const status = req.query.status as string | undefined;

      const residents = await storage.getResidentsByFacility(facilityId, status);
      res.json(residents);
    } catch (error) {
      console.error("Error getting residents:", error);
      res.status(500).json({ error: "Failed to get residents" });
    }
  });

  /**
   * Get a single resident
   */
  app.get("/api/ehr/residents/:residentId", requireStaffAuth, async (req, res) => {
    try {
      const { residentId } = req.params;
      const resident = await storage.getResident(residentId);

      if (!resident) {
        return res.status(404).json({ error: "Resident not found" });
      }

      // Verify same facility
      if (resident.facilityId !== req.staff!.facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(resident);
    } catch (error) {
      console.error("Error getting resident:", error);
      res.status(500).json({ error: "Failed to get resident" });
    }
  });

  /**
   * Create a new resident
   */
  app.post(
    "/api/ehr/residents",
    requireStaffAuth,
    requirePermission("canEditResidents"),
    async (req, res) => {
      try {
        const facilityId = req.staff!.facilityId;
        const {
          firstName,
          lastName,
          preferredName,
          dateOfBirth,
          photo,
          roomNumber,
          admissionDate,
          status,
          primaryPhysician,
          emergencyContacts,
          diagnoses,
          allergies,
          dietaryRestrictions,
          codeStatus,
          insuranceInfo,
          preferences,
          notes,
        } = req.body;

        if (!firstName || !lastName || !dateOfBirth) {
          return res.status(400).json({
            error: "First name, last name, and date of birth are required",
          });
        }

        const resident = await storage.createResident({
          facilityId,
          firstName,
          lastName,
          preferredName,
          dateOfBirth,
          photo,
          roomNumber,
          admissionDate,
          status: status || "active",
          primaryPhysician,
          emergencyContacts: emergencyContacts || [],
          diagnoses: diagnoses || [],
          allergies: allergies || [],
          dietaryRestrictions: dietaryRestrictions || [],
          codeStatus,
          insuranceInfo,
          preferences,
          notes,
        });

        res.status(201).json(resident);
      } catch (error) {
        console.error("Error creating resident:", error);
        res.status(500).json({ error: "Failed to create resident" });
      }
    }
  );

  /**
   * Update a resident
   */
  app.patch(
    "/api/ehr/residents/:residentId",
    requireStaffAuth,
    requirePermission("canEditResidents"),
    async (req, res) => {
      try {
        const { residentId } = req.params;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updated = await storage.updateResident(residentId, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating resident:", error);
        res.status(500).json({ error: "Failed to update resident" });
      }
    }
  );

  /**
   * Delete a resident (soft delete by setting status to discharged)
   */
  app.delete(
    "/api/ehr/residents/:residentId",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { residentId } = req.params;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Soft delete - mark as discharged
        await storage.updateResident(residentId, { status: "discharged" });
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting resident:", error);
        res.status(500).json({ error: "Failed to delete resident" });
      }
    }
  );

  // ============================================================================
  // MEDICATIONS ROUTES
  // ============================================================================

  /**
   * Get all medications for a resident
   */
  app.get(
    "/api/ehr/residents/:residentId/medications",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const activeOnly = req.query.active === "true";

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const medications = await storage.getMedicationsByResident(residentId, activeOnly);
        res.json(medications);
      } catch (error) {
        console.error("Error getting medications:", error);
        res.status(500).json({ error: "Failed to get medications" });
      }
    }
  );

  /**
   * Get a single medication
   */
  app.get("/api/ehr/medications/:medicationId", requireStaffAuth, async (req, res) => {
    try {
      const { medicationId } = req.params;
      const medication = await storage.getMedication(medicationId);

      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }

      if (medication.facilityId !== req.staff!.facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(medication);
    } catch (error) {
      console.error("Error getting medication:", error);
      res.status(500).json({ error: "Failed to get medication" });
    }
  });

  /**
   * Add a medication to a resident
   */
  app.post(
    "/api/ehr/residents/:residentId/medications",
    requireStaffAuth,
    requirePermission("canEditResidents"),
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const facilityId = req.staff!.facilityId;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const {
          name,
          dosage,
          route,
          frequency,
          instructions,
          prescribedBy,
          startDate,
          endDate,
          isControlled,
          status,
          isPrn,
          prnReason,
        } = req.body;

        if (!name || !dosage || !route || !frequency) {
          return res.status(400).json({
            error: "Name, dosage, route, and frequency are required",
          });
        }

        const medication = await storage.createMedication({
          residentId,
          facilityId,
          name,
          dosage,
          route,
          frequency,
          instructions,
          prescribedBy,
          startDate,
          endDate,
          isControlled: isControlled || false,
          status: status || "active",
          isPRN: isPrn || false,
          prnReason,
        });

        res.status(201).json(medication);
      } catch (error) {
        console.error("Error creating medication:", error);
        res.status(500).json({ error: "Failed to create medication" });
      }
    }
  );

  /**
   * Update a medication
   */
  app.patch(
    "/api/ehr/medications/:medicationId",
    requireStaffAuth,
    requirePermission("canEditResidents"),
    async (req, res) => {
      try {
        const { medicationId } = req.params;

        const medication = await storage.getMedication(medicationId);
        if (!medication) {
          return res.status(404).json({ error: "Medication not found" });
        }

        if (medication.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updated = await storage.updateMedication(medicationId, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating medication:", error);
        res.status(500).json({ error: "Failed to update medication" });
      }
    }
  );

  /**
   * Discontinue a medication
   */
  app.post(
    "/api/ehr/medications/:medicationId/discontinue",
    requireStaffAuth,
    requirePermission("canEditResidents"),
    async (req, res) => {
      try {
        const { medicationId } = req.params;

        const medication = await storage.getMedication(medicationId);
        if (!medication) {
          return res.status(404).json({ error: "Medication not found" });
        }

        if (medication.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const today = new Date().toISOString().split("T")[0];
        const updated = await storage.updateMedication(medicationId, {
          status: "discontinued",
          endDate: today,
        });

        res.json(updated);
      } catch (error) {
        console.error("Error discontinuing medication:", error);
        res.status(500).json({ error: "Failed to discontinue medication" });
      }
    }
  );

  // ============================================================================
  // MEDICATION ADMINISTRATION RECORD (MAR) ROUTES
  // ============================================================================

  /**
   * Get medication logs for a resident (MAR)
   */
  app.get(
    "/api/ehr/residents/:residentId/mar",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const { startDate, endDate } = req.query;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const logs = await storage.getMedicationLogsByResident(residentId, start, end);
        res.json(logs);
      } catch (error) {
        console.error("Error getting MAR:", error);
        res.status(500).json({ error: "Failed to get medication logs" });
      }
    }
  );

  /**
   * Get facility MAR for a specific date
   */
  app.get("/api/ehr/mar", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

      const logs = await storage.getMedicationLogsByFacility(facilityId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error getting facility MAR:", error);
      res.status(500).json({ error: "Failed to get medication logs" });
    }
  });

  /**
   * Record medication administration
   */
  app.post(
    "/api/ehr/mar",
    requireStaffAuth,
    requirePermission("canAdministerMeds"),
    async (req, res) => {
      try {
        const staffId = req.staff!.id;
        const facilityId = req.staff!.facilityId;

        const {
          medicationId,
          residentId,
          scheduledTime,
          status,
          notes,
          witnessedBy,
        } = req.body;

        if (!medicationId || !residentId || !scheduledTime || !status) {
          return res.status(400).json({
            error: "Medication ID, resident ID, scheduled time, and status are required",
          });
        }

        // Verify medication exists and belongs to facility
        const medication = await storage.getMedication(medicationId);
        if (!medication) {
          return res.status(404).json({ error: "Medication not found" });
        }

        if (medication.facilityId !== facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Check controlled substance permission
        if (medication.isControlled && !req.staffPermissions?.canAdministerControlled) {
          return res.status(403).json({
            error: "You do not have permission to administer controlled substances",
          });
        }

        // Controlled substances require witness
        if (medication.isControlled && !witnessedBy) {
          return res.status(400).json({
            error: "Controlled substance administration requires a witness",
          });
        }

        const log = await storage.createMedicationLog({
          medicationId,
          residentId,
          facilityId,
          administeredBy: staffId,
          scheduledTime: new Date(scheduledTime),
          administeredTime: status === "given" ? new Date() : null,
          status,
          notes,
          witnessedBy,
        });

        res.status(201).json(log);
      } catch (error) {
        console.error("Error recording medication administration:", error);
        res.status(500).json({ error: "Failed to record medication administration" });
      }
    }
  );

  /**
   * Update a medication log entry
   */
  app.patch(
    "/api/ehr/mar/:logId",
    requireStaffAuth,
    requirePermission("canAdministerMeds"),
    async (req, res) => {
      try {
        const { logId } = req.params;

        const log = await storage.getMedicationLog(logId);
        if (!log) {
          return res.status(404).json({ error: "Medication log not found" });
        }

        if (log.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updated = await storage.updateMedicationLog(logId, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating medication log:", error);
        res.status(500).json({ error: "Failed to update medication log" });
      }
    }
  );

  // ============================================================================
  // DAILY NOTES ROUTES
  // ============================================================================

  /**
   * Get daily notes for a resident
   */
  app.get(
    "/api/ehr/residents/:residentId/notes",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const notes = await storage.getDailyNotesByResident(residentId, limit);
        res.json(notes);
      } catch (error) {
        console.error("Error getting daily notes:", error);
        res.status(500).json({ error: "Failed to get daily notes" });
      }
    }
  );

  /**
   * Get facility daily notes for a specific date
   */
  app.get("/api/ehr/notes", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

      const notes = await storage.getDailyNotesByFacility(facilityId, date);
      res.json(notes);
    } catch (error) {
      console.error("Error getting facility daily notes:", error);
      res.status(500).json({ error: "Failed to get daily notes" });
    }
  });

  /**
   * Get a single daily note
   */
  app.get("/api/ehr/notes/:noteId", requireStaffAuth, async (req, res) => {
    try {
      const { noteId } = req.params;
      const note = await storage.getDailyNote(noteId);

      if (!note) {
        return res.status(404).json({ error: "Daily note not found" });
      }

      if (note.facilityId !== req.staff!.facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(note);
    } catch (error) {
      console.error("Error getting daily note:", error);
      res.status(500).json({ error: "Failed to get daily note" });
    }
  });

  /**
   * Create a daily note
   */
  app.post("/api/ehr/notes", requireStaffAuth, async (req, res) => {
    try {
      const staffId = req.staff!.id;
      const facilityId = req.staff!.facilityId;

      const {
        residentId,
        date,
        shift,
        adls,
        mood,
        appetite,
        painLevel,
        vitalSigns,
        notes,
        concerns,
        hasConcerns,
      } = req.body;

      if (!residentId || !date || !shift) {
        return res.status(400).json({
          error: "Resident ID, date, and shift are required",
        });
      }

      // Verify resident belongs to facility
      const resident = await storage.getResident(residentId);
      if (!resident) {
        return res.status(404).json({ error: "Resident not found" });
      }

      if (resident.facilityId !== facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const dailyNote = await storage.createDailyNote({
        residentId,
        facilityId,
        staffId,
        date,
        shift,
        adls,
        mood,
        appetite,
        painLevel,
        vitalSigns,
        notes,
        concerns,
        hasConcerns,
      });

      res.status(201).json(dailyNote);
    } catch (error) {
      console.error("Error creating daily note:", error);
      res.status(500).json({ error: "Failed to create daily note" });
    }
  });

  /**
   * Update a daily note
   */
  app.patch("/api/ehr/notes/:noteId", requireStaffAuth, async (req, res) => {
    try {
      const { noteId } = req.params;

      const note = await storage.getDailyNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Daily note not found" });
      }

      if (note.facilityId !== req.staff!.facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Only allow editing own notes or if admin/manager
      if (note.staffId !== req.staff!.id && !["admin", "manager"].includes(req.staff!.role)) {
        return res.status(403).json({ error: "Can only edit your own notes" });
      }

      const updated = await storage.updateDailyNote(noteId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating daily note:", error);
      res.status(500).json({ error: "Failed to update daily note" });
    }
  });

  /**
   * Delete a daily note
   */
  app.delete(
    "/api/ehr/notes/:noteId",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { noteId } = req.params;

        const note = await storage.getDailyNote(noteId);
        if (!note) {
          return res.status(404).json({ error: "Daily note not found" });
        }

        if (note.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        await storage.deleteDailyNote(noteId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting daily note:", error);
        res.status(500).json({ error: "Failed to delete daily note" });
      }
    }
  );

  // ============================================================================
  // INCIDENT REPORTS ROUTES
  // ============================================================================

  /**
   * Get incident reports for facility
   */
  app.get("/api/ehr/incidents", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const { status, dshsReportable } = req.query;

      const filters: { status?: string; dshsReportable?: boolean } = {};
      if (status) filters.status = status as string;
      if (dshsReportable !== undefined) filters.dshsReportable = dshsReportable === "true";

      const incidents = await storage.getIncidentReportsByFacility(facilityId, filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error getting incidents:", error);
      res.status(500).json({ error: "Failed to get incident reports" });
    }
  });

  /**
   * Get incident reports for a resident
   */
  app.get(
    "/api/ehr/residents/:residentId/incidents",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const incidents = await storage.getIncidentReportsByResident(residentId);
        res.json(incidents);
      } catch (error) {
        console.error("Error getting resident incidents:", error);
        res.status(500).json({ error: "Failed to get incident reports" });
      }
    }
  );

  /**
   * Get a single incident report
   */
  app.get("/api/ehr/incidents/:incidentId", requireStaffAuth, async (req, res) => {
    try {
      const { incidentId } = req.params;
      const incident = await storage.getIncidentReport(incidentId);

      if (!incident) {
        return res.status(404).json({ error: "Incident report not found" });
      }

      if (incident.facilityId !== req.staff!.facilityId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(incident);
    } catch (error) {
      console.error("Error getting incident:", error);
      res.status(500).json({ error: "Failed to get incident report" });
    }
  });

  /**
   * Create an incident report
   */
  app.post(
    "/api/ehr/incidents",
    requireStaffAuth,
    requirePermission("canFileIncidents"),
    async (req, res) => {
      try {
        const staffId = req.staff!.id;
        const facilityId = req.staff!.facilityId;

        const {
          residentId,
          type,
          description,
          incidentDate,
          incidentTime,
          location,
          injuries,
          immediateAction,
          hasInjury,
          physicianNotified,
          familyNotified,
          dshsReportable,
        } = req.body;

        if (!type || !description || !incidentDate || !incidentTime) {
          return res.status(400).json({
            error: "Type, description, incident date, and time are required",
          });
        }

        // If resident specified, verify access
        if (residentId) {
          const resident = await storage.getResident(residentId);
          if (!resident) {
            return res.status(404).json({ error: "Resident not found" });
          }

          if (resident.facilityId !== facilityId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }

        const incident = await storage.createIncidentReport({
          facilityId,
          residentId,
          reportedBy: staffId,
          type,
          description,
          incidentDate,
          incidentTime,
          location,
          injuries,
          immediateAction,
          hasInjury: hasInjury || false,
          physicianNotified: physicianNotified || false,
          familyNotified: familyNotified || false,
          dshsReportable: dshsReportable || false,
          status: "open",
        });

        res.status(201).json(incident);
      } catch (error) {
        console.error("Error creating incident report:", error);
        res.status(500).json({ error: "Failed to create incident report" });
      }
    }
  );

  /**
   * Update an incident report
   */
  app.patch(
    "/api/ehr/incidents/:incidentId",
    requireStaffAuth,
    requirePermission("canFileIncidents"),
    async (req, res) => {
      try {
        const { incidentId } = req.params;

        const incident = await storage.getIncidentReport(incidentId);
        if (!incident) {
          return res.status(404).json({ error: "Incident report not found" });
        }

        if (incident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updated = await storage.updateIncidentReport(incidentId, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating incident report:", error);
        res.status(500).json({ error: "Failed to update incident report" });
      }
    }
  );

  /**
   * Close an incident report
   */
  app.post(
    "/api/ehr/incidents/:incidentId/close",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const { incidentId } = req.params;
        const { resolution } = req.body;

        const incident = await storage.getIncidentReport(incidentId);
        if (!incident) {
          return res.status(404).json({ error: "Incident report not found" });
        }

        if (incident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updated = await storage.updateIncidentReport(incidentId, {
          status: "closed",
          resolution,
        } as any);

        res.json(updated);
      } catch (error) {
        console.error("Error closing incident report:", error);
        res.status(500).json({ error: "Failed to close incident report" });
      }
    }
  );

  /**
   * Delete an incident report
   */
  app.delete(
    "/api/ehr/incidents/:incidentId",
    requireStaffAuth,
    requireStaffRole("admin"),
    async (req, res) => {
      try {
        const { incidentId } = req.params;

        const incident = await storage.getIncidentReport(incidentId);
        if (!incident) {
          return res.status(404).json({ error: "Incident report not found" });
        }

        if (incident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        await storage.deleteIncidentReport(incidentId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting incident report:", error);
        res.status(500).json({ error: "Failed to delete incident report" });
      }
    }
  );

  // ============================================================================
  // DASHBOARD & ADVANCED FEATURES
  // ============================================================================

  /**
   * Get EHR dashboard stats for facility
   */
  app.get("/api/ehr/dashboard", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const stats = await storage.getEhrDashboardStats(facilityId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  /**
   * Get comprehensive resident summary
   */
  app.get(
    "/api/ehr/residents/:residentId/summary",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;

        const summary = await storage.getResidentSummary(residentId);
        if (!summary) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (summary.resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        res.json(summary);
      } catch (error) {
        console.error("Error getting resident summary:", error);
        res.status(500).json({ error: "Failed to get resident summary" });
      }
    }
  );

  /**
   * Get today's medication schedule for facility
   */
  app.get("/api/ehr/schedule", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;

      // Get all active residents
      const activeResidents = await storage.getResidentsByFacility(facilityId, "active");

      // Build schedule for each resident
      const schedule = await Promise.all(
        activeResidents.map(async (resident) => {
          const medications = await storage.getMedicationsByResident(resident.id, true);
          return {
            resident: {
              id: resident.id,
              firstName: resident.firstName,
              lastName: resident.lastName,
              preferredName: resident.preferredName,
              roomNumber: resident.roomNumber,
              photo: resident.photo,
            },
            medications: medications.map((med) => ({
              id: med.id,
              name: med.name,
              dosage: med.dosage,
              route: med.route,
              frequency: med.frequency,
              instructions: med.instructions,
              isControlled: med.isControlled,
              isPRN: med.isPRN,
              prnReason: med.prnReason,
            })),
          };
        })
      );

      res.json(schedule);
    } catch (error) {
      console.error("Error getting medication schedule:", error);
      res.status(500).json({ error: "Failed to get medication schedule" });
    }
  });

  /**
   * Get shift handoff report
   * Returns summary of what happened during the specified shift
   */
  app.get("/api/ehr/handoff", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const shift = (req.query.shift as string) || "day"; // day, swing, night

      // Get all notes for this shift
      const notes = await storage.getDailyNotesByFacility(facilityId, date);
      const shiftNotes = notes.filter((n) => n.shift === shift);

      // Get MAR for this date
      const mar = await storage.getMedicationLogsByFacility(facilityId, date);

      // Get incidents from today
      const allIncidents = await storage.getIncidentReportsByFacility(facilityId, {});
      const todayIncidents = allIncidents.filter((i) => i.incidentDate === date);

      // Get residents with concerns
      const residentsWithConcerns = shiftNotes
        .filter((n) => n.hasConcerns)
        .map((n) => ({
          noteId: n.id,
          residentId: n.residentId,
          concerns: n.concerns,
        }));

      // Calculate MAR summary
      const marSummary = {
        total: mar.length,
        given: mar.filter((m) => m.status === "given").length,
        refused: mar.filter((m) => m.status === "refused").length,
        held: mar.filter((m) => m.status === "held").length,
        pending: mar.filter((m) => m.status === "pending").length,
      };

      res.json({
        date,
        shift,
        summary: {
          notesCompleted: shiftNotes.length,
          residentsWithConcerns: residentsWithConcerns.length,
          incidentsReported: todayIncidents.length,
          medicationsSummary: marSummary,
        },
        concerns: residentsWithConcerns,
        incidents: todayIncidents.map((i) => ({
          id: i.id,
          type: i.type,
          residentId: i.residentId,
          description: i.description.substring(0, 100) + (i.description.length > 100 ? "..." : ""),
          dshsReportable: i.dshsReportable,
        })),
        notes: shiftNotes.map((n) => ({
          id: n.id,
          residentId: n.residentId,
          hasConcerns: n.hasConcerns,
          mood: n.mood,
          appetite: n.appetite,
          painLevel: n.painLevel,
        })),
      });
    } catch (error) {
      console.error("Error getting shift handoff:", error);
      res.status(500).json({ error: "Failed to get shift handoff report" });
    }
  });

  /**
   * Get DSHS compliance report
   * Returns all DSHS reportable incidents and their status
   */
  app.get(
    "/api/ehr/reports/dshs",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const facilityId = req.staff!.facilityId;
        const { startDate, endDate, status } = req.query;

        // Get all DSHS reportable incidents
        const incidents = await storage.getIncidentReportsByFacility(facilityId, {
          dshsReportable: true,
          status: status as string | undefined,
        });

        // Filter by date range if provided
        let filtered = incidents;
        if (startDate) {
          filtered = filtered.filter((i) => i.incidentDate >= (startDate as string));
        }
        if (endDate) {
          filtered = filtered.filter((i) => i.incidentDate <= (endDate as string));
        }

        // Group by status
        const byStatus = {
          open: filtered.filter((i) => i.status === "open"),
          investigating: filtered.filter((i) => i.status === "investigating"),
          closed: filtered.filter((i) => i.status === "closed"),
        };

        res.json({
          total: filtered.length,
          byStatus: {
            open: byStatus.open.length,
            investigating: byStatus.investigating.length,
            closed: byStatus.closed.length,
          },
          incidents: filtered,
        });
      } catch (error) {
        console.error("Error getting DSHS report:", error);
        res.status(500).json({ error: "Failed to get DSHS compliance report" });
      }
    }
  );

  /**
   * Get medication compliance report
   * Shows administration rates and missed medications
   */
  app.get(
    "/api/ehr/reports/medications",
    requireStaffAuth,
    requireStaffRole("admin", "manager"),
    async (req, res) => {
      try {
        const facilityId = req.staff!.facilityId;
        const startDate = (req.query.startDate as string) || (() => {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          return d.toISOString().split("T")[0];
        })();
        const endDate = (req.query.endDate as string) || new Date().toISOString().split("T")[0];

        // Get all MAR entries for date range
        const allLogs: any[] = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          const logs = await storage.getMedicationLogsByFacility(facilityId, dateStr);
          allLogs.push(...logs);
          current.setDate(current.getDate() + 1);
        }

        // Calculate stats
        const total = allLogs.length;
        const given = allLogs.filter((l) => l.status === "given").length;
        const refused = allLogs.filter((l) => l.status === "refused").length;
        const held = allLogs.filter((l) => l.status === "held").length;
        const missed = allLogs.filter((l) => l.status === "missed").length;

        res.json({
          dateRange: { startDate, endDate },
          summary: {
            total,
            given,
            refused,
            held,
            missed,
            complianceRate: total > 0 ? ((given / total) * 100).toFixed(1) : "0",
          },
          byDate: Object.entries(
            allLogs.reduce((acc: Record<string, any>, log) => {
              const date = new Date(log.scheduledTime).toISOString().split("T")[0];
              if (!acc[date]) {
                acc[date] = { total: 0, given: 0, refused: 0, held: 0, missed: 0 };
              }
              acc[date].total++;
              acc[date][log.status]++;
              return acc;
            }, {})
          ).map(([date, stats]) => ({ date, ...stats })),
        });
      } catch (error) {
        console.error("Error getting medication report:", error);
        res.status(500).json({ error: "Failed to get medication compliance report" });
      }
    }
  );

  /**
   * Get resident census report
   */
  app.get(
    "/api/ehr/reports/census",
    requireStaffAuth,
    async (req, res) => {
      try {
        const facilityId = req.staff!.facilityId;

        const allResidents = await storage.getResidentsByFacility(facilityId);

        const byStatus = {
          active: allResidents.filter((r) => r.status === "active"),
          discharged: allResidents.filter((r) => r.status === "discharged"),
          hospitalized: allResidents.filter((r) => r.status === "hospitalized"),
          deceased: allResidents.filter((r) => r.status === "deceased"),
        };

        res.json({
          total: allResidents.length,
          byStatus: {
            active: byStatus.active.length,
            discharged: byStatus.discharged.length,
            hospitalized: byStatus.hospitalized.length,
            deceased: byStatus.deceased.length,
          },
          activeResidents: byStatus.active.map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            preferredName: r.preferredName,
            roomNumber: r.roomNumber,
            admissionDate: r.admissionDate,
            photo: r.photo,
          })),
        });
      } catch (error) {
        console.error("Error getting census report:", error);
        res.status(500).json({ error: "Failed to get census report" });
      }
    }
  );

  // ============================================================================
  // VITALS ROUTES
  // ============================================================================

  /**
   * Get vitals history for a resident
   */
  app.get(
    "/api/ehr/residents/:residentId/vitals",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const { startDate, endDate } = req.query;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== req.staff!.facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const dateRange = startDate && endDate
          ? { start: new Date(startDate as string), end: new Date(endDate as string) }
          : undefined;

        const vitals = await storage.getVitalsByResident(residentId, dateRange);
        res.json(vitals);
      } catch (error) {
        console.error("Error getting vitals:", error);
        res.status(500).json({ error: "Failed to get vitals" });
      }
    }
  );

  /**
   * Log new vitals for a resident
   */
  app.post(
    "/api/ehr/residents/:residentId/vitals",
    requireStaffAuth,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const facilityId = req.staff!.facilityId;
        const recordedBy = req.staff!.firstName + " " + req.staff!.lastName;

        const resident = await storage.getResident(residentId);
        if (!resident) {
          return res.status(404).json({ error: "Resident not found" });
        }

        if (resident.facilityId !== facilityId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const {
          bloodPressureSystolic,
          bloodPressureDiastolic,
          heartRate,
          temperature,
          respiratoryRate,
          oxygenSaturation,
          weight,
          bloodSugar,
          painLevel,
          notes,
        } = req.body;

        const vitals = await storage.createVitals({
          residentId,
          facilityId,
          recordedBy,
          recordedAt: new Date(),
          bloodPressureSystolic: bloodPressureSystolic || null,
          bloodPressureDiastolic: bloodPressureDiastolic || null,
          heartRate: heartRate || null,
          temperature: temperature || null,
          respiratoryRate: respiratoryRate || null,
          oxygenSaturation: oxygenSaturation || null,
          weight: weight || null,
          bloodSugar: bloodSugar || null,
          painLevel: painLevel || null,
          notes: notes || null,
        });

        res.status(201).json(vitals);
      } catch (error) {
        console.error("Error logging vitals:", error);
        res.status(500).json({ error: "Failed to log vitals" });
      }
    }
  );

  /**
   * Get all vitals logged today for facility
   */
  app.get("/api/ehr/vitals/today", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;
      const today = new Date().toISOString().split("T")[0];

      const vitals = await storage.getVitalsByFacility(facilityId, today);
      res.json(vitals);
    } catch (error) {
      console.error("Error getting today's vitals:", error);
      res.status(500).json({ error: "Failed to get today's vitals" });
    }
  });

  /**
   * Get vitals outside normal ranges (alerts)
   */
  app.get("/api/ehr/vitals/alerts", requireStaffAuth, async (req, res) => {
    try {
      const facilityId = req.staff!.facilityId;

      const abnormalVitals = await storage.getAbnormalVitals(facilityId);
      res.json(abnormalVitals);
    } catch (error) {
      console.error("Error getting vitals alerts:", error);
      res.status(500).json({ error: "Failed to get vitals alerts" });
    }
  });
}
