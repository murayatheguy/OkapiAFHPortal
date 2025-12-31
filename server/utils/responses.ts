export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function success<T>(data: T, meta?: any): APIResponse<T> {
  return { success: true, data, ...meta };
}

export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): APIResponse<T[]> {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export function error(code: string, message: string, details?: any): APIResponse<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}

export const ERROR_CODES = {
  // Auth
  AUTH_REQUIRED: "Authentication required",
  AUTH_INVALID: "Invalid credentials",
  AUTH_MFA_REQUIRED: "MFA verification required",
  AUTH_SESSION_EXPIRED: "Session expired",

  // Authorization
  PERMISSION_DENIED: "Permission denied",
  FACILITY_ACCESS_DENIED: "Facility access denied",

  // Validation
  VALIDATION_FAILED: "Input validation failed",

  // Resources
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource conflict",

  // Rate limiting
  RATE_LIMITED: "Too many requests",

  // Server
  INTERNAL_ERROR: "Internal server error",
} as const;
