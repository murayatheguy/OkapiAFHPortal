/**
 * Warm Premium Hero Section
 * Emotional, trustworthy hero for caregivers seeking care homes
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Phone, Shield, Clock, Heart } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-glow">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-plum-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-sage-100/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-100 shadow-sm mb-6">
              <Shield className="h-4 w-4 text-sage-600" />
              <span className="text-sm font-medium text-foreground/80">
                Washington State Licensed Homes Only
              </span>
            </div>

            {/* Headline - larger for 50-65 audience */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Find the{" "}
              <span className="text-primary">right care home</span>
              {" "}for your loved one
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-foreground/70 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Compare verified Adult Family Homes in Washington. Every home is licensed,
              inspected, and ready to provide compassionate care.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link href="/search">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold text-lg px-8 h-14 rounded-xl shadow-md"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Browse Care Homes
                </Button>
              </Link>
              <Link href="/match">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary/20 text-primary hover:bg-plum-50 font-semibold text-lg px-8 h-14 rounded-xl"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Get Matched Free
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-foreground/60">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sage-500" />
                <span className="text-base font-medium">Updated Daily</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-sage-500" />
                <span className="text-base font-medium">Free Consultation</span>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card-hover">
              <img
                src="/caring-home-family.png"
                alt="Caring homes for your family"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
