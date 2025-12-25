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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  fillNurseDelegationPDF,
  downloadNurseDelegationPDF,
  openNurseDelegationPDFForPrint,
} from "@/lib/forms/nurse-delegation-pdf";
import {
  type NurseDelegationFormData,
  getInitialNurseDelegationData,
} from "@/lib/forms/nurse-delegation-types";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Circle,
  Building2,
  Send,
  User,
  UserCheck,
  CheckCircle,
  Briefcase,
  Stethoscope,
  ClipboardList,
  Loader2,
  X,
  Printer,
  Download,
  FileText,
} from "lucide-react";

// Form Sections
const SECTIONS = [
  { id: 1, title: "Referral Source", key: "referralSource", icon: Building2 },
  { id: 2, title: "Referral Routing", key: "referralRouting", icon: Send },
  { id: 3, title: "Client Information", key: "clientInfo", icon: User },
  { id: 4, title: "Case Manager", key: "caseManager", icon: UserCheck },
  { id: 5, title: "Confirmation", key: "confirmation", icon: CheckCircle },
  { id: 6, title: "CRM Info", key: "crmInfo", icon: Briefcase },
  { id: 7, title: "RND Info", key: "rndInfo", icon: Stethoscope },
  { id: 8, title: "Assessment", key: "assessment", icon: ClipboardList },
];

interface NurseDelegationWizardProps {
  facilityId?: string;
  residentId?: string;
  existingFormId?: number;
  onClose: () => void;
}

