# Test Checklist: Team/Staff/Credentials Workflow

## Prerequisites
- Server running at http://localhost:5000
- Owner account: test@example.com / test123
- Facility PIN: 7491

---

## 1. Owner Portal Login

- [ ] Go to `/owner/login`
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `test123`
- [ ] Click "Sign In"
- [ ] Verify redirect to `/owner/dashboard`

---

## 2. Team Members (Dashboard)

### 2.1 Add Team Member
- [ ] Scroll to "Team" section on dashboard
- [ ] Click "Add Team Member" button
- [ ] Fill in:
  - First Name: `John`
  - Last Name: `Caregiver`
  - Email: `john@test.com`
  - Role: `Caregiver`
- [ ] Click "Add Team Member"
- [ ] Verify new member appears in Team section

### 2.2 View Team Members
- [ ] Verify team member cards show:
  - Name
  - Role badge
  - Status badge

---

## 3. Care Management - Staff Tab

### 3.1 Navigate to Staff Tab
- [ ] Click "Care Management" tab
- [ ] Click "Staff" sub-tab

### 3.2 Staff Users Section
- [ ] Verify "Staff Users" card shows users with login access
- [ ] Shows email, role, status, last login

### 3.3 Team Members Section
- [ ] Verify "Team Members" card shows all team members
- [ ] Verify "Portal Access" column shows:
  - "Active" badge with "Revoke" button for those with access
  - "No Access" badge for those without
- [ ] Verify "Credentials" column shows credential count

---

## 4. Care Management - Credentials Tab

### 4.1 Navigate to Credentials Tab
- [ ] Click "Credentials" sub-tab

### 4.2 Add Credential
- [ ] Find a team member in the list
- [ ] Click "Add Credential" button
- [ ] Fill in:
  - Credential Type: `CPR` (required)
  - Credential Number: `CPR-12345` (optional)
  - Expiration Date: Future date (optional)
- [ ] Click "Add Credential"
- [ ] Verify credential appears in list

### 4.3 Add Credential - Minimal
- [ ] Click "Add Credential" on another member
- [ ] Fill in ONLY:
  - Credential Type: `NAC`
- [ ] Click "Add Credential"
- [ ] Verify credential saves successfully

### 4.4 Edit Credential
- [ ] Click Edit on an existing credential
- [ ] Change the credential number
- [ ] Save changes
- [ ] Verify changes are reflected

### 4.5 Delete Credential
- [ ] Click Delete on a credential
- [ ] Confirm deletion
- [ ] Verify credential is removed

---

## 5. Staff Portal Login

### 5.1 Direct Access (Not Logged In)
- [ ] Open incognito/private browser window
- [ ] Go to `/staff/login`
- [ ] Verify login form appears with PIN input
- [ ] Enter Facility PIN: `7491`
- [ ] Enter Name: `Test Staff`
- [ ] Click "Sign In"
- [ ] Verify redirect to `/staff/dashboard`

### 5.2 Already Logged In
- [ ] Close incognito window
- [ ] In main browser (logged in as owner), enable Care Portal
- [ ] Go to `/staff/login`
- [ ] Verify "Welcome Back" screen appears
- [ ] Shows current user name and role
- [ ] "Continue to Dashboard" button works
- [ ] "Sign in as Different User" logs out and shows login form

### 5.3 Protected Routes
- [ ] Try accessing `/staff/dashboard` without being logged in
- [ ] Verify redirect to `/staff/login`

---

## 6. Data Consistency

### 6.1 Team Member Sync
- [ ] Add team member in Dashboard → Team section
- [ ] Verify appears in Care Management → Staff tab
- [ ] Verify appears in Care Management → Credentials tab

### 6.2 Credential Sync
- [ ] Add credential in Credentials tab
- [ ] Verify credential count updates in Staff tab
- [ ] Verify credential appears on team member

---

## API Endpoints to Test

```bash
# Login as owner
curl -c cookies.txt -X POST http://localhost:5000/api/owners/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get team members
curl -b cookies.txt http://localhost:5000/api/facilities/{facilityId}/team

# Get staff (with login access)
curl -b cookies.txt http://localhost:5000/api/owners/facilities/{facilityId}/staff

# Add credential
curl -b cookies.txt -X POST http://localhost:5000/api/owners/team-members/{teamMemberId}/credentials \
  -H "Content-Type: application/json" \
  -d '{"credentialType":"CPR"}'

# Staff PIN login
curl -c staff-cookies.txt -X POST http://localhost:5000/api/ehr/auth/facility-pin-login \
  -H "Content-Type: application/json" \
  -d '{"facilityPin":"7491","staffName":"Test Staff"}'

# Check staff session
curl -b staff-cookies.txt http://localhost:5000/api/ehr/auth/me
```

---

## Known Issues / Edge Cases

1. **Owner as Staff**: When owner clicks "Open Care Portal", they get staff access with owner role
2. **Facility PIN**: All staff share the same facility PIN for quick access
3. **Team vs Staff**: Team members are roster entries; Staff users have login accounts

---

## Database Tables Reference

| Table | Purpose |
|-------|---------|
| `owners` | Owner login accounts |
| `teamMembers` | Staff roster (manual entries) |
| `staffAuth` | Staff login accounts (EHR access) |
| `credentials` | Certifications for team members |
