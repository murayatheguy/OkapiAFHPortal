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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, getInquiries, updateInquiry } from "@/lib/api";
import type { Facility, Inquiry, Review, TeamMember } from "@shared/schema";
import { 
  Home, Users, MessageSquare, Star, Settings, LogOut, Building2, 
  Loader2, Clock, CheckCircle2, AlertCircle, ChevronRight, Mail, Phone
} from "lucide-react";

export default function OwnerDashboardPage() {
  const [, setLocation] = useLocation();
  const { owner, facilities, claims, isLoading, isAuthenticated, logout } = useOwnerAuth();
  const queryClient = useQueryClient();
  
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["team-members", selectedFacilityId],
    queryFn: () => getTeamMembers(selectedFacilityId!),
    enabled: !!selectedFacilityId,
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
            Care
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
                    <Link href={`/homes/${selectedFacility?.slug || selectedFacilityId}`}>
                      <Button variant="outline" className="border-amber-900/30 text-stone-300 hover:text-amber-200">
                        View Public Listing
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
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
                  <h1 className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                    Team Members
                  </h1>
                  
                  {teamMembers.length === 0 ? (
                    <Card className="border-amber-900/20 bg-stone-900/30">
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-stone-600 mx-auto mb-3" />
                        <p className="text-stone-400">No team members added yet.</p>
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
                              <div>
                                <div className="text-stone-200 font-medium">{member.name}</div>
                                <div className="text-stone-500 text-sm">{member.role}</div>
                              </div>
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
    </div>
  );
}
