import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { MOCK_FACILITIES } from "@/lib/mock-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Phone, Mail, Calendar, CheckCircle2, ShieldCheck, 
  AlertTriangle, Clock, Users, Languages, Banknote, ArrowLeft, ArrowRight, Check
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
  const facility = MOCK_FACILITIES.find(f => f.id === params?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  if (!facility) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Facility Not Found</h1>
            <Link href="/search" className={cn(buttonVariants(), "mt-4")}>Back to Search</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-24 lg:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search Results
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Info */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                    {facility.name}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{facility.address}, {facility.city}, WA {facility.zip}</span>
                    <a href="#" className="text-primary hover:underline text-sm ml-1">(Map)</a>
                  </div>
                </div>
                {facility.is_claimed && (
                   <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                     <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                     Claimed
                   </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {facility.specialties.map(spec => (
                  <Badge key={spec} variant="secondary">{spec}</Badge>
                ))}
                {facility.has_okapi_certified_staff && (
                   <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                     <ShieldCheck className="h-3 w-3 mr-1" />
                     Okapi Certified
                   </Badge>
                )}
                {facility.is_dshs_verified && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    DSHS Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">{facility.beds_available}</span> 
                  <span className="text-muted-foreground">Beds Available</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">${facility.price_min.toLocaleString()} - ${facility.price_max.toLocaleString()}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
            </div>

            {/* Image Carousel */}
            <Carousel className="w-full">
              <CarouselContent>
                {facility.images.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                      <img src={img} alt={`View ${index + 1}`} className="object-cover w-full h-full" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>

            {/* Tabs Section */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/30 border border-border/50 rounded-lg mb-6 overflow-x-auto">
                <TabsTrigger value="about" className="px-6 py-2">About</TabsTrigger>
                <TabsTrigger value="compliance" className="px-6 py-2">Compliance</TabsTrigger>
                <TabsTrigger value="staff" className="px-6 py-2">Staff & Training</TabsTrigger>
                <TabsTrigger value="details" className="px-6 py-2">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-serif font-bold mb-3">About This Home</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {facility.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Services Included</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {facility.services.map(service => (
                      <div key={service} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm text-muted-foreground">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visiting Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>9:00 AM - 7:00 PM Daily</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Languages Spoken</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-primary" />
                        <span>{facility.languages.join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/20 pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      DSHS Compliance Record
                    </CardTitle>
                    <CardDescription>
                      Data automatically synced from Department of Social and Health Services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">License Status</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-full", facility.license_status === 'Active' ? "bg-green-500" : "bg-amber-500")} />
                          <span className="font-medium">{facility.license_status}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">License Number</p>
                        <p className="font-medium font-mono text-sm">{facility.license_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Licensed Since</p>
                        <p className="font-medium">{new Date(facility.licensed_since).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                        <p className="font-medium">{facility.capacity} Residents</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Administrator</p>
                        <p className="font-medium">{facility.administrator}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-4">Inspection History</h4>
                      <div className="space-y-3">
                        {facility.inspection_history.map((inspection, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className="mt-0.5">
                              {inspection.result.includes("No violations") || inspection.violations === 0 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {new Date(inspection.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}: {inspection.type}
                              </p>
                              <p className="text-muted-foreground">
                                {inspection.result}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="link" className="px-0 text-primary h-auto group">
                      View Full DSHS Report <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="staff" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-muted/20 rounded-xl p-6 border border-border">
                   <div className="flex items-center gap-4 mb-6">
                     <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                       <Users className="h-6 w-6" />
                     </div>
                     <div>
                       <h3 className="font-serif font-bold text-lg">Staff Credentials</h3>
                       <p className="text-sm text-muted-foreground">Verified training and background checks</p>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex items-center gap-2 text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                        <CheckCircle2 className="h-5 w-5" />
                        All caregivers current on required training
                     </div>

                     <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm">
                        <span className="font-medium">Last Verified</span>
                        <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
                     </div>
                     
                     {facility.has_okapi_certified_staff && (
                       <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                         <ShieldCheck className="h-6 w-6 text-emerald-600" />
                         <div>
                           <p className="font-bold">Okapi Academy Certified Staff</p>
                           <p className="text-sm opacity-90">Caregivers at this home have completed advanced training through Okapi Academy.</p>
                         </div>
                       </div>
                     )}
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="flex items-center gap-2 text-sm">
                         <CheckCircle2 className="h-4 w-4 text-green-600" />
                         <span>Background Checks Cleared</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm">
                         <CheckCircle2 className="h-4 w-4 text-green-600" />
                         <span>First Aid / CPR Certified</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm">
                         <CheckCircle2 className="h-4 w-4 text-green-600" />
                         <span>Nurse Delegation Available</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm">
                         <CheckCircle2 className="h-4 w-4 text-green-600" />
                         <span>Food Safety Training</span>
                       </div>
                     </div>
                   </div>
                 </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {facility.payment_types.map(type => (
                            <li key={type}>{type}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Equipment & Accessibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          <li>Wheelchair Accessible</li>
                          <li>Walk-in Shower</li>
                          <li>Hospital Beds Available</li>
                          <li>Hoyer Lift</li>
                        </ul>
                      </CardContent>
                    </Card>
                 </div>

                 <div>
                   <h3 className="text-xl font-serif font-bold mb-4">Location</h3>
                   <div className="rounded-xl overflow-hidden border border-border h-[300px] bg-muted relative group">
                     <img src={mapImage} alt="Map location" className="w-full h-full object-cover" />
                     <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-border">
                       <p className="font-medium text-sm">{facility.address}</p>
                       <p className="text-xs text-muted-foreground">{facility.city}, WA {facility.zip}</p>
                       <a href="#" className="text-xs text-primary font-medium hover:underline mt-1 block">Get Directions</a>
                     </div>
                   </div>
                 </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="relative hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <CardTitle className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${facility.price_min.toLocaleString()} - ${facility.price_max.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">/ month</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${facility.beds_available > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-medium">
                      {facility.beds_available > 0 
                        ? `${facility.beds_available} Bed${facility.beds_available > 1 ? 's' : ''} Available Now` 
                        : 'Waitlist Only'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Button className="w-full h-12 text-lg font-semibold shadow-sm" size="lg">
                    Schedule a Tour
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    (555) 123-4567
                  </Button>
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
        <Button variant="outline" className="flex-1">
          <Mail className="h-4 w-4 mr-2" />
          Message
        </Button>
        <Button className="flex-1 shadow-md">
          Schedule Tour
        </Button>
      </div>
    </div>
  );
}