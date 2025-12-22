import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";

const TEAL = "#0d9488";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

interface Vitals {
  id: string;
  residentId: string;
  recordedBy: string;
  recordedAt: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: string;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: string;
  bloodSugar?: number;
  painLevel?: number;
  notes?: string;
}

// Check if a value is abnormal
function isAbnormal(type: string, value: number | string | undefined): "normal" | "warning" | "critical" {
  if (value === undefined || value === null) return "normal";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "normal";

  switch (type) {
    case "systolic":
      if (num > 140 || num < 90) return "critical";
      if (num > 130 || num < 100) return "warning";
      break;
    case "diastolic":
      if (num > 90 || num < 60) return "critical";
      if (num > 85 || num < 65) return "warning";
      break;
    case "heartRate":
      if (num > 100 || num < 60) return "critical";
      if (num > 90 || num < 65) return "warning";
      break;
    case "temperature":
      if (num > 100.4 || num < 97) return "critical";
      if (num > 99.5 || num < 97.5) return "warning";
      break;
    case "oxygenSaturation":
      if (num < 95) return "critical";
      if (num < 97) return "warning";
      break;
    case "painLevel":
      if (num > 7) return "critical";
      if (num > 5) return "warning";
      break;
  }
  return "normal";
}

function getStatusColor(status: "normal" | "warning" | "critical"): string {
  switch (status) {
    case "critical":
      return "text-red-600 bg-red-50";
    case "warning":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-900 bg-gray-50";
  }
}

