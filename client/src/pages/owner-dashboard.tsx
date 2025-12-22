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
  Bookmark, BookmarkCheck, Globe, Shield, GraduationCap, ClipboardList, Pencil, UserPlus
} from "lucide-react";
import { CareManagement } from "@/pages/owner/care-management";
import { EditFacilityDialog } from "@/components/owner/edit-facility-dialog";

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1a14' }}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
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
    <div className="min-h-screen" style={{ backgroundColor: '#0d1a14' }}>
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/20">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-stone-400 text-sm hidden md:inline">
            Welcome, {owner?.name || "Provider"}
          </span>
          <Button 
            variant="ghost" 
            className="text-stone-400 hover:text-amber-200"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-[calc(100vh-73px)] flex-col border-r border-amber-900/20 p-4">
          {facilities.length > 1 && (
            <div className="mb-6">
              <label className="text-xs text-stone-500 mb-2 block">Select Facility</label>
              <Select value={selectedFacilityId || ""} onValueChange={setSelectedFacilityId}>
                <SelectTrigger className="bg-stone-900/50 border-amber-900/30 text-stone-100">
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
              { id: "settings", label: "Settings", icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? "bg-amber-900/30 text-amber-200" 
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge className="bg-amber-600 text-white text-xs">{item.badge}</Badge>
                ) : null}
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-amber-900/20">
              <a
                href="https://okapi-health-ai-info10705.replit.app/academy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
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
            <Card className="mt-4 border-amber-600/30 bg-amber-900/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm">
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
              <Building2 className="h-16 w-16 text-stone-600 mb-4" />
              <h2 className="text-2xl text-stone-200 mb-2" style={{ fontFamily: "'Cormorant', serif" }}>
                No Facilities Yet
              </h2>
              <p className="text-stone-400 mb-6 max-w-md">
                You don't have any facilities linked to your account yet. 
                {pendingClaims > 0 
                  ? ` You have ${pendingClaims} claim${pendingClaims > 1 ? 's' : ''} pending review.`
                  : " Search for your facility and submit a claim to get started."}
              </p>
              <Link href="/search">
                <Button className="bg-amber-600 hover:bg-amber-500">
                  Find Your Facility
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {activeSection === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                      {selectedFacility?.name || "Dashboard"}
                    </h1>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-amber-900/30 text-stone-300 hover:text-amber-200"
                        onClick={() => setShowEditDialog(true)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Facility
                      </Button>
                      <Link href={`/facility/${selectedFacility?.slug || selectedFacilityId}`}>
                        <Button variant="outline" className="border-amber-900/30 text-stone-300 hover:text-amber-200">
                          View Public Listing
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-4">
                        <div className="text-stone-400 text-sm">Capacity</div>
                        <div className="text-2xl text-amber-100 font-semibold">
                          {selectedFacility?.capacity || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-4">
                        <div className="text-stone-400 text-sm">Available Beds</div>
                        <div className="text-2xl text-amber-100 font-semibold">
                          {selectedFacility?.availableBeds || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-4">
                        <div className="text-stone-400 text-sm">New Inquiries</div>
                        <div className="text-2xl text-amber-100 font-semibold">{newInquiries}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-4">
                        <div className="text-stone-400 text-sm">Rating</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                          <span className="text-2xl text-amber-100 font-semibold">
                            {selectedFacility?.rating || "N/A"}
                          </span>
                          <span className="text-stone-500 text-sm">
                            ({selectedFacility?.reviewCount || 0})
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedFacility?.violationsCount && selectedFacility.violationsCount > 0 ? (
                    <Card className="border-red-900/30 bg-red-900/10">
                      <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div>
                          <div className="text-red-400 font-medium">Compliance Alert</div>
                          <div className="text-stone-400 text-sm">
                            {selectedFacility.violationsCount} violation{selectedFacility.violationsCount > 1 ? 's' : ''} on record
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-green-900/30 bg-green-900/10">
                      <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="text-green-400 font-medium">Good Standing</div>
                          <div className="text-stone-400 text-sm">No compliance violations on record</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeSection === "team" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                      Team Members
                    </h1>
                    <Button
                      onClick={() => setShowAddTeamMemberDialog(true)}
                      className="bg-amber-600 hover:bg-amber-500 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Team Member
                    </Button>
                  </div>

                  {teamMembers.length === 0 ? (
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                        <p className="text-stone-400">No team members added yet.</p>
                        <Button
                          onClick={() => setShowAddTeamMemberDialog(true)}
                          variant="outline"
                          className="mt-4 border-amber-900/30 text-amber-200 hover:bg-amber-900/20"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Team Member
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map(member => (
                        <Card key={member.id} className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatarUrl || undefined} />
                                <AvatarFallback className="bg-amber-900/30 text-amber-200">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="text-stone-200 font-medium">{member.name}</div>
                                <div className="text-stone-500 text-sm capitalize">{member.role.replace('_', ' ')}</div>
                              </div>
                              <Badge className={member.status === 'active' ? 'bg-green-600' : 'bg-stone-600'}>
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
                  <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                    Inquiries
                  </h1>
                  
                  {inquiries.length === 0 ? (
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                        <p className="text-stone-400">No inquiries yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map(inquiry => (
                        <Card key={inquiry.id} className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-stone-200 font-medium">{inquiry.name}</span>
                                  <Badge 
                                    variant={inquiry.status === "new" ? "default" : "secondary"}
                                    className={inquiry.status === "new" ? "bg-amber-600" : ""}
                                  >
                                    {inquiry.status}
                                  </Badge>
                                </div>
                                <p className="text-stone-400 text-sm mb-2">{inquiry.message}</p>
                                <div className="flex items-center gap-4 text-stone-500 text-xs">
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
                                  className="border-amber-900/30 text-amber-200"
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
                  <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                    Reviews
                  </h1>
                  
                  {reviews.length === 0 ? (
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-8 text-center">
                        <Star className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                        <p className="text-stone-400">No reviews yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <Card key={review.id} className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1,2,3,4,5].map(i => (
                                  <Star 
                                    key={i}
                                    className={`h-4 w-4 ${i <= review.rating ? "text-amber-400 fill-amber-400" : "text-stone-600"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-stone-400 text-sm">by {review.authorName}</span>
                            </div>
                            <p className="text-stone-300">{review.content}</p>
                            {review.ownerResponse && (
                              <div className="mt-3 pl-4 border-l-2 border-amber-900/30">
                                <p className="text-stone-500 text-sm">Your response:</p>
                                <p className="text-stone-400 text-sm">{review.ownerResponse}</p>
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
                    <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                      Transport Marketplace
                    </h1>
                  </div>

                  <Tabs value={transportTab} onValueChange={setTransportTab} className="w-full">
                    <TabsList className="bg-stone-900/50 border border-amber-900/20">
                      <TabsTrigger value="browse" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200">
                        Browse Providers
                      </TabsTrigger>
                      <TabsTrigger value="saved" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200">
                        Saved ({savedProviders.length})
                      </TabsTrigger>
                      <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-200">
                        My Bookings ({transportBookings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="mt-6">
                      <div className="mb-6 p-4 bg-stone-900/30 border border-amber-900/20 rounded-lg">
                        <p className="text-stone-300 text-sm">
                          Browse trusted non-emergency medical transport (NEMT) providers serving Washington State. 
                          Compare services, pricing, and reviews to find the best option for your residents.
                        </p>
                      </div>

                      {loadingProviders ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                        </div>
                      ) : transportProviders.length === 0 ? (
                        <Card className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-8 text-center">
                            <Car className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                            <p className="text-stone-400">No transport providers available yet.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {transportProviders.map(provider => {
                            const isSaved = savedProviders.some((s: any) => s.providerId === provider.id);
                            return (
                              <Card key={provider.id} className="border-amber-900/20 bg-stone-900/30 hover:border-amber-600/40 transition-colors">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      {provider.logoUrl ? (
                                        <img src={provider.logoUrl} alt={provider.name} className="h-12 w-12 rounded-lg object-cover" />
                                      ) : (
                                        <div className="h-12 w-12 rounded-lg bg-amber-900/30 flex items-center justify-center">
                                          <Car className="h-6 w-6 text-amber-400" />
                                        </div>
                                      )}
                                      <div>
                                        <CardTitle className="text-stone-200 text-lg flex items-center gap-2">
                                          {provider.name}
                                          {provider.isFeatured && (
                                            <Badge className="bg-amber-600 text-xs">Featured</Badge>
                                          )}
                                        </CardTitle>
                                        {provider.rating && parseFloat(provider.rating) > 0 && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                            <span className="text-amber-200 text-sm">{provider.rating}</span>
                                            <span className="text-stone-500 text-xs">({provider.reviewCount} reviews)</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={isSaved ? "text-amber-400" : "text-stone-500 hover:text-amber-400"}
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
                                    <p className="text-stone-400 text-sm line-clamp-2">{provider.description}</p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {(provider.vehicleTypes as string[] || []).slice(0, 3).map((type, i) => (
                                      <Badge key={i} variant="outline" className="border-stone-700 text-stone-400 text-xs">
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-stone-500">
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
                                      className="flex-1 bg-amber-600 hover:bg-amber-500"
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
                                        className="border-amber-900/30 text-stone-300"
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
                        <Card className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-8 text-center">
                            <Bookmark className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                            <p className="text-stone-400">No saved providers yet.</p>
                            <p className="text-stone-500 text-sm mt-1">Browse providers and save your favorites for quick access.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {savedProviders.map((saved: any) => (
                            <Card key={saved.id} className="border-amber-900/20 bg-stone-900/30">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
                                      <Car className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                      <div className="text-stone-200 font-medium">{saved.provider?.name}</div>
                                      <div className="text-stone-500 text-xs">Saved provider</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-amber-600 hover:bg-amber-500"
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
                                      className="text-stone-500 hover:text-red-400"
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
                        <Card className="border-amber-900/20 bg-stone-900/30">
                          <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                            <p className="text-stone-400">No bookings yet.</p>
                            <p className="text-stone-500 text-sm mt-1">Browse transport providers and schedule rides for your residents.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {transportBookings.map(booking => (
                            <Card key={booking.id} className="border-amber-900/20 bg-stone-900/30">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-stone-200 font-medium">#{booking.bookingNumber}</span>
                                      <Badge 
                                        className={
                                          booking.status === 'confirmed' ? 'bg-green-600' :
                                          booking.status === 'pending' ? 'bg-amber-600' :
                                          booking.status === 'completed' ? 'bg-blue-600' :
                                          booking.status === 'cancelled' ? 'bg-red-600' :
                                          'bg-stone-600'
                                        }
                                      >
                                        {booking.status}
                                      </Badge>
                                    </div>
                                    <div className="text-stone-400 text-sm space-y-1">
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
                />
              )}

              {activeSection === "settings" && (
                <div className="space-y-6">
                  <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                    Settings
                  </h1>
                  
                  <Card className="border-amber-900/20 bg-stone-900/30">
                    <CardHeader>
                      <CardTitle className="text-stone-200">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-stone-500 text-sm">Name</label>
                        <div className="text-stone-200">{owner?.name}</div>
                      </div>
                      <Separator className="bg-amber-900/20" />
                      <div>
                        <label className="text-stone-500 text-sm">Email</label>
                        <div className="text-stone-200">{owner?.email}</div>
                      </div>
                      <Separator className="bg-amber-900/20" />
                      <div>
                        <label className="text-stone-500 text-sm">Phone</label>
                        <div className="text-stone-200">{owner?.phone || "Not set"}</div>
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
        <DialogContent className="bg-stone-900 border-amber-900/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
              Request Transport
            </DialogTitle>
            <DialogDescription className="text-stone-400">
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
        <DialogContent className="bg-stone-900 border-amber-900/30">
          <DialogHeader>
            <DialogTitle className="text-stone-200">Add Team Member</DialogTitle>
            <DialogDescription className="text-stone-400">
              Add a new team member to your facility
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-stone-300">First Name *</Label>
                <Input
                  value={teamMemberForm.firstName}
                  onChange={(e) => setTeamMemberForm({ ...teamMemberForm, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-stone-800 border-amber-900/30 text-stone-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-300">Last Name *</Label>
                <Input
                  value={teamMemberForm.lastName}
                  onChange={(e) => setTeamMemberForm({ ...teamMemberForm, lastName: e.target.value })}
                  placeholder="Smith"
                  className="bg-stone-800 border-amber-900/30 text-stone-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-stone-300">Email (optional)</Label>
              <Input
                type="email"
                value={teamMemberForm.email}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-stone-300">Phone (optional)</Label>
              <Input
                type="tel"
                value={teamMemberForm.phone}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-stone-300">Role *</Label>
              <Select
                value={teamMemberForm.role}
                onValueChange={(value) => setTeamMemberForm({ ...teamMemberForm, role: value })}
              >
                <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-amber-900/30">
                  {TEAM_ROLES.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className="text-stone-200 focus:bg-amber-900/30"
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-stone-300">Hire Date (optional)</Label>
              <Input
                type="date"
                value={teamMemberForm.hireDate}
                onChange={(e) => setTeamMemberForm({ ...teamMemberForm, hireDate: e.target.value })}
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddTeamMemberDialog(false)}
              className="border-amber-900/30 text-stone-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTeamMemberMutation.mutate(teamMemberForm)}
              disabled={!teamMemberForm.firstName || !teamMemberForm.lastName || createTeamMemberMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {createTeamMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <label className="text-stone-400 text-sm">Resident Initials *</label>
          <Input
            required
            value={formData.residentInitials}
            onChange={(e) => setFormData({ ...formData, residentInitials: e.target.value })}
            placeholder="e.g. JD"
            className="bg-stone-800 border-amber-900/30 text-stone-200"
            data-testid="input-resident-initials"
          />
        </div>
        <div className="space-y-2">
          <label className="text-stone-400 text-sm">Mobility Type *</label>
          <Select value={formData.residentMobility} onValueChange={(value) => setFormData({ ...formData, residentMobility: value })}>
            <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
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
          <label className="text-stone-400 text-sm">Pickup Date *</label>
          <Input
            required
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            className="bg-stone-800 border-amber-900/30 text-stone-200"
            data-testid="input-pickup-date"
          />
        </div>
        <div className="space-y-2">
          <label className="text-stone-400 text-sm">Pickup Time *</label>
          <Input
            required
            type="time"
            value={formData.pickupTime}
            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            className="bg-stone-800 border-amber-900/30 text-stone-200"
            data-testid="input-pickup-time"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-stone-400 text-sm">Pickup Location *</label>
        <Input
          required
          value={formData.pickupLocation}
          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
          placeholder="e.g. Sunny Care Home, 123 Main St, Seattle"
          className="bg-stone-800 border-amber-900/30 text-stone-200"
          data-testid="input-pickup-location"
        />
      </div>

      <div className="space-y-2">
        <label className="text-stone-400 text-sm">Dropoff Location *</label>
        <Input
          required
          value={formData.dropoffLocation}
          onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
          placeholder="e.g. Dr. Smith's Office, 456 Medical Center Dr"
          className="bg-stone-800 border-amber-900/30 text-stone-200"
          data-testid="input-dropoff-location"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-stone-400 text-sm">Trip Type</label>
          <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
            <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
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
          <label className="text-stone-400 text-sm">Appointment Time</label>
          <Input
            type="time"
            value={formData.appointmentTime}
            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            className="bg-stone-800 border-amber-900/30 text-stone-200"
            data-testid="input-appointment-time"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-stone-400 text-sm">Special Needs</label>
        <Textarea
          value={formData.specialNeeds}
          onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
          placeholder="Any mobility needs, assistance requirements, oxygen, or other notes..."
          className="bg-stone-800 border-amber-900/30 text-stone-200 min-h-[80px]"
          data-testid="input-special-needs"
        />
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-amber-900/30 text-stone-300"
          data-testid="button-cancel-booking"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-amber-600 hover:bg-amber-500"
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
