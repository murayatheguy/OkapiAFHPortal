import { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware for HIPAA compliance
 * Implements headers recommended by OWASP and security best practices
 */
export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // HSTS - Force HTTPS (1 year, include subdomains)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // Prevent clickjacking - only allow same origin framing
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // XSS Protection (legacy but still useful)
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer Policy - limit referrer info sent
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy - disable unused browser features
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
    );

    // Content Security Policy
    // Adjusted for React SPA with Tailwind
    const cspDirectives = [
      "default-src 'self'",
      // Scripts - self and inline needed for React/Vite
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles - self and inline needed for Tailwind
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images - allow self, data URIs, and HTTPS
      "img-src 'self' data: https: blob:",
      // Fonts - self, data, and Google Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Connect - allow API calls
      "connect-src 'self' https://api.anthropic.com wss: ws:",
      // Frame ancestors - same as X-Frame-Options
      "frame-ancestors 'self'",
      // Form actions - only to self
      "form-action 'self'",
      // Base URI restriction
      "base-uri 'self'",
      // Object sources - none
      "object-src 'none'",
    ];

    res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

    // Cache Control for sensitive pages
    // Don't cache authenticated responses
    if (req.session?.ownerId || req.session?.staffId) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    next();
  };
}

/**
 * CORS headers for API routes with security considerations
 */
export function secureCorsMiddleware(allowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Only set CORS headers if origin is in allowed list
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  };
}
