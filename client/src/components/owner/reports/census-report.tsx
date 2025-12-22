import { ReportHeader, ReportFooter, ReportTable } from "../report-viewer-dialog";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  status: string;
  diagnoses?: string[];
  allergies?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
}

interface CensusReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  residents: Resident[];
  capacity: number;
}

export function CensusReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  residents,
  capacity,
}: CensusReportProps) {
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

  const activeResidents = residents.filter((r) => r.status === "active");
  const hospitalizedResidents = residents.filter((r) => r.status === "hospitalized");
  const dischargedResidents = residents.filter((r) => r.status === "discharged");

  const occupancy = activeResidents.length + hospitalizedResidents.length;
  const availableBeds = capacity - occupancy;

  return (
    <div className="text-gray-900">
      <ReportHeader
        facilityName={facilityName}
        facilityAddress={facilityAddress}
        facilityPhone={facilityPhone}
        reportTitle="Resident Census Report"
      />

      {/* Census Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Census Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Active Residents</p>
            <p className="text-2xl font-bold text-green-600">{activeResidents.length}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Hospitalized</p>
            <p className="text-2xl font-bold text-amber-600">{hospitalizedResidents.length}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Capacity</p>
            <p className="text-2xl font-bold">{capacity}</p>
          </div>
          <div className="border rounded p-3 text-center">
            <p className="text-gray-500">Available Beds</p>
            <p className="text-2xl font-bold text-blue-600">{availableBeds}</p>
          </div>
        </div>
      </div>

      {/* Active Residents */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Active Residents ({activeResidents.length})</h3>
        {activeResidents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active residents.</p>
        ) : (
          <ReportTable headers={["Name", "Room", "Age", "DOB", "Admitted", "Diagnoses"]}>
            {activeResidents.map((resident) => (
              <tr key={resident.id} className="border-b">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {resident.firstName} {resident.lastName}
                  {resident.preferredName && (
                    <span className="text-gray-500 text-sm ml-1">
                      "{resident.preferredName}"
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {resident.roomNumber || "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {calculateAge(resident.dateOfBirth)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {formatDate(resident.dateOfBirth)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {formatDate(resident.admissionDate)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {resident.diagnoses?.length
                    ? resident.diagnoses.join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </ReportTable>
        )}
      </div>

      {/* Hospitalized Residents */}
      {hospitalizedResidents.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Hospitalized Residents ({hospitalizedResidents.length})
          </h3>
          <ReportTable headers={["Name", "Room", "Age", "DOB", "Admitted"]}>
            {hospitalizedResidents.map((resident) => (
              <tr key={resident.id} className="border-b bg-amber-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {resident.firstName} {resident.lastName}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {resident.roomNumber || "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {calculateAge(resident.dateOfBirth)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {formatDate(resident.dateOfBirth)}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {formatDate(resident.admissionDate)}
                </td>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}

      {/* Emergency Contacts Summary */}
      <div className="mb-6 page-break-before">
        <h3 className="font-semibold text-gray-800 mb-3">Emergency Contacts</h3>
        <ReportTable headers={["Resident", "Contact Name", "Relationship", "Phone"]}>
          {activeResidents.map((resident) => {
            const primaryContact = resident.emergencyContacts?.find((c) => c.isPrimary)
              || resident.emergencyContacts?.[0];
            return (
              <tr key={resident.id} className="border-b">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {resident.firstName} {resident.lastName}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {primaryContact?.name || "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {primaryContact?.relationship || "—"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {primaryContact?.phone || "—"}
                </td>
              </tr>
            );
          })}
        </ReportTable>
      </div>

      <ReportFooter />
    </div>
  );
}
