# EHR System Implementation Guide
## Okapi Care Network - Staff Portal

---

## Overview

This implementation adds a complete EHR (Electronic Health Records) system to Okapi Care Network, featuring:

- **Staff Portal** - Mobile-first interface for caregivers
- **Medication Administration Record (MAR)** - Track med administration
- **Daily Notes / ADLs** - Document resident care activities
- **Incident Reports** - DSHS-compliant incident documentation
- **Care Plans** - Resident care planning and tracking
- **Offline Support** - Works without internet, syncs when connected
- **DSHS Reports** - Auto-generate compliance reports

---

## File Structure

```
ehr-implementation/
├── 01-database-schema.ts      # New Drizzle tables for EHR
├── 02-api-routes.ts           # Express API endpoints
├── 03-storage-methods.ts      # Database operations
├── 04-staff-pages-part1.tsx   # Login, Setup, Dashboard
├── 05-staff-pages-part2.tsx   # MAR, Residents, Notes
├── 06-components-utilities.tsx # Layout, Auth, Offline storage
├── 07-owner-portal-additions.tsx # Staff invite from owner dashboard
└── README.md                  # This file
```

---

## Implementation Steps

### Step 1: Database Schema

1. Open `shared/schema.ts`
2. Add the contents of `01-database-schema.ts`
3. Run database migration:
   ```bash
   npm run db:push
   ```

### Step 2: Storage Methods

1. Open `server/storage.ts`
2. Add the methods from `03-storage-methods.ts` inside the `DatabaseStorage` class

### Step 3: API Routes

1. Open `server/routes.ts`
2. Add the routes from `02-api-routes.ts`
3. Add the `requireStaffAuth` middleware function
4. Add session support for `staffId` and `facilityId`

### Step 4: Frontend Pages

1. Create directory: `client/src/pages/staff/`
2. Create files from `04-staff-pages-part1.tsx` and `05-staff-pages-part2.tsx`:
   - `staff-login.tsx`
   - `staff-setup.tsx`
   - `staff-dashboard.tsx`
   - `staff-mar.tsx`
   - `staff-residents.tsx`
   - `staff-resident-detail.tsx`

### Step 5: Components & Utilities

1. Create `client/src/components/staff/staff-layout.tsx`
2. Create `client/src/lib/staff-auth.tsx`
3. Create `client/src/lib/offline-storage.ts`
4. Update `client/src/lib/utils.ts` with new formatters

### Step 6: Update App Router

Update `client/src/App.tsx`:

```tsx
import { StaffAuthProvider } from "@/lib/staff-auth";

// Add imports for staff pages...

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StaffAuthProvider>
        <Switch>
          {/* Existing routes */}
          
          {/* Staff Portal Routes */}
          <Route path="/staff/login" component={StaffLogin} />
          <Route path="/staff/setup" component={StaffSetup} />
          <Route path="/staff/dashboard" component={StaffDashboard} />
          <Route path="/staff/residents" component={StaffResidents} />
          <Route path="/staff/residents/:id" component={StaffResidentDetail} />
          <Route path="/staff/mar" component={StaffMAR} />
          <Route path="/staff/notes" component={StaffDailyNotes} />
          <Route path="/staff/incidents" component={StaffIncidents} />
        </Switch>
      </StaffAuthProvider>
    </QueryClientProvider>
  );
}
```

### Step 7: Owner Portal Updates

1. Add `InviteStaffDialog` component to owner dashboard
2. Add "Invite to Staff Portal" button in Team & Credentials section

### Step 8: PWA Setup (Optional but Recommended)

1. Create `public/manifest.json`
2. Create `public/sw.js` (service worker)
3. Register service worker in `client/src/main.tsx`
4. Install `idb` package: `npm install idb`

---

## New Database Tables

| Table | Purpose |
|-------|---------|
| `staff_auth` | Staff login credentials and permissions |
| `residents` | Resident profiles and medical info |
| `medications` | Prescribed medications |
| `medication_logs` | MAR - medication administration records |
| `daily_notes` | ADL tracking and shift notes |
| `incident_reports` | DSHS-compliant incident documentation |
| `care_plans` | Resident care goals and interventions |
| `vitals_log` | Vital signs history |
| `shift_handoffs` | Shift change notes |
| `ehr_reports` | Generated DSHS reports |
| `sync_queue` | Offline sync queue |

---

## New API Endpoints

