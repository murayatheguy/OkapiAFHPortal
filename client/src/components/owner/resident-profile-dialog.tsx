import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  Pill,
  Activity,
  AlertTriangle,
  Folder,
  Phone,
  Calendar,
  Search,
  Loader2,
  Plus,
  Heart,
  AlertCircle,
} from "lucide-react";
import { AddNoteDialog } from "@/components/staff/add-note-dialog";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  status: string;
  admissionDate?: string;
  dateOfBirth?: string;
  diagnoses?: string[];
  allergies?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
  notes?: string;
  photo?: string;
}

interface DailyNote {
  id: string;
  residentId: string;
  facilityId: string;
  staffId: string;
  date: string;
  shift: string;
  notes?: string;
  mood?: string;
  hasConcerns: boolean;
  createdAt: string;
  staffName?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency?: { times: string[]; interval?: string } | null;
  route: string;
  instructions?: string;
  status: string;
  startDate?: string;
}

interface Vital {
  id: string;
  date: string;
  time: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  bloodSugar?: number;
  painLevel?: number;
  createdAt: string;
}

interface Incident {
  id: string;
  type: string;
  incidentDate: string;
  incidentTime: string;
  status: string;
  description: string;
  dshsReportable: boolean;
}

interface ResidentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident;
  facilityId: string;
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  general: "General",
  behavior: "Behavior",
  health: "Health",
  family: "Family Communication",
  other: "Other",
};

const SHIFT_LABELS: Record<string, string> = {
  day: "Day Shift",
  swing: "Swing Shift",
  night: "Night Shift",
};

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

