/**
 * Family-Centered Homepage - LISTINGS FIRST
 * Families should see homes within seconds, not after scrolling
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Heart, CheckCircle, ArrowRight, MapPin,
  Bed, Users, Phone, ChevronRight, Shield, Clock,
  Home, Star, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WA_CITIES } from "@/lib/constants";

interface Facility {
  id: string;
  name: string;
  city?: string;
  state?: string;
  description?: string;
  capacity?: number;
  availableBeds?: number;
  currentOccupancy?: number;
  specialties?: string[];
  acceptsMedicaid?: boolean;
  priceMin?: number;
  priceMax?: number;
  images?: string[];
  featured?: boolean;
  licenseStatus?: string;
}

export default function HomeFamily() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroCompact />
      <FeaturedHomesSection />
      <QuickInfo />
      <MoreHomes />
      <Footer />
    </div>
  );
}

/**
 * Header - Clean, minimal
 */
function Header() {
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => setLocation("/")} className="flex items-center">
          <span className="text-lg tracking-wide">
            <span className="font-light text-gray-800">OKAPI</span>
            <span className="font-light text-gray-500 ml-1">Care Network</span>
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/directory")}
            className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
          >
            Browse All
          </button>
          <button
            onClick={() => setLocation("/owner/login")}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
          >
            AFH Owners
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Compact Hero - Just the essentials
 */