### Staff Authentication
- `POST /api/staff/login` - Staff login
- `POST /api/staff/logout` - Staff logout
- `GET /api/staff/me` - Get current staff
- `POST /api/staff/setup` - Complete account setup
- `GET /api/staff/setup/validate` - Validate invite token

### Residents
- `GET /api/staff/residents` - List residents
- `GET /api/staff/residents/:id` - Get resident
- `GET /api/staff/residents/:id/full` - Get resident with meds, plans, notes
- `POST /api/staff/residents` - Create resident
- `PATCH /api/staff/residents/:id` - Update resident

### Medications & MAR
- `GET /api/staff/residents/:id/medications` - Get resident meds
- `GET /api/staff/mar` - Get MAR for date
- `GET /api/staff/mar/upcoming` - Get upcoming meds
- `POST /api/staff/mar` - Log medication administration
- `POST /api/staff/medications` - Create medication

### Daily Notes
- `GET /api/staff/daily-notes` - Get notes
- `POST /api/staff/daily-notes` - Create/update note
- `GET /api/staff/daily-notes/missing` - Get residents missing notes

### Incidents
- `GET /api/staff/incidents` - Get incidents
- `POST /api/staff/incidents` - Create incident
- `PATCH /api/staff/incidents/:id` - Update incident

### Care Plans
- `GET /api/staff/residents/:id/care-plans` - Get care plans
- `POST /api/staff/care-plans` - Create care plan

### Sync & Dashboard
- `GET /api/staff/dashboard` - Dashboard stats
- `POST /api/staff/sync` - Sync offline data
- `GET /api/staff/sync/cache` - Get data for offline cache

### Owner Staff Management
- `POST /api/owner/staff/invite` - Invite staff member
- `GET /api/owner/facilities/:id/staff` - Get staff list
- `PATCH /api/owner/staff/:id` - Update staff status

---

## User Flows

### Staff Onboarding
1. Owner clicks "Invite to Staff Portal" on dashboard
2. Owner enters staff email and role
3. System sends invite email with setup link
4. Staff clicks link, creates password + optional PIN
5. Staff logs into mobile portal

### Daily Medication Administration
1. Staff opens Staff Portal on phone
2. Dashboard shows upcoming meds
3. Staff taps "Give" on each med
4. For controlled substances, selects witness
5. Logs are recorded with timestamp

### Incident Reporting
1. Staff taps "Report Incident" from dashboard
2. Fills out incident form (guided)
3. System auto-flags DSHS-reportable incidents
4. Owner is notified immediately for serious incidents
5. Incident can be reviewed and closed

---

## Permissions by Role

| Permission | Caregiver | Med Tech | Shift Lead | Nurse |
|------------|-----------|----------|------------|-------|
| Administer meds | ✅ | ✅ | ✅ | ✅ |
| Administer controlled | ❌ | ✅ | ✅ | ✅ |
| File incidents | ✅ | ✅ | ✅ | ✅ |
| Edit care plans | ❌ | ❌ | ✅ | ✅ |
| Review incidents | ❌ | ❌ | ✅ | ✅ |

---

## Testing Checklist

- [ ] Staff can register via invite link
- [ ] Staff can log in with password
- [ ] Staff can log in with PIN
- [ ] Dashboard shows correct stats
- [ ] Resident list displays correctly
- [ ] MAR shows medications by schedule
- [ ] Can log medication as given
- [ ] Can log medication as refused/missed
- [ ] Controlled substances require witness
- [ ] Daily notes can be created
- [ ] Incident reports can be filed
- [ ] DSHS reportable incidents are flagged
- [ ] Owner receives incident notifications
- [ ] Offline storage works
- [ ] Sync queue processes correctly
- [ ] PWA is installable on mobile

---

## Dependencies to Install

```bash
npm install idb          # IndexedDB wrapper for offline storage
npm install bcryptjs     # Password hashing (if not already installed)
```

---

## Environment Variables

No new environment variables required. Uses existing database connection.

---

## Notes

- Staff Portal is completely separate from Owner Portal
- Staff cannot see business data (inquiries, financials, claims)
- Owner can see staff activity and EHR data
- All data is scoped to facility
- Offline data syncs automatically when online
- DSHS reportable incidents trigger immediate owner notification

---

## Support

For questions about implementation, refer to the detailed code comments in each file or ask Claude Code for help with specific components.
