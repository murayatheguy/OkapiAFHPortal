import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/lib/owner-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, getInquiries, updateInquiry, createTeamMember } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Facility, Inquiry, Review, TeamMember, TransportProvider, TransportBooking } from "@shared/schema";
import {
  Home, Users, MessageSquare, Star, Settings, LogOut, Building2,
  Loader2, Clock, CheckCircle2, AlertCircle, ChevronRight, Mail, Phone,
  Car, Heart, MapPin, DollarSign, Calendar, ArrowRight, ExternalLink,
  Bookmark, BookmarkCheck, Globe, Shield, GraduationCap, ClipboardList, Pencil, UserPlus,
  FileText, Stethoscope
} from "lucide-react";
import { CareManagement } from "@/pages/owner/care-management";
import { EditFacilityDialog } from "@/components/owner/edit-facility-dialog";
import { NCPWizard } from "@/components/owner/forms/ncp-wizard";
import { DisclosureWizard } from "@/components/owner/forms/disclosure-wizard";
import { NurseDelegationWizard } from "@/components/owner/forms/nurse-delegation-wizard";
import { AdmissionAgreementWizard } from "@/components/owner/forms/admission-agreement-wizard";
import { DisclosureServicesWizard } from "@/components/owner/forms/disclosure-services-wizard";
import { DashboardWidgets } from "@/components/owner/dashboard-widgets";

const TEAM_ROLES = [
  { value: "caregiver", label: "Caregiver" },
  { value: "med_tech", label: "Med Tech" },
  { value: "shift_lead", label: "Shift Lead" },
  { value: "nurse", label: "Nurse" },
  { value: "administrator", label: "Administrator" },
  { value: "owner", label: "Owner" },
];

