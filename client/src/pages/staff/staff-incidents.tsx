import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import { FileIncidentDialog } from "@/components/staff/file-incident-dialog";

const TEAL = "#0d9488";

interface Incident {
  id: string;
  residentId?: string;
  residentName?: string;
  type: string;
  description: string;
  incidentDate: string;
  incidentTime?: string;
  location?: string;
  status: string;
  dshsReportable: boolean;
  hasInjury?: boolean;
  createdAt: string;
  reportedBy?: string;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
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

export default function StaffIncidents() {
  const { staff } = useStaffAuth();
  const facilityId = staff?.facilityId;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fileIncidentOpen, setFileIncidentOpen] = useState(false);

  // Fetch all incidents
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["ehr-incidents-all", facilityId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const response = await fetch(`/api/ehr/incidents?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch residents to map names
  const { data: residents = [] } = useQuery<Resident[]>({
    queryKey: ["ehr-residents", facilityId],
    queryFn: async () => {
      const response = await fetch("/api/ehr/residents", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Create a map of resident IDs to names
  const residentMap = new Map(
    residents.map((r) => [r.id, `${r.firstName} ${r.lastName}`])
  );

  // Count stats
  const openCount = incidents.filter((i) => i.status === "open").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved" || i.status === "closed").length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          <Clock className="h-3 w-3 mr-1" />
          Open
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Resolved
      </Badge>
    );
  };

  const getTypeBadge = (type: string, dshsReportable: boolean) => {
    const label = INCIDENT_TYPE_LABELS[type] || type;
    if (dshsReportable) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          {label} (DSHS)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-600">
        {label}
      </Badge>
    );
  };

  return (
    <StaffLayout title="Incidents">
      <div className="p-4 space-y-4">
        {/* Header with stats and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">{openCount} Open</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">{resolvedCount} Resolved</span>
            </div>
          </div>
          <Button
            onClick={() => setFileIncidentOpen(true)}
            className="gap-2"
            style={{ backgroundColor: TEAL }}
          >
            <Plus className="h-4 w-4" />
            File Incident
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All incidents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="open">Open Only</SelectItem>
              <SelectItem value="resolved">Resolved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && incidents.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Incidents Found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {statusFilter === "all"
                  ? "No incidents have been filed yet."
                  : `No ${statusFilter} incidents found.`}
              </p>
              <Button
                onClick={() => setFileIncidentOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                File New Incident
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Incidents list */}
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(incident.type, incident.dshsReportable)}
                    {getStatusBadge(incident.status)}
                    {incident.hasInjury && (
                      <Badge className="bg-red-50 text-red-600 hover:bg-red-50">
                        Injury
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    #{incident.id.slice(0, 8)}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {incident.description}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {incident.residentId && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{residentMap.get(incident.residentId) || "Unknown Resident"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(incident.incidentDate)}
                      {incident.incidentTime && ` at ${formatTime(incident.incidentTime)}`}
                    </span>
                  </div>
                  {incident.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{incident.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* File Incident Dialog */}
      <FileIncidentDialog open={fileIncidentOpen} onOpenChange={setFileIncidentOpen} />
    </StaffLayout>
  );
}
