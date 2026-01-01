/**
 * OwnerCTA - Call to action for AFH owners
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const benefits = [
  "Families contact you directly",
  "No referral commissions — ever",
  "Show your photos, services, and availability",
  "Build your reputation with reviews",
];

export function OwnerCTA() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Own an Adult Family Home?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Get discovered by families searching for care in Washington.
                  Simple monthly listing. No referral commissions.
                </p>

                <ul className="space-y-3 mb-8">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-lg h-12 px-6"
                    onClick={() => setLocation("/owner/login")}
                  >
                    Claim Your Listing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-gradient-to-br from-emerald-100 to-purple-100 rounded-3xl flex items-center justify-center">
                    <span className="text-8xl">🏡</span>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-amber-100 rounded-xl p-4 shadow-lg">
                    <div className="text-2xl font-bold text-gray-900">$0</div>
                    <div className="text-sm text-gray-600">referral fees</div>
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
