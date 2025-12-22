import { ReportFooter } from "../report-viewer-dialog";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  dateOfBirth?: string;
  photo?: string;
  diagnoses?: string[];
  allergies?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
}

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  route: string;
  frequency?: { times: string[]; interval?: string } | null;
  instructions?: string;
  prescribedBy?: string;
  startDate?: string;
  status: string;
}

interface MedicationListReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  resident: Resident;
  medications: Medication[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  QD: "Once daily",
  BID: "Twice daily",
  TID: "Three times daily",
  QID: "Four times daily",
  QHS: "At bedtime",
  Q4H: "Every 4 hours",
  Q6H: "Every 6 hours",
  Q8H: "Every 8 hours",
  Q12H: "Every 12 hours",
  PRN: "As needed",
  DAILY: "Once daily",
};

export function MedicationListReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  resident,
  medications,
}: MedicationListReportProps) {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const getFrequencyLabel = (frequency?: { times: string[]; interval?: string } | null) => {
    if (!frequency) return "As directed";
    const interval = frequency.interval?.toUpperCase() || "";
    return FREQUENCY_LABELS[interval] || frequency.interval || "As directed";
  };

  const activeMedications = medications.filter((m) => m.status === "active");
  const primaryContact = resident.emergencyContacts?.find((c) => c.isPrimary)
    || resident.emergencyContacts?.[0];

  return (
    <div className="text-gray-900">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{facilityName}</h1>
            {facilityAddress && <p className="text-gray-600 text-sm">{facilityAddress}</p>}
            {facilityPhone && <p className="text-gray-600 text-sm">{facilityPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Generated</p>
            <p className="text-sm text-gray-700">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4">
          {/* Photo placeholder */}
          <div className="w-20 h-24 border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50 flex-shrink-0">
            <span className="text-gray-400 text-xs text-center">Photo</span>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {resident.firstName} {resident.lastName}
              {resident.preferredName && (
                <span className="text-gray-500 text-lg ml-2">"{resident.preferredName}"</span>
              )}
            </h2>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-gray-500">Age</p>
                <p className="font-medium">{calculateAge(resident.dateOfBirth)} years</p>
              </div>
              <div>
                <p className="text-gray-500">Room</p>
                <p className="font-medium">{resident.roomNumber || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies - Highlighted */}
      <div className="mb-6">
        <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm">ALLERGIES</span>
        </h3>
        {!resident.allergies?.length ? (
          <div className="border-2 border-green-500 bg-green-50 p-3 rounded">
            <p className="font-bold text-green-700 text-center">NO KNOWN ALLERGIES (NKA)</p>
          </div>
        ) : (
          <div className="border-2 border-red-500 bg-red-50 p-3 rounded">
            <p className="font-bold text-red-700">
              {resident.allergies.join(" • ")}
            </p>
          </div>
        )}
      </div>

      {/* Diagnoses */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Diagnoses</h3>
        {!resident.diagnoses?.length ? (
          <p className="text-gray-500">No diagnoses on file</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resident.diagnoses.map((diagnosis, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
              >
                {diagnosis}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Medications Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">
          Current Medications ({activeMedications.length})
        </h3>
        {activeMedications.length === 0 ? (
          <p className="text-gray-500 text-center py-8 border rounded">
            No active medications on file
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Medication</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Dose</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Route</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Frequency</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Prescriber</th>
                <th className="border border-gray-400 px-2 py-2 text-left font-bold">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {activeMedications.map((med, idx) => (
                <tr key={med.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-400 px-2 py-2">
                    <p className="font-medium">{med.name}</p>
                    {med.genericName && (
                      <p className="text-xs text-gray-500">({med.genericName})</p>
                    )}
                    {med.instructions && (
                      <p className="text-xs text-gray-600 mt-1 italic">{med.instructions}</p>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-2">{med.dosage}</td>
                  <td className="border border-gray-400 px-2 py-2 capitalize">{med.route}</td>
                  <td className="border border-gray-400 px-2 py-2">
                    {getFrequencyLabel(med.frequency)}
                  </td>
                  <td className="border border-gray-400 px-2 py-2">
                    {med.prescribedBy || "—"}
                  </td>
                  <td className="border border-gray-400 px-2 py-2">
                    {formatDate(med.startDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Emergency Contact</h3>
        {!primaryContact ? (
          <p className="text-gray-500">No emergency contact on file</p>
        ) : (
          <div className="border rounded p-3 bg-gray-50">
            <p className="font-medium">{primaryContact.name}</p>
            <p className="text-sm text-gray-600">{primaryContact.relationship}</p>
            <p className="text-sm font-medium">{primaryContact.phone}</p>
          </div>
        )}
      </div>

      {/* Signature Lines */}
      <div className="mt-8 pt-4 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-500 mb-8">Reviewed By</p>
            <div className="border-b border-gray-400"></div>
            <p className="text-xs text-gray-500 mt-1">Signature / Date</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-8">Physician Approval (if required)</p>
            <div className="border-b border-gray-400"></div>
            <p className="text-xs text-gray-500 mt-1">Signature / Date</p>
          </div>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
