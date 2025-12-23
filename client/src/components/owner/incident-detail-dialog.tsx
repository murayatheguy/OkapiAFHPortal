import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Printer,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  FileText,
  Shield,
  Phone,
  Users,
  Activity,
  Save,
  X,
  CheckCircle2,
  Search,
  AlertCircle,
} from "lucide-react";

interface IncidentDetail {
  id: string;
  residentId: string | null;
  facilityId: string;
  reportedBy: string;
  incidentDate: string;
  incidentTime: string;
  location: string | null;
  type: string;
  description: string;
  immediateAction: string | null;
  hasInjury: boolean | null;
  injuries: { type: string; location: string; severity: string }[] | null;
  physicianNotified: boolean | null;
  familyNotified: boolean | null;
  dshsReportable: boolean | null;
  status: string;
  followUpNotes: string | null;
  witnesses: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
  residentName: string;
  reportedByName: string;
}

interface IncidentDetailDialogProps {
  incidentId: string | null;
  facilityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INCIDENT_TYPES: Record<string, string> = {
  fall: "Fall",
  medication_error: "Medication Error",
  behavior: "Behavioral Incident",
  injury: "Injury",
  elopement: "Elopement/Wandering",
  abuse: "Abuse/Neglect",
  property: "Property Damage",
  other: "Other",
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "bg-red-600" },
  { value: "investigating", label: "Investigating", color: "bg-blue-600" },
  { value: "resolved", label: "Resolved", color: "bg-green-600" },
  { value: "closed", label: "Closed", color: "bg-gray-600" },
];

