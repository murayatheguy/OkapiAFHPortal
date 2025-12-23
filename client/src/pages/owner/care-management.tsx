import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InviteStaffDialog } from "@/components/owner/invite-staff-dialog";
import { AddClientDialog } from "@/components/owner/add-client-dialog";
import { ResidentMedicationsDialog } from "@/components/owner/resident-medications-dialog";
import { ResidentProfileDialog } from "@/components/owner/resident-profile-dialog";
import { ReportViewerDialog } from "@/components/owner/report-viewer-dialog";
import { IncidentSummaryReport } from "@/components/owner/reports/incident-summary-report";
import { MedicationComplianceReport } from "@/components/owner/reports/medication-compliance-report";
import { CensusReport } from "@/components/owner/reports/census-report";
import { StaffActivityReport } from "@/components/owner/reports/staff-activity-report";
import { MedicationListReport } from "@/components/owner/reports/medication-list-report";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  UserCheck,
  AlertTriangle,
  FileText,
  Pill,
  ExternalLink,
  Loader2,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  Activity,
  KeyRound,
  Copy,
  RefreshCw,
  Edit,
  UserMinus,
  Bed,
  Shield,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FacilityData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  capacity?: number;
}

interface CareManagementProps {
  facilityId: string;
  facilityName?: string;
  facilityCapacity?: number;
  facility?: FacilityData;
}

interface EhrDashboardStats {
  activeResidents: number;
  totalMedications: number;
  pendingMedications: number;
  openIncidents: number;
  dshsReportableIncidents: number;
  todayNotes: number;
  staffCount?: number;
  hasStaffAdmin?: boolean;
}

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  teamMemberId: string | null;
}

interface ResidentSummary {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  roomNumber?: string;
  status: string;
  admissionDate?: string;
  dateOfBirth?: string;
  diagnoses?: string[];
  allergies?: string[];
  emergencyContacts?: { name: string; relationship: string; phone: string; isPrimary?: boolean }[];
  notes?: string;
}

interface IncidentSummary {
  id: string;
  type: string;
  incidentDate: string;
  status: string;
  dshsReportable: boolean;
}

interface Credential {
  id: string;
  teamMemberId: string;
  facilityId: string;
  credentialType: string;
  credentialNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expirationDate?: string;
  documentUrl?: string;
  notes?: string;
  createdAt?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  status: string;
}

// Credential types for Washington State AFH staff
const CREDENTIAL_TYPES = [
  { value: "NAR", label: "Nursing Assistant Registered (NAR)" },
  { value: "NAC", label: "Nursing Assistant Certified (NAC)" },
  { value: "HCA", label: "Home Care Aide (HCA)" },
  { value: "BBP", label: "Blood Borne Pathogens (BBP)" },
  { value: "CPR", label: "CPR Certification" },
  { value: "FirstAid", label: "First Aid Certification" },
  { value: "FoodHandler", label: "Food Handler's Permit" },
  { value: "Dementia", label: "Dementia/Alzheimer's Training" },
  { value: "MentalHealth", label: "Mental Health Specialist" },
  { value: "MedAdmin", label: "Medication Administration Training" },
  { value: "TBTest", label: "TB Test" },
  { value: "BackgroundCheck", label: "Background Check" },
];

// Get credential status based on expiration date
function getCredentialStatus(expirationDate?: string): { status: string; color: string; bgColor: string } {
  if (!expirationDate) {
    return { status: "No Expiration", color: "text-gray-600", bgColor: "bg-gray-400" };
  }

  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { status: "Expired", color: "text-red-400", bgColor: "bg-red-600" };
  } else if (daysUntilExpiry <= 30) {
    return { status: "Expiring Soon", color: "text-teal-600", bgColor: "bg-teal-600" };
  } else {
    return { status: "Active", color: "text-green-400", bgColor: "bg-green-600" };
  }
}

