import { ReportFooter } from "../report-viewer-dialog";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  dateOfBirth?: string;
}

interface VitalRecord {
  id: string;
  residentId: string;
  recordedBy: string;
  recordedAt: string;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  bloodSugar?: number | null;
  painLevel?: number | null;
  notes?: string | null;
  recordedByName?: string;
}

interface VitalsReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  resident: Resident;
  vitals: VitalRecord[];
  startDate: string;
  endDate: string;
}

// Normal ranges for vitals (for elderly care)
const VITAL_RANGES = {
  bloodPressureSystolic: { low: 90, high: 140, criticalLow: 80, criticalHigh: 180 },
  bloodPressureDiastolic: { low: 60, high: 90, criticalLow: 50, criticalHigh: 120 },
  heartRate: { low: 60, high: 100, criticalLow: 50, criticalHigh: 120 },
  temperature: { low: 97.0, high: 99.5, criticalLow: 95.0, criticalHigh: 103.0 },
  respiratoryRate: { low: 12, high: 20, criticalLow: 8, criticalHigh: 30 },
  oxygenSaturation: { low: 95, high: 100, criticalLow: 90, criticalHigh: 100 },
  bloodSugar: { low: 70, high: 140, criticalLow: 50, criticalHigh: 300 },
};

type VitalKey = keyof typeof VITAL_RANGES;

