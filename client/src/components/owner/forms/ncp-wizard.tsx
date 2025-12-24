import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Circle,
  FileText,
  User,
  Phone,
  AlertTriangle,
  MessageSquare,
  Pill,
  Heart,
  Stethoscope,
  Brain,
  Activity,
  Home,
  PenLine,
  Loader2,
  X,
  Info,
  Plus,
  Trash2,
  Mail,
} from "lucide-react";

// NCP Form Sections
const NCP_SECTIONS = [
  { id: 1, title: "Resident Information", key: "residentInfo", icon: User },
  { id: 2, title: "Emergency Contacts", key: "emergencyContacts", icon: Phone },
  { id: 3, title: "Emergency Evacuation", key: "evacuation", icon: AlertTriangle },
  { id: 4, title: "Communication", key: "communication", icon: MessageSquare },
  { id: 5, title: "Medication Management", key: "medication", icon: Pill },
  { id: 6, title: "Health Indicators", key: "healthIndicators", icon: Heart },
  { id: 7, title: "Treatments & Therapies", key: "treatments", icon: Stethoscope },
  { id: 8, title: "Psych/Social/Cognitive", key: "psychSocial", icon: Brain },
  { id: 9, title: "Activities of Daily Living", key: "adls", icon: Activity },
  { id: 10, title: "Instrumental ADLs", key: "iadls", icon: Home },
  { id: 11, title: "Review & Signatures", key: "signatures", icon: PenLine },
];

// Initial form data structure
const getInitialFormData = () => ({
  residentInfo: {
    // Provider Information
    providerName: "",
    ncpStartDate: "",
    movedInDate: "",
    dateCompleted: "",
    dateDischarge: "",
    // Resident Information
    firstName: "",
    lastName: "",
    preferredName: "",
    pronouns: "",
    dateOfBirth: "",
    primaryLanguage: "",
    speaksEnglish: false,
    interpreterNeeded: false,
    allergies: "",
    // Legacy fields
    ssn: "",
    admissionDate: "",
    roomNumber: "",
    medicaidId: "",
    diagnosisCodes: [] as string[],
    // Legal Documents
    legalDocuments: {
      powerOfAttorney: false,
      guardian: false,
      healthcareDirective: false,
      polst: false,
      dnr: false,
      other: false,
      otherText: "",
    },
    // Specialty Needs
    specialtyNeeds: {
      dialysis: false,
      hospice: false,
      behavioralHealth: false,
      memoryCare: false,
      other: false,
      otherText: "",
    },
  },
  emergencyContacts: {
    contacts: [
      {
        name: "",
        relationship: "",
        homePhone: "",
        cellPhone: "",
        fax: "",
        email: "",
        address: "",
        preferredContact: "cell" as "home" | "cell" | "email",
      },
    ] as Array<{
      name: string;
      relationship: string;
      homePhone: string;
      cellPhone: string;
      fax: string;
      email: string;
      address: string;
      preferredContact: "home" | "cell" | "email";
    }>,
  },
  evacuation: {
    mobilityLevel: "", // independent, assistive_device, wheelchair, bedridden
    evacuationAssistance: "",
    specialEquipment: [] as string[],
    meetingLocation: "",
  },
  communication: {
    primaryLanguage: "",
    needsInterpreter: false,
    hearingImpairment: "",
    visionImpairment: "",
    communicationMethods: [] as string[],
    specialNeeds: "",
  },
  medication: {
    managementLevel: "", // self, supervised, full_assistance
    allergies: [] as string[],
    pharmacyName: "",
    pharmacyPhone: "",
    physicianName: "",
    physicianPhone: "",
    specialInstructions: "",
  },
  healthIndicators: {
    height: "",
    weight: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    painLevel: "",
    skinCondition: "",
    specialDiet: [] as string[],
    fluidRestrictions: "",
  },
  treatments: {
    therapies: [] as Array<{
      type: string;
      frequency: string;
      provider: string;
    }>,
    medicalEquipment: [] as string[],
    woundCare: "",
    oxygenTherapy: "",
    otherTreatments: "",
  },
  psychSocial: {
    mentalHealthDiagnoses: [] as string[],
    cognitiveStatus: "",
    behavioralNeeds: "",
    socialPreferences: "",
    religiousPreferences: "",
    culturalConsiderations: "",
    hobbiesInterests: [] as string[],
  },
  adls: {
    bathing: { level: "", notes: "" },
    dressing: { level: "", notes: "" },
    grooming: { level: "", notes: "" },
    toileting: { level: "", notes: "" },
    transferring: { level: "", notes: "" },
    eating: { level: "", notes: "" },
    mobility: { level: "", notes: "" },
  },
  iadls: {
    mealPreparation: { level: "", notes: "" },
    housekeeping: { level: "", notes: "" },
    laundry: { level: "", notes: "" },
    shopping: { level: "", notes: "" },
    transportation: { level: "", notes: "" },
    telephoneUse: { level: "", notes: "" },
    medicationManagement: { level: "", notes: "" },
    moneyManagement: { level: "", notes: "" },
  },
  signatures: {
    residentSignature: "",
    residentSignatureDate: "",
    representativeSignature: "",
    representativeSignatureDate: "",
    representativeRelationship: "",
    providerSignature: "",
    providerSignatureDate: "",
    providerTitle: "",
    reviewDate: "",
    nextReviewDate: "",
  },
});

