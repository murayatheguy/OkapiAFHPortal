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
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Map, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchResults() {
  const [location] = useLocation();
  
  const getQueryParam = (param: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param) || "";
  };

  const [searchQuery, setSearchQuery] = useState(getQueryParam('q'));
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState([3000, 10000]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    setSearchQuery(getQueryParam('q'));
  }, [location]);

  const specialties = ["Memory Care", "Hospice", "Mental Health", "Developmental Disabilities", "Respite", "High Acuity"];
  const paymentTypes = ["Medicaid", "Private Pay", "VA Benefits", "LTC Insurance"];

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  const filteredFacilities = useMemo(() => {
    return MOCK_FACILITIES.filter(facility => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        facility.name.toLowerCase().includes(query) ||
        facility.city.toLowerCase().includes(query) ||
        facility.zip.includes(query);

      const matchesAvailability = showOnlyAvailable ? facility.beds_available > 0 : true;

      const matchesPrice = 
        facility.price_min <= priceRange[1] && 
        facility.price_max >= priceRange[0];

      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.every(s => facility.specialties.includes(s));

      return matchesSearch && matchesAvailability && matchesPrice && matchesSpecialties;
    });
  }, [searchQuery, showOnlyAvailable, priceRange, selectedSpecialties]);

  const quickFilters = [
    { label: "Memory Care", action: () => toggleSpecialty("Memory Care"), active: selectedSpecialties.includes("Memory Care") },
    { label: "Hospice", action: () => toggleSpecialty("Hospice"), active: selectedSpecialties.includes("Hospice") },
    { label: "Dementia", action: () => toggleSpecialty("Memory Care"), active: selectedSpecialties.includes("Memory Care") }, // Mapping Dementia to Memory Care for now
    { label: "Available Now", action: () => setShowOnlyAvailable(!showOnlyAvailable), active: showOnlyAvailable },
  ];

  const clearFilters = () => {
    setSearchQuery("");
    setShowOnlyAvailable(false);
    setSelectedSpecialties([]);
    setPriceRange([3000, 10000]);
  };

  return (
    <div className="min-h-screen bg-muted/10 font-sans">
      <Navbar />
      
      <div className="bg-background border-b sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
           <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by city, zip, or name..." 
                    className="pl-9 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    {/* Mobile Filter Content - Same as desktop sidebar essentially */}
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
             </div>

             {/* Quick Filters - Horizontal Scroll */}
             <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
               {quickFilters.map((filter, idx) => (
                 <Badge 
                    key={idx}
                    variant={filter.active ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors",
                      filter.active && "hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={filter.action}
                 >
                   {filter.label}
                   {filter.active && <X className="ml-1 h-3 w-3" />}
                 </Badge>
               ))}
               {(selectedSpecialties.length > 0 || showOnlyAvailable) && (
                 <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline whitespace-nowrap ml-2">
                   Clear All
                 </button>
               )}
             </div>
           </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Filters - Desktop Sidebar */}
          <div className="hidden md:block w-64 shrink-0 space-y-8">
            <div className="sticky top-36 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif font-bold text-lg">Filters</h3>
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline">Reset</button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="available-desktop" 
                      checked={showOnlyAvailable}
                      onCheckedChange={(c) => setShowOnlyAvailable(!!c)}
                    />
                    <Label htmlFor="available-desktop" className="text-sm font-medium leading-none cursor-pointer">
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
                      <Label htmlFor={`spec-${specialty}`} className="text-sm font-normal cursor-pointer">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              
               <div>
                <h4 className="text-sm font-semibold mb-3">Payment Accepted</h4>
                <div className="space-y-2">
                  {paymentTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox id={`pay-${type}`} />
                      <Label htmlFor={`pay-${type}`} className="text-sm font-normal cursor-pointer">
                        {type}
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
            <div className="mb-4 flex justify-between items-end">
              <h1 className="text-2xl font-serif font-bold">
                {filteredFacilities.length} Result{filteredFacilities.length !== 1 ? 's' : ''}
              </h1>
              
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select className="text-sm border-none bg-transparent font-medium focus:ring-0 cursor-pointer">
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
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
                <Button variant="outline" onClick={clearFilters}>
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