/**
 * ResourcesSection - Helpful guides for families
 */

import { useLocation } from "wouter";
import { BookOpen, DollarSign, ClipboardCheck, ChevronRight } from "lucide-react";

const resources = [
  {
    icon: BookOpen,
    title: "What is an Adult Family Home?",
    description: "Learn about Washington's unique care option — small, licensed homes with personalized attention.",
    href: "/resources/what-is-afh",
    color: "text-[#4C1D95]",
    bg: "bg-purple-50",
  },
  {
    icon: DollarSign,
    title: "Understanding AFH Costs",
    description: "Private pay, Medicaid, and long-term care insurance — what to expect and how to plan.",
    href: "/resources/cost-guide",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: ClipboardCheck,
    title: "Tour Checklist",
    description: "Questions to ask and things to look for when visiting Adult Family Homes.",
    href: "/resources/tour-checklist",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function ResourcesSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Resources for families
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Helpful guides to navigate your care search
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {resources.map((resource, index) => (
            <button
              key={index}
              onClick={() => setLocation(resource.href)}
              className="text-left bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow group h-full"
            >
              <div className={`w-14 h-14 ${resource.bg} rounded-xl flex items-center justify-center mb-4`}>
                <resource.icon className={`w-7 h-7 ${resource.color}`} />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#4C1D95]">
                {resource.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4">
                {resource.description}
              </p>

              <span className="inline-flex items-center gap-1 text-[#4C1D95] font-medium text-sm">
                Read more <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
