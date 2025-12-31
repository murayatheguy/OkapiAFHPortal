# Data Retention Policy
## Okapi Care Network

**Version:** 1.0
**Effective Date:** [DATE]
**Last Reviewed:** [DATE]
**Policy Owner:** [PRIVACY OFFICER NAME]

---

## 1. Purpose

This policy establishes retention periods for all data categories to ensure compliance with HIPAA, Washington State regulations, and business requirements.

## 2. Scope

This policy applies to all data collected, processed, and stored by Okapi Care Network, including:
- Protected Health Information (PHI)
- Business records
- Audit logs
- System backups

## 3. Retention Schedule

### 3.1 Protected Health Information (PHI)

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Resident records | 6 years after last service OR 3 years after death | HIPAA §164.530(j) |
| Care plans (NCP) | 6 years after last service | HIPAA + DSHS WAC 388-76 |
| ADL documentation | 6 years after last service | DSHS WAC 388-76 |
| Medication records | 6 years after last service | DSHS WAC 388-76 |
| Incident reports | 6 years after incident | HIPAA |
| Signed consents | 6 years after expiration | HIPAA |

### 3.2 HIPAA Security Records

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Audit logs | 6 years | HIPAA §164.312(b) |
| Security incidents | 6 years | HIPAA §164.308(a)(6) |
| Risk assessments | 6 years | HIPAA §164.308(a)(1) |
| Policy documents | 6 years after superseded | HIPAA §164.530(j) |
| Training records | 6 years after employment | HIPAA §164.530(j) |
| BAA agreements | 6 years after termination | HIPAA §164.530(j) |

### 3.3 Business Records

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Facility profiles | Indefinite (active) / 3 years (inactive) | Business need |
| Owner accounts | 3 years after account closure | Business need |
| Family accounts | 3 years after last activity | Business need |
| Inquiries | 2 years | Business need |
| Reviews | Indefinite | Business need |
| Payment records | 7 years | IRS requirements |

### 3.4 System Data

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| System backups | 90 days rolling | Business continuity |
| Application logs | 1 year | Operations |
| Performance metrics | 1 year | Operations |
| Session data | 24 hours after expiry | Security |

## 4. Retention Implementation

### 4.1 Database Implementation

**Soft Deletes (PHI Tables):**
PHI is not permanently deleted but marked with `deleted_at` timestamp:
```sql
-- Soft delete preserves data for retention period
UPDATE residents SET deleted_at = NOW() WHERE id = ?;

-- Query excludes soft-deleted records
SELECT * FROM residents WHERE deleted_at IS NULL;
```

**Hard Delete (After Retention):**
After retention period expires, data is permanently removed:
```sql
-- Only run after legal retention period
DELETE FROM residents
WHERE deleted_at < NOW() - INTERVAL '6 years';
```

### 4.2 Backup Retention

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database | Daily | 90 days |
| Transaction logs | Continuous | 7 days |
| Configuration | Weekly | 1 year |

### 4.3 Audit Log Retention

Audit logs are stored in the `audit_logs` table and retained for 6 years:
- Logs are immutable (no UPDATE/DELETE in application)
- Archived to cold storage after 1 year
- Permanently deleted after 6 years

## 5. Data Destruction

### 5.1 Electronic Data

When retention period expires:
1. Verify no legal hold exists
2. Document destruction in log
3. Use secure deletion methods
4. Confirm deletion from all systems including backups

**Secure Deletion Standards:**
- Database: CASCADE DELETE with verification
- Files: Overwrite before deletion
- Backups: Allow to age out naturally

### 5.2 Physical Media

If any physical media contains PHI:
1. Shred paper documents (cross-cut)
2. Degauss or physically destroy hard drives
3. Document destruction with witness

### 5.3 Destruction Log

All PHI destruction must be logged:

```
Date: [DATE]
Data Type: [TYPE]
Records Destroyed: [COUNT]
Method: [METHOD]
Authorized By: [NAME]
Witnessed By: [NAME]
```

## 6. Legal Holds

When litigation or investigation is anticipated:
- Immediately suspend destruction of relevant data
- Notify Privacy Officer
- Document hold scope and duration
- Resume normal retention after hold released

## 7. Exceptions

Exceptions to this policy require:
- Written request with justification
- Privacy Officer approval
- Legal review if PHI involved
- Documentation retained

## 8. Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| Privacy Officer | Policy oversight, exception approval |
| System Administrator | Implement retention schedules, execute destruction |
| Department Managers | Ensure compliance within teams |
| All Workforce | Follow retention requirements |

## 9. Audit and Compliance

- Quarterly review of retention compliance
- Annual policy review
- Document all retention activities

---

## Appendix: Data Inventory

| System/Table | Data Category | Contains PHI | Retention |
|--------------|---------------|--------------|-----------|
| residents | PHI | Yes | 6 years |
| adl_logs | PHI | Yes | 6 years |
| care_plan_versions | PHI | Yes | 6 years |
| audit_logs | Security | Yes | 6 years |
| facilities | Business | No | Indefinite |
| owners | Business | No | 3 years |
| reviews | Business | No | Indefinite |
| inquiries | Business | No | 2 years |
