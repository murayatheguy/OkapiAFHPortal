import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  fillHIPAAPDF,
  downloadHIPAAPDF,
  openHIPAAPDFForPrint,
} from "@/lib/forms/hipaa-pdf";
import {
  type HIPAAFormData,
  getInitialHIPAAData,
} from "@/lib/forms/hipaa-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  User,
  FileText,
  Shield,
  Clock,
  PenTool,
  Loader2,
  X,
  Printer,
  Download,
  Lock,
} from "lucide-react";

const SECTIONS = [
  { id: 1, title: "Patient Info", key: "patientInfo", icon: User },
  { id: 2, title: "Authorization Details", key: "authorizationDetails", icon: FileText },
  { id: 3, title: "Restrictions", key: "restrictions", icon: Shield },
  { id: 4, title: "Expiration", key: "expiration", icon: Clock },
  { id: 5, title: "Signatures", key: "signatures", icon: PenTool },
];

const DISCLOSURE_OPTIONS = [
  "Medical Records",
  "Mental Health Records",
  "HIV/AIDS Information",
  "Drug/Alcohol Treatment",
  "Billing Information",
  "Lab Results",
  "Imaging Results",
  "Prescription History",
  "Progress Notes",
  "Discharge Summary",
];

interface HIPAAWizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function HIPAAWizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: HIPAAWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<HIPAAFormData>(getInitialHIPAAData());
  const [isPrinting, setIsPrinting] = useState(false);
  const [formId, setFormId] = useState<number | null>(existingFormId || null);

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
        } else if (Array.isArray(value)) {
          total++;
          if (value.length > 0) filled++;
        }
      }
    };
    countFields(formData);
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!facilityId) throw new Error("Facility ID required");
      const payload = {
        residentId: residentId || null,
        formType: "hipaa_authorization",
        formTitle: `HIPAA Authorization - ${formData.patientInfo.patientName || "New"}`,
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
      if (!formId && data.id) setFormId(data.id);
      queryClient.invalidateQueries({ queryKey: ["form-submissions"] });
      toast({ title: "Saved", description: "Form progress saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const pdfBytes = await fillHIPAAPDF(formData);
      openHIPAAPDFForPrint(pdfBytes);
      toast({ title: "PDF Generated", description: "The form has been opened for printing." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    setIsPrinting(true);
    try {
      const pdfBytes = await fillHIPAAPDF(formData);
      downloadHIPAAPDF(pdfBytes, formData.patientInfo.patientName);
      toast({ title: "Downloaded", description: "The form has been downloaded." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  const updateFormData = (section: keyof HIPAAFormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const toggleDisclosureOption = (option: string) => {
    setFormData((prev) => {
      const current = prev.authorizationDetails.informationToDisclose;
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return {
        ...prev,
        authorizationDetails: {
          ...prev.authorizationDetails,
          informationToDisclose: updated,
        },
      };
    });
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 1: return renderPatientInfoSection();
      case 2: return renderAuthorizationDetailsSection();
      case 3: return renderRestrictionsSection();
      case 4: return renderExpirationSection();
      case 5: return renderSignaturesSection();
      default: return null;
    }
  };

  const renderPatientInfoSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          This HIPAA authorization allows the release of protected health information.
        </p>
      </div>
      <div>
        <Label htmlFor="patientName">Patient Name</Label>
        <Input
          id="patientName"
          value={formData.patientInfo.patientName}
          onChange={(e) => updateFormData("patientInfo", "patientName", e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.patientInfo.dateOfBirth}
            onChange={(e) => updateFormData("patientInfo", "dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.patientInfo.phone}
            onChange={(e) => updateFormData("patientInfo", "phone", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.patientInfo.address}
          onChange={(e) => updateFormData("patientInfo", "address", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="socialSecurityNumber">Social Security Number (Last 4 digits)</Label>
        <Input
          id="socialSecurityNumber"
          value={formData.patientInfo.socialSecurityNumber}
          onChange={(e) => updateFormData("patientInfo", "socialSecurityNumber", e.target.value)}
          placeholder="XXX-XX-1234"
        />
      </div>
    </div>
  );

  const renderAuthorizationDetailsSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="authorizedParties">Authorized Parties (Who can receive information)</Label>
        <Textarea
          id="authorizedParties"
          value={formData.authorizationDetails.authorizedParties}
          onChange={(e) => updateFormData("authorizationDetails", "authorizedParties", e.target.value)}
          rows={3}
          placeholder="Names and/or organizations authorized to receive information..."
        />
      </div>
      <div>
        <Label htmlFor="purposeOfDisclosure">Purpose of Disclosure</Label>
        <Textarea
          id="purposeOfDisclosure"
          value={formData.authorizationDetails.purposeOfDisclosure}
          onChange={(e) => updateFormData("authorizationDetails", "purposeOfDisclosure", e.target.value)}
          rows={2}
          placeholder="Reason for releasing information..."
        />
      </div>
      <div>
        <Label className="text-base font-medium mb-3 block">Information to Disclose</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {DISCLOSURE_OPTIONS.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`disclosure-${option}`}
                checked={formData.authorizationDetails.informationToDisclose.includes(option)}
                onCheckedChange={() => toggleDisclosureOption(option)}
              />
              <Label htmlFor={`disclosure-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="otherInformation">Other Information (specify)</Label>
        <Textarea
          id="otherInformation"
          value={formData.authorizationDetails.otherInformation}
          onChange={(e) => updateFormData("authorizationDetails", "otherInformation", e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );

  const renderRestrictionsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasRestrictions"
          checked={formData.restrictions.hasRestrictions}
          onCheckedChange={(checked) => updateFormData("restrictions", "hasRestrictions", checked)}
        />
        <Label htmlFor="hasRestrictions" className="text-base">
          I want to place restrictions on the disclosure of my information
        </Label>
      </div>
      {formData.restrictions.hasRestrictions && (
        <div>
          <Label htmlFor="restrictionDetails">Restriction Details</Label>
          <Textarea
            id="restrictionDetails"
            value={formData.restrictions.restrictionDetails}
            onChange={(e) => updateFormData("restrictions", "restrictionDetails", e.target.value)}
            rows={4}
            placeholder="Describe any restrictions on what information can be disclosed..."
          />
        </div>
      )}
    </div>
  );

  const renderExpirationSection = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg">
        <p className="text-sm text-amber-700">
          This authorization will expire on a specific date or upon a specific event.
        </p>
      </div>
      <div>
        <Label htmlFor="expirationDate">Expiration Date</Label>
        <Input
          id="expirationDate"
          type="date"
          value={formData.expiration.expirationDate}
          onChange={(e) => updateFormData("expiration", "expirationDate", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="expirationEvent">Or Expiration Event</Label>
        <Input
          id="expirationEvent"
          value={formData.expiration.expirationEvent}
          onChange={(e) => updateFormData("expiration", "expirationEvent", e.target.value)}
          placeholder="e.g., Upon completion of treatment"
        />
      </div>
    </div>
  );

  const renderSignaturesSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Signatures will be added when the form is printed.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient/Representative Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="patientPrintedName">Printed Name</Label>
            <Input
              id="patientPrintedName"
              value={formData.signatures.patientPrintedName}
              onChange={(e) => updateFormData("signatures", "patientPrintedName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="patientDate">Date</Label>
            <Input
              id="patientDate"
              type="date"
              value={formData.signatures.patientDate}
              onChange={(e) => updateFormData("signatures", "patientDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Witness Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="witnessPrintedName">Printed Name</Label>
            <Input
              id="witnessPrintedName"
              value={formData.signatures.witnessPrintedName}
              onChange={(e) => updateFormData("signatures", "witnessPrintedName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="witnessDate">Date</Label>
            <Input
              id="witnessDate"
              type="date"
              value={formData.signatures.witnessDate}
              onChange={(e) => updateFormData("signatures", "witnessDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official DSHS 03-387a HIPAA Authorization form.
          </p>
          <div className="flex gap-3">
            <Button onClick={handlePrint} disabled={isPrinting} className="bg-teal-600 hover:bg-teal-700">
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Print Form
            </Button>
            <Button onClick={handleDownload} disabled={isPrinting} variant="outline">
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
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
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>DSHS 03-387a HIPAA Authorization</CardTitle>
                <p className="text-sm text-gray-500">{formData.patientInfo.patientName || "New Form"}</p>
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
          <aside className="w-56 border-r bg-gray-50 p-4 overflow-y-auto hidden md:block">
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
                      isActive ? "bg-teal-100 text-teal-800" : isCompleted ? "text-green-700 hover:bg-gray-100" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive ? "bg-teal-600 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{section.id}</span>}
                    </div>
                    <span className="truncate">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                {(() => { const Icon = SECTIONS[currentSection - 1].icon; return <Icon className="h-5 w-5 text-teal-600" />; })()}
                {SECTIONS[currentSection - 1].title}
              </h2>
              {renderSectionContent()}
            </div>
          </main>
        </div>

        <div className="border-t p-4 flex items-center justify-between flex-shrink-0">
          <Button variant="outline" onClick={() => setCurrentSection((prev) => Math.max(1, prev - 1))} disabled={currentSection === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            {currentSection < SECTIONS.length ? (
              <Button onClick={() => setCurrentSection((prev) => Math.min(SECTIONS.length, prev + 1))} className="bg-teal-600 hover:bg-teal-700">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
                <Printer className="h-4 w-4 mr-2" /> Print Form
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
