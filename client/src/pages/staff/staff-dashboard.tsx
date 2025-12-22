import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
} from "lucide-react";

const TEAL = "#0d9488";

// Placeholder data - will be replaced with API calls
const placeholderMeds = [
  { id: 1, resident: "Mary Johnson", medication: "Metformin 500mg", time: "8:00 AM", status: "due" },
  { id: 2, resident: "Robert Smith", medication: "Lisinopril 10mg", time: "8:00 AM", status: "due" },
  { id: 3, resident: "Helen Davis", medication: "Omeprazole 20mg", time: "8:30 AM", status: "upcoming" },
  { id: 4, resident: "James Wilson", medication: "Amlodipine 5mg", time: "9:00 AM", status: "upcoming" },
];

function getShiftInfo() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) {
    return { name: "Day Shift", icon: Sun, time: "6:00 AM - 2:00 PM" };
  } else if (hour >= 14 && hour < 22) {
    return { name: "Swing Shift", icon: Sunrise, time: "2:00 PM - 10:00 PM" };
  } else {
    return { name: "Night Shift", icon: Moon, time: "10:00 PM - 6:00 AM" };
  }
}

export default function StaffDashboard() {
  const { staff } = useStaffAuth();
  const shift = getShiftInfo();
  const ShiftIcon = shift.icon;

  const stats = [
    { label: "Active Residents", value: 5, icon: Users, href: "/staff/residents", color: TEAL },
    { label: "Meds Due", value: 2, icon: Pill, href: "/staff/mar", color: "#f59e0b" },
    { label: "Notes Today", value: 3, icon: FileText, href: "/staff/notes", color: "#6366f1" },
    { label: "Open Incidents", value: 1, icon: AlertTriangle, href: "/staff/incidents", color: "#ef4444" },
  ];

  const quickActions = [
    { label: "Log Medication", icon: Pill, href: "/staff/mar/log" },
    { label: "Add Note", icon: FileText, href: "/staff/notes/new" },
    { label: "File Incident", icon: AlertTriangle, href: "/staff/incidents/new" },
    { label: "View Schedule", icon: Clock, href: "/staff/schedule" },
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
            <div className="space-y-2">
              {placeholderMeds.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto py-3 flex flex-col items-center gap-1.5 hover:border-teal-300"
                    >
                      <Icon className="h-5 w-5" style={{ color: TEAL }} />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Button for mobile */}
        <Link href="/staff/mar/log">
          <Button
            className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg text-white"
            style={{ backgroundColor: TEAL }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </StaffLayout>
  );
}
