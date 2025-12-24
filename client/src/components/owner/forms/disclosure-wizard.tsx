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
  FileText,
  Building2,
  DollarSign,
  Wallet,
  CreditCard,
  Receipt,
  RotateCcw,
  Calendar,
  Heart,
  Pill,
  Package,
  PenLine,
  Loader2,
  X,
  Info,
  Plus,
  Trash2,
  Printer,
} from "lucide-react";

// Disclosure Form Sections
const DISCLOSURE_SECTIONS = [
  { id: 1, title: "Home Information", key: "homeInfo", icon: Building2 },
  { id: 2, title: "Medicaid Information", key: "medicaid", icon: FileText },
  { id: 3, title: "Admission Fee", key: "admissionFee", icon: DollarSign },
  { id: 4, title: "Deposits", key: "deposits", icon: Wallet },
  { id: 5, title: "Prepaid Charges", key: "prepaidCharges", icon: CreditCard },
  { id: 6, title: "Other Fees/Charges", key: "otherFees", icon: Receipt },
  { id: 7, title: "Refund Policy", key: "refundPolicy", icon: RotateCcw },
  { id: 8, title: "Daily/Monthly Rates", key: "rates", icon: Calendar },
  { id: 9, title: "Personal Care", key: "personalCare", icon: Heart },
  { id: 10, title: "Medication Services", key: "medicationServices", icon: Pill },
  { id: 11, title: "Other Services & Items", key: "otherServices", icon: Package },
  { id: 12, title: "Signatures", key: "signatures", icon: PenLine },
];

// Initial form data structure
const getInitialFormData = () => ({
  homeInfo: {
    homeName: "",
    licenseNumber: "",
    date: new Date().toISOString().split("T")[0],
  },
  medicaid: {
    isPrivatePay: false,
    acceptsMedicaid: false,
    medicaidConditions: "",
    additionalComments: "",
  },
  admissionFee: {
    amount: "",
    comments: "",
  },
  deposits: {
    items: [{ purpose: "", amount: "" }] as Array<{ purpose: string; amount: string }>,
    comments: "",
  },
  prepaidCharges: {
    items: [{ purpose: "", amount: "" }] as Array<{ purpose: string; amount: string }>,
    comments: "",
  },
  otherFees: {
    items: [{ purpose: "", amount: "" }] as Array<{ purpose: string; amount: string }>,
    comments: "",
    minimumStayFees: "",
  },
  refundPolicy: {
    deathPolicy: "",
    hospitalizationPolicy: "",
    transferPolicy: "",
    dischargePolicy: "",
    retainedAmount: "",
    additionalTerms: "",
  },
  rates: {
    chargesMonthly: true,
    chargesDaily: false,
    monthlyLow: "",
    monthlyHigh: "",
    dailyLow: "",
    dailyHigh: "",
    rateComments: "",
  },
  personalCare: {
    eating: { includedInRate: false, low: "", high: "" },
    toileting: { includedInRate: false, low: "", high: "" },
    transferring: { includedInRate: false, low: "", high: "" },
    personalHygiene: { includedInRate: false, low: "", high: "" },
    dressing: { includedInRate: false, low: "", high: "" },
    bathing: { includedInRate: false, low: "", high: "" },
    behaviors: { includedInRate: false, low: "", high: "" },
  },
  medicationServices: {
    medicationServices: { includedInRate: false, low: "", high: "" },
    nurseDelegation: { includedInRate: false, low: "", high: "" },
    assessments: { includedInRate: false, low: "", high: "" },
  },
  otherServices: {
    services: "",
    items: "",
    activities: "",
    otherCharges: "",
  },
  signatures: {
    residentAcknowledged: false,
    residentSignature: "",
    residentDate: "",
    residentPrintedName: "",
    providerSignature: "",
    providerDate: "",
    providerPrintedName: "",
  },
});

export type DisclosureFormData = ReturnType<typeof getInitialFormData>;

interface DisclosureWizardProps {
  facilityId: string;
  formSubmissionId?: number;
  onClose: () => void;
  onComplete?: () => void;
}

