import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Printer } from "lucide-react";
import { PrintIncidentReport } from "./print-incident-report";

const TEAL = "#0d9488";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

const INCIDENT_TYPES = [
  { value: "fall", label: "Fall", dshsReportable: false },
  { value: "medication_error", label: "Medication Error", dshsReportable: false },
  { value: "behavior", label: "Behavior/Aggression", dshsReportable: false },
  { value: "elopement", label: "Elopement/Wandering", dshsReportable: false },
  { value: "injury", label: "Injury", dshsReportable: false },
  { value: "illness", label: "Illness/Medical Emergency", dshsReportable: false },
  { value: "property_damage", label: "Property Damage", dshsReportable: false },
  { value: "abuse_neglect", label: "Abuse/Neglect (DSHS Reportable)", dshsReportable: true },
  { value: "death", label: "Death (DSHS Reportable)", dshsReportable: true },
  { value: "other", label: "Other", dshsReportable: false },
];

interface FileIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SavedIncident {
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

export function FileIncidentDialog({ open, onOpenChange }: FileIncidentDialogProps) {
  const { staff } = useStaffAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = staff?.facilityId;

  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [hasInjury, setHasInjury] = useState(false);
  const [injuries, setInjuries] = useState("");
  const [dshsReportable, setDshsReportable] = useState(false);

  const [savedIncident, setSavedIncident] = useState<SavedIncident | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Auto-set DSHS reportable based on incident type
  useEffect(() => {
    const selectedType = INCIDENT_TYPES.find((t) => t.value === incidentType);
    if (selectedType?.dshsReportable) {
      setDshsReportable(true);
    }
  }, [incidentType]);

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
    enabled: !!facilityId && open,
  });

  // Save incident mutation
  const saveIncidentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ehr/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          residentId: selectedResidentId || null,
          type: incidentType,
          description,
          incidentDate,
          incidentTime,
          location: location || null,
          immediateAction: immediateAction || null,
          hasInjury,
          injuries: hasInjury && injuries ? [{ type: injuries, location: "", severity: "" }] : null,
          dshsReportable,
          physicianNotified: false,
          familyNotified: false,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to file incident");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Incident Filed",
        description: dshsReportable
          ? "DSHS reportable incident has been filed. Remember to report to DSHS within required timeframe."
          : "Incident report has been filed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["ehr-incidents"] });

      // Store saved incident for printing
      setSavedIncident({
        id: data.id,
        residentId: selectedResidentId,
        type: incidentType,
        description,
        incidentDate,
        incidentTime,
        location,
        immediateAction,
        hasInjury,
        injuries,
        dshsReportable,
        witnesses,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to file incident. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType) {
      toast({
        title: "Select Type",
        description: "Please select an incident type.",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Enter Description",
        description: "Please describe the incident.",
        variant: "destructive",
      });
      return;
    }
    saveIncidentMutation.mutate();
  };

  const handleClose = () => {
    // Reset form
    setSelectedResidentId("");
    setIncidentType("");
    setIncidentDate(new Date().toISOString().split("T")[0]);
    setIncidentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    setLocation("");
    setDescription("");
    setImmediateAction("");
    setWitnesses("");
    setHasInjury(false);
    setInjuries("");
    setDshsReportable(false);
    setSavedIncident(null);
    setShowPrintView(false);
    onOpenChange(false);
  };

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  // Show print view
  if (showPrintView && savedIncident) {
    return (
      <PrintIncidentReport
        incident={savedIncident}
        resident={selectedResident}
        staffName={`${staff?.firstName} ${staff?.lastName}`}
        onClose={() => {
          setShowPrintView(false);
          handleClose();
        }}
      />
    );
  }

  // Show success state with print option
  if (savedIncident) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <AlertTriangle className="h-5 w-5" />
              Incident Filed Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-gray-600">
              The incident report has been saved. Would you like to print a copy?
            </p>

            {savedIncident.dshsReportable && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  This is a DSHS reportable incident. Please ensure you report to DSHS within the required timeframe.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: TEAL }}
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            File Incident Report
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resident Selector (optional) */}
          <div className="space-y-2">
            <Label>Resident (Optional)</Label>
            {residentsLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resident (if applicable)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific resident</SelectItem>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.firstName} {resident.lastName}
                      {resident.roomNumber && ` (Room ${resident.roomNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Incident Type */}
          <div className="space-y-2">
            <Label>Incident Type *</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type..." />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="Where did this occur?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe what happened in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Immediate Actions */}
          <div className="space-y-2">
            <Label>Immediate Actions Taken</Label>
            <Textarea
              placeholder="What actions were taken immediately after the incident?"
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Witnesses */}
          <div className="space-y-2">
            <Label>Witnesses</Label>
            <Input
              placeholder="Names of any witnesses"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
            />
          </div>

          {/* Injuries */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasInjury"
                checked={hasInjury}
                onCheckedChange={(checked) => setHasInjury(checked === true)}
              />
              <Label htmlFor="hasInjury" className="cursor-pointer">
                Injuries sustained
              </Label>
            </div>
            {hasInjury && (
              <Textarea
                placeholder="Describe injuries..."
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                rows={2}
                className="resize-none mt-2"
              />
            )}
          </div>

          {/* DSHS Reportable */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dshsReportable"
              checked={dshsReportable}
              onCheckedChange={(checked) => setDshsReportable(checked === true)}
            />
            <Label htmlFor="dshsReportable" className="cursor-pointer">
              DSHS Reportable Incident
            </Label>
          </div>

          {dshsReportable && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                This incident must be reported to DSHS within required timeframes.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white"
              style={{ backgroundColor: "#ef4444" }}
              disabled={saveIncidentMutation.isPending}
            >
              {saveIncidentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              File Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
