/**
 * WhyTrustUs - Trust pillars section
 */

import { Heart, Home, Shield, Clock } from "lucide-react";

const reasons = [
  {
    icon: Heart,
    title: "We understand",
    description: "This is emotional. We designed Okapi to let you search at your own pace, without pressure.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Home,
    title: "Small, home-like settings",
    description: "Adult Family Homes have 6 or fewer residents. More personal attention, more like home.",
    color: "text-[#4C1D95]",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Licensed & verified",
    description: "Every home is licensed by Washington DSHS. We verify listings and show compliance data.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Clock,
    title: "No referral fees",
    description: "We charge homes a simple monthly fee. No pressure to 'close the deal.'",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function WhyTrustUs() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Why families trust Okapi
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We built this for families like yours — because we've been there too
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {reasons.map((reason, index) => (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 ${reason.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <reason.icon className={`w-8 h-8 ${reason.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
