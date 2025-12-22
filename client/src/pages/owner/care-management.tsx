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
} from "lucide-react";

interface CareManagementProps {
  facilityId: string;
  facilityName?: string;
  facilityCapacity?: number;
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

export function CareManagement({ facilityId, facilityName, facilityCapacity = 6 }: CareManagementProps) {
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const overviewStats = [
    {
      label: "Active Residents",
      value: stats?.activeResidents || census?.byStatus?.active || 0,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
    },
    {
      label: "MAR Compliance",
      value: medCompliance?.summary?.complianceRate || "N/A",
      icon: Pill,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
    },
    {
      label: "Open Incidents",
      value: stats?.openIncidents || incidentSummary?.byStatus?.open || 0,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-900/20",
    },
    {
      label: "DSHS Reportable",
      value: stats?.dshsReportableIncidents || incidentSummary?.dshsReportable || 0,
      icon: FileText,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
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
          <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
            Care Management
          </h1>
          <p className="text-stone-400 text-sm mt-1">
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
          return (
            <Card key={stat.label} className="border-amber-900/20 bg-stone-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl text-amber-100 font-semibold">{stat.value}</p>
                    <p className="text-stone-500 text-xs">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-stone-900/50 border border-amber-900/20 w-full md:w-auto grid grid-cols-4 md:inline-flex">
          <TabsTrigger value="residents" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200 gap-1">
            <Users className="h-4 w-4 hidden md:block" />
            Residents
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200 gap-1">
            <UserCheck className="h-4 w-4 hidden md:block" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200 gap-1">
            <AlertTriangle className="h-4 w-4 hidden md:block" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200 gap-1">
            <FileText className="h-4 w-4 hidden md:block" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Residents Tab */}
        <TabsContent value="residents" className="mt-6">
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-stone-200">Active Residents</CardTitle>
                <CardDescription className="text-stone-500">
                  {census?.byStatus?.active || 0} active, {census?.byStatus?.hospitalized || 0} hospitalized
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-amber-900/30 text-stone-300 gap-1 px-3 py-1">
                  <Bed className="h-4 w-4" />
                  {residents.filter(r => r.status === "active").length}/{facilityCapacity} beds
                </Badge>
                <Button
                  onClick={() => {
                    setEditingClient(null);
                    setClientDialogOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 gap-2"
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
                  <Users className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400">No active residents</p>
                  <p className="text-stone-500 text-sm mt-1">
                    Click "Add Client" to admit your first resident
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-900/20">
                        <TableHead className="text-stone-400">Name</TableHead>
                        <TableHead className="text-stone-400">Room</TableHead>
                        <TableHead className="text-stone-400">Status</TableHead>
                        <TableHead className="text-stone-400">Admitted</TableHead>
                        <TableHead className="text-stone-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residents.filter(r => r.status === "active").map((resident) => (
                        <TableRow key={resident.id} className="border-amber-900/20">
                          <TableCell className="text-stone-200 font-medium">
                            {resident.firstName} {resident.lastName}
                            {resident.preferredName && (
                              <span className="text-stone-500 text-sm ml-1">
                                ({resident.preferredName})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-stone-400">{resident.roomNumber || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                resident.status === "active"
                                  ? "bg-green-600"
                                  : resident.status === "hospitalized"
                                  ? "bg-amber-600"
                                  : "bg-stone-600"
                              }
                            >
                              {resident.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-stone-400">
                            {formatDate(resident.admissionDate || "")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 h-8 px-2"
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
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-stone-200">Staff Quick Login PIN</CardTitle>
              </div>
              <CardDescription className="text-stone-500">
                Share this 4-digit PIN with your staff for quick login at <span className="text-amber-400">/staff/login</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {facilityPinData?.pin ? (
                  <>
                    <div className="flex items-center gap-2 bg-stone-800/50 px-4 py-3 rounded-lg">
                      <span className="text-3xl font-mono text-amber-200 tracking-widest">
                        {facilityPinData.pin}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyPinToClipboard}
                        className="text-stone-400 hover:text-amber-200"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => generatePinMutation.mutate()}
                      disabled={generatePinMutation.isPending}
                      className="border-amber-900/30 text-stone-300 hover:text-amber-200 gap-2"
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
                    className="bg-amber-600 hover:bg-amber-500 gap-2"
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
              <p className="text-stone-500 text-sm mt-3">
                Staff can use this PIN with their name to quickly access the Care Portal. No password required.
              </p>
            </CardContent>
          </Card>

          {/* Staff Users Card */}
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-stone-200">Staff Users</CardTitle>
                <CardDescription className="text-stone-500">
                  {staff.filter((s) => s.status === "active").length} active staff members
                </CardDescription>
              </div>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Staff
              </Button>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400">No staff members yet</p>
                  <p className="text-stone-500 text-sm mt-1">
                    Invite your first staff member to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-900/20">
                        <TableHead className="text-stone-400">Name</TableHead>
                        <TableHead className="text-stone-400">Email</TableHead>
                        <TableHead className="text-stone-400">Role</TableHead>
                        <TableHead className="text-stone-400">Status</TableHead>
                        <TableHead className="text-stone-400">Last Login</TableHead>
                        <TableHead className="text-stone-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id} className="border-amber-900/20">
                          <TableCell className="text-stone-200 font-medium">
                            {member.firstName} {member.lastName}
                          </TableCell>
                          <TableCell className="text-stone-400">{member.email}</TableCell>
                          <TableCell className="text-stone-400 capitalize">{member.role}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                member.status === "active"
                                  ? "bg-green-600"
                                  : member.status === "suspended"
                                  ? "bg-red-600"
                                  : "bg-stone-600"
                              }
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-stone-400">
                            {member.lastLoginAt ? (
                              <span>
                                {formatDate(member.lastLoginAt)} {formatTime(member.lastLoginAt)}
                              </span>
                            ) : (
                              <span className="text-stone-600">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {member.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 h-8 px-2"
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
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-6">
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader>
              <CardTitle className="text-stone-200">Incident Reports</CardTitle>
              <CardDescription className="text-stone-500">
                {incidentSummary?.byStatus?.open || 0} open, {incidentSummary?.dshsReportable || 0} DSHS reportable
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!incidentSummary?.recent?.length ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-stone-400">No recent incidents</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-900/20">
                        <TableHead className="text-stone-400">Date</TableHead>
                        <TableHead className="text-stone-400">Type</TableHead>
                        <TableHead className="text-stone-400">Status</TableHead>
                        <TableHead className="text-stone-400">DSHS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidentSummary?.recent?.map((incident) => (
                        <TableRow key={incident.id} className="border-amber-900/20">
                          <TableCell className="text-stone-200">
                            {formatDate(incident.incidentDate)}
                          </TableCell>
                          <TableCell className="text-stone-400 capitalize">
                            {incident.type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                incident.status === "open"
                                  ? "bg-amber-600"
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
                              <span className="text-stone-600">No</span>
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
                <div className="mt-6 pt-6 border-t border-amber-900/20">
                  <h4 className="text-stone-300 text-sm font-medium mb-3">Incidents by Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(incidentSummary.byType).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="border-amber-900/30 text-stone-400"
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
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader>
              <CardTitle className="text-stone-200">DSHS Reports</CardTitle>
              <CardDescription className="text-stone-500">
                Generate and download regulatory reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-amber-900/20 bg-stone-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-stone-200 font-medium">Monthly Incident Summary</h4>
                        <p className="text-stone-500 text-sm">Required DSHS incident report</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-900/30 text-stone-300 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-900/20 bg-stone-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-stone-200 font-medium">Medication Compliance Report</h4>
                        <p className="text-stone-500 text-sm">MAR summary for period</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-900/30 text-stone-300 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-900/20 bg-stone-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-stone-200 font-medium">Resident Census Report</h4>
                        <p className="text-stone-500 text-sm">Current resident list and status</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-900/30 text-stone-300 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-900/20 bg-stone-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-stone-200 font-medium">Staff Activity Report</h4>
                        <p className="text-stone-500 text-sm">Login and documentation activity</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-900/30 text-stone-300 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Overview */}
          <Card className="border-amber-900/20 bg-stone-900/30">
            <CardHeader>
              <CardTitle className="text-stone-200">Compliance Overview</CardTitle>
              <CardDescription className="text-stone-500">
                {medCompliance?.period || "Last 7 days"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">
                    {medCompliance?.summary?.given || 0}
                  </p>
                  <p className="text-stone-500 text-sm">Meds Given</p>
                </div>
                <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-400">
                    {medCompliance?.summary?.refused || 0}
                  </p>
                  <p className="text-stone-500 text-sm">Refused</p>
                </div>
                <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-400">
                    {medCompliance?.summary?.held || 0}
                  </p>
                  <p className="text-stone-500 text-sm">Held</p>
                </div>
                <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-red-400">
                    {medCompliance?.summary?.missed || 0}
                  </p>
                  <p className="text-stone-500 text-sm">Missed</p>
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
    </div>
  );
}
