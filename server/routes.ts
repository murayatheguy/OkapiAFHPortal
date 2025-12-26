import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFacilitySchema, insertTeamMemberSchema, insertCredentialSchema, insertInquirySchema, insertReviewSchema, insertOwnerSchema, insertClaimRequestSchema, insertActivityLogSchema, insertTransportProviderSchema, insertTransportBookingSchema, insertProviderReviewSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerEhrRoutes } from "./routes/ehr";
import { registerOwnerEhrRoutes } from "./routes/owner-ehr";
import { registerPdfRoutes } from "./routes/pdf-generator";
import { facilityCapabilities } from "@shared/schema";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import { ActivityLogger } from "./lib/activity-logger";
import {
  isAccountLocked,
  recordFailedLogin,
  clearFailedAttempts,
  createActiveSession,
  getRemainingAttempts,
} from "./middleware/security";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // FACILITIES API
  // ============================================
  
  // Get featured facilities for homepage (must be before :id route)
  app.get("/api/facilities/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 6;
      const featuredFacilities = await storage.getFeaturedFacilities(limit);

      // Calculate availableBeds dynamically for each facility
      const facilitiesWithCalculatedBeds = await Promise.all(
        featuredFacilities.map(async (facility) => {
          const activeResidentCount = await storage.getActiveResidentCount(facility.id);
          const calculatedAvailableBeds = Math.max(0, (facility.capacity || 0) - activeResidentCount);
          return {
            ...facility,
            availableBeds: calculatedAvailableBeds,
            currentOccupancy: activeResidentCount
          };
        })
      );

      res.json(facilitiesWithCalculatedBeds);
    } catch (error) {
      console.error("Error getting featured facilities:", error);
      res.status(500).json({ error: "Failed to get featured facilities" });
    }
  });

  // Get facilities with their capabilities for care matching
  app.get("/api/facilities/with-capabilities", async (req, res) => {
    try {
      const { city, county, specialties, acceptsMedicaid, availableBeds } = req.query;

      const searchParams: any = {};

      if (city) searchParams.city = String(city);
      if (county) searchParams.county = String(county);
      if (specialties) {
        searchParams.specialties = typeof specialties === 'string'
          ? [specialties]
          : specialties;
      }
      if (acceptsMedicaid !== undefined) {
        searchParams.acceptsMedicaid = acceptsMedicaid === 'true';
      }
      const filterByAvailableBeds = availableBeds === 'true';

      const facilities = await storage.searchFacilities(searchParams);

      // Calculate availableBeds dynamically for each facility
      const facilitiesWithCalculatedBeds = await Promise.all(
        facilities.map(async (facility) => {
          const activeResidentCount = await storage.getActiveResidentCount(facility.id);
          const calculatedAvailableBeds = Math.max(0, (facility.capacity || 0) - activeResidentCount);
          return {
            ...facility,
            availableBeds: calculatedAvailableBeds,
            currentOccupancy: activeResidentCount
          };
        })
      );

      // Apply availableBeds filter if requested
      const filteredFacilities = filterByAvailableBeds
        ? facilitiesWithCalculatedBeds.filter(f => f.availableBeds > 0)
        : facilitiesWithCalculatedBeds;

      // Fetch capabilities for all facilities
      const facilityIds = filteredFacilities.map(f => f.id);
      const capabilities = await db
        .select()
        .from(facilityCapabilities)
        .where(inArray(facilityCapabilities.facilityId, facilityIds.length > 0 ? facilityIds : ['']));

      // Create a map for quick lookup
      const capabilitiesMap = new Map(capabilities.map(c => [c.facilityId, c]));

      // Combine facilities with their capabilities
      const facilitiesWithCapabilities = filteredFacilities.map(f => ({
        ...f,
        capabilities: capabilitiesMap.get(f.id) || null
      }));

      res.json(facilitiesWithCapabilities);
    } catch (error) {
      console.error("Error getting facilities with capabilities:", error);
      res.status(500).json({ error: "Failed to get facilities with capabilities" });
    }
  });

  // Autocomplete search for facilities by name (must be before :id route)
  app.get("/api/facilities/autocomplete", async (req, res) => {
    try {
      const query = String(req.query.q || "");
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
      
      if (query.length < 2) {
        return res.json([]);
      }
      
      const results = await storage.autocompleteFacilities(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error in autocomplete search:", error);
      res.status(500).json({ error: "Failed to search facilities" });
    }
  });
  
  // Get all facilities (for search page)
  app.get("/api/facilities", async (req, res) => {
    try {
      const { city, county, specialties, acceptsMedicaid, availableBeds } = req.query;

      const searchParams: any = {};

      if (city) searchParams.city = String(city);
      if (county) searchParams.county = String(county);
      if (specialties) {
        searchParams.specialties = typeof specialties === 'string'
          ? [specialties]
          : specialties;
      }
      if (acceptsMedicaid !== undefined) {
        searchParams.acceptsMedicaid = acceptsMedicaid === 'true';
      }
      // Note: availableBeds filter will be applied after dynamic calculation
      const filterByAvailableBeds = availableBeds === 'true';

      const facilities = await storage.searchFacilities(searchParams);

      // Calculate availableBeds dynamically for each facility
      const facilitiesWithCalculatedBeds = await Promise.all(
        facilities.map(async (facility) => {
          const activeResidentCount = await storage.getActiveResidentCount(facility.id);
          const calculatedAvailableBeds = Math.max(0, (facility.capacity || 0) - activeResidentCount);
          return {
            ...facility,
            availableBeds: calculatedAvailableBeds,
            currentOccupancy: activeResidentCount
          };
        })
      );

      // Apply availableBeds filter if requested
      const filteredFacilities = filterByAvailableBeds
        ? facilitiesWithCalculatedBeds.filter(f => f.availableBeds > 0)
        : facilitiesWithCalculatedBeds;

      res.json(filteredFacilities);
    } catch (error) {
      console.error("Error searching facilities:", error);
      res.status(500).json({ error: "Failed to search facilities" });
    }
  });

  // Get single facility by ID or slug
  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getFacilityByIdOrSlug(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      // Calculate availableBeds dynamically: capacity - active residents count
      const activeResidentCount = await storage.getActiveResidentCount(facility.id);
      const calculatedAvailableBeds = Math.max(0, (facility.capacity || 0) - activeResidentCount);

      res.json({
        ...facility,
        availableBeds: calculatedAvailableBeds,
        currentOccupancy: activeResidentCount
      });
    } catch (error) {
      console.error("Error getting facility:", error);
      res.status(500).json({ error: "Failed to get facility" });
    }
  });

  // Get facility with full team and credentials
  app.get("/api/facilities/:id/full", async (req, res) => {
    try {
      const data = await storage.getFacilityWithTeam(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error getting facility with team:", error);
      res.status(500).json({ error: "Failed to get facility data" });
    }
  });

  // Get DSHS inspections for a facility
  app.get("/api/facilities/:id/inspections", async (req, res) => {
    try {
      const inspections = await storage.getInspectionsByFacility(req.params.id);
      res.json(inspections);
    } catch (error) {
      console.error("Error getting facility inspections:", error);
      res.status(500).json({ error: "Failed to get inspections" });
    }
  });

  // Create new facility
  app.post("/api/facilities", async (req, res) => {
    try {
      const result = insertFacilitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }
      
      const facility = await storage.createFacility(result.data);
      res.status(201).json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ error: "Failed to create facility" });
    }
  });

  // Update facility
  app.patch("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.updateFacility(req.params.id, req.body);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ error: "Failed to update facility" });
    }
  });

  // ============================================
  // TEAM MEMBERS API
  // ============================================
  
  // Get team members for a facility
  app.get("/api/facilities/:facilityId/team", async (req, res) => {
    try {
      const members = await storage.getTeamMembersByFacility(req.params.facilityId);
      
      // Fetch credentials for each member
      const membersWithCredentials = await Promise.all(
        members.map(async (member) => {
          const credentials = await storage.getCredentialsByTeamMember(member.id);
          return { ...member, credentials };
        })
      );
      
      res.json(membersWithCredentials);
    } catch (error) {
      console.error("Error getting team members:", error);
      res.status(500).json({ error: "Failed to get team members" });
    }
  });

  // Get single team member
  app.get("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      const credentials = await storage.getCredentialsByTeamMember(member.id);
      res.json({ ...member, credentials });
    } catch (error) {
      console.error("Error getting team member:", error);
      res.status(500).json({ error: "Failed to get team member" });
    }
  });

  // Create team member
  app.post("/api/team-members", async (req, res) => {
    try {
      const result = insertTeamMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }
      
      const member = await storage.createTeamMember(result.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  // Update team member
  app.patch("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member
  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      await storage.deleteTeamMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // ============================================
  // CREDENTIALS API
  // ============================================
  
  // Get credentials for a team member
  app.get("/api/team-members/:teamMemberId/credentials", async (req, res) => {
    try {
      const credentials = await storage.getCredentialsByTeamMember(req.params.teamMemberId);
      res.json(credentials);
    } catch (error) {
      console.error("Error getting credentials:", error);
      res.status(500).json({ error: "Failed to get credentials" });
    }
  });

  // Create credential
  app.post("/api/credentials", async (req, res) => {
    try {
      const result = insertCredentialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }
      
      const credential = await storage.createCredential(result.data);
      res.status(201).json(credential);
    } catch (error) {
      console.error("Error creating credential:", error);
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  // Update credential
  app.patch("/api/credentials/:id", async (req, res) => {
    try {
      const credential = await storage.updateCredential(req.params.id, req.body);
      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      console.error("Error updating credential:", error);
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  // Delete credential
  app.delete("/api/credentials/:id", async (req, res) => {
    try {
      await storage.deleteCredential(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ error: "Failed to delete credential" });
    }
  });

  // ============================================
  // INQUIRIES API
  // ============================================
  
  // Get inquiries for a facility
  app.get("/api/facilities/:facilityId/inquiries", async (req, res) => {
    try {
      const inquiriesList = await storage.getInquiriesByFacility(req.params.facilityId);
      res.json(inquiriesList);
    } catch (error) {
      console.error("Error getting inquiries:", error);
      res.status(500).json({ error: "Failed to get inquiries" });
    }
  });

  // Create inquiry (for families contacting facilities)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const result = insertInquirySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }
      
      const inquiry = await storage.createInquiry(result.data);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.updateInquiry(req.params.id, req.body);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });

  // ============================================
  // ADMIN API
  // ============================================

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { passwordHash, ...adminData } = admin;
      res.json({ admin: adminData });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get admin stats for dashboard
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get all inquiries for admin
  app.get("/api/admin/inquiries", async (req, res) => {
    try {
      const allInquiries = await storage.getAllInquiries();
      res.json(allInquiries);
    } catch (error) {
      console.error("Error getting all inquiries:", error);
      res.status(500).json({ error: "Failed to get inquiries" });
    }
  });

  // ============================================
  // REVIEWS API
  // ============================================

  // Get all reviews (admin)
  app.get("/api/reviews", async (req, res) => {
    try {
      const status = req.query.status as string;
      const reviewsList = status 
        ? await storage.getReviewsByStatus(status)
        : await storage.getAllReviews();
      res.json(reviewsList);
    } catch (error) {
      console.error("Error getting reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // Get approved reviews for a facility (public)
  app.get("/api/facilities/:facilityId/reviews", async (req, res) => {
    try {
      const reviewsList = await storage.getApprovedReviewsByFacility(req.params.facilityId);
      res.json(reviewsList);
    } catch (error) {
      console.error("Error getting facility reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // Create review
  app.post("/api/reviews", async (req, res) => {
    try {
      const result = insertReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }
      
      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Update review (admin moderation, owner response)
  app.patch("/api/reviews/:id", async (req, res) => {
    try {
      const review = await storage.updateReview(req.params.id, req.body);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // Delete review (admin)
  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      await storage.deleteReview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // ============================================
  // OWNERS API
  // ============================================

  // Get all owners (admin)
  app.get("/api/owners", async (req, res) => {
    try {
      const ownersList = await storage.getAllOwners();
      res.json(ownersList);
    } catch (error) {
      console.error("Error getting owners:", error);
      res.status(500).json({ error: "Failed to get owners" });
    }
  });

  // Owner login with HIPAA-compliant lockout protection
  app.post("/api/owners/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if account is locked due to failed attempts
      const lockStatus = await isAccountLocked(email, "owner");
      if (lockStatus.locked) {
        await ActivityLogger.loginFailed(req, email);
        return res.status(423).json({
          error: "Account locked",
          code: "ACCOUNT_LOCKED",
          message: `Too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minutes.`,
          lockedUntil: lockStatus.lockedUntil,
        });
      }

      const owner = await storage.getOwnerByEmail(email);
      if (!owner) {
        await recordFailedLogin(email, "owner", undefined, req);
        await ActivityLogger.loginFailed(req, email);
        const remaining = await getRemainingAttempts(email, "owner");
        return res.status(401).json({
          error: "Invalid credentials",
          remainingAttempts: remaining,
        });
      }

      if (!owner.passwordHash) {
        await recordFailedLogin(email, "owner", undefined, req);
        await ActivityLogger.loginFailed(req, email);
        return res.status(401).json({ error: "Password not set. Please complete account setup first." });
      }

      if (owner.status !== "active") {
        await ActivityLogger.loginFailed(req, email);
        return res.status(401).json({ error: "Account is not active. Please verify your email or contact support." });
      }

      const isValid = await bcrypt.compare(password, owner.passwordHash);
      if (!isValid) {
        await recordFailedLogin(email, "owner", undefined, req);
        await ActivityLogger.loginFailed(req, email);

        // Check if now locked after this attempt
        const newLockStatus = await isAccountLocked(email, "owner");
        if (newLockStatus.locked) {
          return res.status(423).json({
            error: "Account locked",
            code: "ACCOUNT_LOCKED",
            message: `Too many failed login attempts. Account locked for ${newLockStatus.remainingMinutes} minutes.`,
            lockedUntil: newLockStatus.lockedUntil,
          });
        }

        const remaining = await getRemainingAttempts(email, "owner");
        return res.status(401).json({
          error: "Invalid credentials",
          remainingAttempts: remaining,
        });
      }

      // Clear failed attempts on successful login
      await clearFailedAttempts(email, "owner");

      await storage.updateOwner(owner.id, { lastLoginAt: new Date() });

      const { passwordHash: _, ...ownerData } = owner;

      (req.session as any).ownerId = owner.id;

      // Get owner's first facility ID for logging and session tracking
      const facilities = await storage.getFacilitiesByOwner(owner.id);
      const facilityId = facilities.length > 0 ? facilities[0].id : undefined;

      // Create active session for timeout tracking
      await createActiveSession(
        req.sessionID,
        owner.id,
        "owner",
        facilityId || null,
        req,
        15 // Default 15 minute timeout
      );

      // Log successful login
      await ActivityLogger.login(req, owner.id, owner.name, 'owner', facilityId);

      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed - session error" });
        }
        res.json({ owner: ownerData });
      });
    } catch (error) {
      console.error("Error during owner login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current owner (me)
  app.get("/api/owners/me", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        (req.session as any).ownerId = null;
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { passwordHash: _, ...ownerData } = owner;
      res.json(ownerData);
    } catch (error) {
      console.error("Error getting current owner:", error);
      res.status(500).json({ error: "Failed to get owner data" });
    }
  });

  // Get current owner's facilities
  app.get("/api/owners/me/facilities", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const facilitiesList = await storage.getFacilitiesByOwner(ownerId);

      // Calculate availableBeds dynamically for each facility
      const facilitiesWithCalculatedBeds = await Promise.all(
        facilitiesList.map(async (facility) => {
          const activeResidentCount = await storage.getActiveResidentCount(facility.id);
          const calculatedAvailableBeds = Math.max(0, (facility.capacity || 0) - activeResidentCount);
          return {
            ...facility,
            availableBeds: calculatedAvailableBeds,
            currentOccupancy: activeResidentCount
          };
        })
      );

      res.json(facilitiesWithCalculatedBeds);
    } catch (error) {
      console.error("Error getting owner facilities:", error);
      res.status(500).json({ error: "Failed to get facilities" });
    }
  });

  // Update owner's facility
  app.patch("/api/owners/facilities/:facilityId", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;

      // Verify the facility belongs to this owner
      const facility = await storage.getFacility(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      if (facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized to update this facility" });
      }

      // Only allow updating specific fields
      // Note: availableBeds and currentOccupancy are calculated dynamically from resident count
      const allowedFields = [
        'name', 'description', 'phone', 'email', 'website',
        'capacity', // capacity is editable, but availableBeds is auto-calculated
        'amenities', 'specialties', 'careTypes',
        'acceptsMedicaid', 'acceptsMedicare', 'acceptsPrivatePay',
        'priceMin', 'priceMax', 'images', 'acceptingInquiries',
        // Listing customization fields
        'ownerBio', 'carePhilosophy', 'dailyRoutine', 'uniqueFeatures',
        'roomTypes', 'acceptsLTCInsurance', 'acceptsVABenefits'
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedFacility = await storage.updateFacility(facilityId, updateData);

      // Log activity
      const owner = await storage.getOwner(ownerId);
      if (owner && updatedFacility) {
        await ActivityLogger.facilityUpdated(req, ownerId, owner.name, facilityId, updatedFacility.name, updateData);
      }

      res.json(updatedFacility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ error: "Failed to update facility" });
    }
  });

  // Generate staff PIN for facility
  app.post("/api/owners/facilities/:facilityId/generate-pin", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;

      // Verify the facility belongs to this owner
      const facility = await storage.getFacility(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      if (facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Generate a random 4-digit PIN
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      const updatedFacility = await storage.updateFacility(facilityId, { facilityPin: pin });
      res.json({ pin: updatedFacility?.facilityPin, message: "Staff PIN generated successfully" });
    } catch (error) {
      console.error("Error generating PIN:", error);
      res.status(500).json({ error: "Failed to generate PIN" });
    }
  });

  // Get facility PIN (for owner only)
  app.get("/api/owners/facilities/:facilityId/pin", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;

      const facility = await storage.getFacility(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      if (facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json({ pin: facility.facilityPin || null });
    } catch (error) {
      console.error("Error getting PIN:", error);
      res.status(500).json({ error: "Failed to get PIN" });
    }
  });

  // ============================================================================
  // OWNER RESIDENT MANAGEMENT ROUTES
  // ============================================================================

  // Get all residents for owner's facility
  app.get("/api/owners/facilities/:facilityId/residents", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);
      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const residents = await storage.getResidentsByFacility(facilityId);
      res.json(residents);
    } catch (error) {
      console.error("Error getting residents:", error);
      res.status(500).json({ error: "Failed to get residents" });
    }
  });

  // Create a new resident (client)
  app.post("/api/owners/facilities/:facilityId/residents", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);
      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Check capacity (max 6 for AFH)
      const existingResidents = await storage.getResidentsByFacility(facilityId, "active");
      if (existingResidents.length >= facility.capacity) {
        return res.status(400).json({ error: `Facility at capacity (${facility.capacity} beds)` });
      }

      const resident = await storage.createResident({
        facilityId,
        ...req.body,
      });

      // Log activity
      const owner = await storage.getOwner(ownerId);
      if (owner) {
        const residentName = `${req.body.firstName} ${req.body.lastName}`;
        await ActivityLogger.residentCreated(req, ownerId, owner.name, facilityId, resident.id, residentName);
      }

      res.status(201).json(resident);
    } catch (error) {
      console.error("Error creating resident:", error);
      res.status(500).json({ error: "Failed to create resident" });
    }
  });

  // Update a resident
  app.put("/api/owners/facilities/:facilityId/residents/:residentId", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);
      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      const updated = await storage.updateResident(residentId, req.body);

      // Log activity
      const owner = await storage.getOwner(ownerId);
      if (owner && updated) {
        const residentName = `${updated.firstName} ${updated.lastName}`;
        await ActivityLogger.residentUpdated(req, ownerId, owner.name, facilityId, residentId, residentName, req.body);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating resident:", error);
      res.status(500).json({ error: "Failed to update resident" });
    }
  });

  // Discharge a resident
  app.post("/api/owners/facilities/:facilityId/residents/:residentId/discharge", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);
      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      const { dischargeReason } = req.body;
      const updated = await storage.updateResident(residentId, {
        status: "discharged",
        notes: resident.notes
          ? `${resident.notes}\n\nDischarged: ${dischargeReason || "No reason provided"}`
          : `Discharged: ${dischargeReason || "No reason provided"}`,
      });

      // Update available beds
      await storage.updateFacility(facilityId, {
        availableBeds: (facility.availableBeds || 0) + 1,
      });

      // Log activity
      const owner = await storage.getOwner(ownerId);
      if (owner) {
        const residentName = `${resident.firstName} ${resident.lastName}`;
        await ActivityLogger.residentDischarged(req, ownerId, owner.name, facilityId, residentId, residentName);
      }

      res.json(updated);
    } catch (error) {
      console.error("Error discharging resident:", error);
      res.status(500).json({ error: "Failed to discharge resident" });
    }
  });

  // Get notes for a resident (owner access)
  app.get("/api/owners/facilities/:facilityId/residents/:residentId/notes", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      // Get all notes with staff name
      const notes = await storage.getDailyNotesByResidentWithStaff(residentId);
      res.json(notes);
    } catch (error) {
      console.error("Error getting resident notes:", error);
      res.status(500).json({ error: "Failed to get notes" });
    }
  });

  // Get medications for a resident (owner access)
  app.get("/api/owners/facilities/:facilityId/residents/:residentId/medications", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      const medications = await storage.getMedicationsByResident(residentId);
      res.json(medications);
    } catch (error) {
      console.error("Error getting resident medications:", error);
      res.status(500).json({ error: "Failed to get medications" });
    }
  });

  // Get vitals for a resident (owner access)
  app.get("/api/owners/facilities/:facilityId/residents/:residentId/vitals", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      const vitals = await storage.getVitalsByResident(residentId);
      res.json(vitals);
    } catch (error) {
      console.error("Error getting resident vitals:", error);
      res.status(500).json({ error: "Failed to get vitals" });
    }
  });

  // Get incidents for a resident (owner access)
  app.get("/api/owners/facilities/:facilityId/residents/:residentId/incidents", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId, residentId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const resident = await storage.getResident(residentId);
      if (!resident || resident.facilityId !== facilityId) {
        return res.status(404).json({ error: "Resident not found" });
      }

      const incidents = await storage.getIncidentReportsByResident(residentId);
      res.json(incidents);
    } catch (error) {
      console.error("Error getting resident incidents:", error);
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  // Get all incidents for a facility (owner access - for reports)
  app.get("/api/owners/facilities/:facilityId/ehr/incidents", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      let incidents = await storage.getIncidentReportsByFacility(facilityId);

      // Filter by date range if provided
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (startDate || endDate) {
        incidents = incidents.filter((incident) => {
          const incidentDate = incident.incidentDate;
          if (startDate && incidentDate < startDate) return false;
          if (endDate && incidentDate > endDate) return false;
          return true;
        });
      }

      res.json(incidents);
    } catch (error) {
      console.error("Error getting facility incidents:", error);
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  // Get medication logs for a facility (owner access - for reports)
  app.get("/api/owners/facilities/:facilityId/ehr/medication-logs", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Support explicit startDate/endDate or fallback to days parameter
      let startDate: string;
      let endDate: string | undefined;

      if (req.query.startDate) {
        startDate = req.query.startDate as string;
        endDate = req.query.endDate as string || undefined;
      } else {
        const days = parseInt(req.query.days as string) || 30;
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }

      const logs = await storage.getMedicationLogsByFacilityDateRange(facilityId, startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error("Error getting medication logs:", error);
      res.status(500).json({ error: "Failed to get medication logs" });
    }
  });

  // ============================================
  // OWNER ACTIVITY LOG API
  // ============================================

  // Get activity log for a facility with filters
  app.get("/api/owners/facilities/:facilityId/activity-log", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate, category, action, limit } = req.query;

      const logs = await storage.getActivityLogByFacility(facilityId, {
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        action: action as string,
        limit: limit ? parseInt(String(limit)) : 100,
      });

      res.json(logs);
    } catch (error) {
      console.error("Error getting activity log:", error);
      res.status(500).json({ error: "Failed to get activity log" });
    }
  });

  // Get activity log summary for dashboard widget
  app.get("/api/owners/facilities/:facilityId/activity-log/summary", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { facilityId } = req.params;
      const facility = await storage.getFacility(facilityId);

      if (!facility || facility.ownerId !== ownerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const summary = await storage.getActivityLogSummary(facilityId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting activity log summary:", error);
      res.status(500).json({ error: "Failed to get activity log summary" });
    }
  });

  // Get current owner's claims
  app.get("/api/owners/me/claims", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }

      const claims = await storage.getClaimRequestsByEmail(owner.email);
      res.json(claims);
    } catch (error) {
      console.error("Error getting owner claims:", error);
      res.status(500).json({ error: "Failed to get claims" });
    }
  });

  // Owner logout
  app.post("/api/owners/logout", async (req, res) => {
    try {
      const ownerId = (req.session as any).ownerId;
      if (ownerId) {
        const owner = await storage.getOwner(ownerId);
        if (owner) {
          const facilities = await storage.getFacilitiesByOwner(owner.id);
          const facilityId = facilities.length > 0 ? facilities[0].id : undefined;
          await ActivityLogger.logout(req, owner.id, owner.name, 'owner', facilityId);
        }
      }
      (req.session as any).ownerId = null;
      res.json({ success: true });
    } catch (error) {
      console.error("Error during logout:", error);
      (req.session as any).ownerId = null;
      res.json({ success: true });
    }
  });

  // Get single owner by ID (must be after /me routes)
  app.get("/api/owners/:id", async (req, res) => {
    try {
      const owner = await storage.getOwner(req.params.id);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      res.json(owner);
    } catch (error) {
      console.error("Error getting owner:", error);
      res.status(500).json({ error: "Failed to get owner" });
    }
  });

  // Create owner (admin)
  app.post("/api/owners", async (req, res) => {
    try {
      const result = insertOwnerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const existingOwner = await storage.getOwnerByEmail(result.data.email);
      if (existingOwner) {
        return res.status(400).json({ error: "Owner with this email already exists" });
      }

      let ownerData = { ...result.data };
      if (ownerData.passwordHash) {
        ownerData.passwordHash = await bcrypt.hash(ownerData.passwordHash, 10);
      }
      
      const owner = await storage.createOwner(ownerData);
      res.status(201).json(owner);
    } catch (error) {
      console.error("Error creating owner:", error);
      res.status(500).json({ error: "Failed to create owner" });
    }
  });

  // Update owner
  app.patch("/api/owners/:id", async (req, res) => {
    try {
      let updateData = { ...req.body };
      if (updateData.passwordHash) {
        updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
      }

      const owner = await storage.updateOwner(req.params.id, updateData);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      res.json(owner);
    } catch (error) {
      console.error("Error updating owner:", error);
      res.status(500).json({ error: "Failed to update owner" });
    }
  });

  // Get owner's facilities
  app.get("/api/owners/:ownerId/facilities", async (req, res) => {
    try {
      const facilitiesList = await storage.getFacilitiesByOwner(req.params.ownerId);
      res.json(facilitiesList);
    } catch (error) {
      console.error("Error getting owner facilities:", error);
      res.status(500).json({ error: "Failed to get owner facilities" });
    }
  });

  // ============================================
  // CLAIM REQUESTS API
  // ============================================

  // Get all claim requests (admin)
  app.get("/api/claims", async (req, res) => {
    try {
      const status = req.query.status as string;
      const claims = status 
        ? await storage.getClaimRequestsByStatus(status)
        : await storage.getAllClaimRequests();
      res.json(claims);
    } catch (error) {
      console.error("Error getting claims:", error);
      res.status(500).json({ error: "Failed to get claims" });
    }
  });

  // Get pending claim requests with facility info (admin)
  app.get("/api/claims/pending", async (req, res) => {
    try {
      const pendingClaims = await storage.getPendingClaimRequests();
      res.json(pendingClaims);
    } catch (error) {
      console.error("Error getting pending claims:", error);
      res.status(500).json({ error: "Failed to get pending claims" });
    }
  });

  // Get claim stats (admin)
  app.get("/api/claims/stats", async (req, res) => {
    try {
      const stats = await storage.getClaimStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting claim stats:", error);
      res.status(500).json({ error: "Failed to get claim stats" });
    }
  });

  // Get single claim request
  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getClaimRequest(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim request not found" });
      }
      
      const facility = await storage.getFacility(claim.facilityId);
      res.json({ ...claim, facility });
    } catch (error) {
      console.error("Error getting claim:", error);
      res.status(500).json({ error: "Failed to get claim" });
    }
  });

  // Get claims for a specific facility
  app.get("/api/facilities/:facilityId/claims", async (req, res) => {
    try {
      const claims = await storage.getClaimRequestsByFacility(req.params.facilityId);
      res.json(claims);
    } catch (error) {
      console.error("Error getting facility claims:", error);
      res.status(500).json({ error: "Failed to get facility claims" });
    }
  });

  // Create claim request (public - for owners claiming facilities)
  app.post("/api/claims", async (req, res) => {
    try {
      const result = insertClaimRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: fromZodError(result.error).message 
        });
      }

      const facilityId = result.data.facilityId;
      const facility = await storage.getFacility(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.claimStatus === "claimed") {
        return res.status(400).json({ error: "This facility has already been claimed" });
      }

      const existingClaims = await storage.getClaimRequestsByFacility(facilityId);
      const pendingClaim = existingClaims.find(c => c.status === "pending" || c.status === "verified");
      if (pendingClaim) {
        return res.status(400).json({ error: "A claim request is already pending for this facility" });
      }

      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      const verificationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const claimData = {
        ...result.data,
        verificationCode,
        verificationCodeExpiresAt,
        status: "pending",
      };

      const claim = await storage.createClaimRequest(claimData);

      await storage.updateFacility(facilityId, { claimStatus: "pending" });

      await storage.createActivityLog({
        entityType: "home",
        entityId: facilityId,
        action: "claim_submitted",
        performedByType: "owner",
        details: { 
          claimId: claim.id, 
          requesterEmail: claim.requesterEmail,
          requesterName: claim.requesterName
        },
      });

      res.status(201).json({ 
        claim: { 
          id: claim.id, 
          status: claim.status,
          createdAt: claim.createdAt
        },
        message: "Claim request submitted successfully. You will receive a verification email shortly."
      });
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ error: "Failed to submit claim request" });
    }
  });

  // Verify claim (owner verifies with code)
  app.post("/api/claims/:id/verify", async (req, res) => {
    try {
      const { verificationCode } = req.body;
      
      if (!verificationCode) {
        return res.status(400).json({ error: "Verification code is required" });
      }

      const claim = await storage.getClaimRequest(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim request not found" });
      }

      if (claim.status !== "pending") {
        return res.status(400).json({ error: "Claim is not pending verification" });
      }

      if (claim.verificationAttempts && claim.verificationAttempts >= 5) {
        return res.status(400).json({ error: "Maximum verification attempts exceeded. Please submit a new claim." });
      }

      if (claim.verificationCodeExpiresAt && new Date(claim.verificationCodeExpiresAt) < new Date()) {
        return res.status(400).json({ error: "Verification code has expired. Please submit a new claim." });
      }

      if (claim.verificationCode !== verificationCode.toUpperCase()) {
        await storage.updateClaimRequest(claim.id, {
          verificationAttempts: (claim.verificationAttempts || 0) + 1
        });
        return res.status(400).json({ error: "Invalid verification code" });
      }

      const updatedClaim = await storage.updateClaimRequest(claim.id, {
        status: "verified",
      });

      await storage.createActivityLog({
        entityType: "home",
        entityId: claim.facilityId,
        action: "claim_verified",
        performedByType: "owner",
        details: { claimId: claim.id },
      });

      res.json({ 
        claim: updatedClaim,
        message: "Verification successful. Your claim is now pending admin approval."
      });
    } catch (error) {
      console.error("Error verifying claim:", error);
      res.status(500).json({ error: "Failed to verify claim" });
    }
  });

  // Approve claim (admin)
  app.post("/api/claims/:id/approve", async (req, res) => {
    try {
      const { adminId, adminNotes } = req.body;
      
      const claim = await storage.getClaimRequest(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim request not found" });
      }

      if (claim.status !== "pending" && claim.status !== "verified") {
        return res.status(400).json({ error: "Claim cannot be approved in its current status" });
      }

      let owner = await storage.getOwnerByEmail(claim.requesterEmail);
      if (!owner) {
        owner = await storage.createOwner({
          email: claim.requesterEmail,
          name: claim.requesterName,
          phone: claim.requesterPhone,
          status: "pending_verification",
        });
      }

      const updatedClaim = await storage.updateClaimRequest(claim.id, {
        status: "approved",
        ownerId: owner.id,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes,
      });

      await storage.updateFacility(claim.facilityId, {
        claimStatus: "claimed",
        ownerId: owner.id,
        claimedAt: new Date(),
      });

      await storage.createActivityLog({
        entityType: "home",
        entityId: claim.facilityId,
        action: "ownership_claimed",
        performedByType: "admin",
        performedById: adminId,
        details: { 
          claimId: claim.id,
          ownerId: owner.id,
          ownerEmail: owner.email
        },
      });

      res.json({ 
        claim: updatedClaim,
        owner,
        message: "Claim approved successfully. Owner account created/linked."
      });
    } catch (error) {
      console.error("Error approving claim:", error);
      res.status(500).json({ error: "Failed to approve claim" });
    }
  });

  // Reject claim (admin)
  app.post("/api/claims/:id/reject", async (req, res) => {
    try {
      const { adminId, rejectionReason, adminNotes } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const claim = await storage.getClaimRequest(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim request not found" });
      }

      if (claim.status !== "pending" && claim.status !== "verified") {
        return res.status(400).json({ error: "Claim cannot be rejected in its current status" });
      }

      const updatedClaim = await storage.updateClaimRequest(claim.id, {
        status: "rejected",
        rejectionReason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes,
      });

      await storage.updateFacility(claim.facilityId, {
        claimStatus: "unclaimed",
      });

      await storage.createActivityLog({
        entityType: "home",
        entityId: claim.facilityId,
        action: "claim_rejected",
        performedByType: "admin",
        performedById: adminId,
        details: { 
          claimId: claim.id,
          rejectionReason
        },
      });

      res.json({ 
        claim: updatedClaim,
        message: "Claim rejected."
      });
    } catch (error) {
      console.error("Error rejecting claim:", error);
      res.status(500).json({ error: "Failed to reject claim" });
    }
  });

  // Revoke ownership (admin)
  app.post("/api/facilities/:id/revoke-ownership", async (req, res) => {
    try {
      const { adminId, reason } = req.body;
      
      const facility = await storage.getFacility(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.claimStatus !== "claimed" || !facility.ownerId) {
        return res.status(400).json({ error: "Facility is not currently claimed" });
      }

      const previousOwnerId = facility.ownerId;

      await storage.updateFacility(req.params.id, {
        claimStatus: "unclaimed",
        ownerId: null,
        claimedAt: null,
      });

      await storage.createActivityLog({
        entityType: "home",
        entityId: req.params.id,
        action: "ownership_revoked",
        performedByType: "admin",
        performedById: adminId,
        details: { 
          previousOwnerId,
          reason
        },
      });

      res.json({ message: "Ownership revoked successfully" });
    } catch (error) {
      console.error("Error revoking ownership:", error);
      res.status(500).json({ error: "Failed to revoke ownership" });
    }
  });

  // Owner account setup (set password)
  // Validate setup token
  app.get("/api/owners/setup/validate", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);
      if (!tokenRecord) {
        return res.status(404).json({ error: "Invalid token" });
      }

      if (tokenRecord.usedAt || new Date(tokenRecord.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Token expired or already used" });
      }

      const owner = await storage.getOwner(tokenRecord.ownerId);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }

      res.json({ valid: true, name: owner.name, email: owner.email });
    } catch (error) {
      console.error("Error validating setup token:", error);
      res.status(500).json({ error: "Failed to validate token" });
    }
  });

  app.post("/api/owners/setup", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);
      if (!tokenRecord) {
        return res.status(404).json({ error: "Invalid token" });
      }

      if (tokenRecord.usedAt || new Date(tokenRecord.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Token expired or already used" });
      }

      const owner = await storage.getOwner(tokenRecord.ownerId);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }

      if (owner.passwordHash) {
        return res.status(400).json({ error: "Account already set up. Please use login." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const updatedOwner = await storage.updateOwner(owner.id, {
        passwordHash,
        status: "active",
        emailVerified: true,
      });

      await storage.markPasswordResetTokenUsed(tokenRecord.id);

      (req.session as any).ownerId = owner.id;

      const { passwordHash: _, ...ownerData } = updatedOwner!;
      res.json({ owner: ownerData, message: "Account setup complete. You can now log in." });
    } catch (error) {
      console.error("Error setting up owner account:", error);
      res.status(500).json({ error: "Failed to set up account" });
    }
  });

  // ============================================
  // ACTIVITY LOG API
  // ============================================

  // Get activity log for an entity
  app.get("/api/activity-log/:entityType/:entityId", async (req, res) => {
    try {
      const logs = await storage.getActivityLogByEntity(req.params.entityType, req.params.entityId);
      res.json(logs);
    } catch (error) {
      console.error("Error getting activity log:", error);
      res.status(500).json({ error: "Failed to get activity log" });
    }
  });

  // Get recent activity log (admin)
  app.get("/api/admin/activity-log", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
      const logs = await storage.getRecentActivityLog(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error getting recent activity log:", error);
      res.status(500).json({ error: "Failed to get activity log" });
    }
  });

  // Delete facility (admin)
  app.delete("/api/facilities/:id", async (req, res) => {
    try {
      await storage.updateFacility(req.params.id, { status: "deleted" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ error: "Failed to delete facility" });
    }
  });

  // ============================================
  // DSHS SYNC API
  // ============================================

  // Get sync status and logs
  app.get("/api/admin/dshs-sync", async (req, res) => {
    try {
      const logs = await storage.getDshsSyncLogs(10);
      const totalHomes = await storage.getFacilityCount();
      const syncedHomes = await storage.getSyncedHomesCount();

      res.json({ logs, totalHomes, syncedHomes });
    } catch (error) {
      console.error("Error getting DSHS sync status:", error);
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // Trigger manual sync
  app.post("/api/admin/dshs-sync", async (req, res) => {
    try {
      const { type = 'full', county } = req.body;
      
      const { getSyncService } = await import('./dshs-sync');
      const syncService = getSyncService();

      if (type === 'single' && county) {
        syncService.syncSingleCounty(county).catch(console.error);
        res.json({ message: 'Single county sync started', county });
      } else {
        syncService.fullSync().catch(console.error);
        res.json({ message: 'Full sync started', type: 'full' });
      }
    } catch (error) {
      console.error("Error starting DSHS sync:", error);
      res.status(500).json({ error: "Failed to start sync" });
    }
  });

  // Get list of Washington counties
  app.get("/api/admin/dshs-sync/counties", async (req, res) => {
    try {
      const { WA_COUNTIES } = await import('./dshs-sync');
      res.json({ counties: WA_COUNTIES });
    } catch (error) {
      console.error("Error getting counties:", error);
      res.status(500).json({ error: "Failed to get counties" });
    }
  });

  // ============================================
  // TRANSPORT MARKETPLACE API
  // ============================================

  // Get active transport providers (public for owners)
  app.get("/api/transport/providers", async (req, res) => {
    try {
      const { county, vehicleType, acceptsMedicaid } = req.query;
      const filters: any = {};
      if (county) filters.county = String(county);
      if (vehicleType) filters.vehicleType = String(vehicleType);
      if (acceptsMedicaid === 'true') filters.acceptsMedicaid = true;
      
      const providers = await storage.getActiveTransportProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error getting transport providers:", error);
      res.status(500).json({ error: "Failed to get providers" });
    }
  });

  // Get provider by slug
  app.get("/api/transport/providers/:slug", async (req, res) => {
    try {
      const provider = await storage.getTransportProviderBySlug(req.params.slug);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error getting transport provider:", error);
      res.status(500).json({ error: "Failed to get provider" });
    }
  });

  // Get provider reviews (approved only for public)
  app.get("/api/transport/providers/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProviderReviewsByProvider(req.params.id, 'approved');
      res.json(reviews);
    } catch (error) {
      console.error("Error getting provider reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // ============================================
  // OWNER TRANSPORT API (requires owner auth)
  // ============================================

  // Get owner's bookings
  app.get("/api/owner/transport/bookings", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const bookings = await storage.getTransportBookingsByOwner(owner.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error getting owner bookings:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  // Create booking
  app.post("/api/owner/transport/bookings", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Generate booking number
      const year = new Date().getFullYear();
      const random = Math.floor(10000 + Math.random() * 90000);
      const bookingNumber = `TRN-${year}-${random}`;
      
      const bookingData = {
        ...req.body,
        ownerId: owner.id,
        bookingNumber,
      };
      
      const result = insertTransportBookingSchema.safeParse(bookingData);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const booking = await storage.createTransportBooking(result.data);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Get booking by ID
  app.get("/api/owner/transport/bookings/:id", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const booking = await storage.getTransportBooking(req.params.id);
      if (!booking || booking.ownerId !== owner.id) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error getting booking:", error);
      res.status(500).json({ error: "Failed to get booking" });
    }
  });

  // Cancel booking
  app.put("/api/owner/transport/bookings/:id/cancel", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const booking = await storage.getTransportBooking(req.params.id);
      if (!booking || booking.ownerId !== owner.id) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      const updated = await storage.updateTransportBooking(req.params.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'owner',
        cancellationReason: req.body.reason || 'Cancelled by owner'
      });
      res.json(updated);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  // Get saved providers
  app.get("/api/owner/transport/saved", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const saved = await storage.getSavedProvidersByOwner(owner.id);
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved providers:", error);
      res.status(500).json({ error: "Failed to get saved providers" });
    }
  });

  // Save provider
  app.post("/api/owner/transport/providers/:id/save", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const saved = await storage.saveProvider(owner.id, req.params.id, req.body.notes);
      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving provider:", error);
      res.status(500).json({ error: "Failed to save provider" });
    }
  });

  // Unsave provider
  app.delete("/api/owner/transport/providers/:id/save", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      await storage.unsaveProvider(owner.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving provider:", error);
      res.status(500).json({ error: "Failed to unsave provider" });
    }
  });

  // Check if provider is saved
  app.get("/api/owner/transport/providers/:id/saved", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const isSaved = await storage.isProviderSaved(owner.id, req.params.id);
      res.json({ saved: isSaved });
    } catch (error) {
      console.error("Error checking saved status:", error);
      res.status(500).json({ error: "Failed to check saved status" });
    }
  });

  // Submit provider review
  app.post("/api/owner/transport/reviews", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const reviewData = {
        ...req.body,
        ownerId: owner.id,
        status: 'pending'
      };
      
      const result = insertProviderReviewSchema.safeParse(reviewData);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const review = await storage.createProviderReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get owner's reviews
  app.get("/api/owner/transport/reviews", async (req, res) => {
    try {
      const owner = (req as any).owner;
      if (!owner) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const reviews = await storage.getProviderReviewsByOwner(owner.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error getting owner reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // ============================================
  // ADMIN TRANSPORT API
  // ============================================

  // Get all transport providers (admin)
  app.get("/api/admin/transport/providers", async (req, res) => {
    try {
      const providers = await storage.getAllTransportProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error getting all providers:", error);
      res.status(500).json({ error: "Failed to get providers" });
    }
  });

  // Create transport provider (admin)
  app.post("/api/admin/transport/providers", async (req, res) => {
    try {
      const result = insertTransportProviderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const provider = await storage.createTransportProvider(result.data);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ error: "Failed to create provider" });
    }
  });

  // Update transport provider (admin)
  app.put("/api/admin/transport/providers/:id", async (req, res) => {
    try {
      const provider = await storage.updateTransportProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Failed to update provider" });
    }
  });

  // Delete transport provider (admin)
  app.delete("/api/admin/transport/providers/:id", async (req, res) => {
    try {
      await storage.deleteTransportProvider(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  // Get all bookings (admin)
  app.get("/api/admin/transport/bookings", async (req, res) => {
    try {
      const { status } = req.query;
      const filters = status ? { status: String(status) } : undefined;
      const bookings = await storage.getAllTransportBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Error getting all bookings:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  // Update booking (admin)
  app.put("/api/admin/transport/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateTransportBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Get all reviews (admin)
  app.get("/api/admin/transport/reviews", async (req, res) => {
    try {
      const { status } = req.query;
      const reviews = await storage.getAllProviderReviews(status ? String(status) : undefined);
      res.json(reviews);
    } catch (error) {
      console.error("Error getting all reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // Update review status (admin)
  app.put("/api/admin/transport/reviews/:id", async (req, res) => {
    try {
      const review = await storage.updateProviderReview(req.params.id, req.body);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // Transport stats (admin)
  app.get("/api/admin/transport/stats", async (req, res) => {
    try {
      const providers = await storage.getAllTransportProviders();
      const bookings = await storage.getAllTransportBookings();
      const reviews = await storage.getAllProviderReviews();
      
      const activeProviders = providers.filter(p => p.status === 'active').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const pendingReviews = reviews.filter(r => r.status === 'pending').length;
      
      res.json({
        totalProviders: providers.length,
        activeProviders,
        totalBookings: bookings.length,
        pendingBookings,
        completedBookings,
        totalReviews: reviews.length,
        pendingReviews
      });
    } catch (error) {
      console.error("Error getting transport stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // ============================================
  // GOOGLE PLACES API PROXY
  // ============================================
  
  // Autocomplete for location search (cities in Washington)
  app.get("/api/google/places/autocomplete", async (req, res) => {
    try {
      const input = String(req.query.input || "");
      if (!input || input.length < 2) {
        return res.json({ predictions: [] });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }
      
      const params = new URLSearchParams({
        input,
        key: apiKey,
        types: "(cities)",
        components: "country:us",
        locationbias: "rectangle:45.5435,-124.8488|49.0024,-116.9155", // Washington State bounds
      });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in Google Places autocomplete:", error);
      res.status(500).json({ error: "Failed to fetch location suggestions" });
    }
  });
  
  // Get place details for selected location
  app.get("/api/google/places/details", async (req, res) => {
    try {
      const placeId = String(req.query.place_id || "");
      if (!placeId) {
        return res.status(400).json({ error: "place_id is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }
      
      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: "address_components,formatted_address,geometry,name",
      });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in Google Places details:", error);
      res.status(500).json({ error: "Failed to fetch place details" });
    }
  });
  
  // Search for a business place (for syncing Google data to facilities)
  app.get("/api/google/places/search", async (req, res) => {
    try {
      const query = String(req.query.query || "");
      if (!query) {
        return res.status(400).json({ error: "query is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }
      
      const params = new URLSearchParams({
        input: query,
        inputtype: "textquery",
        key: apiKey,
        fields: "place_id,name,formatted_address,rating,user_ratings_total,photos,geometry",
        locationbias: "rectangle:45.5435,-124.8488|49.0024,-116.9155", // Washington State
      });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in Google Places search:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });
  
  // Get photo URL for a Google place photo reference
  app.get("/api/google/places/photo", async (req, res) => {
    try {
      const photoReference = String(req.query.photo_reference || "");
      const maxWidth = parseInt(String(req.query.max_width || "400"));
      
      if (!photoReference) {
        return res.status(400).json({ error: "photo_reference is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }
      
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
      
      // Redirect to the Google photo URL
      res.redirect(photoUrl);
    } catch (error) {
      console.error("Error getting Google Places photo:", error);
      res.status(500).json({ error: "Failed to get photo" });
    }
  });

  // ============================================
  // MEDICATIONS REFERENCE API
  // ============================================

  // Search medications (for autocomplete)
  app.get("/api/medications/search", async (req, res) => {
    try {
      const { searchMedications } = await import("@shared/medications-data");
      const query = String(req.query.q || "");
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;

      if (query.length < 2) {
        return res.json([]);
      }

      const results = searchMedications(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching medications:", error);
      res.status(500).json({ error: "Failed to search medications" });
    }
  });

  // Get all medication categories
  app.get("/api/medications/categories", async (req, res) => {
    try {
      const { getMedicationCategories } = await import("@shared/medications-data");
      res.json(getMedicationCategories());
    } catch (error) {
      console.error("Error getting medication categories:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  // Get medications by category
  app.get("/api/medications/by-category/:category", async (req, res) => {
    try {
      const { getMedicationsByCategory } = await import("@shared/medications-data");
      const results = getMedicationsByCategory(req.params.category);
      res.json(results);
    } catch (error) {
      console.error("Error getting medications by category:", error);
      res.status(500).json({ error: "Failed to get medications" });
    }
  });

  // Register EHR routes
  registerEhrRoutes(app);
  registerOwnerEhrRoutes(app);

  // Register PDF generation routes
  registerPdfRoutes(app);

  return httpServer;
}
