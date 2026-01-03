/**
 * Warm Premium OwnerCTA - Call to action for AFH owners
 * Sage green accent for secondary CTA
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home, Users, Star, DollarSign } from "lucide-react";

const benefits = [
  {
    icon: Users,
    text: "Families contact you directly",
  },
  {
    icon: DollarSign,
    text: "No referral commissions — ever",
  },
  {
    icon: Home,
    text: "Showcase your home with photos & details",
  },
  {
    icon: Star,
    text: "Build your reputation with reviews",
  },
];

export function OwnerCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-sage-500 to-sage-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-card-hover">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-50 text-sage-700 text-sm font-medium mb-4">
                  <Home className="h-4 w-4" />
                  For Home Owners
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Own an Adult Family Home?
                </h2>
                <p className="text-xl text-foreground/70 mb-8">
                  Get discovered by families searching for care in Washington State.
                  Simple monthly listing with zero referral fees.
                </p>

                <ul className="space-y-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sage-50 flex items-center justify-center shrink-0">
                        <benefit.icon className="w-4 h-4 text-sage-600" />
                      </div>
                      <span className="text-lg text-foreground/80">{benefit.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white text-lg h-14 px-8 rounded-xl font-semibold shadow-sm"
                  onClick={() => setLocation("/owner/login")}
                >
                  Claim Your Listing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Visual */}
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  {/* Main image card */}
                  <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-card-hover">
                    <img
                      src="/owner-cta.jpg"
                      alt="Adult Family Home owner welcoming families"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-card border border-gray-100">
                    <div className="text-2xl font-bold text-sage-600">$0</div>
                    <div className="text-sm text-foreground/60">referral fees</div>
                  </div>

                  {/* Top badge */}
                  <div className="absolute -top-3 -left-3 bg-gold-100 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-sm font-semibold text-gold-700">Free Trial</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
