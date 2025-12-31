import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  formatters: {
    level: (label) => ({ level: label }),
  },

  base: {
    service: "okapi-api",
    env: process.env.NODE_ENV,
  },

  transport: isProduction ? undefined : {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },

  // Redact sensitive fields (HIPAA)
  redact: {
    paths: ["password", "ssn", "*.password", "*.ssn", "pin", "*.pin"],
    censor: "[REDACTED]",
  },
});

// Child loggers for different contexts
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "database" });
export const auditLogger = logger.child({ module: "audit" });

export default logger;
