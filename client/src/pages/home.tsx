import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { getFeaturedFacilities, searchFacilities, searchFacilitiesWithCapabilities, autocompleteFacilities, type AutocompleteResult } from "@/lib/api";
import { getFacilityPhotos } from "@/lib/facility-photos";
import { Home as HomeIcon, Building2, Hospital, Heart, Sparkles } from "lucide-react";
import { CareNeedsWizard } from "@/components/public/care-needs-wizard";
import { MatchResults } from "@/components/public/match-results";
import { CareNeeds, FacilityWithMatch, MatchScore } from "@/types/care-matching";

const FACILITY_TYPES = [
  { id: 'afh', label: 'Adult Family Home', short: 'AFH', description: '2-6 beds', icon: HomeIcon },
  { id: 'alf', label: 'Assisted Living', short: 'Assisted Living', description: '20-100+ beds', icon: Building2 },
  { id: 'snf', label: 'Skilled Nursing', short: 'Skilled Nursing', description: 'Medical Care', icon: Hospital },
  { id: 'hospice', label: 'Hospice Care', short: 'Hospice', description: 'End of Life', icon: Heart },
] as const;

// Calculate match score for a facility based on care needs
// Uses facility.capabilities when available for enhanced matching
function calculateMatchScore(facility: any, needs: CareNeeds): MatchScore {
  const reasons: MatchScore['reasons'] = [];
  let careMatch = 50;
  let locationMatch = 50;
  let budgetMatch = 50;
  let servicesMatch = 50;
  let availabilityMatch = 50;

  const capabilities = facility.capabilities;

  // Care type matching - use capabilities if available
  if (needs.careType !== 'any') {
    const facilityType = facility.facilityType?.toLowerCase() || '';
    const careTypes = capabilities?.careTypes;

    // Check capabilities first
    if (careTypes) {
      const careTypeMap: Record<string, keyof typeof careTypes> = {
        'afh': 'afh',
        'alf': 'assistedLiving',
        'snf': 'skilledNursing',
        'hospice': 'hospice',
      };
      const capabilityKey = careTypeMap[needs.careType];
      if (capabilityKey && careTypes[capabilityKey]) {
        careMatch = 100;
        reasons.push({ category: 'specialty', positive: true, text: 'Offers your care type', weight: 20 });
      } else {
        careMatch = 30;
        reasons.push({ category: 'specialty', positive: false, text: 'Different care type', weight: 0 });
      }
    } else if (facilityType === needs.careType || facilityType.includes(needs.careType)) {
      careMatch = 100;
      reasons.push({ category: 'specialty', positive: true, text: 'Matches care type', weight: 20 });
    } else {
      careMatch = 30;
      reasons.push({ category: 'specialty', positive: false, text: 'Different care type', weight: 0 });
    }
  } else {
    careMatch = 80;
  }

  // Medical needs matching - enhanced with capabilities
  const specialties = facility.specialties || [];
  const specialtiesLower = specialties.map((s: string) => s.toLowerCase());
  const specializations = capabilities?.specializations;
  const medicalServices = capabilities?.medicalServices;
  let matchedNeeds = 0;
  let totalNeedsChecked = 0;

  needs.medicalNeeds.forEach((need) => {
    totalNeedsChecked++;
    let matched = false;

    // Check capabilities specializations first
    if (specializations) {
      const specializationMap: Record<string, keyof typeof specializations> = {
        dementia: 'dementia',
        mental_health: 'mentalHealth',
        developmental_disabilities: 'developmentalDisabilities',
        diabetes: 'diabetes',
        hospice: 'hospicePalliative',
        parkinsons: 'parkinsons',
        brain_injury: 'traumaticBrainInjury',
      };
      const specKey = specializationMap[need];
      if (specKey && specializations[specKey]) {
        matched = true;
      }
    }

    // Check medical services for specific needs
    if (!matched && medicalServices) {
      const serviceMap: Record<string, (keyof typeof medicalServices)[]> = {
        diabetes: ['bloodGlucoseMonitoring', 'injections'],
        wound_care: ['woundCare'],
        catheter: ['catheterCare'],
        oxygen: ['oxygenTherapy'],
        feeding_tube: ['feedingTube'],
        medication_management: ['medicationManagement', 'medicationAdministration'],
      };
      const serviceKeys = serviceMap[need] || [];
      if (serviceKeys.some(key => medicalServices[key])) {
        matched = true;
      }
    }

    // Fall back to specialty text matching
    if (!matched) {
      const needLabels: Record<string, string[]> = {
        dementia: ['dementia', 'memory care', 'alzheimer'],
        mental_health: ['mental health', 'behavioral', 'psychiatric'],
        developmental_disabilities: ['developmental', 'disabilities', 'dd'],
        diabetes: ['diabetes', 'diabetic'],
        mobility: ['mobility', 'wheelchair', 'ambulatory'],
      };
      const searchTerms = needLabels[need] || [need.replace('_', ' ')];
      if (searchTerms.some(term => specialtiesLower.some((s: string) => s.includes(term)))) {
        matched = true;
      }
    }

    if (matched) matchedNeeds++;
  });

  if (needs.medicalNeeds.length > 0) {
    const needsScore = (matchedNeeds / needs.medicalNeeds.length) * 100;
    servicesMatch = Math.round(needsScore);
    if (matchedNeeds > 0) {
      reasons.push({ category: 'services', positive: true, text: `${matchedNeeds} of ${needs.medicalNeeds.length} needs met`, weight: 15 });
    }
    if (matchedNeeds < needs.medicalNeeds.length) {
      reasons.push({ category: 'services', positive: false, text: 'Some needs may require verification', weight: 5 });
    }
  } else {
    servicesMatch = 70;
  }

  // Location matching
  if (needs.location.city || needs.location.zipCode) {
    const facilityCity = facility.city?.toLowerCase() || '';
    const facilityZip = facility.zipCode || '';
    const searchCity = needs.location.city?.toLowerCase() || '';
    const searchZip = needs.location.zipCode || '';

    if (facilityCity === searchCity || facilityZip === searchZip) {
      locationMatch = 100;
      reasons.push({ category: 'location', positive: true, text: 'In your preferred area', weight: 15 });
    } else if (facilityCity.includes(searchCity) || searchCity.includes(facilityCity)) {
      locationMatch = 80;
      reasons.push({ category: 'location', positive: true, text: 'Near preferred area', weight: 10 });
    } else {
      locationMatch = 40;
      reasons.push({ category: 'location', positive: false, text: 'Outside preferred area', weight: 5 });
    }
  } else {
    locationMatch = 70;
  }

  // Budget matching - enhanced with capabilities pricing
  const pricing = capabilities?.pricing;
  const facilityPrice = pricing?.baseRateMin || facility.priceMin || 0;

  if (facilityPrice > 0 && needs.budget.max > 0) {
    if (facilityPrice <= needs.budget.max && facilityPrice >= needs.budget.min) {
      budgetMatch = 100;
      reasons.push({ category: 'price', positive: true, text: 'Within budget', weight: 15 });
    } else if (facilityPrice <= needs.budget.max * 1.1) {
      budgetMatch = 70;
      reasons.push({ category: 'price', positive: false, text: 'Slightly above budget', weight: 8 });
    } else {
      budgetMatch = 30;
      reasons.push({ category: 'price', positive: false, text: 'Above budget', weight: 0 });
    }
  } else {
    budgetMatch = 60;
    reasons.push({ category: 'price', positive: false, text: 'Contact for pricing', weight: 5 });
  }

  // Payment type matching - check if facility accepts needed payment methods
  const paymentAccepted = capabilities?.paymentAccepted;
  if (paymentAccepted && needs.budget.hasMedicaid) {
    if (paymentAccepted.medicaidCOPES || paymentAccepted.medicaidWaiver) {
      budgetMatch = Math.min(100, budgetMatch + 20);
      reasons.push({ category: 'price', positive: true, text: 'Accepts Medicaid', weight: 18 });
    } else {
      budgetMatch = Math.max(20, budgetMatch - 30);
      reasons.push({ category: 'price', positive: false, text: 'May not accept Medicaid', weight: 0 });
    }
  }

  // Availability matching - enhanced with capabilities
  const availability = capabilities?.availability;
  const availableBeds = availability?.availableBeds ?? facility.availableBeds ?? 0;
  const acceptingNew = availability?.acceptingNewResidents ?? true;

  if (availableBeds > 0 && acceptingNew) {
    availabilityMatch = 100;
    if (needs.timeline === 'immediate') {
      reasons.push({ category: 'availability', positive: true, text: 'Immediate availability', weight: 20 });
    } else {
      reasons.push({ category: 'availability', positive: true, text: 'Has openings', weight: 10 });
    }
  } else if (!acceptingNew) {
    availabilityMatch = 20;
    reasons.push({ category: 'availability', positive: false, text: 'Not accepting new residents', weight: 0 });
  } else {
    availabilityMatch = needs.timeline === 'planning' ? 60 : 30;
    reasons.push({ category: 'availability', positive: false, text: 'May have waitlist', weight: 5 });
  }

  // Bonus for amenities matching preferences (if capabilities exist)
  const amenities = capabilities?.amenities;
  if (amenities && needs.preferences.length > 0) {
    let amenityBonus = 0;
    if (needs.preferences.includes('pets_allowed') && amenities.petFriendly) {
      amenityBonus += 5;
      reasons.push({ category: 'services', positive: true, text: 'Pet friendly', weight: 8 });
    }
    if (needs.preferences.includes('private_room') && amenities.privateRooms) {
      amenityBonus += 5;
      reasons.push({ category: 'services', positive: true, text: 'Private rooms available', weight: 8 });
    }
    if (needs.preferences.includes('outdoor_space') && (amenities.outdoorSpace || amenities.garden)) {
      amenityBonus += 5;
      reasons.push({ category: 'services', positive: true, text: 'Outdoor space available', weight: 8 });
    }
    servicesMatch = Math.min(100, servicesMatch + amenityBonus);
  }

  // Calculate overall score (weighted average)
  const overall = Math.round(
    careMatch * 0.25 +
    servicesMatch * 0.25 +
    locationMatch * 0.2 +
    budgetMatch * 0.15 +
    availabilityMatch * 0.15
  );

  return {
    overall,
    breakdown: {
      careMatch,
      locationMatch,
      budgetMatch,
      servicesMatch,
      availabilityMatch,
    },
    reasons: reasons.sort((a, b) => b.weight - a.weight),
  };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFacilityTypes, setSelectedFacilityTypes] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Smart matching state
  const [showWizard, setShowWizard] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [matchedFacilities, setMatchedFacilities] = useState<FacilityWithMatch[]>([]);
  const [careNeeds, setCareNeeds] = useState<CareNeeds | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Debounced autocomplete effect
  useEffect(() => {
    if (searchValue.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await autocompleteFacilities(searchValue, 8);
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, autocompleteResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = autocompleteResults[selectedIndex];
      setLocation(`/facility/${selected.id}`);
      setShowAutocomplete(false);
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  const handleSelectFacility = (facility: AutocompleteResult) => {
    setLocation(`/facility/${facility.id}`);
    setShowAutocomplete(false);
  };

  const filters = [
    { id: 'all', label: 'All Homes', specialty: null },
    { id: 'mental-health', label: 'Mental Health', specialty: 'Mental Health' },
    { id: 'dementia', label: 'Dementia', specialty: 'Dementia' },
    { id: 'developmental', label: 'Developmental Disabilities', specialty: 'Developmental Disabilities' }
  ];

  const currentFilter = filters.find(f => f.id === activeFilter);
  const specialtyParam = currentFilter?.specialty ? [currentFilter.specialty] : undefined;

  const { data: featuredFacilities = [] } = useQuery({
    queryKey: ["featured-facilities"],
    queryFn: () => getFeaturedFacilities(9),
    enabled: activeFilter === 'all',
  });

  const { data: filteredBySpecialty = [] } = useQuery({
    queryKey: ["facilities-by-specialty", activeFilter],
    queryFn: () => searchFacilities({ specialties: specialtyParam }),
    enabled: activeFilter !== 'all',
  });

  const toggleFacilityType = (typeId: string) => {
    setSelectedFacilityTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue) params.set('q', searchValue);
    if (selectedFacilityTypes.length > 0) params.set('type', selectedFacilityTypes.join(','));
    setLocation(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  // Handle wizard completion - fetch and score facilities using capabilities
  const handleWizardComplete = async (needs: CareNeeds) => {
    setCareNeeds(needs);
    setShowWizard(false);
    setShowResults(true);
    setIsLoadingMatches(true);

    try {
      // Build search params from needs
      const searchParams: any = {};
      if (needs.location.city) searchParams.city = needs.location.city;
      if (needs.medicalNeeds.length > 0) {
        // Map medical needs to specialty search terms
        const specialtyMap: Record<string, string> = {
          dementia: 'Dementia',
          mental_health: 'Mental Health',
          developmental_disabilities: 'Developmental Disabilities',
        };
        const specialties = needs.medicalNeeds
          .filter(need => specialtyMap[need])
          .map(need => specialtyMap[need]);
        if (specialties.length > 0) searchParams.specialties = specialties;
      }

      // Fetch facilities with capabilities for enhanced matching
      const facilities = await searchFacilitiesWithCapabilities(searchParams);

      // Calculate match scores for each facility using capabilities data
      const facilitiesWithScores: FacilityWithMatch[] = facilities.map((f: any) => ({
        ...f,
        matchScore: calculateMatchScore(f, needs),
      }));

      // Sort by match score (highest first)
      // Facilities with capabilities data that don't match get lower scores
      facilitiesWithScores.sort((a, b) => b.matchScore.overall - a.matchScore.overall);

      setMatchedFacilities(facilitiesWithScores.slice(0, 20));
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatchedFacilities([]);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleBackToHome = () => {
    setShowResults(false);
    setCareNeeds(null);
    setMatchedFacilities([]);
  };

  // Apply facility type filter to the results
  const applyFacilityTypeFilter = (facilities: typeof featuredFacilities) => {
    if (selectedFacilityTypes.length === 0) return facilities;
    return facilities.filter(f => 
      f.facilityType && selectedFacilityTypes.includes(f.facilityType.toLowerCase())
    );
  };

  const filteredFacilities = activeFilter === 'all' 
    ? applyFacilityTypeFilter(featuredFacilities).slice(0, 6) 
    : applyFacilityTypeFilter(filteredBySpecialty).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ 
      fontFamily: "'Cormorant', serif",
      backgroundColor: '#0d1a14'
    }}>
      {/* Texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - Compact */}
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/30 bg-[#0d1a14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Find Homes', href: '/search' },
            { label: 'How It Works', href: '#how-it-works' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-stone-300 hover:text-amber-300 transition-colors"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.85rem', letterSpacing: '0.1em' }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/owner/login"
            className="px-4 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white transition-colors rounded"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.08em' }}
          >
            For Providers
          </Link>
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
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'For Providers', href: '/owner/login' },
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

      {/* Hero Section - COMPACT */}
      <section className="relative py-8 md:py-16">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-900/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 px-5 md:px-12 max-w-5xl mx-auto text-center">
          <p
            className="mb-3 tracking-[0.2em] uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.7rem', color: '#d4b56a', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            data-testid="text-tagline"
          >
            Washington State's Premier Care Network
          </p>

          <h1
            className="mb-4"
            style={{ fontFamily: "'Cormorant', serif", fontSize: 'clamp(2rem, 5.5vw, 3.25rem)', fontWeight: 500, color: '#ffffff', lineHeight: 1.15, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            data-testid="text-headline"
          >
            Exceptional care,
            <span style={{ fontStyle: 'italic', color: '#e8c55a', fontWeight: 400 }}> thoughtfully curated.</span>
          </h1>

          <p
            className="max-w-lg mx-auto mb-8 hidden sm:block"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '1rem', color: '#c8c4bc', lineHeight: 1.7 }}
            data-testid="text-description"
          >
            Connect with verified care facilities offering personalized attention and certified professionals.
          </p>

          {/* Facility Type Selector */}
          <div className="max-w-2xl mx-auto mb-8">
            <p
              className="mb-4 text-center"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#c8c4bc', letterSpacing: '0.08em' }}
            >
              What type of care are you looking for?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {FACILITY_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedFacilityTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleFacilityType(type.id)}
                    className="relative p-4 md:p-5 rounded-lg transition-all duration-300 text-center group hover:scale-[1.02]"
                    style={{
                      backgroundColor: isSelected ? 'rgba(212, 181, 106, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid',
                      borderColor: isSelected ? '#d4b56a' : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: isSelected ? '0 4px 12px rgba(212, 181, 106, 0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    data-testid={`facility-type-${type.id}`}
                  >
                    <Icon
                      className="w-7 h-7 md:w-8 md:h-8 mx-auto mb-2 transition-colors"
                      style={{ color: isSelected ? '#e8c55a' : '#d4b56a' }}
                    />
                    <p
                      className="text-sm md:text-base mb-1 transition-colors"
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#ffffff' : '#e8e4dc'
                      }}
                    >
                      {type.short}
                    </p>
                    <p
                      className="text-xs hidden md:block"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, color: '#a8a49c', fontSize: '0.75rem' }}
                    >
                      {type.description}
                    </p>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#e8c55a' }}
                      >
                        <svg className="w-3 h-3 text-[#0d1a14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedFacilityTypes.length === 0 && (
              <p
                className="mt-3 text-center"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.75rem', color: '#a8a49c' }}
              >
                No selection = All types shown
              </p>
            )}

            {/* Smart Matching Button */}
            <button
              onClick={() => setShowWizard(true)}
              className="mt-6 mx-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: '0.05em' }}
            >
              <Sparkles className="w-5 h-5" />
              Find My Perfect Match
            </button>
            <p
              className="mt-2 text-center"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.7rem', color: '#a8a49c' }}
            >
              Answer a few questions for personalized recommendations
            </p>
          </div>

          {/* Search Box - Compact */}
          <div className="max-w-lg mx-auto mb-6 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearch}>
              <div 
                className="p-0.5 rounded"
                style={{ background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.4) 0%, rgba(201, 169, 98, 0.1) 50%, rgba(201, 169, 98, 0.4) 100%)' }}
              >
                <div className="flex bg-[#0d1a14] rounded overflow-hidden">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a962' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by home name, city, or ZIP..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => autocompleteResults.length > 0 && setShowAutocomplete(true)}
                      className="w-full pl-10 pr-3 py-3 bg-transparent text-stone-200 placeholder-stone-600 focus:outline-none text-sm"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: '0.03em' }}
                      data-testid="input-search"
                      autoComplete="off"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-3 transition-all duration-300 hover:bg-amber-700"
                    style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: '0.12em', fontSize: '0.7rem', color: '#0d1a14', backgroundColor: '#c9a962' }}
                    data-testid="button-search"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div 
                className="absolute left-0 right-0 mt-1 bg-[#1a2f25] border border-amber-900/30 rounded-lg shadow-xl z-50 overflow-hidden"
                style={{ maxHeight: '320px', overflowY: 'auto' }}
              >
                {autocompleteResults.map((facility, index) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => handleSelectFacility(facility)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                      index === selectedIndex 
                        ? 'bg-amber-900/30' 
                        : 'hover:bg-amber-900/20'
                    }`}
                    data-testid={`autocomplete-item-${facility.id}`}
                  >
                    <svg className="w-4 h-4 shrink-0" style={{ color: '#c9a962' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-stone-200 text-sm truncate"
                        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
                      >
                        {facility.name}
                      </p>
                      <p 
                        className="text-stone-500 text-xs"
                        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
                      >
                        {facility.city}{facility.zipCode ? `, ${facility.zipCode}` : ''}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats - Inline on mobile */}
          <div className="flex justify-center gap-8 md:gap-12 mt-2">
            {[
              { number: '500+', label: 'Homes' },
              { number: '98%', label: 'Satisfaction' },
              { number: '24/7', label: 'Support' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '1.75rem', fontWeight: 600, color: '#e8c55a' }}>{stat.number}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', fontWeight: 500, color: '#c8c4bc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Homes Section */}
      <section className="relative z-10 py-12 md:py-20" style={{ backgroundColor: '#f8f6f1' }}>
        <div className="px-5 md:px-12">
          {/* Section Header */}
          <div className="max-w-6xl mx-auto mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p
                  className="mb-2 tracking-[0.2em] uppercase"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: '0.75rem', color: '#2d7a5f' }}
                >
                  Handpicked for Excellence
                </p>
                <h2
                  style={{ fontFamily: "'Cormorant', serif", fontSize: '2rem', fontWeight: 600, color: '#1a2f25' }}
                >
                  Featured Homes
                </h2>
              </div>

              {/* Filters - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className="px-4 py-2 rounded transition-all duration-300 whitespace-nowrap flex-shrink-0"
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      backgroundColor: activeFilter === filter.id ? '#1a2f25' : '#ffffff',
                      color: activeFilter === filter.id ? '#ffffff' : '#3a4a42',
                      border: '1px solid',
                      borderColor: activeFilter === filter.id ? '#1a2f25' : '#d0ccc4',
                      boxShadow: activeFilter === filter.id ? '0 2px 8px rgba(26,47,37,0.15)' : 'none'
                    }}
                    data-testid={`filter-${filter.id}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Homes Grid */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFacilities.map((facility) => (
              <div 
                key={facility.id} 
                className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                style={{ borderRadius: '2px' }}
                data-testid={`card-facility-${facility.id}`}
              >
                {/* Image */}
                <div className="relative h-48 md:h-56 overflow-hidden bg-stone-200">
                  {(() => {
                    const photoData = getFacilityPhotos(facility);
                    const primaryPhoto = photoData.photos[0];
                    return (
                      <img 
                        src={primaryPhoto} 
                        alt={facility.name}
                        className={`w-full h-full group-hover:scale-105 transition-transform duration-700 ${
                          photoData.isPlaceholder ? 'object-contain p-2' : 'object-cover'
                        }`}
                      />
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Availability Badge */}
                  <div 
                    className="absolute top-3 left-3 px-2 py-0.5"
                    style={{ 
                      backgroundColor: facility.availableBeds > 0 ? 'rgba(34, 87, 64, 0.9)' : 'rgba(120, 100, 70, 0.9)',
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '0.6rem',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      color: '#fff'
                    }}
                  >
                    {facility.availableBeds > 0 ? 'AVAILABLE' : 'WAITLIST'}
                  </div>

                  {/* Price */}
                  <div 
                    className="absolute bottom-3 right-3"
                    style={{ fontFamily: "'Cormorant', serif", fontSize: '1rem', fontWeight: 500, color: '#fff' }}
                  >
                    {facility.priceMin ? `From $${(facility.priceMin).toLocaleString()}/mo` : 'Contact for Pricing'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 
                      className="group-hover:text-amber-700 transition-colors"
                      style={{ fontFamily: "'Cormorant', serif", fontSize: '1.2rem', fontWeight: 500, color: '#1a2f25' }}
                    >
                      {facility.name}
                    </h3>
                    {facility.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: '#1a2f25' }}>
                          {facility.rating}
                        </span>
                        {facility.reviewCount && (
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#9a978f' }}>
                            ({facility.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p 
                    className="mb-2.5 flex items-center gap-1"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#6b7c72' }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {facility.city}, WA · {facility.capacity} beds
                  </p>

                  {/* Tags */}
                  {facility.specialties && facility.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {facility.specialties.slice(0, 2).map((specialty) => (
                        <span 
                          key={specialty}
                          className="px-2 py-0.5"
                          style={{ 
                            fontFamily: "'Jost', sans-serif", 
                            fontSize: '0.6rem', 
                            fontWeight: 400,
                            letterSpacing: '0.03em',
                            color: '#6b7c72',
                            backgroundColor: '#f0ede6',
                            borderRadius: '1px'
                          }}
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link 
                    href={`/facility/${facility.id}`}
                    className="block w-full py-2.5 text-center border border-stone-300 text-stone-700 hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-all duration-300"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em' }}
                    data-testid={`button-view-${facility.id}`}
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <Link 
              href="/search"
              className="inline-block px-8 py-3 transition-all duration-300 hover:bg-amber-700"
              style={{ 
                fontFamily: "'Jost', sans-serif", 
                fontWeight: 400, 
                letterSpacing: '0.12em', 
                fontSize: '0.75rem', 
                color: '#0d1a14', 
                backgroundColor: '#c9a962' 
              }}
              data-testid="button-view-all"
            >
              VIEW ALL HOMES
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Compact */}
      <section id="how-it-works" className="relative z-10 py-14 md:py-24" style={{ backgroundColor: '#0d1a14' }}>
        <div className="px-5 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="mb-3 tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.75rem', color: '#d4b56a' }}
            >
              Simple & Supportive
            </p>
            <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '2rem', fontWeight: 500, color: '#ffffff' }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Search', desc: 'Enter your location to discover verified Adult Family Homes in your area.' },
              { step: '02', title: 'Compare', desc: 'Review detailed profiles, photos, certifications, and authentic family reviews.' },
              { step: '03', title: 'Connect', desc: 'Schedule tours directly with homes and find the perfect fit for your loved one.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '3rem', fontWeight: 400, color: '#e8c55a', marginBottom: '0.75rem' }}>
                  {item.step}
                </p>
                <h3 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 500, color: '#ffffff', marginBottom: '0.75rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: '#c8c4bc', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-amber-900/30" style={{ backgroundColor: '#0a1410' }}>
        <div className="px-5 md:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.1rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.1rem' }}>
                Care Network
              </span>
            </div>

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#a8a49c', letterSpacing: '0.05em' }}>
              © 2024 Okapi Care Network. All rights reserved.
            </p>

            <div className="flex gap-6">
              <a
                href="/privacy"
                className="text-stone-400 hover:text-amber-300 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.05em' }}
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-stone-400 hover:text-amber-300 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.05em' }}
              >
                Terms
              </a>
              <a
                href="mailto:contact@okapicarenetwork.com"
                className="text-stone-400 hover:text-amber-300 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.05em' }}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Smart Matching Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <CareNeedsWizard
            onComplete={handleWizardComplete}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* Match Results Overlay */}
      <AnimatePresence>
        {showResults && careNeeds && (
          <div className="fixed inset-0 z-50 bg-[#0d1a14] overflow-y-auto">
            <div className="min-h-screen py-8 px-4">
              <MatchResults
                matches={matchedFacilities}
                careNeeds={careNeeds}
                onBack={handleBackToHome}
                isLoading={isLoadingMatches}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