export function CareManagement({ facilityId, facilityName, facilityCapacity = 6, facility }: CareManagementProps) {
  // Create facilityData from props for reports
  const facilityData = facility || {
    id: facilityId,
    name: facilityName || "Facility",
    capacity: facilityCapacity,
  };
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("residents");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isEnablingPortal, setIsEnablingPortal] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ResidentSummary | null>(null);
  const [dischargingClientId, setDischargingClientId] = useState<string | null>(null);
  const [medicationsResident, setMedicationsResident] = useState<ResidentSummary | null>(null);
  const [profileResident, setProfileResident] = useState<ResidentSummary | null>(null);

  // Reports state
  type ReportType = "incident" | "medCompliance" | "census" | "staffActivity" | "medList" | null;
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [medListResident, setMedListResident] = useState<ResidentSummary | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reportEndDate, setReportEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedReportType, setSelectedReportType] = useState<string>("incident");

  // Credentials state
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [credentialForm, setCredentialForm] = useState({
    credentialType: "",
    credentialNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expirationDate: "",
    notes: "",
  });

  // Fetch EHR dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<EhrDashboardStats>({
    queryKey: ["owner-ehr-dashboard", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/ehr/dashboard`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch EHR dashboard");
      }
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch staff list
  const { data: staff = [], isLoading: staffLoading, refetch: refetchStaff } = useQuery<StaffMember[]>({
    queryKey: ["owner-facility-staff", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/staff`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch census/residents
  const { data: census, isLoading: censusLoading } = useQuery<{
    total: number;
    byStatus: { active: number; discharged: number; hospitalized: number; deceased: number };
    activeResidents: ResidentSummary[];
  }>({
    queryKey: ["owner-facility-census", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/ehr/census`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch incident summary
  const { data: incidentSummary, isLoading: incidentsLoading } = useQuery<{
    total: number;
    dshsReportable: number;
    byType: Record<string, number>;
    byStatus: { open: number; investigating: number; closed: number };
    recent: IncidentSummary[];
  }>({
    queryKey: ["owner-facility-incidents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/ehr/incidents/summary`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch medication compliance
  const { data: medCompliance } = useQuery<{
    period: string;
    summary: {
      total: number;
      given: number;
      refused: number;
      held: number;
      missed: number;
      complianceRate: string;
    };
  }>({
    queryKey: ["owner-facility-med-compliance", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/ehr/medications/compliance?days=7`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch full incident reports for reports (with date filtering)
  const { data: fullIncidents = [] } = useQuery<Array<{
    id: string;
    residentId?: string;
    type: string;
    description: string;
    incidentDate: string;
    incidentTime: string;
    status: string;
    dshsReportable: boolean;
    reportedBy: string;
  }>>({
    queryKey: ["owner-facility-full-incidents", facilityId, reportStartDate, reportEndDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (reportStartDate) params.set("startDate", reportStartDate);
      if (reportEndDate) params.set("endDate", reportEndDate);
      const url = `/api/owners/facilities/${facilityId}/ehr/incidents${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && activeReport === "incident",
  });

  // Fetch medication logs for compliance report (with date filtering)
  const { data: medicationLogs = [] } = useQuery<Array<{
    id: string;
    residentId: string;
    medicationId: string;
    status: string;
    scheduledTime: string;
    administeredAt?: string;
  }>>({
    queryKey: ["owner-facility-med-logs", facilityId, reportStartDate, reportEndDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (reportStartDate) params.set("startDate", reportStartDate);
      if (reportEndDate) params.set("endDate", reportEndDate);
      const url = `/api/owners/facilities/${facilityId}/ehr/medication-logs?${params}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && activeReport === "medCompliance",
  });

  // Fetch medications for selected resident (for med list report)
  const { data: residentMedications = [] } = useQuery<Array<{
    id: string;
    name: string;
    genericName?: string;
    dosage: string;
    route: string;
    frequency?: { times: string[]; interval?: string } | null;
    instructions?: string;
    prescribedBy?: string;
    startDate?: string;
    status: string;
  }>>({
    queryKey: ["owner-resident-medications", medListResident?.id],
    queryFn: async () => {
      if (!medListResident) return [];
      const response = await fetch(`/api/owners/facilities/${facilityId}/residents/${medListResident.id}/medications`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && !!medListResident,
  });

  // Fetch facility PIN
  const { data: facilityPinData, refetch: refetchPin } = useQuery<{ pin: string | null }>({
    queryKey: ["owner-facility-pin", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/pin`, {
        credentials: "include",
      });
      if (!response.ok) return { pin: null };
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch all residents (for editing)
  const { data: residents = [] } = useQuery<ResidentSummary[]>({
    queryKey: ["owner-facility-residents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/residents`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch team members for credentials (synced with owner-dashboard Team section)
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["facility-team-members", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/facilities/${facilityId}/team`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch all credentials for facility
  const { data: allCredentials = [], refetch: refetchCredentials } = useQuery<Credential[]>({
    queryKey: ["owner-facility-credentials", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/credentials`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch expiring credentials (within 30 days)
  const { data: expiringCredentials = [] } = useQuery<Credential[]>({
    queryKey: ["owner-facility-expiring-credentials", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/credentials/expiring?days=30`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Discharge client mutation
  const dischargeMutation = useMutation({
    mutationFn: async ({ residentId, reason }: { residentId: string; reason: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/owners/facilities/${facilityId}/residents/${residentId}/discharge`,
        { dischargeReason: reason }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-facility-residents", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["owner-facility-census", facilityId] });
      toast({ title: "Client discharged successfully" });
      setDischargingClientId(null);
    },
    onError: () => {
      toast({
        title: "Failed to discharge client",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Generate PIN mutation
  const generatePinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/owners/facilities/${facilityId}/generate-pin`, {});
      return response.json();
    },
    onSuccess: (data) => {
      refetchPin();
      toast({
        title: "Staff PIN Generated",
        description: `New PIN: ${data.pin}. Share this with your staff for quick login.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate PIN. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update staff status mutation
  const updateStaffStatusMutation = useMutation({
    mutationFn: async ({ staffId, status }: { staffId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/owners/facilities/${facilityId}/staff/${staffId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      refetchStaff();
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      await apiRequest("DELETE", `/api/owners/facilities/${facilityId}/staff/${staffId}`, undefined);
    },
    onSuccess: () => {
      refetchStaff();
    },
  });

  // Create credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: async (data: { teamMemberId: string; credentialData: typeof credentialForm }) => {
      const response = await apiRequest(
        "POST",
        `/api/owners/team-members/${data.teamMemberId}/credentials`,
        data.credentialData
      );
      return response.json();
    },
    onSuccess: () => {
      refetchCredentials();
      queryClient.invalidateQueries({ queryKey: ["owner-facility-expiring-credentials", facilityId] });
      setCredentialDialogOpen(false);
      resetCredentialForm();
      toast({
        title: "Success",
        description: "Credential added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add credential",
        variant: "destructive",
      });
    },
  });

  // Update credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async (data: { credentialId: string; credentialData: typeof credentialForm }) => {
      const response = await apiRequest(
        "PUT",
        `/api/owners/credentials/${data.credentialId}`,
        data.credentialData
      );
      return response.json();
    },
    onSuccess: () => {
      refetchCredentials();
      queryClient.invalidateQueries({ queryKey: ["owner-facility-expiring-credentials", facilityId] });
      setCredentialDialogOpen(false);
      setEditingCredential(null);
      resetCredentialForm();
      toast({
        title: "Success",
        description: "Credential updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update credential",
        variant: "destructive",
      });
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      await apiRequest("DELETE", `/api/owners/credentials/${credentialId}`, undefined);
    },
    onSuccess: () => {
      refetchCredentials();
      queryClient.invalidateQueries({ queryKey: ["owner-facility-expiring-credentials", facilityId] });
      toast({
        title: "Success",
        description: "Credential deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete credential",
        variant: "destructive",
      });
    },
  });

  // Helper functions for credentials
  const resetCredentialForm = () => {
    setCredentialForm({
      credentialType: "",
      credentialNumber: "",
      issuingAuthority: "",
      issueDate: "",
      expirationDate: "",
      notes: "",
    });
  };

  const openAddCredentialDialog = (teamMember: TeamMember) => {
    setSelectedTeamMember(teamMember);
    setEditingCredential(null);
    resetCredentialForm();
    setCredentialDialogOpen(true);
  };

  const openEditCredentialDialog = (credential: Credential, teamMember: TeamMember) => {
    setSelectedTeamMember(teamMember);
    setEditingCredential(credential);
    setCredentialForm({
      credentialType: credential.credentialType || "",
      credentialNumber: credential.credentialNumber || "",
      issuingAuthority: credential.issuingAuthority || "",
      issueDate: credential.issueDate || "",
      expirationDate: credential.expirationDate || "",
      notes: credential.notes || "",
    });
    setCredentialDialogOpen(true);
  };

  const handleCredentialSubmit = () => {
    if (!selectedTeamMember) return;

    // Convert empty strings to null for optional fields (prevents date parsing errors)
    const cleanedData = {
      credentialType: credentialForm.credentialType,
      credentialNumber: credentialForm.credentialNumber || null,
      issuingAuthority: credentialForm.issuingAuthority || null,
      issueDate: credentialForm.issueDate || null,
      expirationDate: credentialForm.expirationDate || null,
      notes: credentialForm.notes || null,
    };

    if (editingCredential) {
      updateCredentialMutation.mutate({
        credentialId: editingCredential.id,
        credentialData: cleanedData,
      });
    } else {
      createCredentialMutation.mutate({
        teamMemberId: selectedTeamMember.id,
        credentialData: cleanedData,
      });
    }
  };

  // Get credentials for a specific team member
  const getTeamMemberCredentials = (teamMemberId: string) => {
    return allCredentials.filter((c) => c.teamMemberId === teamMemberId);
  };

  // Get team member name from ID
  const getTeamMemberName = (teamMemberId: string) => {
    const member = teamMembers.find((m) => m.id === teamMemberId);
    return member?.name || "Unknown";
  };

  // Check if a team member has portal access (linked staffAuth record)
  const getTeamMemberPortalAccess = (teamMemberId: string) => {
    return staff.find((s) => s.teamMemberId === teamMemberId);
  };

  const isLoading = statsLoading || staffLoading || censusLoading || incidentsLoading;

  // Handler to enable portal access and navigate to staff dashboard
  const handleOpenCarePortal = async () => {
    setIsEnablingPortal(true);
    try {
      const response = await apiRequest("POST", `/api/owners/facilities/${facilityId}/ehr/enable-portal`, {});
      const data = await response.json();

      if (data.success) {
        // Invalidate staff auth query to pick up new session
        queryClient.invalidateQueries({ queryKey: ["staff-me"] });
        // Navigate to staff dashboard
        setLocation("/staff/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access Care Portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnablingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const overviewStats = [
    {
      label: "Current Clients",
      value: stats?.activeResidents || census?.byStatus?.active || 0,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
    },
    {
      label: "Meds Given Rate",
      value: medCompliance?.summary?.complianceRate || "N/A",
      icon: Pill,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
    },
    {
      label: "Expiring Soon",
      value: expiringCredentials.length,
      icon: Shield,
      color: expiringCredentials.length > 0 ? "text-teal-600" : "text-green-400",
      bgColor: expiringCredentials.length > 0 ? "bg-gray-100" : "bg-green-900/20",
      onClick: () => setActiveTab("credentials"),
    },
    {
      label: "Open Incidents",
      value: stats?.openIncidents || incidentSummary?.byStatus?.open || 0,
      icon: AlertTriangle,
      color: "text-teal-600",
      bgColor: "bg-gray-100",
    },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const copyPinToClipboard = () => {
    if (facilityPinData?.pin) {
      navigator.clipboard.writeText(facilityPinData.pin);
      toast({
        title: "PIN Copied",
        description: "Staff PIN copied to clipboard.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
            Care Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Monitor and manage your facility's EHR system
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-500 gap-2"
          onClick={handleOpenCarePortal}
          disabled={isEnablingPortal}
        >
          {isEnablingPortal ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Open Care Portal
            </>
          )}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;
          const cardContent = (
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl text-gray-900 font-semibold">{stat.value}</p>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          );
          return (
            <Card
              key={stat.label}
              className={`border-gray-200 bg-white shadow-sm ${stat.onClick ? "cursor-pointer hover:border-teal-300 transition-colors" : ""}`}
              onClick={stat.onClick}
            >
              {cardContent}
            </Card>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-50 border border-gray-200 w-full md:w-auto grid grid-cols-5 md:inline-flex">
          <TabsTrigger value="residents" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 gap-1">
            <Users className="h-4 w-4 hidden md:block" />
            Residents
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 gap-1">
            <UserCheck className="h-4 w-4 hidden md:block" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="credentials" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 gap-1 relative">
            <Shield className="h-4 w-4 hidden md:block" />
            Credentials
            {expiringCredentials.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {expiringCredentials.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 gap-1">
            <AlertTriangle className="h-4 w-4 hidden md:block" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 gap-1">
            <FileText className="h-4 w-4 hidden md:block" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Residents Tab */}
        <TabsContent value="residents" className="mt-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Active Residents</CardTitle>
                <CardDescription className="text-gray-500">
                  {census?.byStatus?.active || 0} active, {census?.byStatus?.hospitalized || 0} hospitalized
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-gray-300 text-gray-700 gap-1 px-3 py-1">
                  <Bed className="h-4 w-4" />
                  {residents.filter(r => r.status === "active").length}/{facilityCapacity} beds
                </Badge>
                <Button
                  onClick={() => {
                    setEditingClient(null);
                    setClientDialogOpen(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-500 gap-2"
                  disabled={residents.filter(r => r.status === "active").length >= facilityCapacity}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {residents.filter(r => r.status === "active").length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No active residents</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Click "Add Client" to admit your first resident
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Name</TableHead>
                        <TableHead className="text-gray-600">Room</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600">Admitted</TableHead>
                        <TableHead className="text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residents.filter(r => r.status === "active").map((resident) => (
                        <TableRow key={resident.id} className="border-gray-200">
                          <TableCell>
                            <button
                              onClick={() => setProfileResident(resident)}
                              className="text-gray-900 font-medium hover:text-teal-600 hover:underline text-left transition-colors"
                            >
                              {resident.firstName} {resident.lastName}
                              {resident.preferredName && (
                                <span className="text-gray-500 text-sm ml-1">
                                  ({resident.preferredName})
                                </span>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-gray-600">{resident.roomNumber || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                resident.status === "active"
                                  ? "bg-green-600"
                                  : resident.status === "hospitalized"
                                  ? "bg-teal-600"
                                  : "bg-gray-400"
                              }
                            >
                              {resident.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(resident.admissionDate || "")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-teal-600 hover:text-teal-500 hover:bg-teal-50 h-8 px-2"
                                onClick={() => {
                                  setEditingClient(resident);
                                  setClientDialogOpen(true);
                                }}
                                title="Edit client"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-teal-400 hover:text-teal-300 hover:bg-teal-900/20 h-8 px-2"
                                onClick={() => setMedicationsResident(resident)}
                                title="Manage medications"
                              >
                                <Pill className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
                                onClick={() => {
                                  if (confirm(`Discharge ${resident.firstName} ${resident.lastName}? This action can be undone.`)) {
                                    dischargeMutation.mutate({
                                      residentId: resident.id,
                                      reason: "Discharged by owner",
                                    });
                                  }
                                }}
                                disabled={dischargeMutation.isPending}
                                title="Discharge client"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-6 space-y-6">
          {/* Staff Quick Login PIN Card */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-gray-900">Staff Quick Login PIN</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Share this 4-digit PIN with your staff for quick login at <span className="text-teal-600">/staff/login</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {facilityPinData?.pin ? (
                  <>
                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-3 rounded-lg">
                      <span className="text-3xl font-mono text-teal-700 tracking-widest">
                        {facilityPinData.pin}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyPinToClipboard}
                        className="text-gray-600 hover:text-teal-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => generatePinMutation.mutate()}
                      disabled={generatePinMutation.isPending}
                      className="border-gray-300 text-gray-700 hover:text-teal-700 gap-2"
                    >
                      {generatePinMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => generatePinMutation.mutate()}
                    disabled={generatePinMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-500 gap-2"
                  >
                    {generatePinMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Generate Staff PIN
                  </Button>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-3">
                Staff can use this PIN with their name to quickly access the Care Portal. No password required.
              </p>
            </CardContent>
          </Card>

          {/* Staff Users Card */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Staff Users</CardTitle>
                <CardDescription className="text-gray-500">
                  {staff.filter((s) => s.status === "active").length} active staff with login access
                </CardDescription>
              </div>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Staff
              </Button>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No staff users with login access yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Invite staff to give them login access to the Care Portal
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Name</TableHead>
                        <TableHead className="text-gray-600">Email</TableHead>
                        <TableHead className="text-gray-600">Role</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600">Last Login</TableHead>
                        <TableHead className="text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id} className="border-gray-200">
                          <TableCell className="text-gray-900 font-medium">
                            {member.firstName} {member.lastName}
                          </TableCell>
                          <TableCell className="text-gray-600">{member.email}</TableCell>
                          <TableCell className="text-gray-600 capitalize">{member.role}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                member.status === "active"
                                  ? "bg-green-600"
                                  : member.status === "suspended"
                                  ? "bg-red-600"
                                  : "bg-gray-400"
                              }
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {member.lastLoginAt ? (
                              <span>
                                {formatDate(member.lastLoginAt)} {formatTime(member.lastLoginAt)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {member.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-teal-600 hover:text-teal-500 hover:bg-teal-50 h-8 px-2"
                                  onClick={() =>
                                    updateStaffStatusMutation.mutate({
                                      staffId: member.id,
                                      status: "suspended",
                                    })
                                  }
                                >
                                  Suspend
                                </Button>
                              ) : member.status === "suspended" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-8 px-2"
                                  onClick={() =>
                                    updateStaffStatusMutation.mutate({
                                      staffId: member.id,
                                      status: "active",
                                    })
                                  }
                                >
                                  Activate
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
                                onClick={() => deleteStaffMutation.mutate(member.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members Card - Unified view with portal access */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div>
                <CardTitle className="text-gray-900">Team Members</CardTitle>
                <CardDescription className="text-gray-500">
                  {teamMembers.filter((m) => m.status === "active").length} team members • {staff.filter((s) => s.teamMemberId).length} with portal access
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No team members yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add team members from the Dashboard → Team section
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Name</TableHead>
                        <TableHead className="text-gray-600">Email</TableHead>
                        <TableHead className="text-gray-600">Role</TableHead>
                        <TableHead className="text-gray-600">Portal Access</TableHead>
                        <TableHead className="text-gray-600">Credentials</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => {
                        const memberCredentials = getTeamMemberCredentials(member.id);
                        const portalAccess = getTeamMemberPortalAccess(member.id);
                        return (
                          <TableRow key={member.id} className="border-gray-200">
                            <TableCell className="text-gray-900 font-medium">
                              {member.name}
                            </TableCell>
                            <TableCell className="text-gray-600">{member.email || "—"}</TableCell>
                            <TableCell className="text-gray-600 capitalize">{member.role}</TableCell>
                            <TableCell>
                              {portalAccess ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-teal-600">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2 text-xs"
                                    onClick={() => deleteStaffMutation.mutate(portalAccess.id)}
                                  >
                                    Revoke
                                  </Button>
                                </div>
                              ) : (
                                <Badge className="bg-gray-400">
                                  No Access
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-teal-600 hover:text-teal-500 hover:bg-teal-50 h-8 px-2 gap-1"
                                onClick={() => {
                                  setActiveTab("credentials");
                                }}
                              >
                                <Shield className="h-4 w-4" />
                                {memberCredentials.length} credential{memberCredentials.length !== 1 ? "s" : ""}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="mt-6 space-y-6">
          {/* Expiring Soon Alert */}
          {expiringCredentials.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-teal-700">Credentials Expiring Soon</CardTitle>
                </div>
                <CardDescription className="text-teal-600/80">
                  {expiringCredentials.length} credential(s) expiring within 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringCredentials.map((cred) => {
                    const statusInfo = getCredentialStatus(cred.expirationDate);
                    return (
                      <div
                        key={cred.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-gray-900 font-medium">
                            {CREDENTIAL_TYPES.find((t) => t.value === cred.credentialType)?.label || cred.credentialType}
                          </p>
                          <p className="text-gray-600 text-sm">{getTeamMemberName(cred.teamMemberId)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={statusInfo.bgColor}>{statusInfo.status}</Badge>
                          <p className="text-gray-500 text-xs mt-1">
                            Expires: {cred.expirationDate}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members Credentials */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Staff Credentials</CardTitle>
              <CardDescription className="text-gray-500">
                Manage certifications and training records for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No team members yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add team members to track their credentials
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {teamMembers.map((member) => {
                    const memberCredentials = getTeamMemberCredentials(member.id);
                    return (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-gray-900 font-medium">{member.name}</h3>
                            <p className="text-gray-500 text-sm capitalize">{member.role}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openAddCredentialDialog(member)}
                            className="bg-teal-600 hover:bg-teal-500 gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Add Credential
                          </Button>
                        </div>

                        {memberCredentials.length === 0 ? (
                          <p className="text-gray-500 text-sm">No credentials on file</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-gray-200">
                                  <TableHead className="text-gray-600">Type</TableHead>
                                  <TableHead className="text-gray-600">Number</TableHead>
                                  <TableHead className="text-gray-600">Issued By</TableHead>
                                  <TableHead className="text-gray-600">Expiration</TableHead>
                                  <TableHead className="text-gray-600">Status</TableHead>
                                  <TableHead className="text-gray-600">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {memberCredentials.map((cred) => {
                                  const statusInfo = getCredentialStatus(cred.expirationDate);
                                  return (
                                    <TableRow key={cred.id} className="border-gray-200">
                                      <TableCell className="text-gray-900">
                                        {CREDENTIAL_TYPES.find((t) => t.value === cred.credentialType)?.label || cred.credentialType}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {cred.credentialNumber || "-"}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {cred.issuingAuthority || "-"}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {cred.expirationDate || "No expiration"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={statusInfo.bgColor}>{statusInfo.status}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 px-2"
                                            onClick={() => openEditCredentialDialog(cred, member)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
                                            onClick={() => deleteCredentialMutation.mutate(cred.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Incident Reports</CardTitle>
              <CardDescription className="text-gray-500">
                {incidentSummary?.byStatus?.open || 0} open, {incidentSummary?.dshsReportable || 0} DSHS reportable
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!incidentSummary?.recent?.length ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600">No recent incidents</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Date</TableHead>
                        <TableHead className="text-gray-600">Type</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600">DSHS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidentSummary?.recent?.map((incident) => (
                        <TableRow key={incident.id} className="border-gray-200">
                          <TableCell className="text-gray-900">
                            {formatDate(incident.incidentDate)}
                          </TableCell>
                          <TableCell className="text-gray-600 capitalize">
                            {incident.type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                incident.status === "open"
                                  ? "bg-teal-600"
                                  : incident.status === "investigating"
                                  ? "bg-blue-600"
                                  : "bg-green-600"
                              }
                            >
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {incident.dshsReportable ? (
                              <Badge className="bg-red-600">Required</Badge>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Incident Summary by Type */}
              {incidentSummary?.byType && Object.keys(incidentSummary.byType).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-gray-700 text-sm font-medium mb-3">Incidents by Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(incidentSummary.byType).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="border-gray-300 text-gray-600"
                      >
                        {type.replace(/_/g, " ")}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6 space-y-6">
          {/* DSHS Reports Card */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Facility Reports</CardTitle>
              <CardDescription className="text-gray-500">
                Generate and print regulatory and operational reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Generator */}
              <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Report Type</label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500 min-w-[200px]"
                  >
                    <option value="incident">Monthly Incident Summary</option>
                    <option value="medCompliance">Medication Log Report</option>
                    <option value="census">Current Clients Report</option>
                    <option value="staffActivity">Staff Activity Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <Button
                  className="bg-teal-600 hover:bg-teal-500 text-white gap-2"
                  onClick={() => setActiveReport(selectedReportType as ReportType)}
                >
                  <Download className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>

              {/* Report Type Descriptions */}
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-100/30 rounded border border-gray-100">
                  <span className="text-gray-700 font-medium">Incident Summary</span>
                  <span className="text-gray-500"> - DSHS reportable incidents</span>
                </div>
                <div className="p-3 bg-gray-100/30 rounded border border-gray-100">
                  <span className="text-gray-700 font-medium">Medication Log</span>
                  <span className="text-gray-500"> - All medications given</span>
                </div>
                <div className="p-3 bg-gray-100/30 rounded border border-gray-100">
                  <span className="text-gray-700 font-medium">Current Clients</span>
                  <span className="text-gray-500"> - Census and status</span>
                </div>
                <div className="p-3 bg-gray-100/30 rounded border border-gray-100">
                  <span className="text-gray-700 font-medium">Staff Activity</span>
                  <span className="text-gray-500"> - Login and documentation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medication List Report Card */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Client Medication Sheet</CardTitle>
              <CardDescription className="text-gray-500">
                Generate a printable medication list for a specific resident
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <Select
                  value={medListResident?.id || ""}
                  onValueChange={(value) => {
                    const resident = residents.find((r) => r.id === value);
                    setMedListResident(resident || null);
                  }}
                >
                  <SelectTrigger className="w-full md:w-72 bg-gray-100 border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select a resident..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100 border-gray-300">
                    {residents.filter((r) => r.status === "active").map((resident) => (
                      <SelectItem
                        key={resident.id}
                        value={resident.id}
                        className="text-gray-900 focus:bg-teal-50"
                      >
                        {resident.firstName} {resident.lastName}
                        {resident.roomNumber && ` (Room ${resident.roomNumber})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="bg-teal-600 hover:bg-teal-500 gap-2"
                  disabled={!medListResident}
                  onClick={() => setActiveReport("medList")}
                >
                  <Download className="h-4 w-4" />
                  Generate Medication Sheet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Overview */}
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Compliance Overview</CardTitle>
              <CardDescription className="text-gray-500">
                {medCompliance?.period || "Last 7 days"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">
                    {medCompliance?.summary?.given || 0}
                  </p>
                  <p className="text-gray-500 text-sm">Meds Given</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-3xl font-bold text-teal-600">
                    {medCompliance?.summary?.refused || 0}
                  </p>
                  <p className="text-gray-500 text-sm">Refused</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-3xl font-bold text-blue-400">
                    {medCompliance?.summary?.held || 0}
                  </p>
                  <p className="text-gray-500 text-sm">Held</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-3xl font-bold text-red-400">
                    {medCompliance?.summary?.missed || 0}
                  </p>
                  <p className="text-gray-500 text-sm">Missed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Staff Dialog */}
      <InviteStaffDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        facilityId={facilityId}
        onSuccess={() => refetchStaff()}
      />

      {/* Add/Edit Client Dialog */}
      <AddClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        facilityId={facilityId}
        editingClient={editingClient}
        capacity={facilityCapacity}
        currentCount={residents.filter(r => r.status === "active").length}
      />

      {/* Resident Medications Dialog */}
      {medicationsResident && (
        <ResidentMedicationsDialog
          open={!!medicationsResident}
          onOpenChange={(open) => !open && setMedicationsResident(null)}
          facilityId={facilityId}
          resident={medicationsResident}
        />
      )}

      {/* Resident Profile Dialog */}
      {profileResident && (
        <ResidentProfileDialog
          open={!!profileResident}
          onOpenChange={(open) => !open && setProfileResident(null)}
          resident={profileResident}
          facilityId={facilityId}
        />
      )}

      {/* Report Dialogs */}
      {/* Incident Summary Report */}
      <ReportViewerDialog
        open={activeReport === "incident"}
        onOpenChange={(open) => !open && setActiveReport(null)}
        title="Monthly Incident Summary"
      >
        <IncidentSummaryReport
          facilityName={facilityData?.name || "Facility"}
          facilityAddress={facilityData?.address ? `${facilityData.address}, ${facilityData.city}, ${facilityData.state} ${facilityData.zipCode}` : undefined}
          facilityPhone={facilityData?.phone}
          incidents={fullIncidents}
          residents={residents}
          startDate={reportStartDate}
          endDate={reportEndDate}
        />
      </ReportViewerDialog>

      {/* Medication Compliance Report */}
      <ReportViewerDialog
        open={activeReport === "medCompliance"}
        onOpenChange={(open) => !open && setActiveReport(null)}
        title="Medication Log Report"
      >
        <MedicationComplianceReport
          facilityName={facilityData?.name || "Facility"}
          facilityAddress={facilityData?.address ? `${facilityData.address}, ${facilityData.city}, ${facilityData.state} ${facilityData.zipCode}` : undefined}
          facilityPhone={facilityData?.phone}
          logs={medicationLogs}
          residents={residents}
          startDate={reportStartDate}
          endDate={reportEndDate}
        />
      </ReportViewerDialog>

      {/* Census Report */}
      <ReportViewerDialog
        open={activeReport === "census"}
        onOpenChange={(open) => !open && setActiveReport(null)}
        title="Current Clients Report"
      >
        <CensusReport
          facilityName={facilityData?.name || "Facility"}
          facilityAddress={facilityData?.address ? `${facilityData.address}, ${facilityData.city}, ${facilityData.state} ${facilityData.zipCode}` : undefined}
          facilityPhone={facilityData?.phone}
          residents={residents}
          capacity={facilityData?.capacity || 6}
        />
      </ReportViewerDialog>

      {/* Staff Activity Report */}
      <ReportViewerDialog
        open={activeReport === "staffActivity"}
        onOpenChange={(open) => !open && setActiveReport(null)}
        title="Staff Activity Report"
      >
        <StaffActivityReport
          facilityName={facilityData?.name || "Facility"}
          facilityAddress={facilityData?.address ? `${facilityData.address}, ${facilityData.city}, ${facilityData.state} ${facilityData.zipCode}` : undefined}
          facilityPhone={facilityData?.phone}
          staff={staff.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            role: s.role,
            lastLoginAt: s.lastLoginAt,
          }))}
          activityData={[]}
          startDate={reportStartDate}
          endDate={reportEndDate}
        />
      </ReportViewerDialog>

      {/* Medication List Report */}
      {medListResident && (
        <ReportViewerDialog
          open={activeReport === "medList"}
          onOpenChange={(open) => {
            if (!open) {
              setActiveReport(null);
            }
          }}
          title={`Medication Sheet - ${medListResident.firstName} ${medListResident.lastName}`}
        >
          <MedicationListReport
            facilityName={facilityData?.name || "Facility"}
            facilityAddress={facilityData?.address ? `${facilityData.address}, ${facilityData.city}, ${facilityData.state} ${facilityData.zipCode}` : undefined}
            facilityPhone={facilityData?.phone}
            resident={medListResident}
            medications={residentMedications}
          />
        </ReportViewerDialog>
      )}

      {/* Add/Edit Credential Dialog */}
      <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingCredential ? "Edit Credential" : "Add Credential"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedTeamMember && (
                <>Add certification for {selectedTeamMember.name}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Credential Type</Label>
              <Select
                value={credentialForm.credentialType}
                onValueChange={(value) =>
                  setCredentialForm({ ...credentialForm, credentialType: value })
                }
              >
                <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select credential type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-300">
                  {CREDENTIAL_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-gray-900 focus:bg-teal-50"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Credential Number (optional)</Label>
              <Input
                value={credentialForm.credentialNumber}
                onChange={(e) =>
                  setCredentialForm({ ...credentialForm, credentialNumber: e.target.value })
                }
                placeholder="e.g., NAC-123456"
                className="bg-gray-100 border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Issuing Authority (optional)</Label>
              <Input
                value={credentialForm.issuingAuthority}
                onChange={(e) =>
                  setCredentialForm({ ...credentialForm, issuingAuthority: e.target.value })
                }
                placeholder="e.g., WA DOH, American Red Cross"
                className="bg-gray-100 border-gray-300 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Issue Date (optional)</Label>
                <Input
                  type="date"
                  value={credentialForm.issueDate}
                  onChange={(e) =>
                    setCredentialForm({ ...credentialForm, issueDate: e.target.value })
                  }
                  className="bg-gray-100 border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Expiration Date</Label>
                <Input
                  type="date"
                  value={credentialForm.expirationDate}
                  onChange={(e) =>
                    setCredentialForm({ ...credentialForm, expirationDate: e.target.value })
                  }
                  className="bg-gray-100 border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes (optional)</Label>
              <Textarea
                value={credentialForm.notes}
                onChange={(e) =>
                  setCredentialForm({ ...credentialForm, notes: e.target.value })
                }
                placeholder="Any additional notes about this credential"
                className="bg-gray-100 border-gray-300 text-gray-900"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCredentialDialogOpen(false);
                setEditingCredential(null);
                resetCredentialForm();
              }}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCredentialSubmit}
              disabled={!credentialForm.credentialType || createCredentialMutation.isPending || updateCredentialMutation.isPending}
              className="bg-teal-600 hover:bg-teal-500"
            >
              {createCredentialMutation.isPending || updateCredentialMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingCredential ? "Update" : "Add"} Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
