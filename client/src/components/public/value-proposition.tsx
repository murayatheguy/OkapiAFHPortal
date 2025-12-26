/**
 * Value Proposition Section
 * Shows the "ONE PLATFORM" concept with three pillars:
 * Find Care (Families) | Run Care (Owners) | Prove Care (Regulators)
 */

import { useLocation } from "wouter";
import {
  Search,
  ClipboardList,
  Shield,
  Bed,
  Star,
  CheckCircle,
  Users,
  Pill,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ValueProposition() {
  const [, setLocation] = useLocation();

  const pillars = [
    {
      id: "find-care",
      icon: Search,
      title: "Find Care",
      audience: "Families",
      color: "teal",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      accentColor: "bg-teal-500",
      features: [
        { icon: Search, text: "AFH search" },
        { icon: Bed, text: "Real-time beds" },
        { icon: CheckCircle, text: "Verified homes" },
        { icon: Star, text: "Family reviews" },
        { icon: Shield, text: "DSHS licensed" },
      ],
      cta: "Find a Home",
      ctaLink: "/find-care",
    },
    {
      id: "run-care",
      icon: ClipboardList,
      title: "Run Care",
      audience: "Owners",
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accentColor: "bg-blue-500",
      features: [
        { icon: ClipboardList, text: "Free EHR" },
        { icon: Users, text: "Care Portal" },
        { icon: Pill, text: "Med tracking" },
        { icon: Users, text: "Staff mgmt" },
        { icon: Activity, text: "Incident logs" },
      ],
      cta: "Owner Login",
      ctaLink: "/login",
    },
    {
      id: "prove-care",
      icon: Shield,
      title: "Prove Care",
      audience: "DSHS",
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      accentColor: "bg-purple-500",
      features: [
        { icon: FileText, text: "DSHS forms" },
        { icon: FileText, text: "Compliance docs" },
        { icon: Activity, text: "Audit trails" },
        { icon: CheckCircle, text: "Inspection-ready" },
        { icon: Shield, text: "RCW/WAC compliant" },
      ],
      cta: "Learn More",
      ctaLink: "/compliance",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-gray-100">
            Washington State's AFH Platform
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            One Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built for 6-Bed Homes
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pillars.map((pillar) => {
            const PillarIcon = pillar.icon;

            return (
              <Card
                key={pillar.id}
                className={cn(
                  "relative overflow-hidden border-2 transition-all hover:shadow-lg",
                  pillar.borderColor
                )}
              >
                {/* Top accent */}
                <div className={cn("h-2", pillar.accentColor)} />

                <CardContent className="p-6">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-3 rounded-xl", pillar.iconBg)}>
                      <PillarIcon className={cn("h-6 w-6", pillar.iconColor)} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ({pillar.audience})
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {pillar.features.map((feature, index) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <li key={index} className="flex items-center gap-3">
                          <FeatureIcon className={cn("h-4 w-4 flex-shrink-0", pillar.iconColor)} />
                          <span className="text-sm text-gray-700">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={pillar.id === "find-care" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      pillar.id === "find-care" && "bg-teal-600 hover:bg-teal-700"
                    )}
                    onClick={() => setLocation(pillar.ctaLink)}
                  >
                    {pillar.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connecting Line Visual */}
        <div className="hidden md:flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent to-teal-300" />
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <Search className="h-4 w-4 text-teal-600" />
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-teal-300 to-blue-300" />
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white text-lg">O</span>
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300" />
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <div className="w-24 h-0.5 bg-gradient-to-l from-transparent to-purple-300" />
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p className="text-xl md:text-2xl font-semibold text-gray-900">
            "Every AFH in Washington. One Platform."
          </p>
          <p className="text-gray-500 mt-2">
            The only platform where running your home well automatically helps families find you.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Compact version for other pages
 */
export function ValuePropositionCompact() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-12 bg-gray-50 border-y">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Tagline */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              One Platform. Three Purposes.
            </h3>
            <p className="text-sm text-gray-600">
              Find Care | Run Care | Prove Care
            </p>
          </div>

          {/* Center: Visual */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100">
              <Search className="h-5 w-5 text-teal-600" />
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900">
              <span className="text-xl text-white">O</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/find-care")}
            >
              Find Care
            </Button>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => setLocation("/login")}
            >
              Owner Login
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
