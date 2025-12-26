/**
 * Home Page for AFH Platform
 * Combines all public-facing components for the main landing page
 */

import { PublicLayoutAFH } from "@/layouts/public-layout-afh";
import { AFHHero } from "@/components/public/afh-hero";
import { ValueProposition } from "@/components/public/value-proposition";
import { WhatIsAFHCompact } from "@/components/public/what-is-afh";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Star, ArrowRight, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { BRAND, WA_CITIES } from "@/lib/constants";

// Featured homes section component
function FeaturedHomes() {
  const [, setLocation] = useLocation();

  // Fetch featured homes (mock for now, will use real API)
  const { data: homes = [] } = useQuery({
    queryKey: ["featured-homes"],
    queryFn: async () => {
      // In production, this would fetch from API
      // For now, return empty array to show placeholder
      try {
        const response = await fetch("/api/facilities/featured?limit=4");
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  // Placeholder homes for development
  const placeholderHomes = [
    {
      id: "1",
      name: "Sunny Meadows AFH",
      city: "Seattle",
      bedsAvailable: 2,
      totalBeds: 6,
      rating: 4.8,
      specializations: ["Memory Care", "Dementia"],
    },
    {
      id: "2",
      name: "Peaceful Pines Care Home",
      city: "Bellevue",
      bedsAvailable: 1,
      totalBeds: 6,
      rating: 4.9,
      specializations: ["General Care", "Hospice"],
    },
    {
      id: "3",
      name: "Evergreen Adult Family Home",
      city: "Tacoma",
      bedsAvailable: 3,
      totalBeds: 6,
      rating: 4.7,
      specializations: ["Mental Health"],
    },
    {
      id: "4",
      name: "Harbor View AFH",
      city: "Kirkland",
      bedsAvailable: 0,
      totalBeds: 6,
      rating: 5.0,
      specializations: ["Veterans Care"],
    },
  ];

  const displayHomes = homes.length > 0 ? homes : placeholderHomes;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            Featured Homes
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Explore {BRAND.state} Adult Family Homes
          </h2>
          <p className="text-gray-600">
            Top-rated homes with availability across the state
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayHomes.map((home: any) => (
            <Card
              key={home.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(`/facility/${home.id}`)}
            >
              {/* Placeholder Image */}
              <div className="h-40 bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏠</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{home.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{home.city}, WA</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-teal-600" />
                    <span className="text-sm">
                      {home.bedsAvailable > 0 ? (
                        <span className="text-green-600 font-medium">
                          {home.bedsAvailable} beds open
                        </span>
                      ) : (
                        <span className="text-gray-400">Waitlist</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{home.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {home.specializations?.slice(0, 2).map((spec: string) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setLocation("/find-care")}
            className="bg-teal-600 hover:bg-teal-700"
          >
            View All Homes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// Cities section
function PopularCities() {
  const [, setLocation] = useLocation();
  const topCities = WA_CITIES.slice(0, 8);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-xl font-bold text-center mb-6">
          Find AFHs by City
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {topCities.map((city) => (
            <Button
              key={city}
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/find-care?city=${encodeURIComponent(city)}`)}
              className="rounded-full"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {city}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/find-care")}
            className="rounded-full text-teal-600"
          >
            All Cities
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// Trust/Stats section
function TrustSection() {
  const stats = [
    { value: "3,000+", label: "Licensed AFHs in WA" },
    { value: "18,000+", label: "Residents Cared For" },
    { value: "100%", label: "DSHS Licensed" },
    { value: "24/7", label: "Care Available" },
  ];

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">
            Trusted by {BRAND.state} Families
          </h2>
          <p className="text-gray-400">
            The most comprehensive directory of Adult Family Homes in {BRAND.state} State
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-teal-400 mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>All homes DSHS verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Real-time availability</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Free for families</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA section for owners
function OwnerCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Own an Adult Family Home?
        </h2>
        <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
          Join {BRAND.name} and get a free EHR, automated DSHS forms, and connect with
          families searching for care—all at no cost.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setLocation("/register")}
          >
            List Your Home Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            onClick={() => setLocation("/for-owners")}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}

// Main home page component
export function HomeAFH() {
  return (
    <PublicLayoutAFH>
      <AFHHero />
      <ValueProposition />
      <FeaturedHomes />
      <PopularCities />
      <WhatIsAFHCompact />
      <TrustSection />
      <OwnerCTA />
    </PublicLayoutAFH>
  );
}

export default HomeAFH;
