import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, X, User, Heart, Phone, FileText, Building2, Pill, Shield } from "lucide-react";

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
  dietaryRestrictions?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
  notes?: string;
  // Previous Address
  previousAddress?: string;
  previousCity?: string;
  previousState?: string;
  previousZip?: string;
  // Medical Team
  primaryPhysician?: { name: string; phone?: string; fax?: string };
  // Pharmacy
  pharmacyName?: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  // Insurance
  insuranceInfo?: { primary?: string; primaryId?: string; medicaidId?: string; groupNumber?: string };
  // End of Life
  codeStatus?: string;
  funeralHome?: string;
  funeralHomePhone?: string;
  advanceDirectives?: boolean;
  dnrStatus?: boolean;
  // Preferences
  religion?: string;
  culturalNotes?: string;
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

  // Basic Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split("T")[0]);

  // Previous Address
  const [previousAddress, setPreviousAddress] = useState("");
  const [previousCity, setPreviousCity] = useState("");
  const [previousState, setPreviousState] = useState("");
  const [previousZip, setPreviousZip] = useState("");

  // Medical
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newDietaryRestriction, setNewDietaryRestriction] = useState("");

  // Primary Physician
  const [physicianName, setPhysicianName] = useState("");
  const [physicianPhone, setPhysicianPhone] = useState("");
  const [physicianFax, setPhysicianFax] = useState("");

  // Pharmacy
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");

  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceGroupNumber, setInsuranceGroupNumber] = useState("");
  const [medicaidId, setMedicaidId] = useState("");

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<
    { name: string; relationship: string; phone: string; isPrimary?: boolean }[]
  >([]);

  // End of Life
  const [codeStatus, setCodeStatus] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [funeralHomePhone, setFuneralHomePhone] = useState("");
  const [advanceDirectives, setAdvanceDirectives] = useState(false);
  const [dnrStatus, setDnrStatus] = useState(false);

  // Preferences
  const [religion, setReligion] = useState("");
  const [culturalNotes, setCulturalNotes] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when editingClient changes
  useEffect(() => {
    if (editingClient) {
      setFirstName(editingClient.firstName || "");
      setLastName(editingClient.lastName || "");
      setPreferredName(editingClient.preferredName || "");
      setDateOfBirth(editingClient.dateOfBirth || "");
      setRoomNumber(editingClient.roomNumber || "");
      setAdmissionDate(editingClient.admissionDate || new Date().toISOString().split("T")[0]);
      setPreviousAddress(editingClient.previousAddress || "");
      setPreviousCity(editingClient.previousCity || "");
      setPreviousState(editingClient.previousState || "");
      setPreviousZip(editingClient.previousZip || "");
      setDiagnoses(editingClient.diagnoses || []);
      setAllergies(editingClient.allergies || []);
      setDietaryRestrictions(editingClient.dietaryRestrictions || []);
      setPhysicianName(editingClient.primaryPhysician?.name || "");
      setPhysicianPhone(editingClient.primaryPhysician?.phone || "");
      setPhysicianFax(editingClient.primaryPhysician?.fax || "");
      setPharmacyName(editingClient.pharmacyName || "");
      setPharmacyPhone(editingClient.pharmacyPhone || "");
      setPharmacyAddress(editingClient.pharmacyAddress || "");
      setInsuranceProvider(editingClient.insuranceInfo?.primary || "");
      setInsurancePolicyNumber(editingClient.insuranceInfo?.primaryId || "");
      setInsuranceGroupNumber(editingClient.insuranceInfo?.groupNumber || "");
      setMedicaidId(editingClient.insuranceInfo?.medicaidId || "");
      setEmergencyContacts(editingClient.emergencyContacts || []);
      setCodeStatus(editingClient.codeStatus || "");
      setFuneralHome(editingClient.funeralHome || "");
      setFuneralHomePhone(editingClient.funeralHomePhone || "");
      setAdvanceDirectives(editingClient.advanceDirectives || false);
      setDnrStatus(editingClient.dnrStatus || false);
      setReligion(editingClient.religion || "");
      setCulturalNotes(editingClient.culturalNotes || "");
      setNotes(editingClient.notes || "");
    } else {
      resetForm();
    }
  }, [editingClient, open]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPreferredName("");
    setDateOfBirth("");
    setRoomNumber("");
    setAdmissionDate(new Date().toISOString().split("T")[0]);
    setPreviousAddress("");
    setPreviousCity("");
    setPreviousState("");
    setPreviousZip("");
    setDiagnoses([]);
    setAllergies([]);
    setDietaryRestrictions([]);
    setNewDiagnosis("");
    setNewAllergy("");
    setNewDietaryRestriction("");
    setPhysicianName("");
    setPhysicianPhone("");
    setPhysicianFax("");
    setPharmacyName("");
    setPharmacyPhone("");
    setPharmacyAddress("");
    setInsuranceProvider("");
    setInsurancePolicyNumber("");
    setInsuranceGroupNumber("");
    setMedicaidId("");
    setEmergencyContacts([]);
    setCodeStatus("");
    setFuneralHome("");
    setFuneralHomePhone("");
    setAdvanceDirectives(false);
    setDnrStatus(false);
    setReligion("");
    setCulturalNotes("");
    setNotes("");
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
      previousAddress: previousAddress || null,
      previousCity: previousCity || null,
      previousState: previousState || null,
      previousZip: previousZip || null,
      diagnoses,
      allergies,
      dietaryRestrictions,
      primaryPhysician: physicianName ? {
        name: physicianName,
        phone: physicianPhone || undefined,
        fax: physicianFax || undefined,
      } : null,
      pharmacyName: pharmacyName || null,
      pharmacyPhone: pharmacyPhone || null,
      pharmacyAddress: pharmacyAddress || null,
      insuranceInfo: insuranceProvider ? {
        primary: insuranceProvider,
        primaryId: insurancePolicyNumber || undefined,
        groupNumber: insuranceGroupNumber || undefined,
        medicaidId: medicaidId || undefined,
      } : null,
      emergencyContacts,
      codeStatus: codeStatus || null,
      funeralHome: funeralHome || null,
      funeralHomePhone: funeralHomePhone || null,
      advanceDirectives,
      dnrStatus,
      religion: religion || null,
      culturalNotes: culturalNotes || null,
      notes: notes || null,
      status: "active",
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Array field helpers
  const addItem = (
    value: string,
    setter: (v: string) => void,
    array: string[],
    setArray: (a: string[]) => void
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setArray([...array, value.trim()]);
      setter("");
    }
  };

  const removeItem = (index: number, array: string[], setArray: (a: string[]) => void) => {
    setArray(array.filter((_, i) => i !== index));
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditing
              ? "Update client information"
              : `Add a new client to your facility (${currentCount}/${capacity} beds)`}
          </DialogDescription>
        </DialogHeader>

        {isFull ? (
          <div className="py-8 text-center">
            <p className="text-red-600 font-medium">Facility is at capacity ({capacity} beds)</p>
            <p className="text-gray-500 text-sm mt-2">
              Discharge a client before adding a new one
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100">
                <TabsTrigger value="basic" className="gap-1 text-xs data-[state=active]:bg-white">
                  <User className="h-3 w-3" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-1 text-xs data-[state=active]:bg-white">
                  <Heart className="h-3 w-3" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="providers" className="gap-1 text-xs data-[state=active]:bg-white">
                  <Pill className="h-3 w-3" />
                  Providers
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-1 text-xs data-[state=active]:bg-white">
                  <Phone className="h-3 w-3" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-1 text-xs data-[state=active]:bg-white">
                  <Shield className="h-3 w-3" />
                  Care
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1 text-xs data-[state=active]:bg-white">
                  <FileText className="h-3 w-3" />
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">First Name *</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Last Name *</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Preferred Name</Label>
                    <Input
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="Nickname"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Room Number</Label>
                    <Input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g., 1A"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Admission Date</Label>
                  <Input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 max-w-xs"
                  />
                </div>

                {/* Previous Address */}
                <div className="pt-4 border-t border-gray-200">
                  <Label className="text-gray-700 font-medium">Previous Address</Label>
                  <p className="text-gray-500 text-xs mb-3">Client's address before admission</p>
                  <div className="space-y-3">
                    <Input
                      value={previousAddress}
                      onChange={(e) => setPreviousAddress(e.target.value)}
                      placeholder="Street address"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        value={previousCity}
                        onChange={(e) => setPreviousCity(e.target.value)}
                        placeholder="City"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                      <Input
                        value={previousState}
                        onChange={(e) => setPreviousState(e.target.value)}
                        placeholder="State"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                      <Input
                        value={previousZip}
                        onChange={(e) => setPreviousZip(e.target.value)}
                        placeholder="ZIP"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Medical Tab */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                {/* Diagnoses */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Diagnoses</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      placeholder="Add diagnosis"
                      className="bg-white border-gray-300 text-gray-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(newDiagnosis, setNewDiagnosis, diagnoses, setDiagnoses);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem(newDiagnosis, setNewDiagnosis, diagnoses, setDiagnoses)}
                      variant="outline"
                      className="border-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {diagnoses.map((d, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 gap-1">
                        {d}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-blue-600"
                          onClick={() => removeItem(i, diagnoses, setDiagnoses)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    Allergies
                    {allergies.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {allergies.length}
                      </Badge>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add allergy"
                      className="bg-white border-gray-300 text-gray-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(newAllergy, setNewAllergy, allergies, setAllergies);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem(newAllergy, setNewAllergy, allergies, setAllergies)}
                      variant="outline"
                      className="border-gray-300"
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
                          onClick={() => removeItem(i, allergies, setAllergies)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Dietary Restrictions</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDietaryRestriction}
                      onChange={(e) => setNewDietaryRestriction(e.target.value)}
                      placeholder="Add dietary restriction"
                      className="bg-white border-gray-300 text-gray-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem(newDietaryRestriction, setNewDietaryRestriction, dietaryRestrictions, setDietaryRestrictions);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem(newDietaryRestriction, setNewDietaryRestriction, dietaryRestrictions, setDietaryRestrictions)}
                      variant="outline"
                      className="border-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dietaryRestrictions.map((d, i) => (
                      <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-800 gap-1">
                        {d}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-orange-600"
                          onClick={() => removeItem(i, dietaryRestrictions, setDietaryRestrictions)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Providers Tab */}
              <TabsContent value="providers" className="space-y-6 mt-4">
                {/* Primary Physician */}
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Primary Physician</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={physicianName}
                      onChange={(e) => setPhysicianName(e.target.value)}
                      placeholder="Physician name"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={physicianPhone}
                      onChange={(e) => setPhysicianPhone(e.target.value)}
                      placeholder="Phone"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={physicianFax}
                      onChange={(e) => setPhysicianFax(e.target.value)}
                      placeholder="Fax"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                {/* Pharmacy */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="text-gray-700 font-medium">Pharmacy</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="Pharmacy name"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={pharmacyPhone}
                      onChange={(e) => setPharmacyPhone(e.target.value)}
                      placeholder="Phone"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <Input
                    value={pharmacyAddress}
                    onChange={(e) => setPharmacyAddress(e.target.value)}
                    placeholder="Pharmacy address"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                {/* Insurance */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="text-gray-700 font-medium">Insurance</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      placeholder="Insurance provider"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={insurancePolicyNumber}
                      onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                      placeholder="Policy number"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={insuranceGroupNumber}
                      onChange={(e) => setInsuranceGroupNumber(e.target.value)}
                      placeholder="Group number"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={medicaidId}
                      onChange={(e) => setMedicaidId(e.target.value)}
                      placeholder="Medicaid ID (if applicable)"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Contacts Tab */}
              <TabsContent value="contacts" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-gray-700 font-medium">Emergency Contacts</Label>
                    <p className="text-gray-500 text-xs">Add up to 3 emergency contacts</p>
                  </div>
                  <Button
                    type="button"
                    onClick={addEmergencyContact}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 gap-1"
                    disabled={emergencyContacts.length >= 3}
                  >
                    <Plus className="h-3 w-3" />
                    Add Contact
                  </Button>
                </div>

                {emergencyContacts.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
                    No emergency contacts added
                  </p>
                ) : (
                  <div className="space-y-4">
                    {emergencyContacts.map((contact, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm font-medium">
                            Contact {i + 1} {contact.isPrimary && <Badge className="ml-2 bg-teal-600">Primary</Badge>}
                          </span>
                          <Button
                            type="button"
                            onClick={() => removeEmergencyContact(i)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-6 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(i, "name", e.target.value)}
                            placeholder="Name"
                            className="bg-white border-gray-300 text-gray-900"
                          />
                          <Input
                            value={contact.relationship}
                            onChange={(e) => updateEmergencyContact(i, "relationship", e.target.value)}
                            placeholder="Relationship"
                            className="bg-white border-gray-300 text-gray-900"
                          />
                          <Input
                            value={contact.phone}
                            onChange={(e) => updateEmergencyContact(i, "phone", e.target.value)}
                            placeholder="Phone"
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Care Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6 mt-4">
                {/* Code Status */}
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Code Status</Label>
                  <Select value={codeStatus} onValueChange={setCodeStatus}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 max-w-xs">
                      <SelectValue placeholder="Select code status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="full_code">Full Code</SelectItem>
                      <SelectItem value="dnr">DNR (Do Not Resuscitate)</SelectItem>
                      <SelectItem value="dnr_dni">DNR/DNI</SelectItem>
                      <SelectItem value="comfort_care">Comfort Care Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Advance Directives */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">Advance Directives on File</Label>
                      <p className="text-gray-500 text-xs">Living will or healthcare directive</p>
                    </div>
                    <Switch
                      checked={advanceDirectives}
                      onCheckedChange={setAdvanceDirectives}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">DNR Status</Label>
                      <p className="text-gray-500 text-xs">Do Not Resuscitate order on file</p>
                    </div>
                    <Switch
                      checked={dnrStatus}
                      onCheckedChange={setDnrStatus}
                    />
                  </div>
                </div>

                {/* Funeral Home */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="text-gray-700 font-medium">Funeral Home</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={funeralHome}
                      onChange={(e) => setFuneralHome(e.target.value)}
                      placeholder="Funeral home name"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                    <Input
                      value={funeralHomePhone}
                      onChange={(e) => setFuneralHomePhone(e.target.value)}
                      placeholder="Phone"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                {/* Religion & Cultural */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="text-gray-700 font-medium">Personal Preferences</Label>
                  <Input
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    placeholder="Religion / Spiritual preferences"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <Textarea
                    value={culturalNotes}
                    onChange={(e) => setCulturalNotes(e.target.value)}
                    placeholder="Cultural considerations, preferences, or special requests..."
                    className="bg-white border-gray-300 text-gray-900 min-h-[80px]"
                  />
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Additional Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information about the client..."
                    className="bg-white border-gray-300 text-gray-900 min-h-[200px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-500"
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