export function NurseDelegationWizard({
  facilityId,
  residentId,
  existingFormId,
  onClose,
}: NurseDelegationWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<NurseDelegationFormData>(
    getInitialNurseDelegationData()
  );
  const [isSaving, setIsSaving] = useState(false);
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

    // Count filled fields in each section
    const countFields = (obj: any, prefix = ""): void => {
      for (const key in obj) {
        const value = obj[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          countFields(value, `${prefix}${key}.`);
        } else if (typeof value === "string") {
          total++;
          if (value.trim() !== "") filled++;
        } else if (typeof value === "boolean") {
          // Booleans don't count toward completion
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
        formType: "nurse_delegation",
        formTitle: `Nurse Delegation - ${formData.clientInfo.clientName || "New"}`,
        status: "draft",
        currentSection,
        totalSections: SECTIONS.length,
        completionPercentage: calculateCompletion(),
        formData: JSON.stringify(formData),
      };

      if (formId) {
        // Update existing
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
        // Create new
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
      const pdfBytes = await fillNurseDelegationPDF(formData);
      openNurseDelegationPDFForPrint(pdfBytes);
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
      const pdfBytes = await fillNurseDelegationPDF(formData);
      downloadNurseDelegationPDF(pdfBytes, formData.clientInfo.clientName);
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
    section: keyof NurseDelegationFormData,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Update nested form data helper
  const updateNestedFormData = (
    section: keyof NurseDelegationFormData,
    parent: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...(prev[section] as any)[parent],
          [field]: value,
        },
      },
    }));
  };

  // Render current section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 1:
        return renderReferralSourceSection();
      case 2:
        return renderReferralRoutingSection();
      case 3:
        return renderClientInfoSection();
      case 4:
        return renderCaseManagerSection();
      case 5:
        return renderConfirmationSection();
      case 6:
        return renderCrmInfoSection();
      case 7:
        return renderRndInfoSection();
      case 8:
        return renderAssessmentSection();
      default:
        return null;
    }
  };

  // Section 1: Referral Source
  const renderReferralSourceSection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Office Type</Label>
        <RadioGroup
          value={formData.referralSource.officeType}
          onValueChange={(value) =>
            updateFormData("referralSource", "officeType", value)
          }
          className="mt-2 grid grid-cols-2 gap-4"
        >
          {["HCS", "AAA", "DDA", "Other"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={`office-${type}`} />
              <Label htmlFor={`office-${type}`}>{type}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {formData.referralSource.officeType === "Other" && (
        <div>
          <Label htmlFor="otherOffice">Specify Office</Label>
          <Input
            id="otherOffice"
            value={formData.referralSource.otherOfficeSpecify}
            onChange={(e) =>
              updateFormData("referralSource", "otherOfficeSpecify", e.target.value)
            }
            placeholder="Enter office name"
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="authNumber">Authorization Number for Nurse Delegation</Label>
          <Input
            id="authNumber"
            value={formData.referralSource.authorizationNumber}
            onChange={(e) =>
              updateFormData("referralSource", "authorizationNumber", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="rnProviderId">RN ProviderOne ID</Label>
          <Input
            id="rnProviderId"
            value={formData.referralSource.rnProviderOneId}
            onChange={(e) =>
              updateFormData("referralSource", "rnProviderOneId", e.target.value)
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="referralDate">Date of Referral</Label>
        <Input
          id="referralDate"
          type="date"
          value={formData.referralSource.dateOfReferral}
          onChange={(e) =>
            updateFormData("referralSource", "dateOfReferral", e.target.value)
          }
        />
      </div>
    </div>
  );

  // Section 2: Referral Routing
  const renderReferralRoutingSection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Referral Method</Label>
        <div className="mt-2 flex flex-wrap gap-4">
          {[
            { key: "email", label: "Email" },
            { key: "telephone", label: "Telephone" },
            { key: "fax", label: "Fax" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`method-${key}`}
                checked={
                  formData.referralRouting.referralMethod[
                    key as keyof typeof formData.referralRouting.referralMethod
                  ]
                }
                onCheckedChange={(checked) =>
                  updateNestedFormData("referralRouting", "referralMethod", key, checked)
                }
              />
              <Label htmlFor={`method-${key}`}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">To: Nurse Delegator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="toAgency">Nurse Delegator / Agency</Label>
            <Input
              id="toAgency"
              value={formData.referralRouting.to.nurseDelegatorAgency}
              onChange={(e) =>
                updateNestedFormData("referralRouting", "to", "nurseDelegatorAgency", e.target.value)
              }
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="toPhone">Telephone</Label>
              <Input
                id="toPhone"
                value={formData.referralRouting.to.telephone}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "to", "telephone", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="toFax">Fax</Label>
              <Input
                id="toFax"
                value={formData.referralRouting.to.fax}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "to", "fax", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="toEmail">Email</Label>
              <Input
                id="toEmail"
                type="email"
                value={formData.referralRouting.to.email}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "to", "email", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">From: Case Resource Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fromName">CRM Name / Office</Label>
            <Input
              id="fromName"
              value={formData.referralRouting.from.crmNameOffice}
              onChange={(e) =>
                updateNestedFormData("referralRouting", "from", "crmNameOffice", e.target.value)
              }
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fromEmail">Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.referralRouting.from.email}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "from", "email", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="fromPhone">Telephone</Label>
              <Input
                id="fromPhone"
                value={formData.referralRouting.from.telephone}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "from", "telephone", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="fromFax">Fax</Label>
              <Input
                id="fromFax"
                value={formData.referralRouting.from.fax}
                onChange={(e) =>
                  updateNestedFormData("referralRouting", "from", "fax", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Section 3: Client Information
  const renderClientInfoSection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-2 block">Attachments Included</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { key: "careDdaAssessment", label: "CARE / DDA Assessment" },
            { key: "pcspDda", label: "PCSP / DDA" },
            { key: "pbsp", label: "PBSP" },
            { key: "serviceSummaryPlan", label: "Service Summary Plan" },
            { key: "consentDshs14012", label: "Consent DSHS 14-012" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`attachment-${key}`}
                checked={
                  formData.clientInfo.attachments[
                    key as keyof typeof formData.clientInfo.attachments
                  ]
                }
                onCheckedChange={(checked) =>
                  updateNestedFormData("clientInfo", "attachments", key, checked)
                }
              />
              <Label htmlFor={`attachment-${key}`}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Client's Name</Label>
          <Input
            id="clientName"
            value={formData.clientInfo.clientName}
            onChange={(e) => updateFormData("clientInfo", "clientName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="guardianName">Guardian's Name</Label>
          <Input
            id="guardianName"
            value={formData.clientInfo.guardianName}
            onChange={(e) => updateFormData("clientInfo", "guardianName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="acesId">ACES ID</Label>
          <Input
            id="acesId"
            value={formData.clientInfo.acesId}
            onChange={(e) => updateFormData("clientInfo", "acesId", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={formData.clientInfo.dateOfBirth}
            onChange={(e) => updateFormData("clientInfo", "dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="clientPhone">Telephone</Label>
          <Input
            id="clientPhone"
            value={formData.clientInfo.telephone}
            onChange={(e) => updateFormData("clientInfo", "telephone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address, City, State, Zip Code</Label>
        <Input
          id="address"
          value={formData.clientInfo.addressCityStateZip}
          onChange={(e) => updateFormData("clientInfo", "addressCityStateZip", e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Long-Term Care Worker / Residential Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="careWorkerName">Name</Label>
            <Input
              id="careWorkerName"
              value={formData.clientInfo.careWorkerProviderName}
              onChange={(e) =>
                updateFormData("clientInfo", "careWorkerProviderName", e.target.value)
              }
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="careWorkerPhone">Telephone</Label>
              <Input
                id="careWorkerPhone"
                value={formData.clientInfo.careWorkerTelephone}
                onChange={(e) =>
                  updateFormData("clientInfo", "careWorkerTelephone", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="careWorkerFax">Fax</Label>
              <Input
                id="careWorkerFax"
                value={formData.clientInfo.careWorkerFax}
                onChange={(e) => updateFormData("clientInfo", "careWorkerFax", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client/Guardian Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientInfo.clientGuardianEmail}
                onChange={(e) =>
                  updateFormData("clientInfo", "clientGuardianEmail", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interpreter Needs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsInterpreter"
                checked={formData.clientInfo.needsInterpreter}
                onCheckedChange={(checked) =>
                  updateFormData("clientInfo", "needsInterpreter", checked)
                }
              />
              <Label htmlFor="needsInterpreter">This client needs an interpreter</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deafHoh"
                checked={formData.clientInfo.deafHoh}
                onCheckedChange={(checked) => updateFormData("clientInfo", "deafHoh", checked)}
              />
              <Label htmlFor="deafHoh">Deaf / HOH</Label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primaryLangNeeded"
                checked={formData.clientInfo.primaryLanguageNeeded}
                onCheckedChange={(checked) =>
                  updateFormData("clientInfo", "primaryLanguageNeeded", checked)
                }
              />
              <Label htmlFor="primaryLangNeeded">Primary language needed:</Label>
            </div>
            <Input
              value={formData.clientInfo.primaryLanguage}
              onChange={(e) => updateFormData("clientInfo", "primaryLanguage", e.target.value)}
              placeholder="Specify language"
              className="flex-1 max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="diagnosis">Primary Diagnosis Related to Delegation</Label>
        <Textarea
          id="diagnosis"
          value={formData.clientInfo.primaryDiagnosis}
          onChange={(e) => updateFormData("clientInfo", "primaryDiagnosis", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="reason">Reason for RND Referral</Label>
        <Textarea
          id="reason"
          value={formData.clientInfo.reasonForReferral}
          onChange={(e) => updateFormData("clientInfo", "reasonForReferral", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );

  // Section 4: Case Manager Signature
  const renderCaseManagerSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          The Case/Resource Manager signature confirms the referral information is accurate.
          The actual signature will be added when the form is printed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cmPrintedName">Printed Name</Label>
          <Input
            id="cmPrintedName"
            value={formData.caseManagerSignature.printedName}
            onChange={(e) =>
              updateFormData("caseManagerSignature", "printedName", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="cmDate">Date</Label>
          <Input
            id="cmDate"
            type="date"
            value={formData.caseManagerSignature.date}
            onChange={(e) => updateFormData("caseManagerSignature", "date", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Section 5: Confirmation of Receipt
  const renderConfirmationSection = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg">
        <p className="text-sm text-amber-700">
          This section is completed by the receiving Nurse Delegator to confirm receipt of the referral.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          { key: "referralAccepted", label: "Referral Accepted" },
          { key: "referralNotAccepted", label: "Referral Not Accepted" },
          { key: "nurseAssigned", label: "Nurse Assigned" },
          { key: "hasAdditionalComments", label: "Additional Comments" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`confirm-${key}`}
              checked={
                formData.confirmationOfReceipt[
                  key as keyof typeof formData.confirmationOfReceipt
                ] as boolean
              }
              onCheckedChange={(checked) =>
                updateFormData("confirmationOfReceipt", key, checked)
              }
            />
            <Label htmlFor={`confirm-${key}`}>{label}</Label>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateReceived">Date Received</Label>
          <Input
            id="dateReceived"
            type="date"
            value={formData.confirmationOfReceipt.dateReceived}
            onChange={(e) =>
              updateFormData("confirmationOfReceipt", "dateReceived", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="nurseAssignedName">Name of Nurse Assigned</Label>
          <Input
            id="nurseAssignedName"
            value={formData.confirmationOfReceipt.nurseAssignedName}
            onChange={(e) =>
              updateFormData("confirmationOfReceipt", "nurseAssignedName", e.target.value)
            }
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="confirmPhone">Telephone</Label>
          <Input
            id="confirmPhone"
            value={formData.confirmationOfReceipt.telephone}
            onChange={(e) =>
              updateFormData("confirmationOfReceipt", "telephone", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="confirmEmail">Email</Label>
          <Input
            id="confirmEmail"
            type="email"
            value={formData.confirmationOfReceipt.email}
            onChange={(e) => updateFormData("confirmationOfReceipt", "email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="confirmComments">Additional Comments</Label>
        <Textarea
          id="confirmComments"
          value={formData.confirmationOfReceipt.additionalComments}
          onChange={(e) =>
            updateFormData("confirmationOfReceipt", "additionalComments", e.target.value)
          }
          rows={3}
        />
      </div>
    </div>
  );

  // Section 6: CRM Information
  const renderCrmInfoSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="crmName">CRM Name</Label>
        <Input
          id="crmName"
          value={formData.crmInfo.crmName}
          onChange={(e) => updateFormData("crmInfo", "crmName", e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="crmEmail">Email Address</Label>
          <Input
            id="crmEmail"
            type="email"
            value={formData.crmInfo.email}
            onChange={(e) => updateFormData("crmInfo", "email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="crmPhone">Telephone Number</Label>
          <Input
            id="crmPhone"
            value={formData.crmInfo.telephone}
            onChange={(e) => updateFormData("crmInfo", "telephone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="crmFax">Fax Number</Label>
        <Input
          id="crmFax"
          value={formData.crmInfo.fax}
          onChange={(e) => updateFormData("crmInfo", "fax", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 7: RND Information
  const renderRndInfoSection = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rndName">RND Name</Label>
          <Input
            id="rndName"
            value={formData.rndInfo.rndName}
            onChange={(e) => updateFormData("rndInfo", "rndName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rndProviderId">ProviderOne ID</Label>
          <Input
            id="rndProviderId"
            value={formData.rndInfo.providerOneId}
            onChange={(e) => updateFormData("rndInfo", "providerOneId", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rndEmail">Email Address</Label>
          <Input
            id="rndEmail"
            type="email"
            value={formData.rndInfo.email}
            onChange={(e) => updateFormData("rndInfo", "email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rndPhone">Telephone Number</Label>
          <Input
            id="rndPhone"
            value={formData.rndInfo.telephone}
            onChange={(e) => updateFormData("rndInfo", "telephone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rndFax">Fax Number</Label>
        <Input
          id="rndFax"
          value={formData.rndInfo.fax}
          onChange={(e) => updateFormData("rndInfo", "fax", e.target.value)}
        />
      </div>
    </div>
  );

  // Section 8: Assessment
  const renderAssessmentSection = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assessClientName">Client's Name</Label>
          <Input
            id="assessClientName"
            value={formData.nurseAssessment.clientName}
            onChange={(e) => updateFormData("nurseAssessment", "clientName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="assessDate">Assessment Date</Label>
          <Input
            id="assessDate"
            type="date"
            value={formData.nurseAssessment.assessmentDate}
            onChange={(e) => updateFormData("nurseAssessment", "assessmentDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Was Nurse Delegation Implemented?</Label>
        <RadioGroup
          value={formData.nurseAssessment.delegationImplemented}
          onValueChange={(value) =>
            updateFormData("nurseAssessment", "delegationImplemented", value)
          }
          className="mt-2 flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="delegation-yes" />
            <Label htmlFor="delegation-yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="delegation-no" />
            <Label htmlFor="delegation-no">No</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.nurseAssessment.delegationImplemented === "yes" && (
        <div>
          <Label htmlFor="tasksDeleted">List the tasks that were delegated</Label>
          <Textarea
            id="tasksDeleted"
            value={formData.nurseAssessment.tasksDeleted}
            onChange={(e) => updateFormData("nurseAssessment", "tasksDeleted", e.target.value)}
            rows={4}
            placeholder="List all delegated nursing tasks..."
          />
        </div>
      )}

      {formData.nurseAssessment.delegationImplemented === "no" && (
        <>
          <div>
            <Label htmlFor="reasonNot">Indicate reason and any other action taken</Label>
            <Textarea
              id="reasonNot"
              value={formData.nurseAssessment.reasonNotImplemented}
              onChange={(e) =>
                updateFormData("nurseAssessment", "reasonNotImplemented", e.target.value)
              }
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="otherOptions">RND other options for care suggestions</Label>
            <Textarea
              id="otherOptions"
              value={formData.nurseAssessment.otherOptionsForCare}
              onChange={(e) =>
                updateFormData("nurseAssessment", "otherOptionsForCare", e.target.value)
              }
              rows={3}
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="rndComments">RND Additional Comments</Label>
        <Textarea
          id="rndComments"
          value={formData.nurseAssessment.rndAdditionalComments}
          onChange={(e) =>
            updateFormData("nurseAssessment", "rndAdditionalComments", e.target.value)
          }
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="rndSigDate">RND Signature Date</Label>
        <Input
          id="rndSigDate"
          type="date"
          value={formData.nurseAssessment.rndSignatureDate}
          onChange={(e) =>
            updateFormData("nurseAssessment", "rndSignatureDate", e.target.value)
          }
        />
      </div>

      {/* Print/Download Section */}
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-teal-800 mb-4">Generate Official Form</h3>
          <p className="text-sm text-teal-700 mb-4">
            Generate the official DSHS 01-212 Nurse Delegation form with your data.
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
                <CardTitle>DSHS 01-212 Nurse Delegation</CardTitle>
                <p className="text-sm text-gray-500">
                  {formData.clientInfo.clientName || "New Form"}
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
