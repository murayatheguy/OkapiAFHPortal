import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedFacilities, searchFacilities } from "@/lib/api";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: featuredFacilities = [] } = useQuery({
    queryKey: ["featured-facilities"],
    queryFn: () => getFeaturedFacilities(9),
  });

  const { data: allFacilities = [] } = useQuery({
    queryKey: ["facilities"],
    queryFn: () => searchFacilities(),
  });

  const facilities = activeFilter === 'all' ? featuredFacilities : allFacilities;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(searchValue)}`);
  };

  const filters = [
    { id: 'all', label: 'All Homes' },
    { id: 'memory', label: 'Memory Care' },
    { id: 'assisted', label: 'Assisted Living' },
    { id: 'respite', label: 'Respite Care' }
  ];

  const filteredFacilities = facilities.filter(facility => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'memory') return facility.specialties?.some(s => s.toLowerCase().includes('memory') || s.toLowerCase().includes('dementia'));
    if (activeFilter === 'assisted') return facility.specialties?.some(s => s.toLowerCase().includes('assisted'));
    if (activeFilter === 'respite') return facility.specialties?.some(s => s.toLowerCase().includes('respite'));
    return true;
  }).slice(0, 6);

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

      {/* Header */}
      <header className="relative z-50 px-6 md:px-12 py-6 flex items-center justify-between border-b border-amber-900/20">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.12em', fontSize: '1.5rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.5rem' }}>
            Care
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

      </header>

      {/* Hero Section - Compact */}
      <section className="relative py-16 md:py-24">
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 bg-amber-900/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 px-6 md:px-12 max-w-5xl mx-auto text-center">
          <p 
            className="mb-4 tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#c9a962' }}
            data-testid="text-tagline"
          >
            Washington State's Premier Care Network
          </p>

          <h1 
            className="mb-6"
            style={{ fontFamily: "'Cormorant', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: '#e8e4dc', lineHeight: 1.1 }}
            data-testid="text-headline"
          >
            Exceptional care,
            <span style={{ fontStyle: 'italic', color: '#c9a962' }}> thoughtfully curated.</span>
          </h1>
          
          <p 
            className="max-w-xl mx-auto mb-10"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '1rem', color: '#9a978f', lineHeight: 1.7 }}
            data-testid="text-description"
          >
            Connect with verified Adult Family Homes offering personalized attention and certified professionals.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch}>
              <div 
                className="p-0.5 rounded"
                style={{ background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.4) 0%, rgba(201, 169, 98, 0.1) 50%, rgba(201, 169, 98, 0.4) 100%)' }}
              >
                <div className="flex flex-col sm:flex-row bg-[#0d1a14] rounded overflow-hidden">
                  <div className="relative flex-1">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#c9a962' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="City, ZIP code, or county..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-stone-200 placeholder-stone-600 focus:outline-none"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: '0.03em' }}
                      data-testid="input-search"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-8 py-4 transition-all duration-300 hover:bg-amber-700"
                    style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: '0.15em', fontSize: '0.8rem', color: '#0d1a14', backgroundColor: '#c9a962' }}
                    data-testid="button-search"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            {[
              { number: '500+', label: 'Verified Homes' },
              { number: '98%', label: 'Family Satisfaction' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '1.8rem', fontWeight: 400, color: '#c9a962' }}>{stat.number}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', fontWeight: 300, color: '#9a978f', letterSpacing: '0.1em' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Homes Section */}
      <section className="relative z-10 py-16" style={{ backgroundColor: '#f8f6f1' }}>
        <div className="px-6 md:px-12">
          {/* Section Header */}
          <div className="max-w-6xl mx-auto mb-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p 
                  className="mb-2 tracking-[0.2em] uppercase"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.7rem', color: '#c9a962' }}
                >
                  Handpicked for Excellence
                </p>
                <h2 
                  style={{ fontFamily: "'Cormorant', serif", fontSize: '2.2rem', fontWeight: 400, color: '#1a2f25' }}
                >
                  Featured Homes
                </h2>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className="px-4 py-2 transition-all duration-300"
                    style={{ 
                      fontFamily: "'Jost', sans-serif", 
                      fontWeight: 400, 
                      fontSize: '0.75rem', 
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
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <div 
                key={facility.id} 
                className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                style={{ borderRadius: '2px' }}
                data-testid={`card-facility-${facility.id}`}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-stone-200">
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
                    className="absolute top-4 left-4 px-3 py-1"
                    style={{ 
                      backgroundColor: facility.availableBeds > 0 ? 'rgba(34, 87, 64, 0.9)' : 'rgba(120, 100, 70, 0.9)',
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      color: '#fff'
                    }}
                  >
                    {facility.availableBeds > 0 ? `${facility.availableBeds} BED${facility.availableBeds > 1 ? 'S' : ''} AVAILABLE` : 'WAITLIST'}
                  </div>

                  {/* Price */}
                  <div 
                    className="absolute bottom-4 right-4"
                    style={{ fontFamily: "'Cormorant', serif", fontSize: '1.1rem', fontWeight: 500, color: '#fff' }}
                  >
                    {facility.priceMin && facility.priceMax ? (
                      `$${(facility.priceMin / 1000).toFixed(1)}k - $${(facility.priceMax / 1000).toFixed(1)}k/mo`
                    ) : (
                      'Contact for Pricing'
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className="group-hover:text-amber-700 transition-colors"
                      style={{ fontFamily: "'Cormorant', serif", fontSize: '1.35rem', fontWeight: 500, color: '#1a2f25' }}
                    >
                      {facility.name}
                    </h3>
                    {facility.licenseStatus === 'Active' && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#22574c' }}>
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <p 
                      className="flex items-center gap-1"
                      style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#6b7c72' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {facility.city}, WA · {facility.capacity} beds
                    </p>
                    {facility.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: '#6b7c72' }}>
                          {facility.rating}
                        </span>
                        {facility.reviewCount && (
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9a978f' }}>
                            ({facility.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {facility.specialties && facility.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {facility.specialties.slice(0, 2).map((specialty) => (
                        <span 
                          key={specialty}
                          className="px-2 py-1"
                          style={{ 
                            fontFamily: "'Jost', sans-serif", 
                            fontSize: '0.65rem', 
                            fontWeight: 400,
                            letterSpacing: '0.05em',
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
                    className="block w-full py-3 text-center border border-stone-300 text-stone-700 hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-all duration-300"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em' }}
                    data-testid={`button-view-${facility.id}`}
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link 
              href="/search"
              className="inline-block px-10 py-4 transition-all duration-300 hover:bg-amber-700"
              style={{ 
                fontFamily: "'Jost', sans-serif", 
                fontWeight: 400, 
                letterSpacing: '0.15em', 
                fontSize: '0.8rem', 
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

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-20" style={{ backgroundColor: '#0d1a14' }}>
        <div className="px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p 
              className="mb-3 tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.7rem', color: '#c9a962' }}
            >
              Simple & Supportive
            </p>
            <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '2.2rem', fontWeight: 400, color: '#e8e4dc' }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Search', desc: 'Enter your location to discover verified Adult Family Homes in your area.' },
              { step: '02', title: 'Compare', desc: 'Review detailed profiles, photos, certifications, and authentic family reviews.' },
              { step: '03', title: 'Connect', desc: 'Schedule tours directly with homes and find the perfect fit for your loved one.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p style={{ fontFamily: "'Cormorant', serif", fontSize: '3rem', fontWeight: 300, color: '#c9a962', marginBottom: '1rem' }}>
                  {item.step}
                </p>
                <h3 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 400, color: '#e8e4dc', marginBottom: '0.75rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: '#9a978f', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-amber-900/20" style={{ backgroundColor: '#0a1410' }}>
        <div className="px-6 md:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.12em', fontSize: '1.2rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.2rem' }}>
                Care
              </span>
            </div>
            
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#6b7c72', letterSpacing: '0.05em' }}>
              © 2024 Okapi Care Network. All rights reserved.
            </p>

            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Contact'].map((link) => (
                <a 
                  key={link}
                  href="#" 
                  className="text-stone-500 hover:text-amber-200 transition-colors"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