export default function OwnerDashboardPage() {
  const [, setLocation] = useLocation();
  const { owner, facilities, claims, isLoading, isAuthenticated, logout } = useOwnerAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Add Team Member dialog state
  const [showAddTeamMemberDialog, setShowAddTeamMemberDialog] = useState(false);
  const [showNCPWizard, setShowNCPWizard] = useState(false);
  const [showDisclosureWizard, setShowDisclosureWizard] = useState(false);
  const [showNurseDelegationWizard, setShowNurseDelegationWizard] = useState(false);
  const [showAdmissionAgreementWizard, setShowAdmissionAgreementWizard] = useState(false);
  const [showDisclosureServicesWizard, setShowDisclosureServicesWizard] = useState(false);
  const [teamMemberForm, setTeamMemberForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "caregiver",
    hireDate: "",
  });

  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const { data: teamMembers = [], refetch: refetchTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["facility-team-members", selectedFacilityId],
    queryFn: () => getTeamMembers(selectedFacilityId!),
    enabled: !!selectedFacilityId,
  });

  // Create team member mutation
  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: typeof teamMemberForm) => {
      return createTeamMember({
        facilityId: selectedFacilityId!,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email || undefined,
        role: data.role,
        status: "active",
        isManualEntry: true,
      });
    },
    onSuccess: () => {
      // Invalidate all team member related queries
      queryClient.invalidateQueries({ queryKey: ["facility-team-members", selectedFacilityId] });
      queryClient.invalidateQueries({ queryKey: ["owner-facility-team-members", selectedFacilityId] });
      setShowAddTeamMemberDialog(false);
      setTeamMemberForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "caregiver",
        hireDate: "",
      });
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ["inquiries", selectedFacilityId],
    queryFn: () => getInquiries(selectedFacilityId!),
    enabled: !!selectedFacilityId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["facility-reviews", selectedFacilityId],
    queryFn: async () => {
      const response = await fetch(`/api/facilities/${selectedFacilityId}/reviews`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedFacilityId,
  });

  const { data: transportProviders = [], isLoading: loadingProviders } = useQuery<TransportProvider[]>({
    queryKey: ["transport-providers"],
    queryFn: async () => {
      const response = await fetch("/api/transport/providers");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: transportBookings = [], refetch: refetchBookings } = useQuery<TransportBooking[]>({
    queryKey: ["owner-transport-bookings", owner?.id],
    queryFn: async () => {
      const response = await fetch("/api/owner/transport/bookings");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!owner?.id,
  });

  const { data: savedProviders = [], refetch: refetchSaved } = useQuery<any[]>({
    queryKey: ["owner-saved-providers", owner?.id],
    queryFn: async () => {
      const response = await fetch("/api/owner/transport/saved");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!owner?.id,
  });

  const [selectedProvider, setSelectedProvider] = useState<TransportProvider | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [transportTab, setTransportTab] = useState("browse");
  const [countyFilter, setCountyFilter] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");

  const saveProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await fetch(`/api/owner/transport/providers/${providerId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => refetchSaved(),
  });

  const unsaveProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await fetch(`/api/owner/transport/providers/${providerId}/save`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unsave");
    },
    onSuccess: () => refetchSaved(),
  });

  const updateInquiryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Inquiry> }) => updateInquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", selectedFacilityId] });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/owner/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/owner/login");
    return null;
  }

  const newInquiries = inquiries.filter(i => i.status === "new").length;
  const pendingClaims = claims.filter(c => c.status === "pending" || c.status === "verified").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-white shadow-sm">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#0d9488', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#374151', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm hidden md:inline">
            Welcome, {owner?.name || "Provider"}
          </span>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-teal-700"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-[calc(100vh-73px)] flex-col border-r border-gray-200 bg-white p-4">
          {facilities.length > 1 && (
            <div className="mb-6">
              <label className="text-xs text-gray-500 mb-2 block">Select Facility</label>
              <Select value={selectedFacilityId || ""} onValueChange={setSelectedFacilityId}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <nav className="space-y-1 flex-1">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "transport", label: "Transport", icon: Car },
              { id: "care", label: "Care Management", icon: ClipboardList },
              { id: "team", label: "Team", icon: Users },
              { id: "inquiries", label: "Inquiries", icon: MessageSquare, badge: newInquiries },
              { id: "reviews", label: "Reviews", icon: Star },
              { id: "resources", label: "Resources", icon: FileText },
              { id: "settings", label: "Settings", icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge className="bg-teal-600 text-white text-xs">{item.badge}</Badge>
                ) : null}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <a
                href="https://okapi-health-ai-info10705.replit.app/academy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Okapi Academy
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </nav>

          {pendingClaims > 0 && (
            <Card className="mt-4 border-orange-300 bg-orange-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{pendingClaims} pending claim{pendingClaims > 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>

        <main className="flex-1 p-6">
          {facilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl text-gray-900 mb-2" style={{ fontFamily: "'Cormorant', serif" }}>
                No Facilities Yet
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                You don't have any facilities linked to your account yet.
                {pendingClaims > 0
                  ? ` You have ${pendingClaims} claim${pendingClaims > 1 ? 's' : ''} pending review.`
                  : " Search for your facility and submit a claim to get started."}
              </p>
              <Link href="/search">
                <Button className="bg-teal-600 hover:bg-teal-500">
                  Find Your Facility
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                      {selectedFacility?.name || "Dashboard"}
                    </h1>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:text-teal-700"
                        onClick={() => setShowEditDialog(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Facility
                      </Button>
                      <Link href={`/facility/${selectedFacility?.slug || selectedFacilityId}`}>
                        <Button variant="outline" className="border-gray-300 text-gray-700 hover:text-teal-700">
                          View Public Listing
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-gray-600 text-sm">Capacity</div>
                        <div className="text-2xl text-gray-900 font-semibold">
                          {selectedFacility?.capacity || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-gray-600 text-sm">Available Beds</div>
                        <div className="text-2xl text-gray-900 font-semibold">
                          {selectedFacility?.availableBeds || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-gray-600 text-sm">New Inquiries</div>
                        <div className="text-2xl text-gray-900 font-semibold">{newInquiries}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-gray-600 text-sm">Rating</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-teal-600 fill-amber-400" />
                          <span className="text-2xl text-gray-900 font-semibold">
                            {selectedFacility?.rating || "N/A"}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({selectedFacility?.reviewCount || 0})
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedFacility?.violationsCount && selectedFacility.violationsCount > 0 ? (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="text-red-600 font-medium">Compliance Alert</div>
                          <div className="text-gray-600 text-sm">
                            {selectedFacility.violationsCount} violation{selectedFacility.violationsCount > 1 ? 's' : ''} on record
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-green-200 overflow-hidden">
                      <CardContent
                        className="p-5 flex items-center gap-4"
                        style={{
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
                        }}
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                          <CheckCircle2 className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <div className="text-green-700 font-bold text-lg">Good Standing</div>
                          <div className="text-green-600 text-sm">No compliance violations on record</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Dashboard Widgets */}
                  {selectedFacilityId && (
                    <DashboardWidgets
                      facilityId={selectedFacilityId}
                      onNavigate={setActiveSection}
                    />
                  )}
                </div>
              )}

              {activeSection === "team" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                      Team Members
                    </h1>
                    <Button
                      onClick={() => setShowAddTeamMemberDialog(true)}
                      className="bg-teal-600 hover:bg-teal-500 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Team Member
                    </Button>
                  </div>

                  {teamMembers.length === 0 ? (
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No team members added yet.</p>
                        <Button
                          onClick={() => setShowAddTeamMemberDialog(true)}
                          variant="outline"
                          className="mt-4 border-gray-300 text-teal-700 hover:bg-gray-100"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Team Member
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map(member => (
                        <Card key={member.id} className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatarUrl || undefined} />
                                <AvatarFallback className="bg-teal-50 text-teal-700">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="text-gray-900 font-medium">{member.name}</div>
                                <div className="text-gray-500 text-sm capitalize">{member.role.replace('_', ' ')}</div>
                              </div>
                              <Badge className={member.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}>
                                {member.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "inquiries" && (
                <div className="space-y-6">
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                    Inquiries
                  </h1>
                  
                  {inquiries.length === 0 ? (
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-teal-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                        <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                          When families submit inquiries from your public listing, they'll appear here.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-gray-500 mb-2">Share your listing link to start receiving inquiries:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-white px-3 py-2 rounded border text-gray-700 truncate">
                              {window.location.origin}/facility/{selectedFacility?.id}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/facility/${selectedFacility?.id}`);
                                toast({ title: "Link copied!", description: "Share this link with families" });
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map(inquiry => (
                        <Card key={inquiry.id} className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-900 font-medium">{inquiry.name}</span>
                                  <Badge 
                                    variant={inquiry.status === "new" ? "default" : "secondary"}
                                    className={inquiry.status === "new" ? "bg-teal-600" : ""}
                                  >
                                    {inquiry.status}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{inquiry.message}</p>
                                <div className="flex items-center gap-4 text-gray-500 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {inquiry.email}
                                  </span>
                                  {inquiry.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {inquiry.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {inquiry.status === "new" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-teal-700"
                                  onClick={() => updateInquiryMutation.mutate({ 
                                    id: inquiry.id, 
                                    data: { status: "contacted" } 
                                  })}
                                >
                                  Mark Contacted
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "reviews" && (
                <div className="space-y-6">
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                    Reviews
                  </h1>
                  
                  {reviews.length === 0 ? (
                    <Card className="border-gray-200 bg-white shadow-sm">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                          <Star className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                          When families leave reviews on your listing, you can view and respond to them here.
                        </p>
                        <div className="bg-amber-50 rounded-lg p-4 max-w-sm mx-auto border border-amber-100">
                          <p className="text-sm text-amber-800">
                            Great care leads to great reviews. They'll come!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <Card key={review.id} className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1,2,3,4,5].map(i => (
                                  <Star 
                                    key={i}
                                    className={`h-4 w-4 ${i <= review.rating ? "text-teal-600 fill-amber-400" : "text-gray-400"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-gray-600 text-sm">by {review.authorName}</span>
                            </div>
                            <p className="text-gray-700">{review.content}</p>
                            {review.ownerResponse && (
                              <div className="mt-3 pl-4 border-l-2 border-gray-300">
                                <p className="text-gray-500 text-sm">Your response:</p>
                                <p className="text-gray-600 text-sm">{review.ownerResponse}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "transport" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                      Transport Marketplace
                    </h1>
                  </div>

                  <Tabs value={transportTab} onValueChange={setTransportTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200">
                      <TabsTrigger value="browse" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        Browse Providers
                      </TabsTrigger>
                      <TabsTrigger value="saved" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        Saved ({savedProviders.length})
                      </TabsTrigger>
                      <TabsTrigger value="bookings" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        My Bookings ({transportBookings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="mt-6">
                      <div className="mb-6 p-4 bg-white shadow-sm border border-gray-200 rounded-lg">
                        <p className="text-gray-700 text-sm">
                          Browse trusted non-emergency medical transport (NEMT) providers serving Washington State. 
                          Compare services, pricing, and reviews to find the best option for your residents.
                        </p>
                      </div>

                      {loadingProviders ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                        </div>
                      ) : transportProviders.length === 0 ? (
                        <Card className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-8 text-center">
                            <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No transport providers available yet.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {transportProviders.map(provider => {
                            const isSaved = savedProviders.some((s: any) => s.providerId === provider.id);
                            return (
                              <Card key={provider.id} className="border-gray-200 bg-white shadow-sm hover:border-teal-300 transition-colors">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      {provider.logoUrl ? (
                                        <img src={provider.logoUrl} alt={provider.name} className="h-12 w-12 rounded-lg object-cover" />
                                      ) : (
                                        <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center">
                                          <Car className="h-6 w-6 text-teal-600" />
                                        </div>
                                      )}
                                      <div>
                                        <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                                          {provider.name}
                                          {provider.isFeatured && (
                                            <Badge className="bg-teal-600 text-xs">Featured</Badge>
                                          )}
                                        </CardTitle>
                                        {provider.rating && parseFloat(provider.rating) > 0 && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-3.5 w-3.5 text-teal-600 fill-amber-400" />
                                            <span className="text-teal-700 text-sm">{provider.rating}</span>
                                            <span className="text-gray-500 text-xs">({provider.reviewCount} reviews)</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={isSaved ? "text-teal-600" : "text-gray-500 hover:text-teal-600"}
                                      onClick={() => isSaved 
                                        ? unsaveProviderMutation.mutate(provider.id)
                                        : saveProviderMutation.mutate(provider.id)
                                      }
                                      data-testid={`button-save-provider-${provider.id}`}
                                    >
                                      {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {provider.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2">{provider.description}</p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {(provider.vehicleTypes as string[] || []).slice(0, 3).map((type, i) => (
                                      <Badge key={i} variant="outline" className="border-stone-700 text-gray-600 text-xs">
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    {provider.acceptsMedicaid && (
                                      <span className="flex items-center gap-1 text-green-400">
                                        <Shield className="h-3.5 w-3.5" />
                                        Medicaid
                                      </span>
                                    )}
                                    {provider.baseRateCents && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        From ${(provider.baseRateCents / 100).toFixed(2)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-teal-600 hover:bg-teal-500"
                                      onClick={() => {
                                        setSelectedProvider(provider);
                                        setBookingModalOpen(true);
                                      }}
                                      data-testid={`button-book-provider-${provider.id}`}
                                    >
                                      <Calendar className="h-4 w-4 mr-1" />
                                      Request Booking
                                    </Button>
                                    {provider.website && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-gray-300 text-gray-700"
                                        asChild
                                      >
                                        <a href={provider.website} target="_blank" rel="noopener noreferrer">
                                          <Globe className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="saved" className="mt-6">
                      {savedProviders.length === 0 ? (
                        <Card className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-8 text-center">
                            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No saved providers yet.</p>
                            <p className="text-gray-500 text-sm mt-1">Browse providers and save your favorites for quick access.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {savedProviders.map((saved: any) => (
                            <Card key={saved.id} className="border-gray-200 bg-white shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                                      <Car className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                      <div className="text-gray-900 font-medium">{saved.provider?.name}</div>
                                      <div className="text-gray-500 text-xs">Saved provider</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-teal-600 hover:bg-teal-500"
                                      onClick={() => {
                                        setSelectedProvider(saved.provider);
                                        setBookingModalOpen(true);
                                      }}
                                    >
                                      Book
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-gray-500 hover:text-red-400"
                                      onClick={() => unsaveProviderMutation.mutate(saved.providerId)}
                                    >
                                      <Bookmark className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="bookings" className="mt-6">
                      {transportBookings.length === 0 ? (
                        <Card className="border-gray-200 bg-white shadow-sm">
                          <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No bookings yet.</p>
                            <p className="text-gray-500 text-sm mt-1">Browse transport providers and schedule rides for your residents.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {transportBookings.map(booking => (
                            <Card key={booking.id} className="border-gray-200 bg-white shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-900 font-medium">#{booking.bookingNumber}</span>
                                      <Badge 
                                        className={
                                          booking.status === 'confirmed' ? 'bg-green-600' :
                                          booking.status === 'pending' ? 'bg-teal-600' :
                                          booking.status === 'completed' ? 'bg-blue-600' :
                                          booking.status === 'cancelled' ? 'bg-red-600' :
                                          'bg-gray-400'
                                        }
                                      >
                                        {booking.status}
                                      </Badge>
                                    </div>
                                    <div className="text-gray-600 text-sm space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {booking.pickupAddress}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <ArrowRight className="h-3.5 w-3.5" />
                                        {booking.dropoffAddress}
                                      </div>
                                    </div>
                                  </div>
                                  {booking.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-900/30 text-red-400 hover:bg-red-900/20"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeSection === "care" && selectedFacilityId && (
                <CareManagement
                  facilityId={selectedFacilityId}
                  facilityName={selectedFacility?.name}
                  facility={selectedFacility}
                />
              )}

              {activeSection === "resources" && selectedFacilityId && (
                <div className="space-y-6">
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                    Resources
                  </h1>
                  <p className="text-gray-600">
                    Access fillable DSHS forms, care plan templates, and compliance documents.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* NCP Form Card */}
                    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <FileText className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base">Negotiated Care Plan</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">DSHS Form 10-503</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          Required care plan documenting resident needs, preferences, and services.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Required</Badge>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                            onClick={() => setShowNCPWizard(true)}
                          >
                            Start Form
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disclosure of Charges Form Card */}
                    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <DollarSign className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base">Disclosure of Charges</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">DSHS 15-449</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          Required disclosure of rates, fees, and services provided to residents.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Required</Badge>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                            onClick={() => setShowDisclosureWizard(true)}
                          >
                            Start Form
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Nurse Delegation Form Card */}
                    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <Stethoscope className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base">Nurse Delegation</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">DSHS 01-212</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          Authorization for registered nurse delegation of nursing tasks.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Fillable PDF</Badge>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                            onClick={() => setShowNurseDelegationWizard(true)}
                          >
                            Start Form
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Admission Agreement Form Card */}
                    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <FileText className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base">Admission Agreement</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">DSHS 10-270</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          Resident admission agreement documenting terms and conditions.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Required</Badge>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                            onClick={() => setShowAdmissionAgreementWizard(true)}
                          >
                            Start Form
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disclosure of Services Form Card */}
                    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <ClipboardList className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-900 text-base">Disclosure of Services</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">Services Form</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          Services and amenities disclosure for prospective residents.
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Required</Badge>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                            onClick={() => setShowDisclosureServicesWizard(true)}
                          >
                            Start Form
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50 shadow-sm opacity-60">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <CardTitle className="text-gray-500 text-base">Incident Report</CardTitle>
                            <CardDescription className="text-gray-400 text-xs">Coming Soon</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-400">
                          Detailed incident documentation for DSHS reporting requirements.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeSection === "settings" && (
                <div className="space-y-6">
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                    Settings
                  </h1>
                  
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-gray-500 text-sm">Name</label>
                        <div className="text-gray-900">{owner?.name}</div>
                      </div>
                      <Separator className="bg-gray-100" />
                      <div>
                        <label className="text-gray-500 text-sm">Email</label>
                        <div className="text-gray-900">{owner?.email}</div>
                      </div>
                      <Separator className="bg-gray-100" />
                      <div>
                        <label className="text-gray-500 text-sm">Phone</label>
                        <div className="text-gray-900">{owner?.phone || "Not set"}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="bg-white border-gray-300 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
              Request Transport
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedProvider?.name ? `Schedule a ride with ${selectedProvider.name}` : "Schedule transport for your resident"}
            </DialogDescription>
          </DialogHeader>
          
          <BookingForm 
            provider={selectedProvider}
            facilityId={selectedFacilityId}
            onSuccess={() => {
              setBookingModalOpen(false);
              setSelectedProvider(null);
              refetchBookings();
            }}
            onCancel={() => {
              setBookingModalOpen(false);
              setSelectedProvider(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Facility Dialog */}
      {selectedFacility && (
        <EditFacilityDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          facility={selectedFacility}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["owner-facilities"] });
          }}
        />
      )}

      {/* Add Team Member Dialog */}
      <Dialog open={showAddTeamMemberDialog} onOpenChange={setShowAddTeamMemberDialog}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Team Member</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new team member to your facility
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">First Name *</Label>
                <Input
                  value={teamMemberForm.firstName}
                  onChange={(e) => setTeamMemberForm({ ...teamMemberForm, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-gray-100 border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Last Name *</Label>
                <Input
                  value={teamMemberForm.lastName}
                  onChange={(e) => setTeamMemberForm({ ...teamMemberForm, lastName: e.target.value })}
                  placeholder="Smith"
                  className="bg-gray-100 border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Email (optional)</Label>
              <Input
                type="email"
                value={teamMemberForm.email}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-gray-100 border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Phone (optional)</Label>
              <Input
                type="tel"
                value={teamMemberForm.phone}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-gray-100 border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Role *</Label>
              <Select
                value={teamMemberForm.role}
                onValueChange={(value) => setTeamMemberForm({ ...teamMemberForm, role: value })}
              >
                <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 border-gray-300">
                  {TEAM_ROLES.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className="text-gray-900 focus:bg-teal-50"
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Hire Date (optional)</Label>
              <Input
                type="date"
                value={teamMemberForm.hireDate}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, hireDate: e.target.value })}
                className="bg-gray-100 border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddTeamMemberDialog(false)}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTeamMemberMutation.mutate(teamMemberForm)}
              disabled={!teamMemberForm.firstName || !teamMemberForm.lastName || createTeamMemberMutation.isPending}
              className="bg-teal-600 hover:bg-teal-500"
            >
              {createTeamMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NCP Wizard */}
      {showNCPWizard && selectedFacilityId && (
        <NCPWizard
          facilityId={selectedFacilityId}
          onClose={() => setShowNCPWizard(false)}
        />
      )}

      {/* Disclosure of Charges Wizard */}
      {showDisclosureWizard && selectedFacilityId && (
        <DisclosureWizard
          facilityId={selectedFacilityId}
          onClose={() => setShowDisclosureWizard(false)}
        />
      )}

      {/* Nurse Delegation Wizard */}
      {showNurseDelegationWizard && selectedFacilityId && (
        <NurseDelegationWizard
          facilityId={selectedFacilityId}
          onClose={() => setShowNurseDelegationWizard(false)}
        />
      )}

      {/* Admission Agreement Wizard */}
      {showAdmissionAgreementWizard && selectedFacilityId && (
        <AdmissionAgreementWizard
          facilityId={selectedFacilityId}
          onClose={() => setShowAdmissionAgreementWizard(false)}
        />
      )}

      {/* Disclosure of Services Wizard */}
      {showDisclosureServicesWizard && selectedFacilityId && (
        <DisclosureServicesWizard
          facilityId={selectedFacilityId}
          onClose={() => setShowDisclosureServicesWizard(false)}
        />
      )}
    </div>
  );
}

function BookingForm({ 
  provider, 
  facilityId,
  onSuccess, 
  onCancel 
}: { 
  provider: TransportProvider | null;
  facilityId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    residentInitials: "",
    residentMobility: "ambulatory",
    pickupDate: "",
    pickupTime: "",
    pickupLocation: "",
    pickupAddress: "",
    dropoffLocation: "",
    dropoffAddress: "",
    appointmentTime: "",
    tripType: "one_way",
    specialNeeds: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/owner/transport/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          facilityId,
          ...formData,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create booking");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error creating booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Resident Initials *</label>
          <Input
            required
            value={formData.residentInitials}
            onChange={(e) => setFormData({ ...formData, residentInitials: e.target.value })}
            placeholder="e.g. JD"
            className="bg-gray-100 border-gray-300 text-gray-900"
            data-testid="input-resident-initials"
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Mobility Type *</label>
          <Select value={formData.residentMobility} onValueChange={(value) => setFormData({ ...formData, residentMobility: value })}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambulatory">Ambulatory (can walk)</SelectItem>
              <SelectItem value="wheelchair">Wheelchair</SelectItem>
              <SelectItem value="gurney">Gurney/Stretcher</SelectItem>
              <SelectItem value="bariatric">Bariatric</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Pickup Date *</label>
          <Input
            required
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            className="bg-gray-100 border-gray-300 text-gray-900"
            data-testid="input-pickup-date"
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Pickup Time *</label>
          <Input
            required
            type="time"
            value={formData.pickupTime}
            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            className="bg-gray-100 border-gray-300 text-gray-900"
            data-testid="input-pickup-time"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-gray-600 text-sm">Pickup Location *</label>
        <Input
          required
          value={formData.pickupLocation}
          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
          placeholder="e.g. Sunny Care Home, 123 Main St, Seattle"
          className="bg-gray-100 border-gray-300 text-gray-900"
          data-testid="input-pickup-location"
        />
      </div>

      <div className="space-y-2">
        <label className="text-gray-600 text-sm">Dropoff Location *</label>
        <Input
          required
          value={formData.dropoffLocation}
          onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
          placeholder="e.g. Dr. Smith's Office, 456 Medical Center Dr"
          className="bg-gray-100 border-gray-300 text-gray-900"
          data-testid="input-dropoff-location"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Trip Type</label>
          <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_way">One Way</SelectItem>
              <SelectItem value="round_trip">Round Trip</SelectItem>
              <SelectItem value="wait_and_return">Wait and Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-gray-600 text-sm">Appointment Time</label>
          <Input
            type="time"
            value={formData.appointmentTime}
            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            className="bg-gray-100 border-gray-300 text-gray-900"
            data-testid="input-appointment-time"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-gray-600 text-sm">Special Needs</label>
        <Textarea
          value={formData.specialNeeds}
          onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
          placeholder="Any mobility needs, assistance requirements, oxygen, or other notes..."
          className="bg-gray-100 border-gray-300 text-gray-900 min-h-[80px]"
          data-testid="input-special-needs"
        />
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700"
          data-testid="button-cancel-booking"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-500"
          data-testid="button-submit-booking"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
