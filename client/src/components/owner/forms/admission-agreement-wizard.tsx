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
  fillAdmissionAgreementPDF,
  downloadAdmissionAgreementPDF,
  openAdmissionAgreementPDFForPrint,
} from "@/lib/forms/admission-agreement-pdf";
import {
  type AdmissionAgreementFormData,
  getInitialAdmissionAgreementData,
} from "@/lib/forms/admission-agreement-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Building2,
  User,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  Shield,
  PenLine,
  Loader2,
  X,
  Printer,
  Download,
} from "lucide-react";

// Form Sections
const SECTIONS = [
  { id: 1, title: "Facility Information", key: "facilityInfo", icon: Building2 },
  { id: 2, title: "Resident Information", key: "residentInfo", icon: User },
  { id: 3, title: "Responsible Party", key: "responsibleParty", icon: Users },
  { id: 4, title: "Services & Rates", key: "services", icon: DollarSign },
  { id: 5, title: "Payment Terms", key: "paymentTerms", icon: CreditCard },
  { id: 6, title: "Policies", key: "policies", icon: FileText },
  { id: 7, title: "Rights & Acknowledgements", key: "rights", icon: Shield },
  { id: 8, title: "Signatures", key: "signatures", icon: PenLine },
];

interface AdmissionAgreementWizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function AdmissionAgreementWizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: AdmissionAgreementWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<AdmissionAgreementFormData>(
    getInitialAdmissionAgreementData()
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
        formType: "admission_agreement",
        formTitle: `Admission Agreement - ${formData.residentInfo.residentName || "New"}`,
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
      const pdfBytes = await fillAdmissionAgreementPDF(formData);
      openAdmissionAgreementPDFForPrint(pdfBytes);
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
      const pdfBytes = await fillAdmissionAgreementPDF(formData);
      downloadAdmissionAgreementPDF(pdfBytes, formData.residentInfo.residentName);
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
    section: keyof AdmissionAgreementFormData,
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
        return renderResidentInfoSection();
      case 3:
        return renderResponsiblePartySection();
      case 4:
        return renderServicesSection();
      case 5:
        return renderPaymentTermsSection();
      case 6:
        return renderPoliciesSection();
      case 7:
        return renderRightsSection();
      case 8:
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
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.facilityInfo.address}
          onChange={(e) => updateFormData("facilityInfo", "address", e.target.value)}
        />
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
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.facilityInfo.date}
            onChange={(e) => updateFormData("facilityInfo", "date", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Section 2: Resident Information
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
          <Label htmlFor="ssn">Social Security Number (last 4 digits)</Label>
          <Input
            id="ssn"
            value={formData.residentInfo.ssn}
            onChange={(e) => updateFormData("residentInfo", "ssn", e.target.value)}
            placeholder="XXX-XX-____"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="admissionDate">Admission Date</Label>
        <Input
          id="admissionDate"
          type="date"
          value={formData.residentInfo.admissionDate}
          onChange={(e) => updateFormData("residentInfo", "admissionDate", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 3: Responsible Party
  const renderResponsiblePartySection = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rpName">Name</Label>
          <Input
            id="rpName"
            value={formData.responsibleParty.name}
            onChange={(e) => updateFormData("responsibleParty", "name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="relationship">Relationship to Resident</Label>
          <Input
            id="relationship"
            value={formData.responsibleParty.relationship}
            onChange={(e) => updateFormData("responsibleParty", "relationship", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rpAddress">Address</Label>
        <Input
          id="rpAddress"
          value={formData.responsibleParty.address}
          onChange={(e) => updateFormData("responsibleParty", "address", e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rpPhone">Phone</Label>
          <Input
            id="rpPhone"
            value={formData.responsibleParty.phone}
            onChange={(e) => updateFormData("responsibleParty", "phone", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rpEmail">Email</Label>
          <Input
            id="rpEmail"
            type="email"
            value={formData.responsibleParty.email}
            onChange={(e) => updateFormData("responsibleParty", "email", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Section 4: Services & Rates
  const renderServicesSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="roomType">Room Type / Accommodation</Label>
        <Input
          id="roomType"
          value={formData.services.roomType}
          onChange={(e) => updateFormData("services", "roomType", e.target.value)}
          placeholder="e.g., Private Room, Shared Room"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="baseMonthlyRate">Base Monthly Rate ($)</Label>
          <Input
            id="baseMonthlyRate"
            type="number"
            value={formData.services.baseMonthlyRate}
            onChange={(e) => updateFormData("services", "baseMonthlyRate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="totalMonthlyRate">Total Monthly Rate ($)</Label>
          <Input
            id="totalMonthlyRate"
            type="number"
            value={formData.services.totalMonthlyRate}
            onChange={(e) => updateFormData("services", "totalMonthlyRate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="additionalServices">Additional Services Included</Label>
        <Textarea
          id="additionalServices"
          value={formData.services.additionalServices}
          onChange={(e) => updateFormData("services", "additionalServices", e.target.value)}
          rows={4}
          placeholder="List additional services included in the rate..."
        />
      </div>

      <div>
        <Label htmlFor="rateEffectiveDate">Rate Effective Date</Label>
        <Input
          id="rateEffectiveDate"
          type="date"
          value={formData.services.rateEffectiveDate}
          onChange={(e) => updateFormData("services", "rateEffectiveDate", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 5: Payment Terms
  const renderPaymentTermsSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="paymentDueDate">Payment Due Date</Label>
        <Input
          id="paymentDueDate"
          value={formData.paymentTerms.paymentDueDate}
          onChange={(e) => updateFormData("paymentTerms", "paymentDueDate", e.target.value)}
          placeholder="e.g., 1st of each month"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
          <Input
            id="depositAmount"
            type="number"
            value={formData.paymentTerms.depositAmount}
            onChange={(e) => updateFormData("paymentTerms", "depositAmount", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="depositPurpose">Deposit Purpose</Label>
          <Input
            id="depositPurpose"
            value={formData.paymentTerms.depositPurpose}
            onChange={(e) => updateFormData("paymentTerms", "depositPurpose", e.target.value)}
            placeholder="e.g., Security deposit, Last month's rent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lateFee">Late Fee ($)</Label>
          <Input
            id="lateFee"
            type="number"
            value={formData.paymentTerms.lateFee}
            onChange={(e) => updateFormData("paymentTerms", "lateFee", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="gracePeriod">Grace Period (days)</Label>
          <Input
            id="gracePeriod"
            value={formData.paymentTerms.lateFeeGracePeriod}
            onChange={(e) => updateFormData("paymentTerms", "lateFeeGracePeriod", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="paymentMethods">Accepted Payment Methods</Label>
        <Input
          id="paymentMethods"
          value={formData.paymentTerms.paymentMethods}
          onChange={(e) => updateFormData("paymentTerms", "paymentMethods", e.target.value)}
          placeholder="e.g., Check, Credit Card, ACH Transfer"
        />
      </div>

      <div>
        <Label htmlFor="nsfFee">NSF/Returned Check Fee ($)</Label>
        <Input
          id="nsfFee"
          type="number"
          value={formData.paymentTerms.nsfFee}
          onChange={(e) => updateFormData("paymentTerms", "nsfFee", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 6: Policies
  const renderPoliciesSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="dischargePolicies">Discharge Policies</Label>
        <Textarea
          id="dischargePolicies"
          value={formData.policies.dischargePolicies}
          onChange={(e) => updateFormData("policies", "dischargePolicies", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="voluntaryDischargeNotice">Voluntary Discharge Notice Period (days)</Label>
        <Input
          id="voluntaryDischargeNotice"
          value={formData.policies.voluntaryDischargeNotice}
          onChange={(e) => updateFormData("policies", "voluntaryDischargeNotice", e.target.value)}
          placeholder="e.g., 30 days"
        />
      </div>

      <div>
        <Label htmlFor="involuntaryDischargeReasons">Involuntary Discharge Reasons</Label>
        <Textarea
          id="involuntaryDischargeReasons"
          value={formData.policies.involuntaryDischargeReasons}
          onChange={(e) => updateFormData("policies", "involuntaryDischargeReasons", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="refundPolicy">Refund Policy</Label>
        <Textarea
          id="refundPolicy"
          value={formData.policies.refundPolicy}
          onChange={(e) => updateFormData("policies", "refundPolicy", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="personalPropertyPolicy">Personal Property Policy</Label>
        <Textarea
          id="personalPropertyPolicy"
          value={formData.policies.personalPropertyPolicy}
          onChange={(e) => updateFormData("policies", "personalPropertyPolicy", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="valuablesPolicy">Valuables Policy</Label>
        <Textarea
          id="valuablesPolicy"
          value={formData.policies.valuablesPolicy}
          onChange={(e) => updateFormData("policies", "valuablesPolicy", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );

  // Section 7: Rights & Acknowledgements
  const renderRightsSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-700">
          Please review and acknowledge that the resident/responsible party has received
          and understands the following information.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="rightsAcknowledged"
              checked={formData.rightsAcknowledged}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, rightsAcknowledged: !!checked }))
              }
            />
            <div>
              <Label htmlFor="rightsAcknowledged" className="font-medium">
                Resident Rights
              </Label>
              <p className="text-sm text-gray-600">
                I acknowledge receiving a copy of the Resident Rights document and understand
                my rights as a resident of this Adult Family Home.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="responsibilitiesAcknowledged"
              checked={formData.responsibilitiesAcknowledged}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, responsibilitiesAcknowledged: !!checked }))
              }
            />
            <div>
              <Label htmlFor="responsibilitiesAcknowledged" className="font-medium">
                Resident Responsibilities
              </Label>
              <p className="text-sm text-gray-600">
                I acknowledge receiving information about my responsibilities as a resident,
                including rules of the home and expectations for behavior.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="grievanceProcedureAcknowledged"
              checked={formData.grievanceProcedureAcknowledged}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, grievanceProcedureAcknowledged: !!checked }))
              }
            />
            <div>
              <Label htmlFor="grievanceProcedureAcknowledged" className="font-medium">
                Grievance Procedure
              </Label>
              <p className="text-sm text-gray-600">
                I acknowledge receiving information about the grievance procedure and
                understand how to file a complaint if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Section 8: Signatures
  const renderSignaturesSection = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-amber-700">
          Enter the printed names below. Actual signatures will be added when the form is printed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resident</CardTitle>
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
              <Label htmlFor="providerTitle">Title</Label>
              <Input
                id="providerTitle"
                value={formData.signatures.providerTitle}
                onChange={(e) => updateFormData("signatures", "providerTitle", e.target.value)}
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Print/Download Section */}
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official DSHS 10-270 Admission Agreement with your data.
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
                <CardTitle>DSHS 10-270 Admission Agreement</CardTitle>
                <p className="text-sm text-gray-500">
                  {formData.residentInfo.residentName || "New Admission"}
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
