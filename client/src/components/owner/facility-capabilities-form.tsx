import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Heart,
  Stethoscope,
  DollarSign,
  Home,
  Users,
  Sparkles,
  Globe,
  Bed,
  Info,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FacilityCapabilitiesFormProps {
  facilityId: string;
}

// Default form data structure
const DEFAULT_FORM_DATA = {
  specializations: {
    dementia: false,
    alzheimers: false,
    mentalHealth: false,
    developmentalDisabilities: false,
    traumaticBrainInjury: false,
    parkinsons: false,
    diabetes: false,
    dialysis: false,
    hospicePalliative: false,
    postSurgeryRehab: false,
    bariatric: false,
    youngAdults: false,
    veterans: false,
  },
  medicalServices: {
    nursingCare24hr: false,
    rnOnSite: false,
    lpnOnSite: false,
    medicationManagement: false,
    medicationAdministration: false,
    injections: false,
    woundCare: false,
    catheterCare: false,
    ostomyCare: false,
    oxygenTherapy: false,
    cpapBipap: false,
    feedingTube: false,
    physicalTherapy: false,
    occupationalTherapy: false,
    speechTherapy: false,
    bloodGlucoseMonitoring: false,
    vitalSignsMonitoring: false,
    hospiceCoordination: false,
  },
  adlCapabilities: {
    bathing: "all-levels",
    dressing: "all-levels",
    eating: "all-levels",
    mobility: "all-levels",
    toileting: "all-levels",
    transferring: "all-levels",
    continence: "all-levels",
  },
  paymentAccepted: {
    privatePay: true,
    medicaidCOPES: false,
    medicaidWaiver: false,
    medicare: false,
    longTermCareInsurance: false,
    vaAidAttendance: false,
    vaCommunityLiving: false,
    slidingScale: false,
    financialAssistance: false,
  },
  pricing: {
    baseRateMin: 0,
    baseRateMax: 0,
    medicaidRate: null as number | null,
    additionalCareRates: { level1: 0, level2: 0, level3: 0 },
    includesInPricing: [] as string[],
    additionalFees: [] as { name: string; amount: number }[],
  },
  amenities: {
    privateRooms: false,
    sharedRooms: false,
    privateBathroom: false,
    wheelchairAccessible: false,
    hospitalBeds: false,
    hoyerLift: false,
    walkInShower: false,
    emergencyCallSystem: false,
    securedMemoryCare: false,
    wanderPrevention: false,
    outdoorSpace: false,
    garden: false,
    petFriendly: false,
    petsOnSite: false,
    smokingAllowed: false,
    wifi: false,
    cableTV: false,
    airConditioning: false,
    homeCookedMeals: false,
    specialDiets: false,
    activities: false,
    transportation: false,
    laundry: false,
    housekeeping: false,
  },
  staffing: {
    staffToResidentRatio: "",
    overnightStaffAwake: false,
    bilingualStaff: false,
    languages: [] as string[],
    specializedTraining: [] as string[],
  },
  culturalServices: {
    languagesSpoken: ["English"],
    culturalFoods: [] as string[],
    religiousServices: false,
    religiousAffiliation: null as string | null,
    lgbtqFriendly: false,
    culturalActivities: [] as string[],
  },
  availability: {
    totalBeds: 6,
    currentOccupancy: 0,
    availableBeds: 6,
    waitlistLength: 0,
    acceptingNewResidents: true,
    respiteCareAvailable: false,
  },
};

type FormData = typeof DEFAULT_FORM_DATA;

