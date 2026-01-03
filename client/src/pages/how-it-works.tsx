/**
 * How It Works Page - Guide to using Okapi Care Network
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Search,
  ClipboardList,
  Phone,
  Home,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  Shield,
  Heart
} from "lucide-react";
import { Link } from "wouter";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Search & Discover",
      description: "Start by browsing our comprehensive directory of licensed Adult Family Homes in Washington State. Use filters to narrow down by location, care needs, amenities, and payment options.",
      tips: [
        "Use our Match Wizard for personalized recommendations",
        "Filter by city, ZIP code, or county",
        "View DSHS licensing and compliance data"
      ]
    },
    {
      number: "02",
      icon: ClipboardList,
      title: "Compare Options",
      description: "Review detailed facility profiles including photos, services, specialties, and real compliance records. Save favorites to compare side-by-side.",
      tips: [
        "Check recent inspection reports",
        "Review care specialties and services",
        "Look at staff-to-resident ratios"
      ]
    },
    {
      number: "03",
      icon: Phone,
      title: "Connect Directly",
      description: "Contact facilities directly through our platform. Ask questions, schedule tours, and discuss care needs with home owners and caregivers.",
      tips: [
        "Request an in-person or virtual tour",
        "Ask about daily routines and activities",
        "Discuss specific care requirements"
      ]
    },
    {
      number: "04",
      icon: Home,
      title: "Find Your Match",
      description: "After tours and conversations, choose the home that feels right. We're here to support you through the transition and beyond.",
      tips: [
        "Trust your instincts during visits",
        "Involve your loved one in the decision",
        "Ask about trial stays if available"
      ]
    }
  ];

  const forFamilies = [
    {
      icon: Search,
      title: "Easy Search",
      description: "Find AFHs by location, care type, or use our Match Wizard for personalized recommendations."
    },
    {
      icon: Shield,
      title: "Verified Data",
      description: "All listings come from official DSHS records with current licensing and compliance information."
    },
    {
      icon: Heart,
      title: "Free to Use",
      description: "Searching and connecting with care homes is always free for families."
    }
  ];

  const forOwners = [
    {
      icon: Building2,
      title: "Claim Your Listing",
      description: "Verify ownership and take control of your facility's online presence."
    },
    {
      icon: Users,
      title: "Reach Families",
      description: "Connect with families actively searching for quality care in your area."
    },
    {
      icon: CheckCircle,
      title: "Manage Easily",
      description: "Update information, respond to inquiries, and manage your listing from one dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-sage-50 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How Okapi Works
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Finding the right Adult Family Home shouldn't be complicated. Here's how we make it simple.
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row gap-8 items-start ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-lg text-foreground/70 mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/60">
                      <CheckCircle className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual/Card */}
              <div className="flex-1 w-full">
                <div className="bg-gradient-to-br from-ivory to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                    <step.icon className="h-16 w-16 text-primary/30" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Ready to Find the Right Care Home?
              </h2>
              <p className="text-white/80">
                Use our Match Wizard for personalized recommendations
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/match">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Start Matching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Browse All
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* For Families & Owners */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* For Families */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              For Families
            </h2>
            <div className="space-y-6">
              {forFamilies.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-sage-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-foreground/60 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/search">
              <Button className="mt-6" variant="outline">
                Start Searching
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* For Owners */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              For AFH Owners
            </h2>
            <div className="space-y-6">
              {forOwners.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-plum-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-plum-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-foreground/60 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/owner/login">
              <Button className="mt-6" variant="outline">
                Owner Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Link */}
      <div className="bg-ivory border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-3">Have More Questions?</h2>
            <p className="text-foreground/60 mb-4">
              Check our FAQ for detailed answers about AFH care and using our platform.
            </p>
            <Link href="/faq">
              <Button variant="outline">
                View FAQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
