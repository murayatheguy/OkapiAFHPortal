import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  Pill,
  FileText,
  AlertTriangle,
  Clock,
  ChevronRight,
  Calendar,
  Activity,
  Bed,
  Phone,
  User,
  Plus,
  ArrowLeft,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  dateOfBirth?: string;
  status: string;
  photoUrl?: string;
  allergies?: string[];
  diagnoses?: string[];
  codeStatus?: string;
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean;
  }>;
}

interface Medication {
  id: string;
  residentId: string;
  name: string;
  dosage: string;
  frequency?: { times: string[]; interval?: string } | null;
}

interface UpcomingMed {
  id: string;
  residentId: string;
  residentName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: "upcoming" | "due" | "overdue" | "given";
}

interface CarePortalHomeProps {
  staffName: string;
  facilityId: string;
  onLogMedication: (residentId?: string) => void;
  onAddNote: (residentId?: string) => void;
  onFileIncident: (residentId?: string) => void;
  onViewSchedule: () => void;
}

// Get shift info based on current time
function getShiftInfo() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) {
    return { name: "Morning Shift", icon: Sun, time: "6:00 AM - 2:00 PM" };
  } else if (hour >= 14 && hour < 22) {
    return { name: "Afternoon Shift", icon: Sunrise, time: "2:00 PM - 10:00 PM" };
  } else {
    return { name: "Night Shift", icon: Moon, time: "10:00 PM - 6:00 AM" };
  }
}

