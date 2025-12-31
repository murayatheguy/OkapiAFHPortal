# Okapi Care Network API Documentation

## Base URL
- Production: `https://your-domain.railway.app`
- Development: `http://localhost:5000`

## Authentication

### Session-Based Auth (Owners/Families)
Login via `/api/auth/login` to establish session.

### Staff PIN Auth
POST `/api/auth/staff/login` with facilityId, pin, deviceId.

### Admin Auth
Login via `/api/admin-login` with admin credentials.

---

## Public Routes (No Auth Required)

### Facilities

#### Search Facilities
```
GET /api/public/facilities
Query params: city, type, county, q, page, limit
```

#### Get Facility
```
GET /api/public/facilities/:idOrSlug
```

### Care Score

#### Get Methodology
```
GET /api/public/care-score/methodology
```

#### Get Top Facilities
```
GET /api/public/care-score/top?limit=20
```

#### Get Facility Score
```
GET /api/public/care-score/:facilityId
GET /api/public/care-score/:facilityId/breakdown
```

---

## Secure Routes (Auth Required)

All secure routes require authentication and return facility-scoped data.

### Residents

#### List Residents
```
GET /api/secure/residents
```

#### Get Resident
```
GET /api/secure/residents/:id
```

#### Create Resident
```
POST /api/secure/residents
Body: { firstName, lastName, dateOfBirth, ... }
```

#### Update Resident
```
PATCH /api/secure/residents/:id
Body: { ...fields to update }
```

### ADL Documentation

#### Create ADL Log
```
POST /api/secure/adl
Body: {
  residentId: string,
  logDate: "YYYY-MM-DD",
  shiftType: "day" | "swing" | "night",
  bathing: "independent" | "setup" | "supervision" | "limited_assist" | "extensive_assist" | "total_care",
  dressing: ...,
  grooming: ...,
  toileting: ...,
  transferring: ...,
  mobility: ...,
  eating: ...,
  bloodPressureSystolic: number,
  bloodPressureDiastolic: number,
  pulse: number,
  temperature: string,
  weight: string,
  notes: string
}
```

#### Get Resident ADL History
```
GET /api/secure/adl/resident/:residentId?startDate=&endDate=&page=1&limit=20
```

#### Get Daily Summary
```
GET /api/secure/adl/summary/daily?date=YYYY-MM-DD
```

### Images

#### Get Upload URL
```
POST /api/secure/images/upload-url
Body: { filename, contentType }
Response: { uploadUrl, key, publicUrl }
```

#### Register Image
```
POST /api/secure/images
Body: { imageUrl, caption?, isPrimary? }
```

#### List Images
```
GET /api/secure/images
```

#### Update Image
```
PATCH /api/secure/images/:id
Body: { caption?, isPrimary?, sortOrder? }
```

#### Delete Image
```
DELETE /api/secure/images/:id
```

---

## Auth Routes

### MFA

#### Get Status
```
GET /api/auth/mfa/status
```

#### Setup MFA
```
POST /api/auth/mfa/setup
Response: { qrCode, backupCodes, message }
```

#### Enable MFA
```
POST /api/auth/mfa/enable
Body: { token: "123456" }
```

#### Disable MFA
```
POST /api/auth/mfa/disable
Body: { token: "123456" }
```

### Staff PIN

#### Login
```
POST /api/auth/staff/login
Body: { facilityId, pin, deviceId }
```

#### Logout
```
POST /api/auth/staff/logout
```

#### Get Current Staff
```
GET /api/auth/staff/me
```

#### Register Device (Owner Only)
```
POST /api/auth/staff/devices
Body: { deviceId, deviceName, deviceType }
```

---

## Admin Routes (Admin Auth Required)

### Facilities

#### List Facilities
```
GET /api/admin/facilities?status=&search=&page=1&limit=20
```

#### Get Facility Details
```
GET /api/admin/facilities/:id
```

#### Update Status
```
PATCH /api/admin/facilities/:id/status
Body: { status?, claimStatus?, reason? }
```

#### Verify Facility
```
POST /api/admin/facilities/:id/verify
```

#### Batch Recalculate Scores
```
POST /api/admin/facilities/recalculate-scores
```

### Audit Logs

#### Query Logs
```
GET /api/admin/audit?userId=&facilityId=&action=&resourceType=&startDate=&endDate=&page=1&limit=50
```

#### Security Events
```
GET /api/admin/audit/security?startDate=&endDate=
```

#### Audit Stats
```
GET /api/admin/audit/stats?days=7
```

### Users

#### List Owners
```
GET /api/admin/users/owners?search=&page=1&limit=20
```

#### Update Owner Status
```
PATCH /api/admin/users/owners/:id/status
Body: { status, reason? }
```

### Stats

#### Dashboard Overview
```
GET /api/admin/stats/overview
```

#### System Health
```
GET /api/admin/stats/health
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| AUTH_REQUIRED | 401 | Not authenticated |
| AUTH_INVALID | 401 | Invalid credentials |
| AUTH_MFA_REQUIRED | 401 | MFA verification needed |
| PERMISSION_DENIED | 403 | Insufficient permissions |
| FACILITY_ACCESS_DENIED | 403 | Cross-facility access attempt |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_FAILED | 400 | Input validation error |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
