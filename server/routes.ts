import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFacilitySchema, insertTeamMemberSchema, insertCredentialSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // FACILITIES API
  // ============================================
  
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

  return httpServer;
}
