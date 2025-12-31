# Access Control Policy
## Okapi Care Network

**Version:** 1.0
**Effective Date:** [DATE]
**Last Reviewed:** [DATE]
**Policy Owner:** [PRIVACY OFFICER NAME]

---

## 1. Purpose

This policy establishes access control requirements for Okapi Care Network systems containing Protected Health Information (PHI) in compliance with HIPAA Security Rule §164.312(a)(1).

## 2. Scope

This policy applies to all systems, applications, and data repositories that store, process, or transmit PHI.

## 3. Access Control Principles

### 3.1 Minimum Necessary
Users are granted only the minimum access required to perform their job functions.

### 3.2 Need-to-Know
Access to PHI is limited to workforce members who need the information for treatment, payment, or healthcare operations.

### 3.3 Separation of Duties
Critical functions are divided among multiple individuals to prevent fraud and errors.

## 4. User Roles and Permissions

### 4.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrators | Full system access |
| **Owner** | Facility owners | Full access to their facility |
| **Nurse** | Licensed nurses | Clinical PHI access |
| **Caregiver** | Care staff | Limited PHI access |
| **Family** | Resident families | View-only resident info |

### 4.2 Permission Matrix

| Permission | Admin | Owner | Nurse | Caregiver | Family |
|------------|-------|-------|-------|-----------|--------|
| facility:read | Yes | Yes | No | No | No |
| facility:edit | Yes | Yes | No | No | No |
| resident:list | Yes | Yes | Yes | Yes | No |
| resident:read | Yes | Yes | Yes | Yes | Yes* |
| resident:create | Yes | Yes | Yes | No | No |
| resident:edit | Yes | Yes | Yes | No | No |
| ehr:medications:read | Yes | Yes | Yes | Yes | No |
| ehr:medications:write | Yes | Yes | Yes | Yes | No |
| ehr:adl:read | Yes | Yes | Yes | Yes | No |
| ehr:adl:write | Yes | Yes | Yes | Yes | No |
| staff:manage | Yes | Yes | No | No | No |
| forms:generate | Yes | Yes | Yes | No | No |
| admin:all | Yes | No | No | No | No |

*Family members can only view their linked resident

### 4.3 Facility Scoping

All non-admin users are scoped to their assigned facility:
- Owners can only access their facility's data
- Staff can only access their facility's residents
- Cross-facility access is blocked and logged as security event

## 5. Authentication Requirements

### 5.1 Password Policy

| Requirement | Standard |
|-------------|----------|
| Minimum length | 8 characters |
| Complexity | Upper, lower, number, special |
| Expiration | 90 days (recommended) |
| History | Cannot reuse last 5 passwords |
| Lockout | 5 failed attempts = 15 min lockout |

### 5.2 Multi-Factor Authentication (MFA)

**Required for:**
- All admin accounts
- Owner accounts accessing PHI
- Remote access to systems

**MFA Methods:**
- TOTP (Google Authenticator, Authy)
- Backup codes (8 single-use codes)

### 5.3 Staff PIN Authentication

For bedside care documentation:
- 6-digit minimum PIN
- Device must be registered/trusted
- PIN + Trusted Device = authentication
- 5 failed attempts = 15 min lockout

## 6. Access Provisioning

### 6.1 New User Setup

1. Manager submits access request
2. Privacy Officer approves (for PHI access)
3. System Administrator creates account
4. User completes HIPAA training
5. Access activated after training verified

### 6.2 Access Request Form

```
Requester: _______________
Date: _______________

User Information:
  Name: _______________
  Email: _______________
  Department: _______________
  Start Date: _______________

Access Requested:
  [ ] Admin
  [ ] Owner - Facility: _______________
  [ ] Nurse - Facility: _______________
  [ ] Caregiver - Facility: _______________
  [ ] Family - Resident: _______________

Business Justification:
_________________________________________________

Manager Approval: _______________ Date: ___________
Privacy Officer Approval: _____________ Date: ______
```

### 6.3 Role Changes

When job function changes:
- Manager requests role modification
- Old access removed within 24 hours
- New access provisioned per role
- Change logged in audit trail

### 6.4 Termination

Upon termination:
- Immediate access revocation
- All sessions invalidated
- Devices de-registered
- Access removal logged

**Timeline:**
- Voluntary termination: End of last day
- Involuntary termination: Immediately
- Contractor end: Contract end date

## 7. Session Management

### 7.1 Session Timeout

| Context | Timeout |
|---------|---------|
| Owner dashboard | 30 minutes idle |
| Staff bedside | 15 minutes idle |
| Admin console | 15 minutes idle |

### 7.2 Concurrent Sessions

- Owners: 3 concurrent sessions max
- Staff: 1 session per device
- Admins: 2 concurrent sessions max

## 8. Device Management

### 8.1 Trusted Devices (Staff PIN)

Devices used for staff PIN authentication must be:
- Registered by facility owner
- Named and typed (tablet, phone, desktop)
- Reviewed quarterly
- Revoked when lost/stolen

### 8.2 Device Registration

```
Facility: _______________
Device ID: _______________
Device Name: _______________
Device Type: [ ] Tablet [ ] Phone [ ] Desktop
Authorized By: _______________
Date: _______________
```

## 9. Access Reviews

### 9.1 Periodic Review

| Review Type | Frequency | Reviewer |
|-------------|-----------|----------|
| User access | Quarterly | Managers |
| Admin access | Monthly | Privacy Officer |
| Terminated users | Weekly | System Admin |
| Role assignments | Annually | Privacy Officer |

### 9.2 Review Documentation

Access reviews must document:
- Date of review
- Reviewer name
- Users reviewed
- Changes made
- Justification for continued access

## 10. Audit and Monitoring

### 10.1 Logged Events

All access-related events are logged:
- Login success/failure
- PHI access (view, create, update, delete)
- Permission changes
- Account lockouts
- MFA events

### 10.2 Review of Logs

- Daily: Automated alerts for anomalies
- Weekly: Security event review
- Monthly: Access pattern analysis
- Quarterly: Full audit log review

## 11. Violations

Violations of this policy may result in:
- Access revocation
- Disciplinary action
- Termination
- Legal action

All violations are documented and reported to Privacy Officer.

---

## Appendix: Access Review Checklist

**Quarterly Review**

- [ ] All users have current job function
- [ ] No terminated users have access
- [ ] Role assignments match job duties
- [ ] MFA enabled for required accounts
- [ ] Trusted devices current and valid
- [ ] No shared accounts
- [ ] No excessive permissions
- [ ] Training current for all users

**Reviewer:** _______________
**Date:** _______________
**Findings:** _______________________________________________
