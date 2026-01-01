/**
 * Warm Premium TrustBar - Statistics and trust indicators
 * Larger text and icons for 50-65yo demographic
 */

import { Home, Shield, Clock, Heart } from "lucide-react";

const stats = [
  {
    icon: Home,
    value: "500+",
    label: "Licensed Homes",
    sublabel: "Across Washington",
  },
  {
    icon: Shield,
    value: "100%",
    label: "State Verified",
    sublabel: "DSHS Inspected",
  },
  {
    icon: Clock,
    value: "Daily",
    label: "Updates",
    sublabel: "Current Info",
  },
  {
    icon: Heart,
    value: "Free",
    label: "Matching",
    sublabel: "No Fees Ever",
  },
];

export function TrustBar() {
  return (
    <section className="py-10 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-ivory/50 hover:bg-ivory transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-plum-50 flex items-center justify-center shrink-0">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-base font-medium text-foreground/80">{stat.label}</div>
                <div className="text-sm text-foreground/50">{stat.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