export default function StaffVitals() {
  const { staff } = useStaffAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = staff?.facilityId;

  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [formData, setFormData] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    bloodSugar: "",
    painLevel: "",
    notes: "",
  });

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

  // Fetch vitals for selected resident
  const { data: vitalsHistory = [], isLoading: vitalsLoading } = useQuery<Vitals[]>({
    queryKey: ["resident-vitals", selectedResidentId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/residents/${selectedResidentId}/vitals`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedResidentId,
  });

  // Save vitals mutation
  const saveVitalsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/ehr/residents/${selectedResidentId}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bloodPressureSystolic: data.bloodPressureSystolic ? parseInt(data.bloodPressureSystolic) : null,
          bloodPressureDiastolic: data.bloodPressureDiastolic ? parseInt(data.bloodPressureDiastolic) : null,
          heartRate: data.heartRate ? parseInt(data.heartRate) : null,
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
          oxygenSaturation: data.oxygenSaturation ? parseInt(data.oxygenSaturation) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          bloodSugar: data.bloodSugar ? parseInt(data.bloodSugar) : null,
          painLevel: data.painLevel ? parseInt(data.painLevel) : null,
          notes: data.notes || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to save vitals");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vitals Saved",
        description: "Vital signs have been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["resident-vitals", selectedResidentId] });
      // Reset form
      setFormData({
        bloodPressureSystolic: "",
        bloodPressureDiastolic: "",
        heartRate: "",
        temperature: "",
        respiratoryRate: "",
        oxygenSaturation: "",
        weight: "",
        bloodSugar: "",
        painLevel: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save vitals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      toast({
        title: "Select Resident",
        description: "Please select a resident first.",
        variant: "destructive",
      });
      return;
    }
    saveVitalsMutation.mutate(formData);
  };

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  return (
    <StaffLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${TEAL}15` }}>
              <Activity className="h-6 w-6" style={{ color: TEAL }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Vitals</h1>
              <p className="text-sm text-gray-500">Record and track vital signs</p>
            </div>
          </div>
        </div>

        {/* Resident Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Choose Client</CardTitle>
          </CardHeader>
          <CardContent>
            {residentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: TEAL }} />
              </div>
            ) : (
              <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Tap to choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.firstName} {resident.lastName}
                      {resident.roomNumber && ` (Room ${resident.roomNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Log Vitals Form */}
        {selectedResidentId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Log Vitals for {selectedResident?.firstName} {selectedResident?.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Blood Pressure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="systolic" className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Systolic (mmHg)
                    </Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      value={formData.bloodPressureSystolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                      className={getStatusColor(isAbnormal("systolic", formData.bloodPressureSystolic))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      value={formData.bloodPressureDiastolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                      className={getStatusColor(isAbnormal("diastolic", formData.bloodPressureDiastolic))}
                    />
                  </div>
                </div>

                {/* Heart Rate & Temp */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="heartRate" className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-pink-500" />
                      Heart Rate (bpm)
                    </Label>
                    <Input
                      id="heartRate"
                      type="number"
                      placeholder="72"
                      value={formData.heartRate}
                      onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                      className={getStatusColor(isAbnormal("heartRate", formData.heartRate))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature" className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      Temp (°F)
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      className={getStatusColor(isAbnormal("temperature", formData.temperature))}
                    />
                  </div>
                </div>

                {/* Respiratory & O2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="respiratoryRate" className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-blue-500" />
                      Resp Rate (/min)
                    </Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      placeholder="16"
                      value={formData.respiratoryRate}
                      onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="oxygenSaturation" className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      O2 Sat (%)
                    </Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      placeholder="98"
                      value={formData.oxygenSaturation}
                      onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                      className={getStatusColor(isAbnormal("oxygenSaturation", formData.oxygenSaturation))}
                    />
                  </div>
                </div>

                {/* Weight & Blood Sugar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-500" />
                      Weight (lbs)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="150"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                    <Input
                      id="bloodSugar"
                      type="number"
                      placeholder="100"
                      value={formData.bloodSugar}
                      onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                    />
                  </div>
                </div>

                {/* Pain Level */}
                <div>
                  <Label htmlFor="painLevel" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Pain Level (0-10)
                  </Label>
                  <Input
                    id="painLevel"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={formData.painLevel}
                    onChange={(e) => setFormData({ ...formData, painLevel: e.target.value })}
                    className={getStatusColor(isAbnormal("painLevel", formData.painLevel))}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional observations..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-white min-h-[48px] text-base font-medium"
                  style={{ backgroundColor: TEAL }}
                  disabled={saveVitalsMutation.isPending}
                >
                  {saveVitalsMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Save Vital Signs
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Vitals History */}
        {selectedResidentId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Vitals (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {vitalsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: TEAL }} />
                </div>
              ) : vitalsHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No vitals recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1 font-medium">Date</th>
                        <th className="text-left py-2 px-1 font-medium">BP</th>
                        <th className="text-left py-2 px-1 font-medium">HR</th>
                        <th className="text-left py-2 px-1 font-medium">Temp</th>
                        <th className="text-left py-2 px-1 font-medium">O2</th>
                        <th className="text-left py-2 px-1 font-medium">Pain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalsHistory.slice(0, 10).map((v) => {
                        const bpStatus =
                          isAbnormal("systolic", v.bloodPressureSystolic) === "critical" ||
                          isAbnormal("diastolic", v.bloodPressureDiastolic) === "critical"
                            ? "critical"
                            : isAbnormal("systolic", v.bloodPressureSystolic) === "warning" ||
                              isAbnormal("diastolic", v.bloodPressureDiastolic) === "warning"
                            ? "warning"
                            : "normal";

                        return (
                          <tr key={v.id} className="border-b last:border-0">
                            <td className="py-2 px-1 text-gray-600">
                              {new Date(v.recordedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className={`py-2 px-1 ${bpStatus === "critical" ? "text-red-600 font-medium" : bpStatus === "warning" ? "text-yellow-600" : ""}`}>
                              {v.bloodPressureSystolic && v.bloodPressureDiastolic
                                ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                                : "-"}
                            </td>
                            <td className={`py-2 px-1 ${isAbnormal("heartRate", v.heartRate) === "critical" ? "text-red-600 font-medium" : isAbnormal("heartRate", v.heartRate) === "warning" ? "text-yellow-600" : ""}`}>
                              {v.heartRate || "-"}
                            </td>
                            <td className={`py-2 px-1 ${isAbnormal("temperature", v.temperature) === "critical" ? "text-red-600 font-medium" : isAbnormal("temperature", v.temperature) === "warning" ? "text-yellow-600" : ""}`}>
                              {v.temperature ? `${v.temperature}°` : "-"}
                            </td>
                            <td className={`py-2 px-1 ${isAbnormal("oxygenSaturation", v.oxygenSaturation) === "critical" ? "text-red-600 font-medium" : isAbnormal("oxygenSaturation", v.oxygenSaturation) === "warning" ? "text-yellow-600" : ""}`}>
                              {v.oxygenSaturation ? `${v.oxygenSaturation}%` : "-"}
                            </td>
                            <td className={`py-2 px-1 ${isAbnormal("painLevel", v.painLevel) === "critical" ? "text-red-600 font-medium" : isAbnormal("painLevel", v.painLevel) === "warning" ? "text-yellow-600" : ""}`}>
                              {v.painLevel !== undefined && v.painLevel !== null ? v.painLevel : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}
