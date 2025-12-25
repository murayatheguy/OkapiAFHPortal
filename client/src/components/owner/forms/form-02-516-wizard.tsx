import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  fillForm02516PDF,
  downloadForm02516PDF,
  openForm02516PDFForPrint,
} from "@/lib/forms/form-02-516-pdf";
import {
  type Form02516Data,
  getInitialForm02516Data,
} from "@/lib/forms/form-02-516-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Building2,
  User,
  ClipboardList,
  PenTool,
  Loader2,
  X,
  Printer,
  Download,
  FileText,
} from "lucide-react";

const SECTIONS = [
  { id: 1, title: "Facility Info", key: "facilityInfo", icon: Building2 },
  { id: 2, title: "Client Info", key: "clientInfo", icon: User },
  { id: 3, title: "Service Info", key: "serviceInfo", icon: ClipboardList },
  { id: 4, title: "Signatures", key: "signatures", icon: PenTool },
];

interface Form02516WizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function Form02516Wizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: Form02516WizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<Form02516Data>(getInitialForm02516Data());
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
        formType: "form_02_516",
        formTitle: `02-516 - ${formData.clientInfo.clientName || "New"}`,
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
      const pdfBytes = await fillForm02516PDF(formData);
      openForm02516PDFForPrint(pdfBytes);
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
      const pdfBytes = await fillForm02516PDF(formData);
      downloadForm02516PDF(pdfBytes, formData.clientInfo.clientName);
      toast({ title: "Downloaded", description: "The form has been downloaded." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  const updateFormData = (section: keyof Form02516Data, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 1: return renderFacilityInfoSection();
      case 2: return renderClientInfoSection();
      case 3: return renderServiceInfoSection();
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

  const renderClientInfoSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="clientName">Client Name</Label>
        <Input
          id="clientName"
          value={formData.clientInfo.clientName}
          onChange={(e) => updateFormData("clientInfo", "clientName", e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.clientInfo.dateOfBirth}
            onChange={(e) => updateFormData("clientInfo", "dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="caseNumber">Case Number</Label>
          <Input
            id="caseNumber"
            value={formData.clientInfo.caseNumber}
            onChange={(e) => updateFormData("clientInfo", "caseNumber", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderServiceInfoSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="serviceType">Service Type</Label>
        <Input
          id="serviceType"
          value={formData.serviceInfo.serviceType}
          onChange={(e) => updateFormData("serviceInfo", "serviceType", e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.serviceInfo.startDate}
            onChange={(e) => updateFormData("serviceInfo", "startDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.serviceInfo.endDate}
            onChange={(e) => updateFormData("serviceInfo", "endDate", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          value={formData.serviceInfo.comments}
          onChange={(e) => updateFormData("serviceInfo", "comments", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );

  const renderSignaturesSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Signatures will be added when the form is printed. Enter the dates for when signatures will be collected.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="clientDate">Date</Label>
            <Input
              id="clientDate"
              type="date"
              value={formData.signatures.clientDate}
              onChange={(e) => updateFormData("signatures", "clientDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="providerDate">Date</Label>
            <Input
              id="providerDate"
              type="date"
              value={formData.signatures.providerDate}
              onChange={(e) => updateFormData("signatures", "providerDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official DSHS 02-516 form with your data.
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
              <FileText className="h-6 w-6 text-teal-600" />
              <div>
                <CardTitle>DSHS 02-516 Service Authorization</CardTitle>
                <p className="text-sm text-gray-500">{formData.clientInfo.clientName || "New Form"}</p>
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
