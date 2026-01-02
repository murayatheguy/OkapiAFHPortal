/**
 * Family-Centered Homepage - Warm Premium Theme
 * Designed for 50-65yo caregivers with larger text and calming colors
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
import { LogoStacked } from "@/components/brand/Logo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyTrustUs } from "@/components/home/WhyTrustUs";
import { Testimonials } from "@/components/home/Testimonials";
import { OwnerCTA } from "@/components/home/OwnerCTA";
import { ResourcesSection } from "@/components/home/ResourcesSection";

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
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <TrustBar />
      <FeaturedHomes />
      <HowItWorks />
      <QuickInfo />
      <WhyTrustUs />
      <Testimonials />
      <BrowseCities />
      <OwnerCTA />
      <ResourcesSection />
      <Footer />
    </div>
  );
}

/**
 * Featured Homes - Warm Premium Design
 */
function FeaturedHomes() {
  const [, setLocation] = useLocation();

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["featured-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/facilities");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
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
    <section className="py-14 lg:py-20 bg-ivory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Available Right Now
            </h2>
            <p className="text-lg text-foreground/60">
              Homes ready to welcome your loved one today
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/directory")}
            className="text-primary hover:text-primary/90 hover:bg-plum-50 text-base"
          >
            View all homes <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : facilities && facilities.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <HomeCard
                key={facility.id}
                facility={facility}
                index={index}
                onClick={() => setLocation(`/facility/${facility.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-card">
            <Home className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-foreground/60">Loading available homes...</p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Home Card - Warm Premium style
 */
function HomeCard({ facility, index, onClick }: { facility: Facility; index: number; onClick: () => void }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const availableBeds = facility.availableBeds ??
    (facility.capacity ? Math.max(0, facility.capacity - (facility.currentOccupancy || 0)) : null);

  const sampleImages = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  ];
  const imageUrl = (facility.images && facility.images.length > 0) ? facility.images[0] : sampleImages[index % 3];
  const photoCount = Math.floor(Math.random() * 8) + 3;

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden bg-ivory">
          <img
            src={imageUrl}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = sampleImages[index % 3];
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Licensed badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
            <Shield className="h-3.5 w-3.5 text-sage-600" />
            <span className="text-xs font-medium text-foreground/80">Licensed</span>
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
            className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart className={cn(
              "h-5 w-5 transition-colors",
              isFavorited ? "fill-red-500 text-red-500" : "text-foreground/60"
            )} />
          </button>

          {/* Bottom badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {availableBeds !== null && availableBeds > 0 && (
              <Badge className="bg-sage-600/90 backdrop-blur-sm text-white border-0 text-sm px-3">
                {availableBeds} {availableBeds === 1 ? 'Bed' : 'Beds'} Available
              </Badge>
            )}
            <Badge className="bg-black/50 backdrop-blur-sm text-white border-0 text-sm ml-auto">
              <Camera className="h-3.5 w-3.5 mr-1" />
              {photoCount}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Name */}
          <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
            {facility.name}
          </h3>

          {/* Address */}
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="h-4 w-4 text-foreground/40 mt-1 flex-shrink-0" />
            <p className="text-base text-foreground/60 line-clamp-2">
              {facility.address && `${facility.address}, `}{facility.city || "Washington"}, WA{facility.zipCode ? ` ${facility.zipCode}` : ""}
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-5">
            <Badge variant="secondary" className="bg-plum-50 text-plum-700 text-sm px-3 py-1">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Adult Family Home
            </Badge>
            {facility.acceptsMedicaid && (
              <Badge variant="secondary" className="bg-sage-50 text-sage-700 text-sm px-3 py-1">
                Medicaid
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-5 pb-5 border-b border-gray-100">
            <span className="text-2xl font-bold text-foreground">
              ${(facility.priceMin || 5500).toLocaleString()}
            </span>
            <span className="text-base text-foreground/50">/month</span>
          </div>

          {/* CTA Button */}
          <Button
            className="w-full h-12 text-base bg-primary hover:bg-primary/90 rounded-xl font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
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
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <Skeleton className="h-52 w-full" />
      <div className="p-6">
        <Skeleton className="h-7 w-3/4 mb-3" />
        <Skeleton className="h-5 w-1/2 mb-5" />
        <div className="flex gap-2 mb-5">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-1/3 mb-5" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Quick Info Section - Warm Premium
 */
function QuickInfo() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - What is AFH */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why Choose an Adult Family Home?
            </h2>
            <div className="space-y-4">
              {[
                { icon: Users, text: "6 or fewer residents — personal attention" },
                { icon: Home, text: "A real home, not an institution" },
                { icon: Heart, text: "Caregivers who know your loved one by name" },
                { icon: Shield, text: "All DSHS licensed & inspected" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-ivory hover:bg-plum-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-plum-100 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-lg text-foreground/80 pt-2">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Match CTA */}
          <div className="bg-gradient-to-br from-primary to-plum-700 rounded-3xl p-8 text-white shadow-card-hover">
            <h3 className="text-2xl font-bold mb-4">Not sure where to start?</h3>
            <p className="text-xl text-white/80 mb-6 leading-relaxed">
              Answer a few questions and we'll match you with homes that fit your loved one's needs.
            </p>
            <Button
              onClick={() => setLocation("/match")}
              size="lg"
              className="w-full bg-white text-primary hover:bg-ivory h-14 text-lg font-semibold rounded-xl"
            >
              <Heart className="h-5 w-5 mr-2" />
              Help Me Find the Right Home
            </Button>
            <p className="text-base text-white/60 text-center mt-4">
              Free · 3 minutes · No account needed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Browse by City - Warm Premium
 */
function BrowseCities() {
  const [, setLocation] = useLocation();
  const cities = ["Seattle", "Tacoma", "Bellevue", "Spokane", "Everett", "Kent", "Renton", "Olympia"];

  return (
    <section className="py-14 bg-ivory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-6">Browse by City</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setLocation(`/directory?city=${encodeURIComponent(city)}`)}
              className="px-5 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-all text-base font-medium shadow-sm hover:shadow"
            >
              {city}
            </button>
          ))}
          <button
            onClick={() => setLocation("/directory")}
            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 text-base font-medium shadow-sm"
          >
            All Homes
            <ArrowRight className="inline h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
}