export function VitalsReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  resident,
  vitals,
  startDate,
  endDate,
}: VitalsReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
  };

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return "—";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getVitalStatus = (value: number | string | null | undefined, vitalKey: VitalKey): "normal" | "warning" | "critical" => {
    if (value === null || value === undefined) return "normal";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "normal";

    const range = VITAL_RANGES[vitalKey];
    if (numValue < range.criticalLow || numValue > range.criticalHigh) return "critical";
    if (numValue < range.low || numValue > range.high) return "warning";
    return "normal";
  };

  const getStatusClass = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "critical": return "bg-red-100 text-red-800 font-semibold";
      case "warning": return "bg-yellow-100 text-yellow-800";
      default: return "";
    }
  };

  const formatVitalValue = (value: number | string | null | undefined, unit: string = "") => {
    if (value === null || value === undefined) return "—";
    return `${value}${unit}`;
  };

  // Calculate averages for summary
  const calculateAverages = () => {
    const sums = {
      systolic: 0, systolicCount: 0,
      diastolic: 0, diastolicCount: 0,
      heartRate: 0, heartRateCount: 0,
      temp: 0, tempCount: 0,
      respRate: 0, respRateCount: 0,
      o2: 0, o2Count: 0,
    };

    vitals.forEach(v => {
      if (v.bloodPressureSystolic) { sums.systolic += v.bloodPressureSystolic; sums.systolicCount++; }
      if (v.bloodPressureDiastolic) { sums.diastolic += v.bloodPressureDiastolic; sums.diastolicCount++; }
      if (v.heartRate) { sums.heartRate += v.heartRate; sums.heartRateCount++; }
      if (v.temperature) { sums.temp += v.temperature; sums.tempCount++; }
      if (v.respiratoryRate) { sums.respRate += v.respiratoryRate; sums.respRateCount++; }
      if (v.oxygenSaturation) { sums.o2 += v.oxygenSaturation; sums.o2Count++; }
    });

    return {
      avgSystolic: sums.systolicCount ? Math.round(sums.systolic / sums.systolicCount) : null,
      avgDiastolic: sums.diastolicCount ? Math.round(sums.diastolic / sums.diastolicCount) : null,
      avgHeartRate: sums.heartRateCount ? Math.round(sums.heartRate / sums.heartRateCount) : null,
      avgTemp: sums.tempCount ? (sums.temp / sums.tempCount).toFixed(1) : null,
      avgRespRate: sums.respRateCount ? Math.round(sums.respRate / sums.respRateCount) : null,
      avgO2: sums.o2Count ? Math.round(sums.o2 / sums.o2Count) : null,
    };
  };

  const averages = calculateAverages();

  // Count out-of-range readings
  const countAbnormal = () => {
    let warnings = 0;
    let critical = 0;

    vitals.forEach(v => {
      if (v.bloodPressureSystolic) {
        const status = getVitalStatus(v.bloodPressureSystolic, "bloodPressureSystolic");
        if (status === "warning") warnings++;
        if (status === "critical") critical++;
      }
      if (v.bloodPressureDiastolic) {
        const status = getVitalStatus(v.bloodPressureDiastolic, "bloodPressureDiastolic");
        if (status === "warning") warnings++;
        if (status === "critical") critical++;
      }
      if (v.heartRate) {
        const status = getVitalStatus(v.heartRate, "heartRate");
        if (status === "warning") warnings++;
        if (status === "critical") critical++;
      }
      if (v.oxygenSaturation) {
        const status = getVitalStatus(v.oxygenSaturation, "oxygenSaturation");
        if (status === "warning") warnings++;
        if (status === "critical") critical++;
      }
    });

    return { warnings, critical };
  };

  const abnormalCounts = countAbnormal();

  return (
    <div className="bg-white text-gray-900 p-8 max-w-[8.5in] mx-auto print:p-4">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{facilityName}</h1>
            {facilityAddress && <p className="text-sm text-gray-600">{facilityAddress}</p>}
            {facilityPhone && <p className="text-sm text-gray-600">Phone: {facilityPhone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">Vitals History Report</h2>
            <p className="text-sm text-gray-600">
              {formatDate(startDate)} — {formatDate(endDate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Generated: {new Date().toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Resident Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Resident Name</p>
            <p className="font-semibold text-lg">
              {resident.firstName} {resident.lastName}
              {resident.preferredName && (
                <span className="text-gray-500 text-sm ml-1">"{resident.preferredName}"</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Room</p>
            <p className="font-medium">{resident.roomNumber || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Date of Birth</p>
            <p className="font-medium">
              {resident.dateOfBirth ? formatDate(resident.dateOfBirth) : "—"}
              {resident.dateOfBirth && (
                <span className="text-gray-500 ml-1">({calculateAge(resident.dateOfBirth)} yrs)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Total Readings</p>
            <p className="font-medium">{vitals.length}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {vitals.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Period Averages</h3>
          <div className="grid grid-cols-6 gap-3 text-center">
            <div className="bg-blue-50 rounded p-2 border border-blue-100">
              <p className="text-xs text-gray-500">Avg BP</p>
              <p className="font-semibold text-blue-700">
                {averages.avgSystolic && averages.avgDiastolic
                  ? `${averages.avgSystolic}/${averages.avgDiastolic}`
                  : "—"}
              </p>
            </div>
            <div className="bg-red-50 rounded p-2 border border-red-100">
              <p className="text-xs text-gray-500">Avg HR</p>
              <p className="font-semibold text-red-700">{averages.avgHeartRate || "—"}</p>
            </div>
            <div className="bg-orange-50 rounded p-2 border border-orange-100">
              <p className="text-xs text-gray-500">Avg Temp</p>
              <p className="font-semibold text-orange-700">{averages.avgTemp ? `${averages.avgTemp}°F` : "—"}</p>
            </div>
            <div className="bg-green-50 rounded p-2 border border-green-100">
              <p className="text-xs text-gray-500">Avg Resp</p>
              <p className="font-semibold text-green-700">{averages.avgRespRate || "—"}</p>
            </div>
            <div className="bg-purple-50 rounded p-2 border border-purple-100">
              <p className="text-xs text-gray-500">Avg O2</p>
              <p className="font-semibold text-purple-700">{averages.avgO2 ? `${averages.avgO2}%` : "—"}</p>
            </div>
            <div className={`rounded p-2 border ${abnormalCounts.critical > 0 ? 'bg-red-100 border-red-300' : abnormalCounts.warnings > 0 ? 'bg-yellow-100 border-yellow-300' : 'bg-green-100 border-green-300'}`}>
              <p className="text-xs text-gray-500">Alerts</p>
              <p className={`font-semibold ${abnormalCounts.critical > 0 ? 'text-red-700' : abnormalCounts.warnings > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                {abnormalCounts.critical > 0 ? `${abnormalCounts.critical} critical` : abnormalCounts.warnings > 0 ? `${abnormalCounts.warnings} warning` : "None"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Table */}
      {vitals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No vital signs recorded during this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Date</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Time</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">BP</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Pulse</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Temp</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Resp</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">O2 Sat</th>
                <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Weight</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map((vital, index) => {
                const { date, time } = formatDateTime(vital.recordedAt);
                const bpSysStatus = getVitalStatus(vital.bloodPressureSystolic, "bloodPressureSystolic");
                const bpDiaStatus = getVitalStatus(vital.bloodPressureDiastolic, "bloodPressureDiastolic");
                const bpStatus = bpSysStatus === "critical" || bpDiaStatus === "critical" ? "critical"
                  : bpSysStatus === "warning" || bpDiaStatus === "warning" ? "warning" : "normal";

                return (
                  <tr key={vital.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-2 py-1.5">{date}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{time}</td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center ${getStatusClass(bpStatus)}`}>
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                        ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                        : "—"}
                    </td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center ${getStatusClass(getVitalStatus(vital.heartRate, "heartRate"))}`}>
                      {formatVitalValue(vital.heartRate)}
                    </td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center ${getStatusClass(getVitalStatus(vital.temperature, "temperature"))}`}>
                      {vital.temperature ? `${vital.temperature}°F` : "—"}
                    </td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center ${getStatusClass(getVitalStatus(vital.respiratoryRate, "respiratoryRate"))}`}>
                      {formatVitalValue(vital.respiratoryRate)}
                    </td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center ${getStatusClass(getVitalStatus(vital.oxygenSaturation, "oxygenSaturation"))}`}>
                      {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">
                      {vital.weight ? `${vital.weight} lbs` : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-xs">{vital.recordedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span>
          Warning (outside normal range)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
          Critical (requires attention)
        </span>
      </div>

      {/* Normal Ranges Reference */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
        <p className="font-medium text-gray-700 mb-1">Normal Ranges (for reference):</p>
        <p className="text-gray-600">
          BP: 90-140/60-90 mmHg | Pulse: 60-100 bpm | Temp: 97.0-99.5°F |
          Resp: 12-20/min | O2 Sat: 95-100%
        </p>
      </div>

      <ReportFooter />
    </div>
  );
}
