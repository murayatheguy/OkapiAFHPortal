import { User, Briefcase, GraduationCap, ShieldCheck, AlertCircle, CheckCircle2, Clock, FileText, Upload, Mail, X, Plus, Users, Loader2, MessageSquare, Star, Phone, Calendar, Send, Truck, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, getFacility, createTeamMember, createCredential, getInquiries, updateInquiry } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import type { Inquiry, Review, TransportProvider } from "@shared/schema";
import caregiver1 from '@assets/generated_images/generic_portrait_of_a_friendly_male_caregiver.png';
import caregiver2 from '@assets/generated_images/generic_portrait_of_a_friendly_female_caregiver.png';

interface ManualCredential {
  id: string;
  name: string;
  issueDate: string;
  expirationDate: string;
}

interface ManualFormData {
  fullName: string;
  email: string;
  role: string;
  credentials: ManualCredential[];
}

const initialManualForm: ManualFormData = {
  fullName: "",
  email: "",
  role: "",
  credentials: [{ id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
};

const initialInviteForm: ManualFormData = {
  fullName: "",
  email: "",
  role: "",
  credentials: [{ id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
};

export default function OwnerDashboard() {
  const [activeSection, setActiveSection] = useState("team");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [manualForm, setManualForm] = useState<ManualFormData>(initialManualForm);
  const [inviteForm, setInviteForm] = useState<ManualFormData>(initialInviteForm);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");
  const queryClient = useQueryClient();
  
  const FACILITY_ID = "d66a7b70-4972-4ff0-85c5-ae9799b8c76a";
  
  const { data: facility, isLoading: facilityLoading } = useQuery({
    queryKey: ["facility", FACILITY_ID],
    queryFn: async () => {
      const facilities = await getFacility(FACILITY_ID);
      return facilities;
    },
    retry: false,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["team-members", FACILITY_ID],
    queryFn: async () => {
      const members = await getTeamMembers(FACILITY_ID);
      return members;
    },
    retry: false,
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ["inquiries", FACILITY_ID],
    queryFn: () => getInquiries(FACILITY_ID),
    retry: false,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["facility-reviews", FACILITY_ID],
    queryFn: async () => {
      const response = await fetch(`/api/facilities/${FACILITY_ID}/reviews`);
      if (!response.ok) return [];
      return response.json();
    },
    retry: false,
  });

  const { data: transportProviders = [], isLoading: transportLoading } = useQuery<TransportProvider[]>({
    queryKey: ["transport-providers"],
    queryFn: async () => {
      const response = await fetch("/api/transport/providers");
      if (!response.ok) return [];
      return response.json();
    },
    retry: false,
  });

  const createMemberMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", FACILITY_ID] });
      setShowInviteDialog(false);
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Inquiry> }) => updateInquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", FACILITY_ID] });
    },
  });

  const respondToReviewMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerResponse: response, ownerRespondedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to respond");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility-reviews", FACILITY_ID] });
      setResponseDialogOpen(false);
      setSelectedReview(null);
      setResponseText("");
    },
  });
  
  const isLoading = facilityLoading || teamLoading;
  const newInquiries = inquiries.filter(i => i.status === "new").length;

  const addCredential = () => {
    setManualForm(prev => ({
      ...prev,
      credentials: [...prev.credentials, { id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
    }));
  };

  const removeCredential = (id: string) => {
    setManualForm(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c.id !== id)
    }));
  };

  const updateCredential = (id: string, field: keyof ManualCredential, value: string) => {
    setManualForm(prev => ({
      ...prev,
      credentials: prev.credentials.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const getCredentialStatus = (expirationDate: string): "Current" | "Expiring Soon" | "Expired" => {
    if (!expirationDate) return "Current";
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expDate < today) return "Expired";
    if (expDate < thirtyDaysFromNow) return "Expiring Soon";
    return "Current";
  };

  const handleManualSubmit = async () => {
    if (!manualForm.fullName.trim() || !manualForm.role) return;
    
    setIsSubmittingManual(true);
    try {
      const newMember = await createTeamMember({
        facilityId: FACILITY_ID,
        name: manualForm.fullName,
        email: manualForm.email || undefined,
        role: manualForm.role,
        status: "Active",
        isManualEntry: true
      });

      const validCredentials = manualForm.credentials.filter(c => c.name.trim());
      for (const cred of validCredentials) {
        await createCredential({
          teamMemberId: newMember.id,
          name: cred.name,
          type: "Certification",
          status: getCredentialStatus(cred.expirationDate),
          issuedDate: cred.issueDate || undefined,
          expiryDate: cred.expirationDate || undefined,
          source: "Manual Entry"
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["team-members", FACILITY_ID] });
      setManualForm(initialManualForm);
      setShowInviteDialog(false);
    } catch (error) {
      console.error("Failed to add team member:", error);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const resetManualForm = () => {
    setManualForm({
      fullName: "",
      email: "",
      role: "",
      credentials: [{ id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
    });
  };

  const addInviteCredential = () => {
    setInviteForm(prev => ({
      ...prev,
      credentials: [...prev.credentials, { id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
    }));
  };

  const removeInviteCredential = (id: string) => {
    setInviteForm(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c.id !== id)
    }));
  };

  const updateInviteCredential = (id: string, field: keyof ManualCredential, value: string) => {
    setInviteForm(prev => ({
      ...prev,
      credentials: prev.credentials.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const handleInviteSubmit = async () => {
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.role) return;
    
    setIsSubmittingInvite(true);
    try {
      const newMember = await createTeamMember({
        facilityId: FACILITY_ID,
        name: inviteForm.fullName,
        email: inviteForm.email,
        role: inviteForm.role,
        status: "Invited",
        isManualEntry: false
      });

      const validCredentials = inviteForm.credentials.filter(c => c.name.trim());
      for (const cred of validCredentials) {
        await createCredential({
          teamMemberId: newMember.id,
          name: cred.name,
          type: "Certification",
          status: getCredentialStatus(cred.expirationDate),
          issuedDate: cred.issueDate || undefined,
          expiryDate: cred.expirationDate || undefined,
          source: "Manual Entry"
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["team-members", FACILITY_ID] });
      resetInviteForm();
      setShowInviteDialog(false);
    } catch (error) {
      console.error("Failed to invite team member:", error);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      fullName: "",
      email: "",
      role: "",
      credentials: [{ id: crypto.randomUUID(), name: "", issueDate: "", expirationDate: "" }]
    });
  };

  const resetAllForms = () => {
    resetManualForm();
    resetInviteForm();
    setActiveTab("invite");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1a14' }}>
      {/* Header - Matching Homepage Style */}
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/20">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Find Homes', href: '/search' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'For Providers', href: '/owner' },
          ].map((item) => (
            <Link 
              key={item.label}
              href={item.href}
              className="text-stone-400 hover:text-amber-200 transition-colors"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.85rem', letterSpacing: '0.1em' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu icon */}
        <button 
          className="md:hidden text-stone-400"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0d1a14]/95 pt-20 px-5">
          <nav className="flex flex-col gap-6">
            {[
              { label: 'Find Homes', href: '/search' },
              { label: 'How It Works', href: '/#how-it-works' },
              { label: 'For Providers', href: '/owner' },
            ].map((item) => (
              <Link 
                key={item.label}
                href={item.href}
                className="text-stone-300 hover:text-amber-200 transition-colors text-lg"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: '0.1em' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
      
      {/* Main Content Area with Light Background */}
      <div className="bg-muted/10 min-h-[calc(100vh-60px)]" style={{ backgroundColor: '#f8f6f1' }}>
        {isLoading && (
          <div className="container mx-auto px-4 py-20">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        {!isLoading && (
          <div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-2">
              <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={caregiver2} />
                    <AvatarFallback>{facility?.name.substring(0, 2).toUpperCase() || "OK"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>{facility?.name || "Loading..."}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif" }}>Owner Portal</p>
                  </div>
                </div>
                <Button 
                  className="w-full justify-start" 
                  variant={activeSection === "team" ? "secondary" : "ghost"}
                  onClick={() => setActiveSection("team")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team & Credentials
                </Button>
                <Button 
                  className="w-full justify-start relative" 
                  variant={activeSection === "inquiries" ? "secondary" : "ghost"}
                  onClick={() => setActiveSection("inquiries")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Inquiries
                  {newInquiries > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center">{newInquiries}</Badge>
                  )}
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant={activeSection === "reviews" ? "secondary" : "ghost"}
                  onClick={() => setActiveSection("reviews")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Reviews
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant={activeSection === "transport" ? "secondary" : "ghost"}
                  onClick={() => setActiveSection("transport")}
                  data-testid="button-transport-section"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Transport
                </Button>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Okapi Academy
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground pb-3">
                  <p className="mb-2">Your team has completed 12 courses this month.</p>
                  <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-3/4" />
                  </div>
                </CardContent>
                <CardFooter>
                  {/* Temporarily disabled - link: https://okapi-health-ai-info10705.replit.app/academy */}
                  <Button size="sm" variant="outline" className="w-full text-xs border-primary/20 text-muted-foreground opacity-50 cursor-not-allowed" disabled>
                    Go to Academy
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Transport Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground pb-3">
                  <p className="mb-2">Book wheelchair & gurney transport for your residents.</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs border-primary/20 text-primary hover:bg-primary/10"
                    onClick={() => setActiveSection("transport")}
                    data-testid="button-browse-providers"
                  >
                    Browse Providers
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6">
              {/* TEAM SECTION */}
              {activeSection === "team" && (
              <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Team & Credentials</h1>
                  <p className="text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>Manage your staff, invitations, and compliance tracking.</p>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}>
                      <Plus className="h-4 w-4" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle style={{ fontFamily: "'Cormorant', serif" }}>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Add a new staff member to your facility roster.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="invite">Invite via Email</TabsTrigger>
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="invite" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground border mb-4">
                          <p className="flex gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            Invited caregivers can manage their own credentials.
                          </p>
                          <p className="flex gap-2 mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            Okapi Academy certificates auto-sync to your dashboard.
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="invite-name">Full Name *</Label>
                          <Input 
                            id="invite-name" 
                            placeholder="e.g. Jane Doe"
                            value={inviteForm.fullName}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                            data-testid="input-invite-name"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="invite-email">Email Address *</Label>
                          <Input 
                            id="invite-email" 
                            type="email"
                            placeholder="jane@example.com"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            data-testid="input-invite-email"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="invite-role">Role *</Label>
                          <Select 
                            value={inviteForm.role} 
                            onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Caregiver (HCA/CNA)">Caregiver (HCA/CNA)</SelectItem>
                              <SelectItem value="Resident Manager">Resident Manager</SelectItem>
                              <SelectItem value="Administrator">Administrator</SelectItem>
                              <SelectItem value="Nurse (RN/LPN)">Nurse (RN/LPN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator className="my-4" />
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Current Credentials (optional)</Label>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={addInviteCredential}
                              className="h-7 text-xs gap-1"
                              data-testid="button-add-invite-credential"
                            >
                              <Plus className="h-3 w-3" /> Add Credential
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">Add any existing credentials this team member holds. They can update these after accepting the invitation.</p>
                          
                          {inviteForm.credentials.map((cred, index) => (
                            <div key={cred.id} className="p-3 border rounded-lg bg-muted/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Credential {index + 1}</span>
                                {inviteForm.credentials.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInviteCredential(cred.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                                    data-testid={`button-remove-invite-credential-${index}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid gap-2">
                                <Label className="text-xs">Credential Name</Label>
                                <Input
                                  placeholder="e.g. Home Care Aide Certificate, CPR/First Aid"
                                  value={cred.name}
                                  onChange={(e) => updateInviteCredential(cred.id, "name", e.target.value)}
                                  className="h-8 text-sm"
                                  data-testid={`input-invite-credential-name-${index}`}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                  <Label className="text-xs">Issue Date</Label>
                                  <Input
                                    type="date"
                                    value={cred.issueDate}
                                    onChange={(e) => updateInviteCredential(cred.id, "issueDate", e.target.value)}
                                    className="h-8 text-sm"
                                    data-testid={`input-invite-credential-issue-${index}`}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label className="text-xs">Expiration Date</Label>
                                  <Input
                                    type="date"
                                    value={cred.expirationDate}
                                    onChange={(e) => updateInviteCredential(cred.id, "expirationDate", e.target.value)}
                                    className="h-8 text-sm"
                                    data-testid={`input-invite-credential-expiry-${index}`}
                                  />
                                </div>
                              </div>
                              
                              {cred.expirationDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Status:</span>
                                  {getCredentialStatus(cred.expirationDate) === "Current" && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Current</Badge>
                                  )}
                                  {getCredentialStatus(cred.expirationDate) === "Expiring Soon" && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Expiring Soon</Badge>
                                  )}
                                  {getCredentialStatus(cred.expirationDate) === "Expired" && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Expired</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="manual" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 border border-amber-100 mb-4">
                          <p className="flex gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Enter staff details and credentials manually. Expiration dates affect compliance tracking.
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="manual-name">Full Name *</Label>
                          <Input 
                            id="manual-name" 
                            placeholder="e.g. Jane Doe"
                            value={manualForm.fullName}
                            onChange={(e) => setManualForm(prev => ({ ...prev, fullName: e.target.value }))}
                            data-testid="input-manual-name"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="manual-email">Email Address (optional)</Label>
                          <Input 
                            id="manual-email" 
                            type="email"
                            placeholder="jane@example.com"
                            value={manualForm.email}
                            onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                            data-testid="input-manual-email"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="manual-role">Role *</Label>
                          <Select 
                            value={manualForm.role} 
                            onValueChange={(value) => setManualForm(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger data-testid="select-manual-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Caregiver (HCA/CNA)">Caregiver (HCA/CNA)</SelectItem>
                              <SelectItem value="Resident Manager">Resident Manager</SelectItem>
                              <SelectItem value="Administrator">Administrator</SelectItem>
                              <SelectItem value="Nurse (RN/LPN)">Nurse (RN/LPN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator className="my-4" />
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Credentials & Certifications</Label>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={addCredential}
                              className="h-7 text-xs gap-1"
                              data-testid="button-add-credential"
                            >
                              <Plus className="h-3 w-3" /> Add Credential
                            </Button>
                          </div>
                          
                          {manualForm.credentials.map((cred, index) => (
                            <div key={cred.id} className="p-3 border rounded-lg bg-muted/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Credential {index + 1}</span>
                                {manualForm.credentials.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCredential(cred.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                                    data-testid={`button-remove-credential-${index}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid gap-2">
                                <Label className="text-xs">Credential Name</Label>
                                <Input
                                  placeholder="e.g. Home Care Aide Certificate, CPR/First Aid"
                                  value={cred.name}
                                  onChange={(e) => updateCredential(cred.id, "name", e.target.value)}
                                  className="h-8 text-sm"
                                  data-testid={`input-credential-name-${index}`}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                  <Label className="text-xs">Issue Date</Label>
                                  <Input
                                    type="date"
                                    value={cred.issueDate}
                                    onChange={(e) => updateCredential(cred.id, "issueDate", e.target.value)}
                                    className="h-8 text-sm"
                                    data-testid={`input-credential-issue-${index}`}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label className="text-xs">Expiration Date</Label>
                                  <Input
                                    type="date"
                                    value={cred.expirationDate}
                                    onChange={(e) => updateCredential(cred.id, "expirationDate", e.target.value)}
                                    className="h-8 text-sm"
                                    data-testid={`input-credential-expiry-${index}`}
                                  />
                                </div>
                              </div>
                              
                              {cred.expirationDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Status:</span>
                                  {getCredentialStatus(cred.expirationDate) === "Current" && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Current</Badge>
                                  )}
                                  {getCredentialStatus(cred.expirationDate) === "Expiring Soon" && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Expiring Soon</Badge>
                                  )}
                                  {getCredentialStatus(cred.expirationDate) === "Expired" && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Expired</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => { resetAllForms(); setShowInviteDialog(false); }}>Cancel</Button>
                      {activeTab === "invite" ? (
                        <Button 
                          onClick={handleInviteSubmit} 
                          disabled={isSubmittingInvite || !inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.role}
                          style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}
                          data-testid="button-send-invitation"
                        >
                          {isSubmittingInvite ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleManualSubmit} 
                          disabled={isSubmittingManual || !manualForm.fullName.trim() || !manualForm.role}
                          style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}
                          data-testid="button-add-team-member"
                        >
                          {isSubmittingManual ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Team Member"
                          )}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif" }}>Total Staff</p>
                        <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>{teamMembers.length}</h3>
                      </div>
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif" }}>Compliance Rate</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-600" style={{ fontFamily: "'Cormorant', serif" }}>100%</h3>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-amber-800" style={{ fontFamily: "'Jost', sans-serif" }}>Expiring Soon</p>
                        <h3 className="text-2xl font-bold mt-1 text-amber-700" style={{ fontFamily: "'Cormorant', serif" }}>
                          {teamMembers.reduce((count, member) => {
                            const expiring = member.credentials?.filter(c => c.status === "Expiring Soon").length || 0;
                            return count + expiring;
                          }, 0)}
                        </h3>
                      </div>
                      <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team List */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                  <h3 className="font-semibold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Staff Roster</h3>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search staff..." className="h-8 w-[200px] bg-white" />
                  </div>
                </div>
                
                <div className="divide-y">
                  {teamMembers.map((member) => {
                    const getCredentialStatus = () => {
                      if (member.status === "Invited") return "Pending";
                      if (!member.credentials || member.credentials.length === 0) return "Pending";
                      
                      const hasExpiring = member.credentials.some(c => c.status === "Expiring Soon");
                      if (hasExpiring) return "Expiring Soon";
                      return "Current";
                    };
                    
                    const credStatus = getCredentialStatus();
                    
                    return (
                      <div key={member.id} className="p-4 hover:bg-muted/5 transition-colors">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={member.avatarUrl || ""} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold" style={{ fontFamily: "'Jost', sans-serif", color: '#1a2f25' }}>{member.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{member.role}</span>
                                {member.status === "Invited" && (
                                  <Badge variant="secondary" className="text-xs h-5 font-normal">Invited</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Credentials Status</p>
                              {credStatus === "Current" && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Current</Badge>
                              )}
                              {credStatus === "Expiring Soon" && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expiring Soon</Badge>
                              )}
                              {credStatus === "Pending" && (
                                <Badge variant="outline" className="text-muted-foreground">Pending Setup</Badge>
                              )}
                            </div>
                            
                            <Button variant="ghost" size="sm">Manage</Button>
                          </div>
                        </div>

                        {member.credentials && member.credentials.length > 0 && (
                          <div className="mt-4 pl-[64px] grid gap-2">
                            {member.credentials.map((cred) => (
                              <div key={cred.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded border border-transparent hover:border-border">
                                <div className="flex items-center gap-2">
                                  {cred.source === "Okapi Academy" ? (
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="font-medium">{cred.name}</span>
                                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-white rounded border">{cred.type}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {cred.expiryDate && (
                                    <span className={cn(
                                      "text-xs",
                                      cred.status === "Expiring Soon" ? "text-amber-600 font-medium" : "text-muted-foreground"
                                    )}>
                                      Expires: {new Date(cred.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </span>
                                  )}
                                  {cred.source === "Okapi Academy" && (
                                    <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                      Okapi Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                                <Plus className="h-3 w-3" /> Add Credential
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                                <GraduationCap className="h-3 w-3" /> Assign Training
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {member.status === "Invited" && member.email && (
                          <div className="mt-4 pl-[64px] text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Invitation sent to {member.email}
                            <Button variant="link" className="h-auto p-0 text-xs">Resend</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
              )}

              {/* INQUIRIES SECTION */}
              {activeSection === "inquiries" && (
              <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Family Inquiries</h1>
                  <p className="text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>Manage inquiries from families interested in your facility.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">New</p>
                        <h3 className="text-2xl font-bold mt-1 text-red-600">{inquiries.filter(i => i.status === "new").length}</h3>
                      </div>
                      <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contacted</p>
                        <h3 className="text-2xl font-bold mt-1 text-blue-600">{inquiries.filter(i => i.status === "contacted").length}</h3>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <Phone className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Toured</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-600">{inquiries.filter(i => i.status === "toured").length}</h3>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>All Inquiries</h3>
                </div>
                <div className="divide-y">
                  {inquiries.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No inquiries yet</p>
                    </div>
                  ) : (
                    inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="p-4 hover:bg-muted/5">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{inquiry.name}</h4>
                              <Badge variant={inquiry.status === "new" ? "destructive" : inquiry.status === "contacted" ? "default" : "secondary"}>
                                {inquiry.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {inquiry.email}</p>
                              {inquiry.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {inquiry.phone}</p>}
                              {inquiry.careType && <p>Care Type: {inquiry.careType}</p>}
                              {inquiry.moveInTimeline && <p>Timeline: {inquiry.moveInTimeline}</p>}
                            </div>
                            {inquiry.message && (
                              <p className="mt-2 text-sm bg-muted/30 p-2 rounded">{inquiry.message}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Select 
                              value={inquiry.status} 
                              onValueChange={(value) => updateInquiryMutation.mutate({ id: inquiry.id, data: { status: value } })}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="toured">Toured</SelectItem>
                                <SelectItem value="admitted">Admitted</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </>
              )}

              {/* REVIEWS SECTION */}
              {activeSection === "reviews" && (
              <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Reviews & Ratings</h1>
                  <p className="text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>View and respond to family reviews.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                        <h3 className="text-2xl font-bold mt-1 flex items-center gap-2">
                          {facility?.rating || "N/A"}
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                        <h3 className="text-2xl font-bold mt-1">{reviews.length}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>All Reviews</h3>
                </div>
                <div className="divide-y">
                  {reviews.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No reviews yet</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{review.authorName}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300")} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        {review.title && <h5 className="font-medium mt-2">{review.title}</h5>}
                        <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                        
                        {review.ownerResponse ? (
                          <div className="mt-3 bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
                            <p className="text-xs font-medium text-primary mb-1">Your Response:</p>
                            <p className="text-sm">{review.ownerResponse}</p>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 gap-1"
                            onClick={() => {
                              setSelectedReview(review);
                              setResponseDialogOpen(true);
                            }}
                          >
                            <Send className="h-3 w-3" /> Respond
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Response Dialog */}
              <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Respond to Review</DialogTitle>
                    <DialogDescription>
                      Your response will be visible to all visitors.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedReview && (
                    <div className="bg-muted/30 p-3 rounded-lg text-sm mb-4">
                      <p className="font-medium">{selectedReview.authorName}</p>
                      <p className="text-muted-foreground mt-1">{selectedReview.content}</p>
                    </div>
                  )}
                  <Textarea 
                    placeholder="Write your response..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => selectedReview && respondToReviewMutation.mutate({ id: selectedReview.id, response: responseText })}
                      disabled={!responseText.trim() || respondToReviewMutation.isPending}
                      style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}
                    >
                      {respondToReviewMutation.isPending ? "Sending..." : "Send Response"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </>
              )}

              {/* TRANSPORT SECTION */}
              {activeSection === "transport" && (
              <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Transport Services</h1>
                  <p className="text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>Book reliable NEMT transport for your residents.</p>
                </div>
                <Button className="gap-2" style={{ backgroundColor: '#c9a962', color: '#0d1a14' }} data-testid="button-request-transport">
                  <Plus className="h-4 w-4" />
                  Request Transport
                </Button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif" }}>Active Bookings</p>
                        <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>0</h3>
                      </div>
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Truck className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "'Jost', sans-serif" }}>Completed Trips</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-600" style={{ fontFamily: "'Cormorant', serif" }}>0</h3>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-amber-800" style={{ fontFamily: "'Jost', sans-serif" }}>Preferred Providers</p>
                        <h3 className="text-2xl font-bold mt-1 text-amber-700" style={{ fontFamily: "'Cormorant', serif" }}>0</h3>
                      </div>
                      <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <Star className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Provider List */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold" style={{ fontFamily: "'Cormorant', serif", color: '#1a2f25' }}>Available NEMT Providers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Jost', sans-serif" }}>Browse and book medical transportation services.</p>
                  </div>
                </div>
                
                <div className="divide-y">
                  {transportLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading providers...</p>
                    </div>
                  ) : transportProviders.length === 0 ? (
                    <div className="p-8 text-center">
                      <Truck className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">No transport providers available yet.</p>
                    </div>
                  ) : (
                    transportProviders.map((provider) => (
                      <div key={provider.id} className="p-5 hover:bg-muted/5 transition-colors" data-testid={`card-provider-${provider.id}`}>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                              <Truck className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="font-semibold text-lg" style={{ fontFamily: "'Jost', sans-serif", color: '#1a2f25' }}>{provider.name}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={cn(
                                          "h-3.5 w-3.5",
                                          i < Math.floor(Number(provider.rating) || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200"
                                        )} 
                                      />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-1">({provider.reviewCount || 0} reviews)</span>
                                    {provider.isVerified && (
                                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">Verified</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {provider.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{provider.description}</p>
                              )}
                              
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {(provider.services as string[] || []).slice(0, 4).map((service) => (
                                  <Badge key={service} variant="secondary" className="text-xs bg-primary/5 text-primary border-0">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <MapPin className="h-3 w-3" />
                                Serves: {(provider.serviceCounties as string[] || []).join(", ") || "Contact for coverage area"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t bg-muted/5 -mx-5 -mb-5 px-5 py-3">
                            <div className="flex items-center gap-4 flex-1">
                              {provider.phone && (
                                <a 
                                  href={`tel:${provider.phone}`}
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                  data-testid={`link-phone-${provider.id}`}
                                >
                                  <Phone className="h-4 w-4" />
                                  {provider.phone}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {provider.website && (
                                <Button 
                                  asChild
                                  size="sm"
                                  style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}
                                  data-testid={`button-book-${provider.id}`}
                                >
                                  <a href={provider.website} target="_blank" rel="noopener noreferrer">
                                    Book a Ride
                                  </a>
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-primary/20 text-primary hover:bg-primary/10"
                                data-testid={`button-save-${provider.id}`}
                              >
                                <Star className="h-3.5 w-3.5 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
        </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-amber-900/20" style={{ backgroundColor: '#0a1410' }}>
        <div className="px-5 md:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1rem' }}>
                Care Network
              </span>
            </div>
            
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72', letterSpacing: '0.05em' }}>
              © 2024 Okapi Care Network. All rights reserved.
            </p>

            <div className="flex gap-5">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Contact', href: '#' }
              ].map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className="text-stone-500 hover:text-amber-200 transition-colors"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
