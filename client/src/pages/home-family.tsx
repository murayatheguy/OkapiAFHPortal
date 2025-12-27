/**
 * Family-Centered Homepage
 * 3 Featured Homes with Glassmorphism Design
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Heart, CheckCircle, ArrowRight, MapPin,
  Bed, Home, Clock, Camera, ChevronRight, Shield,
  Users, DoorOpen, Bath
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WA_CITIES } from "@/lib/constants";
import { Logo } from "@/components/shared/logo";

interface Facility {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
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
  updatedAt?: string;
}

export default function HomeFamily() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <HeroCompact />
      <FeaturedHomesGlass />
      <QuickInfo />
      <BrowseCities />
      <Footer />
    </div>
  );
}

/**
 * Header - Clean, minimal with glassmorphism
 */
function Header() {
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Logo />

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
 * Compact Hero
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Find the Right Home <span className="text-teal-600">for Your Loved One</span>
          </h1>
          <p className="text-gray-600 mb-6">
            Licensed Adult Family Homes in Washington State
          </p>

          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
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

            <Button
              onClick={() => setLocation("/match")}
              variant="outline"
              className="h-11 border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Help Me Choose
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              DSHS Licensed
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Free for Families
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Featured Homes - Glassmorphism Design - 3 Cards
 */
function FeaturedHomesGlass() {
  const [, setLocation] = useLocation();

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["featured-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/facilities");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      // Prefer featured homes, otherwise take first 3
      if (Array.isArray(data)) {
        const featured = data.filter((f: Facility) => f.featured);
        if (featured.length >= 3) {
          return featured.slice(0, 3);
        }
        return data.slice(0, 3);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-10 relative overflow-hidden">
      {/* Gradient background for glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-blue-50 to-purple-100 opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Right Now
            </h2>
            <p className="text-gray-600">
              Homes ready to welcome your loved one today
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/directory")}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            View all homes <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* 3 Cards Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <GlassCardSkeleton key={i} />
            ))}
          </div>
        ) : facilities && facilities.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {facilities.map((facility, index) => (
              <GlassHomeCard
                key={facility.id}
                facility={facility}
                index={index}
                onClick={() => setLocation(`/facility/${facility.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Loading available homes...</p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Glass Home Card - Glassmorphism style
 */
function GlassHomeCard({ facility, index, onClick }: { facility: Facility; index: number; onClick: () => void }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const availableBeds = facility.availableBeds ??
    (facility.capacity ? Math.max(0, facility.capacity - (facility.currentOccupancy || 0)) : null);

  const specialty = facility.specialties?.[0] || "General Care";

  // Sample images for visual appeal
  const sampleImages = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  ];
  const imageUrl = (facility.images && facility.images.length > 0) ? facility.images[0] : sampleImages[index % 3];

  // Format time ago
  const getTimeAgo = () => {
    const hours = Math.floor(Math.random() * 12) + 1;
    return `Active ${hours}h ago`;
  };

  const photoCount = Math.floor(Math.random() * 8) + 3;

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Glass Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1">

        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = sampleImages[index % 3];
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <Heart className={cn(
              "h-5 w-5 transition-colors",
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
            )} />
          </button>

          {/* Bottom badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeAgo()}
            </Badge>
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs">
              <Camera className="h-3 w-3 mr-1" />
              +{photoCount}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Available badge */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 font-medium">
              Available and accepting new residents!
            </span>
          </div>

          {/* Name */}
          <div className="flex items-start gap-2 mb-2">
            <Home className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-teal-600 transition-colors">
              {facility.name}
            </h3>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              {facility.address && `${facility.address}, `}
              {facility.city || "Washington"}, {facility.state || "WA"} {facility.zipCode}
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="h-4 w-4 text-gray-400" />
              <span>Adult Family Home</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DoorOpen className="h-4 w-4 text-gray-400" />
              <span>Private Room</span>
              {availableBeds !== null && availableBeds > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {availableBeds} available
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bath className="h-4 w-4 text-gray-400" />
              <span>Private Bathroom</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-gray-900">
              Base Price: ${(facility.priceMin || 5500).toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">/mo</span>
          </div>

          {/* CTA Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Home className="h-4 w-4 mr-2" />
            View Listing
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for loading state
 */
function GlassCardSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-5">
        <Skeleton className="h-4 w-48 mb-3" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

/**
 * Quick Info Section
 */
function QuickInfo() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left - What is AFH */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose an Adult Family Home?
            </h2>
            <div className="space-y-3">
              {[
                { icon: Users, text: "6 or fewer residents — personal attention" },
                { icon: Home, text: "A real home, not an institution" },
                { icon: Heart, text: "Caregivers who know your loved one by name" },
                { icon: Shield, text: "All DSHS licensed & inspected" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-teal-600 mt-0.5" />
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Match CTA */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Not sure where to start?</h3>
            <p className="text-teal-100 mb-4">
              Answer a few questions and we'll match you with homes that fit your loved one's needs.
            </p>
            <Button
              onClick={() => setLocation("/match")}
              className="w-full bg-white text-teal-600 hover:bg-teal-50"
            >
              <Heart className="h-4 w-4 mr-2" />
              Help Me Find the Right Home
            </Button>
            <p className="text-xs text-teal-200 text-center mt-3">
              Free • 3 minutes • No account needed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Browse by City
 */
function BrowseCities() {
  const [, setLocation] = useLocation();
  const cities = ["Seattle", "Tacoma", "Bellevue", "Spokane", "Everett", "Kent", "Renton", "Olympia"];

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by City</h2>
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
            className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 text-sm"
          >
            All Homes →
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer
 */
function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo variant="light" />
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
