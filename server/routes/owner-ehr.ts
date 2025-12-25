import { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { ActivityLogger } from "../lib/activity-logger";

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

        // Log activity
        const owner = (req as any).owner;
        const staffName = `${firstName} ${lastName}`;
        await ActivityLogger.staffCreated(req, owner.id, owner.name, facilityId, newStaff.id, staffName);

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

        // Log activity before deletion
        const owner = (req as any).owner;
        const staffName = `${staff.firstName} ${staff.lastName}`;
        await ActivityLogger.staffRemoved(req, owner.id, owner.name, facilityId, staffId, staffName);

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
  // TEAM MEMBER → STAFF PORTAL FLOW
  // ============================================================================

  /**
   * Get team members who don't have staff portal access yet
   */
  app.get(
    "/api/owners/facilities/:facilityId/team-members/without-portal-access",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;

        // Get all team members for this facility
        const allTeamMembers = await storage.getTeamMembersByFacility(facilityId);
        console.log(`[Portal Access] Found ${allTeamMembers.length} total team members for facility ${facilityId}`);

        // Get all staff auth records for this facility
        const existingStaff = await storage.getStaffAuthByFacility(facilityId);
        console.log(`[Portal Access] Found ${existingStaff.length} existing staff auth records`);

        // Get team member IDs that already have portal access
        const staffTeamMemberIds = new Set(
          existingStaff
            .filter((s) => s.teamMemberId)
            .map((s) => s.teamMemberId)
        );
        console.log(`[Portal Access] ${staffTeamMemberIds.size} team members already have portal access`);

        // Filter to team members without portal access
        // Include all statuses except explicitly inactive ones
        const availableMembers = allTeamMembers.filter((tm) => {
          const hasAccess = staffTeamMemberIds.has(tm.id);
          const isActive = tm.status?.toLowerCase() !== "inactive";
          console.log(`[Portal Access] ${tm.name}: status=${tm.status}, hasAccess=${hasAccess}, isActive=${isActive}`);
          return !hasAccess && isActive;
        });

        console.log(`[Portal Access] ${availableMembers.length} team members available for portal access`);
        res.json(availableMembers);
      } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ error: "Failed to fetch team members" });
      }
    }
  );

  /**
   * Invite a team member to the staff portal
   * Creates staffAuth record linked to the team member
   */
  app.post(
    "/api/owners/facilities/:facilityId/staff/invite-team-member",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { teamMemberId, role } = req.body;

        if (!teamMemberId) {
          return res.status(400).json({ error: "Team member ID is required" });
        }

        // Get the team member
        const teamMember = await storage.getTeamMember(teamMemberId);
        if (!teamMember) {
          return res.status(404).json({ error: "Team member not found" });
        }

        if (teamMember.facilityId !== facilityId) {
          return res.status(403).json({ error: "Team member not in this facility" });
        }

        // Check if already has access
        const existingStaff = await storage.getStaffAuthByFacility(facilityId);
        const alreadyHasAccess = existingStaff.some(
          (s) => s.teamMemberId === teamMemberId
        );

        if (alreadyHasAccess) {
          return res.status(400).json({ error: "Team member already has portal access" });
        }

        // Parse name into first and last
        const nameParts = teamMember.name.split(" ");
        const firstName = nameParts[0] || teamMember.name;
        const lastName = nameParts.slice(1).join(" ") || "";

        // Determine role - map team member role to staff role
        let staffRole = role || "caregiver";
        if (teamMember.role === "Manager" || teamMember.role === "Administrator") {
          staffRole = "admin";
        } else if (teamMember.role === "Nurse") {
          staffRole = "nurse";
        } else if (teamMember.role === "Med Tech" || teamMember.role === "Medication Technician") {
          staffRole = "med_tech";
        }

        // Create staff auth record linked to team member
        const newStaff = await storage.createStaffAuth({
          facilityId,
          teamMemberId,
          email: teamMember.email || `staff_${teamMember.id.substring(0, 8)}@portal.local`,
          firstName,
          lastName,
          role: staffRole,
          permissions: {
            canAdministerMeds: staffRole !== "caregiver",
            canAdministerControlled: staffRole === "nurse" || staffRole === "admin",
            canFileIncidents: true,
            canEditResidents: staffRole === "admin" || staffRole === "nurse",
          },
          status: "active", // Direct activation since linked to team member
        });

        // Log activity
        const owner = (req as any).owner;
        await ActivityLogger.staffCreated(
          req,
          owner.id,
          owner.name,
          facilityId,
          newStaff.id,
          teamMember.name
        );

        res.json({
          success: true,
          staff: {
            id: newStaff.id,
            teamMemberId: newStaff.teamMemberId,
            firstName: newStaff.firstName,
            lastName: newStaff.lastName,
            role: newStaff.role,
            status: newStaff.status,
          },
        });
      } catch (error) {
        console.error("Error inviting team member to staff portal:", error);
        res.status(500).json({ error: "Failed to grant portal access" });
      }
    }
  );

  /**
   * Grant portal access to team member with a PIN
   * Creates staffAuth record linked to team member with hashed PIN
   */
  app.post(
    "/api/owners/facilities/:facilityId/staff/grant-access",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { teamMemberId, role, temporaryPin } = req.body;

        if (!teamMemberId) {
          return res.status(400).json({ error: "Team member ID is required" });
        }

        if (!temporaryPin || temporaryPin.length !== 4) {
          return res.status(400).json({ error: "A 4-digit PIN is required" });
        }

        // Get the team member
        const teamMember = await storage.getTeamMember(teamMemberId);
        if (!teamMember) {
          return res.status(404).json({ error: "Team member not found" });
        }

        if (teamMember.facilityId !== facilityId) {
          return res.status(403).json({ error: "Team member not in this facility" });
        }

        // Check if already has access
        const existingStaff = await storage.getStaffAuthByFacility(facilityId);
        const alreadyHasAccess = existingStaff.some(
          (s) => s.teamMemberId === teamMemberId
        );

        if (alreadyHasAccess) {
          return res.status(400).json({ error: "Team member already has portal access" });
        }

        // Parse name into first and last
        const nameParts = teamMember.name.split(" ");
        const firstName = nameParts[0] || teamMember.name;
        const lastName = nameParts.slice(1).join(" ") || "";

        // Determine role - map team member role to staff role
        let staffRole = role || "caregiver";
        if (!role) {
          if (teamMember.role === "Manager" || teamMember.role === "Administrator") {
            staffRole = "admin";
          } else if (teamMember.role === "Nurse") {
            staffRole = "nurse";
          } else if (teamMember.role === "Med Tech" || teamMember.role === "Medication Technician") {
            staffRole = "med_tech";
          }
        }

        // Hash the PIN
        const hashedPin = await bcrypt.hash(temporaryPin, 10);

        // Create staff auth record linked to team member with PIN
        const newStaff = await storage.createStaffAuth({
          facilityId,
          teamMemberId,
          email: teamMember.email || `staff_${teamMember.id.substring(0, 8)}@portal.local`,
          firstName,
          lastName,
          role: staffRole,
          pin: hashedPin,
          permissions: {
            canAdministerMeds: staffRole !== "caregiver",
            canAdministerControlled: staffRole === "nurse" || staffRole === "admin",
            canFileIncidents: true,
            canEditResidents: staffRole === "admin" || staffRole === "nurse",
          },
          status: "active", // Direct activation since owner created with PIN
        });

        // Log activity
        const owner = (req as any).owner;
        await ActivityLogger.staffCreated(
          req,
          owner.id,
          owner.name,
          facilityId,
          newStaff.id,
          teamMember.name
        );

        res.json({
          success: true,
          staff: {
            id: newStaff.id,
            teamMemberId: newStaff.teamMemberId,
            firstName: newStaff.firstName,
            lastName: newStaff.lastName,
            role: newStaff.role,
            status: newStaff.status,
          },
        });
      } catch (error) {
        console.error("Error granting portal access:", error);
        res.status(500).json({ error: "Failed to grant portal access" });
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

  // ============================================================================
  // FORM SUBMISSIONS (NCP, ISP, etc.)
  // ============================================================================

  /**
   * Get all form submissions for a facility
   */
  app.get(
    "/api/owners/facilities/:facilityId/forms",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { formType } = req.query;

        const submissions = await storage.getFormSubmissionsByFacility(
          facilityId,
          formType as string | undefined
        );
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching form submissions:", error);
        res.status(500).json({ error: "Failed to fetch form submissions" });
      }
    }
  );

  /**
   * Get a specific form submission
   */
  app.get(
    "/api/owners/facilities/:facilityId/forms/:formId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { formId } = req.params;
        const submission = await storage.getFormSubmission(parseInt(formId, 10));

        if (!submission) {
          return res.status(404).json({ error: "Form submission not found" });
        }

        res.json(submission);
      } catch (error) {
        console.error("Error fetching form submission:", error);
        res.status(500).json({ error: "Failed to fetch form submission" });
      }
    }
  );

  /**
   * Create a new form submission (draft or completed)
   */
  app.post(
    "/api/owners/facilities/:facilityId/forms",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const {
          residentId,
          formType,
          formTitle,
          status,
          currentSection,
          totalSections,
          completionPercentage,
          formData,
        } = req.body;

        const submission = await storage.createFormSubmission({
          facilityId,
          residentId: residentId || null,
          formType,
          formTitle,
          status: status || "draft",
          currentSection: currentSection || 1,
          totalSections: totalSections || 1,
          completionPercentage: completionPercentage || 0,
          formData: formData || "{}",
        });

        res.status(201).json(submission);
      } catch (error) {
        console.error("Error creating form submission:", error);
        res.status(500).json({ error: "Failed to create form submission" });
      }
    }
  );

  /**
   * Update an existing form submission
   */
  app.put(
    "/api/owners/facilities/:facilityId/forms/:formId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { formId } = req.params;
        const formIdNum = parseInt(formId, 10);
        const {
          residentId,
          formTitle,
          status,
          currentSection,
          totalSections,
          completionPercentage,
          formData,
        } = req.body;

        // Check if submission exists
        const existing = await storage.getFormSubmission(formIdNum);
        if (!existing) {
          return res.status(404).json({ error: "Form submission not found" });
        }

        const updated = await storage.updateFormSubmission(formIdNum, {
          residentId: residentId !== undefined ? residentId : existing.residentId,
          formTitle: formTitle || existing.formTitle,
          status: status || existing.status,
          currentSection: currentSection !== undefined ? currentSection : existing.currentSection,
          totalSections: totalSections !== undefined ? totalSections : existing.totalSections,
          completionPercentage: completionPercentage !== undefined ? completionPercentage : existing.completionPercentage,
          formData: formData || existing.formData,
        });

        res.json(updated);
      } catch (error) {
        console.error("Error updating form submission:", error);
        res.status(500).json({ error: "Failed to update form submission" });
      }
    }
  );

  /**
   * Delete a form submission
   */
  app.delete(
    "/api/owners/facilities/:facilityId/forms/:formId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { formId } = req.params;
        const formIdNum = parseInt(formId, 10);

        const existing = await storage.getFormSubmission(formIdNum);
        if (!existing) {
          return res.status(404).json({ error: "Form submission not found" });
        }

        await storage.deleteFormSubmission(formIdNum);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting form submission:", error);
        res.status(500).json({ error: "Failed to delete form submission" });
      }
    }
  );

  /**
   * Get form submissions for a specific resident
   */
  app.get(
    "/api/owners/facilities/:facilityId/residents/:residentId/forms",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { residentId } = req.params;
        const { formType } = req.query;

        const submissions = await storage.getFormSubmissionsByResident(
          residentId,
          formType as string | undefined
        );
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching resident form submissions:", error);
        res.status(500).json({ error: "Failed to fetch form submissions" });
      }
    }
  );

  // ============================================================================
  // DASHBOARD WIDGETS
  // ============================================================================

  /**
   * Get upcoming events/deadlines for dashboard widget
   * Combines: expiring credentials, upcoming events, compliance deadlines
   */
  app.get(
    "/api/owners/facilities/:facilityId/dashboard/upcoming",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const daysAhead = parseInt(req.query.days as string) || 30;

        // Get expiring credentials
        const expiringCredentials = await storage.getExpiringCredentials(facilityId, daysAhead);

        // Get upcoming custom events
        const upcomingEvents = await storage.getUpcomingFacilityEvents(facilityId, daysAhead);

        // Transform credentials to event format
        const credentialEvents = expiringCredentials.map((cred) => {
          const expirationDate = cred.expirationDate || cred.expiryDate;
          return {
            id: `cred-${cred.id}`,
            type: "credential_expiring" as const,
            title: `${cred.credentialType || cred.name} expiring`,
            description: `Credential expires on ${expirationDate}`,
            date: expirationDate,
            priority: getDaysUntil(expirationDate) <= 7 ? "high" : getDaysUntil(expirationDate) <= 14 ? "medium" : "low",
            relatedId: cred.id,
            relatedType: "credential",
          };
        });

        // Transform custom events
        const customEvents = upcomingEvents.map((event) => ({
          id: `event-${event.id}`,
          type: event.eventType as string,
          title: event.title,
          description: event.description || "",
          date: event.eventDate.toISOString().split("T")[0],
          time: event.eventTime || null,
          priority: "medium" as const,
          relatedId: event.residentId || null,
          relatedType: event.residentId ? "resident" : null,
          eventId: event.id,
        }));

        // Combine and sort by date
        const allEvents = [...credentialEvents, ...customEvents].sort((a, b) => {
          const dateA = new Date(a.date || "");
          const dateB = new Date(b.date || "");
          return dateA.getTime() - dateB.getTime();
        });

        res.json({
          events: allEvents,
          summary: {
            total: allEvents.length,
            credentials: credentialEvents.length,
            appointments: customEvents.filter((e) => e.type === "appointment").length,
            other: customEvents.filter((e) => e.type !== "appointment").length,
          },
        });
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ error: "Failed to fetch upcoming events" });
      }
    }
  );

  /**
   * Get recent activity feed for dashboard widget
   */
  app.get(
    "/api/owners/facilities/:facilityId/dashboard/activity",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;

        const activities = await storage.getRecentFacilityActivity(facilityId, limit);

        // Format activities for display
        const formattedActivities = activities.map((activity) => ({
          id: activity.id,
          type: activity.activityType,
          title: activity.title,
          description: activity.description || "",
          performedBy: activity.performedBy || "System",
          timestamp: activity.createdAt,
          relatedId: activity.relatedId,
          relatedType: activity.relatedType,
        }));

        res.json(formattedActivities);
      } catch (error) {
        console.error("Error fetching activity feed:", error);
        res.status(500).json({ error: "Failed to fetch activity feed" });
      }
    }
  );

  /**
   * Create a new calendar event
   */
  app.post(
    "/api/owners/facilities/:facilityId/events",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { title, description, eventType, eventDate, eventTime, residentId } = req.body;

        if (!title || !eventType || !eventDate) {
          return res.status(400).json({ error: "Title, event type, and date are required" });
        }

        const event = await storage.createFacilityEvent({
          facilityId,
          title,
          description: description || null,
          eventType,
          eventDate: new Date(eventDate),
          eventTime: eventTime || null,
          residentId: residentId || null,
        });

        // Log activity
        await storage.createFacilityActivity({
          facilityId,
          activityType: "event_created",
          title: `Event scheduled: ${title}`,
          description: `${eventType} scheduled for ${new Date(eventDate).toLocaleDateString()}`,
          performedBy: (req as any).owner?.name || "Owner",
          relatedId: event.id.toString(),
          relatedType: "event",
        });

        res.status(201).json(event);
      } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
      }
    }
  );

  /**
   * Mark an event as complete
   */
  app.patch(
    "/api/owners/facilities/:facilityId/events/:eventId/complete",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, eventId } = req.params;

        const event = await storage.getFacilityEvent(parseInt(eventId));
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }

        if (event.facilityId !== facilityId) {
          return res.status(403).json({ error: "Event not in this facility" });
        }

        const updated = await storage.markFacilityEventComplete(parseInt(eventId));

        // Log activity
        await storage.createFacilityActivity({
          facilityId,
          activityType: "event_completed",
          title: `Event completed: ${event.title}`,
          description: `${event.eventType} marked as complete`,
          performedBy: (req as any).owner?.name || "Owner",
          relatedId: eventId,
          relatedType: "event",
        });

        res.json(updated);
      } catch (error) {
        console.error("Error completing event:", error);
        res.status(500).json({ error: "Failed to complete event" });
      }
    }
  );

  /**
   * Delete an event
   */
  app.delete(
    "/api/owners/facilities/:facilityId/events/:eventId",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId, eventId } = req.params;

        const event = await storage.getFacilityEvent(parseInt(eventId));
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }

        if (event.facilityId !== facilityId) {
          return res.status(403).json({ error: "Event not in this facility" });
        }

        await storage.deleteFacilityEvent(parseInt(eventId));
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
      }
    }
  );

  /**
   * Log a manual activity (for tracking actions)
   */
  app.post(
    "/api/owners/facilities/:facilityId/activity",
    requireOwnerAuth,
    requireFacilityOwnership,
    async (req, res) => {
      try {
        const { facilityId } = req.params;
        const { activityType, title, description, relatedId, relatedType } = req.body;

        if (!activityType || !title) {
          return res.status(400).json({ error: "Activity type and title are required" });
        }

        const activity = await storage.createFacilityActivity({
          facilityId,
          activityType,
          title,
          description: description || null,
          performedBy: (req as any).owner?.name || "Owner",
          relatedId: relatedId || null,
          relatedType: relatedType || null,
        });

        res.status(201).json(activity);
      } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ error: "Failed to log activity" });
      }
    }
  );
}

// Helper function to calculate days until a date
function getDaysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
