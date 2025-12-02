import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { MOCK_FACILITIES } from "@/lib/mock-data";
import { FacilityCard } from "@/components/facility-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Map } from "lucide-react";

export default function SearchResults() {
  const [location] = useLocation();
  
  // Parse query params from window.location.search for initial state
  // We use a simple effect to handle updates if needed, but for MVP this is fine
  const getQueryParam = (param: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param) || "";
  };

  const [searchQuery, setSearchQuery] = useState(getQueryParam('q'));
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState([3000, 10000]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Update search query if URL changes
  useEffect(() => {
    setSearchQuery(getQueryParam('q'));
  }, [location]);

  const specialties = ["Memory Care", "Hospice", "Mental Health", "Developmental Disabilities", "Respite", "High Acuity"];

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  const filteredFacilities = useMemo(() => {
    return MOCK_FACILITIES.filter(facility => {
      // Text Search
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        facility.name.toLowerCase().includes(query) ||
        facility.city.toLowerCase().includes(query) ||
        facility.zip.includes(query);

      // Availability
      const matchesAvailability = showOnlyAvailable ? facility.beds_available > 0 : true;

      // Price - check if facility price range overlaps with selected range
      // Simple logic: facility min price <= selected max AND facility max price >= selected min
      const matchesPrice = 
        facility.price_min <= priceRange[1] && 
        facility.price_max >= priceRange[0];

      // Specialties
      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.every(s => facility.specialties.includes(s));

      return matchesSearch && matchesAvailability && matchesPrice && matchesSpecialties;
    });
  }, [searchQuery, showOnlyAvailable, priceRange, selectedSpecialties]);

  return (
    <div className="min-h-screen bg-muted/10 font-sans">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Filters - Desktop */}
          <div className="hidden md:block w-64 shrink-0 space-y-8">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-serif font-bold text-lg mb-4">Filters</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="available-desktop" 
                      checked={showOnlyAvailable}
                      onCheckedChange={(c) => setShowOnlyAvailable(!!c)}
                    />
                    <Label htmlFor="available-desktop" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Available Beds Only
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">Care Needs</h4>
                <div className="space-y-2">
                  {specialties.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`spec-${specialty}`} 
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => toggleSpecialty(specialty)}
                      />
                      <Label htmlFor={`spec-${specialty}`} className="text-sm font-normal">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">Monthly Budget</h4>
                <div className="px-2">
                  <Slider 
                    defaultValue={[3000, 10000]} 
                    max={12000} 
                    min={2000} 
                    step={100} 
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0].toLocaleString()}</span>
                    <span>${priceRange[1].toLocaleString()}+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by city, zip, or name..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden flex-1">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Refine your search to find the perfect home.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="available-mobile" 
                          checked={showOnlyAvailable}
                          onCheckedChange={(c) => setShowOnlyAvailable(!!c)}
                        />
                        <Label htmlFor="available-mobile">Available Beds Only</Label>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Care Needs</h4>
                        <div className="space-y-2">
                          {specialties.map((specialty) => (
                            <div key={specialty} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`mobile-spec-${specialty}`}
                                checked={selectedSpecialties.includes(specialty)}
                                onCheckedChange={() => toggleSpecialty(specialty)}
                              />
                              <Label htmlFor={`mobile-spec-${specialty}`}>{specialty}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-serif font-bold">
                {filteredFacilities.length} Result{filteredFacilities.length !== 1 ? 's' : ''}
                {searchQuery && <span className="text-muted-foreground font-normal text-lg ml-2">for "{searchQuery}"</span>}
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredFacilities.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>

            {filteredFacilities.length === 0 && (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                <h3 className="text-lg font-semibold mb-2">No homes found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search area.</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setShowOnlyAvailable(false);
                  setSelectedSpecialties([]);
                  setPriceRange([3000, 10000]);
                }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}