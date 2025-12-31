# Incident Response Plan
## Okapi Care Network

**Version:** 1.0
**Effective Date:** [DATE]
**Last Reviewed:** [DATE]
**Policy Owner:** [PRIVACY OFFICER NAME]

---

## 1. Purpose

This Incident Response Plan establishes procedures for detecting, responding to, and recovering from security incidents involving Protected Health Information (PHI) in compliance with HIPAA Security Rule §164.308(a)(6).

## 2. Scope

This plan applies to all workforce members, contractors, and business associates who access, process, or transmit PHI through Okapi Care Network systems.

## 3. Definitions

| Term | Definition |
|------|------------|
| **Security Incident** | Attempted or successful unauthorized access, use, disclosure, modification, or destruction of PHI |
| **Breach** | Unauthorized acquisition, access, use, or disclosure of PHI that compromises security or privacy |
| **Workforce Member** | Employees, volunteers, trainees, and other persons under direct control |

## 4. Incident Classification

### Level 1 - Critical (Breach)
- Confirmed unauthorized access to PHI
- Ransomware or malware affecting PHI systems
- Lost/stolen devices containing unencrypted PHI
- **Response Time:** Immediate (within 1 hour)

### Level 2 - High
- Suspected unauthorized access
- Multiple failed login attempts from single source
- Unusual data access patterns
- **Response Time:** Within 4 hours

### Level 3 - Medium
- Single failed login attempts
- Minor policy violations
- System configuration issues
- **Response Time:** Within 24 hours

### Level 4 - Low
- General security inquiries
- Routine alerts
- **Response Time:** Within 72 hours

## 5. Incident Response Team

| Role | Responsibilities | Contact |
|------|------------------|---------|
| **Privacy Officer** | Overall incident management, breach determination, notifications | [EMAIL/PHONE] |
| **Security Lead** | Technical investigation, containment, remediation | [EMAIL/PHONE] |
| **Legal Counsel** | Legal guidance, regulatory notifications | [EMAIL/PHONE] |
| **Executive Sponsor** | Final decisions, external communications | [EMAIL/PHONE] |

## 6. Response Procedures

### Phase 1: Detection & Reporting

**All workforce members must immediately report:**
- Suspicious emails or communications
- Unauthorized individuals in secure areas
- Lost or stolen devices
- Unusual system behavior
- Any suspected PHI exposure

**Reporting Methods:**
- Email: security@[domain].com
- Phone: [PHONE NUMBER]
- Internal ticket: [SYSTEM]

**Automatic Detection (System-Based):**
- Failed login monitoring (>5 attempts triggers alert)
- Cross-facility access attempts (logged and alerted)
- After-hours PHI access (flagged for review)
- Large data exports (requires approval)

### Phase 2: Initial Assessment

Within 1 hour of detection:

- [ ] Assign incident to response team member
- [ ] Classify incident level (1-4)
- [ ] Document initial findings
- [ ] Determine if PHI is involved
- [ ] Identify affected systems/individuals

**Assessment Questions:**
1. What type of PHI was potentially exposed?
2. How many individuals may be affected?
3. Who had access to the PHI?
4. Is the incident ongoing or contained?
5. What is the potential harm to individuals?

### Phase 3: Containment

**Immediate Actions (as applicable):**
- [ ] Disable compromised user accounts
- [ ] Isolate affected systems from network
- [ ] Preserve evidence (logs, screenshots)
- [ ] Change affected passwords/credentials
- [ ] Revoke suspicious sessions

**DO NOT:**
- Delete logs or evidence
- Communicate externally without authorization
- Attempt fixes that may destroy evidence

### Phase 4: Investigation

**Technical Investigation:**
- [ ] Review audit logs (audit_logs table)
- [ ] Analyze security event logs
- [ ] Identify attack vector/vulnerability
- [ ] Determine full scope of access
- [ ] Document timeline of events

