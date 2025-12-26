/**
 * AFH Hero Section
 * Focused messaging for Adult Family Homes in Washington State
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Heart, Shield, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BRAND, WA_CITIES } from "@/lib/constants";

export function AFHHero() {
  const [, setLocation] = useLocation();
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = () => {
    if (searchCity) {
      setLocation(`/find-care?city=${encodeURIComponent(searchCity)}`);
    } else {
      setLocation("/find-care");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-white to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-teal-100 text-teal-800 border-teal-200">
            Washington State's AFH Platform
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Find the Right{" "}
            <span className="text-teal-600">Adult Family Home</span>
            {" "}for Your Loved One
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Search {BRAND.state}'s licensed Adult Family Homes. Real-time availability,
            verified information, and personalized matching—all free for families.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8 px-2">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-xl shadow-lg border">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter city or zip code..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 border-0 focus-visible:ring-0 text-base sm:text-lg h-12"
                  list="wa-cities"
                />
                <datalist id="wa-cities">
                  {WA_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <Button
                size="lg"
                onClick={handleSearch}
                className="bg-teal-600 hover:bg-teal-700 h-12 px-6 w-full sm:w-auto"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Or <button onClick={() => setLocation("/find-care")} className="text-teal-600 hover:underline">
                answer a few questions
              </button> to find your best matches
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span>DSHS Licensed</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span>Real-Time Beds</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span>Free for Families</span>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Matching</h3>
            <p className="text-gray-600 text-sm">
              Tell us about your loved one's needs, and we'll find homes that specialize in their care.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Verified Quality</h3>
            <p className="text-gray-600 text-sm">
              Every home is DSHS-licensed. See real quality metrics, staff ratios, and compliance records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Personal Care</h3>
            <p className="text-gray-600 text-sm">
              AFHs offer intimate, home-like settings with 6 or fewer residents and personalized attention.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
