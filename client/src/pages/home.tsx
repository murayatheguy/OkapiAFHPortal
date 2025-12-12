import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedFacilities, searchFacilities, autocompleteFacilities, type AutocompleteResult } from "@/lib/api";
import { Home as HomeIcon, Building2, Hospital, Heart } from "lucide-react";

const FACILITY_TYPES = [
  { id: 'afh', label: 'Adult Family Home', short: 'AFH', description: '2-6 beds', icon: HomeIcon },
  { id: 'alf', label: 'Assisted Living', short: 'Assisted Living', description: '20-100+ beds', icon: Building2 },
  { id: 'snf', label: 'Skilled Nursing', short: 'Skilled Nursing', description: 'Medical Care', icon: Hospital },
  { id: 'hospice', label: 'Hospice Care', short: 'Hospice', description: 'End of Life', icon: Heart },
] as const;

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

  const filteredFacilities = activeFilter === 'all' 
    ? featuredFacilities.slice(0, 6) 
    : filteredBySpecialty.slice(0, 6);

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
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/20">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Find Homes', href: '/search' },
            { label: 'How It Works', href: '#how-it-works' },
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
              { label: 'How It Works', href: '#how-it-works' },
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

      {/* Hero Section - COMPACT */}
      <section className="relative py-8 md:py-16">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-900/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 px-5 md:px-12 max-w-5xl mx-auto text-center">
          <p 
            className="mb-2 tracking-[0.2em] uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.6rem', color: '#c9a962' }}
            data-testid="text-tagline"
          >
            Washington State's Premier Care Network
          </p>

          <h1 
            className="mb-3"
            style={{ fontFamily: "'Cormorant', serif", fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 300, color: '#e8e4dc', lineHeight: 1.15 }}
            data-testid="text-headline"
          >
            Exceptional care,
            <span style={{ fontStyle: 'italic', color: '#c9a962' }}> thoughtfully curated.</span>
          </h1>
          
          <p 
            className="max-w-md mx-auto mb-6 hidden sm:block"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.9rem', color: '#9a978f', lineHeight: 1.6 }}
            data-testid="text-description"
          >
            Connect with verified care facilities offering personalized attention and certified professionals.
          </p>

          {/* Facility Type Selector */}
          <div className="max-w-2xl mx-auto mb-6">
            <p 
              className="mb-3 text-center"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#9a978f', letterSpacing: '0.1em' }}
            >
              What type of care are you looking for?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {FACILITY_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedFacilityTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleFacilityType(type.id)}
                    className="relative p-3 md:p-4 rounded-lg transition-all duration-300 text-center group"
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(201, 169, 98, 0.15)' : 'rgba(232, 228, 220, 0.05)',
                      border: '1px solid',
                      borderColor: isSelected ? '#c9a962' : 'rgba(201, 169, 98, 0.2)',
                    }}
                    data-testid={`facility-type-${type.id}`}
                  >
                    <Icon 
                      className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 transition-colors"
                      style={{ color: isSelected ? '#c9a962' : '#9a978f' }}
                    />
                    <p 
                      className="text-xs md:text-sm mb-0.5 transition-colors"
                      style={{ 
                        fontFamily: "'Jost', sans-serif", 
                        fontWeight: isSelected ? 500 : 400, 
                        color: isSelected ? '#e8e4dc' : '#9a978f' 
                      }}
                    >
                      {type.short}
                    </p>
                    <p 
                      className="text-xs hidden md:block"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, color: '#6b6860', fontSize: '0.65rem' }}
                    >
                      {type.description}
                    </p>
                    {isSelected && (
                      <div 
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#c9a962' }}
                      >
                        <svg className="w-2.5 h-2.5 text-[#0d1a14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="mt-2 text-center"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.65rem', color: '#6b6860' }}
              >
                No selection = All types shown
              </p>
            )}
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
          <div className="flex justify-center gap-6 md:gap-10">
            {[
              { number: '500+', label: 'Homes' },
              { number: '98%', label: 'Satisfaction' },
              { number: '24/7', label: 'Support' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '1.4rem', fontWeight: 400, color: '#c9a962' }}>{stat.number}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.6rem', fontWeight: 300, color: '#9a978f', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Homes Section */}
      <section className="relative z-10 py-10 md:py-16" style={{ backgroundColor: '#f8f6f1' }}>
        <div className="px-5 md:px-12">
          {/* Section Header */}
          <div className="max-w-6xl mx-auto mb-6 md:mb-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p 
                  className="mb-1 tracking-[0.15em] uppercase"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.65rem', color: '#c9a962' }}
                >
                  Handpicked for Excellence
                </p>
                <h2 
                  style={{ fontFamily: "'Cormorant', serif", fontSize: '1.75rem', fontWeight: 400, color: '#1a2f25' }}
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
                    className="px-3 py-1.5 transition-all duration-300 whitespace-nowrap flex-shrink-0"
                    style={{ 
                      fontFamily: "'Jost', sans-serif", 
                      fontWeight: 400, 
                      fontSize: '0.7rem', 
                      letterSpacing: '0.05em',
                      backgroundColor: activeFilter === filter.id ? '#1a2f25' : 'transparent',
                      color: activeFilter === filter.id ? '#e8e4dc' : '#5a6860',
                      border: '1px solid',
                      borderColor: activeFilter === filter.id ? '#1a2f25' : '#c9c5bc'
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
                  {facility.images && facility.images.length > 0 ? (
                    <img 
                      src={facility.images[0]} 
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                      <svg className="w-16 h-16 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
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
      <section id="how-it-works" className="relative z-10 py-12 md:py-20" style={{ backgroundColor: '#0d1a14' }}>
        <div className="px-5 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p 
              className="mb-2 tracking-[0.15em] uppercase"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.65rem', color: '#c9a962' }}
            >
              Simple & Supportive
            </p>
            <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.75rem', fontWeight: 400, color: '#e8e4dc' }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Search', desc: 'Enter your location to discover verified Adult Family Homes in your area.' },
              { step: '02', title: 'Compare', desc: 'Review detailed profiles, photos, certifications, and authentic family reviews.' },
              { step: '03', title: 'Connect', desc: 'Schedule tours directly with homes and find the perfect fit for your loved one.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '2.5rem', fontWeight: 300, color: '#c9a962', marginBottom: '0.5rem' }}>
                  {item.step}
                </p>
                <h3 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.3rem', fontWeight: 400, color: '#e8e4dc', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9a978f', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-amber-900/20" style={{ backgroundColor: '#0a1410' }}>
        <div className="px-5 md:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1rem' }}>
                Care Network
              </span>
            </div>
            
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72', letterSpacing: '0.05em' }}>
              © 2024 Okapi Care Network. All rights reserved.
            </p>

            <div className="flex gap-5">
              <a 
                href="/privacy" 
                className="text-stone-500 hover:text-amber-200 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
              >
                Privacy
              </a>
              <a 
                href="/terms" 
                className="text-stone-500 hover:text-amber-200 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
              >
                Terms
              </a>
              <a 
                href="mailto:contact@okapicarenetwork.com" 
                className="text-stone-500 hover:text-amber-200 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