**Audit Log Query Examples:**
```sql
-- Find all access by compromised user
SELECT * FROM audit_logs
WHERE user_id = '[USER_ID]'
AND created_at > '[INCIDENT_START]'
ORDER BY created_at;

-- Find all PHI access during incident window
SELECT * FROM audit_logs
WHERE resource_type IN ('resident', 'medication', 'adl_log')
AND created_at BETWEEN '[START]' AND '[END]'
ORDER BY created_at;

-- Security events
SELECT * FROM audit_logs
WHERE is_security_event = true
ORDER BY created_at DESC;
```

### Phase 5: Breach Determination

**A breach is presumed unless you can demonstrate:**

1. PHI was encrypted (and key not compromised)
2. PHI was not actually accessed/viewed
3. PHI was returned before being accessed
4. Disclosure was to authorized person

**Risk Assessment Factors:**
- Nature and extent of PHI involved
- Unauthorized person who used/received PHI
- Whether PHI was actually acquired or viewed
- Extent to which risk has been mitigated

**Document determination using Breach Assessment Form (Appendix A)**

### Phase 6: Notification

**If breach is confirmed:**

| Notification | Deadline | Method |
|--------------|----------|--------|
| Affected Individuals | 60 days from discovery | Written mail |
| HHS (>500 individuals) | 60 days from discovery | HHS Portal |
| HHS (<500 individuals) | Annual log | HHS Portal |
| Media (>500 in state) | 60 days from discovery | Press release |
| Business Associates | Per BAA terms | Written notice |

**Individual Notification Must Include:**
- Description of what happened
- Types of PHI involved
- Steps individuals should take
- What we are doing in response
- Contact information for questions

### Phase 7: Remediation

- [ ] Patch vulnerabilities
- [ ] Update security controls
- [ ] Retrain workforce if needed
- [ ] Update policies/procedures
- [ ] Implement additional monitoring

### Phase 8: Post-Incident Review

Within 30 days of incident closure:

- [ ] Complete incident report
- [ ] Conduct lessons learned meeting
- [ ] Update incident response plan
- [ ] Brief leadership
- [ ] Close incident ticket

## 7. Documentation Requirements

**Retain for 6 years:**
- Incident report
- Investigation notes
- Breach determination
- Notification records
- Remediation actions

## 8. Training

All workforce members receive incident response training:
- Upon hire
- Annually thereafter
- After significant plan updates

## 9. Testing

This plan is tested annually through:
- Tabletop exercises
- Simulated incidents
- Plan reviews

---

## Appendix A: Breach Assessment Form

**Incident ID:** _______________
**Date Discovered:** _______________
**Date Occurred:** _______________

**PHI Involved:**
- [ ] Names
- [ ] Addresses
- [ ] Dates (birth, admission, etc.)
- [ ] Phone/Fax numbers
- [ ] Email addresses
- [ ] SSN
- [ ] Medical record numbers
- [ ] Health information
- [ ] Other: _______________

**Number of Individuals Affected:** _______________

**Was PHI encrypted?** [ ] Yes [ ] No

**Was encryption key compromised?** [ ] Yes [ ] No [ ] N/A

**Risk Assessment:**

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Nature of PHI | Generic info | Health data | SSN + health |
| Likelihood of re-identification | Difficult | Possible | Easy |
| Unauthorized recipient | Unknown | External party | Malicious actor |
| PHI actually viewed | No evidence | Unknown | Confirmed |

**Breach Determination:** [ ] Breach Confirmed [ ] Not a Breach

**Rationale:** _______________________________________________

**Reviewer:** _______________
**Date:** _______________

---

## Appendix B: Incident Report Template

**Incident ID:** _______________
**Classification:** Level [ ] 1 [ ] 2 [ ] 3 [ ] 4

**Summary:**
_________________________________________________

**Timeline:**
| Date/Time | Action |
|-----------|--------|
| | Incident detected |
| | Reported to security |
| | Response initiated |
| | Contained |
| | Investigation complete |
| | Remediation complete |
| | Incident closed |

**Root Cause:**
_________________________________________________

**Affected Systems:**
_________________________________________________

**Affected Individuals:** _______________

**Actions Taken:**
_________________________________________________

**Recommendations:**
_________________________________________________

**Approved By:** _______________
**Date:** _______________
