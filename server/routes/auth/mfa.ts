import { Router } from "express";
import { setupMFA, enableMFA, disableMFA, getMFAConfig, isMFAEnabled } from "../../auth/mfa";
import { success, error } from "../../utils/responses";
import { logSecurityEvent } from "../../middleware/audit";

export const mfaRouter = Router();

// Get MFA status
mfaRouter.get("/status", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(error("AUTH_REQUIRED", "Authentication required"));
    }

    const config = await getMFAConfig(userId);
    res.json(success({
      isEnabled: config?.isEnabled || false,
      isRequired: config?.isRequired || false,
      backupCodesRemaining: (config?.backupCodes as string[])?.length || 0,
    }));
  } catch (err) {
    console.error("MFA status error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get MFA status"));
  }
});

// Setup MFA (get QR code)
mfaRouter.post("/setup", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json(error("AUTH_REQUIRED", "Authentication required"));
    }

    const result = await setupMFA(userId, email);

    await logSecurityEvent({
      type: "mfa_setup_initiated",
      userId,
      ip: req.ip,
    });

    res.json(success({
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
      message: "Scan QR code with authenticator app, then verify with a code",
    }));
  } catch (err) {
    console.error("MFA setup error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to setup MFA"));
  }
});

// Verify and enable MFA
mfaRouter.post("/enable", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json(error("AUTH_REQUIRED", "Authentication required"));
    }

    if (!token || token.length !== 6) {
      return res.status(400).json(error("VALIDATION_FAILED", "6-digit token required"));
    }

    const enabled = await enableMFA(userId, token);

    if (!enabled) {
      await logSecurityEvent({
        type: "mfa_enable_failed",
        userId,
        ip: req.ip,
      });
      return res.status(400).json(error("AUTH_INVALID", "Invalid verification code"));
    }

    await logSecurityEvent({
      type: "mfa_enabled",
      userId,
      ip: req.ip,
    });

    res.json(success({ enabled: true, message: "MFA enabled successfully" }));
  } catch (err) {
    console.error("MFA enable error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to enable MFA"));
  }
});

// Disable MFA
mfaRouter.post("/disable", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json(error("AUTH_REQUIRED", "Authentication required"));
    }

    // Require valid token to disable
    const config = await getMFAConfig(userId);
    if (config?.isEnabled) {
      const { verifyMFA } = await import("../../auth/mfa");
      const valid = await verifyMFA(userId, token);
      if (!valid) {
        return res.status(400).json(error("AUTH_INVALID", "Invalid verification code"));
      }
    }

    await disableMFA(userId);

    await logSecurityEvent({
      type: "mfa_disabled",
      userId,
      ip: req.ip,
    });

    res.json(success({ disabled: true }));
  } catch (err) {
    console.error("MFA disable error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to disable MFA"));
  }
});
