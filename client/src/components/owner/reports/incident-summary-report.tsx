import { ReportHeader, ReportFooter, ReportTable } from "../report-viewer-dialog";

interface Incident {
  id: string;
  residentId?: string;
  type: string;
  description: string;
  incidentDate: string;
  incidentTime: string;
  status: string;
  dshsReportable: boolean;
  reportedBy: string;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
}

interface IncidentSummaryReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  incidents: Incident[];
  residents: Resident[];
  startDate: string;
  endDate: string;
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  fall: "Fall",
  medication_error: "Medication Error",
  behavior: "Behavior/Aggression",
  elopement: "Elopement/Wandering",
  injury: "Injury",
  illness: "Illness/Medical Emergency",
  property_damage: "Property Damage",
  abuse_neglect: "Abuse/Neglect",
  death: "Death",
  other: "Other",
};

export function IncidentSummaryReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  incidents,
  residents,
  startDate,
  endDate,
}: IncidentSummaryReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getResidentName = (residentId?: string) => {
    if (!residentId) return "N/A - Facility-wide";
    const resident = residents.find((r) => r.id === residentId);
    return resident ? `${resident.firstName} ${resident.lastName}` : "Unknown";
  };

  // Calculate summary stats
  const totalIncidents = incidents.length;
  const dshsReportable = incidents.filter((i) => i.dshsReportable).length;
  const byType = incidents.reduce((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byStatus = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="text-gray-900">
      <ReportHeader
        facilityName={facilityName}
        facilityAddress={facilityAddress}
        facilityPhone={facilityPhone}
        reportTitle="Monthly Incident Summary"
        dateRange={`${formatDate(startDate)} - ${formatDate(endDate)}`}
      />

      {/* Summary Statistics */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="border rounded p-3">
            <p className="text-gray-500">Total Incidents</p>
            <p className="text-2xl font-bold">{totalIncidents}</p>
          </div>
          <div className="border rounded p-3">
            <p className="text-gray-500">DSHS Reportable</p>
            <p className="text-2xl font-bold text-red-600">{dshsReportable}</p>
          </div>
          <div className="border rounded p-3">
            <p className="text-gray-500">Open</p>
            <p className="text-2xl font-bold text-amber-600">{byStatus.open || 0}</p>
          </div>
          <div className="border rounded p-3">
            <p className="text-gray-500">Closed</p>
            <p className="text-2xl font-bold text-green-600">{byStatus.closed || 0}</p>
          </div>
        </div>
      </div>

      {/* By Type Breakdown */}
      {Object.keys(byType).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">By Incident Type</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, count]) => (
              <span
                key={type}
                className="px-3 py-1 bg-gray-100 rounded text-sm"
              >
                {INCIDENT_TYPE_LABELS[type] || type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Incident Details Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Incident Details</h3>
        {incidents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No incidents reported during this period.
          </p>
        ) : (
          <ReportTable headers={["Date", "Resident", "Type", "Status", "DSHS", "Description"]}>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-b">
                <td className="border border-gray-300 px-3 py-2">
                  {formatDate(incident.incidentDate)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {getResidentName(incident.residentId)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {INCIDENT_TYPE_LABELS[incident.type] || incident.type}
                </td>
                <td className="border border-gray-300 px-3 py-2 capitalize">
                  {incident.status}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {incident.dshsReportable ? (
                    <span className="text-red-600 font-semibold">Yes</span>
                  ) : (
                    "No"
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {incident.description.length > 100
                    ? `${incident.description.substring(0, 100)}...`
                    : incident.description}
                </td>
              </tr>
            ))}
          </ReportTable>
        )}
      </div>

      <ReportFooter />
    </div>
  );
}