// Calculate upcoming medications
function getUpcomingMeds(residents: Resident[], medications: Medication[]): UpcomingMed[] {
  const now = new Date();
  const currentHour = now.getHours();
  const upcomingMeds: UpcomingMed[] = [];

  residents.forEach((resident) => {
    const residentMeds = medications.filter((m) => m.residentId === resident.id);

    residentMeds.forEach((med) => {
      const interval = med.frequency?.interval?.toUpperCase() || "";
      let times: number[] = [];

      if (interval === "QD" || interval === "DAILY") {
        times = [8];
      } else if (interval === "BID") {
        times = [8, 20];
      } else if (interval === "TID") {
        times = [8, 14, 20];
      } else if (interval === "QID") {
        times = [8, 12, 16, 20];
      } else if (interval === "QHS") {
        times = [21];
      } else if (interval === "Q4H") {
        times = [6, 10, 14, 18, 22];
      } else if (interval === "Q6H") {
        times = [6, 12, 18, 0];
      } else if (interval === "Q8H") {
        times = [6, 14, 22];
      } else if (interval === "Q12H") {
        times = [8, 20];
      }

      times.forEach((scheduledHour) => {
        const diff = scheduledHour - currentHour;
        if (diff >= -1 && diff <= 3) {
          const tempDate = new Date(now);
          tempDate.setHours(scheduledHour, 0, 0, 0);
          const timeStr = tempDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          upcomingMeds.push({
            id: `${med.id}-${scheduledHour}`,
            residentId: resident.id,
            residentName: `${resident.firstName} ${resident.lastName}`,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: timeStr,
            status: diff < 0 ? "overdue" : diff === 0 ? "due" : "upcoming",
          });
        }
      });
    });
  });

  return upcomingMeds.sort((a, b) => {
    const statusOrder = { overdue: 0, due: 1, upcoming: 2, given: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

// Resident Card Component
function ResidentCard({
  resident,
  upcomingMeds,
  onSelect,
  isSelected,
}: {
  resident: Resident;
  upcomingMeds: UpcomingMed[];
  onSelect: () => void;
  isSelected: boolean;
}) {
  const initials = `${resident.firstName?.[0] || ""}${resident.lastName?.[0] || ""}`;
  const residentMeds = upcomingMeds.filter((m) => m.residentId === resident.id);
  const hasDueMeds = residentMeds.some((m) => m.status === "due" || m.status === "overdue");

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-teal-500 bg-teal-50" : "hover:border-teal-300",
        hasDueMeds && "border-l-4 border-l-orange-500"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 border-2 border-white shadow">
            {resident.photoUrl ? (
              <img src={resident.photoUrl} alt={resident.firstName} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-teal-100 text-teal-700 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">
                {resident.preferredName || resident.firstName} {resident.lastName}
              </h3>
              {resident.preferredName && (
                <span className="text-sm text-muted-foreground">({resident.firstName})</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                Room {resident.roomNumber || "—"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  resident.status === "active" && "border-green-500 text-green-600 bg-green-50"
                )}
              >
                {resident.status}
              </Badge>
            </div>

            {/* Upcoming meds indicator */}
            {residentMeds.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Pill
                  className={cn(
                    "h-3.5 w-3.5",
                    hasDueMeds ? "text-orange-500" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    hasDueMeds ? "text-orange-600 font-medium" : "text-muted-foreground"
                  )}
                >
                  {residentMeds.length} med{residentMeds.length !== 1 ? "s" : ""} upcoming
                </span>
              </div>
            )}
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Selected Resident Detail Panel
function ResidentDetailPanel({
  resident,
  upcomingMeds,
  onLogMedication,
  onAddNote,
  onFileIncident,
  onBack,
}: {
  resident: Resident;
  upcomingMeds: UpcomingMed[];
  onLogMedication: () => void;
  onAddNote: () => void;
  onFileIncident: () => void;
  onBack: () => void;
}) {
  const initials = `${resident.firstName?.[0] || ""}${resident.lastName?.[0] || ""}`;
  const residentMeds = upcomingMeds.filter((m) => m.residentId === resident.id);
  const age = resident.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(resident.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const primaryContact = resident.emergencyContacts?.find((c) => c.isPrimary) || resident.emergencyContacts?.[0];

  return (
    <div className="space-y-4">
      {/* Back button for mobile */}
      <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Residents
      </Button>

      {/* Resident Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-white shadow-lg">
              {resident.photoUrl ? (
                <img src={resident.photoUrl} alt={resident.firstName} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {resident.preferredName || resident.firstName} {resident.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  Room {resident.roomNumber || "—"}
                </span>
                {age && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {age} years old
                  </span>
                )}
                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                  {resident.status}
                </Badge>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {resident.allergies && resident.allergies.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-xs font-medium text-red-600 uppercase">Allergies</span>
                    <p className="text-sm text-red-800 mt-1">{resident.allergies.join(", ")}</p>
                  </div>
                )}
                {resident.codeStatus && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-xs font-medium text-purple-600 uppercase">Code Status</span>
                    <p className="text-sm text-purple-800 mt-1">{resident.codeStatus}</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {primaryContact && (
                <div className="flex items-center gap-2 mt-4 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Emergency:</span>
                  <span className="font-medium">{primaryContact.name}</span>
                  {primaryContact.phone && (
                    <a
                      href={`tel:${primaryContact.phone}`}
                      className="text-teal-600 hover:underline"
                    >
                      {primaryContact.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for this Resident */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-teal-50 hover:border-teal-300"
          onClick={onLogMedication}
        >
          <div className="p-2 rounded-full bg-teal-100">
            <Pill className="h-5 w-5 text-teal-600" />
          </div>
          <span className="text-sm font-medium">Log Medication</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          onClick={onAddNote}
        >
          <div className="p-2 rounded-full bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Add Note</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
          onClick={onFileIncident}
        >
          <div className="p-2 rounded-full bg-orange-100">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <span className="text-sm font-medium">File Incident</span>
        </Button>
      </div>

      {/* Upcoming Medications for this Resident */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="h-4 w-4 text-teal-600" />
            Upcoming Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {residentMeds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No medications scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {residentMeds.map((med) => (
                <div
                  key={med.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    med.status === "overdue" && "bg-red-50 border-red-200",
                    med.status === "due" && "bg-orange-50 border-orange-200",
                    med.status === "upcoming" && "bg-gray-50",
                    med.status === "given" && "bg-green-50 border-green-200"
                  )}
                >
                  <div>
                    <p className="font-medium">{med.medicationName}</p>
                    <p className="text-sm text-muted-foreground">{med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{med.scheduledTime}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs mt-1",
                        med.status === "overdue" && "border-red-500 text-red-600",
                        med.status === "due" && "border-orange-500 text-orange-600",
                        med.status === "given" && "border-green-500 text-green-600"
                      )}
                    >
                      {med.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Recent Notes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onAddNote}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No recent notes</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Care Portal Home Component
export function CarePortalHome({
  staffName,
  facilityId,
  onLogMedication,
  onAddNote,
  onFileIncident,
  onViewSchedule,
}: CarePortalHomeProps) {
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const shift = getShiftInfo();
  const ShiftIcon = shift.icon;

  // Fetch residents
  const { data: residents = [], isLoading: residentsLoading } = useQuery<Resident[]>({
    queryKey: ["staff-residents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/residents?status=active`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch residents");
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch all active medications for the facility
  const { data: allMedications = [] } = useQuery<Medication[]>({
    queryKey: ["facility-medications", facilityId],
    queryFn: async () => {
      const meds: Medication[] = [];
      for (const resident of residents) {
        const response = await fetch(`/api/ehr/residents/${resident.id}/medications?status=active`, {
          credentials: "include",
        });
        if (response.ok) {
          const residentMeds = await response.json();
          meds.push(...residentMeds.map((m: any) => ({ ...m, residentId: resident.id })));
        }
      }
      return meds;
    },
    enabled: residents.length > 0,
  });

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ["ehr-dashboard", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/dashboard`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch open incidents count
  const { data: incidents = [] } = useQuery({
    queryKey: ["ehr-incidents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/incidents?status=open`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  const activeResidents = residents.filter((r) => r.status === "active");
  const selectedResident = residents.find((r) => r.id === selectedResidentId);
  const upcomingMeds = getUpcomingMeds(residents, allMedications);

  // Stats
  const totalMedsDue = upcomingMeds.filter((m) => m.status === "due" || m.status === "overdue").length;
  const today = format(new Date(), "EEEE, MMMM d");

  const handleSelectResident = (id: string) => {
    setSelectedResidentId(id);
    setMobileShowDetail(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Welcome, {staffName}!</h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: "#0d948815", color: "#0d9488" }}
            >
              <ShiftIcon className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{shift.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onViewSchedule}>
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Schedule</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-700">{activeResidents.length}</p>
            <p className="text-xs text-teal-600">Residents</p>
          </div>
          <div
            className={cn(
              "text-center p-3 rounded-lg",
              totalMedsDue > 0 ? "bg-orange-50" : "bg-green-50"
            )}
          >
            <p
              className={cn(
                "text-2xl font-bold",
                totalMedsDue > 0 ? "text-orange-700" : "text-green-700"
              )}
            >
              {totalMedsDue}
            </p>
            <p className={cn("text-xs", totalMedsDue > 0 ? "text-orange-600" : "text-green-600")}>
              Meds Due
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{dashboardData?.todayNotes || 0}</p>
            <p className="text-xs text-blue-600">Notes Today</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">{incidents.length}</p>
            <p className="text-xs text-purple-600">Open Incidents</p>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
        {/* Resident List (Left Panel) */}
        <div
          className={cn(
            "md:w-1/3 md:max-w-md md:border-r bg-white",
            mobileShowDetail ? "hidden md:block" : "block"
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              My Residents
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeResidents.length} active resident{activeResidents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-4 space-y-3">
              {residentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
                </div>
              ) : activeResidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No active residents</p>
                  <p className="text-xs mt-1">Residents are added by the facility owner</p>
                </div>
              ) : (
                activeResidents.map((resident) => (
                  <ResidentCard
                    key={resident.id}
                    resident={resident}
                    upcomingMeds={upcomingMeds}
                    onSelect={() => handleSelectResident(resident.id)}
                    isSelected={selectedResidentId === resident.id}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Resident Detail (Right Panel) */}
        <div
          className={cn("flex-1 bg-gray-50", !mobileShowDetail ? "hidden md:block" : "block")}
        >
          {selectedResident ? (
            <ScrollArea className="h-full">
              <div className="p-4">
                <ResidentDetailPanel
                  resident={selectedResident}
                  upcomingMeds={upcomingMeds}
                  onLogMedication={() => onLogMedication(selectedResident.id)}
                  onAddNote={() => onAddNote(selectedResident.id)}
                  onFileIncident={() => onFileIncident(selectedResident.id)}
                  onBack={() => setMobileShowDetail(false)}
                />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-lg">Select a Resident</h3>
              <p className="text-sm mt-1 max-w-xs">
                Choose a resident from the list to view their information and log care activities
              </p>

              {/* All Residents Quick Actions when none selected */}
              <div className="mt-8 w-full max-w-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions (All Residents)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={onViewSchedule}
                  >
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <span className="text-sm">View Schedule</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => onLogMedication()}
                  >
                    <Pill className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">All Medications</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          <Button
            variant="ghost"
            className="flex-col h-auto py-2"
            onClick={() => {
              setMobileShowDetail(false);
              setSelectedResidentId(null);
            }}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Residents</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => onLogMedication()}>
            <Pill className="h-5 w-5" />
            <span className="text-xs mt-1">Meds</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">Vitals</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => onAddNote()}>
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">Notes</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => onFileIncident()}>
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs mt-1">Incidents</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
