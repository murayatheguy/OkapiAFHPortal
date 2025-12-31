import { Router } from "express";
import { authenticateStaffPIN, registerTrustedDevice, revokeTrustedDevice } from "../../auth/staffPin";
import { success, error } from "../../utils/responses";
import { pinLimiter } from "../../middleware/rateLimit";

export const staffPinRouter = Router();

// Staff PIN login
staffPinRouter.post("/login",
  pinLimiter,
  async (req, res) => {
    try {
      const { facilityId, pin, deviceId } = req.body;

      if (!facilityId || !pin || !deviceId) {
        return res.status(400).json(
          error("VALIDATION_FAILED", "Facility ID, PIN, and device ID are required")
        );
      }

      const result = await authenticateStaffPIN(
        facilityId,
        pin,
        deviceId,
        req.ip || "unknown"
      );

      if (!result.success) {
        return res.status(401).json(
          error("AUTH_INVALID", result.error || "Invalid PIN")
        );
      }

      // Create staff session
      (req.session as any).staffAuth = {
        id: result.staff.id,
        facilityId: result.staff.facilityId,
        role: result.staff.role,
        firstName: result.staff.firstName,
        lastName: result.staff.lastName,
      };

      res.json(success({
        staff: {
          id: result.staff.id,
          firstName: result.staff.firstName,
          lastName: result.staff.lastName,
          role: result.staff.role,
        },
      }));
    } catch (err) {
      console.error("Staff PIN login error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Login failed"));
    }
  }
);

// Staff logout
staffPinRouter.post("/logout", (req, res) => {
  (req.session as any).staffAuth = null;
  res.json(success({ message: "Logged out successfully" }));
});

// Get current staff session
staffPinRouter.get("/me", (req, res) => {
  const staffAuth = (req.session as any).staffAuth;

  if (!staffAuth) {
    return res.status(401).json(error("AUTH_REQUIRED", "Not logged in"));
  }

  res.json(success(staffAuth));
});

// Register trusted device (owner only)
staffPinRouter.post("/devices",
  async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "owner") {
        return res.status(403).json(error("PERMISSION_DENIED", "Owner access required"));
      }

      const { deviceId, deviceName, deviceType } = req.body;
      const facilityId = user.facilityId;

      if (!deviceId || !deviceName) {
        return res.status(400).json(error("VALIDATION_FAILED", "Device ID and name required"));
      }

      await registerTrustedDevice(facilityId, deviceId, deviceName, deviceType || "tablet", user.id);

      res.json(success({ message: "Device registered successfully" }));
    } catch (err) {
      console.error("Register device error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to register device"));
    }
  }
);

// Revoke trusted device (owner only)
staffPinRouter.delete("/devices/:deviceId",
  async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== "owner") {
        return res.status(403).json(error("PERMISSION_DENIED", "Owner access required"));
      }

      const { deviceId } = req.params;
      const facilityId = user.facilityId;

      await revokeTrustedDevice(facilityId, deviceId);

      res.json(success({ message: "Device revoked successfully" }));
    } catch (err) {
      console.error("Revoke device error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to revoke device"));
    }
  }
);
