/**
 * Find Care Wizard for AFH
 * Simplified wizard focused on Adult Family Homes only
 * No care type selection needed - always AFH
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  MapPin,
  Users,
  Heart,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BRAND,
  WA_CITIES,
  AFH_SPECIALIZATIONS,
  PAYMENT_TYPES,
  ADL_LEVELS,
} from "@/lib/constants";

type WizardStep = "location" | "needs" | "care-level" | "payment" | "results";

interface WizardData {
  city: string;
  zipCode: string;
  specializations: string[];
  adlLevel: string;
  paymentTypes: string[];
}

export function FindCareWizardAFH() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>("location");
  const [data, setData] = useState<WizardData>({
    city: "",
    zipCode: "",
    specializations: [],
    adlLevel: "",
    paymentTypes: [],
  });

  const steps: { id: WizardStep; label: string; icon: typeof MapPin }[] = [
    { id: "location", label: "Location", icon: MapPin },
    { id: "needs", label: "Care Needs", icon: Heart },
    { id: "care-level", label: "Care Level", icon: Users },
    { id: "payment", label: "Payment", icon: DollarSign },
    { id: "results", label: "Results", icon: Search },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "location":
        return data.city || data.zipCode;
      case "needs":
        return true; // Optional
      case "care-level":
        return true; // Optional
      case "payment":
        return true; // Optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSearch = () => {
    // Build search query params
    const params = new URLSearchParams();
    if (data.city) params.set("city", data.city);
    if (data.zipCode) params.set("zip", data.zipCode);
    if (data.specializations.length) params.set("specializations", data.specializations.join(","));
    if (data.adlLevel) params.set("adl", data.adlLevel);
    if (data.paymentTypes.length) params.set("payment", data.paymentTypes.join(","));

    setLocation(`/find-care?${params.toString()}`);
  };

  const toggleSpecialization = (id: string) => {
    setData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(id)
        ? prev.specializations.filter((s) => s !== id)
        : [...prev.specializations, id],
    }));
  };

  const togglePayment = (id: string) => {
    setData((prev) => ({
      ...prev,
      paymentTypes: prev.paymentTypes.includes(id)
        ? prev.paymentTypes.filter((p) => p !== id)
        : [...prev.paymentTypes, id],
    }));
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Find the Right AFH
          </h2>
          <p className="text-gray-600">
            Answer a few questions to find Adult Family Homes that match your needs
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    isActive && "text-teal-600",
                    isPast && "text-green-600",
                    !isActive && !isPast && "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isActive && "bg-teal-100",
                      isPast && "bg-green-100",
                      !isActive && !isPast && "bg-gray-100"
                    )}
                  >
                    {isPast ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-2 border-gray-100">
          <CardContent className="p-8">
            {/* Location Step */}
            {currentStep === "location" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Where are you looking?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We'll search for AFHs in {BRAND.state} near this location
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter city name..."
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value })}
                      list="wa-cities-wizard"
                      className="text-lg"
                    />
                    <datalist id="wa-cities-wizard">
                      {WA_CITIES.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter zip code..."
                      value={data.zipCode}
                      onChange={(e) => setData({ ...data, zipCode: e.target.value })}
                      maxLength={5}
                      className="text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Needs Step */}
            {currentStep === "needs" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">What care does your loved one need?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Select all that apply (optional)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {AFH_SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec.id}
                      onClick={() => toggleSpecialization(spec.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-colors",
                        data.specializations.includes(spec.id)
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="font-medium text-sm">{spec.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{spec.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Care Level Step */}
            {currentStep === "care-level" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    How much help is needed with daily activities?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    This helps us match with homes that provide the right level of care
                  </p>
                </div>

                <div className="space-y-3">
                  {ADL_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setData({ ...data, adlLevel: level.id })}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-colors flex items-center gap-4",
                        data.adlLevel === level.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          data.adlLevel === level.id
                            ? "border-teal-500 bg-teal-500"
                            : "border-gray-300"
                        )}
                      >
                        {data.adlLevel === level.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{level.label}</span>
                        <p className="text-sm text-gray-500">{level.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">How will care be paid for?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Select all that may apply (optional)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_TYPES.map((payment) => (
                    <button
                      key={payment.id}
                      onClick={() => togglePayment(payment.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-colors",
                        data.paymentTypes.includes(payment.id)
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="font-medium text-sm">{payment.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Step */}
            {currentStep === "results" && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-teal-600" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Find Your Matches</h3>
                  <p className="text-gray-600">
                    We'll search for Adult Family Homes in {BRAND.state} that match your criteria
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Location:</span>{" "}
                    {data.city || data.zipCode || "All " + BRAND.state}
                  </p>
                  {data.specializations.length > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Care Needs:</span>{" "}
                      {data.specializations
                        .map((id) => AFH_SPECIALIZATIONS.find((s) => s.id === id)?.label)
                        .join(", ")}
                    </p>
                  )}
                  {data.adlLevel && (
                    <p className="text-sm">
                      <span className="font-medium">Care Level:</span>{" "}
                      {ADL_LEVELS.find((l) => l.id === data.adlLevel)?.label}
                    </p>
                  )}
                  {data.paymentTypes.length > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Payment:</span>{" "}
                      {data.paymentTypes
                        .map((id) => PAYMENT_TYPES.find((p) => p.id === id)?.label)
                        .join(", ")}
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleSearch}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Find Matching Homes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep !== "results" && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {currentStepIndex === steps.length - 2 ? "Review" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation("/find-care")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip wizard and browse all homes
          </button>
        </div>
      </div>
    </section>
  );
}
