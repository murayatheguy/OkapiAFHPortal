import { User, Briefcase, GraduationCap, ShieldCheck, AlertCircle, CheckCircle2, Clock, FileText, Upload, Mail, X, Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, getFacility, createTeamMember } from "@/lib/api";
import caregiver1 from '@assets/generated_images/generic_portrait_of_a_friendly_male_caregiver.png';
import caregiver2 from '@assets/generated_images/generic_portrait_of_a_friendly_female_caregiver.png';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState("team");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const FACILITY_ID = "e1a955ed-ba41-435a-a48a-1f36acee40b7";
  
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

  const createMemberMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", FACILITY_ID] });
      setShowInviteDialog(false);
    },
  });
  
  const isLoading = facilityLoading || teamLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1a14' }}>
      {/* Header - Matching Homepage Style */}
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/20">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.25rem' }}>
            Care
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
                <Button className="w-full justify-start" variant="ghost">Dashboard</Button>
                <Button className="w-full justify-start" variant="ghost">My Facility</Button>
                <Button className="w-full justify-start" variant="secondary">Team & Credentials</Button>
                <Button className="w-full justify-start" variant="ghost">Inquiries</Button>
                <Button className="w-full justify-start" variant="ghost">Settings</Button>
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
                  <Button size="sm" variant="outline" className="w-full text-xs border-primary/20 text-primary hover:bg-primary/10">
                    Go to Academy
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6">
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
                    
                    <Tabs defaultValue="invite" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="invite">Invite via Email</TabsTrigger>
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="invite" className="space-y-4">
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
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="e.g. Jane Doe" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" placeholder="jane@example.com" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="role">Role</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="caregiver">Caregiver (HCA/CNA)</SelectItem>
                              <SelectItem value="manager">Resident Manager</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="manual" className="space-y-4">
                        <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 border border-amber-100 mb-4">
                          <p className="flex gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            You will need to manually upload and track certificates for this user.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="manual-name">Full Name</Label>
                          <Input id="manual-name" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="manual-role">Role</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="caregiver">Caregiver (HCA/CNA)</SelectItem>
                              <SelectItem value="manager">Resident Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                      <Button onClick={() => setShowInviteDialog(false)} style={{ backgroundColor: '#c9a962', color: '#0d1a14' }}>Send Invitation</Button>
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
                Care
              </span>
            </div>
            
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72', letterSpacing: '0.05em' }}>
              © 2024 Okapi Care Network. All rights reserved.
            </p>

            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Contact'].map((link) => (
                <a 
                  key={link}
                  href="#" 
                  className="text-stone-500 hover:text-amber-200 transition-colors"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper util for classnames inside component since we can't import
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
