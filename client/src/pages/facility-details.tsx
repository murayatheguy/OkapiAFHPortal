import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { getFacilityWithTeam, submitClaimRequest, getFacilityInspections, type DshsInspection } from "@/lib/api";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Clock, Users, Banknote, ArrowLeft, ArrowRight, Check,
  Building2, Star, Loader2, ExternalLink, UserCheck, HelpCircle,
  Camera, X, ChevronLeft, ChevronRight, Heart, Home
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
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { createTourEvent } from "@/lib/calendar";
import { getFacilityPhotos } from "@/lib/facility-photos";

export default function FacilityDetails() {
  const [facilityMatch, facilityParams] = useRoute("/facility/:id");
  const [homesMatch, homesParams] = useRoute("/homes/:id");
  const params = facilityParams || homesParams;
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [claimForm, setClaimForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    relationship: ""
  });
  const [tourConfirmation, setTourConfirmation] = useState<{
    submitted: boolean;
    selectedDate: Date | null;
    selectedTime: string;
  }>({
    submitted: false,
    selectedDate: null,
    selectedTime: "morning"
  });
  const [tourForm, setTourForm] = useState<{
    name: string;
    email: string;
    phone: string;
    preferredDate: Date | undefined;
    preferredTime: string;
    attendees: string;
    notes: string;
  }>({
    name: "",
    email: "",
    phone: "",
    preferredDate: undefined,
    preferredTime: "morning",
    attendees: "1",
    notes: ""
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

  const { data: inspections = [] } = useQuery({
    queryKey: ["facility-inspections", params?.id],
    queryFn: () => getFacilityInspections(params?.id || ""),
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


  return (
    <div className="min-h-screen bg-background font-sans pb-24 lg:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6" data-testid="link-back-search">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search Results
        </Link>

        {/* SECTION 1: HERO PHOTO GALLERY */}
        <div className="mb-8">
          {(() => {
            const photoData = getFacilityPhotos(facility);
            const photos = photoData.photos;
            const isPlaceholder = photoData.isPlaceholder;

            const openLightbox = (index: number) => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            };

            return (
              <>
                {/* Hero Layout - Main image with thumbnail grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
                  {/* Main Hero Image */}
                  <div
                    className={cn(
                      "md:col-span-2 md:row-span-2 relative cursor-pointer group",
                      isPlaceholder ? "bg-gradient-to-br from-amber-50 to-orange-50" : ""
                    )}
                    onClick={() => openLightbox(0)}
                  >
                    <div className="aspect-[4/3] md:aspect-auto md:h-full">
                      <img
                        src={photos[0]}
                        alt={`${facility.name} - Main view`}
                        className={cn(
                          "w-full h-full transition-transform duration-300 group-hover:scale-105",
                          isPlaceholder ? "object-contain p-8" : "object-cover"
                        )}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">View Gallery</span>
                    </div>
                  </div>

                  {/* Thumbnail Grid */}
                  {photos.slice(1, 5).map((img, index) => (
                    <div
                      key={index + 1}
                      className={cn(
                        "relative cursor-pointer group overflow-hidden",
                        isPlaceholder ? "bg-gradient-to-br from-amber-50 to-orange-50" : "bg-muted",
                        index === 3 && photos.length > 5 ? "" : ""
                      )}
                      onClick={() => openLightbox(index + 1)}
                    >
                      <div className="aspect-[4/3]">
                        <img
                          src={img}
                          alt={`${facility.name} - View ${index + 2}`}
                          className={cn(
                            "w-full h-full transition-transform duration-300 group-hover:scale-110",
                            isPlaceholder ? "object-contain p-4" : "object-cover"
                          )}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {/* Show "+X more" overlay on last thumbnail if there are more photos */}
                      {index === 3 && photos.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">+{photos.length - 5} more</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Fill empty slots with placeholder gradient if less than 5 photos */}
                  {photos.length < 5 && [...Array(5 - photos.length)].map((_, i) => (
                    <div key={`empty-${i}`} className="hidden md:block aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-50" />
                  ))}
                </div>

                {photoData.showAttribution && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Photos provided by Google
                  </p>
                )}

                {/* Lightbox Modal */}
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                  <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
                    <div className="relative">
                      {/* Close button */}
                      <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      {/* Main Image */}
                      <div className="flex items-center justify-center min-h-[60vh] p-4">
                        <img
                          src={photos[lightboxIndex]}
                          alt={`${facility.name} - View ${lightboxIndex + 1}`}
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                        />
                      </div>

                      {/* Navigation Arrows */}
                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={() => setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </button>
                          <button
                            onClick={() => setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight className="h-8 w-8" />
                          </button>
                        </>
                      )}

                      {/* Thumbnail strip */}
                      <div className="flex justify-center gap-2 p-4 overflow-x-auto">
                        {photos.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setLightboxIndex(index)}
                            className={cn(
                              "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                              lightboxIndex === index
                                ? "border-white ring-2 ring-white/50"
                                : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Image counter */}
                      <div className="text-center text-white/60 text-sm pb-4">
                        {lightboxIndex + 1} of {photos.length}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}
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

                {/* Inspection & Compliance History */}
                <div className="bg-white rounded-lg border p-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-3">Inspection History</h4>
                  
                  {inspections.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {inspections.slice(0, 5).map((inspection) => (
                        <div 
                          key={inspection.id} 
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                          data-testid={`inspection-${inspection.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-2.5 w-2.5 rounded-full ${inspection.violationCount === 0 ? 'bg-green-500' : inspection.violationCount <= 2 ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="font-medium text-sm">{inspection.inspectionType || 'Inspection'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(inspection.inspectionDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-medium ${inspection.violationCount === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                              {inspection.violationCount === 0 ? 'No violations' : `${inspection.violationCount} violation${inspection.violationCount > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      No inspection data available yet. DSHS data is synced periodically.
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground mb-3">
                    For complete inspection history and official records, visit the DSHS website.
                  </p>
                  {facility.dshsReportUrl ? (
                    <a 
                      href={facility.dshsReportUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                      data-testid="button-view-dshs-inspections"
                    >
                      View Full Reports on DSHS <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  ) : (
                    <a 
                      href="https://www.dshs.wa.gov/altsa/residential-care-services/adult-family-homes" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Search for this facility on dshs.wa.gov
                    </a>
                  )}
                </div>

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
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold mb-1">About This Home</h2>
                <p className="text-sm text-muted-foreground">From the owner</p>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {facility.description || `${facility.name} provides compassionate, personalized care in a warm, home-like environment. Our experienced caregivers are dedicated to ensuring the comfort, safety, and dignity of each resident.`}
              </p>

              {/* Care Philosophy */}
              {facility.carePhilosophy && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-teal-900 mb-2">Our Care Philosophy</h4>
                      <p className="text-teal-800 leading-relaxed text-sm">{facility.carePhilosophy}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* What Makes Us Special */}
              {facility.uniqueFeatures && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2">What Makes Us Special</h4>
                      <p className="text-amber-800 leading-relaxed text-sm">{facility.uniqueFeatures}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* A Day at Our Home */}
              {facility.dailyRoutine && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">A Day at Our Home</h4>
                      <p className="text-blue-800 leading-relaxed text-sm">{facility.dailyRoutine}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meet the Team */}
              {facility.ownerBio && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-2">Meet the Team</h4>
                      <p className="text-purple-800 leading-relaxed text-sm">{facility.ownerBio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Room Types */}
              {facility.roomTypes && facility.roomTypes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Room Options
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.roomTypes.map((roomType) => (
                      <Badge key={roomType} variant="outline" className="px-3 py-1.5">
                        <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                        {roomType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
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
                <h4 className="font-semibold text-sm mb-3">Payment Types Accepted</h4>
                <div className="grid grid-cols-2 gap-3">
                  {facility.acceptsPrivatePay && (
                    <div className="flex items-center gap-2 text-sm bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">Private Pay</span>
                    </div>
                  )}
                  {facility.acceptsMedicaid && (
                    <div className="flex items-center gap-2 text-sm bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">Medicaid</span>
                    </div>
                  )}
                  {facility.acceptsLTCInsurance && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                      <Check className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">Long-Term Care Insurance</span>
                    </div>
                  )}
                  {facility.acceptsVABenefits && (
                    <div className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                      <Check className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-800">VA Benefits</span>
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
                  <Button
                    variant="link"
                    className="px-0 h-auto mt-2 text-primary"
                    onClick={() => {
                      const address = encodeURIComponent(`${facility.address}, ${facility.city}, WA ${facility.zipCode}`);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
                    }}
                  >
                    Get Directions <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* SECTION 10: BOTTOM CTA */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="text-xl font-serif font-bold text-center mb-6">Ready to Learn More?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => facility.phone && (window.location.href = `tel:${facility.phone}`)}
                >
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">Call</h4>
                  <p className="text-xs text-muted-foreground mb-3">Talk to staff directly</p>
                  <Button size="sm" className="w-full" disabled={!facility.phone}>
                    {facility.phone ? 'Call Now' : 'No Phone Listed'}
                  </Button>
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
      <Dialog open={showTourModal} onOpenChange={(open) => {
        setShowTourModal(open);
        if (!open) {
          setTourConfirmation({ submitted: false, selectedDate: null, selectedTime: "morning" });
          setTourForm({ name: "", email: "", phone: "", preferredDate: undefined, preferredTime: "morning", attendees: "1", notes: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          {!tourConfirmation.submitted ? (
            <>
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
                    <Input 
                      id="tour-name" 
                      placeholder="Jane Smith"
                      value={tourForm.name}
                      onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
                      data-testid="input-tour-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tour-email">Email *</Label>
                    <Input 
                      id="tour-email" 
                      type="email" 
                      placeholder="jane@email.com"
                      value={tourForm.email}
                      onChange={(e) => setTourForm({ ...tourForm, email: e.target.value })}
                      data-testid="input-tour-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tour-phone">Phone *</Label>
                  <Input 
                    id="tour-phone" 
                    type="tel" 
                    placeholder="(555) 123-4567"
                    value={tourForm.phone}
                    onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })}
                    data-testid="input-tour-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !tourForm.preferredDate && "text-muted-foreground"
                        )}
                        data-testid="button-tour-date"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {tourForm.preferredDate ? format(tourForm.preferredDate, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={tourForm.preferredDate}
                        onSelect={(date) => setTourForm({ ...tourForm, preferredDate: date })}
                        disabled={(date) => date < addDays(new Date(), 1) || date > addDays(new Date(), 60)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time *</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={tourForm.preferredTime === "morning" ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setTourForm({ ...tourForm, preferredTime: "morning" })}
                      data-testid="button-time-morning"
                    >
                      Morning (9am-12pm)
                    </Button>
                    <Button 
                      variant={tourForm.preferredTime === "afternoon" ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setTourForm({ ...tourForm, preferredTime: "afternoon" })}
                      data-testid="button-time-afternoon"
                    >
                      Afternoon (12pm-4pm)
                    </Button>
                    <Button 
                      variant={tourForm.preferredTime === "evening" ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setTourForm({ ...tourForm, preferredTime: "evening" })}
                      data-testid="button-time-evening"
                    >
                      Evening (4pm-7pm)
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tour-attendees">Number of people attending</Label>
                  <Select 
                    value={tourForm.attendees}
                    onValueChange={(value) => setTourForm({ ...tourForm, attendees: value })}
                  >
                    <SelectTrigger data-testid="select-tour-attendees">
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
                  <Textarea 
                    id="tour-notes" 
                    rows={2}
                    value={tourForm.notes}
                    onChange={(e) => setTourForm({ ...tourForm, notes: e.target.value })}
                    data-testid="textarea-tour-notes"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTourModal(false)} data-testid="button-tour-cancel">Cancel</Button>
                <Button 
                  disabled={!tourForm.preferredDate}
                  onClick={() => {
                    if (!tourForm.preferredDate) {
                      toast({
                        title: "Missing Date",
                        description: "Please select a preferred date for your tour.",
                        variant: "destructive",
                      });
                      return;
                    }
                    const tourDate = new Date(tourForm.preferredDate);
                    if (tourForm.preferredTime === "morning") {
                      tourDate.setHours(10, 0, 0, 0);
                    } else if (tourForm.preferredTime === "afternoon") {
                      tourDate.setHours(14, 0, 0, 0);
                    } else {
                      tourDate.setHours(17, 0, 0, 0);
                    }
                    setTourConfirmation({
                      submitted: true,
                      selectedDate: tourDate,
                      selectedTime: tourForm.preferredTime
                    });
                    toast({
                      title: "Tour Request Submitted",
                      description: "The facility will contact you to confirm your appointment.",
                    });
                  }}
                  data-testid="button-tour-submit"
                >
                  Request Tour
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <DialogTitle className="text-center">Tour Request Sent!</DialogTitle>
                <DialogDescription className="text-center">
                  Your tour request for {facility.name} has been submitted. The facility will contact you within 24-48 hours to confirm the appointment.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4 border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Requested Date & Time</p>
                  {tourConfirmation.selectedDate && (
                    <p className="font-semibold text-lg">
                      {format(tourConfirmation.selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                  <p className="font-medium text-primary">
                    {tourConfirmation.selectedTime === "morning" 
                      ? "Morning (9am-12pm)" 
                      : tourConfirmation.selectedTime === "afternoon" 
                        ? "Afternoon (12pm-4pm)" 
                        : "Evening (4pm-7pm)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Add this appointment to your calendar as a reminder
                  </p>
                </div>

                {tourConfirmation.selectedDate && (
                  <div className="flex justify-center">
                    <AddToCalendar
                      event={createTourEvent(
                        facility.name,
                        `${facility.address}, ${facility.city}, WA ${facility.zipCode}`,
                        tourConfirmation.selectedDate
                      )}
                      buttonText="Add to Calendar"
                      variant="default"
                      size="lg"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTourModal(false)}
                  data-testid="button-tour-done"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
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
