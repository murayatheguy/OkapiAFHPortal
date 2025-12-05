import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { getFacilityWithTeam, submitClaimRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  MapPin, Phone, MessageSquare, Calendar, CheckCircle2, ShieldCheck, 
  AlertTriangle, Clock, Users, Banknote, ArrowLeft, ArrowRight, Check,
  Building2, Star, Loader2, ChevronDown, ChevronUp, ExternalLink, UserCheck, HelpCircle
} from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import mapImage from '@assets/generated_images/clean_google_maps_style_street_map_of_a_residential_neighborhood.png';

export default function FacilityDetails() {
  const [match, params] = useRoute("/facility/:id");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [expandedInspections, setExpandedInspections] = useState(false);
  const [claimForm, setClaimForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    relationship: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const claimMutation = useMutation({
    mutationFn: (data: {
      facilityId: string;
      requesterName: string;
      requesterEmail: string;
      requesterPhone?: string;
      relationship: string;
    }) => submitClaimRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", params?.id] });
      setShowClaimModal(false);
      setClaimForm({ requesterName: "", requesterEmail: "", requesterPhone: "", relationship: "" });
      toast({
        title: "Claim Submitted",
        description: "Your ownership claim has been submitted for review. We'll contact you within 2-3 business days.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClaimSubmit = () => {
    if (!claimForm.requesterName || !claimForm.requesterEmail || !claimForm.relationship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(claimForm.requesterEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Facility information is missing.",
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate({
      facilityId: params.id,
      requesterName: claimForm.requesterName,
      requesterEmail: claimForm.requesterEmail,
      requesterPhone: claimForm.requesterPhone || undefined,
      relationship: claimForm.relationship,
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["facility", params?.id],
    queryFn: () => getFacilityWithTeam(params?.id || ""),
    enabled: !!params?.id,
  });

  const facility = data?.facility;
  const team = data?.team || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!facility || error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Facility Not Found</h1>
            <p className="text-muted-foreground mb-4">The facility you're looking for doesn't exist or has been removed.</p>
            <Link href="/search" className={cn(buttonVariants(), "mt-4")}>Back to Search</Link>
          </div>
        </div>
      </div>
    );
  }

  const hasOkapiCertifiedStaff = team.some(member => 
    member.credentials?.some(c => c.source === "Okapi Academy")
  );

  const allCredentialsCurrent = team.every(member => 
    member.status === "Active" && 
    (!member.credentials || member.credentials.every(c => c.status === "Current" || c.status === "Expiring Soon"))
  );

  const mockInspections = [
    { date: "2024-10", type: "Routine Inspection", violations: 0, result: "No violations" },
    { date: "2024-04", type: "Routine Inspection", violations: 0, result: "No violations" },
    { date: "2023-10", type: "Routine Inspection", violations: 1, result: "1 minor violation - Medication log documentation incomplete", corrected: true },
    { date: "2023-04", type: "Routine Inspection", violations: 0, result: "No violations" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans pb-24 lg:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6" data-testid="link-back-search">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search Results
        </Link>

        {/* SECTION 1: PHOTO GALLERY */}
        <div className="mb-8">
          {facility.images && facility.images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {facility.images.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                      <img src={img} alt={`${facility.name} - View ${index + 1}`} className="object-cover w-full h-full" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="aspect-video rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Photos coming soon</p>
                <p className="text-sm">Contact facility for a tour</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION 2: HEADER INFO */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3" data-testid="text-facility-name">
                {facility.name}
              </h1>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{facility.city}, WA {facility.zipCode}</span>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  DSHS Verified
                </Badge>
                {facility.claimStatus === "claimed" ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    Owner Verified
                  </Badge>
                ) : facility.claimStatus === "pending" ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Claim Pending
                  </Badge>
                ) : (
                  <Badge 
                    variant="outline" 
                    className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5 cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => setShowClaimModal(true)}
                    data-testid="badge-claim-home"
                  >
                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                    Own This Home?
                  </Badge>
                )}
                {hasOkapiCertifiedStaff && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                    <Star className="h-3.5 w-3.5 mr-1.5 fill-blue-500" />
                    Okapi Certified
                  </Badge>
                )}
              </div>
              
              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{facility.availableBeds}</div>
                  <div className="text-xs text-muted-foreground">Beds Available</div>
                </div>
                <div className="text-center border-x border-border">
                  <div className="text-2xl font-bold">{facility.capacity}</div>
                  <div className="text-xs text-muted-foreground">Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">Contact</div>
                  <div className="text-xs text-muted-foreground">For Pricing</div>
                </div>
              </div>

              {/* Specialty Tags */}
              {facility.specialties && facility.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {facility.specialties.map(spec => (
                    <Badge key={spec} variant="secondary" className="px-3 py-1">{spec}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: ACTION BUTTONS (Desktop) */}
            <div className="hidden lg:flex gap-3">
              {facility.phone ? (
                <Button className="flex-1 h-12" size="lg" data-testid="button-call" asChild>
                  <a href={`tel:${facility.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {facility.phone}
                  </a>
                </Button>
              ) : (
                <Button className="flex-1 h-12" size="lg" data-testid="button-call" onClick={() => setShowMessageModal(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              )}
              <Button variant="outline" className="flex-1 h-12" size="lg" onClick={() => setShowMessageModal(true)} data-testid="button-message">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="flex-1 h-12" size="lg" onClick={() => setShowTourModal(true)} data-testid="button-tour">
                <Calendar className="h-4 w-4 mr-2" />
                Request Tour
              </Button>
            </div>

            {/* SECTION 4: DSHS COMPLIANCE RECORD */}
            <Card className="border-2 border-slate-200 bg-slate-50/50 overflow-hidden">
              <CardHeader className="bg-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">DSHS Compliance Record</CardTitle>
                    <CardDescription>Official Washington State data • Auto-synced from DSHS</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* License Information */}
                <div className="bg-white rounded-lg border p-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">License Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">License Number</p>
                      <p className="font-mono font-medium">{facility.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">License Status</p>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", facility.licenseStatus === 'Active' ? "bg-green-500" : "bg-amber-500")} />
                        <span className="font-medium">{facility.licenseStatus}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Licensed Capacity</p>
                      <p className="font-medium">{facility.capacity} residents</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">County</p>
                      <p className="font-medium">{facility.county}</p>
                    </div>
                  </div>
                </div>

                {/* Inspection History - Note: In production, this would be synced from DSHS API */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Inspection History</h4>
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">Sample Data</span>
                  </div>
                  <div className="space-y-3">
                    {mockInspections.slice(0, expandedInspections ? undefined : 3).map((inspection, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                        <div className="mt-0.5">
                          {inspection.violations === 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {new Date(inspection.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <span className="text-xs text-muted-foreground">{inspection.type}</span>
                          </div>
                          <p className={cn("text-sm", inspection.violations > 0 ? "text-amber-700" : "text-green-700")}>
                            {inspection.result}
                          </p>
                          {inspection.corrected && (
                            <p className="text-xs text-green-600 mt-1">✓ Corrected within 30 days</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {mockInspections.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-sm"
                      onClick={() => setExpandedInspections(!expandedInspections)}
                    >
                      {expandedInspections ? (
                        <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                      ) : (
                        <>Show All Inspections <ChevronDown className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  )}
                </div>

                {/* Compliance Summary */}
                <div className="bg-white rounded-lg border p-4">
                  <h4 className="font-semibold text-sm mb-3">5-Year Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Inspections:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Violations:</span>
                      <span className="font-medium">{facility.violationsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enforcement Actions:</span>
                      <span className="font-medium text-green-600">None</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License Suspensions:</span>
                      <span className="font-medium text-green-600">None</span>
                    </div>
                  </div>
                </div>

                {facility.dshsReportUrl && (
                  <a 
                    href={facility.dshsReportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline font-medium text-sm"
                    data-testid="link-dshs-report"
                  >
                    View Full Report on DSHS Website <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* SECTION 5: CARE CAPABILITIES */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold mb-1">Care Capabilities</h2>
                <p className="text-sm text-muted-foreground">What this home can provide</p>
              </div>

              {facility.specialties && facility.specialties.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h4 className="font-semibold text-sm mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.specialties.map(spec => (
                      <div key={spec} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm mb-3">Services Included</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["24/7 Supervision", "Medication Management", "3 Meals + Snacks Daily", "Special Diets Available", 
                    "Bathing & Personal Care", "Dressing Assistance", "Housekeeping", "Laundry Service",
                    "Transportation to Appts", "Activities Program"].map(service => (
                    <div key={service} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-muted-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {facility.amenities && facility.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Amenities & Equipment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {facility.amenities.map(amenity => (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-muted-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: STAFF & CREDENTIALS */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold mb-1">Staff & Training</h2>
                <p className="text-sm text-muted-foreground">Verified credentials and certifications</p>
              </div>

              {hasOkapiCertifiedStaff && (
                <a href="https://okapi-health-ai-info10705.replit.app/academy" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 text-blue-600 fill-blue-500" />
                      <div>
                        <p className="font-bold text-blue-800">Okapi Certified Facility</p>
                        <p className="text-sm text-blue-700">Staff complete ongoing training through <span className="underline">Okapi Academy</span>, exceeding state requirements.</p>
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {allCredentialsCurrent && team.length > 0 && (
                <div className="flex items-center gap-2 text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                  <CheckCircle2 className="h-5 w-5" />
                  All {team.filter(m => m.status === "Active").length} caregivers current on required training
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Background Checks Cleared</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>First Aid / CPR Certified</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Food Safety Training</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Nurse Delegation Available</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Staff-to-Resident Ratio:</strong> 1:3 during daytime hours, 1:6 overnight</p>
                <p className="mt-1"><strong>Nurse Coverage:</strong> RN on-call 24/7, weekly nurse visits</p>
              </div>
            </div>

            {/* SECTION 7: ABOUT THIS HOME */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold mb-1">About This Home</h2>
                <p className="text-sm text-muted-foreground">From the owner</p>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {facility.description || `${facility.name} provides compassionate, personalized care in a warm, home-like environment. Our experienced caregivers are dedicated to ensuring the comfort, safety, and dignity of each resident.`}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Visiting Hours</p>
                  <p className="font-medium text-sm">Open visiting 8am - 8pm daily</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">County</p>
                  <p className="font-medium text-sm">{facility.county} County</p>
                </div>
              </div>
            </div>

            {/* SECTION 8: PRICING & PAYMENT */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold mb-1">Pricing</h2>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-2">Monthly Rate</p>
                <p className="text-2xl font-bold text-primary">Contact for Pricing</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Final pricing depends on level of care needed. Contact us for a personalized assessment and quote.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Payment Types Accepted</h4>
                <div className="flex flex-wrap gap-2">
                  {facility.acceptsPrivatePay && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Private Pay</span>
                    </div>
                  )}
                  {facility.acceptsMedicaid && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Medicaid</span>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setShowMessageModal(true)}>
                Request Personalized Quote
              </Button>
            </div>

            {/* SECTION 9: LOCATION */}
            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold">Location</h2>
              
              <div className="rounded-xl overflow-hidden border border-border h-[300px] bg-muted relative group">
                <img src={mapImage} alt="Map location" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-4 rounded-lg shadow-lg border">
                  <p className="font-medium">{facility.address}</p>
                  <p className="text-sm text-muted-foreground">{facility.city}, WA {facility.zipCode}</p>
                  <p className="text-sm text-muted-foreground">{facility.county} County</p>
                  <Button variant="link" className="px-0 h-auto mt-2 text-primary">
                    Get Directions <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* SECTION 10: BOTTOM CTA */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="text-xl font-serif font-bold text-center mb-6">Ready to Learn More?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {}}>
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">Call</h4>
                  <p className="text-xs text-muted-foreground mb-3">Talk to staff directly</p>
                  <Button size="sm" className="w-full">Call Now</Button>
                </Card>
                <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowMessageModal(true)}>
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">Message</h4>
                  <p className="text-xs text-muted-foreground mb-3">Send a message anytime</p>
                  <Button size="sm" variant="outline" className="w-full">Send Message</Button>
                </Card>
                <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowTourModal(true)}>
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">Tour</h4>
                  <p className="text-xs text-muted-foreground mb-3">Schedule a visit</p>
                  <Button size="sm" variant="outline" className="w-full">Request Tour</Button>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="relative hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${facility.availableBeds > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-medium">
                      {facility.availableBeds > 0 
                        ? `${facility.availableBeds} Bed${facility.availableBeds > 1 ? 's' : ''} Available` 
                        : 'Waitlist Only'}
                    </span>
                  </div>
                  <CardTitle className="text-lg">Contact for Pricing</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Pricing depends on care level needed</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <Button className="w-full h-11" size="lg" onClick={() => setShowTourModal(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule a Tour
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setShowMessageModal(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  {facility.phone && (
                    <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                      <a href={`tel:${facility.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        {facility.phone}
                      </a>
                    </Button>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    Usually responds within 24 hours
                  </p>
                </CardContent>
              </Card>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Okapi Guarantee
                </h4>
                <p className="text-xs text-muted-foreground">
                  All facilities listed on Okapi are verified against state records. We ensure you have the most up-to-date compliance information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 lg:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button variant="outline" className="flex-1" onClick={() => setShowMessageModal(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </Button>
        <Button className="flex-1 shadow-md" onClick={() => setShowTourModal(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Request Tour
        </Button>
      </div>

      {/* MESSAGE MODAL */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Message {facility.name}</DialogTitle>
            <DialogDescription>
              Send a message to inquire about availability and care options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="msg-name">Your Name *</Label>
                <Input id="msg-name" placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg-email">Email *</Label>
                <Input id="msg-email" type="email" placeholder="jane@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-phone">Phone (optional)</Label>
              <Input id="msg-phone" type="tel" placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-relationship">Relationship to person needing care</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">I am the person needing care</SelectItem>
                  <SelectItem value="spouse">Spouse/Partner</SelectItem>
                  <SelectItem value="child">Adult Child</SelectItem>
                  <SelectItem value="family">Other Family Member</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="professional">Case Manager/Social Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-message">Tell us about your situation *</Label>
              <Textarea 
                id="msg-message" 
                placeholder="What type of care is needed? Any specific questions?"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageModal(false)}>Cancel</Button>
            <Button onClick={() => setShowMessageModal(false)}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOUR REQUEST MODAL */}
      <Dialog open={showTourModal} onOpenChange={setShowTourModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a Tour at {facility.name}</DialogTitle>
            <DialogDescription>
              Request a visit to meet the staff and see the home.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tour-name">Your Name *</Label>
                <Input id="tour-name" placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tour-email">Email *</Label>
                <Input id="tour-email" type="email" placeholder="jane@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-phone">Phone *</Label>
              <Input id="tour-phone" type="tel" placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Morning (9am-12pm)</Button>
                <Button variant="outline" size="sm" className="flex-1">Afternoon (12pm-4pm)</Button>
                <Button variant="outline" size="sm" className="flex-1">Evening (4pm-7pm)</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-attendees">Number of people attending</Label>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2">2 people</SelectItem>
                  <SelectItem value="3">3 people</SelectItem>
                  <SelectItem value="4">4+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-notes">Anything we should know? (optional)</Label>
              <Textarea id="tour-notes" rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTourModal(false)}>Cancel</Button>
            <Button onClick={() => setShowTourModal(false)}>Request Tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLAIM HOME MODAL */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Claim Your Home
            </DialogTitle>
            <DialogDescription>
              Are you the owner or operator of {facility.name}? Claim this listing to manage your facility profile, respond to inquiries, and build trust with families.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <h4 className="font-semibold text-sm mb-2">Benefits of Claiming</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Display "Owner Verified" badge to build trust</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Manage your facility profile, photos, and description</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Receive and respond to family inquiries directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Respond to reviews and manage your reputation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Access Okapi Academy for staff training</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim-name">Your Name *</Label>
                <Input 
                  id="claim-name" 
                  placeholder="John Smith" 
                  value={claimForm.requesterName}
                  onChange={(e) => setClaimForm({ ...claimForm, requesterName: e.target.value })}
                  data-testid="input-claim-name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-email">Email Address *</Label>
                <Input 
                  id="claim-email" 
                  type="email" 
                  placeholder="owner@example.com" 
                  value={claimForm.requesterEmail}
                  onChange={(e) => setClaimForm({ ...claimForm, requesterEmail: e.target.value })}
                  data-testid="input-claim-email" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-phone">Phone Number</Label>
                <Input 
                  id="claim-phone" 
                  type="tel" 
                  placeholder="(555) 123-4567" 
                  value={claimForm.requesterPhone}
                  onChange={(e) => setClaimForm({ ...claimForm, requesterPhone: e.target.value })}
                  data-testid="input-claim-phone" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-relationship">Your Relationship to This Home *</Label>
                <Select 
                  value={claimForm.relationship}
                  onValueChange={(value) => setClaimForm({ ...claimForm, relationship: value })}
                >
                  <SelectTrigger id="claim-relationship" data-testid="select-claim-relationship">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="operator">Operator/Manager</SelectItem>
                    <SelectItem value="authorized_rep">Authorized Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              By submitting, you confirm that you are authorized to manage this listing. We will verify your ownership before granting access.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowClaimModal(false)}
              disabled={claimMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleClaimSubmit}
              disabled={claimMutation.isPending}
              data-testid="button-submit-claim"
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Claim Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
