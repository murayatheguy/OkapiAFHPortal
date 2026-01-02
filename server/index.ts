import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startDSHSCronJob } from "./dshs-sync";
import MemoryStore from "memorystore";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { sessionTimeoutMiddleware } from "./middleware/security";
import { apiLimiter, authLimiter, pinLimiter } from "./middleware/rateLimit";
import { healthRouter } from "./routes/health";

const app = express();
const httpServer = createServer(app);

// Session store configuration
const MemoryStoreSession = MemoryStore(session);
const PgSession = pgSession(session);

// Helmet security headers (complements our custom security headers)
app.use(helmet({
  contentSecurityPolicy: false, // We handle CSP in security-headers.ts
  crossOriginEmbedderPolicy: false, // Allow loading external resources
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Trust proxy for Railway/production (needed for secure cookies behind load balancer)
app.set('trust proxy', 1);

// Session store: MemoryStore for now (TODO: use PostgreSQL session store with proper Neon support)
// Note: connect-pg-simple has issues with Neon's serverless PostgreSQL
function createSessionStore() {
  // Use in-memory store with extended check period
  return new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24 hours
  });
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "okapi-care-network-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    store: createSessionStore(),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// HIPAA Security Headers (apply early in middleware chain)
app.use(securityHeadersMiddleware());

// Session timeout for protected routes (15 minute default)
app.use("/api/owners", sessionTimeoutMiddleware(15));
app.use("/api/facilities", sessionTimeoutMiddleware(15));
app.use("/api/ehr", sessionTimeoutMiddleware(15));

// Health check endpoints (no rate limiting)
app.use("/api/health", healthRouter);

// Rate limiting
app.use("/api", apiLimiter); // General API rate limit
app.use("/api/auth/login", authLimiter); // Strict auth limit
app.use("/api/auth/owner/login", authLimiter);
app.use("/api/admin/login", authLimiter); // Admin login limit
app.use("/api/staff/pin-login", pinLimiter); // PIN login limit

// Session timeout for admin routes
app.use("/api/admin", sessionTimeoutMiddleware(30)); // 30 minute timeout for admins

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    // Add Prerender.io middleware for SEO (search engine crawlers)
    const prerenderToken = process.env.PRERENDER_TOKEN;
    if (prerenderToken) {
      const prerender = (await import("prerender-node")).default;
      app.use(prerender.set("prerenderToken", prerenderToken));
      log("Prerender.io SEO middleware enabled");
    }
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, () => {
      log(`serving on port ${port}`);
      
      // Start the DSHS sync cron job
      startDSHSCronJob();
    },
  );
})();
