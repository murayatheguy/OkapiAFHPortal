import { User, Briefcase, GraduationCap, ShieldCheck, AlertCircle, CheckCircle2, Clock, FileText, Upload, Mail, X, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/layout/navbar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import caregiver1 from '@assets/generated_images/generic_portrait_of_a_friendly_male_caregiver.png';
import caregiver2 from '@assets/generated_images/generic_portrait_of_a_friendly_female_caregiver.png';

// Mock Data for Team Members
const MOCK_TEAM = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Owner / Administrator",
    email: "sarah@sunshineafh.com",
    image: caregiver2,
    status: "Active",
    credentials_status: "Current",
    credentials: [
      { name: "Administrator Training", type: "Required", status: "Current", expiry: "2026-05-15", source: "Okapi Academy" },
      { name: "CPR/First Aid", type: "Required", status: "Current", expiry: "2025-11-20", source: "External" },
      { name: "Food Worker Card", type: "Required", status: "Current", expiry: "2026-01-10", source: "External" }
    ]
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Resident Care Manager",
    email: "michael.c@email.com",
    image: caregiver1,
    status: "Active",
    credentials_status: "Expiring Soon",
    credentials: [
      { name: "Mental Health Specialty", type: "Specialty", status: "Current", expiry: "2025-08-01", source: "Okapi Academy" },
      { name: "CPR/First Aid", type: "Required", status: "Expiring Soon", expiry: "2025-04-15", source: "External" },
      { name: "Dementia Specialty", type: "Specialty", status: "Current", expiry: "2026-02-20", source: "Okapi Academy" }
    ]
  },
  {
    id: "3",
    name: "Jessica Davis",
    role: "Caregiver (HCA)",
    email: "jessica.d@email.com",
    image: null,
    status: "Invited",
    credentials_status: "Pending",
    credentials: []
  }
];

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState("team");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <div className="min-h-screen bg-muted/10 font-sans">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage src={caregiver2} />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">Sunshine AFH</p>
                  <p className="text-xs text-muted-foreground">Owner Portal</p>
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
                <h1 className="text-2xl font-serif font-bold">Team & Credentials</h1>
                <p className="text-muted-foreground">Manage your staff, invitations, and compliance tracking.</p>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
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
                    <Button onClick={() => setShowInviteDialog(false)}>Send Invitation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                      <h3 className="text-2xl font-bold mt-1">3</h3>
                    </div>
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                      <h3 className="text-2xl font-bold mt-1 text-green-600">100%</h3>
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
                      <p className="text-sm font-medium text-amber-800">Expiring Soon</p>
                      <h3 className="text-2xl font-bold mt-1 text-amber-700">1</h3>
                    </div>
                    <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team List */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                <h3 className="font-semibold">Staff Roster</h3>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search staff..." className="h-8 w-[200px] bg-white" />
                </div>
              </div>
              
              <div className="divide-y">
                {MOCK_TEAM.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={member.image || ""} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
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
                          {member.credentials_status === "Current" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Current</Badge>
                          )}
                          {member.credentials_status === "Expiring Soon" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expiring Soon</Badge>
                          )}
                          {member.credentials_status === "Pending" && (
                            <Badge variant="outline" className="text-muted-foreground">Pending Setup</Badge>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm">Manage</Button>
                      </div>
                    </div>

                    {/* Expanded Credentials View (Simplified for mockup) */}
                    {member.credentials.length > 0 && (
                      <div className="mt-4 pl-[64px] grid gap-2">
                        {member.credentials.map((cred, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded border border-transparent hover:border-border">
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
                              <span className={cn(
                                "text-xs",
                                cred.status === "Expiring Soon" ? "text-amber-600 font-medium" : "text-muted-foreground"
                              )}>
                                Expires: {cred.expiry}
                              </span>
                              {cred.source === "Okapi Academy" && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
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
                    
                    {member.status === "Invited" && (
                      <div className="mt-4 pl-[64px] text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invitation sent to {member.email}
                        <Button variant="link" className="h-auto p-0 text-xs">Resend</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper util for classnames inside component since we can't import
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
