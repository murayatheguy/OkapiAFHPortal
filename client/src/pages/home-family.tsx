/**
 * Family-Centered Homepage
 * Emotional, honest language focused on helping families find care
 */

import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Heart,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
  Clock,
  Home,
  MessageCircle,
  Star,
  Building2,
  HelpCircle,
  Check,
  UserCheck,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND, WA_CITIES, WA_DSHS, CARE_NEEDS } from "@/lib/constants";
import { AFHFooter } from "@/components/public/afh-footer";
import { FeaturedHomes } from "@/components/public/featured-homes";

/**
 * Hero Section - Emotional, clear messaging
 */
function HeroSection() {
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
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Simple badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-teal-100 text-teal-800 border-teal-200">
            {BRAND.state}'s Adult Family Home Network
          </Badge>

          {/* Emotional headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            {BRAND.tagline.split(" ").slice(0, 4).join(" ")}{" "}
            <span className="text-teal-600">{BRAND.tagline.split(" ").slice(4).join(" ")}</span>
          </h1>

          {/* Empathetic subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">
            {BRAND.description}
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Answer a few questions and we'll match you with licensed Adult Family Homes
            that fit your loved one's needs.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={() => setLocation("/match")}
              className="bg-teal-600 hover:bg-teal-700 h-14 px-8 text-lg"
            >
              <Heart className="h-5 w-5 mr-2" />
              Find the Right Home
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/find-care")}
              className="h-14 px-8 text-lg border-2"
            >
              <Search className="h-5 w-5 mr-2" />
              Browse All Homes
            </Button>
          </div>

          {/* Quick search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2 p-2 bg-white rounded-xl shadow-md border">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Or search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 border-0 focus-visible:ring-0 text-base h-11"
                  list="wa-cities"
                />
                <datalist id="wa-cities">
                  {WA_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <Button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700 h-11">
                Search
              </Button>
            </div>
          </div>

          {/* Trust indicators - honest */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>DSHS Licensed Homes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Free for Families</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>{BRAND.matchTime} to Match</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Empathy Section - Acknowledge the difficulty
 */
function WeUnderstand() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Heart className="h-4 w-4" />
          We Get It
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Finding care for a parent is one of the hardest things you'll do.
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          You're juggling work, family, and worry. You want the best for Mom or Dad,
          but you don't know where to start. That's why we built {BRAND.name}—to make
          finding the right Adult Family Home a little easier.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Pressure</h3>
            <p className="text-gray-600 text-sm">
              We're not salespeople. We just help you find good options.
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Take Your Time</h3>
            <p className="text-gray-600 text-sm">
              Whether you need care now or you're just planning, we're here.
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Real People</h3>
            <p className="text-gray-600 text-sm">
              Have questions? Email us. We'll actually respond.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * How It Works - Simple, honest steps
 */
function HowItWorks() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      number: "1",
      title: "Tell Us About Your Loved One",
      description: "Answer a few simple questions about their care needs, preferences, and location. Takes about 3 minutes.",
      icon: MessageCircle,
      color: "teal",
    },
    {
      number: "2",
      title: "See Your Matches",
      description: "We'll show you licensed Adult Family Homes that match what you're looking for. No algorithms—just straightforward filtering.",
      icon: Search,
      color: "blue",
    },
    {
      number: "3",
      title: "Connect Directly",
      description: "Contact homes directly to schedule tours, ask questions, and find the right fit. We don't get in the middle.",
      icon: Phone,
      color: "purple",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps. No account required. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colorClasses = {
              teal: "bg-teal-100 text-teal-600",
              blue: "bg-blue-100 text-blue-600",
              purple: "bg-purple-100 text-purple-600",
            };
            return (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <Card className="relative border-0 shadow-sm text-center">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${colorClasses[step.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="text-sm font-medium text-gray-400 mb-2">Step {step.number}</div>
                    <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setLocation("/match")}
            className="bg-teal-600 hover:bg-teal-700 h-14 px-8 text-lg"
          >
            Get Started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * What Is An AFH - Compact educational section
 */
function WhatIsAFHSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left: Content */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Learn About AFHs
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What is an Adult Family Home?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Adult Family Homes are licensed residential care homes where trained caregivers
              provide personalized care for up to {BRAND.maxBeds} adults in a warm, home-like setting.
              They're often a better fit than large facilities for people who value personal attention.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                Maximum {BRAND.maxBeds} residents means real personal attention
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                State-licensed and regularly inspected by DSHS
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                24/7 care in a real home, not an institution
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                Often more affordable than assisted living
              </li>
            </ul>
          </div>

          {/* Right: Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 bg-teal-50 rounded-xl">
              <UserCheck className="h-10 w-10 text-teal-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-teal-700">1:3</p>
              <p className="text-sm text-teal-600">Staff Ratio</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <Clock className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-700">24/7</p>
              <p className="text-sm text-blue-600">Care Available</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <Home className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-700">{BRAND.maxBeds}</p>
              <p className="text-sm text-purple-600">Max Residents</p>
            </div>
            <div className="text-center p-6 bg-amber-50 rounded-xl">
              <DollarSign className="h-10 w-10 text-amber-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-amber-700">30%</p>
              <p className="text-sm text-amber-600">Avg. Savings</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Trust Section - Honest about what we do
 */
function TrustSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What We Actually Do
          </h2>
          <p className="text-lg text-gray-600">
            No fancy claims. Just helpful tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-green-800 mb-4 flex items-center gap-2">
                <Check className="h-5 w-5" />
                What We Do
              </h3>
              <ul className="space-y-3 text-green-700">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>List licensed AFHs with verified information</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>Help you filter by location, care needs, and availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>Show real photos and information from AFH owners</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>Connect you directly with homes (no middleman)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-gray-600 mb-4">
                What We Don't Do
              </h3>
              <ul className="space-y-3 text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">—</span>
                  <span>Make placement decisions for you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">—</span>
                  <span>Charge families any fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">—</span>
                  <span>Endorse or recommend specific homes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">—</span>
                  <span>Replace visiting homes in person</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>Important:</strong> Always verify licensing directly with{" "}
            <a
              href={WA_DSHS.providerSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              DSHS
            </a>
            {" "}and visit homes in person before making decisions.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Browse By Area - Washington regions
 */
function BrowseByArea() {
  const [, setLocation] = useLocation();

  const regions = [
    { name: "Seattle Area", cities: ["Seattle", "Bellevue", "Kirkland", "Redmond"] },
    { name: "Tacoma Area", cities: ["Tacoma", "Lakewood", "Puyallup", "Federal Way"] },
    { name: "Spokane Area", cities: ["Spokane", "Spokane Valley"] },
    { name: "Everett Area", cities: ["Everett", "Marysville", "Lynnwood", "Edmonds"] },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Browse by Area
          </h2>
          <p className="text-lg text-gray-600">
            Find Adult Family Homes across {BRAND.state} State
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {regions.map((region) => (
            <Card
              key={region.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLocation(`/find-care?city=${encodeURIComponent(region.cities[0])}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  <h3 className="font-semibold">{region.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {region.cities.map((city) => (
                    <Badge
                      key={city}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-teal-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/find-care?city=${encodeURIComponent(city)}`);
                      }}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/find-care")}
            className="border-2"
          >
            View All Locations
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA - Compassionate closing
 */
function FinalCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-teal-600 to-teal-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <Heart className="h-12 w-12 mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to find the right home for your loved one?
        </h2>
        <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
          Take a few minutes to tell us about their needs. We'll show you
          Adult Family Homes that might be a good fit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setLocation("/match")}
            className="bg-white text-teal-700 hover:bg-teal-50 h-14 px-8 text-lg"
          >
            Start Matching
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/find-care")}
            className="border-2 border-white text-white hover:bg-teal-600 h-14 px-8 text-lg"
          >
            Browse Directory
          </Button>
        </div>
        <p className="text-sm text-teal-200 mt-6">
          No account needed. No cost to families. Ever.
        </p>
      </div>
    </section>
  );
}

/**
 * Simple header for family homepage
 */
function SimpleHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">O</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">{BRAND.name}</span>
          </a>
        </Link>

        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/find-care")}
          >
            Browse Homes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/owner/login")}
          >
            For AFH Owners
          </Button>
        </nav>
      </div>
    </header>
  );
}

/**
 * Main Homepage Component
 */
export default function HomeFamily() {
  return (
    <div className="min-h-screen bg-white">
      <SimpleHeader />
      <main>
        <HeroSection />
        <WeUnderstand />
        <HowItWorks />
        <FeaturedHomes />
        <WhatIsAFHSection />
        <TrustSection />
        <BrowseByArea />
        <FinalCTA />
      </main>
      <AFHFooter />
    </div>
  );
}