export type NCPFormData = ReturnType<typeof getInitialFormData>;

interface NCPWizardProps {
  facilityId: string;
  residentId?: string;
  formSubmissionId?: number; // For editing existing drafts
  onClose: () => void;
  onComplete?: () => void;
}

export function NCPWizard({
  facilityId,
  residentId,
  formSubmissionId,
  onClose,
  onComplete,
}: NCPWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<NCPFormData>(getInitialFormData());
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch facility data for provider name
  const { data: facility } = useQuery({
    queryKey: ["owner-facility", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch resident data to pre-fill form
  const { data: resident } = useQuery({
    queryKey: ["owner-resident", facilityId, residentId],
    queryFn: async () => {
      if (!residentId) return null;
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${residentId}`,
        { credentials: "include" }
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!residentId && !!facilityId,
  });

  // Fetch existing form submission if editing
  const { data: existingSubmission } = useQuery({
    queryKey: ["form-submission", formSubmissionId],
    queryFn: async () => {
      if (!formSubmissionId) return null;
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/forms/${formSubmissionId}`,
        { credentials: "include" }
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!formSubmissionId,
  });

  // Pre-fill form data from facility
  useEffect(() => {
    if (facility) {
      setFormData((prev) => ({
        ...prev,
        residentInfo: {
          ...prev.residentInfo,
          providerName: facility.name || "",
        },
      }));
    }
  }, [facility]);

  // Pre-fill form data from resident
  useEffect(() => {
    if (resident) {
      // Calculate allergies string from array if needed
      const allergiesText = Array.isArray(resident.allergies)
        ? resident.allergies.join(", ")
        : resident.allergies || "";

      setFormData((prev) => ({
        ...prev,
        residentInfo: {
          ...prev.residentInfo,
          firstName: resident.firstName || "",
          lastName: resident.lastName || "",
          preferredName: resident.preferredName || "",
          pronouns: resident.pronouns || "",
          dateOfBirth: resident.dateOfBirth || "",
          movedInDate: resident.admissionDate || "",
          primaryLanguage: resident.primaryLanguage || "",
          allergies: allergiesText,
          admissionDate: resident.admissionDate || "",
          roomNumber: resident.roomNumber || "",
        },
        emergencyContacts: {
          contacts: (resident.emergencyContacts && resident.emergencyContacts.length > 0)
            ? resident.emergencyContacts.map((c: any) => ({
                name: c.name || "",
                relationship: c.relationship || "Family",
                homePhone: c.phone || "",
                cellPhone: c.altPhone || c.cellPhone || "",
                fax: "",
                email: c.email || "",
                address: c.address || "",
                preferredContact: "cell" as "home" | "cell" | "email",
              }))
            : prev.emergencyContacts.contacts,
        },
        medication: {
          ...prev.medication,
          allergies: resident.allergies || [],
          pharmacyName: resident.pharmacyName || "",
          pharmacyPhone: resident.pharmacyPhone || "",
          physicianName: resident.primaryPhysician?.name || "",
          physicianPhone: resident.primaryPhysician?.phone || "",
        },
      }));
    }
  }, [resident]);

  // Load existing form data if editing
  useEffect(() => {
    if (existingSubmission) {
      try {
        const parsed = JSON.parse(existingSubmission.formData);
        setFormData(parsed);
        setCurrentSection(existingSubmission.currentSection || 1);
        // Mark sections as completed based on saved data
        // This would need logic to determine which sections are complete
      } catch (e) {
        console.error("Failed to parse form data:", e);
      }
    }
  }, [existingSubmission]);

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (completedSections.size / NCP_SECTIONS.length) * 100
  );

  // Get current section info
  const currentSectionInfo = NCP_SECTIONS.find((s) => s.id === currentSection);

  // Navigation handlers
  const goToSection = (sectionId: number) => {
    setCurrentSection(sectionId);
  };

  const goNext = () => {
    if (currentSection < NCP_SECTIONS.length) {
      // Mark current section as complete when moving forward
      setCompletedSections((prev) => new Set(prev).add(currentSection));
      setCurrentSection(currentSection + 1);
    }
  };

  const goPrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        facilityId,
        residentId: residentId || null,
        formType: "ncp",
        formTitle: `NCP - ${formData.residentInfo.firstName} ${formData.residentInfo.lastName}`,
        status: "draft",
        currentSection,
        totalSections: NCP_SECTIONS.length,
        completionPercentage,
        formData: JSON.stringify(formData),
      };

      const url = formSubmissionId
        ? `/api/owners/facilities/${facilityId}/forms/${formSubmissionId}`
        : `/api/owners/facilities/${facilityId}/forms`;
      const method = formSubmissionId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save form");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Draft saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["form-submissions", facilityId] });
    },
    onError: () => {
      toast({
        title: "Failed to save draft",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await saveDraftMutation.mutateAsync();
    setIsSaving(false);
  };

  // Update form data for a section
  const updateSectionData = <K extends keyof NCPFormData>(
    sectionKey: K,
    data: Partial<NCPFormData[K]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        ...data,
      },
    }));
  };

  // Helper to calculate age from date of birth
  const calculateAge = (dob: string): string => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : "";
  };

  // Auto-fill hint component
  const AutoFillHint = () => (
    <span className="text-xs text-teal-600 ml-1">(Auto-filled)</span>
  );

  // Render Section 1: Resident Information
  const renderResidentInfoSection = () => {
    const data = formData.residentInfo;

    return (
      <div className="space-y-8">
        {/* Provider Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Home className="h-4 w-4 text-teal-600" />
            Provider Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">
                Provider Name
                {facility?.name && <AutoFillHint />}
              </Label>
              <Input
                value={data.providerName}
                onChange={(e) =>
                  updateSectionData("residentInfo", { providerName: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                placeholder="Facility name"
              />
            </div>
            <div>
              <Label className="text-gray-700">NCP Start Date</Label>
              <Input
                type="date"
                value={data.ncpStartDate}
                onChange={(e) =>
                  updateSectionData("residentInfo", { ncpStartDate: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Date Moved In
                {resident?.admissionDate && <AutoFillHint />}
              </Label>
              <Input
                type="date"
                value={data.movedInDate}
                onChange={(e) =>
                  updateSectionData("residentInfo", { movedInDate: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <Label className="text-gray-700">Date Completed</Label>
              <Input
                type="date"
                value={data.dateCompleted}
                onChange={(e) =>
                  updateSectionData("residentInfo", { dateCompleted: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-700">Date of Discharge/Transfer (if applicable)</Label>
              <Input
                type="date"
                value={data.dateDischarge}
                onChange={(e) =>
                  updateSectionData("residentInfo", { dateDischarge: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500 max-w-xs"
              />
            </div>
          </div>
        </div>

        {/* Resident Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            Resident Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">
                Resident Name
                {resident?.firstName && <AutoFillHint />}
              </Label>
              <Input
                value={`${data.firstName} ${data.lastName}`.trim()}
                readOnly
                className="mt-1 bg-gray-50 border-gray-300 text-gray-700"
              />
            </div>
            <div>
              <Label className="text-gray-700">Pronouns</Label>
              <select
                value={data.pronouns}
                onChange={(e) =>
                  updateSectionData("residentInfo", { pronouns: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-teal-500 focus:ring-teal-500 focus:outline-none text-sm"
              >
                <option value="">Select pronouns</option>
                <option value="He/Him">He/Him</option>
                <option value="She/Her">She/Her</option>
                <option value="They/Them">They/Them</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-700">
                Date of Birth
                {resident?.dateOfBirth && <AutoFillHint />}
              </Label>
              <Input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) =>
                  updateSectionData("residentInfo", { dateOfBirth: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <Label className="text-gray-700">Age</Label>
              <Input
                value={calculateAge(data.dateOfBirth)}
                readOnly
                className="mt-1 bg-gray-50 border-gray-300 text-gray-700"
                placeholder="Calculated from DOB"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Primary Language
                {resident?.primaryLanguage && <AutoFillHint />}
              </Label>
              <Input
                value={data.primaryLanguage}
                onChange={(e) =>
                  updateSectionData("residentInfo", { primaryLanguage: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                placeholder="e.g., English, Spanish"
              />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="speaksEnglish"
                  checked={data.speaksEnglish}
                  onCheckedChange={(checked) =>
                    updateSectionData("residentInfo", { speaksEnglish: checked === true })
                  }
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <Label htmlFor="speaksEnglish" className="text-gray-700 cursor-pointer">
                  Speaks English
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="interpreterNeeded"
                  checked={data.interpreterNeeded}
                  onCheckedChange={(checked) =>
                    updateSectionData("residentInfo", { interpreterNeeded: checked === true })
                  }
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <Label htmlFor="interpreterNeeded" className="text-gray-700 cursor-pointer">
                  Interpreter Needed
                </Label>
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-gray-700">
                Allergies
                {resident?.allergies && <AutoFillHint />}
              </Label>
              <Textarea
                value={data.allergies}
                onChange={(e) =>
                  updateSectionData("residentInfo", { allergies: e.target.value })
                }
                className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                placeholder="List all known allergies (medications, food, environmental)"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Legal Documents */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Legal Documents on File
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "powerOfAttorney", label: "Power of Attorney" },
              { key: "guardian", label: "Guardian" },
              { key: "healthcareDirective", label: "Healthcare Directive" },
              { key: "polst", label: "POLST" },
              { key: "dnr", label: "DNR" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`legal-${key}`}
                  checked={(data.legalDocuments as any)[key]}
                  onCheckedChange={(checked) =>
                    updateSectionData("residentInfo", {
                      legalDocuments: {
                        ...data.legalDocuments,
                        [key]: checked === true,
                      },
                    })
                  }
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <Label htmlFor={`legal-${key}`} className="text-gray-700 cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Checkbox
                id="legal-other"
                checked={data.legalDocuments.other}
                onCheckedChange={(checked) =>
                  updateSectionData("residentInfo", {
                    legalDocuments: {
                      ...data.legalDocuments,
                      other: checked === true,
                    },
                  })
                }
                className="border-gray-300 data-[state=checked]:bg-teal-600"
              />
              <Label htmlFor="legal-other" className="text-gray-700 cursor-pointer">
                Other
              </Label>
            </div>
          </div>
          {data.legalDocuments.other && (
            <div className="mt-3">
              <Input
                value={data.legalDocuments.otherText}
                onChange={(e) =>
                  updateSectionData("residentInfo", {
                    legalDocuments: {
                      ...data.legalDocuments,
                      otherText: e.target.value,
                    },
                  })
                }
                className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                placeholder="Please specify other legal documents"
              />
            </div>
          )}
        </div>

        {/* Specialty Needs */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-teal-600" />
            Specialty Needs
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "dialysis", label: "Dialysis" },
              { key: "hospice", label: "Hospice" },
              { key: "behavioralHealth", label: "Behavioral Health" },
              { key: "memoryCare", label: "Memory Care" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`specialty-${key}`}
                  checked={(data.specialtyNeeds as any)[key]}
                  onCheckedChange={(checked) =>
                    updateSectionData("residentInfo", {
                      specialtyNeeds: {
                        ...data.specialtyNeeds,
                        [key]: checked === true,
                      },
                    })
                  }
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <Label htmlFor={`specialty-${key}`} className="text-gray-700 cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Checkbox
                id="specialty-other"
                checked={data.specialtyNeeds.other}
                onCheckedChange={(checked) =>
                  updateSectionData("residentInfo", {
                    specialtyNeeds: {
                      ...data.specialtyNeeds,
                      other: checked === true,
                    },
                  })
                }
                className="border-gray-300 data-[state=checked]:bg-teal-600"
              />
              <Label htmlFor="specialty-other" className="text-gray-700 cursor-pointer">
                Other
              </Label>
            </div>
          </div>
          {data.specialtyNeeds.other && (
            <div className="mt-3">
              <Input
                value={data.specialtyNeeds.otherText}
                onChange={(e) =>
                  updateSectionData("residentInfo", {
                    specialtyNeeds: {
                      ...data.specialtyNeeds,
                      otherText: e.target.value,
                    },
                  })
                }
                className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                placeholder="Please specify other specialty needs"
              />
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Auto-filled Information</p>
            <p className="text-blue-700 mt-1">
              Fields marked with "(Auto-filled)" have been pre-populated from the resident's profile.
              You can edit these values if needed.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Relationship options for emergency contacts
  const RELATIONSHIP_OPTIONS = [
    "Family",
    "Case Manager",
    "DPOA",
    "Guardian",
    "Physician",
    "Pharmacy",
    "Hospice",
    "Other",
  ];

  // Helper to create empty contact
  const createEmptyContact = () => ({
    name: "",
    relationship: "",
    homePhone: "",
    cellPhone: "",
    fax: "",
    email: "",
    address: "",
    preferredContact: "cell" as "home" | "cell" | "email",
  });

  // Add a new contact
  const addContact = () => {
    const contacts = formData.emergencyContacts.contacts;
    if (contacts.length >= 6) return;

    setFormData((prev) => ({
      ...prev,
      emergencyContacts: {
        contacts: [...prev.emergencyContacts.contacts, createEmptyContact()],
      },
    }));
  };

  // Remove a contact by index
  const removeContact = (index: number) => {
    if (index === 0) return; // Can't remove first contact

    setFormData((prev) => ({
      ...prev,
      emergencyContacts: {
        contacts: prev.emergencyContacts.contacts.filter((_, i) => i !== index),
      },
    }));
  };

  // Update a specific contact field
  const updateContact = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: {
        contacts: prev.emergencyContacts.contacts.map((contact, i) =>
          i === index ? { ...contact, [field]: value } : contact
        ),
      },
    }));
  };

  // Render Section 2: Emergency Contacts
  const renderEmergencyContactsSection = () => {
    const contacts = formData.emergencyContacts.contacts;
    const hasAutoFilledContacts = resident?.emergencyContacts && resident.emergencyContacts.length > 0;

    return (
      <div className="space-y-6">
        {/* Section description */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Phone className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium">Care Planning Contacts</p>
            <p className="text-gray-600 mt-1">
              Add up to 6 contacts for care planning purposes. Include case managers,
              healthcare providers, pharmacies, and family members who should be
              contacted regarding the resident's care.
            </p>
          </div>
        </div>

        {/* Auto-fill notice */}
        {hasAutoFilledContacts && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Auto-filled from Resident Profile</p>
              <p className="text-blue-700 mt-1">
                Emergency contacts have been pre-populated from the resident's profile.
                You can edit or add additional contacts as needed.
              </p>
            </div>
          </div>
        )}

        {/* Contact Cards */}
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* Contact Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-700">
                  Contact {index + 1}
                  {contact.name && ` - ${contact.name}`}
                </span>
                {index === 0 && hasAutoFilledContacts && (
                  <span className="text-xs text-teal-600 ml-2">(Auto-filled)</span>
                )}
              </div>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>

            {/* Contact Form */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <Label className="text-gray-700">Name</Label>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(index, "name", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Full name"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <Label className="text-gray-700">Relationship</Label>
                  <select
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, "relationship", e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-teal-500 focus:ring-teal-500 focus:outline-none text-sm"
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Home Phone */}
                <div>
                  <Label className="text-gray-700">Home Phone</Label>
                  <Input
                    value={contact.homePhone}
                    onChange={(e) => updateContact(index, "homePhone", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="(555) 555-5555"
                  />
                </div>

                {/* Cell Phone */}
                <div>
                  <Label className="text-gray-700">Cell Phone</Label>
                  <Input
                    value={contact.cellPhone}
                    onChange={(e) => updateContact(index, "cellPhone", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="(555) 555-5555"
                  />
                </div>

                {/* Fax */}
                <div>
                  <Label className="text-gray-700">Fax</Label>
                  <Input
                    value={contact.fax}
                    onChange={(e) => updateContact(index, "fax", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="(555) 555-5555"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-gray-700">Email</Label>
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, "email", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Address - Full width */}
                <div className="col-span-2">
                  <Label className="text-gray-700">Address</Label>
                  <Input
                    value={contact.address}
                    onChange={(e) => updateContact(index, "address", e.target.value)}
                    className="mt-1 bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Street, City, State, ZIP"
                  />
                </div>

                {/* Preferred Contact Method - Full width */}
                <div className="col-span-2">
                  <Label className="text-gray-700 mb-2 block">Preferred Contact Method</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`preferredContact-${index}`}
                        value="home"
                        checked={contact.preferredContact === "home"}
                        onChange={() => updateContact(index, "preferredContact", "home")}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Home</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`preferredContact-${index}`}
                        value="cell"
                        checked={contact.preferredContact === "cell"}
                        onChange={() => updateContact(index, "preferredContact", "cell")}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Cell</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`preferredContact-${index}`}
                        value="email"
                        checked={contact.preferredContact === "email"}
                        onChange={() => updateContact(index, "preferredContact", "email")}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Email</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Contact Button */}
        {contacts.length < 6 && (
          <Button
            type="button"
            variant="outline"
            onClick={addContact}
            className="w-full border-dashed border-gray-300 text-gray-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Contact ({contacts.length}/6)
          </Button>
        )}

        {/* Max contacts notice */}
        {contacts.length >= 6 && (
          <div className="text-center text-sm text-gray-500 py-2">
            Maximum of 6 contacts reached
          </div>
        )}
      </div>
    );
  };

  // Render section content
  const renderSectionContent = () => {
    const section = NCP_SECTIONS.find((s) => s.id === currentSection);
    if (!section) return null;

    // Section 1: Resident Information
    if (currentSection === 1) {
      return renderResidentInfoSection();
    }

    // Section 2: Emergency Contacts
    if (currentSection === 2) {
      return renderEmergencyContactsSection();
    }

    // Placeholder for other sections
    return (
      <div className="space-y-6">
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <section.icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {section.title}
          </h3>
          <p className="text-gray-500 text-sm">
            Section {section.id} of {NCP_SECTIONS.length}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Form fields will be added here
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <span className="font-semibold text-gray-900">
                Negotiated Care Plan (NCP)
              </span>
              {residentId && resident && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {resident.firstName} {resident.lastName}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <div className="text-sm font-medium text-gray-900">
                {completionPercentage}% Complete
              </div>
              <div className="text-xs text-gray-500">
                Section {currentSection} of {NCP_SECTIONS.length}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-2 border-gray-300"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-4">
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Section Navigation */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Sections
            </h3>
            <nav className="space-y-1">
              {NCP_SECTIONS.map((section) => {
                const isActive = section.id === currentSection;
                const isCompleted = completedSections.has(section.id);
                const SectionIcon = section.icon;

                return (
                  <button
                    key={section.id}
                    onClick={() => goToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-100 text-green-600"
                          : isActive
                          ? "bg-teal-100 text-teal-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-xs font-medium">{section.id}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${
                          isActive ? "text-teal-700" : "text-gray-700"
                        }`}
                      >
                        {section.title}
                      </div>
                    </div>
                    {isCompleted && !isActive && (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {currentSectionInfo && (
                    <div className="p-2 bg-teal-50 rounded-lg">
                      <currentSectionInfo.icon className="h-5 w-5 text-teal-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-gray-900">
                      {currentSectionInfo?.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Section {currentSection} of {NCP_SECTIONS.length}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {renderSectionContent()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goPrevious}
                disabled={currentSection === 1}
                className="gap-2 border-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                {completedSections.size} of {NCP_SECTIONS.length} sections
                completed
              </div>

              {currentSection === NCP_SECTIONS.length ? (
                <Button
                  onClick={() => {
                    // Mark last section complete and submit
                    setCompletedSections(
                      (prev) => new Set(prev).add(currentSection)
                    );
                    toast({ title: "Form completed!" });
                    onComplete?.();
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-500"
                >
                  <Check className="h-4 w-4" />
                  Complete Form
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  className="gap-2 bg-teal-600 hover:bg-teal-500"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
