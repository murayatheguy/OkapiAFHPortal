import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFacilitySchema, insertTeamMemberSchema, insertCredentialSchema, insertInquirySchema, insertReviewSchema, insertOwnerSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";

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
      res.json(featuredFacilities);
    } catch (error) {
      console.error("Error getting featured facilities:", error);
      res.status(500).json({ error: "Failed to get featured facilities" });
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
      if (availableBeds !== undefined) {
        searchParams.availableBeds = availableBeds === 'true';
      }
      
      const facilities = await storage.searchFacilities(searchParams);
      res.json(facilities);
    } catch (error) {
      console.error("Error searching facilities:", error);
      res.status(500).json({ error: "Failed to search facilities" });
    }
  });

  // Get single facility by ID
  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getFacility(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
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

  // Get single owner
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

  // Owner login
  app.post("/api/owners/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const owner = await storage.getOwnerByEmail(email);
      if (!owner) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!owner.password) {
        return res.status(401).json({ error: "Password not set. Please contact support." });
      }

      const isValid = await bcrypt.compare(password, owner.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...ownerData } = owner;
      res.json({ owner: ownerData });
    } catch (error) {
      console.error("Error during owner login:", error);
      res.status(500).json({ error: "Login failed" });
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
      if (ownerData.password) {
        ownerData.password = await bcrypt.hash(ownerData.password, 10);
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
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
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

  return httpServer;
}
