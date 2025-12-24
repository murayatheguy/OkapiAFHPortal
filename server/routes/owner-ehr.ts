import { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "../storage";

/**
 * Middleware to require owner authentication
 */
async function requireOwnerAuth(req: Request, res: Response, next: NextFunction) {
  const ownerId = req.session.ownerId;
  if (!ownerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const owner = await storage.getOwner(ownerId);
  if (!owner) {
    req.session.ownerId = null;
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (owner.status !== "active") {
    return res.status(403).json({ error: "Account is not active" });
  }

  // Attach owner to request
  (req as any).owner = owner;
  next();
}

/**
 * Middleware to verify owner has access to facility
 */
async function requireFacilityOwnership(req: Request, res: Response, next: NextFunction) {
  const ownerId = req.session.ownerId;
  const facilityId = req.params.facilityId;

  if (!facilityId) {
    return res.status(400).json({ error: "Facility ID required" });
  }

  const facility = await storage.getFacility(facilityId);
  if (!facility) {
    return res.status(404).json({ error: "Facility not found" });
  }

  if (facility.ownerId !== ownerId) {
    return res.status(403).json({ error: "Access denied to this facility" });
  }

  // Attach facility to request
  (req as any).facility = facility;
  next();
}

export function registerOwnerEhrRoutes(app: Express) {
  // ============================================================================
  // OWNER EHR DASHBOARD
  // ============================================================================

  /**
   * Get EHR dashboard for a facility (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/dashboard",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const stats = await storage.getEhrDashboardStats(facilityId);

        // Get additional owner-relevant info
        const staff = await storage.getStaffAuthByFacility(facilityId);
        const activeStaff = staff.filter((s) => s.status === "active");

        res.json({
          ...stats,
          staffCount: activeStaff.length,
          hasStaffAdmin: staff.some((s) => s.role === "admin" && s.status === "active"),
        });
      } catch (error) {
        console.error("Error getting owner EHR dashboard:", error);
        res.status(500).json({ error: "Failed to get dashboard" });
      }
    }
  );

  // ============================================================================
  // OWNER STAFF MANAGEMENT
  // ============================================================================

  /**
   * Get all staff for a facility (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/staff",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const staff = await storage.getStaffAuthByFacility(facilityId);

        // Remove sensitive data but keep teamMemberId for linking
        const sanitizedStaff = staff.map((s) => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          role: s.role,
          status: s.status,
          lastLoginAt: s.lastLoginAt,
          createdAt: s.createdAt,
          teamMemberId: s.teamMemberId || null,
        }));

        res.json(sanitizedStaff);
      } catch (error) {
        console.error("Error getting facility staff:", error);
        res.status(500).json({ error: "Failed to get staff list" });
      }
    }
  );

  /**
   * Invite initial staff admin for a facility
   * This allows owners to bootstrap EHR access for their facility
   */
  app.post(
    "/api/owners/facilities/:facilityId/staff/invite-admin",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { email, firstName, lastName } = req.body;

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
          role: "admin", // Owner invites create admins
          permissions: {
            canAdministerMeds: true,
            canAdministerControlled: true,
            canFileIncidents: true,
            canEditResidents: true,
          },
          status: "inactive",
          inviteToken,
          inviteExpiresAt,
        });

        // In production, send invite email here
        // await sendInviteEmail(email, inviteToken);

        res.json({
          success: true,
          staff: {
            id: newStaff.id,
            email: newStaff.email,
            firstName: newStaff.firstName,
            lastName: newStaff.lastName,
            role: newStaff.role,
          },
          inviteLink: `/ehr/setup?token=${inviteToken}`,
        });
      } catch (error) {
        console.error("Error inviting staff admin:", error);
        res.status(500).json({ error: "Failed to invite staff admin" });
      }
    }
  );

  /**
   * Revoke staff access (owner can remove any staff)
   */
  app.delete(
    "/api/owners/facilities/:facilityId/staff/:staffId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, staffId } = req.params;

        const staff = await storage.getStaffAuth(staffId);
        if (!staff) {
          return res.status(404).json({ error: "Staff member not found" });
        }

        if (staff.facilityId !== facilityId) {
          return res.status(403).json({ error: "Staff member not in this facility" });
        }

        await storage.deleteStaffAuth(staffId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error removing staff:", error);
        res.status(500).json({ error: "Failed to remove staff member" });
      }
    }
  );

  /**
   * Suspend/reactivate staff member
   */
  app.patch(
    "/api/owners/facilities/:facilityId/staff/:staffId/status",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, staffId } = req.params;
        const { status } = req.body;

        if (!["active", "suspended"].includes(status)) {
          return res.status(400).json({ error: "Status must be 'active' or 'suspended'" });
        }

        const staff = await storage.getStaffAuth(staffId);
        if (!staff) {
          return res.status(404).json({ error: "Staff member not found" });
        }

        if (staff.facilityId !== facilityId) {
          return res.status(403).json({ error: "Staff member not in this facility" });
        }

        const updated = await storage.updateStaffAuth(staffId, { status });
        res.json({
          id: updated?.id,
          status: updated?.status,
        });
      } catch (error) {
        console.error("Error updating staff status:", error);
        res.status(500).json({ error: "Failed to update staff status" });
      }
    }
  );

  // ============================================================================
  // OWNER REPORTS ACCESS
  // ============================================================================

  /**
   * Get resident census for facility (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/census",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const residents = await storage.getResidentsByFacility(facilityId);

        const byStatus = {
          active: residents.filter((r) => r.status === "active"),
          discharged: residents.filter((r) => r.status === "discharged"),
          hospitalized: residents.filter((r) => r.status === "hospitalized"),
          deceased: residents.filter((r) => r.status === "deceased"),
        };

        res.json({
          total: residents.length,
          byStatus: {
            active: byStatus.active.length,
            discharged: byStatus.discharged.length,
            hospitalized: byStatus.hospitalized.length,
            deceased: byStatus.deceased.length,
          },
          // Basic info only for privacy
          activeResidents: byStatus.active.map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            roomNumber: r.roomNumber,
            admissionDate: r.admissionDate,
          })),
        });
      } catch (error) {
        console.error("Error getting census:", error);
        res.status(500).json({ error: "Failed to get census report" });
      }
    }
  );

  /**
   * Get incident summary for facility (owner view)
   * Shows high-level stats without full PHI
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/incidents/summary",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { startDate, endDate } = req.query;

        const incidents = await storage.getIncidentReportsByFacility(facilityId, {});

        // Filter by date range if provided
        let filtered = incidents;
        if (startDate) {
          filtered = filtered.filter((i) => i.incidentDate >= (startDate as string));
        }
        if (endDate) {
          filtered = filtered.filter((i) => i.incidentDate <= (endDate as string));
        }

        // Group by type
        const byType = filtered.reduce((acc: Record<string, number>, incident) => {
          acc[incident.type] = (acc[incident.type] || 0) + 1;
          return acc;
        }, {});

        // Group by status
        const byStatus = {
          open: filtered.filter((i) => i.status === "open").length,
          investigating: filtered.filter((i) => i.status === "investigating").length,
          closed: filtered.filter((i) => i.status === "closed").length,
        };

        // DSHS reportable count
        const dshsReportable = filtered.filter((i) => i.dshsReportable).length;

        res.json({
          total: filtered.length,
          dshsReportable,
          byType,
          byStatus,
          // Recent incidents (limited info)
          recent: filtered.slice(0, 10).map((i) => ({
            id: i.id,
            type: i.type,
            incidentDate: i.incidentDate,
            status: i.status,
            dshsReportable: i.dshsReportable,
          })),
        });
      } catch (error) {
        console.error("Error getting incident summary:", error);
        res.status(500).json({ error: "Failed to get incident summary" });
      }
    }
  );

  /**
   * Get all incidents for facility with full details (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/incidents",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const incidents = await storage.getIncidentReportsByFacility(facilityId, {});

        // Get resident names for each incident
        const incidentsWithNames = await Promise.all(
          incidents.map(async (incident) => {
            let residentName = "Unknown";
            if (incident.residentId) {
              const resident = await storage.getResident(incident.residentId);
              if (resident) {
                residentName = `${resident.firstName} ${resident.lastName}`;
              }
            }

            let reportedByName = "Unknown";
            if (incident.reportedBy) {
              const staff = await storage.getStaffAuth(incident.reportedBy);
              if (staff) {
                reportedByName = `${staff.firstName} ${staff.lastName}`;
              }
            }

            return {
              ...incident,
              residentName,
              reportedByName,
            };
          })
        );

        res.json(incidentsWithNames);
      } catch (error) {
        console.error("Error getting incidents:", error);
        res.status(500).json({ error: "Failed to get incidents" });
      }
    }
  );

  /**
   * Get single incident with full details (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/incidents/:incidentId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, incidentId } = req.params;
        const incident = await storage.getIncidentReport(incidentId);

        if (!incident) {
          return res.status(404).json({ error: "Incident not found" });
        }

        if (incident.facilityId !== facilityId) {
          return res.status(403).json({ error: "Not authorized to view this incident" });
        }

        // Get resident name
        let residentName = "Unknown";
        if (incident.residentId) {
          const resident = await storage.getResident(incident.residentId);
          if (resident) {
            residentName = `${resident.firstName} ${resident.lastName}`;
          }
        }

        // Get reporter name
        let reportedByName = "Unknown";
        if (incident.reportedBy) {
          const staff = await storage.getStaffAuth(incident.reportedBy);
          if (staff) {
            reportedByName = `${staff.firstName} ${staff.lastName}`;
          }
        }

        res.json({
          ...incident,
          residentName,
          reportedByName,
        });
      } catch (error) {
        console.error("Error getting incident:", error);
        res.status(500).json({ error: "Failed to get incident" });
      }
    }
  );

  /**
   * Update incident status and follow-up notes (owner view)
   */
  app.patch(
    "/api/owners/facilities/:facilityId/ehr/incidents/:incidentId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, incidentId } = req.params;
        const { status, followUpNotes } = req.body;

        const incident = await storage.getIncidentReport(incidentId);

        if (!incident) {
          return res.status(404).json({ error: "Incident not found" });
        }

        if (incident.facilityId !== facilityId) {
          return res.status(403).json({ error: "Not authorized to update this incident" });
        }

        // Only allow updating status and follow-up notes
        const updateData: any = {};
        if (status && ["open", "investigating", "resolved", "closed"].includes(status)) {
          updateData.status = status;
        }
        if (followUpNotes !== undefined) {
          updateData.followUpNotes = followUpNotes;
        }

        const updated = await storage.updateIncidentReport(incidentId, updateData);
        res.json(updated);
      } catch (error) {
        console.error("Error updating incident:", error);
        res.status(500).json({ error: "Failed to update incident" });
      }
    }
  );

  /**
   * Get vitals history for a resident (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/residents/:residentId/vitals",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, residentId } = req.params;
        const { startDate, endDate } = req.query;

        // Verify resident belongs to facility
        const resident = await storage.getResident(residentId);
        if (!resident || resident.facilityId !== facilityId) {
          return res.status(404).json({ error: "Resident not found" });
        }

        // Build date range if provided
        let dateRange: { start: Date; end: Date } | undefined;
        if (startDate && endDate) {
          dateRange = {
            start: new Date(startDate as string),
            end: new Date(endDate as string + "T23:59:59"),
          };
        }

        const vitals = await storage.getVitalsByResident(residentId, dateRange);
        res.json(vitals);
      } catch (error) {
        console.error("Error getting vitals:", error);
        res.status(500).json({ error: "Failed to get vitals" });
      }
    }
  );

  /**
   * Get medication compliance summary for facility (owner view)
   */
  app.get(
    "/api/owners/facilities/:facilityId/ehr/medications/compliance",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const days = parseInt(req.query.days as string) || 7;

        // Get MAR for last N days
        const allLogs: any[] = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const logs = await storage.getMedicationLogsByFacility(facilityId, dateStr);
          allLogs.push(...logs);
        }

        // Calculate stats
        const total = allLogs.length;
        const given = allLogs.filter((l) => l.status === "given").length;
        const refused = allLogs.filter((l) => l.status === "refused").length;
        const held = allLogs.filter((l) => l.status === "held").length;
        const missed = allLogs.filter((l) => l.status === "missed").length;

        res.json({
          period: `Last ${days} days`,
          summary: {
            total,
            given,
            refused,
            held,
            missed,
            complianceRate: total > 0 ? ((given / total) * 100).toFixed(1) + "%" : "N/A",
          },
        });
      } catch (error) {
        console.error("Error getting medication compliance:", error);
        res.status(500).json({ error: "Failed to get medication compliance" });
      }
    }
  );

  /**
   * Get all facilities with EHR status for owner
   */
  app.get(
    "/api/owners/me/facilities/ehr-status",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const ownerId = req.session.ownerId!;
        const facilities = await storage.getFacilitiesByOwner(ownerId);

        const facilitiesWithEhr = await Promise.all(
          facilities.map(async (facility) => {
            const staff = await storage.getStaffAuthByFacility(facility.id);
            const activeStaff = staff.filter((s) => s.status === "active");
            const hasAdmin = staff.some((s) => s.role === "admin" && s.status === "active");

            let stats = null;
            if (activeStaff.length > 0) {
              stats = await storage.getEhrDashboardStats(facility.id);
            }

            return {
              id: facility.id,
              name: facility.name,
              ehrEnabled: activeStaff.length > 0,
              hasAdmin,
              staffCount: activeStaff.length,
              stats: stats ? {
                activeResidents: stats.activeResidents,
                openIncidents: stats.openIncidents,
              } : null,
            };
          })
        );

        res.json(facilitiesWithEhr);
      } catch (error) {
        console.error("Error getting facilities EHR status:", error);
        res.status(500).json({ error: "Failed to get facilities status" });
      }
    }
  );

  /**
   * Enable Care Portal for owner - creates/retrieves owner's staff record
   * This allows owners to seamlessly access the Staff Portal
   */
  app.post(
    "/api/owners/facilities/:facilityId/ehr/enable-portal",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const ownerId = req.session.ownerId!;
        const { facilityId } = req.params;
        const owner = (req as any).owner;

        // Check if staff record already exists for this owner and facility
        let staffRecord = await storage.getStaffAuthByLinkedOwner(ownerId, facilityId);

        if (!staffRecord) {
          // Check if email already exists (owner might have been invited separately)
          const existingByEmail = await storage.getStaffAuthByEmail(owner.email);

          if (existingByEmail && existingByEmail.facilityId === facilityId) {
            // Link existing record to owner
            staffRecord = await storage.updateStaffAuth(existingByEmail.id, {
              linkedOwnerId: ownerId,
              role: "owner",
              status: "active",
              permissions: {
                canAdministerMeds: true,
                canAdministerControlled: true,
                canFileIncidents: true,
                canEditResidents: true,
              },
            });
          } else {
            // Create new staff record for owner
            const nameParts = (owner.name || "Owner User").split(" ");
            const firstName = nameParts[0] || "Owner";
            const lastName = nameParts.slice(1).join(" ") || "User";

            staffRecord = await storage.createStaffAuth({
              facilityId,
              linkedOwnerId: ownerId,
              email: owner.email,
              firstName,
              lastName,
              role: "owner",
              status: "active",
              permissions: {
                canAdministerMeds: true,
                canAdministerControlled: true,
                canFileIncidents: true,
                canEditResidents: true,
              },
            } as any);
          }
        }

        // Set staff session data so owner can access staff portal
        req.session.staffId = staffRecord!.id;
        req.session.staffFacilityId = facilityId;
        req.session.staffRole = "owner";

        res.json({
          success: true,
          staff: {
            id: staffRecord!.id,
            email: staffRecord!.email,
            firstName: staffRecord!.firstName,
            lastName: staffRecord!.lastName,
            role: staffRecord!.role,
            facilityId: staffRecord!.facilityId,
          },
        });
      } catch (error) {
        console.error("Error enabling care portal:", error);
        res.status(500).json({ error: "Failed to enable care portal" });
      }
    }
  );

  // ============================================
  // RESIDENT MEDICATIONS MANAGEMENT
  // ============================================

  /**
   * Get all medications for a resident
   */
  app.get(
    "/api/owners/facilities/:facilityId/residents/:residentId/medications",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, residentId } = req.params;
        const activeOnly = req.query.activeOnly === "true";

        // Verify resident belongs to facility
        const resident = await storage.getResident(residentId);
        if (!resident || resident.facilityId !== facilityId) {
          return res.status(404).json({ error: "Resident not found" });
        }

        const medications = await storage.getMedicationsByResident(residentId, activeOnly);
        res.json(medications);
      } catch (error) {
        console.error("Error getting resident medications:", error);
        res.status(500).json({ error: "Failed to get medications" });
      }
    }
  );

  /**
   * Add a medication to a resident
   */
  app.post(
    "/api/owners/facilities/:facilityId/residents/:residentId/medications",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, residentId } = req.params;

        // Verify resident belongs to facility
        const resident = await storage.getResident(residentId);
        if (!resident || resident.facilityId !== facilityId) {
          return res.status(404).json({ error: "Resident not found" });
        }

        const medication = await storage.createMedication({
          residentId,
          facilityId,
          name: req.body.name,
          dosage: req.body.dosage || req.body.strength || "As directed",
          route: req.body.route || "oral",
          frequency: req.body.frequency ? {
            times: [],
            interval: req.body.frequency,
          } : null,
          instructions: req.body.instructions || null,
          prescribedBy: req.body.prescriber || null,
          startDate: req.body.startDate || new Date().toISOString().split("T")[0],
          endDate: req.body.endDate || null,
          status: req.body.status || "active",
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
  app.put(
    "/api/owners/facilities/:facilityId/residents/:residentId/medications/:medicationId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, residentId, medicationId } = req.params;

        // Verify resident belongs to facility
        const resident = await storage.getResident(residentId);
        if (!resident || resident.facilityId !== facilityId) {
          return res.status(404).json({ error: "Resident not found" });
        }

        // Verify medication belongs to resident
        const existingMed = await storage.getMedication(medicationId);
        if (!existingMed || existingMed.residentId !== residentId) {
          return res.status(404).json({ error: "Medication not found" });
        }

        const updateData: any = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.dosage !== undefined || req.body.strength !== undefined) {
          updateData.dosage = req.body.dosage || req.body.strength;
        }
        if (req.body.route !== undefined) updateData.route = req.body.route;
        if (req.body.frequency !== undefined) {
          updateData.frequency = req.body.frequency ? {
            times: [],
            interval: req.body.frequency,
          } : null;
        }
        if (req.body.instructions !== undefined) updateData.instructions = req.body.instructions;
        if (req.body.prescriber !== undefined) updateData.prescribedBy = req.body.prescriber;
        if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate;
        if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate;
        if (req.body.status !== undefined) updateData.status = req.body.status;

        const medication = await storage.updateMedication(medicationId, updateData);

        res.json(medication);
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
    "/api/owners/facilities/:facilityId/residents/:residentId/medications/:medicationId/discontinue",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, residentId, medicationId } = req.params;

        // Verify resident belongs to facility
        const resident = await storage.getResident(residentId);
        if (!resident || resident.facilityId !== facilityId) {
          return res.status(404).json({ error: "Resident not found" });
        }

        // Verify medication belongs to resident
        const existingMed = await storage.getMedication(medicationId);
        if (!existingMed || existingMed.residentId !== residentId) {
          return res.status(404).json({ error: "Medication not found" });
        }

        const medication = await storage.updateMedication(medicationId, {
          status: "discontinued",
          endDate: new Date().toISOString().split("T")[0],
        });

        res.json(medication);
      } catch (error) {
        console.error("Error discontinuing medication:", error);
        res.status(500).json({ error: "Failed to discontinue medication" });
      }
    }
  );

  // ==================== CREDENTIALS ROUTES ====================

  /**
   * Get all credentials for a facility
   */
  app.get(
    "/api/owners/facilities/:facilityId/credentials",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const owner = (req as any).owner;

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        const credentials = await storage.getCredentialsByFacility(facilityId);
        res.json(credentials);
      } catch (error) {
        console.error("Error fetching credentials:", error);
        res.status(500).json({ error: "Failed to fetch credentials" });
      }
    }
  );

  /**
   * Get expiring credentials for a facility (within next X days)
   */
  app.get(
    "/api/owners/facilities/:facilityId/credentials/expiring",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const days = parseInt(req.query.days as string) || 30;
        const owner = (req as any).owner;

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        const credentials = await storage.getExpiringCredentials(facilityId, days);
        res.json(credentials);
      } catch (error) {
        console.error("Error fetching expiring credentials:", error);
        res.status(500).json({ error: "Failed to fetch expiring credentials" });
      }
    }
  );

  /**
   * Get credentials for a specific team member
   */
  app.get(
    "/api/owners/team-members/:teamMemberId/credentials",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { teamMemberId } = req.params;
        const owner = (req as any).owner;

        // Get the team member to verify ownership
        const teamMember = await storage.getTeamMember(teamMemberId);
        if (!teamMember) {
          return res.status(404).json({ error: "Team member not found" });
        }

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === teamMember.facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        const credentials = await storage.getCredentialsByTeamMember(teamMemberId);
        res.json(credentials);
      } catch (error) {
        console.error("Error fetching team member credentials:", error);
        res.status(500).json({ error: "Failed to fetch credentials" });
      }
    }
  );

  /**
   * Add a credential to a team member
   */
  app.post(
    "/api/owners/team-members/:teamMemberId/credentials",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { teamMemberId } = req.params;
        const owner = (req as any).owner;

        // Get the team member to verify ownership
        const teamMember = await storage.getTeamMember(teamMemberId);
        if (!teamMember) {
          return res.status(404).json({ error: "Team member not found" });
        }

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === teamMember.facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Sanitize the data - convert empty strings to null for date fields
        const { credentialType, credentialNumber, issuingAuthority, issueDate, expirationDate, notes } = req.body;

        const credentialData = {
          teamMemberId,
          facilityId: teamMember.facilityId,
          credentialType,
          credentialNumber: credentialNumber || null,
          issuingAuthority: issuingAuthority || null,
          issueDate: issueDate || null,
          expirationDate: expirationDate || null,
          notes: notes || null,
        };

        const credential = await storage.createCredential(credentialData);
        res.status(201).json(credential);
      } catch (error) {
        console.error("Error creating credential:", error);
        res.status(500).json({ error: "Failed to create credential" });
      }
    }
  );

  /**
   * Update a credential
   */
  app.put(
    "/api/owners/credentials/:credentialId",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { credentialId } = req.params;
        const owner = (req as any).owner;

        // Get the credential
        const existingCredential = await storage.getCredential(credentialId);
        if (!existingCredential) {
          return res.status(404).json({ error: "Credential not found" });
        }

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === existingCredential.facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Sanitize the data - convert empty strings to null for date fields
        const { credentialType, credentialNumber, issuingAuthority, issueDate, expirationDate, notes } = req.body;

        const updateData = {
          credentialType,
          credentialNumber: credentialNumber || null,
          issuingAuthority: issuingAuthority || null,
          issueDate: issueDate || null,
          expirationDate: expirationDate || null,
          notes: notes || null,
        };

        const credential = await storage.updateCredential(credentialId, updateData);
        res.json(credential);
      } catch (error) {
        console.error("Error updating credential:", error);
        res.status(500).json({ error: "Failed to update credential" });
      }
    }
  );

  /**
   * Delete a credential
   */
  app.delete(
    "/api/owners/credentials/:credentialId",
    requireOwnerAuth,
    async (req, res) => {
      try {
        const { credentialId } = req.params;
        const owner = (req as any).owner;

        // Get the credential
        const existingCredential = await storage.getCredential(credentialId);
        if (!existingCredential) {
          return res.status(404).json({ error: "Credential not found" });
        }

        // Verify facility ownership
        const facilities = await storage.getFacilitiesByOwner(owner.id);
        const facility = facilities.find((f) => f.id === existingCredential.facilityId);
        if (!facility) {
          return res.status(403).json({ error: "Access denied" });
        }

        await storage.deleteCredential(credentialId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting credential:", error);
        res.status(500).json({ error: "Failed to delete credential" });
      }
    }
  );
}
