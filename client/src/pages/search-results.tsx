import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { searchFacilities, type FacilitySortOption } from "@/lib/api";
import { FacilityCardSimple } from "@/components/FacilityCardSimple";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Map, X, Loader2, Home, Building2, Hospital, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: FacilitySortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Listed' },
];

const FACILITY_TYPES = [
  { id: 'afh', label: 'Adult Family Home', short: 'AFH', icon: Home },
  { id: 'alf', label: 'Assisted Living', short: 'Assisted Living', icon: Building2 },
  { id: 'snf', label: 'Skilled Nursing', short: 'Skilled Nursing', icon: Hospital },
  { id: 'hospice', label: 'Hospice Care', short: 'Hospice', icon: Heart },
] as const;

export default function SearchResults() {
  const [location, setLocation] = useLocation();
  
  const getQueryParam = (param: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(param) || "";
  };

  const updateUrlParams = (updates: { types?: string[]; query?: string; sort?: FacilitySortOption }) => {
    const params = new URLSearchParams(window.location.search);

    if (updates.types !== undefined) {
      if (updates.types.length > 0) {
        params.set('type', updates.types.join(','));
      } else {
        params.delete('type');
      }
    }
    if (updates.query !== undefined) {
      if (updates.query) {
        params.set('q', updates.query);
      } else {
        params.delete('q');
      }
    }
    if (updates.sort !== undefined) {
      if (updates.sort !== 'recommended') {
        params.set('sort', updates.sort);
      } else {
        params.delete('sort'); // Don't clutter URL with default
      }
    }

    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    window.history.replaceState({}, '', newUrl);
  };

  const [searchQuery, setSearchQuery] = useState(getQueryParam('q'));
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState([3000, 10000]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<FacilitySortOption>(() => {
    const sortParam = getQueryParam('sort');
    return (sortParam && SORT_OPTIONS.some(s => s.value === sortParam) ? sortParam : 'recommended') as FacilitySortOption;
  });
  const [selectedFacilityTypes, setSelectedFacilityTypes] = useState<string[]>(() => {
    const typeParam = getQueryParam('type');
    return typeParam ? typeParam.split(',').filter(t => FACILITY_TYPES.some(ft => ft.id === t)) : [];
  });

  useEffect(() => {
    setSearchQuery(getQueryParam('q'));
    const typeParam = getQueryParam('type');
    setSelectedFacilityTypes(typeParam ? typeParam.split(',').filter(t => FACILITY_TYPES.some(ft => ft.id === t)) : []);
    const sortParam = getQueryParam('sort');
    if (sortParam && SORT_OPTIONS.some(s => s.value === sortParam)) {
      setSelectedSort(sortParam as FacilitySortOption);
    }
  }, [location]);

  const toggleFacilityType = (typeId: string) => {
    const newTypes = selectedFacilityTypes.includes(typeId)
      ? selectedFacilityTypes.filter(id => id !== typeId)
      : [...selectedFacilityTypes, typeId];
    setSelectedFacilityTypes(newTypes);
    updateUrlParams({ types: newTypes });
  };

  const handleSortChange = (value: FacilitySortOption) => {
    setSelectedSort(value);
    updateUrlParams({ sort: value });
  };

  const specialties = ["Memory Care", "Hospice", "Mental Health", "Developmental Disabilities", "Respite", "High Acuity"];
  const paymentTypes = ["Medicaid", "Private Pay", "VA Benefits", "LTC Insurance"];

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  // Build server-side search params
  const serverSearchParams = useMemo(() => ({
    sort: selectedSort,
    facilityType: selectedFacilityTypes.length === 1 ? selectedFacilityTypes[0] : undefined,
    specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
    availableBeds: showOnlyAvailable ? true : undefined,
  }), [selectedSort, selectedFacilityTypes, selectedSpecialties, showOnlyAvailable]);

  const ITEMS_PER_PAGE = 50;

  // Fetch facilities with infinite scroll pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["facilities", serverSearchParams],
    queryFn: ({ pageParam = 0 }) => searchFacilities({
      ...serverSearchParams,
      limit: ITEMS_PER_PAGE,
      offset: pageParam,
    }),
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer items than requested, we've reached the end
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length * ITEMS_PER_PAGE;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const facilities = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  // Client-side filtering for search query and multi-type filter
  // (Server handles single type, sort, specialties, availability)
  const filteredFacilities = useMemo(() => {
    return facilities.filter(facility => {
      // Text search (client-side for instant feedback)
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        facility.name.toLowerCase().includes(query) ||
        facility.city.toLowerCase().includes(query) ||
        facility.zipCode.includes(query);

      // Multi-type filter (when more than one type selected)
      const matchesFacilityType = selectedFacilityTypes.length <= 1 ||
        (facility.facilityType && selectedFacilityTypes.includes(facility.facilityType.toLowerCase()));

      return matchesSearch && matchesFacilityType;
    });
  }, [facilities, searchQuery, selectedFacilityTypes]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    setSelectedFacilityTypes([]);
    setPriceRange([3000, 10000]);
    setSelectedSort('recommended');
    updateUrlParams({ types: [], query: "", sort: 'recommended' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      
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
                          <h4 className="text-sm font-semibold mb-3">Facility Type</h4>
                          <div className="space-y-2">
                            {FACILITY_TYPES.map((type) => {
                              const Icon = type.icon;
                              return (
                                <div key={type.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`mobile-type-${type.id}`}
                                    checked={selectedFacilityTypes.includes(type.id)}
                                    onCheckedChange={() => toggleFacilityType(type.id)}
                                  />
                                  <Label htmlFor={`mobile-type-${type.id}`} className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    {type.short}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
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
                <h4 className="text-sm font-semibold mb-3">Facility Type</h4>
                <div className="space-y-2">
                  {FACILITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type.id}`} 
                          checked={selectedFacilityTypes.includes(type.id)}
                          onCheckedChange={() => toggleFacilityType(type.id)}
                          data-testid={`filter-type-${type.id}`}
                        />
                        <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {type.short}
                        </Label>
                      </div>
                    );
                  })}
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
                {filteredFacilities.length} {selectedFacilityTypes.length === 1 
                  ? FACILITY_TYPES.find(t => t.id === selectedFacilityTypes[0])?.label || 'Facility'
                  : 'Facilit'}{filteredFacilities.length !== 1 ? (selectedFacilityTypes.length === 1 ? 's' : 'ies') : (selectedFacilityTypes.length === 1 ? '' : 'y')}
              </h1>
              
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={selectedSort} onValueChange={(v) => handleSortChange(v as FacilitySortOption)}>
                  <SelectTrigger className="w-[180px] h-9 text-sm border-none bg-transparent font-medium focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFacilities.map((facility) => (
                <FacilityCardSimple key={facility.id} facility={facility} />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="min-w-[200px]"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${facilities.length} shown)`
                  )}
                </Button>
              </div>
            )}

            {filteredFacilities.length === 0 && !isLoading && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <h3 className="text-lg font-semibold mb-2">No homes found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search area.</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}