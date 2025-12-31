import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export const healthRouter = Router();

// Simple liveness check (for Railway)
healthRouter.get("/live", (req, res) => {
  res.json({
    status: "alive",
    timestamp: new Date().toISOString()
  });
});

// Readiness check (includes database)
healthRouter.get("/ready", async (req, res) => {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);

    res.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latency: Date.now() - start + "ms",
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error.message,
      },
    });
  }
});

// Combined health check
healthRouter.get("/", async (req, res) => {
  const health: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor(process.uptime()) + "s",
  };

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    health.database = {
      status: "connected",
      latency: Date.now() - start + "ms",
    };
  } catch {
    health.status = "degraded";
    health.database = { status: "disconnected" };
  }

  res.status(health.status === "healthy" ? 200 : 503).json(health);
});
