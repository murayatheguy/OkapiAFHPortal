import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

interface Incident {
  id: string;
  residentId?: string;
  type: string;
  description: string;
  incidentDate: string;
  incidentTime: string;
  location?: string;
  immediateAction?: string;
  hasInjury: boolean;
  injuries?: string;
  dshsReportable: boolean;
  witnesses?: string;
}

interface PrintIncidentReportProps {
  incident: Incident;
  resident?: Resident;
  staffName: string;
  onClose: () => void;
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

export function PrintIncidentReport({
  incident,
  resident,
  staffName,
  onClose,
}: PrintIncidentReportProps) {
  const handlePrint = () => {
    window.print();
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <Button onClick={handlePrint} className="bg-teal-600 text-white">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Print Content */}
      <div className="max-w-3xl mx-auto p-8 print:p-4">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">INCIDENT REPORT</h1>
          <p className="text-gray-600 mt-1">Okapi Care Network</p>
          {incident.dshsReportable && (
            <div className="mt-2 inline-block px-3 py-1 bg-red-100 text-red-700 font-semibold rounded">
              DSHS REPORTABLE
            </div>
          )}
        </div>

        {/* Report Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Report ID</p>
              <p className="text-gray-900">{incident.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Filed By</p>
              <p className="text-gray-900">{staffName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Date of Incident</p>
              <p className="text-gray-900">{formatDate(incident.incidentDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Time of Incident</p>
              <p className="text-gray-900">{formatTime(incident.incidentTime)}</p>
            </div>
          </div>

          {/* Resident Info */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 font-medium">Resident</p>
            <p className="text-gray-900 text-lg">
              {resident
                ? `${resident.firstName} ${resident.lastName}${resident.roomNumber ? ` (Room ${resident.roomNumber})` : ""}`
                : "N/A - Facility-wide incident"}
            </p>
          </div>

          {/* Incident Type */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 font-medium">Incident Type</p>
            <p className="text-gray-900 text-lg font-semibold">
              {INCIDENT_TYPE_LABELS[incident.type] || incident.type}
            </p>
          </div>

          {/* Location */}
          {incident.location && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 font-medium">Location</p>
              <p className="text-gray-900">{incident.location}</p>
            </div>
          )}

          {/* Description */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 font-medium">Description of Incident</p>
            <p className="text-gray-900 whitespace-pre-wrap mt-1">{incident.description}</p>
          </div>

          {/* Immediate Actions */}
          {incident.immediateAction && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 font-medium">Immediate Actions Taken</p>
              <p className="text-gray-900 whitespace-pre-wrap mt-1">{incident.immediateAction}</p>
            </div>
          )}

          {/* Witnesses */}
          {incident.witnesses && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 font-medium">Witnesses</p>
              <p className="text-gray-900">{incident.witnesses}</p>
            </div>
          )}

          {/* Injuries */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 font-medium">Injuries Sustained</p>
            <p className="text-gray-900">
              {incident.hasInjury ? (incident.injuries || "Yes - see description") : "None reported"}
            </p>
          </div>

          {/* Signatures Section */}
          <div className="border-t pt-8 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-8">Staff Signature</p>
                <div className="border-b border-gray-400"></div>
                <p className="text-sm text-gray-500 mt-1">{staffName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-8">Date</p>
                <div className="border-b border-gray-400"></div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Supervisor Review Section */}
          <div className="border-t pt-6 mt-6">
            <p className="text-sm text-gray-500 font-medium mb-4">Supervisor Review</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 mb-8">Supervisor Signature</p>
                <div className="border-b border-gray-400"></div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-8">Date Reviewed</p>
                <div className="border-b border-gray-400"></div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Supervisor Notes:</p>
              <div className="border border-gray-300 h-24 mt-1"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-8 text-center text-xs text-gray-500">
            <p>This is a confidential document. Please handle according to facility privacy policies.</p>
            <p className="mt-1">
              Report generated on {new Date().toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          div[class*="fixed inset-0"] {
            position: absolute;
          }
          div[class*="fixed inset-0"], div[class*="fixed inset-0"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
