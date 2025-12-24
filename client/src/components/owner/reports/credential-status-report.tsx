import { ReportFooter } from "../report-viewer-dialog";

interface TeamMember {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  status: string;
}

interface Credential {
  id: string;
  teamMemberId: string;
  credentialType: string;
  credentialNumber?: string | null;
  issuingAuthority?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  status?: string | null;
  notes?: string | null;
}

interface CredentialStatusReportProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  teamMember?: TeamMember | null; // null = all staff
  teamMembers: TeamMember[];
  credentials: Credential[];
}

// Credential type labels
const CREDENTIAL_LABELS: Record<string, string> = {
  NAR: "Nursing Assistant Registered",
  NAC: "Nursing Assistant Certified",
  HCA: "Home Care Aide",
  BBP: "Blood Borne Pathogens",
  CPR: "CPR Certification",
  FirstAid: "First Aid Certification",
  FoodHandler: "Food Handler's Permit",
  Dementia: "Dementia/Alzheimer's Training",
  MentalHealth: "Mental Health Specialist",
  MedAdmin: "Medication Administration",
  TBTest: "TB Test",
  BackgroundCheck: "Background Check",
};

// Get credential status based on expiration date
function getCredentialStatus(expirationDate?: string | null): {
  status: "current" | "expiring" | "expired" | "no-expiration";
  label: string;
  bgColor: string;
  textColor: string;
} {
  if (!expirationDate) {
    return {
      status: "no-expiration",
      label: "No Expiration",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
    };
  }

  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      label: "Expired",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: "expiring",
      label: "Expiring Soon",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    };
  } else {
    return {
      status: "current",
      label: "Current",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    };
  }
}

export function CredentialStatusReport({
  facilityName,
  facilityAddress,
  facilityPhone,
  teamMember,
  teamMembers,
  credentials,
}: CredentialStatusReportProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter credentials based on selected team member
  const filteredCredentials = teamMember
    ? credentials.filter((c) => c.teamMemberId === teamMember.id)
    : credentials;

  // Get team members to display
  const displayMembers = teamMember ? [teamMember] : teamMembers;

  // Calculate summary counts
  const summaryCounts = {
    total: filteredCredentials.length,
    current: 0,
    expiring: 0,
    expired: 0,
    noExpiration: 0,
  };

  filteredCredentials.forEach((cred) => {
    const status = getCredentialStatus(cred.expirationDate);
    if (status.status === "current") summaryCounts.current++;
    else if (status.status === "expiring") summaryCounts.expiring++;
    else if (status.status === "expired") summaryCounts.expired++;
    else summaryCounts.noExpiration++;
  });

  // Get credentials for a specific team member
  const getMemberCredentials = (memberId: string) => {
    return filteredCredentials.filter((c) => c.teamMemberId === memberId);
  };

  return (
    <div className="bg-white text-gray-900 p-8 max-w-[8.5in] mx-auto print:p-4">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{facilityName}</h1>
            {facilityAddress && (
              <p className="text-sm text-gray-600">{facilityAddress}</p>
            )}
            {facilityPhone && (
              <p className="text-sm text-gray-600">Phone: {facilityPhone}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">
              Staff Credential Status Report
            </h2>
            <p className="text-sm text-gray-600">
              {teamMember ? teamMember.name : "All Staff Members"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Generated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="bg-blue-50 rounded p-3 border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">
              {summaryCounts.total}
            </p>
            <p className="text-xs text-gray-600">Total Credentials</p>
          </div>
          <div className="bg-green-50 rounded p-3 border border-green-100">
            <p className="text-2xl font-bold text-green-700">
              {summaryCounts.current}
            </p>
            <p className="text-xs text-gray-600">Current</p>
          </div>
          <div className="bg-yellow-50 rounded p-3 border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-700">
              {summaryCounts.expiring}
            </p>
            <p className="text-xs text-gray-600">Expiring Soon</p>
          </div>
          <div className="bg-red-50 rounded p-3 border border-red-100">
            <p className="text-2xl font-bold text-red-700">
              {summaryCounts.expired}
            </p>
            <p className="text-xs text-gray-600">Expired</p>
          </div>
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <p className="text-2xl font-bold text-gray-600">
              {summaryCounts.noExpiration}
            </p>
            <p className="text-xs text-gray-600">No Expiration</p>
          </div>
        </div>
      </div>

      {/* Staff Credentials */}
      {displayMembers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No staff members found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayMembers.map((member) => {
            const memberCredentials = getMemberCredentials(member.id);

            return (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Staff Member Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {member.role}
                        {member.email && (
                          <span className="ml-2 text-gray-400">
                            • {member.email}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          member.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : member.status === "Invited"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {member.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {memberCredentials.length} credential
                        {memberCredentials.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credentials Table */}
                {memberCredentials.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No credentials on file
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Credential
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          License #
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Issuing Authority
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">
                          Issued
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">
                          Expires
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberCredentials.map((cred, idx) => {
                        const statusInfo = getCredentialStatus(
                          cred.expirationDate
                        );
                        return (
                          <tr
                            key={cred.id}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="px-3 py-2 font-medium">
                              {CREDENTIAL_LABELS[cred.credentialType] ||
                                cred.credentialType}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {cred.credentialNumber || "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {cred.issuingAuthority || "—"}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600">
                              {formatDate(cred.issueDate)}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600">
                              {formatDate(cred.expirationDate)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-medium mb-2">Status Legend:</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
            Current (valid)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span>
            Expiring Soon (within 30 days)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
            Expired
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>
            No Expiration Date
          </span>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
