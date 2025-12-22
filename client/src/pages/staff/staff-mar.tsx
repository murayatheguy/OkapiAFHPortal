import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import { useSearch } from "wouter";
import { StaffLayout } from "@/components/staff/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Pill,
  Check,
  X,
  AlertCircle,
  Minus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";

const TEAL = "#0d9488";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency?: { times: string[]; interval?: string } | null;
  instructions?: string;
  isPRN?: boolean;
  isControlled?: boolean;
}

interface MedicationLog {
  id: string;
  medicationId: string;
  status: string;
  scheduledTime?: string;
  administeredTime?: string;
  notes?: string;
}

// Time slots for MAR grid
const TIME_SLOTS = [
  { id: "morning", label: "Morning", timeRange: "6AM-12PM", times: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"] },
  { id: "noon", label: "Noon", timeRange: "12PM-2PM", times: ["12:00", "13:00"] },
  { id: "afternoon", label: "Afternoon", timeRange: "2PM-6PM", times: ["14:00", "15:00", "16:00", "17:00"] },
  { id: "evening", label: "Evening", timeRange: "6PM-10PM", times: ["18:00", "19:00", "20:00", "21:00"] },
  { id: "night", label: "Night", timeRange: "10PM-6AM", times: ["22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00"] },
  { id: "prn", label: "PRN", timeRange: "As needed", times: [] },
];

const STATUS_OPTIONS = [
  { value: "given", label: "Given", icon: Check, color: "#22c55e", bgColor: "#dcfce7" },
  { value: "refused", label: "Refused", icon: X, color: "#ef4444", bgColor: "#fee2e2" },
  { value: "held", label: "Held", icon: AlertCircle, color: "#f59e0b", bgColor: "#fef3c7" },
  { value: "not_applicable", label: "N/A", icon: Minus, color: "#6b7280", bgColor: "#f3f4f6" },
];

export default function StaffMAR() {
  const { staff } = useStaffAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchString = useSearch();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<{
    medication: Medication;
    timeSlot: typeof TIME_SLOTS[0];
  } | null>(null);
  const [logStatus, setLogStatus] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const facilityId = staff?.facilityId;

  // Handle URL param for auto-selecting resident
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const residentId = params.get("residentId");
    if (residentId && !selectedResident) {
      setSelectedResident(residentId);
    }
  }, [searchString, selectedResident]);

  // Fetch residents
  const { data: residents = [] } = useQuery<Resident[]>({
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

  // Fetch medications for selected resident
  const { data: medications = [], isLoading: medsLoading } = useQuery<Medication[]>({
    queryKey: ["resident-medications", facilityId, selectedResident],
    queryFn: async () => {
      if (!selectedResident) return [];
      const response = await fetch(
        `/api/ehr/residents/${selectedResident}/medications?status=active`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && !!selectedResident,
  });

  // Fetch medication logs for selected date
  const { data: logs = [] } = useQuery<MedicationLog[]>({
    queryKey: ["medication-logs", facilityId, selectedResident, selectedDate],
    queryFn: async () => {
      if (!selectedResident) return [];
      const response = await fetch(
        `/api/ehr/residents/${selectedResident}/mar?date=${selectedDate}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && !!selectedResident,
  });

  // Create medication log
  const logMutation = useMutation({
    mutationFn: async (data: {
      medicationId: string;
      status: string;
      scheduledTime: string;
      notes?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/ehr/mar`,
        {
          ...data,
          residentId: selectedResident,
          administeredTime: new Date().toISOString(),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medication-logs", facilityId, selectedResident, selectedDate],
      });
      toast({ title: "Medication logged successfully" });
      setLogDialogOpen(false);
      setSelectedMed(null);
      setLogStatus("");
      setLogNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log medication",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Get log for a specific medication and time slot
  const getLogForSlot = (medicationId: string, timeSlot: typeof TIME_SLOTS[0]) => {
    return logs.find((log) => {
      if (log.medicationId !== medicationId) return false;
      if (timeSlot.id === "prn") return true; // PRN meds can be logged anytime
      if (!log.scheduledTime) return false;
      const logHour = new Date(log.scheduledTime).getHours();
      const timeStr = logHour.toString().padStart(2, "0") + ":00";
      return timeSlot.times.includes(timeStr);
    });
  };

  // Get scheduled time slots for a medication based on its frequency
  const getMedTimeSlots = (medication: Medication) => {
    if (medication.isPRN) {
      return TIME_SLOTS.filter((slot) => slot.id === "prn");
    }

    const interval = medication.frequency?.interval?.toUpperCase() || "";

    if (interval === "QD" || interval === "DAILY") {
      return TIME_SLOTS.filter((slot) => slot.id === "morning");
    }
    if (interval === "BID") {
      return TIME_SLOTS.filter((slot) => ["morning", "evening"].includes(slot.id));
    }
    if (interval === "TID") {
      return TIME_SLOTS.filter((slot) => ["morning", "noon", "evening"].includes(slot.id));
    }
    if (interval === "QID") {
      return TIME_SLOTS.filter((slot) => ["morning", "noon", "afternoon", "evening"].includes(slot.id));
    }
    if (interval === "QHS") {
      return TIME_SLOTS.filter((slot) => slot.id === "night");
    }

    // Default: show morning slot
    return TIME_SLOTS.filter((slot) => slot.id === "morning");
  };

  const handleCellClick = (medication: Medication, timeSlot: typeof TIME_SLOTS[0]) => {
    const existingLog = getLogForSlot(medication.id, timeSlot);
    if (existingLog) {
      // Already logged
      toast({
        title: "Already logged",
        description: `${medication.name} was logged as "${existingLog.status}" for this time slot`,
      });
      return;
    }

    setSelectedMed({ medication, timeSlot });
    setLogDialogOpen(true);
  };

  const handleLogSubmit = () => {
    if (!selectedMed || !logStatus) {
      toast({
        title: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    const scheduledTime = new Date(selectedDate);
    if (selectedMed.timeSlot.times.length > 0) {
      const [hours] = selectedMed.timeSlot.times[0].split(":");
      scheduledTime.setHours(parseInt(hours), 0, 0, 0);
    }

    logMutation.mutate({
      medicationId: selectedMed.medication.id,
      status: logStatus,
      scheduledTime: scheduledTime.toISOString(),
      notes: logNotes || undefined,
    });
  };

  const changeDate = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const selectedResidentData = residents.find((r) => r.id === selectedResident);

  return (
    <StaffLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: TEAL }}>
                <Pill className="h-5 w-5" />
                Medication Administration Record
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[180px]">
                <div className="font-semibold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {selectedDate === new Date().toISOString().split("T")[0] && (
                  <Badge className="mt-1" style={{ backgroundColor: TEAL }}>
                    Today
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Resident Selector */}
            <Select value={selectedResident || ""} onValueChange={setSelectedResident}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a resident..." />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {resident.firstName} {resident.lastName}
                      {resident.roomNumber && (
                        <span className="text-gray-400 text-sm">
                          • Room {resident.roomNumber}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* MAR Grid */}
        {selectedResident && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  {selectedResidentData?.firstName} {selectedResidentData?.lastName}
                  {selectedResidentData?.roomNumber && (
                    <span className="text-gray-400 font-normal ml-2">
                      Room {selectedResidentData.roomNumber}
                    </span>
                  )}
                </span>
                <Badge variant="outline">
                  {medications.length} medication{medications.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: TEAL }} />
                </div>
              ) : medications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No medications on file for this resident</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-600 w-40">
                          Medication
                        </th>
                        {TIME_SLOTS.map((slot) => (
                          <th
                            key={slot.id}
                            className="text-center py-2 px-1 font-medium text-gray-600 w-16"
                          >
                            <div className="text-xs">{slot.label}</div>
                            <div className="text-[10px] text-gray-400">{slot.timeRange}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med) => {
                        const scheduledSlots = getMedTimeSlots(med);

                        return (
                          <tr key={med.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2">
                              <div className="font-medium text-gray-900 text-sm">
                                {med.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {med.dosage} • {med.route}
                              </div>
                              {med.isControlled && (
                                <Badge variant="outline" className="text-[10px] mt-1 text-orange-600 border-orange-300">
                                  Controlled
                                </Badge>
                              )}
                            </td>
                            {TIME_SLOTS.map((slot) => {
                              const isScheduled = scheduledSlots.some((s) => s.id === slot.id);
                              const log = getLogForSlot(med.id, slot);
                              const statusInfo = log
                                ? STATUS_OPTIONS.find((s) => s.value === log.status)
                                : null;

                              return (
                                <td key={slot.id} className="py-2 px-1 text-center">
                                  <button
                                    onClick={() => handleCellClick(med, slot)}
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${
                                      log
                                        ? "cursor-default"
                                        : isScheduled
                                        ? "hover:border-teal-500 hover:bg-teal-50 cursor-pointer border-gray-300"
                                        : "hover:border-gray-400 hover:bg-gray-50 cursor-pointer border-gray-200 border-dashed"
                                    }`}
                                    style={
                                      log && statusInfo
                                        ? {
                                            backgroundColor: statusInfo.bgColor,
                                            borderColor: statusInfo.color,
                                          }
                                        : undefined
                                    }
                                  >
                                    {log && statusInfo ? (
                                      <statusInfo.icon
                                        className="h-5 w-5"
                                        style={{ color: statusInfo.color }}
                                      />
                                    ) : isScheduled ? (
                                      <Clock className="h-4 w-4 text-gray-300" />
                                    ) : (
                                      <Plus className="h-4 w-4 text-gray-200" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              {medications.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-3 justify-center text-xs">
                    {STATUS_OPTIONS.map((status) => (
                      <div key={status.value} className="flex items-center gap-1">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: status.bgColor }}
                        >
                          <status.icon
                            className="h-3 w-3"
                            style={{ color: status.color }}
                          />
                        </div>
                        <span className="text-gray-600">{status.label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
                        <Clock className="h-3 w-3 text-gray-300" />
                      </div>
                      <span className="text-gray-600">Due</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state when no resident selected */}
        {!selectedResident && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a resident to view their MAR</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Log Medication Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" style={{ color: TEAL }} />
              Log Medication
            </DialogTitle>
            <DialogDescription>
              {selectedMed && (
                <>
                  <strong>{selectedMed.medication.name}</strong>
                  <br />
                  {selectedMed.medication.dosage} • {selectedMed.timeSlot.label} ({selectedMed.timeSlot.timeRange})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status Selection */}
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setLogStatus(status.value)}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    logStatus === status.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <status.icon className="h-5 w-5" style={{ color: status.color }} />
                  <span className="font-medium">{status.label}</span>
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Notes (optional)
              </label>
              <Textarea
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="Add any notes about this administration..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLogSubmit}
              disabled={!logStatus || logMutation.isPending}
              style={{ backgroundColor: TEAL }}
              className="hover:opacity-90"
            >
              {logMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Medication"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
