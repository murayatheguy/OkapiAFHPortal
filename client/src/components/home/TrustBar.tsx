/**
 * TrustBar - Statistics and trust indicators
 */

import { Home, Shield, Phone, Star } from "lucide-react";

const stats = [
  {
    icon: Home,
    value: "150+",
    label: "Licensed Homes",
    color: "text-[#4C1D95]",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    value: "100%",
    label: "DSHS Verified",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Phone,
    value: "Direct",
    label: "Contact Homes",
    color: "text-[#4C1D95]",
    bg: "bg-purple-50",
  },
  {
    icon: Star,
    value: "4.8",
    label: "Avg Rating",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

export function TrustBar() {
  return (
    <section className="py-8 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