// Helper component for checkbox groups
function CheckboxGroup({
  label,
  description,
  options,
  values,
  onChange,
}: {
  label: string;
  description?: string;
  options: { id: string; label: string; description?: string }[];
  values: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => (
          <div
            key={option.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              values[option.id] ? "bg-teal-50 border-teal-300" : "hover:bg-gray-50"
            )}
            onClick={() => onChange(option.id, !values[option.id])}
          >
            <Checkbox
              checked={values[option.id] || false}
              onCheckedChange={(checked) => onChange(option.id, !!checked)}
              className="mt-0.5"
            />
            <div>
              <Label className="cursor-pointer font-medium">{option.label}</Label>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FacilityCapabilitiesForm({ facilityId }: FacilityCapabilitiesFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("specializations");
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  // Fetch existing capabilities
  const { data: capabilities, isLoading } = useQuery({
    queryKey: ["facility-capabilities", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/capabilities`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch capabilities");
      }
      return response.json();
    },
  });

  // Load existing data
  useEffect(() => {
    if (capabilities) {
      setFormData((prev) => ({
        ...prev,
        specializations: { ...prev.specializations, ...capabilities.specializations },
        medicalServices: { ...prev.medicalServices, ...capabilities.medicalServices },
        adlCapabilities: { ...prev.adlCapabilities, ...capabilities.adlCapabilities },
        paymentAccepted: { ...prev.paymentAccepted, ...capabilities.paymentAccepted },
        pricing: { ...prev.pricing, ...capabilities.pricing },
        amenities: { ...prev.amenities, ...capabilities.amenities },
        staffing: { ...prev.staffing, ...capabilities.staffing },
        culturalServices: { ...prev.culturalServices, ...capabilities.culturalServices },
        availability: { ...prev.availability, ...capabilities.availability },
      }));
    }
  }, [capabilities]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/capabilities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save capabilities");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility-capabilities"] });
      toast({
        title: "Capabilities saved",
        description: "Your facility profile has been updated. Families will now see accurate matches.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving",
        description: "Failed to save capabilities. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (section: keyof FormData, updates: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Home className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <CardTitle>Facility Capabilities & Services</CardTitle>
                <CardDescription>
                  Tell families what your home offers. This information is used to match your facility with families looking for care.
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How matching works</p>
              <p className="text-sm text-blue-700 mt-1">
                Families searching for care answer questions about their needs. Your facility will rank higher for families whose needs match what you offer.
                <strong> Be accurate</strong> — only check services you actually provide to ensure good matches.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto gap-1 p-1">
          <TabsTrigger value="specializations" className="flex flex-col py-2 px-3">
            <Heart className="h-4 w-4 mb-1" />
            <span className="text-xs">Specializations</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex flex-col py-2 px-3">
            <Stethoscope className="h-4 w-4 mb-1" />
            <span className="text-xs">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="adl" className="flex flex-col py-2 px-3">
            <Users className="h-4 w-4 mb-1" />
            <span className="text-xs">Care Levels</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex flex-col py-2 px-3">
            <DollarSign className="h-4 w-4 mb-1" />
            <span className="text-xs">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="amenities" className="flex flex-col py-2 px-3">
            <Sparkles className="h-4 w-4 mb-1" />
            <span className="text-xs">Amenities</span>
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex flex-col py-2 px-3">
            <Users className="h-4 w-4 mb-1" />
            <span className="text-xs">Staffing</span>
          </TabsTrigger>
          <TabsTrigger value="cultural" className="flex flex-col py-2 px-3">
            <Globe className="h-4 w-4 mb-1" />
            <span className="text-xs">Cultural</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex flex-col py-2 px-3">
            <Bed className="h-4 w-4 mb-1" />
            <span className="text-xs">Availability</span>
          </TabsTrigger>
        </TabsList>

        {/* Specializations Tab */}
        <TabsContent value="specializations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-teal-600" />
                Care Specializations
              </CardTitle>
              <CardDescription>
                Select the conditions and populations your facility is equipped and trained to serve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CheckboxGroup
                label="Cognitive & Memory Care"
                description="Does your facility specialize in memory-related conditions?"
                options={[
                  { id: "dementia", label: "Dementia Care", description: "General dementia support and programming" },
                  { id: "alzheimers", label: "Alzheimer's Disease", description: "Specialized Alzheimer's care" },
                  { id: "traumaticBrainInjury", label: "Traumatic Brain Injury", description: "TBI rehabilitation and care" },
                ]}
                values={formData.specializations}
                onChange={(id, checked) => updateFormData("specializations", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Mental & Behavioral Health"
                description="Mental health and behavioral support capabilities"
                options={[
                  { id: "mentalHealth", label: "Mental Health", description: "Depression, anxiety, bipolar, etc." },
                  { id: "developmentalDisabilities", label: "Developmental Disabilities", description: "DD/ID support and programming" },
                ]}
                values={formData.specializations}
                onChange={(id, checked) => updateFormData("specializations", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Medical Conditions"
                description="Specific medical conditions you're equipped to manage"
                options={[
                  { id: "parkinsons", label: "Parkinson's Disease", description: "Movement disorder care" },
                  { id: "diabetes", label: "Diabetes Management", description: "Blood sugar monitoring, insulin" },
                  { id: "dialysis", label: "Dialysis Coordination", description: "Transport to dialysis or home dialysis support" },
                  { id: "bariatric", label: "Bariatric Care", description: "Care for residents over 300 lbs" },
                ]}
                values={formData.specializations}
                onChange={(id, checked) => updateFormData("specializations", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="End of Life & Rehabilitation"
                options={[
                  { id: "hospicePalliative", label: "Hospice / Palliative", description: "End of life comfort care" },
                  { id: "postSurgeryRehab", label: "Post-Surgery Rehab", description: "Short-term rehabilitation" },
                ]}
                values={formData.specializations}
                onChange={(id, checked) => updateFormData("specializations", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Special Populations"
                options={[
                  { id: "youngAdults", label: "Young Adults (Under 65)", description: "Accept residents under 65" },
                  { id: "veterans", label: "Veterans", description: "Experience with VA programs" },
                ]}
                values={formData.specializations}
                onChange={(id, checked) => updateFormData("specializations", { [id]: checked })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Services Tab */}
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600" />
                Medical Services Provided
              </CardTitle>
              <CardDescription>
                What medical services can you provide? Only check services your staff is trained and licensed to perform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CheckboxGroup
                label="Nursing Care"
                options={[
                  { id: "nursingCare24hr", label: "24-Hour Nursing", description: "RN/LPN on-site 24/7" },
                  { id: "rnOnSite", label: "RN On-Site", description: "Registered Nurse available" },
                  { id: "lpnOnSite", label: "LPN On-Site", description: "Licensed Practical Nurse" },
                ]}
                values={formData.medicalServices}
                onChange={(id, checked) => updateFormData("medicalServices", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Medication Services"
                options={[
                  { id: "medicationManagement", label: "Medication Management", description: "Reminders and oversight" },
                  { id: "medicationAdministration", label: "Medication Administration", description: "Staff administers medications" },
                  { id: "injections", label: "Injections", description: "Insulin, B12, etc." },
                ]}
                values={formData.medicalServices}
                onChange={(id, checked) => updateFormData("medicalServices", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Specialized Medical Care"
                options={[
                  { id: "woundCare", label: "Wound Care", description: "Dressing changes, pressure ulcer care" },
                  { id: "catheterCare", label: "Catheter Care", description: "Foley catheter management" },
                  { id: "ostomyCare", label: "Ostomy Care", description: "Colostomy/ileostomy care" },
                  { id: "oxygenTherapy", label: "Oxygen Therapy", description: "Supplemental oxygen management" },
                  { id: "cpapBipap", label: "CPAP/BiPAP", description: "Sleep apnea equipment" },
                  { id: "feedingTube", label: "Feeding Tube", description: "G-tube or NG tube care" },
                ]}
                values={formData.medicalServices}
                onChange={(id, checked) => updateFormData("medicalServices", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Therapy & Rehabilitation"
                options={[
                  { id: "physicalTherapy", label: "Physical Therapy", description: "PT services available" },
                  { id: "occupationalTherapy", label: "Occupational Therapy", description: "OT services available" },
                  { id: "speechTherapy", label: "Speech Therapy", description: "Speech/swallowing therapy" },
                ]}
                values={formData.medicalServices}
                onChange={(id, checked) => updateFormData("medicalServices", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Monitoring & Coordination"
                options={[
                  { id: "bloodGlucoseMonitoring", label: "Blood Glucose Monitoring", description: "Regular blood sugar checks" },
                  { id: "vitalSignsMonitoring", label: "Vital Signs Monitoring", description: "BP, pulse, temperature" },
                  { id: "hospiceCoordination", label: "Hospice Coordination", description: "Work with hospice agencies" },
                ]}
                values={formData.medicalServices}
                onChange={(id, checked) => updateFormData("medicalServices", { [id]: checked })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADL Care Levels Tab */}
        <TabsContent value="adl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Care Level Capabilities
              </CardTitle>
              <CardDescription>
                What level of assistance can your facility provide for each activity of daily living?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { id: "bathing", label: "Bathing & Showering", icon: "🚿" },
                { id: "dressing", label: "Dressing", icon: "👕" },
                { id: "eating", label: "Eating", icon: "🍽️" },
                { id: "toileting", label: "Toileting", icon: "🚻" },
              ].map((adl) => (
                <div key={adl.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>{adl.icon}</span>
                    {adl.label}
                  </Label>
                  <RadioGroup
                    value={formData.adlCapabilities[adl.id as keyof typeof formData.adlCapabilities]}
                    onValueChange={(value) => updateFormData("adlCapabilities", { [adl.id]: value })}
                    className="flex flex-wrap gap-2"
                  >
                    {[
                      { value: "independent-only", label: "Independent only" },
                      { value: "some-assistance", label: "Up to some assistance" },
                      { value: "full-assistance", label: "Up to full assistance" },
                      { value: "all-levels", label: "All levels" },
                    ].map((level) => (
                      <div key={level.value} className="flex items-center">
                        <RadioGroupItem value={level.value} id={`${adl.id}-${level.value}`} className="peer sr-only" />
                        <Label
                          htmlFor={`${adl.id}-${level.value}`}
                          className={cn(
                            "px-3 py-2 rounded-full border cursor-pointer text-sm transition-colors",
                            formData.adlCapabilities[adl.id as keyof typeof formData.adlCapabilities] === level.value
                              ? "bg-teal-100 border-teal-500"
                              : "hover:bg-gray-50"
                          )}
                        >
                          {level.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>🚶</span>
                  Mobility
                </Label>
                <RadioGroup
                  value={formData.adlCapabilities.mobility}
                  onValueChange={(value) => updateFormData("adlCapabilities", { mobility: value })}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { value: "ambulatory-only", label: "Ambulatory only" },
                    { value: "wheelchair", label: "Wheelchair users OK" },
                    { value: "bedridden", label: "Bedridden OK" },
                    { value: "all-levels", label: "All mobility levels" },
                  ].map((level) => (
                    <div key={level.value} className="flex items-center">
                      <RadioGroupItem value={level.value} id={`mobility-${level.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`mobility-${level.value}`}
                        className={cn(
                          "px-3 py-2 rounded-full border cursor-pointer text-sm transition-colors",
                          formData.adlCapabilities.mobility === level.value
                            ? "bg-teal-100 border-teal-500"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>🔄</span>
                  Transferring (Bed to Chair)
                </Label>
                <RadioGroup
                  value={formData.adlCapabilities.transferring}
                  onValueChange={(value) => updateFormData("adlCapabilities", { transferring: value })}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { value: "independent-only", label: "Independent only" },
                    { value: "one-person", label: "1-person assist" },
                    { value: "two-person", label: "2-person assist" },
                    { value: "hoyer-lift", label: "Hoyer lift" },
                    { value: "all-levels", label: "All levels" },
                  ].map((level) => (
                    <div key={level.value} className="flex items-center">
                      <RadioGroupItem value={level.value} id={`transfer-${level.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`transfer-${level.value}`}
                        className={cn(
                          "px-3 py-2 rounded-full border cursor-pointer text-sm transition-colors",
                          formData.adlCapabilities.transferring === level.value
                            ? "bg-teal-100 border-teal-500"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>💧</span>
                  Continence
                </Label>
                <RadioGroup
                  value={formData.adlCapabilities.continence}
                  onValueChange={(value) => updateFormData("adlCapabilities", { continence: value })}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { value: "continent-only", label: "Continent residents only" },
                    { value: "incontinent-ok", label: "Incontinence care provided" },
                    { value: "all-levels", label: "All levels" },
                  ].map((level) => (
                    <div key={level.value} className="flex items-center">
                      <RadioGroupItem value={level.value} id={`continence-${level.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`continence-${level.value}`}
                        className={cn(
                          "px-3 py-2 rounded-full border cursor-pointer text-sm transition-colors",
                          formData.adlCapabilities.continence === level.value
                            ? "bg-teal-100 border-teal-500"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal-600" />
                Payment Options & Pricing
              </CardTitle>
              <CardDescription>
                What payment methods do you accept? Families often filter by payment type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CheckboxGroup
                label="Accepted Payment Types"
                description="Check all payment methods your facility accepts"
                options={[
                  { id: "privatePay", label: "Private Pay", description: "Out-of-pocket payment" },
                  { id: "medicaidCOPES", label: "Medicaid COPES", description: "WA Medicaid waiver program" },
                  { id: "medicaidWaiver", label: "Other Medicaid Waiver", description: "Other state Medicaid programs" },
                  { id: "medicare", label: "Medicare", description: "For skilled nursing services" },
                  { id: "longTermCareInsurance", label: "Long-Term Care Insurance", description: "LTC insurance policies" },
                  { id: "vaAidAttendance", label: "VA Aid & Attendance", description: "Veterans benefits" },
                  { id: "vaCommunityLiving", label: "VA Community Living", description: "VA community care" },
                  { id: "slidingScale", label: "Sliding Scale", description: "Income-based pricing" },
                  { id: "financialAssistance", label: "Financial Assistance Available", description: "Help with costs" },
                ]}
                values={formData.paymentAccepted}
                onChange={(id, checked) => updateFormData("paymentAccepted", { [id]: checked })}
              />

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Monthly Pricing</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseRateMin">Base Rate (Minimum)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="baseRateMin"
                        type="number"
                        value={formData.pricing.baseRateMin || ""}
                        onChange={(e) =>
                          updateFormData("pricing", {
                            baseRateMin: parseInt(e.target.value) || 0,
                          })
                        }
                        className="pl-7"
                        placeholder="e.g., 4500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Starting monthly rate</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseRateMax">Base Rate (Maximum)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="baseRateMax"
                        type="number"
                        value={formData.pricing.baseRateMax || ""}
                        onChange={(e) =>
                          updateFormData("pricing", {
                            baseRateMax: parseInt(e.target.value) || 0,
                          })
                        }
                        className="pl-7"
                        placeholder="e.g., 7000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum monthly rate</p>
                  </div>
                </div>

                {formData.paymentAccepted.medicaidCOPES && (
                  <div className="space-y-2">
                    <Label htmlFor="medicaidRate">Medicaid COPES Rate</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="medicaidRate"
                        type="number"
                        value={formData.pricing.medicaidRate || ""}
                        onChange={(e) =>
                          updateFormData("pricing", {
                            medicaidRate: parseInt(e.target.value) || null,
                          })
                        }
                        className="pl-7"
                        placeholder="e.g., 3500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Your Medicaid reimbursement rate</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                Amenities & Features
              </CardTitle>
              <CardDescription>
                What does your facility offer? These details help families find the right fit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CheckboxGroup
                label="Room Options"
                options={[
                  { id: "privateRooms", label: "Private Rooms Available" },
                  { id: "sharedRooms", label: "Shared Rooms Available" },
                  { id: "privateBathroom", label: "Private Bathrooms" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Accessibility & Safety"
                options={[
                  { id: "wheelchairAccessible", label: "Wheelchair Accessible" },
                  { id: "hospitalBeds", label: "Hospital Beds Available" },
                  { id: "hoyerLift", label: "Hoyer Lift Available" },
                  { id: "walkInShower", label: "Walk-in Showers" },
                  { id: "emergencyCallSystem", label: "Emergency Call System" },
                  { id: "securedMemoryCare", label: "Secured Memory Care Unit" },
                  { id: "wanderPrevention", label: "Wander Prevention System" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Outdoor & Environment"
                options={[
                  { id: "outdoorSpace", label: "Outdoor Space" },
                  { id: "garden", label: "Garden Area" },
                  { id: "airConditioning", label: "Air Conditioning" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Pets"
                options={[
                  { id: "petFriendly", label: "Pet-Friendly (residents can bring pets)" },
                  { id: "petsOnSite", label: "Pets On-Site (facility pets)" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Services Included"
                options={[
                  { id: "homeCookedMeals", label: "Home-Cooked Meals" },
                  { id: "specialDiets", label: "Special Diets Available" },
                  { id: "activities", label: "Activities & Programs" },
                  { id: "transportation", label: "Transportation Provided" },
                  { id: "laundry", label: "Laundry Service" },
                  { id: "housekeeping", label: "Housekeeping" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />

              <Separator />

              <CheckboxGroup
                label="Technology & Entertainment"
                options={[
                  { id: "wifi", label: "WiFi Available" },
                  { id: "cableTV", label: "Cable TV" },
                ]}
                values={formData.amenities}
                onChange={(id, checked) => updateFormData("amenities", { [id]: checked })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staffing Tab */}
        <TabsContent value="staffing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Staffing Information
              </CardTitle>
              <CardDescription>
                Staff quality is a top factor for families. Share your staffing details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffRatio">Staff-to-Resident Ratio</Label>
                  <Input
                    id="staffRatio"
                    value={formData.staffing.staffToResidentRatio}
                    onChange={(e) => updateFormData("staffing", { staffToResidentRatio: e.target.value })}
                    placeholder="e.g., 1:3 or 1:6"
                  />
                  <p className="text-xs text-muted-foreground">Typical daytime ratio</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Overnight Staff Awake</Label>
                  <p className="text-sm text-muted-foreground">Is staff awake (not sleeping) overnight?</p>
                </div>
                <Switch
                  checked={formData.staffing.overnightStaffAwake}
                  onCheckedChange={(checked) => updateFormData("staffing", { overnightStaffAwake: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Bilingual Staff Available</Label>
                  <p className="text-sm text-muted-foreground">Staff speaks languages other than English</p>
                </div>
                <Switch
                  checked={formData.staffing.bilingualStaff}
                  onCheckedChange={(checked) => updateFormData("staffing", { bilingualStaff: checked })}
                />
              </div>

              {formData.staffing.bilingualStaff && (
                <div className="space-y-2">
                  <Label htmlFor="languages">Languages Spoken (comma-separated)</Label>
                  <Input
                    id="languages"
                    value={formData.staffing.languages?.join(", ") || ""}
                    onChange={(e) =>
                      updateFormData("staffing", {
                        languages: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Spanish, Vietnamese, Tagalog"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="training">Specialized Training (comma-separated)</Label>
                <Input
                  id="training"
                  value={formData.staffing.specializedTraining?.join(", ") || ""}
                  onChange={(e) =>
                    updateFormData("staffing", {
                      specializedTraining: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., Dementia care, CPR, First Aid, Mental Health First Aid"
                />
                <p className="text-xs text-muted-foreground">List certifications and training your staff has completed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Tab */}
        <TabsContent value="cultural">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-teal-600" />
                Cultural & Language Services
              </CardTitle>
              <CardDescription>
                Help families find a home that fits their cultural and language needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="languagesSpoken">Languages Spoken in Home</Label>
                <Input
                  id="languagesSpoken"
                  value={formData.culturalServices.languagesSpoken?.join(", ") || "English"}
                  onChange={(e) =>
                    updateFormData("culturalServices", {
                      languagesSpoken: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., English, Spanish, Vietnamese"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="culturalFoods">Cultural Foods Offered</Label>
                <Input
                  id="culturalFoods"
                  value={formData.culturalServices.culturalFoods?.join(", ") || ""}
                  onChange={(e) =>
                    updateFormData("culturalServices", {
                      culturalFoods: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., Asian cuisine, Mexican, Filipino, Kosher"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Religious Services</Label>
                  <p className="text-sm text-muted-foreground">Religious services or spiritual care available</p>
                </div>
                <Switch
                  checked={formData.culturalServices.religiousServices}
                  onCheckedChange={(checked) => updateFormData("culturalServices", { religiousServices: checked })}
                />
              </div>

              {formData.culturalServices.religiousServices && (
                <div className="space-y-2">
                  <Label htmlFor="religiousAffiliation">Religious Affiliation (if any)</Label>
                  <Input
                    id="religiousAffiliation"
                    value={formData.culturalServices.religiousAffiliation || ""}
                    onChange={(e) => updateFormData("culturalServices", { religiousAffiliation: e.target.value })}
                    placeholder="e.g., Catholic, Non-denominational Christian, Buddhist"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>LGBTQ+ Friendly</Label>
                  <p className="text-sm text-muted-foreground">Welcoming and affirming environment for LGBTQ+ residents</p>
                </div>
                <Switch
                  checked={formData.culturalServices.lgbtqFriendly}
                  onCheckedChange={(checked) => updateFormData("culturalServices", { lgbtqFriendly: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="culturalActivities">Cultural Activities</Label>
                <Textarea
                  id="culturalActivities"
                  value={formData.culturalServices.culturalActivities?.join("\n") || ""}
                  onChange={(e) =>
                    updateFormData("culturalServices", {
                      culturalActivities: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="List cultural activities or celebrations (one per line)"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-teal-600" />
                Current Availability
              </CardTitle>
              <CardDescription>
                Keep this updated so families know if you have openings. This affects search rankings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalBeds">Total Beds</Label>
                  <Input
                    id="totalBeds"
                    type="number"
                    value={formData.availability.totalBeds}
                    onChange={(e) => updateFormData("availability", { totalBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentOccupancy">Current Residents</Label>
                  <Input
                    id="currentOccupancy"
                    type="number"
                    value={formData.availability.currentOccupancy}
                    onChange={(e) => updateFormData("availability", { currentOccupancy: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableBeds">Available Beds</Label>
                  <Input
                    id="availableBeds"
                    type="number"
                    value={formData.availability.availableBeds}
                    onChange={(e) => updateFormData("availability", { availableBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
                <div>
                  <Label className="text-green-800">Accepting New Residents</Label>
                  <p className="text-sm text-green-600">Toggle this to show or hide your facility from search results</p>
                </div>
                <Switch
                  checked={formData.availability.acceptingNewResidents}
                  onCheckedChange={(checked) => updateFormData("availability", { acceptingNewResidents: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlistLength">Waitlist Length (if any)</Label>
                <Input
                  id="waitlistLength"
                  type="number"
                  value={formData.availability.waitlistLength}
                  onChange={(e) => updateFormData("availability", { waitlistLength: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Number of people on your waitlist</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Respite Care Available</Label>
                  <p className="text-sm text-muted-foreground">Short-term stays for respite care</p>
                </div>
                <Switch
                  checked={formData.availability.respiteCareAvailable}
                  onCheckedChange={(checked) => updateFormData("availability", { respiteCareAvailable: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed Save Button at Bottom */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="lg"
          className="bg-teal-600 hover:bg-teal-700 shadow-lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
