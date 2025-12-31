# Security Risk Assessment
## Okapi Care Network

**Assessment Date:** [DATE]
**Assessor:** [NAME]
**Next Review:** [DATE + 1 YEAR]

---

## 1. Executive Summary

This risk assessment identifies potential risks to the confidentiality, integrity, and availability of electronic Protected Health Information (ePHI) maintained by Okapi Care Network, as required by HIPAA Security Rule §164.308(a)(1)(ii)(A).

**Overall Risk Level:** [LOW / MEDIUM / HIGH]

**Key Findings:**
- [SUMMARY OF TOP RISKS]
- [SUMMARY OF GAPS]
- [SUMMARY OF RECOMMENDATIONS]

## 2. Scope

### 2.1 Systems Assessed

| System | Description | Contains ePHI |
|--------|-------------|---------------|
| Web Application | React frontend, Express backend | Yes |
| Database | Neon PostgreSQL | Yes |
| File Storage | AWS S3 | Yes |
| Hosting | Railway | Yes |
| Authentication | Session + MFA + PIN | Yes |

### 2.2 Data Types

- Resident demographics
- Health information
- Care documentation
- Medication records
- Staff credentials
- Audit logs

## 3. Risk Assessment Methodology

### 3.1 Risk Calculation

**Risk = Likelihood x Impact**

| Likelihood | Score | Description |
|------------|-------|-------------|
| Rare | 1 | < 1% chance annually |
| Unlikely | 2 | 1-25% chance annually |
| Possible | 3 | 25-50% chance annually |
| Likely | 4 | 50-75% chance annually |
| Almost Certain | 5 | > 75% chance annually |

| Impact | Score | Description |
|--------|-------|-------------|
| Negligible | 1 | Minimal effect |
| Minor | 2 | Limited impact, quickly resolved |
| Moderate | 3 | Significant impact, recoverable |
| Major | 4 | Serious harm, difficult recovery |
| Catastrophic | 5 | Severe harm, business threatening |

| Risk Score | Level | Action Required |
|------------|-------|-----------------|
| 1-4 | Low | Monitor |
| 5-9 | Medium | Mitigate within 90 days |
| 10-15 | High | Mitigate within 30 days |
| 16-25 | Critical | Immediate action |

## 4. Risk Inventory

### 4.1 Administrative Risks

| ID | Risk | Likelihood | Impact | Score | Level | Current Controls | Recommendations |
|----|------|------------|--------|-------|-------|------------------|-----------------|
| A1 | Unauthorized workforce access | 2 | 4 | 8 | Medium | RBAC, training | Quarterly access reviews |
| A2 | Inadequate training | 2 | 3 | 6 | Medium | Initial training | Annual refresher |
| A3 | Missing policies | 2 | 3 | 6 | Medium | Core policies | Complete policy set |
| A4 | No incident response testing | 3 | 3 | 9 | Medium | Written plan | Annual tabletop |

### 4.2 Technical Risks

| ID | Risk | Likelihood | Impact | Score | Level | Current Controls | Recommendations |
|----|------|------------|--------|-------|-------|------------------|-----------------|
| T1 | Data breach via hacking | 2 | 5 | 10 | High | Firewall, encryption | Penetration testing |
| T2 | SQL injection | 1 | 5 | 5 | Medium | Parameterized queries | Security scan |
| T3 | Session hijacking | 2 | 4 | 8 | Medium | HTTPS, secure cookies | Session monitoring |
| T4 | Brute force attack | 2 | 3 | 6 | Medium | Rate limiting, lockout | CAPTCHA |
| T5 | Unpatched vulnerabilities | 3 | 4 | 12 | High | Managed hosting | Dependency updates |
| T6 | Insufficient logging | 1 | 4 | 4 | Low | Audit logs | Log review process |

### 4.3 Physical Risks

| ID | Risk | Likelihood | Impact | Score | Level | Current Controls | Recommendations |
|----|------|------------|--------|-------|-------|------------------|-----------------|
| P1 | Data center breach | 1 | 5 | 5 | Medium | Railway/Neon security | Vendor review |
| P2 | Lost/stolen staff device | 3 | 3 | 9 | Medium | Device trust, PIN | Remote wipe capability |

### 4.4 Organizational Risks

| ID | Risk | Likelihood | Impact | Score | Level | Current Controls | Recommendations |
|----|------|------------|--------|-------|-------|------------------|-----------------|
| O1 | Vendor breach | 2 | 4 | 8 | Medium | BAAs in place | Vendor assessments |
| O2 | Business continuity failure | 2 | 4 | 8 | Medium | Cloud hosting | DR testing |
| O3 | Key person dependency | 3 | 3 | 9 | Medium | Documentation | Cross-training |

## 5. Current Safeguards

### 5.1 Administrative Safeguards

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Security Officer designated | Yes | [NAME] |
| Workforce training | Yes | Initial training |
| Access management procedures | Yes | Documented |
| Incident response plan | Yes | Created [DATE] |
| Contingency plan | In Progress | In progress |
| Business Associate Agreements | Yes | Template ready |

### 5.2 Technical Safeguards

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Unique user identification | Yes | UUID-based |
| Automatic logoff | Yes | 30 min timeout |
| Encryption at rest | Yes | Neon + AES-256 |
| Encryption in transit | Yes | TLS 1.2+ |
| Audit controls | Yes | Comprehensive logging |
| Access controls | Yes | RBAC + facility scoping |
| Multi-factor authentication | Yes | TOTP for owners |

### 5.3 Physical Safeguards

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Facility access controls | Yes | Cloud providers |
| Workstation security | Pending | Client responsibility |
| Device controls | Yes | Trusted device registration |

## 6. Gap Analysis

| Gap | Priority | Remediation | Target Date |
|-----|----------|-------------|-------------|
| Annual training not scheduled | Medium | Schedule refresher | [DATE] |
| Penetration testing not done | High | Engage security firm | [DATE] |
| DR testing not performed | Medium | Schedule test | [DATE] |
| Vendor assessments incomplete | Medium | Request SOC2 reports | [DATE] |

## 7. Remediation Plan

| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| High | Schedule penetration test | [NAME] | [DATE] | Pending |
| High | Update dependencies | [NAME] | [DATE] | Pending |
| Medium | Complete policy documentation | [NAME] | [DATE] | Pending |
| Medium | Schedule DR test | [NAME] | [DATE] | Pending |
| Low | Implement CAPTCHA | [NAME] | [DATE] | Pending |

## 8. Sign-Off

**Assessment Completed By:**

Name: _______________
Title: _______________
Date: _______________

**Reviewed By:**

Name: _______________
Title: _______________
Date: _______________

---

## Appendix: Assessment Checklist

### HIPAA Security Rule Requirements

**Administrative Safeguards (§164.308)**
- [x] Risk analysis
- [x] Risk management
- [x] Sanction policy
- [x] Information system activity review
- [ ] Assigned security responsibility (formal)
- [x] Workforce security procedures
- [x] Access authorization
- [x] Security awareness training
- [x] Security incident procedures
- [ ] Contingency plan (complete)
- [ ] Evaluation (annual)
- [x] Business associate contracts

**Physical Safeguards (§164.310)**
- [x] Facility access controls
- [x] Workstation use policies
- [x] Device and media controls

**Technical Safeguards (§164.312)**
- [x] Access control
- [x] Audit controls
- [x] Integrity controls
- [x] Transmission security
- [x] Authentication
