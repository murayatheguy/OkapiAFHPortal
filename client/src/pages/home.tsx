import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(searchValue)}`);
  };

  return (
    <div className="min-h-screen" style={{ 
      fontFamily: "'Cormorant', serif",
      backgroundColor: '#0d1a14'
    }}>
      {/* Subtle texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-50 px-8 md:px-16 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="text-3xl md:text-4xl tracking-wide"
            style={{ 
              fontFamily: "'Cormorant', serif",
              fontWeight: 300,
              color: '#c9a962',
              letterSpacing: '0.15em'
            }}
          >
            OKAPI
          </span>
          <span 
            className="text-3xl md:text-4xl tracking-wide"
            style={{ 
              fontFamily: "'Cormorant', serif",
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#e8e4dc',
              letterSpacing: '0.05em'
            }}
          >
            Care
          </span>
        </div>
        
        {/* Subtle decorative line */}
        <div className="hidden md:block flex-1 mx-12 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
        
        <nav className="hidden md:flex items-center gap-10">
          <a href="/search" className="text-stone-400 hover:text-amber-200 transition-colors text-sm tracking-widest uppercase" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            Find Care
          </a>
          <a href="/owner" className="text-stone-400 hover:text-amber-200 transition-colors text-sm tracking-widest uppercase" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
            For Owners
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Gradient orbs for depth */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-amber-900/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Refined pre-title */}
            <p 
              className="mb-8 tracking-[0.4em] uppercase"
              style={{ 
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: '0.75rem',
                color: '#c9a962'
              }}
              data-testid="text-tagline"
            >
              Washington State's Premier Care Network
            </p>

            {/* Main headline */}
            <h1 
              className="mb-8 leading-[1.05]"
              style={{ 
                fontFamily: "'Cormorant', serif",
                fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                fontWeight: 300,
                color: '#e8e4dc',
                letterSpacing: '-0.01em'
              }}
              data-testid="text-headline"
            >
              Exceptional care,
              <span 
                className="block mt-2"
                style={{ 
                  fontStyle: 'italic',
                  color: '#c9a962'
                }}
              >
                thoughtfully curated.
              </span>
            </h1>
            
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 my-10">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-amber-700/50" />
              <svg className="w-4 h-4 text-amber-700/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 16.5L18.5 21L16.5 13.5L22 9H15L12 2Z" />
              </svg>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-amber-700/50" />
            </div>

            <p 
              className="max-w-xl mx-auto mb-14 leading-relaxed"
              style={{ 
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: '1.1rem',
                color: '#9a978f',
                letterSpacing: '0.02em'
              }}
              data-testid="text-description"
            >
              Connect with verified Adult Family Homes offering 
              personalized attention, certified professionals, and 
              the dignity your loved ones deserve.
            </p>

            {/* Luxury Search Box */}
            <div className="max-w-lg mx-auto mb-16">
              <form onSubmit={handleSearch}>
                <div 
                  className="relative p-1 rounded-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.3) 0%, rgba(201, 169, 98, 0.1) 50%, rgba(201, 169, 98, 0.3) 100%)'
                  }}
                >
                  <div className="flex bg-[#0d1a14] rounded-sm overflow-hidden">
                    <div className="relative flex-1">
                      <svg 
                        className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: '#c9a962' }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Enter your location"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full pl-14 pr-4 py-5 bg-transparent text-stone-200 placeholder-stone-600 focus:outline-none"
                        style={{ 
                          fontFamily: "'Jost', sans-serif",
                          fontWeight: 300,
                          letterSpacing: '0.05em',
                          fontSize: '0.95rem'
                        }}
                        data-testid="input-search"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="px-8 py-5 transition-all duration-500 hover:bg-amber-700"
                      style={{ 
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: 400,
                        letterSpacing: '0.2em',
                        fontSize: '0.75rem',
                        color: '#0d1a14',
                        backgroundColor: '#c9a962'
                      }}
                      data-testid="button-search"
                    >
                      DISCOVER
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-12">
              <div className="flex items-center gap-3">
                <div 
                  className="w-px h-8"
                  style={{ backgroundColor: 'rgba(201, 169, 98, 0.3)' }}
                />
                <div>
                  <p 
                    className="text-left"
                    style={{ 
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      color: '#c9a962'
                    }}
                  >
                    DSHS VERIFIED
                  </p>
                  <p 
                    style={{ 
                      fontFamily: "'Cormorant', serif",
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      color: '#9a978f'
                    }}
                  >
                    Licensed Homes
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-px h-8"
                  style={{ backgroundColor: 'rgba(201, 169, 98, 0.3)' }}
                />
                <div>
                  <p 
                    className="text-left"
                    style={{ 
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      color: '#c9a962'
                    }}
                  >
                    PERSONALLY VETTED
                  </p>
                  <p 
                    style={{ 
                      fontFamily: "'Cormorant', serif",
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      color: '#9a978f'
                    }}
                  >
                    Certified Caregivers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-px h-8"
                  style={{ backgroundColor: 'rgba(201, 169, 98, 0.3)' }}
                />
                <div>
                  <p 
                    className="text-left"
                    style={{ 
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      color: '#c9a962'
                    }}
                  >
                    REAL-TIME
                  </p>
                  <p 
                    style={{ 
                      fontFamily: "'Cormorant', serif",
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      color: '#9a978f'
                    }}
                  >
                    Availability
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom accent line */}
      <div className="relative z-10 px-16">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-800/30 to-transparent" />
      </div>
    </div>
  );
}
