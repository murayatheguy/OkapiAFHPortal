export const PERMISSIONS = {
  // Facility
  "facility:read": "View facility",
  "facility:edit": "Edit facility",

  // Residents (PHI)
  "resident:list": "View resident list",
  "resident:read": "View resident details",
  "resident:create": "Create residents",
  "resident:edit": "Edit residents",

  // EHR (PHI)
  "ehr:medications:read": "View medications",
  "ehr:medications:write": "Document medications",
  "ehr:notes:read": "View notes",
  "ehr:notes:write": "Create notes",
  "ehr:adl:read": "View ADLs",
  "ehr:adl:write": "Document ADLs",

  // Staff
  "staff:read": "View staff",
  "staff:manage": "Manage staff",

  // Forms
  "forms:generate": "Generate forms",
  "forms:sign": "Sign forms",

  // Admin
  "admin:all": "Full admin access",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.keys(PERMISSIONS) as Permission[],

  owner: [
    "facility:read", "facility:edit",
    "resident:list", "resident:read", "resident:create", "resident:edit",
    "ehr:medications:read", "ehr:medications:write",
    "ehr:notes:read", "ehr:notes:write",
    "ehr:adl:read", "ehr:adl:write",
    "staff:read", "staff:manage",
    "forms:generate", "forms:sign",
  ],

  nurse: [
    "resident:list", "resident:read", "resident:edit",
    "ehr:medications:read", "ehr:medications:write",
    "ehr:notes:read", "ehr:notes:write",
    "ehr:adl:read", "ehr:adl:write",
    "forms:generate",
  ],

  caregiver: [
    "resident:list", "resident:read",
    "ehr:medications:read", "ehr:medications:write",
    "ehr:notes:read", "ehr:notes:write",
    "ehr:adl:read", "ehr:adl:write",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