function HeroCompact() {
  const [, setLocation] = useLocation();
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = () => {
    if (searchCity) {
      setLocation(`/directory?city=${encodeURIComponent(searchCity)}`);
    } else {
      setLocation("/directory");
    }
  };

  return (
    <section className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Find the Right Home <span className="text-teal-600">for Mom or Dad</span>
          </h1>
          <p className="text-gray-600 mb-6">
            Licensed Adult Family Homes in Washington State
          </p>

          {/* Search + Match Row */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            {/* Search input */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="City or zip code"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  list="cities"
                  className="pl-9 h-11"
                />
                <datalist id="cities">
                  {WA_CITIES.map(city => <option key={city} value={city} />)}
                </datalist>
              </div>
              <Button onClick={handleSearch} className="h-11 px-6 bg-teal-600 hover:bg-teal-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Or Match button */}
            <Button
              onClick={() => setLocation("/match")}
              variant="outline"
              className="h-11 border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Help Me Choose
            </Button>
          </div>

          {/* Trust badges - compact */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              DSHS Licensed
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Free for Families
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              No Sales Calls
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Featured Homes - THE MAIN EVENT
 * This should be visible immediately after hero
 */
function FeaturedHomesSection() {
  const [, setLocation] = useLocation();

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["featured-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/facilities");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      // Prefer featured homes, otherwise take first 4
      if (Array.isArray(data)) {
        const featured = data.filter((f: Facility) => f.featured);
        if (featured.length >= 4) {
          return featured.slice(0, 4);
        }
        return data.slice(0, 4);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Homes with Beds Available
            </h2>
            <p className="text-sm text-gray-500">
              Ready to welcome your loved one
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/directory")}
            className="text-teal-600 hover:text-teal-700"
          >
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Homes Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : facilities && facilities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {facilities.map((facility) => (
              <HomeCard
                key={facility.id}
                facility={facility}
                onClick={() => setLocation(`/facility/${facility.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Loading homes...</p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Home Card - Clean, informative
 */
function HomeCard({ facility, onClick }: { facility: Facility; onClick: () => void }) {
  const availableBeds = facility.availableBeds ??
    (facility.capacity ? Math.max(0, facility.capacity - (facility.currentOccupancy || 0)) : null);

  const specialty = facility.specialties?.[0] || "General Care";

  // Format specialty for display
  const formatSpecialty = (s: string) => {
    return s
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Generate a gradient based on specialty
  const getGradient = () => {
    const s = specialty.toLowerCase();
    if (s.includes("memory") || s.includes("dementia")) return "from-purple-500 to-purple-600";
    if (s.includes("mental")) return "from-blue-500 to-blue-600";
    if (s.includes("hospice")) return "from-rose-500 to-rose-600";
    if (s.includes("veteran")) return "from-amber-500 to-amber-600";
    return "from-teal-500 to-teal-600";
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group bg-white"
      onClick={onClick}
    >
      {/* Visual header */}
      <div className={`h-28 bg-gradient-to-br ${getGradient()} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Home className="h-12 w-12 text-white/80" />
        </div>

        {/* Availability badge */}
        {availableBeds !== null && availableBeds > 0 && (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
            {availableBeds} bed{availableBeds > 1 ? "s" : ""} open
          </Badge>
        )}

        {facility.licenseStatus === "Active" && (
          <Badge className="absolute top-2 left-2 bg-white/90 text-teal-700 text-xs flex items-center gap-1">
            <Check className="h-3 w-3" />
            Licensed
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name & Location */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">
          {facility.name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="h-3 w-3" />
          {facility.city || "Washington"}{facility.state ? `, ${facility.state}` : ""}
        </div>

        {/* Specialty badge */}
        <Badge variant="secondary" className="text-xs mb-3">
          {formatSpecialty(specialty)}
        </Badge>

        {/* Quick facts */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {facility.capacity || 6} beds
          </span>
          {facility.acceptsMedicaid && (
            <span className="text-green-600 font-medium">Medicaid</span>
          )}
        </div>

        {/* Price if available */}
        {facility.priceMin && facility.priceMin > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            From ${facility.priceMin.toLocaleString()}/mo
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quick Info - Compact version of "What is AFH" + Trust
 */
function QuickInfo() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-10 bg-white border-t">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left - What is AFH */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose an Adult Family Home?
            </h2>
            <div className="space-y-3">
              {[
                { icon: Users, text: "6 or fewer residents — real personal attention" },
                { icon: Home, text: "A real home, not an institution" },
                { icon: Heart, text: "Same caregivers every day who know your loved one" },
                { icon: Shield, text: "All homes licensed & inspected by DSHS" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Help me choose CTA */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Not sure where to start?
            </h3>
            <p className="text-gray-600 mb-4">
              Answer a few questions about your loved one and we'll match you with
              homes that fit their needs.
            </p>
            <Button
              onClick={() => setLocation("/match")}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Heart className="h-4 w-4 mr-2" />
              Help Me Find the Right Home
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Free • Takes 3 minutes • No account needed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * More Homes / Browse by City
 */
function MoreHomes() {
  const [, setLocation] = useLocation();
  const cities = ["Seattle", "Tacoma", "Bellevue", "Spokane", "Everett", "Kent", "Renton", "Olympia"];

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          Browse by City
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setLocation(`/directory?city=${encodeURIComponent(city)}`)}
              className="px-4 py-2 bg-white rounded-full border hover:border-teal-500 hover:text-teal-600 transition-colors text-sm"
            >
              {city}
            </button>
          ))}
          <button
            onClick={() => setLocation("/directory")}
            className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors text-sm"
          >
            All Homes →
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer - Compact
 */
function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg tracking-wide">
              <span className="font-light text-white">OKAPI</span>
              <span className="font-light text-gray-400 ml-1">Care Network</span>
            </span>
            <p className="text-sm text-gray-400 mt-2">
              Washington's Adult Family Home directory.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-3">Find Care</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setLocation("/match")} className="hover:text-white">Get Matched</button></li>
              <li><button onClick={() => setLocation("/directory")} className="hover:text-white">Browse Homes</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-3">For Owners</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setLocation("/owner/login")} className="hover:text-white">Owner Login</button></li>
              <li><button onClick={() => setLocation("/owner/setup")} className="hover:text-white">List Your Home</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://www.dshs.wa.gov/altsa" target="_blank" rel="noopener noreferrer" className="hover:text-white">DSHS Info ↗</a></li>
              <li><button onClick={() => setLocation("/privacy")} className="hover:text-white">Privacy</button></li>
              <li><button onClick={() => setLocation("/terms")} className="hover:text-white">Terms</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Okapi Care Network
        </div>
      </div>
    </footer>
  );
}
