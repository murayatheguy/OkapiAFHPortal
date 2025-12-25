import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  fillAbuseNeglect10403PDF,
  downloadAbuseNeglect10403PDF,
  openAbuseNeglect10403PDFForPrint,
} from "@/lib/forms/abuse-neglect-10403-pdf";
import {
  type AbuseNeglect10403Data,
  getInitialAbuseNeglect10403Data,
} from "@/lib/forms/abuse-neglect-10403-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Building2,
  User,
  AlertTriangle,
  PenTool,
  Loader2,
  X,
  Printer,
  Download,
  FileText,
} from "lucide-react";

const SECTIONS = [
  { id: 1, title: "Facility Info", key: "facilityInfo", icon: Building2 },
  { id: 2, title: "Resident Info", key: "residentInfo", icon: User },
  { id: 3, title: "Incident Details", key: "incidentInfo", icon: AlertTriangle },
  { id: 4, title: "Signatures", key: "signatures", icon: PenTool },
];

interface AbuseNeglect10403WizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function AbuseNeglect10403Wizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: AbuseNeglect10403WizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<AbuseNeglect10403Data>(getInitialAbuseNeglect10403Data());
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
        formType: "abuse_neglect_10403",
        formTitle: `Abuse/Neglect 10-403 - ${formData.residentInfo.residentName || "New"}`,
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
      const pdfBytes = await fillAbuseNeglect10403PDF(formData);
      openAbuseNeglect10403PDFForPrint(pdfBytes);
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
      const pdfBytes = await fillAbuseNeglect10403PDF(formData);
      downloadAbuseNeglect10403PDF(pdfBytes, formData.residentInfo.residentName);
      toast({ title: "Downloaded", description: "The form has been downloaded." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  const updateFormData = (section: keyof AbuseNeglect10403Data, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 1: return renderFacilityInfoSection();
      case 2: return renderResidentInfoSection();
      case 3: return renderIncidentInfoSection();
      case 4: return renderSignaturesSection();
      default: return null;
    }
  };

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
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.facilityInfo.address}
            onChange={(e) => updateFormData("facilityInfo", "address", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.facilityInfo.phone}
            onChange={(e) => updateFormData("facilityInfo", "phone", e.target.value)}
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

  const renderResidentInfoSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="residentName">Resident Name</Label>
        <Input
          id="residentName"
          value={formData.residentInfo.residentName}
          onChange={(e) => updateFormData("residentInfo", "residentName", e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.residentInfo.dateOfBirth}
            onChange={(e) => updateFormData("residentInfo", "dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input
            id="roomNumber"
            value={formData.residentInfo.roomNumber}
            onChange={(e) => updateFormData("residentInfo", "roomNumber", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderIncidentInfoSection = () => (
    <div className="space-y-6">
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm text-red-700 font-medium">
          This form is used to report suspected abuse, neglect, exploitation, or abandonment incidents.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="incidentDate">Incident Date</Label>
          <Input
            id="incidentDate"
            type="date"
            value={formData.incidentInfo.incidentDate}
            onChange={(e) => updateFormData("incidentInfo", "incidentDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="incidentTime">Incident Time</Label>
          <Input
            id="incidentTime"
            type="time"
            value={formData.incidentInfo.incidentTime}
            onChange={(e) => updateFormData("incidentInfo", "incidentTime", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label className="text-base font-medium">Incident Type</Label>
        <RadioGroup
          value={formData.incidentInfo.incidentType}
          onValueChange={(value) => updateFormData("incidentInfo", "incidentType", value)}
          className="mt-2 grid grid-cols-2 gap-4"
        >
          {[
            { value: "abuse", label: "Abuse" },
            { value: "neglect", label: "Neglect" },
            { value: "exploitation", label: "Exploitation" },
            { value: "abandonment", label: "Abandonment" },
          ].map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem value={type.value} id={`incident-${type.value}`} />
              <Label htmlFor={`incident-${type.value}`}>{type.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="description">Description of Incident</Label>
        <Textarea
          id="description"
          value={formData.incidentInfo.description}
          onChange={(e) => updateFormData("incidentInfo", "description", e.target.value)}
          rows={4}
          placeholder="Describe what happened in detail..."
        />
      </div>
      <div>
        <Label htmlFor="actionsTaken">Actions Taken</Label>
        <Textarea
          id="actionsTaken"
          value={formData.incidentInfo.actionsTaken}
          onChange={(e) => updateFormData("incidentInfo", "actionsTaken", e.target.value)}
          rows={3}
          placeholder="Describe any actions taken in response..."
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reportedTo">Reported To</Label>
          <Input
            id="reportedTo"
            value={formData.incidentInfo.reportedTo}
            onChange={(e) => updateFormData("incidentInfo", "reportedTo", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reportedDate">Date Reported</Label>
          <Input
            id="reportedDate"
            type="date"
            value={formData.incidentInfo.reportedDate}
            onChange={(e) => updateFormData("incidentInfo", "reportedDate", e.target.value)}
          />
        </div>
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
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reporterPrintedName">Reporter's Printed Name</Label>
          <Input
            id="reporterPrintedName"
            value={formData.signatures.reporterPrintedName}
            onChange={(e) => updateFormData("signatures", "reporterPrintedName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reporterTitle">Reporter's Title</Label>
          <Input
            id="reporterTitle"
            value={formData.signatures.reporterTitle}
            onChange={(e) => updateFormData("signatures", "reporterTitle", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reporterDate">Date</Label>
        <Input
          id="reporterDate"
          type="date"
          value={formData.signatures.reporterDate}
          onChange={(e) => updateFormData("signatures", "reporterDate", e.target.value)}
        />
      </div>
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official DSHS 10-403 Abuse and Neglect report form.
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
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle>DSHS 10-403 Abuse and Neglect Report</CardTitle>
                <p className="text-sm text-gray-500">{formData.residentInfo.residentName || "New Form"}</p>
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