export function IncidentDetailDialog({
  incidentId,
  facilityId,
  open,
  onOpenChange,
}: IncidentDetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: incident, isLoading } = useQuery<IncidentDetail>({
    queryKey: ["/api/owners/facilities", facilityId, "ehr/incidents", incidentId],
    queryFn: async () => {
      const res = await fetch(
        `/api/owners/facilities/${facilityId}/ehr/incidents/${incidentId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch incident");
      return res.json();
    },
    enabled: !!incidentId && open,
  });

  useEffect(() => {
    if (incident) {
      setStatus(incident.status);
      setFollowUpNotes(incident.followUpNotes || "");
      setHasChanges(false);
    }
  }, [incident]);

  const updateMutation = useMutation({
    mutationFn: async (data: { status: string; followUpNotes: string }) => {
      const res = await fetch(
        `/api/owners/facilities/${facilityId}/ehr/incidents/${incidentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update incident");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Incident updated successfully" });
      queryClient.invalidateQueries({
        queryKey: ["/api/owners/facilities", facilityId, "ehr/incidents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/owners/facilities", facilityId, "ehr/incidents/summary"],
      });
      setHasChanges(false);
    },
    onError: () => {
      toast({
        title: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (notes: string) => {
    setFollowUpNotes(notes);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({ status, followUpNotes });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incident Report - ${incident?.id?.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .header { margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-gray { background: #f3f4f6; color: #374151; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .field { margin-bottom: 12px; }
            .label { font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; }
            .value { margin-top: 4px; }
            .description { background: #f9fafb; padding: 12px; border-radius: 4px; margin-top: 4px; }
            .injury-list { list-style: disc; margin-left: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Incident Report</h1>
            <p>Report ID: ${incident?.id}</p>
          </div>

          <div class="grid">
            <div class="field">
              <div class="label">Date & Time</div>
              <div class="value">${formatDate(incident?.incidentDate || "")} at ${incident?.incidentTime || ""}</div>
            </div>
            <div class="field">
              <div class="label">Status</div>
              <div class="value"><span class="badge badge-${getStatusBadgeClass(incident?.status || "")}">${incident?.status?.toUpperCase()}</span></div>
            </div>
            <div class="field">
              <div class="label">Incident Type</div>
              <div class="value">${INCIDENT_TYPES[incident?.type || ""] || incident?.type}</div>
            </div>
            <div class="field">
              <div class="label">Location</div>
              <div class="value">${incident?.location || "Not specified"}</div>
            </div>
            <div class="field">
              <div class="label">Resident</div>
              <div class="value">${incident?.residentName || "Unknown"}</div>
            </div>
            <div class="field">
              <div class="label">Reported By</div>
              <div class="value">${incident?.reportedByName || "Unknown"}</div>
            </div>
          </div>

          <h2>Description</h2>
          <div class="description">${incident?.description || ""}</div>

          ${incident?.immediateAction ? `
          <h2>Immediate Action Taken</h2>
          <div class="description">${incident.immediateAction}</div>
          ` : ""}

          ${incident?.hasInjury && incident?.injuries?.length ? `
          <h2>Injuries</h2>
          <ul class="injury-list">
            ${incident.injuries.map(inj => `<li>${inj.type} - ${inj.location} (${inj.severity})</li>`).join("")}
          </ul>
          ` : ""}

          <h2>Notifications</h2>
          <div class="grid">
            <div class="field">
              <div class="label">Physician Notified</div>
              <div class="value">${incident?.physicianNotified ? "Yes" : "No"}</div>
            </div>
            <div class="field">
              <div class="label">Family Notified</div>
              <div class="value">${incident?.familyNotified ? "Yes" : "No"}</div>
            </div>
            <div class="field">
              <div class="label">DSHS Reportable</div>
              <div class="value">${incident?.dshsReportable ? "Yes - Required" : "No"}</div>
            </div>
          </div>

          ${incident?.witnesses?.length ? `
          <h2>Witnesses</h2>
          <p>${incident.witnesses.join(", ")}</p>
          ` : ""}

          ${incident?.followUpNotes ? `
          <h2>Follow-Up Notes</h2>
          <div class="description">${incident.followUpNotes}</div>
          ` : ""}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is an official incident report document.</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open": return "red";
      case "investigating": return "blue";
      case "resolved": return "green";
      case "closed": return "gray";
      default: return "gray";
    }
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return option?.color || "bg-gray-600";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "investigating": return <Search className="h-4 w-4" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4" />;
      case "closed": return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-gray-900">
              Incident Report Details
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : incident ? (
          <div ref={printRef} className="space-y-6">
            {/* Header with key info */}
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
              <Badge className={getStatusColor(incident.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(incident.status)}
                  {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                </span>
              </Badge>
              <Badge variant="outline" className="text-gray-700">
                {INCIDENT_TYPES[incident.type] || incident.type}
              </Badge>
              {incident.dshsReportable && (
                <Badge className="bg-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  DSHS Reportable
                </Badge>
              )}
              {incident.hasInjury && (
                <Badge className="bg-orange-600">
                  <Activity className="h-3 w-3 mr-1" />
                  Injury Reported
                </Badge>
              )}
            </div>

            {/* Date/Time/Location row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(incident.incidentDate)}
                  </p>
                  <p className="text-gray-600">{incident.incidentTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">
                    {incident.location || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Resident</p>
                  <p className="font-medium text-gray-900">
                    {incident.residentName}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Description</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {incident.description}
              </div>
            </div>

            {/* Immediate Action */}
            {incident.immediateAction && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    Immediate Action Taken
                  </h3>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-gray-700">
                  {incident.immediateAction}
                </div>
              </div>
            )}

            {/* Injuries */}
            {incident.hasInjury && incident.injuries && incident.injuries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Injuries</h3>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {incident.injuries.map((injury, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-gray-700">
                          <strong>{injury.type}</strong> - {injury.location}
                          <span className="text-gray-500"> ({injury.severity})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className={`h-5 w-5 ${incident.physicianNotified ? "text-green-600" : "text-gray-400"}`} />
                <div>
                  <p className="text-sm text-gray-500">Physician Notified</p>
                  <p className={`font-medium ${incident.physicianNotified ? "text-green-700" : "text-gray-600"}`}>
                    {incident.physicianNotified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className={`h-5 w-5 ${incident.familyNotified ? "text-green-600" : "text-gray-400"}`} />
                <div>
                  <p className="text-sm text-gray-500">Family Notified</p>
                  <p className={`font-medium ${incident.familyNotified ? "text-green-700" : "text-gray-600"}`}>
                    {incident.familyNotified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${incident.dshsReportable ? "text-red-600" : "text-gray-400"}`} />
                <div>
                  <p className="text-sm text-gray-500">DSHS Reportable</p>
                  <p className={`font-medium ${incident.dshsReportable ? "text-red-700" : "text-gray-600"}`}>
                    {incident.dshsReportable ? "Yes - Required" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Witnesses */}
            {incident.witnesses && incident.witnesses.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  Witnesses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {incident.witnesses.map((witness, index) => (
                    <Badge key={index} variant="outline" className="text-gray-700">
                      {witness}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reporter info */}
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>
                Reported by <span className="font-medium text-gray-700">{incident.reportedByName}</span> on{" "}
                {incident.createdAt
                  ? new Date(incident.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Unknown date"}
              </p>
            </div>

            {/* Status and Follow-up Section */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Update Status & Follow-Up</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Status</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600">Follow-Up Notes</Label>
                <Textarea
                  value={followUpNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add investigation findings, corrective actions, or resolution notes..."
                  rows={4}
                  className="bg-white"
                />
              </div>

              {hasChanges && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus(incident.status);
                      setFollowUpNotes(incident.followUpNotes || "");
                      setHasChanges(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Incident not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
