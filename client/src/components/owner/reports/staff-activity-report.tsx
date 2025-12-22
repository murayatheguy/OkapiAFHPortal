import { ReportHeader, ReportFooter, ReportTable } from "../report-viewer-dialog";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLoginAt?: string;
}

interface StaffActivityData {
  staffId: string;
  notesCount: number;
  medsAdministered: number;
  incidentsFiled: number;
  loginCount: number;
}

interface StaffActivityReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  staff: StaffMember[];
  activityData: StaffActivityData[];
  startDate: string;
  endDate: string;
}

export function StaffActivityReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  staff,
  activityData,
  startDate,
  endDate,
}: StaffActivityReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Merge staff with activity data
  const staffWithActivity = staff.map((s) => {
    const activity = activityData.find((a) => a.staffId === s.id);
    return {
      ...s,
      notesCount: activity?.notesCount || 0,
      medsAdministered: activity?.medsAdministered || 0,
      incidentsFiled: activity?.incidentsFiled || 0,
      loginCount: activity?.loginCount || 0,
    };
  });

  // Calculate totals
  const totals = staffWithActivity.reduce(
    (acc, s) => ({
      notes: acc.notes + s.notesCount,
      meds: acc.meds + s.medsAdministered,
      incidents: acc.incidents + s.incidentsFiled,
      logins: acc.logins + s.loginCount,
    }),
    { notes: 0, meds: 0, incidents: 0, logins: 0 }
  );

  return (
    <div className="text-gray-900">
      <ReportHeader
        facilityName={facilityName}
        facilityAddress={facilityAddress}
        facilityPhone={facilityPhone}
        reportTitle="Staff Activity Report"
        dateRange={`${formatDate(startDate)} - ${formatDate(endDate)}`}
      />

      {/* Activity Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Activity Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Total Logins</p>
            <p className="text-2xl font-bold">{totals.logins}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Notes Written</p>
            <p className="text-2xl font-bold text-blue-600">{totals.notes}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Meds Administered</p>
            <p className="text-2xl font-bold text-green-600">{totals.meds}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Incidents Filed</p>
            <p className="text-2xl font-bold text-amber-600">{totals.incidents}</p>
          </div>
        </div>
      </div>

      {/* Per Staff Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Staff Activity Details</h3>
        {staffWithActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No staff members found.</p>
        ) : (
          <ReportTable headers={["Staff Member", "Role", "Last Login", "Notes", "Meds Given", "Incidents"]}>
            {staffWithActivity.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {s.firstName} {s.lastName}
                </td>
                <td className="border border-gray-300 px-3 py-2 capitalize">
                  {s.role}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {formatDateTime(s.lastLoginAt)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {s.notesCount}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {s.medsAdministered}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {s.incidentsFiled}
                </td>
              </tr>
            ))}
          </ReportTable>
        )}
      </div>

      {/* Staff List */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Staff Roster</h3>
        <p className="text-sm text-gray-600 mb-2">
          Total Staff: {staff.length} | Active: {staff.filter((s) => s.lastLoginAt).length}
        </p>
      </div>

      <ReportFooter />
    </div>
  );
}
