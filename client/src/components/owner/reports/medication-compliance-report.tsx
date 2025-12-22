import { ReportHeader, ReportFooter, ReportTable } from "../report-viewer-dialog";

interface MedicationLog {
  id: string;
  residentId: string;
  medicationId: string;
  status: string;
  scheduledTime: string;
  administeredAt?: string;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
}

interface MedicationComplianceReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  logs: MedicationLog[];
  residents: Resident[];
  startDate: string;
  endDate: string;
}

export function MedicationComplianceReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  logs,
  residents,
  startDate,
  endDate,
}: MedicationComplianceReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate overall stats
  const totalScheduled = logs.length;
  const given = logs.filter((l) => l.status === "given").length;
  const refused = logs.filter((l) => l.status === "refused").length;
  const held = logs.filter((l) => l.status === "held").length;
  const missed = logs.filter((l) => l.status === "missed" || l.status === "pending").length;

  const complianceRate = totalScheduled > 0
    ? ((given / totalScheduled) * 100).toFixed(1)
    : "N/A";

  // Calculate per-resident stats
  const residentStats = residents.map((resident) => {
    const residentLogs = logs.filter((l) => l.residentId === resident.id);
    const resTotal = residentLogs.length;
    const resGiven = residentLogs.filter((l) => l.status === "given").length;
    const resRefused = residentLogs.filter((l) => l.status === "refused").length;
    const resHeld = residentLogs.filter((l) => l.status === "held").length;
    const resMissed = residentLogs.filter((l) => l.status === "missed" || l.status === "pending").length;
    const resRate = resTotal > 0 ? ((resGiven / resTotal) * 100).toFixed(1) : "N/A";

    return {
      resident,
      total: resTotal,
      given: resGiven,
      refused: resRefused,
      held: resHeld,
      missed: resMissed,
      rate: resRate,
    };
  }).filter((s) => s.total > 0);

  return (
    <div className="text-gray-900">
      <ReportHeader
        facilityName={facilityName}
        facilityAddress={facilityAddress}
        facilityPhone={facilityPhone}
        reportTitle="Medication Compliance Report"
        dateRange={`${formatDate(startDate)} - ${formatDate(endDate)}`}
      />

      {/* Overall Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Overall Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Total Scheduled</p>
            <p className="text-2xl font-bold">{totalScheduled}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Given</p>
            <p className="text-2xl font-bold text-green-600">{given}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Refused</p>
            <p className="text-2xl font-bold text-amber-600">{refused}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Held</p>
            <p className="text-2xl font-bold text-blue-600">{held}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Missed</p>
            <p className="text-2xl font-bold text-red-600">{missed}</p>
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Overall Compliance Rate</p>
          <p className="text-4xl font-bold text-gray-900">
            {complianceRate === "N/A" ? "N/A" : `${complianceRate}%`}
          </p>
        </div>
      </div>

      {/* Per Resident Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">By Resident</h3>
        {residentStats.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No medication records during this period.
          </p>
        ) : (
          <ReportTable headers={["Resident", "Total", "Given", "Refused", "Held", "Missed", "Rate"]}>
            {residentStats.map((stat) => (
              <tr key={stat.resident.id} className="border-b">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {stat.resident.firstName} {stat.resident.lastName}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {stat.total}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                  {stat.given}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-amber-600">
                  {stat.refused}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">
                  {stat.held}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-red-600">
                  {stat.missed}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  {stat.rate === "N/A" ? "N/A" : `${stat.rate}%`}
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