export function ResidentProfileDialog({
  open,
  onOpenChange,
  resident,
  facilityId,
}: ResidentProfileDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState("all");
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  // Fetch notes for this resident
  const { data: notes = [], isLoading: notesLoading } = useQuery<DailyNote[]>({
    queryKey: ["resident-notes", resident.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/notes`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && activeTab === "notes",
  });

  // Fetch medications for this resident
  const { data: medications = [], isLoading: medsLoading } = useQuery<Medication[]>({
    queryKey: ["resident-medications", resident.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/medications`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && activeTab === "medications",
  });

  // Fetch vitals for this resident
  const { data: vitals = [], isLoading: vitalsLoading } = useQuery<Vital[]>({
    queryKey: ["resident-vitals", resident.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/vitals`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && activeTab === "vitals",
  });

  // Fetch incidents for this resident
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ["resident-incidents", resident.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/incidents`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && activeTab === "incidents",
  });

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return "—";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !noteSearch ||
      note.notes?.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.staffName?.toLowerCase().includes(noteSearch.toLowerCase());

    const matchesType =
      noteTypeFilter === "all" || note.mood === noteTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white border-teal-300">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start gap-4">
              {/* Avatar/Photo placeholder */}
              <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-teal-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl text-gray-700">
                    {resident.firstName} {resident.lastName}
                    {resident.preferredName && (
                      <span className="text-gray-500 text-base ml-2">
                        "{resident.preferredName}"
                      </span>
                    )}
                  </DialogTitle>
                  <Badge
                    className={
                      resident.status === "active"
                        ? "bg-green-600"
                        : resident.status === "hospitalized"
                        ? "bg-amber-600"
                        : "bg-stone-600"
                    }
                  >
                    {resident.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                  {resident.roomNumber && <span>Room {resident.roomNumber}</span>}
                  {resident.dateOfBirth && (
                    <span>Age {calculateAge(resident.dateOfBirth)}</span>
                  )}
                  {resident.admissionDate && (
                    <span>Admitted {formatDate(resident.admissionDate)}</span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden mt-4"
          >
            <TabsList className="bg-gray-50 border border-teal-200 flex-shrink-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger
                value="medications"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <Pill className="h-4 w-4" />
                Medications
              </TabsTrigger>
              <TabsTrigger
                value="vitals"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <Activity className="h-4 w-4" />
                Vitals
              </TabsTrigger>
              <TabsTrigger
                value="incidents"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <AlertTriangle className="h-4 w-4" />
                Incidents
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 gap-1"
              >
                <Folder className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="m-0 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <Card className="border-teal-200 bg-gray-50/50">
                    <CardContent className="p-4">
                      <h3 className="text-gray-600 font-medium mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Date of Birth</span>
                          <span className="text-gray-600">{formatDate(resident.dateOfBirth)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Age</span>
                          <span className="text-gray-600">{calculateAge(resident.dateOfBirth)} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Admission Date</span>
                          <span className="text-gray-600">{formatDate(resident.admissionDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Room Number</span>
                          <span className="text-gray-600">{resident.roomNumber || "—"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency Contacts */}
                  <Card className="border-teal-200 bg-gray-50/50">
                    <CardContent className="p-4">
                      <h3 className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-500" />
                        Emergency Contacts
                      </h3>
                      {!resident.emergencyContacts?.length ? (
                        <p className="text-stone-500 text-sm">No emergency contacts on file</p>
                      ) : (
                        <div className="space-y-3">
                          {resident.emergencyContacts.map((contact, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">{contact.name}</span>
                                {contact.isPrimary && (
                                  <Badge className="bg-amber-600 text-xs">Primary</Badge>
                                )}
                              </div>
                              <p className="text-stone-500">{contact.relationship}</p>
                              <p className="text-gray-500">{contact.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Diagnoses */}
                  <Card className="border-teal-200 bg-gray-50/50">
                    <CardContent className="p-4">
                      <h3 className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-400" />
                        Diagnoses
                      </h3>
                      {!resident.diagnoses?.length ? (
                        <p className="text-stone-500 text-sm">No diagnoses on file</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {resident.diagnoses.map((diagnosis, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-teal-300 text-gray-600"
                            >
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Allergies */}
                  <Card className="border-teal-200 bg-gray-50/50">
                    <CardContent className="p-4">
                      <h3 className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-teal-500" />
                        Allergies
                      </h3>
                      {!resident.allergies?.length ? (
                        <p className="text-stone-500 text-sm">No known allergies</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {resident.allergies.map((allergy, idx) => (
                            <Badge key={idx} className="bg-red-600">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Notes */}
                {resident.notes && (
                  <Card className="border-teal-200 bg-gray-50/50">
                    <CardContent className="p-4">
                      <h3 className="text-gray-600 font-medium mb-2">Care Notes</h3>
                      <p className="text-gray-500 text-sm whitespace-pre-wrap">{resident.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="m-0">
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                      <Input
                        placeholder="Search notes..."
                        value={noteSearch}
                        onChange={(e) => setNoteSearch(e.target.value)}
                        className="pl-10 bg-gray-50 border-teal-300 text-gray-700"
                      />
                    </div>
                    <Select value={noteTypeFilter} onValueChange={setNoteTypeFilter}>
                      <SelectTrigger className="w-full md:w-48 bg-gray-50 border-teal-300 text-gray-700">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-50 border-teal-300">
                        <SelectItem value="all" className="text-gray-700">All Types</SelectItem>
                        <SelectItem value="general" className="text-gray-700">General</SelectItem>
                        <SelectItem value="behavior" className="text-gray-700">Behavior</SelectItem>
                        <SelectItem value="health" className="text-gray-700">Health</SelectItem>
                        <SelectItem value="family" className="text-gray-700">Family</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setAddNoteOpen(true)}
                      className="bg-amber-600 hover:bg-amber-500 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </Button>
                  </div>

                  {/* Notes List */}
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                      <p className="text-gray-500">No notes found</p>
                      <p className="text-stone-500 text-sm mt-1">
                        {notes.length === 0
                          ? "No notes have been recorded for this resident yet."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotes.map((note) => (
                        <Card key={note.id} className="border-teal-200 bg-gray-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-stone-500" />
                                <span className="text-gray-600 font-medium">
                                  {formatDate(note.date)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-teal-300 text-gray-500 text-xs"
                                >
                                  {SHIFT_LABELS[note.shift] || note.shift}
                                </Badge>
                                {note.mood && (
                                  <Badge
                                    variant="outline"
                                    className="border-teal-300 text-gray-500 text-xs"
                                  >
                                    {NOTE_TYPE_LABELS[note.mood] || note.mood}
                                  </Badge>
                                )}
                                {note.hasConcerns && (
                                  <Badge className="bg-red-600 text-xs">Concerns</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm whitespace-pre-wrap">
                              {note.notes || "No content"}
                            </p>
                            <p className="text-stone-500 text-xs mt-2">
                              By {note.staffName || "Staff"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Medications Tab */}
              <TabsContent value="medications" className="m-0">
                {medsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : medications.length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                    <p className="text-gray-500">No medications on file</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med) => (
                      <Card key={med.id} className="border-teal-200 bg-gray-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700 font-medium">{med.name}</span>
                                <span className="text-teal-500">{med.dosage}</span>
                                <Badge
                                  className={
                                    med.status === "active" ? "bg-green-600" : "bg-stone-600"
                                  }
                                >
                                  {med.status}
                                </Badge>
                              </div>
                              <p className="text-gray-500 text-sm mt-1">
                                {med.route} • {med.frequency?.interval || "As needed"}
                              </p>
                              {med.instructions && (
                                <p className="text-stone-500 text-sm mt-1">{med.instructions}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Vitals Tab */}
              <TabsContent value="vitals" className="m-0">
                {vitalsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : vitals.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                    <p className="text-gray-500">No vitals recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vitals.map((vital) => (
                      <Card key={vital.id} className="border-teal-200 bg-gray-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-stone-500" />
                            <span className="text-gray-600 font-medium">
                              {formatDate(vital.date)} at {formatTime(vital.time)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {vital.bloodPressureSystolic && vital.bloodPressureDiastolic && (
                              <div>
                                <p className="text-stone-500">Blood Pressure</p>
                                <p className="text-gray-700">
                                  {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic} mmHg
                                </p>
                              </div>
                            )}
                            {vital.heartRate && (
                              <div>
                                <p className="text-stone-500">Heart Rate</p>
                                <p className="text-gray-700">{vital.heartRate} bpm</p>
                              </div>
                            )}
                            {vital.temperature && (
                              <div>
                                <p className="text-stone-500">Temperature</p>
                                <p className="text-gray-700">{vital.temperature}°F</p>
                              </div>
                            )}
                            {vital.oxygenSaturation && (
                              <div>
                                <p className="text-stone-500">O2 Saturation</p>
                                <p className="text-gray-700">{vital.oxygenSaturation}%</p>
                              </div>
                            )}
                            {vital.weight && (
                              <div>
                                <p className="text-stone-500">Weight</p>
                                <p className="text-gray-700">{vital.weight} lbs</p>
                              </div>
                            )}
                            {vital.bloodSugar && (
                              <div>
                                <p className="text-stone-500">Blood Sugar</p>
                                <p className="text-gray-700">{vital.bloodSugar} mg/dL</p>
                              </div>
                            )}
                            {vital.painLevel !== undefined && vital.painLevel !== null && (
                              <div>
                                <p className="text-stone-500">Pain Level</p>
                                <p className="text-gray-700">{vital.painLevel}/10</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Incidents Tab */}
              <TabsContent value="incidents" className="m-0">
                {incidentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                    <p className="text-gray-500">No incidents recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <Card key={incident.id} className="border-teal-200 bg-gray-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-medium">
                                {INCIDENT_TYPE_LABELS[incident.type] || incident.type}
                              </span>
                              <Badge
                                className={
                                  incident.status === "open"
                                    ? "bg-amber-600"
                                    : incident.status === "investigating"
                                    ? "bg-blue-600"
                                    : "bg-green-600"
                                }
                              >
                                {incident.status}
                              </Badge>
                              {incident.dshsReportable && (
                                <Badge className="bg-red-600">DSHS</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm">
                            {formatDate(incident.incidentDate)} at {formatTime(incident.incidentTime)}
                          </p>
                          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                            {incident.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="m-0">
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-gray-500">Document storage coming soon</p>
                  <p className="text-stone-500 text-sm mt-1">
                    Upload and manage resident documents in a future update.
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
      />
    </>
  );
}
