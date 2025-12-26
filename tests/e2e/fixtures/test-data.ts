/**
 * Test Data for Assertions
 */

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'home' },
  { label: 'Care Management', icon: 'clipboard' },
  { label: 'Resources', icon: 'folder' },
  { label: 'Settings', icon: 'settings' },
];

export const CARE_MANAGEMENT_SECTIONS = [
  'Residents',
  'Staff',
  'Credentials',
  'Incidents',
  'Reports',
];

export const SETTINGS_SECTIONS = [
  'Profile',
  'HIPAA Security',
];

export const RESIDENT_REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'admissionDate',
  'roomNumber',
];

export const STAFF_REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'role',
];

export const STAFF_ROLES = [
  'Lead Caregiver',
  'Caregiver',
  'CNA',
  'HCA',
  'Medication Aide',
];

export const CODE_STATUSES = [
  'Full Code',
  'DNR',
  'DNR/DNI',
  'Comfort Care Only',
];

export const DSHS_FORMS = [
  'Negotiated Care Plan (NCP)',
  'Disclosure of Charges',
  'Nurse Delegation',
];

export const CARE_PORTAL_ACTIONS = [
  'Log Medication',
  'Add Note',
  'File Incident',
];

export const ACTIVITY_LOG_FILTERS = [
  'All',
  'Logins',
  'Residents',
  'Staff',
  'Settings',
];
