import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, X, User, Heart, Phone, FileText } from "lucide-react";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  roomNumber?: string;
  admissionDate?: string;
  status: string;
  diagnoses?: string[];
  allergies?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
  notes?: string;
}

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  editingClient?: Resident | null;
  capacity: number;
  currentCount: number;
}

export function AddClientDialog({
  open,
  onOpenChange,
  facilityId,
  editingClient,
  capacity,
  currentCount,
}: AddClientDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!editingClient;

  // Form state
  const [firstName, setFirstName] = useState(editingClient?.firstName || "");
  const [lastName, setLastName] = useState(editingClient?.lastName || "");
  const [preferredName, setPreferredName] = useState(editingClient?.preferredName || "");
  const [dateOfBirth, setDateOfBirth] = useState(editingClient?.dateOfBirth || "");
  const [roomNumber, setRoomNumber] = useState(editingClient?.roomNumber || "");
  const [admissionDate, setAdmissionDate] = useState(
    editingClient?.admissionDate || new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(editingClient?.notes || "");

  // Array fields
  const [diagnoses, setDiagnoses] = useState<string[]>(editingClient?.diagnoses || []);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [allergies, setAllergies] = useState<string[]>(editingClient?.allergies || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<
    { name: string; relationship: string; phone: string; isPrimary?: boolean }[]
  >(editingClient?.emergencyContacts || []);

  // Reset form when dialog opens/closes or editingClient changes
  const resetForm = () => {
    setFirstName(editingClient?.firstName || "");
    setLastName(editingClient?.lastName || "");
    setPreferredName(editingClient?.preferredName || "");
    setDateOfBirth(editingClient?.dateOfBirth || "");
    setRoomNumber(editingClient?.roomNumber || "");
    setAdmissionDate(editingClient?.admissionDate || new Date().toISOString().split("T")[0]);
    setNotes(editingClient?.notes || "");
    setDiagnoses(editingClient?.diagnoses || []);
    setAllergies(editingClient?.allergies || []);
    setEmergencyContacts(editingClient?.emergencyContacts || []);
    setNewDiagnosis("");
    setNewAllergy("");
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/owners/facilities/${facilityId}/residents`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-facility-residents", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["owner-facility-census", facilityId] });
      toast({ title: "Client added successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add client",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/owners/facilities/${facilityId}/residents/${editingClient?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-facility-residents", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["owner-facility-census", facilityId] });
      toast({ title: "Client updated successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update client",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !dateOfBirth) {
      toast({
        title: "Missing required fields",
        description: "Please fill in first name, last name, and date of birth",
        variant: "destructive",
      });
      return;
    }

    const data = {
      firstName,
      lastName,
      preferredName: preferredName || null,
      dateOfBirth,
      roomNumber: roomNumber || null,
      admissionDate: admissionDate || null,
      notes: notes || null,
      diagnoses,
      allergies,
      emergencyContacts,
      status: "active",
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addDiagnosis = () => {
    if (newDiagnosis.trim() && !diagnoses.includes(newDiagnosis.trim())) {
      setDiagnoses([...diagnoses, newDiagnosis.trim()]);
      setNewDiagnosis("");
    }
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: "", relationship: "", phone: "", isPrimary: emergencyContacts.length === 0 },
    ]);
  };

  const updateEmergencyContact = (index: number, field: string, value: string | boolean) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isFull = !isEditing && currentCount >= capacity;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-teal-300">
        <DialogHeader>
          <DialogTitle className="text-gray-700">
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {isEditing
              ? "Update client information"
              : `Add a new client to your facility (${currentCount}/${capacity} beds)`}
          </DialogDescription>
        </DialogHeader>

        {isFull ? (
          <div className="py-8 text-center">
            <p className="text-teal-500">Facility is at capacity ({capacity} beds)</p>
            <p className="text-stone-500 text-sm mt-2">
              Discharge a client before adding a new one
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                <TabsTrigger value="basic" className="gap-1 text-xs">
                  <User className="h-3 w-3" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-1 text-xs">
                  <Heart className="h-3 w-3" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-1 text-xs">
                  <Phone className="h-3 w-3" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-600">First Name *</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Last Name *</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-600">Preferred Name</Label>
                    <Input
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="Nickname or preferred name"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="bg-gray-50 border-gray-200 text-gray-700"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-600">Room Number</Label>
                    <Input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g., 1A, Room 2"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Admission Date</Label>
                    <Input
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Medical Tab */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                {/* Diagnoses */}
                <div className="space-y-2">
                  <Label className="text-gray-600">Diagnoses</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      placeholder="Add diagnosis"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDiagnosis();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addDiagnosis}
                      variant="outline"
                      className="border-teal-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {diagnoses.map((d, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-gray-50 text-gray-600 gap-1"
                      >
                        {d}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-400"
                          onClick={() => removeDiagnosis(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-2">
                  <Label className="text-gray-600 flex items-center gap-2">
                    Allergies
                    {allergies.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {allergies.length} allergy{allergies.length > 1 ? "ies" : ""}
                      </Badge>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add allergy"
                      className="bg-gray-50 border-gray-200 text-gray-700"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAllergy();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addAllergy}
                      variant="outline"
                      className="border-teal-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergies.map((a, i) => (
                      <Badge key={i} variant="destructive" className="gap-1">
                        {a}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-white"
                          onClick={() => removeAllergy(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Contacts Tab */}
              <TabsContent value="contacts" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-600">Emergency Contacts</Label>
                  <Button
                    type="button"
                    onClick={addEmergencyContact}
                    variant="outline"
                    size="sm"
                    className="border-teal-300 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Contact
                  </Button>
                </div>

                {emergencyContacts.length === 0 ? (
                  <p className="text-stone-500 text-sm">No emergency contacts added</p>
                ) : (
                  <div className="space-y-4">
                    {emergencyContacts.map((contact, i) => (
                      <div key={i} className="p-3 bg-gray-50/50 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-sm">Contact {i + 1}</span>
                          <Button
                            type="button"
                            onClick={() => removeEmergencyContact(i)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 h-6 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(i, "name", e.target.value)}
                            placeholder="Name"
                            className="bg-gray-50 border-gray-200 text-gray-700"
                          />
                          <Input
                            value={contact.relationship}
                            onChange={(e) =>
                              updateEmergencyContact(i, "relationship", e.target.value)
                            }
                            placeholder="Relationship"
                            className="bg-gray-50 border-gray-200 text-gray-700"
                          />
                          <Input
                            value={contact.phone}
                            onChange={(e) => updateEmergencyContact(i, "phone", e.target.value)}
                            placeholder="Phone"
                            className="bg-gray-50 border-gray-200 text-gray-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about the client..."
                    className="bg-gray-50 border-gray-200 text-gray-700 min-h-[150px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : isEditing ? (
                  "Update Client"
                ) : (
                  "Add Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
