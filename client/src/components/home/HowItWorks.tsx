/**
 * HowItWorks - 3-step process section
 */

import { Search, ListChecks, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const steps = [
  {
    icon: Search,
    number: "1",
    title: "Search",
    description: "Tell us what care is needed and where. Filter by services, budget, and location.",
    color: "bg-[#4C1D95]",
  },
  {
    icon: ListChecks,
    number: "2",
    title: "Compare",
    description: "View photos, services, reviews, and availability. See which homes fit best.",
    color: "bg-emerald-600",
  },
  {
    icon: Phone,
    number: "3",
    title: "Connect",
    description: "Call or message homes directly. Schedule tours when you're ready.",
    color: "bg-[#4C1D95]",
  },
];

export function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            How families find care with Okapi
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No pressure. No spam. Search at your own pace.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gray-200" />
              )}

              <div className="bg-white rounded-2xl p-8 shadow-sm relative z-10 h-full border border-gray-100">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-[#4C1D95] mb-2">
                  Step {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-[#4C1D95] hover:bg-[#5B21B6] text-lg px-8 h-12"
            onClick={() => setLocation("/directory")}
          >
            Start Your Search
          </Button>
        </div>
      </div>
    </section>
  );
}
