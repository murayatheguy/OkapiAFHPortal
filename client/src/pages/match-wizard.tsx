/**
 * Care Matching Wizard - Redesigned
 * Emotional, glassmorphism design
 * Questions match owner dashboard capabilities for proper matching
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Heart, CheckCircle2, MapPin,
  Brain, Stethoscope, HandHeart, DollarSign, Home,
  Calendar, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { WA_CITIES } from "@/lib/constants";

interface MatchData {
  location: string;
  distance: string;
  specializations: string[];
  medicalNeeds: string[];
  careLevel: string;
  paymentTypes: string[];
  amenities: string[];
  timeline: string;
}

// Match these to owner dashboard options exactly (from schema.ts)
const SPECIALIZATIONS = [
  { id: "dementia", label: "Dementia Care", desc: "Memory support & safety", icon: "🧠" },
  { id: "alzheimers", label: "Alzheimer's Disease", desc: "Specialized Alzheimer's care", icon: "💜" },
  { id: "mentalHealth", label: "Mental Health", desc: "Depression, anxiety, bipolar", icon: "💚" },
  { id: "developmentalDisabilities", label: "Developmental Disabilities", desc: "DD/ID support", icon: "🤝" },
  { id: "parkinsons", label: "Parkinson's Disease", desc: "Movement disorder care", icon: "🧬" },
  { id: "diabetes", label: "Diabetes Management", desc: "Blood sugar monitoring", icon: "💉" },
  { id: "hospicePalliative", label: "Hospice & Palliative", desc: "End of life care", icon: "🕊️" },
  { id: "bariatric", label: "Bariatric Care", desc: "Specialized equipment", icon: "🏋️" },
];

const MEDICAL_NEEDS = [
  { id: "medicationManagement", label: "Medication Management", desc: "Daily medication help" },
  { id: "medicationAdministration", label: "Medication Administration", desc: "Staff gives medications" },
  { id: "injections", label: "Injections", desc: "Insulin, B12, etc." },
  { id: "woundCare", label: "Wound Care", desc: "Dressing changes" },
  { id: "catheterCare", label: "Catheter Care", desc: "Foley catheter management" },
  { id: "oxygenTherapy", label: "Oxygen Therapy", desc: "Supplemental oxygen" },
  { id: "cpapBipap", label: "CPAP/BiPAP", desc: "Sleep apnea equipment" },
  { id: "physicalTherapy", label: "Physical Therapy", desc: "PT services" },
];

const CARE_LEVELS = [
  { id: "independent", label: "Mostly Independent", desc: "Light supervision, companionship", icon: "🚶" },
  { id: "minimal", label: "Minimal Assistance", desc: "Help with some daily tasks", icon: "🤝" },
  { id: "moderate", label: "Moderate Assistance", desc: "Help with bathing, dressing, meals", icon: "💪" },
  { id: "extensive", label: "Extensive Care", desc: "Help with most daily activities", icon: "🏥" },
  { id: "total", label: "Total Care", desc: "24/7 hands-on assistance", icon: "❤️" },
];

const PAYMENT_TYPES = [
  { id: "privatePay", label: "Private Pay", desc: "Out of pocket" },
  { id: "medicaidCOPES", label: "Medicaid COPES", desc: "Washington State program" },
  { id: "medicaidWaiver", label: "Medicaid Waiver", desc: "Alternative care" },
  { id: "longTermCareInsurance", label: "Long-Term Care Insurance", desc: "LTC policy" },
  { id: "vaAidAttendance", label: "VA Aid & Attendance", desc: "Veterans benefits" },
  { id: "unsure", label: "Not Sure Yet", desc: "Need guidance" },
];

const AMENITIES = [
  { id: "privateRooms", label: "Private Room", icon: "🚪" },
  { id: "privateBathroom", label: "Private Bathroom", icon: "🚿" },
  { id: "outdoorSpace", label: "Outdoor Space", icon: "🌳" },
  { id: "petFriendly", label: "Pet Friendly", icon: "🐕" },
  { id: "wheelchairAccessible", label: "Wheelchair Accessible", icon: "♿" },
  { id: "hospitalBeds", label: "Hospital Bed Available", icon: "🛏️" },
];

const TIMELINE = [
  { id: "urgent", label: "As soon as possible", desc: "Within days", icon: "🚨" },
  { id: "soon", label: "Within 2-4 weeks", desc: "Soon but not urgent", icon: "📅" },
  { id: "planning", label: "1-3 months", desc: "Planning ahead", icon: "📋" },
  { id: "exploring", label: "Just exploring", desc: "No timeline yet", icon: "🔍" },
];

const STEPS = [
  {
    id: "intro",
    title: "Let's find the right home together",
    subtitle: "We'll ask a few questions to match you with homes that truly fit"
  },
  {
    id: "location",
    title: "Where are you looking for care?",
    subtitle: "We'll show you Adult Family Homes in this area"
  },
  {
    id: "specializations",
    title: "Does your loved one need specialized care?",
    subtitle: "Select any conditions or situations that apply"
  },
  {
    id: "medical",
    title: "What medical support do they need?",
    subtitle: "Select any medical services they require"
  },
  {
    id: "care-level",
    title: "How much daily help do they need?",
    subtitle: "This helps us find homes with the right level of care"
  },
  {
    id: "payment",
    title: "How will care be paid for?",
    subtitle: "We'll show homes that accept your payment method"
  },
  {
    id: "amenities",
    title: "Any must-have amenities?",
    subtitle: "Select what's important for their comfort"
  },
  {
    id: "timeline",
    title: "When do you need to find a home?",
    subtitle: "This helps us prioritize homes with availability"
  },
];

export default function MatchWizardPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<MatchData>({
    location: "",
    distance: "25",
    specializations: [],
    medicalNeeds: [],
    careLevel: "",
    paymentTypes: [],
    amenities: [],
    timeline: "",
  });

  const progress = (currentStep / (STEPS.length - 1)) * 100;

  const toggleArrayItem = (field: keyof MatchData, item: string) => {
    const current = data[field] as string[];
    if (current.includes(item)) {
      setData({ ...data, [field]: current.filter(i => i !== item) });
    } else {
      setData({ ...data, [field]: [...current, item] });
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case "intro": return true;
      case "location": return data.location.length > 0;
      case "specializations": return true; // Optional
      case "medical": return true; // Optional
      case "care-level": return data.careLevel.length > 0;
      case "payment": return data.paymentTypes.length > 0;
      case "amenities": return true; // Optional
      case "timeline": return data.timeline.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (data.location) params.set("city", data.location);
    if (data.specializations.length) params.set("specializations", data.specializations.join(","));
    if (data.medicalNeeds.length) params.set("medical", data.medicalNeeds.join(","));
    if (data.careLevel) params.set("careLevel", data.careLevel);
    if (data.paymentTypes.length) params.set("payment", data.paymentTypes.join(","));
    if (data.amenities.length) params.set("amenities", data.amenities.join(","));
    params.set("matched", "true");

    setLocation(`/directory?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background blobs for glassmorphism */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-gray-500 hidden sm:block">
            Finding the right home
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* Progress */}
        {currentStep > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Step {currentStep} of {STEPS.length - 1}</span>
              <span className="text-teal-600 font-medium">{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Glass Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl p-8 mb-6">

          {/* STEP: Intro */}
          {STEPS[currentStep].id === "intro" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {STEPS[currentStep].title}
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {STEPS[currentStep].subtitle}
              </p>

              {/* Emotional hook */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-100">
                <p className="text-gray-700 italic">
                  "Finding care for someone you love is one of the hardest things you'll do.
                  We're here to make it a little easier."
                </p>
              </div>

              {/* What to expect */}
              <div className="grid grid-cols-3 gap-4 text-center mb-8">
                <div className="p-4">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm text-gray-600">7 quick questions</p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">⏱️</div>
                  <p className="text-sm text-gray-600">About 3 minutes</p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600">Personalized matches</p>
                </div>
              </div>

              <Button
                onClick={handleNext}
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 h-14 px-8 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Let's Get Started
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                Your information stays private. We never share it.
              </p>
            </div>
          )}

          {/* STEP: Location */}
          {STEPS[currentStep].id === "location" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Enter city or zip code"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    list="cities"
                    className="pl-12 h-14 text-lg bg-white/50 border-gray-200"
                  />
                  <datalist id="cities">
                    {WA_CITIES.map(city => <option key={city} value={city} />)}
                  </datalist>
                </div>

                <p className="text-center text-sm text-gray-500 mb-6">
                  We serve Adult Family Homes throughout Washington State
                </p>

                {/* Distance options */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "10", label: "Within 10 miles" },
                    { value: "25", label: "Within 25 miles" },
                    { value: "50", label: "Within 50 miles" },
                    { value: "any", label: "Anywhere in WA" },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, distance: option.value })}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-sm",
                        data.distance === option.value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 hover:border-gray-300 bg-white/50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: Specializations */}
          {STEPS[currentStep].id === "specializations" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => toggleArrayItem("specializations", spec.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      data.specializations.includes(spec.id)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{spec.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{spec.label}</p>
                        <p className="text-xs text-gray-500 truncate">{spec.desc}</p>
                      </div>
                      {data.specializations.includes(spec.id) && (
                        <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                None of these apply — skip this step →
              </button>
            </div>
          )}

          {/* STEP: Medical Needs */}
          {STEPS[currentStep].id === "medical" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MEDICAL_NEEDS.map(need => (
                  <button
                    key={need.id}
                    onClick={() => toggleArrayItem("medicalNeeds", need.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      data.medicalNeeds.includes(need.id)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{need.label}</p>
                        <p className="text-xs text-gray-500">{need.desc}</p>
                      </div>
                      {data.medicalNeeds.includes(need.id) && (
                        <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                No special medical needs — skip →
              </button>
            </div>
          )}

          {/* STEP: Care Level */}
          {STEPS[currentStep].id === "care-level" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="h-8 w-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="space-y-3">
                {CARE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setData({ ...data, careLevel: level.id })}
                    className={cn(
                      "w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      data.careLevel === level.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <span className="text-3xl">{level.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{level.label}</p>
                      <p className="text-sm text-gray-500">{level.desc}</p>
                    </div>
                    {data.careLevel === level.id && (
                      <CheckCircle2 className="h-6 w-6 text-teal-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Payment */}
          {STEPS[currentStep].id === "payment" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_TYPES.map(payment => (
                  <button
                    key={payment.id}
                    onClick={() => toggleArrayItem("paymentTypes", payment.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      data.paymentTypes.includes(payment.id)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{payment.label}</p>
                        <p className="text-xs text-gray-500">{payment.desc}</p>
                      </div>
                      {data.paymentTypes.includes(payment.id) && (
                        <CheckCircle2 className="h-5 w-5 text-teal-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Amenities */}
          {STEPS[currentStep].id === "amenities" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map(amenity => (
                  <button
                    key={amenity.id}
                    onClick={() => toggleArrayItem("amenities", amenity.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      data.amenities.includes(amenity.id)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <span className="text-3xl block mb-2">{amenity.icon}</span>
                    <p className="font-medium text-gray-900 text-sm">{amenity.label}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                No specific preferences — skip →
              </button>
            </div>
          )}

          {/* STEP: Timeline */}
          {STEPS[currentStep].id === "timeline" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-gray-600">{STEPS[currentStep].subtitle}</p>
              </div>

              <div className="space-y-3">
                {TIMELINE.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, timeline: option.id })}
                    className={cn(
                      "w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      data.timeline === option.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300 bg-white/50"
                    )}
                  >
                    <span className="text-3xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                    {data.timeline === option.id && (
                      <CheckCircle2 className="h-6 w-6 text-teal-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 bg-white/50 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-12 px-8 bg-teal-600 hover:bg-teal-700"
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Show My Matches
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Privacy note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Your information stays with us. We don't share it with anyone.
        </p>
      </div>
    </div>
  );
}
