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
  fillDisclosureServicesPDF,
  downloadDisclosureServicesPDF,
  openDisclosureServicesPDFForPrint,
} from "@/lib/forms/disclosure-services-pdf";
import {
  type DisclosureServicesFormData,
  getInitialDisclosureServicesData,
} from "@/lib/forms/disclosure-services-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Building2,
  Info,
  CheckSquare,
  Plus,
  PenLine,
  Loader2,
  X,
  Printer,
  Download,
  FileText,
} from "lucide-react";

// Form Sections
const SECTIONS = [
  { id: 1, title: "Facility Information", key: "facilityInfo", icon: Building2 },
  { id: 2, title: "Services Overview", key: "servicesOverview", icon: Info },
  { id: 3, title: "Services Provided", key: "servicesProvided", icon: CheckSquare },
  { id: 4, title: "Additional Services & Fees", key: "additionalServices", icon: Plus },
  { id: 5, title: "Signatures", key: "signatures", icon: PenLine },
];

interface DisclosureServicesWizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function DisclosureServicesWizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: DisclosureServicesWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<DisclosureServicesFormData>(
    getInitialDisclosureServicesData()
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [formId, setFormId] = useState<number | null>(existingFormId || null);

  // Load existing form data if editing
  const { data: existingForm, isLoading: loadingForm } = useQuery({
    queryKey: ["form-submission", existingFormId],
    queryFn: async () => {
      if (!existingFormId || !facilityId) return null;
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/forms/${existingFormId}`,
        { credentials: "include" }
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!existingFormId && !!facilityId,
  });

  // Load existing form data when fetched
  useEffect(() => {
    if (existingForm?.formData) {
      try {
        const parsed = JSON.parse(existingForm.formData);
        setFormData(parsed);
        setCurrentSection(existingForm.currentSection || 1);
      } catch (e) {
        console.error("Error parsing form data:", e);
      }
    }
  }, [existingForm]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filled = 0;
    let total = 0;

    const countFields = (obj: any): void => {
      for (const key in obj) {
        const value = obj[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          countFields(value);
        } else if (typeof value === "string") {
          total++;
          if (value.trim() !== "") filled++;
        }
      }
    };

    countFields(formData);
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  // Save form mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!facilityId) throw new Error("Facility ID required");

      const payload = {
        residentId: residentId || null,
        formType: "disclosure_services",
        formTitle: `Disclosure of Services - ${formData.facilityInfo.facilityName || "New"}`,
        status: "draft",
        currentSection,
        totalSections: SECTIONS.length,
        completionPercentage: calculateCompletion(),
        formData: JSON.stringify(formData),
      };

      if (formId) {
        const response = await fetch(
          `/api/owners/facilities/${facilityId}/forms/${formId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) throw new Error("Failed to save form");
        return response.json();
      } else {
        const response = await fetch(
          `/api/owners/facilities/${facilityId}/forms`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) throw new Error("Failed to create form");
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (!formId && data.id) {
        setFormId(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["form-submissions"] });
      toast({
        title: "Saved",
        description: "Form progress saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle print/download
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const pdfBytes = await fillDisclosureServicesPDF(formData);
      openDisclosureServicesPDFForPrint(pdfBytes);
      toast({
        title: "PDF Generated",
        description: "The form has been opened in a new tab for printing.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    setIsPrinting(true);
    try {
      const pdfBytes = await fillDisclosureServicesPDF(formData);
      downloadDisclosureServicesPDF(pdfBytes, formData.facilityInfo.facilityName);
      toast({
        title: "Downloaded",
        description: "The form has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Update form data helper
  const updateFormData = (
    section: keyof DisclosureServicesFormData,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  // Render current section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 1:
        return renderFacilityInfoSection();
      case 2:
        return renderServicesOverviewSection();
      case 3:
        return renderServicesProvidedSection();
      case 4:
        return renderAdditionalServicesSection();
      case 5:
        return renderSignaturesSection();
      default:
        return null;
    }
  };

  // Section 1: Facility Information
  const renderFacilityInfoSection = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="facilityName">Facility Name</Label>
          <Input
            id="facilityName"
            value={formData.facilityInfo.facilityName}
            onChange={(e) => updateFormData("facilityInfo", "facilityName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="licenseNumber">License Number</Label>
          <Input
            id="licenseNumber"
            value={formData.facilityInfo.licenseNumber}
            onChange={(e) => updateFormData("facilityInfo", "licenseNumber", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={formData.facilityInfo.address}
          onChange={(e) => updateFormData("facilityInfo", "address", e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.facilityInfo.city}
            onChange={(e) => updateFormData("facilityInfo", "city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.facilityInfo.state}
            onChange={(e) => updateFormData("facilityInfo", "state", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={formData.facilityInfo.zipCode}
            onChange={(e) => updateFormData("facilityInfo", "zipCode", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.facilityInfo.phone}
            onChange={(e) => updateFormData("facilityInfo", "phone", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.facilityInfo.email}
            onChange={(e) => updateFormData("facilityInfo", "email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.facilityInfo.date}
          onChange={(e) => updateFormData("facilityInfo", "date", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 2: Services Overview
  const renderServicesOverviewSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Facility Description</Label>
        <Textarea
          id="description"
          value={formData.servicesOverview.description}
          onChange={(e) => updateFormData("servicesOverview", "description", e.target.value)}
          rows={4}
          placeholder="Describe the facility and the care services provided..."
        />
      </div>

      <div>
        <Label htmlFor="hoursOfOperation">Hours of Operation</Label>
        <Input
          id="hoursOfOperation"
          value={formData.servicesOverview.hoursOfOperation}
          onChange={(e) => updateFormData("servicesOverview", "hoursOfOperation", e.target.value)}
          placeholder="e.g., 24 hours, 7 days a week"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacityLicensed">Licensed Capacity</Label>
          <Input
            id="capacityLicensed"
            value={formData.servicesOverview.capacityLicensed}
            onChange={(e) => updateFormData("servicesOverview", "capacityLicensed", e.target.value)}
            placeholder="e.g., 6 residents"
          />
        </div>
        <div>
          <Label htmlFor="caregiverToResidentRatio">Caregiver to Resident Ratio</Label>
          <Input
            id="caregiverToResidentRatio"
            value={formData.servicesOverview.caregiverToResidentRatio}
            onChange={(e) =>
              updateFormData("servicesOverview", "caregiverToResidentRatio", e.target.value)
            }
            placeholder="e.g., 1:3"
          />
        </div>
      </div>
    </div>
  );

  // Section 3: Services Provided
  const renderServicesProvidedSection = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">
        Check the services provided by your facility and add details as needed.
      </p>

      {/* Personal Care */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="personalCare"
              checked={formData.servicesProvided.personalCare}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "personalCare", !!checked)
              }
            />
            <Label htmlFor="personalCare" className="font-medium">
              Personal Care Assistance
            </Label>
          </div>
          {formData.servicesProvided.personalCare && (
            <Textarea
              value={formData.servicesProvided.personalCareDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "personalCareDetails", e.target.value)
              }
              placeholder="Describe personal care services (bathing, dressing, grooming, etc.)..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Medication Management */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="medicationManagement"
              checked={formData.servicesProvided.medicationManagement}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "medicationManagement", !!checked)
              }
            />
            <Label htmlFor="medicationManagement" className="font-medium">
              Medication Management
            </Label>
          </div>
          {formData.servicesProvided.medicationManagement && (
            <Textarea
              value={formData.servicesProvided.medicationDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "medicationDetails", e.target.value)
              }
              placeholder="Describe medication services (administration, reminders, storage, etc.)..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Meal Services */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="mealServices"
              checked={formData.servicesProvided.mealServices}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "mealServices", !!checked)
              }
            />
            <Label htmlFor="mealServices" className="font-medium">
              Meal Services
            </Label>
          </div>
          {formData.servicesProvided.mealServices && (
            <Textarea
              value={formData.servicesProvided.mealDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "mealDetails", e.target.value)
              }
              placeholder="Describe meal services (3 meals per day, snacks, dietary accommodations, etc.)..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Laundry */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="laundry"
              checked={formData.servicesProvided.laundry}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "laundry", !!checked)
              }
            />
            <Label htmlFor="laundry" className="font-medium">
              Laundry Services
            </Label>
          </div>
          {formData.servicesProvided.laundry && (
            <Textarea
              value={formData.servicesProvided.laundryDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "laundryDetails", e.target.value)
              }
              placeholder="Describe laundry services..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Housekeeping */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="housekeeping"
              checked={formData.servicesProvided.housekeeping}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "housekeeping", !!checked)
              }
            />
            <Label htmlFor="housekeeping" className="font-medium">
              Housekeeping
            </Label>
          </div>
          {formData.servicesProvided.housekeeping && (
            <Textarea
              value={formData.servicesProvided.housekeepingDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "housekeepingDetails", e.target.value)
              }
              placeholder="Describe housekeeping services..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Transportation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="transportation"
              checked={formData.servicesProvided.transportation}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "transportation", !!checked)
              }
            />
            <Label htmlFor="transportation" className="font-medium">
              Transportation
            </Label>
          </div>
          {formData.servicesProvided.transportation && (
            <Textarea
              value={formData.servicesProvided.transportationDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "transportationDetails", e.target.value)
              }
              placeholder="Describe transportation services (medical appointments, errands, etc.)..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="activities"
              checked={formData.servicesProvided.activities}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "activities", !!checked)
              }
            />
            <Label htmlFor="activities" className="font-medium">
              Activities & Recreation
            </Label>
          </div>
          {formData.servicesProvided.activities && (
            <Textarea
              value={formData.servicesProvided.activitiesDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "activitiesDetails", e.target.value)
              }
              placeholder="Describe activities and recreation programs..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Supervision */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-3">
            <Checkbox
              id="supervision"
              checked={formData.servicesProvided.supervision}
              onCheckedChange={(checked) =>
                updateFormData("servicesProvided", "supervision", !!checked)
              }
            />
            <Label htmlFor="supervision" className="font-medium">
              24-Hour Supervision
            </Label>
          </div>
          {formData.servicesProvided.supervision && (
            <Textarea
              value={formData.servicesProvided.supervisionDetails}
              onChange={(e) =>
                updateFormData("servicesProvided", "supervisionDetails", e.target.value)
              }
              placeholder="Describe supervision arrangements..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Section 4: Additional Services & Fees
  const renderAdditionalServicesSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="additionalServices">Additional Services Available</Label>
        <Textarea
          id="additionalServices"
          value={formData.additionalServices.services}
          onChange={(e) => updateFormData("additionalServices", "services", e.target.value)}
          rows={4}
          placeholder="List any additional services available beyond the basic rate..."
        />
      </div>

      <div>
        <Label htmlFor="fees">Additional Fees</Label>
        <Textarea
          id="fees"
          value={formData.additionalServices.fees}
          onChange={(e) => updateFormData("additionalServices", "fees", e.target.value)}
          rows={4}
          placeholder="List any additional fees and their amounts..."
        />
      </div>

      <div className="grid gap-4">
        {/* Special Diets */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Checkbox
                id="specialDiets"
                checked={formData.additionalServices.specialDiets}
                onCheckedChange={(checked) =>
                  updateFormData("additionalServices", "specialDiets", !!checked)
                }
              />
              <Label htmlFor="specialDiets" className="font-medium">
                Special Diets Available
              </Label>
            </div>
            {formData.additionalServices.specialDiets && (
              <Textarea
                value={formData.additionalServices.specialDietsDetails}
                onChange={(e) =>
                  updateFormData("additionalServices", "specialDietsDetails", e.target.value)
                }
                placeholder="Describe special diets (diabetic, low sodium, pureed, etc.)..."
                rows={2}
              />
            )}
          </CardContent>
        </Card>

        {/* Incontinence Care */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Checkbox
                id="incontinenceCare"
                checked={formData.additionalServices.incontinenceCare}
                onCheckedChange={(checked) =>
                  updateFormData("additionalServices", "incontinenceCare", !!checked)
                }
              />
              <Label htmlFor="incontinenceCare" className="font-medium">
                Incontinence Care
              </Label>
            </div>
            {formData.additionalServices.incontinenceCare && (
              <Textarea
                value={formData.additionalServices.incontinenceCareDetails}
                onChange={(e) =>
                  updateFormData("additionalServices", "incontinenceCareDetails", e.target.value)
                }
                placeholder="Describe incontinence care services..."
                rows={2}
              />
            )}
          </CardContent>
        </Card>

        {/* Behavior Support */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Checkbox
                id="behaviorSupport"
                checked={formData.additionalServices.behaviorSupport}
                onCheckedChange={(checked) =>
                  updateFormData("additionalServices", "behaviorSupport", !!checked)
                }
              />
              <Label htmlFor="behaviorSupport" className="font-medium">
                Behavior Support Services
              </Label>
            </div>
            {formData.additionalServices.behaviorSupport && (
              <Textarea
                value={formData.additionalServices.behaviorSupportDetails}
                onChange={(e) =>
                  updateFormData("additionalServices", "behaviorSupportDetails", e.target.value)
                }
                placeholder="Describe behavior support services..."
                rows={2}
              />
            )}
          </CardContent>
        </Card>

        {/* Nursing Services */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Checkbox
                id="nursingServices"
                checked={formData.additionalServices.nursingServices}
                onCheckedChange={(checked) =>
                  updateFormData("additionalServices", "nursingServices", !!checked)
                }
              />
              <Label htmlFor="nursingServices" className="font-medium">
                Nursing Services (Nurse Delegation)
              </Label>
            </div>
            {formData.additionalServices.nursingServices && (
              <Textarea
                value={formData.additionalServices.nursingServicesDetails}
                onChange={(e) =>
                  updateFormData("additionalServices", "nursingServicesDetails", e.target.value)
                }
                placeholder="Describe nursing services available..."
                rows={2}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Section 5: Signatures
  const renderSignaturesSection = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-amber-700">
          Enter the printed names below. Actual signatures will be added when the form is printed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resident / Representative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="residentPrintedName">Printed Name</Label>
              <Input
                id="residentPrintedName"
                value={formData.signatures.residentPrintedName}
                onChange={(e) => updateFormData("signatures", "residentPrintedName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="residentDate">Date</Label>
              <Input
                id="residentDate"
                type="date"
                value={formData.signatures.residentDate}
                onChange={(e) => updateFormData("signatures", "residentDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Responsible Party (if applicable)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rpPrintedName">Printed Name</Label>
              <Input
                id="rpPrintedName"
                value={formData.signatures.responsiblePartyPrintedName}
                onChange={(e) =>
                  updateFormData("signatures", "responsiblePartyPrintedName", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="rpDate">Date</Label>
              <Input
                id="rpDate"
                type="date"
                value={formData.signatures.responsiblePartyDate}
                onChange={(e) =>
                  updateFormData("signatures", "responsiblePartyDate", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider / Administrator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="providerPrintedName">Printed Name</Label>
              <Input
                id="providerPrintedName"
                value={formData.signatures.providerPrintedName}
                onChange={(e) =>
                  updateFormData("signatures", "providerPrintedName", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="providerDate">Date</Label>
              <Input
                id="providerDate"
                type="date"
                value={formData.signatures.providerDate}
                onChange={(e) => updateFormData("signatures", "providerDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print/Download Section */}
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official Disclosure of Services form with your data.
            The PDF will be ready for printing and signing.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Print Form
            </Button>
            <Button onClick={handleDownload} disabled={isPrinting} variant="outline">
              {isPrinting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loadingForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p>Loading form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-teal-600" />
              <div>
                <CardTitle>Disclosure of Services</CardTitle>
                <p className="text-sm text-gray-500">
                  {formData.facilityInfo.facilityName || "New Form"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{calculateCompletion()}% Complete</Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Progress value={calculateCompletion()} className="mt-3" />
        </CardHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-gray-50 p-4 overflow-y-auto hidden md:block">
            <nav className="space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = currentSection === section.id;
                const isCompleted = currentSection > section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      isActive
                        ? "bg-teal-100 text-teal-800"
                        : isCompleted
                        ? "text-green-700 hover:bg-gray-100"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-teal-600 text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-xs">{section.id}</span>
                      )}
                    </div>
                    <span className="truncate">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                {(() => {
                  const Icon = SECTIONS[currentSection - 1].icon;
                  return <Icon className="h-5 w-5 text-teal-600" />;
                })()}
                {SECTIONS[currentSection - 1].title}
              </h2>

              {renderSectionContent()}
            </div>
          </main>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setCurrentSection((prev) => Math.max(1, prev - 1))}
            disabled={currentSection === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>

            {currentSection < SECTIONS.length ? (
              <Button
                onClick={() => setCurrentSection((prev) => Math.min(SECTIONS.length, prev + 1))}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
                <Printer className="h-4 w-4 mr-2" />
                Print Form
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