export function DisclosureWizard({
  facilityId,
  formSubmissionId,
  onClose,
  onComplete,
}: DisclosureWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<DisclosureFormData>(getInitialFormData());
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
        homeInfo: {
          ...prev.homeInfo,
          homeName: facility.name || "",
          licenseNumber: facility.licenseNumber || "",
        },
      }));
    }
  }, [facility]);

  // Load existing form data if editing
  useEffect(() => {
    if (existingSubmission) {
      try {
        const parsed = JSON.parse(existingSubmission.formData);
        setFormData(parsed);
        setCurrentSection(existingSubmission.currentSection || 1);
      } catch (e) {
        console.error("Failed to parse form data:", e);
      }
    }
  }, [existingSubmission]);

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (completedSections.size / DISCLOSURE_SECTIONS.length) * 100
  );

  // Get current section info
  const currentSectionInfo = DISCLOSURE_SECTIONS.find((s) => s.id === currentSection);

  // Navigation handlers
  const goToSection = (sectionId: number) => {
    setCurrentSection(sectionId);
  };

  const goNext = () => {
    if (currentSection < DISCLOSURE_SECTIONS.length) {
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
        residentId: null,
        formType: "disclosure_of_charges",
        formTitle: `DSHS 15-449 Disclosure of Charges - ${formData.homeInfo.homeName || "Draft"}`,
        status: "draft",
        currentSection,
        totalSections: DISCLOSURE_SECTIONS.length,
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
  const updateSectionData = <K extends keyof DisclosureFormData>(
    sectionKey: K,
    data: Partial<DisclosureFormData[K]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        ...data,
      },
    }));
  };

  // Section 1: Home Information
  const renderHomeInfoSection = () => {
    const data = formData.homeInfo;

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">DSHS 15-449 - Disclosure of Charges</p>
            <p className="text-blue-700 mt-1">
              Required by RCW 70.128.280. This form must be provided to residents prior to or upon admission.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-gray-700">Home/Provider's Name</Label>
            <Input
              value={data.homeName}
              onChange={(e) => updateSectionData("homeInfo", { homeName: e.target.value })}
              className="mt-1 bg-white border-gray-300 focus:border-teal-500"
              placeholder="Adult Family Home name"
            />
          </div>
          <div>
            <Label className="text-gray-700">License Number</Label>
            <Input
              value={data.licenseNumber}
              onChange={(e) => updateSectionData("homeInfo", { licenseNumber: e.target.value })}
              className="mt-1 bg-white border-gray-300 focus:border-teal-500"
              placeholder="AFH license number"
            />
          </div>
          <div>
            <Label className="text-gray-700">Date</Label>
            <Input
              type="date"
              value={data.date}
              onChange={(e) => updateSectionData("homeInfo", { date: e.target.value })}
              className="mt-1 bg-white border-gray-300 focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    );
  };

  // Section 2: Medicaid Information
  const renderMedicaidSection = () => {
    const data = formData.medicaid;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Medicaid payments made by DSHS are considered payment in full for the services,
            items, activities, and room and board. Supplementation of this rate is only allowed in limited situations.
            See WAC 388-105-0050 for more information.
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <Checkbox
              checked={data.isPrivatePay}
              onCheckedChange={(checked) => updateSectionData("medicaid", {
                isPrivatePay: checked === true,
                acceptsMedicaid: checked === true ? false : data.acceptsMedicaid
              })}
              className="mt-0.5 border-gray-300 data-[state=checked]:bg-teal-600"
            />
            <div>
              <span className="font-medium text-gray-900">Private Pay Only</span>
              <p className="text-sm text-gray-600 mt-1">
                This home is a private pay facility and does not accept Medicaid payments.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <Checkbox
              checked={data.acceptsMedicaid}
              onCheckedChange={(checked) => updateSectionData("medicaid", {
                acceptsMedicaid: checked === true,
                isPrivatePay: checked === true ? false : data.isPrivatePay
              })}
              className="mt-0.5 border-gray-300 data-[state=checked]:bg-teal-600"
            />
            <div>
              <span className="font-medium text-gray-900">Accepts Medicaid</span>
              <p className="text-sm text-gray-600 mt-1">
                This home will accept Medicaid payments under the following conditions.
              </p>
            </div>
          </label>

          {data.acceptsMedicaid && (
            <div className="ml-8 space-y-4">
              <div>
                <Label className="text-gray-700">Conditions for Medicaid Acceptance</Label>
                <Textarea
                  value={data.medicaidConditions}
                  onChange={(e) => updateSectionData("medicaid", { medicaidConditions: e.target.value })}
                  className="mt-1 bg-white border-gray-300"
                  rows={3}
                  placeholder="e.g., Availability of Medicaid bed, specific requirements..."
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-gray-700">Additional Comments Regarding Medicaid</Label>
            <Textarea
              value={data.additionalComments}
              onChange={(e) => updateSectionData("medicaid", { additionalComments: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={3}
              placeholder="Any additional information about Medicaid policies..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Section 3: Admission Fee
  const renderAdmissionFeeSection = () => {
    const data = formData.admissionFee;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Enter the admission fee amount charged to residents upon admission. This is a one-time fee.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700">Admission Fee Amount</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                value={data.amount}
                onChange={(e) => updateSectionData("admissionFee", { amount: e.target.value })}
                className="pl-7 bg-white border-gray-300 focus:border-teal-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-gray-700">Comments / Description</Label>
          <Textarea
            value={data.comments}
            onChange={(e) => updateSectionData("admissionFee", { comments: e.target.value })}
            className="mt-1 bg-white border-gray-300"
            rows={3}
            placeholder="Describe what the admission fee covers..."
          />
        </div>
      </div>
    );
  };

  // Generic table section for deposits, prepaid charges, other fees
  const renderTableSection = (
    sectionKey: "deposits" | "prepaidCharges" | "otherFees",
    title: string,
    description: string
  ) => {
    const data = formData[sectionKey];

    const addRow = () => {
      setFormData((prev) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          items: [...prev[sectionKey].items, { purpose: "", amount: "" }],
        },
      }));
    };

    const removeRow = (index: number) => {
      setFormData((prev) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          items: prev[sectionKey].items.filter((_, i) => i !== index),
        },
      }));
    };

    const updateRow = (index: number, field: "purpose" | "amount", value: string) => {
      setFormData((prev) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          items: prev[sectionKey].items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
          ),
        },
      }));
    };

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Purpose</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 w-40">Amount</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-4 py-2">
                    <Input
                      value={item.purpose}
                      onChange={(e) => updateRow(index, "purpose", e.target.value)}
                      className="bg-white border-gray-300"
                      placeholder="Describe purpose..."
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        value={item.amount}
                        onChange={(e) => updateRow(index, "amount", e.target.value)}
                        className="pl-7 bg-white border-gray-300"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {data.items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Row
        </Button>

        <div>
          <Label className="text-gray-700">Additional Comments</Label>
          <Textarea
            value={data.comments}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [sectionKey]: { ...prev[sectionKey], comments: e.target.value },
              }))
            }
            className="mt-1 bg-white border-gray-300"
            rows={3}
            placeholder="Any additional comments..."
          />
        </div>

        {sectionKey === "otherFees" && (
          <div>
            <Label className="text-gray-700">Minimum Stay Fees</Label>
            <Textarea
              value={(formData.otherFees as any).minimumStayFees || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  otherFees: { ...prev.otherFees, minimumStayFees: e.target.value },
                }))
              }
              className="mt-1 bg-white border-gray-300"
              rows={2}
              placeholder="Describe minimum stay fees if applicable..."
            />
          </div>
        )}
      </div>
    );
  };

  // Section 7: Refund Policy
  const renderRefundPolicySection = () => {
    const data = formData.refundPolicy;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Describe the refund policies for various situations. Be specific about what amounts are refunded or retained.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-700">If Resident Dies</Label>
            <Textarea
              value={data.deathPolicy}
              onChange={(e) => updateSectionData("refundPolicy", { deathPolicy: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={2}
              placeholder="Refund policy when a resident passes away..."
            />
          </div>

          <div>
            <Label className="text-gray-700">If Resident is Hospitalized</Label>
            <Textarea
              value={data.hospitalizationPolicy}
              onChange={(e) => updateSectionData("refundPolicy", { hospitalizationPolicy: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={2}
              placeholder="Refund policy during hospitalization..."
            />
          </div>

          <div>
            <Label className="text-gray-700">If Resident Transfers to Another Facility</Label>
            <Textarea
              value={data.transferPolicy}
              onChange={(e) => updateSectionData("refundPolicy", { transferPolicy: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={2}
              placeholder="Refund policy when transferring..."
            />
          </div>

          <div>
            <Label className="text-gray-700">If Resident is Discharged</Label>
            <Textarea
              value={data.dischargePolicy}
              onChange={(e) => updateSectionData("refundPolicy", { dischargePolicy: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={2}
              placeholder="Refund policy upon discharge..."
            />
          </div>

          <div>
            <Label className="text-gray-700">Amount Retained (if any)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                value={data.retainedAmount}
                onChange={(e) => updateSectionData("refundPolicy", { retainedAmount: e.target.value })}
                className="pl-7 bg-white border-gray-300 max-w-xs"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-700">Additional Terms</Label>
            <Textarea
              value={data.additionalTerms}
              onChange={(e) => updateSectionData("refundPolicy", { additionalTerms: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={3}
              placeholder="Any additional refund terms..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Section 8: Daily/Monthly Rates
  const renderRatesSection = () => {
    const data = formData.rates;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Specify how rates are charged and the range of daily or monthly rates.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-700 mb-3 block">Charges are based on:</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={data.chargesMonthly}
                  onCheckedChange={(checked) => updateSectionData("rates", { chargesMonthly: checked === true })}
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <span className="text-gray-700">Monthly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={data.chargesDaily}
                  onCheckedChange={(checked) => updateSectionData("rates", { chargesDaily: checked === true })}
                  className="border-gray-300 data-[state=checked]:bg-teal-600"
                />
                <span className="text-gray-700">Daily</span>
              </label>
            </div>
          </div>

          {data.chargesMonthly && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Monthly Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Low</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      value={data.monthlyLow}
                      onChange={(e) => updateSectionData("rates", { monthlyLow: e.target.value })}
                      className="pl-7 bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700">High</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      value={data.monthlyHigh}
                      onChange={(e) => updateSectionData("rates", { monthlyHigh: e.target.value })}
                      className="pl-7 bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.chargesDaily && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Daily Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Low</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      value={data.dailyLow}
                      onChange={(e) => updateSectionData("rates", { dailyLow: e.target.value })}
                      className="pl-7 bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700">High</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      value={data.dailyHigh}
                      onChange={(e) => updateSectionData("rates", { dailyHigh: e.target.value })}
                      className="pl-7 bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-gray-700">Rate Comments</Label>
            <Textarea
              value={data.rateComments}
              onChange={(e) => updateSectionData("rates", { rateComments: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={3}
              placeholder="Any additional comments about rates..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Personal Care Service Row Component
  const renderPersonalCareService = (
    serviceKey: keyof typeof formData.personalCare,
    serviceName: string,
    description: string
  ) => {
    const service = formData.personalCare[serviceKey];

    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{serviceName}</h4>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={service.includedInRate}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  personalCare: {
                    ...prev.personalCare,
                    [serviceKey]: { ...service, includedInRate: checked === true },
                  },
                }))
              }
              className="border-gray-300 data-[state=checked]:bg-teal-600"
            />
            <span className="text-sm text-gray-700">Included in monthly rate</span>
          </label>
        </div>

        {!service.includedInRate && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <Label className="text-gray-700 text-sm">Low $</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  value={service.low}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalCare: {
                        ...prev.personalCare,
                        [serviceKey]: { ...service, low: e.target.value },
                      },
                    }))
                  }
                  className="pl-7 bg-white border-gray-300"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 text-sm">High $</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  value={service.high}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalCare: {
                        ...prev.personalCare,
                        [serviceKey]: { ...service, high: e.target.value },
                      },
                    }))
                  }
                  className="pl-7 bg-white border-gray-300"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section 9: Personal Care Services
  const renderPersonalCareSection = () => {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>"Personal care services"</strong> means both physical assistance and/or prompting and
            supervising the performance of direct personal care tasks as determined by the resident's needs
            and does not include assistance with tasks performed by a licensed health professional.
            (WAC 388-76-10000)
          </p>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>*</strong> This section does not apply to residents receiving Medicaid, as this is
            either covered by Medicaid or not applicable to residents paying Medicaid.
          </p>
        </div>

        <div className="space-y-4">
          {renderPersonalCareService("eating", "Eating", "Assistance with eating, feeding, or meal preparation")}
          {renderPersonalCareService("toileting", "Toileting", "Assistance with toilet use and continence care")}
          {renderPersonalCareService("transferring", "Transferring", "Assistance moving between surfaces (bed, chair, wheelchair)")}
          {renderPersonalCareService("personalHygiene", "Personal Hygiene", "Assistance with grooming, oral care, and personal cleanliness")}
          {renderPersonalCareService("dressing", "Dressing", "Assistance with selecting and putting on clothing")}
          {renderPersonalCareService("bathing", "Bathing", "Assistance with bathing, showering, or sponge baths")}
          {renderPersonalCareService("behaviors", "Behavior Support", "Support for behavioral health needs")}
        </div>
      </div>
    );
  };

  // Section 10: Medication Services
  const renderMedicationServicesSection = () => {
    const renderMedService = (
      serviceKey: keyof typeof formData.medicationServices,
      serviceName: string,
      description: string
    ) => {
      const service = formData.medicationServices[serviceKey];

      return (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{serviceName}</h4>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={service.includedInRate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    medicationServices: {
                      ...prev.medicationServices,
                      [serviceKey]: { ...service, includedInRate: checked === true },
                    },
                  }))
                }
                className="border-gray-300 data-[state=checked]:bg-teal-600"
              />
              <span className="text-sm text-gray-700">Included in monthly rate</span>
            </label>
          </div>

          {!service.includedInRate && (
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
              <div>
                <Label className="text-gray-700 text-sm">Low $</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    value={service.low}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicationServices: {
                          ...prev.medicationServices,
                          [serviceKey]: { ...service, low: e.target.value },
                        },
                      }))
                    }
                    className="pl-7 bg-white border-gray-300"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 text-sm">High $</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    value={service.high}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicationServices: {
                          ...prev.medicationServices,
                          [serviceKey]: { ...service, high: e.target.value },
                        },
                      }))
                    }
                    className="pl-7 bg-white border-gray-300"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>*</strong> This section does not apply to residents receiving Medicaid, as this is
            either covered by Medicaid or not applicable to residents paying Medicaid.
          </p>
        </div>

        <div className="space-y-4">
          {renderMedService(
            "medicationServices",
            "Medication Services",
            "Assistance with medication administration and management"
          )}
          {renderMedService(
            "nurseDelegation",
            "Nurse Delegation Services",
            "Services provided under nurse delegation"
          )}
          {renderMedService(
            "assessments",
            "Assessments / Meetings",
            "Full assessments, change of condition assessments, use of medical equipment, and meetings"
          )}
        </div>
      </div>
    );
  };

  // Section 11: Other Services & Items
  const renderOtherServicesSection = () => {
    const data = formData.otherServices;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>*</strong> This section does not apply to residents receiving Medicaid, as this is
            either covered by Medicaid or not applicable to residents paying Medicaid.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-700">Other Services</Label>
            <p className="text-sm text-gray-500 mb-2">
              List any additional services provided and their charges (e.g., laundry, transportation, escorts)
            </p>
            <Textarea
              value={data.services}
              onChange={(e) => updateSectionData("otherServices", { services: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={4}
              placeholder="Service: Amount&#10;Laundry: $XX/month&#10;Transportation: $XX/trip..."
            />
          </div>

          <div>
            <Label className="text-gray-700">Items</Label>
            <p className="text-sm text-gray-500 mb-2">
              List any items provided and their charges (e.g., incontinence supplies, special foods)
            </p>
            <Textarea
              value={data.items}
              onChange={(e) => updateSectionData("otherServices", { items: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={4}
              placeholder="Item: Amount&#10;Incontinence supplies: $XX/month&#10;Special dietary items: $XX/month..."
            />
          </div>

          <div>
            <Label className="text-gray-700">Activities</Label>
            <p className="text-sm text-gray-500 mb-2">
              List any activities with additional charges
            </p>
            <Textarea
              value={data.activities}
              onChange={(e) => updateSectionData("otherServices", { activities: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={3}
              placeholder="Activity: Amount&#10;Outings: $XX/trip..."
            />
          </div>

          <div>
            <Label className="text-gray-700">Other Charges</Label>
            <Textarea
              value={data.otherCharges}
              onChange={(e) => updateSectionData("otherServices", { otherCharges: e.target.value })}
              className="mt-1 bg-white border-gray-300"
              rows={3}
              placeholder="Any other charges not listed above..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Section 12: Signatures
  const renderSignaturesSection = () => {
    const data = formData.signatures;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            WAC 388-76-10532 requires adult family homes to provide a copy of the Disclosure of Charges
            form to residents prior to or upon admission. By signing this form, the resident acknowledges
            that they have received a copy of this disclosure.
          </p>
        </div>

        {/* Resident Acknowledgement */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <Checkbox
              checked={data.residentAcknowledged}
              onCheckedChange={(checked) =>
                updateSectionData("signatures", { residentAcknowledged: checked === true })
              }
              className="mt-0.5 border-gray-300 data-[state=checked]:bg-teal-600"
            />
            <span className="text-sm text-gray-700">
              I have received a copy of my Disclosure of Charges. I understand the costs of living in this
              Adult Family Home including the rates, personal care services, medication services, other
              services, items, and activities that may not be included in the monthly rate. I have had the
              opportunity to ask questions about the charges.
            </span>
          </label>

          <h4 className="font-medium text-gray-900 mb-4">Resident / Resident Representative</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-700">Signature</Label>
              <Input
                value={data.residentSignature}
                onChange={(e) => updateSectionData("signatures", { residentSignature: e.target.value })}
                className="mt-1 bg-white border-gray-300"
                placeholder="Type name as signature"
              />
            </div>
            <div>
              <Label className="text-gray-700">Printed Name</Label>
              <Input
                value={data.residentPrintedName}
                onChange={(e) => updateSectionData("signatures", { residentPrintedName: e.target.value })}
                className="mt-1 bg-white border-gray-300"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <Label className="text-gray-700">Date</Label>
              <Input
                type="date"
                value={data.residentDate}
                onChange={(e) => updateSectionData("signatures", { residentDate: e.target.value })}
                className="mt-1 bg-white border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Provider Signature */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Provider / Provider Representative</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-700">Signature</Label>
              <Input
                value={data.providerSignature}
                onChange={(e) => updateSectionData("signatures", { providerSignature: e.target.value })}
                className="mt-1 bg-white border-gray-300"
                placeholder="Type name as signature"
              />
            </div>
            <div>
              <Label className="text-gray-700">Printed Name</Label>
              <Input
                value={data.providerPrintedName}
                onChange={(e) => updateSectionData("signatures", { providerPrintedName: e.target.value })}
                className="mt-1 bg-white border-gray-300"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <Label className="text-gray-700">Date</Label>
              <Input
                type="date"
                value={data.providerDate}
                onChange={(e) => updateSectionData("signatures", { providerDate: e.target.value })}
                className="mt-1 bg-white border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render section content based on current section
  const renderSectionContent = () => {
    switch (currentSection) {
      case 1:
        return renderHomeInfoSection();
      case 2:
        return renderMedicaidSection();
      case 3:
        return renderAdmissionFeeSection();
      case 4:
        return renderTableSection("deposits", "Deposits", "Enter any deposits required and their purpose.");
      case 5:
        return renderTableSection("prepaidCharges", "Prepaid Charges", "Enter any prepaid charges and their purpose.");
      case 6:
        return renderTableSection("otherFees", "Other Fees/Charges", "Enter any other fees or charges and their purpose.");
      case 7:
        return renderRefundPolicySection();
      case 8:
        return renderRatesSection();
      case 9:
        return renderPersonalCareSection();
      case 10:
        return renderMedicationServicesSection();
      case 11:
        return renderOtherServicesSection();
      case 12:
        return renderSignaturesSection();
      default:
        return (
          <div className="space-y-6">
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
              {currentSectionInfo && (
                <>
                  <currentSectionInfo.icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{currentSectionInfo.title}</h3>
                  <p className="text-gray-500 text-sm">Section {currentSection} of {DISCLOSURE_SECTIONS.length}</p>
                </>
              )}
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
        }
      `}</style>

      {/* Print Header (only visible when printing) */}
      <div className="hidden print:block print:mb-6 print:border-b-2 print:border-gray-800 print:pb-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">
            ADULT FAMILY HOME DISCLOSURE OF CHARGES
          </h1>
          <p className="text-sm text-gray-600 mt-1">Required by RCW 70.128.280</p>
          <p className="text-gray-700 mt-3 font-medium">
            {formData.homeInfo.homeName}
          </p>
          {formData.homeInfo.licenseNumber && (
            <p className="text-sm text-gray-600">License #: {formData.homeInfo.licenseNumber}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Date: {formData.homeInfo.date ? new Date(formData.homeInfo.date).toLocaleDateString() : new Date().toLocaleDateString()}
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
                Disclosure of Charges (DSHS 15-449)
              </span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                Manual Entry
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <div className="text-sm font-medium text-gray-900">
                {completionPercentage}% Complete
              </div>
              <div className="text-xs text-gray-500">
                Section {currentSection} of {DISCLOSURE_SECTIONS.length}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 border-gray-300"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-4">
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
              {DISCLOSURE_SECTIONS.map((section) => {
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
                      Section {currentSection} of {DISCLOSURE_SECTIONS.length}
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
                {completedSections.size} of {DISCLOSURE_SECTIONS.length} sections completed
              </div>

              {currentSection === DISCLOSURE_SECTIONS.length ? (
                <Button
                  onClick={() => {
                    setCompletedSections((prev) => new Set(prev).add(currentSection));
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
