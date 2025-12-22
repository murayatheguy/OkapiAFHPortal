import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Pill,
  FileText,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Loader2,
} from "lucide-react";
import { AddNoteDialog } from "@/components/staff/add-note-dialog";
import { FileIncidentDialog } from "@/components/staff/file-incident-dialog";

const TEAL = "#0d9488";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

interface Medication {
  id: string;
  residentId: string;
  name: string;
  dosage: string;
  frequency?: { times: string[]; interval?: string } | null;
}

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

// Get upcoming medications based on current time and frequency
function getUpcomingMeds(residents: Resident[], medications: Medication[]) {
  const now = new Date();
  const currentHour = now.getHours();

  const upcomingMeds: Array<{
    id: string;
    residentId: string;
    resident: string;
    medication: string;
    time: string;
    status: "due" | "upcoming";
  }> = [];

  residents.forEach((resident) => {
    const residentMeds = medications.filter((m) => m.residentId === resident.id);

    residentMeds.forEach((med) => {
      const interval = med.frequency?.interval?.toUpperCase() || "";
      let times: number[] = [];

      // Determine scheduled times based on frequency
      if (interval === "QD" || interval === "DAILY") {
        times = [8]; // 8 AM
      } else if (interval === "BID") {
        times = [8, 20]; // 8 AM, 8 PM
      } else if (interval === "TID") {
        times = [8, 14, 20]; // 8 AM, 2 PM, 8 PM
      } else if (interval === "QID") {
        times = [8, 12, 16, 20]; // Every 4 hours
      } else if (interval === "QHS") {
        times = [21]; // 9 PM (bedtime)
      } else if (interval === "Q4H") {
        times = [6, 10, 14, 18, 22]; // Every 4 hours
      } else if (interval === "Q6H") {
        times = [6, 12, 18, 0]; // Every 6 hours
      } else if (interval === "Q8H") {
        times = [6, 14, 22]; // Every 8 hours
      } else if (interval === "Q12H") {
        times = [8, 20]; // Every 12 hours
      }

      times.forEach((scheduledHour) => {
        const diff = scheduledHour - currentHour;
        // Show meds due now (within past hour) or upcoming (within next 3 hours)
        if (diff >= -1 && diff <= 3) {
          const timeStr = new Date(now.setHours(scheduledHour, 0, 0, 0)).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          upcomingMeds.push({
            id: `${med.id}-${scheduledHour}`,
            residentId: resident.id,
            resident: `${resident.firstName} ${resident.lastName}`,
            medication: `${med.name} ${med.dosage}`,
            time: timeStr,
            status: diff <= 0 ? "due" : "upcoming",
          });
        }
      });
    });
  });

  // Sort by status (due first) then by time
  return upcomingMeds
    .sort((a, b) => {
      if (a.status === "due" && b.status !== "due") return -1;
      if (a.status !== "due" && b.status === "due") return 1;
      return 0;
    })
    .slice(0, 4); // Limit to 4 items
}

export default function StaffDashboard() {
  const { staff } = useStaffAuth();
  const [, navigate] = useLocation();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [fileIncidentOpen, setFileIncidentOpen] = useState(false);
  const shift = getShiftInfo();
  const ShiftIcon = shift.icon;
  const facilityId = staff?.facilityId;

  // Fetch residents
  const { data: residents = [], isLoading: residentsLoading } = useQuery<Resident[]>({
    queryKey: ["staff-residents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/residents?status=active`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch all active medications for the facility
  const { data: allMedications = [] } = useQuery<Medication[]>({
    queryKey: ["facility-medications", facilityId],
    queryFn: async () => {
      // Get medications for all residents
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

  // Calculate upcoming medications
  const upcomingMeds = getUpcomingMeds(residents, allMedications);
  const medsDueCount = upcomingMeds.filter((m) => m.status === "due").length;

  const stats = [
    { label: "Current Clients", value: residents.length, icon: Users, href: "/staff/mar", color: TEAL },
    { label: "Meds Due", value: medsDueCount || upcomingMeds.length, icon: Pill, href: "/staff/mar", color: "#f59e0b" },
    { label: "Notes Today", value: dashboardData?.todayNotes || 0, icon: FileText, href: "/staff/notes", color: "#6366f1" },
    { label: "Open Incidents", value: incidents.length, icon: AlertTriangle, href: "/staff/incidents", color: "#ef4444" },
  ];

  const quickActions = [
    { label: "Log Medication", icon: Pill, action: () => navigate("/staff/mar") },
    { label: "Add Note", icon: FileText, action: () => setAddNoteOpen(true) },
    { label: "File Incident", icon: AlertTriangle, action: () => setFileIncidentOpen(true) },
    { label: "View Schedule", icon: Clock, action: () => navigate("/staff/mar") },
  ];

  return (
    <StaffLayout>
      <div className="p-4 space-y-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome, {staff?.firstName || "Staff"}!
              </h1>
              <p className="text-gray-600 text-sm mt-0.5">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: `${TEAL}15`, color: TEAL }}
            >
              <ShiftIcon className="h-4 w-4" />
              <span className="font-medium">{shift.name}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: stat.color }} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Upcoming Medications */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Medications</CardTitle>
              <Link href="/staff/mar">
                <Button variant="ghost" size="sm" className="text-sm" style={{ color: TEAL }}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {residentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: TEAL }} />
              </div>
            ) : upcomingMeds.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming medications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingMeds.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => navigate(`/staff/mar?residentId=${med.residentId}`)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{med.resident}</p>
                      <p className="text-sm text-gray-500 truncate">{med.medication}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm text-gray-600">{med.time}</span>
                      <Badge
                        variant={med.status === "due" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {med.status === "due" ? "Due Now" : "Upcoming"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full h-auto min-h-[60px] py-4 flex flex-col items-center gap-2 hover:border-teal-400 hover:bg-teal-50 active:bg-teal-100 transition-colors"
                    onClick={action.action}
                  >
                    <Icon className="h-6 w-6" style={{ color: TEAL }} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Button for mobile */}
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg text-white"
          style={{ backgroundColor: TEAL }}
          onClick={() => setQuickActionOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Quick Action Modal */}
      <Dialog open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:border-teal-300"
                  onClick={() => {
                    setQuickActionOpen(false);
                    action.action();
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color: TEAL }} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <AddNoteDialog open={addNoteOpen} onOpenChange={setAddNoteOpen} />

      {/* File Incident Dialog */}
      <FileIncidentDialog open={fileIncidentOpen} onOpenChange={setFileIncidentOpen} />
    </StaffLayout>
  );
}
