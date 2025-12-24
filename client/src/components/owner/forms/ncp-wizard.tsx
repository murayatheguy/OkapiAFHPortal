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
  Printer,
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
  // Section 3: Emergency Evacuation
  evacuation: {
    evacuationAssistance: "" as "" | "independent" | "assistance_required",
    independentDescription: "",
    assistanceDescription: "",
    evacuationInstructions: "",
    mobilityAids: {
      wheelchair: false,
      walker: false,
      cane: false,
      none: false,
    },
    evacuationNotes: "",
  },
  // Section 4: Communication
  communication: {
    // Speech/Hearing/Vision
    expressionProblems: "" as "" | "yes" | "no",
    expressionDescription: "",
    expressionEquipment: "",
    hearingProblems: "" as "" | "yes" | "no",
    hearingDescription: "",
    hearingEquipment: "",
    visionProblems: "" as "" | "yes" | "no",
    visionDescription: "",
    visionEquipment: "",
    // Phone Use
    phoneAbility: "" as "" | "independent" | "assistance" | "dependent",
    hasOwnPhone: false,
    phoneNumber: "",
    // Language
    preferredLanguage: "",
    communicationNotes: "",
    // Strengths & Assistance
    communicationStrengths: "",
    communicationAssistance: "",
  },
  // Section 5: Medication Management
  medication: {
    // Overview
    hasMedicationAllergies: false,
    medicationAllergies: "",
    needsMultipleMedAssistance: false,
    hasPsychMedications: false,
    medsOrderedBy: "",
    medsDeliveredBy: "",
    medsPharmacyPacked: false,
    pharmacyName: "",
    // Medication Level
    medicationLevel: "" as "" | "self_administration" | "self_with_assistance" | "full_administration",
    medicationLevelReason: "",
    // Medication Types
    medTypes: {
      oral: false,
      topical: false,
      eyeDrops: false,
      inhalers: false,
      sprays: false,
      injections: false,
      allergyKits: false,
      suppositories: false,
      other: false,
    },
    injectionAdministeredBy: "" as "" | "resident" | "surrogate" | "family" | "licensed" | "nurse_delegation",
    medTypeOtherText: "",
    // Nurse Delegation
    requiresNurseDelegation: false,
    rnDelegatorName: "",
    rnDelegatorPhone: "",
    rnDelegatorFax: "",
    rnDelegatorEmail: "",
    // Plans
    medicationPlanWhenAway: "",
    medicationRefusalPlan: "",
  },
  // Section 6: Health Indicators
  healthIndicators: {
    // Monitoring
    painIssues: false,
    painDescription: "",
    painImpact: "",
    weightIssues: false,
    currentWeight: "",
    currentHeight: "",
    vitalSignsMonitoring: false,
    vitalSignsFrequency: "",
    recentHospitalization: false,
    hospitalizationDetails: "",
    otherHealthIndicators: "",
    // Allergies Table
    allergies: [] as Array<{ substance: string; reaction: string }>,
    // Monitoring Instructions
    healthMonitoringStrengths: "",
    healthMonitoringAssistance: "",
  },
  // Section 7: Treatments & Therapies
  treatments: {
    // Treatments
    oxygenUse: false,
    oxygenVendor: "",
    dialysis: false,
    dialysisProvider: "",
    bloodThinners: false,
    inrLabProvider: "",
    easilyBruised: false,
    bloodGlucoseMonitoring: false,
    injections: false,
    cpapBipap: false,
    nebulizer: false,
    rangeOfMotion: false,
    ptOtSt: false,
    nurseDelegationTreatments: false,
    nurseDelegationTasks: "",
    otherTreatments: "",
    // Programs
    homeHealth: false,
    homeHealthAgency: "",
    adultDayHealth: false,
    hospice: false,
    hospiceAgency: "",
    hospicePlan: false,
    otherPrograms: "",
    // Enablers
    physicalEnablers: "",
    enablersAssistance: "",
    // Refusal Plan
    treatmentRefusalPlan: "",
  },
  // Section 8: Psych/Social/Cognitive
  psychSocial: {
    // Sleep
    sleepDisturbance: false,
    sleepDescription: "",
    nighttimeAssistance: false,
    nighttimeAssistanceDescription: "",
    // Memory
    shortTermMemoryIssues: false,
    longTermMemoryIssues: false,
    orientedToPerson: false,
    // Behaviors
    behaviors: {
      impairedDecisionMaking: false,
      disruptiveBehavior: false,
      assaultive: false,
      resistiveToCare: false,
      depression: false,
      anxiety: false,
      irritability: false,
      disorientation: false,
      wanderingPacing: false,
      exitSeeking: false,
      hallucinations: false,
      delusions: false,
      verballyAgitated: false,
      physicallyAgitated: false,
      inappropriateBehavior: false,
      suicidalIdeation: false,
      difficultyNewSituations: false,
      disrobing: false,
      weepingCrying: false,
      unawareOfConsequences: false,
      unrealisticFears: false,
      inappropriateSpitting: false,
      breaksThrowsThings: false,
    },
    behaviorDescriptions: {} as Record<string, string>,
    otherBehaviors: "",
    // Psych Medications
    requiresPsychMedications: false,
    psychMedicationSymptoms: "",
    behavioralHealthCrisisPlan: false,
    counseling: false,
    mentalHealthProvider: "",
    pastBehaviors: "",
    // DSHS Programs
    meaningfulDay: false,
    expandedCommunityServices: false,
    specializedBehaviorServices: false,
    mhProviderProgram: false,
    mhProviderContact: "",
    // Narrative
    typicalDayNarrative: "",
    // Strengths/Assistance
    psychSocialStrengths: "",
    psychSocialAssistance: "",
  },
  // Section 9: Activities of Daily Living (ADLs)
  adls: {
    functionalLimitations: "",
    // Ambulation/Mobility
    ambulation: {
      inRoomLevel: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      outsideLevel: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      fallRisk: false,
      fallPreventionPlan: "",
      bedroomDoorLock: false,
      equipment: "",
      vendor: "",
      strengths: "",
      assistance: "",
    },
    // Bed Mobility/Transfer
    bedMobility: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      skinCareNeeded: false,
      turningRepositioning: false,
      turningFrequency: "",
      bedFallRisk: false,
      safetyPlan: "",
      devices: { hoyerLift: false, transferPole: false, other: false },
      devicesOther: "",
      nighttimeCareNeeds: false,
      strengths: "",
      assistance: "",
    },
    // Eating
    eating: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      specialDiet: "",
      eatingHabits: "",
      foodAllergies: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Toileting/Continence
    toileting: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      frequency: "",
      bladderIncontinence: false,
      bowelIncontinence: false,
      incontinenceSkinCare: false,
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Dressing
    dressing: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Personal Hygiene
    hygiene: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      teethType: "" as "" | "own" | "partials" | "dentures",
      oralHygiene: { flossing: false, brushing: false, soaking: false },
      hairCare: false,
      mensesCare: false,
      frequency: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Bathing
    bathing: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      frequency: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Foot Care
    footCare: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      frequency: "",
      diabeticFootCare: false,
      nailCare: false,
      homeHealth: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Skin Care
    skinCare: {
      level: "" as "" | "independent" | "supervision" | "assistance" | "dependent",
      frequency: "",
      skinProblems: false,
      skinProblemsDescription: "",
      pressureInjuries: false,
      pressureInjuriesDescription: "",
      dressingChanges: false,
      dressingChangesFrequency: "",
      dressingNurseDelegated: false,
      homeHealth: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
  },
  // Section 10: Instrumental ADLs (IADLs)
  iadls: {
    // Managing Finances
    finances: {
      level: "" as "" | "independent" | "assistance" | "dependent",
      whoManagesFinances: "",
      whoManagesRecords: "",
      payeeName: "",
      payeeContact: "",
      strengths: "",
      assistance: "",
    },
    // Shopping
    shopping: {
      level: "" as "" | "independent" | "assistance" | "dependent",
      transportNeeds: "",
      frequency: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Transportation
    transportation: {
      level: "" as "" | "independent" | "assistance" | "dependent",
      medicalTransportNeeds: "",
      specialTransportNeeds: "",
      escortRequired: false,
      frequency: "",
      equipment: "",
      strengths: "",
      assistance: "",
    },
    // Activities/Social
    activities: {
      level: "" as "" | "independent" | "assistance" | "dependent",
      interests: "",
      socialCulturalPreferences: "",
      familyFriendsRelationships: "",
      employmentSupport: "",
      clubsGroupsDayHealth: "",
      specialArrangements: "",
      participationIssues: "",
      strengths: "",
      assistance: "",
    },
    // Activity Preferences
    activityPreferences: {
      reading: false,
      audioBooks: false,
      storytelling: false,
      phoneConversations: false,
      reminiscing: false,
      currentEvents: false,
      discussionGroup: false,
      bibleStudyChurch: false,
      visitors: false,
      gardening: false,
      outingsWithFamily: false,
      visitingZoosParks: false,
      petsAnimals: false,
      exercisesROM: false,
      therapeuticWalking: false,
      cookingBaking: false,
      houseChores: false,
      watchingTVMovies: false,
      partiesGatherings: false,
      artsCrafts: false,
      tableGamesBingoCardsPuzzles: false,
      beautyTime: false,
      musicSinging: false,
      employmentSupportActivity: false,
      communityIntegration: false,
      other: false,
    },
    activityPreferencesOther: "",
    activityNarrative: "",
    // Smoking
    smoking: {
      residentSmokes: false,
      safetyConcerns: "",
      policyReviewed: false,
      cigaretteLighterStorage: "",
    },
    // Case Management
    caseManagement: {
      receivesCaseManagement: false,
      caseManagerName: "",
      caseManagerAgency: "",
      caseManagerPhone: "",
      caseManagerEmail: "",
      caseManagerFax: "",
    },
    // Other Issues
    otherIssuesConcerns: "",
  },
  // Section 11: Review & Signatures
  signatures: {
    // NCP Review Info
    ncpReviewInfo: "The NCP will be reviewed and updated at least annually, or when there is a significant change in the resident's condition.",
    residentParticipation: "",
    // Involved in NCP Development
    involved: {
      resident: false,
      residentRep: false,
      parent: false,
      healthProfessional: false,
      other1: false,
      other1Name: "",
      other2: false,
      other2Name: "",
      other3: false,
      other3Name: "",
    },
    // Dates
    dateOfOriginalPlan: "",
    reviewDates: "",
    // Final Actions
    ncpSentToCM: false,
    ncpSentToCMDate: "",
    residentVerballyAgreed: false,
    residentVerballyAgreedDate: "",
    residentRecommendations: "",
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
          medicationAllergies: allergiesText,
          hasMedicationAllergies: allergiesText.length > 0,
          pharmacyName: resident.pharmacyName || "",
        },
        communication: {
          ...prev.communication,
          preferredLanguage: resident.primaryLanguage || "",
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

  // Section 3: Emergency Evacuation
  const renderEvacuationSection = () => {
    const data = formData.evacuation;
    return (
      <div className="space-y-6">
        {/* Evacuation Assistance Level */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Evacuation Capability
          </h4>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-teal-300">
              <input
                type="radio"
                name="evacuationAssistance"
                value="independent"
                checked={data.evacuationAssistance === "independent"}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  evacuation: { ...prev.evacuation, evacuationAssistance: "independent" }
                }))}
                className="mt-1 w-4 h-4 text-teal-600"
              />
              <div>
                <span className="font-medium text-gray-700">Independent</span>
                <p className="text-sm text-gray-500">Resident can evacuate independently without physical assistance</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-teal-300">
              <input
                type="radio"
                name="evacuationAssistance"
                value="assistance_required"
                checked={data.evacuationAssistance === "assistance_required"}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  evacuation: { ...prev.evacuation, evacuationAssistance: "assistance_required" }
                }))}
                className="mt-1 w-4 h-4 text-teal-600"
              />
              <div>
                <span className="font-medium text-gray-700">Assistance Required</span>
                <p className="text-sm text-gray-500">Resident requires physical assistance to evacuate safely</p>
              </div>
            </label>
          </div>
        </div>

        {/* Independent Description */}
        {data.evacuationAssistance === "independent" && (
          <div>
            <Label className="text-gray-700">Independent Evacuation Description</Label>
            <Textarea
              value={data.independentDescription}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                evacuation: { ...prev.evacuation, independentDescription: e.target.value }
              }))}
              className="mt-1 bg-white border-gray-300"
              placeholder="Resident is physically and mentally capable of independently evacuating..."
              rows={3}
            />
          </div>
        )}

        {/* Assistance Description */}
        {data.evacuationAssistance === "assistance_required" && (
          <div>
            <Label className="text-gray-700">Assistance Required Description</Label>
            <Textarea
              value={data.assistanceDescription}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                evacuation: { ...prev.evacuation, assistanceDescription: e.target.value }
              }))}
              className="mt-1 bg-white border-gray-300"
              placeholder="Describe what assistance is needed for safe evacuation..."
              rows={3}
            />
          </div>
        )}

        {/* Evacuation Instructions */}
        <div>
          <Label className="text-gray-700">Evacuation Instructions</Label>
          <Textarea
            value={data.evacuationInstructions}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              evacuation: { ...prev.evacuation, evacuationInstructions: e.target.value }
            }))}
            className="mt-1 bg-white border-gray-300"
            placeholder="Caregiver will..."
            rows={3}
          />
        </div>

        {/* Mobility Aids */}
        <div>
          <Label className="text-gray-700 mb-3 block">Mobility Aids Used</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "wheelchair", label: "Wheelchair" },
              { key: "walker", label: "Walker" },
              { key: "cane", label: "Cane" },
              { key: "none", label: "None" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={(data.mobilityAids as any)[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    evacuation: {
                      ...prev.evacuation,
                      mobilityAids: { ...prev.evacuation.mobilityAids, [key]: checked === true }
                    }
                  }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Evacuation Notes */}
        <div>
          <Label className="text-gray-700">Additional Evacuation Notes</Label>
          <Textarea
            value={data.evacuationNotes}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              evacuation: { ...prev.evacuation, evacuationNotes: e.target.value }
            }))}
            className="mt-1 bg-white border-gray-300"
            placeholder="Any other important evacuation information..."
            rows={3}
          />
        </div>
      </div>
    );
  };

  // Section 4: Communication
  const renderCommunicationSection = () => {
    const data = formData.communication;

    const renderYesNoRadio = (field: string, value: string, onChange: (val: string) => void) => (
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={field} value="yes" checked={value === "yes"}
            onChange={() => onChange("yes")} className="w-4 h-4 text-teal-600" />
          <span className="text-gray-700">Yes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={field} value="no" checked={value === "no"}
            onChange={() => onChange("no")} className="w-4 h-4 text-teal-600" />
          <span className="text-gray-700">No</span>
        </label>
      </div>
    );

    return (
      <div className="space-y-8">
        {/* Speech/Expression */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Speech & Expression
          </h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Does resident have problems with expression?</Label>
              {renderYesNoRadio("expression", data.expressionProblems, (val) =>
                setFormData(prev => ({ ...prev, communication: { ...prev.communication, expressionProblems: val as any } }))
              )}
            </div>
            {data.expressionProblems === "yes" && (
              <>
                <div>
                  <Label className="text-gray-700">Description</Label>
                  <Textarea value={data.expressionDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, expressionDescription: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" rows={2} />
                </div>
                <div>
                  <Label className="text-gray-700">Equipment/Aids Used</Label>
                  <Input value={data.expressionEquipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, expressionEquipment: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" placeholder="e.g., communication board" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hearing */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Hearing</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Does resident have hearing problems?</Label>
              {renderYesNoRadio("hearing", data.hearingProblems, (val) =>
                setFormData(prev => ({ ...prev, communication: { ...prev.communication, hearingProblems: val as any } }))
              )}
            </div>
            {data.hearingProblems === "yes" && (
              <>
                <div>
                  <Label className="text-gray-700">Description</Label>
                  <Textarea value={data.hearingDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, hearingDescription: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" rows={2} />
                </div>
                <div>
                  <Label className="text-gray-700">Equipment/Aids Used</Label>
                  <Input value={data.hearingEquipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, hearingEquipment: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" placeholder="e.g., hearing aids" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vision */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Vision</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Does resident have vision problems?</Label>
              {renderYesNoRadio("vision", data.visionProblems, (val) =>
                setFormData(prev => ({ ...prev, communication: { ...prev.communication, visionProblems: val as any } }))
              )}
            </div>
            {data.visionProblems === "yes" && (
              <>
                <div>
                  <Label className="text-gray-700">Description</Label>
                  <Textarea value={data.visionDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, visionDescription: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" rows={2} />
                </div>
                <div>
                  <Label className="text-gray-700">Equipment/Aids Used</Label>
                  <Input value={data.visionEquipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, visionEquipment: e.target.value } }))}
                    className="mt-1 bg-white border-gray-300" placeholder="e.g., glasses, magnifier" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Phone Use */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Phone Use</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Phone Ability</Label>
              <div className="flex flex-wrap gap-4">
                {["independent", "assistance", "dependent"].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="phoneAbility" value={level}
                      checked={data.phoneAbility === level}
                      onChange={() => setFormData(prev => ({ ...prev, communication: { ...prev.communication, phoneAbility: level as any } }))}
                      className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700 capitalize">{level === "assistance" ? "Assistance Needed" : level}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hasOwnPhone}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, hasOwnPhone: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Has Own Phone</span>
              </label>
              <div>
                <Input value={data.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, phoneNumber: e.target.value } }))}
                  className="bg-white border-gray-300" placeholder="Phone number" />
              </div>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700">Preferred Language</Label>
            <Input value={data.preferredLanguage}
              onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, preferredLanguage: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="e.g., English, Spanish" />
          </div>
        </div>

        {/* Communication Notes */}
        <div>
          <Label className="text-gray-700">Communication Notes</Label>
          <Textarea value={data.communicationNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, communicationNotes: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" rows={2} />
        </div>

        {/* Strengths & Assistance */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-gray-700">Communication Strengths</Label>
            <Textarea value={data.communicationStrengths}
              onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, communicationStrengths: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="How resident makes self understood..." rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Caregiver Assistance</Label>
            <Textarea value={data.communicationAssistance}
              onChange={(e) => setFormData(prev => ({ ...prev, communication: { ...prev.communication, communicationAssistance: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="Caregiver will..." rows={2} />
          </div>
        </div>
      </div>
    );
  };

  // Section 5: Medication Management
  const renderMedicationSection = () => {
    const data = formData.medication;
    return (
      <div className="space-y-8">
        {/* Overview */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Medication Overview</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hasMedicationAllergies}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, hasMedicationAllergies: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Has Medication Allergies</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hasPsychMedications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, hasPsychMedications: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Has Psych Medications</span>
              </label>
            </div>
            {data.hasMedicationAllergies && (
              <div>
                <Label className="text-gray-700">Medication Allergies</Label>
                <Textarea value={data.medicationAllergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medicationAllergies: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Medications Ordered By</Label>
                <Input value={data.medsOrderedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medsOrderedBy: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Medications Delivered By</Label>
                <Input value={data.medsDeliveredBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medsDeliveredBy: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.medsPharmacyPacked}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medsPharmacyPacked: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Pharmacy Packed</span>
              </label>
              <div>
                <Label className="text-gray-700">Pharmacy Name</Label>
                <Input value={data.pharmacyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, pharmacyName: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Medication Level */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Medication Administration Level</h4>
          <div className="space-y-3">
            {[
              { value: "self_administration", label: "Self-Administration", desc: "Resident manages own medications" },
              { value: "self_with_assistance", label: "Self-Administration with Assistance", desc: "Resident takes meds with reminders/setup" },
              { value: "full_administration", label: "Full Administration", desc: "Caregiver administers all medications" },
            ].map(({ value, label, desc }) => (
              <label key={value} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-teal-300">
                <input type="radio" name="medicationLevel" value={value}
                  checked={data.medicationLevel === value}
                  onChange={() => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medicationLevel: value as any } }))}
                  className="mt-1 w-4 h-4 text-teal-600" />
                <div>
                  <span className="font-medium text-gray-700">{label}</span>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Label className="text-gray-700">Reason for Medication Level</Label>
            <Textarea value={data.medicationLevelReason}
              onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medicationLevelReason: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
        </div>

        {/* Medication Types */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Medication Types</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "oral", label: "Oral" },
              { key: "topical", label: "Topical" },
              { key: "eyeDrops", label: "Eye Drops" },
              { key: "inhalers", label: "Inhalers" },
              { key: "sprays", label: "Sprays" },
              { key: "injections", label: "Injections" },
              { key: "allergyKits", label: "Allergy Kits" },
              { key: "suppositories", label: "Suppositories" },
              { key: "other", label: "Other" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={(data.medTypes as any)[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev, medication: { ...prev.medication, medTypes: { ...prev.medication.medTypes, [key]: checked === true } }
                  }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          {data.medTypes.injections && (
            <div className="mt-4">
              <Label className="text-gray-700">Injections Administered By</Label>
              <select value={data.injectionAdministeredBy}
                onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, injectionAdministeredBy: e.target.value as any } }))}
                className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                <option value="">Select...</option>
                <option value="resident">Resident</option>
                <option value="surrogate">Surrogate</option>
                <option value="family">Family</option>
                <option value="licensed">Licensed Professional</option>
                <option value="nurse_delegation">Qualified CG (Nurse Delegation)</option>
              </select>
            </div>
          )}
          {data.medTypes.other && (
            <div className="mt-4">
              <Label className="text-gray-700">Other Medication Types</Label>
              <Input value={data.medTypeOtherText}
                onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medTypeOtherText: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
          )}
        </div>

        {/* Nurse Delegation */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox checked={data.requiresNurseDelegation}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, requiresNurseDelegation: checked === true } }))}
              className="border-gray-300 data-[state=checked]:bg-teal-600" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Requires Nurse Delegation</h4>
          </div>
          {data.requiresNurseDelegation && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">RN Delegator Name</Label>
                <Input value={data.rnDelegatorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, rnDelegatorName: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">RN Phone</Label>
                <Input value={data.rnDelegatorPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, rnDelegatorPhone: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">RN Fax</Label>
                <Input value={data.rnDelegatorFax}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, rnDelegatorFax: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">RN Email</Label>
                <Input value={data.rnDelegatorEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, rnDelegatorEmail: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-4">
          <div>
            <Label className="text-gray-700">Medication Plan When Away</Label>
            <Textarea value={data.medicationPlanWhenAway}
              onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medicationPlanWhenAway: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="Plan when resident is not in the AFH..." rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Medication Refusal Plan</Label>
            <Textarea value={data.medicationRefusalPlan}
              onChange={(e) => setFormData(prev => ({ ...prev, medication: { ...prev.medication, medicationRefusalPlan: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="What to do if resident refuses medication..." rows={2} />
          </div>
        </div>
      </div>
    );
  };

  // Section 6: Health Indicators
  const renderHealthIndicatorsSection = () => {
    const data = formData.healthIndicators;

    const addAllergy = () => {
      setFormData(prev => ({
        ...prev,
        healthIndicators: {
          ...prev.healthIndicators,
          allergies: [...prev.healthIndicators.allergies, { substance: "", reaction: "" }]
        }
      }));
    };

    const removeAllergy = (index: number) => {
      setFormData(prev => ({
        ...prev,
        healthIndicators: {
          ...prev.healthIndicators,
          allergies: prev.healthIndicators.allergies.filter((_, i) => i !== index)
        }
      }));
    };

    const updateAllergy = (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        healthIndicators: {
          ...prev.healthIndicators,
          allergies: prev.healthIndicators.allergies.map((a, i) =>
            i === index ? { ...a, [field]: value } : a
          )
        }
      }));
    };

    return (
      <div className="space-y-6">
        {/* Pain */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox checked={data.painIssues}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, painIssues: checked === true } }))}
              className="border-gray-300 data-[state=checked]:bg-teal-600" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pain Issues</h4>
          </div>
          {data.painIssues && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Pain Description</Label>
                <Textarea value={data.painDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, painDescription: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
              <div>
                <Label className="text-gray-700">Impact on Daily Activities</Label>
                <Textarea value={data.painImpact}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, painImpact: e.target.value } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
            </div>
          )}
        </div>

        {/* Weight & Vitals */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Weight & Vital Signs</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">Current Weight (lbs)</Label>
              <Input value={data.currentWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, currentWeight: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
            <div>
              <Label className="text-gray-700">Current Height</Label>
              <Input value={data.currentHeight}
                onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, currentHeight: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <Checkbox checked={data.weightIssues}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, weightIssues: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Weight Issues (gain/loss concerns)</span>
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.vitalSignsMonitoring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, vitalSignsMonitoring: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Vital Signs Monitoring Required</span>
            </label>
            {data.vitalSignsMonitoring && (
              <div>
                <Input value={data.vitalSignsFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, vitalSignsFrequency: e.target.value } }))}
                  className="bg-white border-gray-300" placeholder="Frequency (e.g., daily)" />
              </div>
            )}
          </div>
        </div>

        {/* Recent Hospitalization */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox checked={data.recentHospitalization}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, recentHospitalization: checked === true } }))}
              className="border-gray-300 data-[state=checked]:bg-teal-600" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Hospitalization</h4>
          </div>
          {data.recentHospitalization && (
            <div>
              <Label className="text-gray-700">Hospitalization Details</Label>
              <Textarea value={data.hospitalizationDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, hospitalizationDetails: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          )}
        </div>

        {/* Allergies Table */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Allergies</h4>
            <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="gap-1">
              <Plus className="h-4 w-4" /> Add Allergy
            </Button>
          </div>
          {data.allergies.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No allergies added</p>
          ) : (
            <div className="space-y-3">
              {data.allergies.map((allergy, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-700 text-xs">Substance</Label>
                      <Input value={allergy.substance}
                        onChange={(e) => updateAllergy(index, "substance", e.target.value)}
                        className="mt-1 bg-white border-gray-300" placeholder="e.g., Penicillin" />
                    </div>
                    <div>
                      <Label className="text-gray-700 text-xs">Reaction</Label>
                      <Input value={allergy.reaction}
                        onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
                        className="mt-1 bg-white border-gray-300" placeholder="e.g., Hives, swelling" />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAllergy(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Health Indicators */}
        <div>
          <Label className="text-gray-700">Other Health Indicators</Label>
          <Textarea value={data.otherHealthIndicators}
            onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, otherHealthIndicators: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" rows={2} />
        </div>

        {/* Strengths & Assistance */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-gray-700">Health Monitoring Strengths</Label>
            <Textarea value={data.healthMonitoringStrengths}
              onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, healthMonitoringStrengths: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Caregiver Assistance</Label>
            <Textarea value={data.healthMonitoringAssistance}
              onChange={(e) => setFormData(prev => ({ ...prev, healthIndicators: { ...prev.healthIndicators, healthMonitoringAssistance: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="Caregiver will report concerns..." rows={2} />
          </div>
        </div>
      </div>
    );
  };

  // Section 7: Treatments & Therapies
  const renderTreatmentsSection = () => {
    const data = formData.treatments;
    return (
      <div className="space-y-6">
        {/* Treatments */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Current Treatments</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "oxygenUse", label: "Oxygen Use", hasField: true, fieldKey: "oxygenVendor", fieldLabel: "Vendor" },
              { key: "dialysis", label: "Dialysis", hasField: true, fieldKey: "dialysisProvider", fieldLabel: "Provider" },
              { key: "bloodThinners", label: "Blood Thinners", hasField: true, fieldKey: "inrLabProvider", fieldLabel: "INR Lab Provider" },
              { key: "bloodGlucoseMonitoring", label: "Blood Glucose Monitoring" },
              { key: "injections", label: "Injections" },
              { key: "cpapBipap", label: "CPAP/BiPAP" },
              { key: "nebulizer", label: "Nebulizer" },
              { key: "rangeOfMotion", label: "Range of Motion Exercises" },
              { key: "ptOtSt", label: "PT/OT/ST" },
              { key: "easilyBruised", label: "Easily Bruised" },
            ].map(({ key, label, hasField, fieldKey, fieldLabel }) => (
              <div key={key} className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={(data as any)[key]}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, [key]: checked === true } }))}
                    className="border-gray-300 data-[state=checked]:bg-teal-600" />
                  <span className="text-gray-700">{label}</span>
                </label>
                {hasField && (data as any)[key] && fieldKey && (
                  <Input value={(data as any)[fieldKey] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, [fieldKey]: e.target.value } }))}
                    className="bg-white border-gray-300 ml-6" placeholder={fieldLabel} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nurse Delegation */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox checked={data.nurseDelegationTreatments}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, nurseDelegationTreatments: checked === true } }))}
              className="border-gray-300 data-[state=checked]:bg-teal-600" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Nurse Delegation Treatments</h4>
          </div>
          {data.nurseDelegationTreatments && (
            <div>
              <Label className="text-gray-700">Nurse Delegation Tasks</Label>
              <Textarea value={data.nurseDelegationTasks}
                onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, nurseDelegationTasks: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          )}
        </div>

        {/* Programs */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Programs</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.homeHealth}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, homeHealth: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Home Health</span>
              </label>
              {data.homeHealth && (
                <Input value={data.homeHealthAgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, homeHealthAgency: e.target.value } }))}
                  className="bg-white border-gray-300" placeholder="Agency name" />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.adultDayHealth}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, adultDayHealth: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Adult Day Health</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hospice}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, hospice: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Hospice</span>
              </label>
              {data.hospice && (
                <Input value={data.hospiceAgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, hospiceAgency: e.target.value } }))}
                  className="bg-white border-gray-300" placeholder="Hospice agency" />
              )}
            </div>
            {data.hospice && (
              <label className="flex items-center gap-2 cursor-pointer ml-6">
                <Checkbox checked={data.hospicePlan}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, hospicePlan: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Hospice Care Plan Attached</span>
              </label>
            )}
          </div>
        </div>

        {/* Other */}
        <div className="space-y-4">
          <div>
            <Label className="text-gray-700">Other Treatments</Label>
            <Textarea value={data.otherTreatments}
              onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, otherTreatments: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Other Programs</Label>
            <Textarea value={data.otherPrograms}
              onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, otherPrograms: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
        </div>

        {/* Enablers */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-gray-700">Physical Enablers</Label>
            <Textarea value={data.physicalEnablers}
              onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, physicalEnablers: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Enablers Assistance</Label>
            <Textarea value={data.enablersAssistance}
              onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, enablersAssistance: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
        </div>

        {/* Refusal Plan */}
        <div>
          <Label className="text-gray-700">Treatment Refusal Plan</Label>
          <Textarea value={data.treatmentRefusalPlan}
            onChange={(e) => setFormData(prev => ({ ...prev, treatments: { ...prev.treatments, treatmentRefusalPlan: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" placeholder="What to do if resident refuses treatment..." rows={2} />
        </div>
      </div>
    );
  };

  // Section 8: Psych/Social/Cognitive
  const renderPsychSocialSection = () => {
    const data = formData.psychSocial;

    const behaviorLabels: Record<string, string> = {
      impairedDecisionMaking: "Impaired Decision Making",
      disruptiveBehavior: "Disruptive Behavior",
      assaultive: "Assaultive",
      resistiveToCare: "Resistive to Care",
      depression: "Depression",
      anxiety: "Anxiety",
      irritability: "Irritability",
      disorientation: "Disorientation",
      wanderingPacing: "Wandering/Pacing",
      exitSeeking: "Exit Seeking",
      hallucinations: "Hallucinations",
      delusions: "Delusions",
      verballyAgitated: "Verbally Agitated",
      physicallyAgitated: "Physically Agitated",
      inappropriateBehavior: "Inappropriate Behavior",
      suicidalIdeation: "Suicidal Ideation",
      difficultyNewSituations: "Difficulty with New Situations",
      disrobing: "Disrobing",
      weepingCrying: "Weeping/Crying",
      unawareOfConsequences: "Unaware of Consequences",
      unrealisticFears: "Unrealistic Fears",
      inappropriateSpitting: "Inappropriate Spitting",
      breaksThrowsThings: "Breaks/Throws Things",
    };

    return (
      <div className="space-y-6">
        {/* Sleep */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Sleep</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.sleepDisturbance}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, sleepDisturbance: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Sleep Disturbance</span>
            </label>
            {data.sleepDisturbance && (
              <Textarea value={data.sleepDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, sleepDescription: e.target.value } }))}
                className="bg-white border-gray-300 ml-6" placeholder="Describe sleep issues..." rows={2} />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.nighttimeAssistance}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, nighttimeAssistance: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Nighttime Assistance Needed</span>
            </label>
            {data.nighttimeAssistance && (
              <Textarea value={data.nighttimeAssistanceDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, nighttimeAssistanceDescription: e.target.value } }))}
                className="bg-white border-gray-300 ml-6" placeholder="Describe assistance needed..." rows={2} />
            )}
          </div>
        </div>

        {/* Memory */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Memory & Orientation</h4>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.shortTermMemoryIssues}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, shortTermMemoryIssues: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Short-Term Memory Issues</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.longTermMemoryIssues}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, longTermMemoryIssues: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Long-Term Memory Issues</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.orientedToPerson}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, orientedToPerson: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Oriented to Person</span>
            </label>
          </div>
        </div>

        {/* Behaviors */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Behaviors (Check All That Apply)</h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(behaviorLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={(data.behaviors as any)[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    psychSocial: {
                      ...prev.psychSocial,
                      behaviors: { ...prev.psychSocial.behaviors, [key]: checked === true }
                    }
                  }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700 text-sm">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Label className="text-gray-700">Other Behaviors</Label>
            <Textarea value={data.otherBehaviors}
              onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, otherBehaviors: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
        </div>

        {/* Psych Medications */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Psychiatric Medications & Support</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.requiresPsychMedications}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, requiresPsychMedications: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Requires Psych Medications</span>
            </label>
            {data.requiresPsychMedications && (
              <Textarea value={data.psychMedicationSymptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, psychMedicationSymptoms: e.target.value } }))}
                className="bg-white border-gray-300 ml-6" placeholder="Symptoms being treated..." rows={2} />
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.behavioralHealthCrisisPlan}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, behavioralHealthCrisisPlan: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Behavioral Health Crisis Plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.counseling}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, counseling: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Receives Counseling</span>
              </label>
            </div>
            <div>
              <Label className="text-gray-700">Mental Health Provider</Label>
              <Input value={data.mentalHealthProvider}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, mentalHealthProvider: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
            <div>
              <Label className="text-gray-700">Past Behaviors</Label>
              <Textarea value={data.pastBehaviors}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, pastBehaviors: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          </div>
        </div>

        {/* DSHS Programs */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">DSHS Programs</h4>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.meaningfulDay}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, meaningfulDay: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Meaningful Day</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.expandedCommunityServices}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, expandedCommunityServices: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Expanded Community Services</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.specializedBehaviorServices}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, specializedBehaviorServices: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Specialized Behavior Services</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.mhProviderProgram}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, mhProviderProgram: checked === true } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">MH Provider Program</span>
            </label>
          </div>
          {data.mhProviderProgram && (
            <div className="mt-4">
              <Label className="text-gray-700">MH Provider Contact</Label>
              <Input value={data.mhProviderContact}
                onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, mhProviderContact: e.target.value } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
          )}
        </div>

        {/* Typical Day Narrative */}
        <div>
          <Label className="text-gray-700">Typical Day Narrative</Label>
          <Textarea value={data.typicalDayNarrative}
            onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, typicalDayNarrative: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" placeholder="What does a typical day look like for this resident?" rows={3} />
        </div>

        {/* Strengths & Assistance */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-gray-700">Psych/Social Strengths</Label>
            <Textarea value={data.psychSocialStrengths}
              onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, psychSocialStrengths: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" rows={2} />
          </div>
          <div>
            <Label className="text-gray-700">Caregiver Assistance</Label>
            <Textarea value={data.psychSocialAssistance}
              onChange={(e) => setFormData(prev => ({ ...prev, psychSocial: { ...prev.psychSocial, psychSocialAssistance: e.target.value } }))}
              className="mt-1 bg-white border-gray-300" placeholder="Caregiver will..." rows={2} />
          </div>
        </div>
      </div>
    );
  };

  // ADL Level Options
  const ADL_LEVELS = [
    { value: "independent", label: "Independent" },
    { value: "supervision", label: "Supervision/Cueing" },
    { value: "assistance", label: "Assistance Needed" },
    { value: "dependent", label: "Totally Dependent" },
  ];

  // Section 9: Activities of Daily Living (ADLs)
  const renderADLsSection = () => {
    const data = formData.adls;

    const renderADLLevelRadio = (adlKey: string, levelKey: string, value: string) => (
      <div className="flex flex-wrap gap-3">
        {ADL_LEVELS.map(({ value: optValue, label }) => (
          <label key={optValue} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={`${adlKey}-${levelKey}`} value={optValue}
              checked={value === optValue}
              onChange={() => {
                const adlData = (data as any)[adlKey];
                setFormData(prev => ({
                  ...prev,
                  adls: { ...prev.adls, [adlKey]: { ...adlData, [levelKey]: optValue } }
                }));
              }}
              className="w-4 h-4 text-teal-600" />
            <span className="text-gray-700 text-sm">{label}</span>
          </label>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Functional Limitations */}
        <div>
          <Label className="text-gray-700">General Functional Limitations</Label>
          <Textarea value={data.functionalLimitations}
            onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, functionalLimitations: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" placeholder="Overall functional limitations..." rows={2} />
        </div>

        {/* Ambulation/Mobility */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ambulation / Mobility</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">In Room Level</Label>
              {renderADLLevelRadio("ambulation", "inRoomLevel", data.ambulation.inRoomLevel)}
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Outside Room Level</Label>
              {renderADLLevelRadio("ambulation", "outsideLevel", data.ambulation.outsideLevel)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.ambulation.fallRisk}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, fallRisk: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Fall Risk</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.ambulation.bedroomDoorLock}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, bedroomDoorLock: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Bedroom Door Lock</span>
              </label>
            </div>
            {data.ambulation.fallRisk && (
              <div>
                <Label className="text-gray-700">Fall Prevention Plan</Label>
                <Textarea value={data.ambulation.fallPreventionPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, fallPreventionPlan: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Equipment</Label>
                <Input value={data.ambulation.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, equipment: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Vendor</Label>
                <Input value={data.ambulation.vendor}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, vendor: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
            <div>
              <Label className="text-gray-700">Strengths</Label>
              <Textarea value={data.ambulation.strengths}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, strengths: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Caregiver Assistance</Label>
              <Textarea value={data.ambulation.assistance}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, ambulation: { ...prev.adls.ambulation, assistance: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" placeholder="Caregiver will..." rows={2} />
            </div>
          </div>
        </div>

        {/* Bed Mobility */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Bed Mobility / Transfer</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("bedMobility", "level", data.bedMobility.level)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.bedMobility.skinCareNeeded}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, skinCareNeeded: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Skin Care Needed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.bedMobility.bedFallRisk}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, bedFallRisk: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Bed Fall Risk</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.bedMobility.turningRepositioning}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, turningRepositioning: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Turning/Repositioning</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.bedMobility.nighttimeCareNeeds}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, nighttimeCareNeeds: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Nighttime Care Needs</span>
              </label>
            </div>
            {data.bedMobility.turningRepositioning && (
              <div>
                <Label className="text-gray-700">Turning Frequency</Label>
                <Input value={data.bedMobility.turningFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, turningFrequency: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" placeholder="e.g., every 2 hours" />
              </div>
            )}
            <div>
              <Label className="text-gray-700 mb-2 block">Medical Devices</Label>
              <div className="flex gap-4">
                {[
                  { key: "hoyerLift", label: "Hoyer Lift" },
                  { key: "transferPole", label: "Transfer Pole" },
                  { key: "other", label: "Other" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={(data.bedMobility.devices as any)[key]}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev, adls: { ...prev.adls, bedMobility: { ...prev.adls.bedMobility, devices: { ...prev.adls.bedMobility.devices, [key]: checked === true } } }
                      }))}
                      className="border-gray-300 data-[state=checked]:bg-teal-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Eating */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Eating</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("eating", "level", data.eating.level)}
            </div>
            <div>
              <Label className="text-gray-700">Special Diet</Label>
              <Textarea value={data.eating.specialDiet}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, eating: { ...prev.adls.eating, specialDiet: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Eating Habits</Label>
              <Textarea value={data.eating.eatingHabits}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, eating: { ...prev.adls.eating, eatingHabits: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Food Allergies</Label>
              <Textarea value={data.eating.foodAllergies}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, eating: { ...prev.adls.eating, foodAllergies: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          </div>
        </div>

        {/* Toileting */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Toileting / Continence</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("toileting", "level", data.toileting.level)}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.toileting.bladderIncontinence}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, toileting: { ...prev.adls.toileting, bladderIncontinence: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Bladder Incontinence</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.toileting.bowelIncontinence}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, toileting: { ...prev.adls.toileting, bowelIncontinence: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Bowel Incontinence</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.toileting.incontinenceSkinCare}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, toileting: { ...prev.adls.toileting, incontinenceSkinCare: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Incontinence Skin Care</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Frequency</Label>
                <Input value={data.toileting.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, toileting: { ...prev.adls.toileting, frequency: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Equipment</Label>
                <Input value={data.toileting.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, toileting: { ...prev.adls.toileting, equipment: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Dressing */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dressing</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("dressing", "level", data.dressing.level)}
            </div>
            <div>
              <Label className="text-gray-700">Equipment</Label>
              <Input value={data.dressing.equipment}
                onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, dressing: { ...prev.adls.dressing, equipment: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" />
            </div>
          </div>
        </div>

        {/* Personal Hygiene */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Personal Hygiene</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("hygiene", "level", data.hygiene.level)}
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Teeth Type</Label>
              <div className="flex gap-4">
                {[
                  { value: "own", label: "Own Teeth" },
                  { value: "partials", label: "Partials" },
                  { value: "dentures", label: "Dentures" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="teethType" value={value}
                      checked={data.hygiene.teethType === value}
                      onChange={() => setFormData(prev => ({ ...prev, adls: { ...prev.adls, hygiene: { ...prev.adls.hygiene, teethType: value as any } } }))}
                      className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Oral Hygiene</Label>
              <div className="flex gap-4">
                {[
                  { key: "flossing", label: "Flossing" },
                  { key: "brushing", label: "Brushing" },
                  { key: "soaking", label: "Soaking" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={(data.hygiene.oralHygiene as any)[key]}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev, adls: { ...prev.adls, hygiene: { ...prev.adls.hygiene, oralHygiene: { ...prev.adls.hygiene.oralHygiene, [key]: checked === true } } }
                      }))}
                      className="border-gray-300 data-[state=checked]:bg-teal-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hygiene.hairCare}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, hygiene: { ...prev.adls.hygiene, hairCare: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Hair Care</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.hygiene.mensesCare}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, hygiene: { ...prev.adls.hygiene, mensesCare: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Menses Care</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bathing */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Bathing</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("bathing", "level", data.bathing.level)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Frequency</Label>
                <Input value={data.bathing.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bathing: { ...prev.adls.bathing, frequency: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Equipment</Label>
                <Input value={data.bathing.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, bathing: { ...prev.adls.bathing, equipment: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Foot Care */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Foot Care</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("footCare", "level", data.footCare.level)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.footCare.diabeticFootCare}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, footCare: { ...prev.adls.footCare, diabeticFootCare: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Diabetic Foot Care</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.footCare.nailCare}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, footCare: { ...prev.adls.footCare, nailCare: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Nail Care</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Frequency</Label>
                <Input value={data.footCare.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, footCare: { ...prev.adls.footCare, frequency: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Home Health Provider</Label>
                <Input value={data.footCare.homeHealth}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, footCare: { ...prev.adls.footCare, homeHealth: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Skin Care */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Skin Care</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              {renderADLLevelRadio("skinCare", "level", data.skinCare.level)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.skinCare.skinProblems}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, skinProblems: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Skin Problems</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.skinCare.pressureInjuries}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, pressureInjuries: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Pressure Injuries</span>
              </label>
            </div>
            {data.skinCare.skinProblems && (
              <div>
                <Label className="text-gray-700">Skin Problems Description</Label>
                <Textarea value={data.skinCare.skinProblemsDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, skinProblemsDescription: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
            )}
            {data.skinCare.pressureInjuries && (
              <div>
                <Label className="text-gray-700">Pressure Injuries Description</Label>
                <Textarea value={data.skinCare.pressureInjuriesDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, pressureInjuriesDescription: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.skinCare.dressingChanges}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, dressingChanges: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Dressing Changes</span>
              </label>
              {data.skinCare.dressingChanges && (
                <div>
                  <Input value={data.skinCare.dressingChangesFrequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, dressingChangesFrequency: e.target.value } } }))}
                    className="bg-white border-gray-300" placeholder="Frequency" />
                </div>
              )}
            </div>
            {data.skinCare.dressingChanges && (
              <label className="flex items-center gap-2 cursor-pointer ml-6">
                <Checkbox checked={data.skinCare.dressingNurseDelegated}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adls: { ...prev.adls, skinCare: { ...prev.adls.skinCare, dressingNurseDelegated: checked === true } } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Nurse Delegated</span>
              </label>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Section 10: Instrumental ADLs
  const renderIADLsSection = () => {
    const data = formData.iadls;

    const IADL_LEVELS = [
      { value: "independent", label: "Independent" },
      { value: "assistance", label: "Assistance Needed" },
      { value: "dependent", label: "Dependent" },
    ];

    return (
      <div className="space-y-6">
        {/* Finances */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Managing Finances</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              <div className="flex gap-4">
                {IADL_LEVELS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="financesLevel" value={value}
                      checked={data.finances.level === value}
                      onChange={() => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, finances: { ...prev.iadls.finances, level: value as any } } }))}
                      className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Who Manages Finances</Label>
                <Input value={data.finances.whoManagesFinances}
                  onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, finances: { ...prev.iadls.finances, whoManagesFinances: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Who Manages Records</Label>
                <Input value={data.finances.whoManagesRecords}
                  onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, finances: { ...prev.iadls.finances, whoManagesRecords: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Payee Name</Label>
                <Input value={data.finances.payeeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, finances: { ...prev.iadls.finances, payeeName: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
              <div>
                <Label className="text-gray-700">Payee Contact</Label>
                <Input value={data.finances.payeeContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, finances: { ...prev.iadls.finances, payeeContact: e.target.value } } }))}
                  className="mt-1 bg-white border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Transportation */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Transportation</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 mb-2 block">Level</Label>
              <div className="flex gap-4">
                {IADL_LEVELS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="transportLevel" value={value}
                      checked={data.transportation.level === value}
                      onChange={() => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, transportation: { ...prev.iadls.transportation, level: value as any } } }))}
                      className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.transportation.escortRequired}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, transportation: { ...prev.iadls.transportation, escortRequired: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Escort Required</span>
            </label>
            <div>
              <Label className="text-gray-700">Medical Transport Needs</Label>
              <Textarea value={data.transportation.medicalTransportNeeds}
                onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, transportation: { ...prev.iadls.transportation, medicalTransportNeeds: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Special Transport Needs</Label>
              <Textarea value={data.transportation.specialTransportNeeds}
                onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, transportation: { ...prev.iadls.transportation, specialTransportNeeds: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          </div>
        </div>

        {/* Activities/Social */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Activities / Social</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Interests</Label>
              <Textarea value={data.activities.interests}
                onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, activities: { ...prev.iadls.activities, interests: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Social/Cultural Preferences</Label>
              <Textarea value={data.activities.socialCulturalPreferences}
                onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, activities: { ...prev.iadls.activities, socialCulturalPreferences: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
            <div>
              <Label className="text-gray-700">Family/Friends Relationships</Label>
              <Textarea value={data.activities.familyFriendsRelationships}
                onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, activities: { ...prev.iadls.activities, familyFriendsRelationships: e.target.value } } }))}
                className="mt-1 bg-white border-gray-300" rows={2} />
            </div>
          </div>
        </div>

        {/* Activity Preferences */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Activity Preferences</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "reading", label: "Reading" },
              { key: "audioBooks", label: "Audio Books" },
              { key: "storytelling", label: "Storytelling" },
              { key: "phoneConversations", label: "Phone Conversations" },
              { key: "reminiscing", label: "Reminiscing" },
              { key: "currentEvents", label: "Current Events" },
              { key: "discussionGroup", label: "Discussion Group" },
              { key: "bibleStudyChurch", label: "Bible Study/Church" },
              { key: "visitors", label: "Visitors" },
              { key: "gardening", label: "Gardening" },
              { key: "outingsWithFamily", label: "Outings with Family" },
              { key: "visitingZoosParks", label: "Visiting Zoos/Parks" },
              { key: "petsAnimals", label: "Pets/Animals" },
              { key: "exercisesROM", label: "Exercises/ROM" },
              { key: "therapeuticWalking", label: "Therapeutic Walking" },
              { key: "cookingBaking", label: "Cooking/Baking" },
              { key: "houseChores", label: "House Chores" },
              { key: "watchingTVMovies", label: "Watching TV/Movies" },
              { key: "partiesGatherings", label: "Parties/Gatherings" },
              { key: "artsCrafts", label: "Arts/Crafts" },
              { key: "tableGamesBingoCardsPuzzles", label: "Table Games/Bingo" },
              { key: "beautyTime", label: "Beauty Time" },
              { key: "musicSinging", label: "Music/Singing" },
              { key: "communityIntegration", label: "Community Integration" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={(data.activityPreferences as any)[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev, iadls: { ...prev.iadls, activityPreferences: { ...prev.iadls.activityPreferences, [key]: checked === true } }
                  }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Smoking */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Smoking</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.smoking.residentSmokes}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, smoking: { ...prev.iadls.smoking, residentSmokes: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Resident Smokes</span>
            </label>
            {data.smoking.residentSmokes && (
              <>
                <div>
                  <Label className="text-gray-700">Safety Concerns</Label>
                  <Textarea value={data.smoking.safetyConcerns}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, smoking: { ...prev.iadls.smoking, safetyConcerns: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" rows={2} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={data.smoking.policyReviewed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, smoking: { ...prev.iadls.smoking, policyReviewed: checked === true } } }))}
                    className="border-gray-300 data-[state=checked]:bg-teal-600" />
                  <span className="text-gray-700">Smoking Policy Reviewed</span>
                </label>
                <div>
                  <Label className="text-gray-700">Cigarette/Lighter Storage</Label>
                  <Input value={data.smoking.cigaretteLighterStorage}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, smoking: { ...prev.iadls.smoking, cigaretteLighterStorage: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Case Management */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Case Management</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.caseManagement.receivesCaseManagement}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, caseManagement: { ...prev.iadls.caseManagement, receivesCaseManagement: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Receives Case Management</span>
            </label>
            {data.caseManagement.receivesCaseManagement && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Case Manager Name</Label>
                  <Input value={data.caseManagement.caseManagerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, caseManagement: { ...prev.iadls.caseManagement, caseManagerName: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Agency</Label>
                  <Input value={data.caseManagement.caseManagerAgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, caseManagement: { ...prev.iadls.caseManagement, caseManagerAgency: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Phone</Label>
                  <Input value={data.caseManagement.caseManagerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, caseManagement: { ...prev.iadls.caseManagement, caseManagerPhone: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Email</Label>
                  <Input value={data.caseManagement.caseManagerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, caseManagement: { ...prev.iadls.caseManagement, caseManagerEmail: e.target.value } } }))}
                    className="mt-1 bg-white border-gray-300" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other Issues */}
        <div>
          <Label className="text-gray-700">Other Issues/Concerns</Label>
          <Textarea value={data.otherIssuesConcerns}
            onChange={(e) => setFormData(prev => ({ ...prev, iadls: { ...prev.iadls, otherIssuesConcerns: e.target.value } }))}
            className="mt-1 bg-white border-gray-300" rows={3} />
        </div>
      </div>
    );
  };

  // Section 11: Review & Signatures
  const renderSignaturesSection = () => {
    const data = formData.signatures;

    // Signature row component for print layout
    const SignatureRow = ({ label }: { label: string }) => (
      <div className="grid grid-cols-12 gap-4 py-3 border-b border-gray-300">
        <div className="col-span-4">
          <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
          <div className="border-b-2 border-gray-400 h-8 print:h-6"></div>
        </div>
        <div className="col-span-5">
          <div className="text-sm font-medium text-gray-700 mb-1">SIGNATURE</div>
          <div className="border-b-2 border-gray-400 h-8 print:h-6"></div>
        </div>
        <div className="col-span-3">
          <div className="text-sm font-medium text-gray-700 mb-1">DATE</div>
          <div className="border-b-2 border-gray-400 h-8 print:h-6"></div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Involved in NCP Development */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            INVOLVED IN NCP DEVELOPMENT
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.involved.resident}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, resident: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Resident</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.involved.residentRep}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, residentRep: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Resident Representative</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.involved.parent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, parent: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Parent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={data.involved.healthProfessional}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, healthProfessional: checked === true } } }))}
                className="border-gray-300 data-[state=checked]:bg-teal-600" />
              <span className="text-gray-700">Health Professional</span>
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((num) => {
              const key = `other${num}` as "other1" | "other2" | "other3";
              const nameKey = `other${num}Name` as "other1Name" | "other2Name" | "other3Name";
              return (
                <div key={num} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={data.involved[key]}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, [key]: checked === true } } }))}
                      className="border-gray-300 data-[state=checked]:bg-teal-600" />
                    <span className="text-gray-700">Other:</span>
                  </label>
                  <Input value={data.involved[nameKey]}
                    onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, involved: { ...prev.signatures.involved, [nameKey]: e.target.value } } }))}
                    className="flex-1 bg-white border-gray-300" placeholder="Name/Role" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Lines */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            PERSON APPROVING PLAN
          </h4>
          <div className="space-y-2">
            <SignatureRow label="PROVIDER" />
            <SignatureRow label="RESIDENT" />
            <SignatureRow label="RESIDENT REPRESENTATIVE" />
            <SignatureRow label="OTHER" />
            <SignatureRow label="OTHER" />
            <SignatureRow label="OTHER" />
          </div>
        </div>

        {/* Additional Items */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            ADDITIONAL ITEMS
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.residentVerballyAgreed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, residentVerballyAgreed: checked === true } } ))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">Resident verbally agreed to NCP</span>
              </label>
              <span className="text-gray-500">– Date:</span>
              <Input type="date" value={data.residentVerballyAgreedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, residentVerballyAgreedDate: e.target.value } }))}
                className="w-40 bg-white border-gray-300" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={data.ncpSentToCM}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, ncpSentToCM: checked === true } }))}
                  className="border-gray-300 data-[state=checked]:bg-teal-600" />
                <span className="text-gray-700">NCP sent to DSHS CM on:</span>
              </label>
              <Input type="date" value={data.ncpSentToCMDate}
                onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, ncpSentToCMDate: e.target.value } }))}
                className="w-40 bg-white border-gray-300" />
            </div>
          </div>
        </div>

        {/* Resident Recommendations */}
        <div>
          <Label className="text-gray-700 font-semibold">Resident Recommendations</Label>
          <Textarea value={data.residentRecommendations}
            onChange={(e) => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, residentRecommendations: e.target.value } }))}
            className="mt-1 bg-white border-gray-300"
            placeholder="Enter any recommendations from the resident regarding their care plan..."
            rows={4} />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p>
                *The person signing writes the date they actually read and agreed to the plan. If the participant
                has verbally agreed to the plan, the provider should note below: (a) the name and role of the
                participant; (b) the date the participant had the plan read to them; and (c) what if any changes
                the participant recommended for the plan.
              </p>
            </div>
          </div>
        </div>

        {/* Print Notice */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg print:hidden">
          <div className="flex items-start gap-3">
            <PenLine className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Physical Signatures Required</p>
              <p className="mt-1">
                This form will need to be printed for physical signatures from the resident (or representative),
                provider, and any other required parties. Use the "Print" button in the header to generate a
                print-friendly version of this NCP.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render section content
  const renderSectionContent = () => {
    const section = NCP_SECTIONS.find((s) => s.id === currentSection);
    if (!section) return null;

    switch (currentSection) {
      case 1: return renderResidentInfoSection();
      case 2: return renderEmergencyContactsSection();
      case 3: return renderEvacuationSection();
      case 4: return renderCommunicationSection();
      case 5: return renderMedicationSection();
      case 6: return renderHealthIndicatorsSection();
      case 7: return renderTreatmentsSection();
      case 8: return renderPsychSocialSection();
      case 9: return renderADLsSection();
      case 10: return renderIADLsSection();
      case 11: return renderSignaturesSection();
      default:
        return (
          <div className="space-y-6">
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <section.icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">{section.title}</h3>
              <p className="text-gray-500 text-sm">Section {section.id} of {NCP_SECTIONS.length}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden flex flex-col print:static print:overflow-visible print:bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:static {
            position: static !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:h-6 {
            height: 1.5rem !important;
          }
        }
      `}</style>

      {/* Print Header (only visible when printing) */}
      <div className="hidden print:block print:mb-6 print:border-b-2 print:border-gray-800 print:pb-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">
            {facility?.name || "Adult Family Home"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {facility?.address}, {facility?.city}, {facility?.state} {facility?.zipCode}
          </p>
          <h2 className="text-lg font-semibold text-gray-800 mt-4">
            NEGOTIATED CARE PLAN (NCP)
          </h2>
          {resident && (
            <p className="text-gray-700 mt-2">
              Resident: {resident.firstName} {resident.lastName}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Generated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Header (hidden on print) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
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
              className="gap-2 border-gray-300 print:hidden"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 border-gray-300 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-4 print:hidden">
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex print:block print:overflow-visible">
        {/* Sidebar - Section Navigation (hidden on print) */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto print:hidden">
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

            {/* Navigation Buttons (hidden on print) */}
            <div className="flex items-center justify-between mt-6 print:hidden">
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
