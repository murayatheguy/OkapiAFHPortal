/**
 * Care Matching Wizard - Premium Design
 * Flash intro with 4 messages, then 7-step questionnaire
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Heart, CheckCircle2, MapPin,
  Clock, Shield, Sparkles, Loader2, Phone, Mail, User,
  Home, Brain, Stethoscope, HandHeart, Calendar, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";

// Washington State Cities for autocomplete
const WA_CITIES = [
  "Seattle", "Tacoma", "Bellevue", "Spokane", "Vancouver", "Kent", "Everett",
  "Renton", "Federal Way", "Spokane Valley", "Kirkland", "Bellingham", "Auburn",
  "Pasco", "Marysville", "Lakewood", "Redmond", "Shoreline", "Richland", "Burien",
  "Olympia", "Lacey", "Sammamish", "Kennewick", "Edmonds", "Bothell", "Puyallup",
  "Bremerton", "Lynnwood", "Issaquah", "Longview", "Mount Vernon", "Wenatchee",
  "University Place", "Walla Walla", "Pullman", "Des Moines", "Lake Stevens",
  "SeaTac", "Oak Harbor", "Tumwater", "Mercer Island", "Maple Valley", "Covington",
  "Kenmore", "Woodinville", "Tukwila", "Moses Lake", "Anacortes", "Ellensburg"
].sort();

// Common zip codes for autocomplete
const WA_ZIPS = [
  "98101", "98102", "98103", "98104", "98105", "98106", "98107", "98108", "98109",
  "98112", "98115", "98116", "98117", "98118", "98119", "98121", "98122", "98125",
  "98126", "98133", "98144", "98146", "98177", "98178", "98199", "98402", "98403",
  "98404", "98405", "98406", "98407", "98408", "98409", "98418", "98421", "98422"
];

// Flash intro messages
const INTRO_MESSAGES = [
  {
    icon: "🔒",
    title: "Your Privacy Matters",
    text: "Everything you share stays confidential and secure with us."
  },
  {
    icon: "🎯",
    title: "Smarter Matching",
    text: "Your answers power our algorithm to find homes that truly fit."
  },
  {
    icon: "✨",
    title: "Keep It Simple",
    text: "No need for sensitive details—just tell us what matters most."
  },
  {
    icon: "🧠",
    title: "The Okapi Difference",
    text: "We match based on care level, credentials, staff experience & facility type."
  }
];

// Care level options with expanded descriptions
const CARE_LEVELS = [
  {
    id: "independent",
    icon: "🏠",
    label: "Independent Living",
    description: "Minimal daily assistance. Social activities, meals, and light housekeeping. For those who are mostly self-sufficient."
  },
  {
    id: "assisted",
    icon: "🤝",
    label: "Personal Care / Assisted Living",
    description: "Help with daily activities like bathing, dressing, grooming, and medication reminders. 24/7 staff available."
  },
  {
    id: "afh",
    icon: "🏡",
    label: "Adult Family Home (AFH)",
    description: "Small residential setting (2-6 residents) with personalized care in a home environment. Licensed caregivers on-site."
  },
  {
    id: "memory",
    icon: "🧠",
    label: "Specialized Memory Care",
    description: "Secure environment for dementia, Alzheimer's, or cognitive decline. Specialized staff trained in memory care techniques."
  },
  {
    id: "skilled",
    icon: "⚕️",
    label: "Skilled Nursing Facility",
    description: "24/7 medical care by licensed nurses. For complex medical needs, post-surgery recovery, or rehabilitation."
  },
  {
    id: "unsure",
    icon: "❓",
    label: "Not Sure Yet",
    description: "That's okay! We'll help determine the right level based on your other answers."
  }
];

// Specific care needs - categorized
const CARE_NEEDS = {
  physical: {
    label: "Physical Needs",
    options: [
      "Mobility assistance (wheelchair, walker, transfer help)",
      "Fall risk / fall prevention",
      "Incontinence care",
      "Feeding assistance",
      "Physical therapy needs"
    ]
  },
  medical: {
    label: "Medical Needs",
    options: [
      "Medication management",
      "Diabetes care (insulin, monitoring)",
      "Wound care",
      "Oxygen therapy",
      "Dialysis coordination",
      "Parkinson's care",
      "Stroke recovery"
    ]
  },
  cognitive: {
    label: "Cognitive / Behavioral",
    options: [
      "Memory care / dementia support",
      "Mental health support",
      "Behavioral support",
      "Wandering prevention",
      "Sundowning management"
    ]
  },
  endOfLife: {
    label: "End of Life",
    options: [
      "Hospice / palliative care",
      "Respite care (temporary)"
    ]
  }
};

// Preferences - categorized
const PREFERENCES = {
  payment: {
    label: "Payment Options",
    options: [
      "Accepts Medicaid",
      "Accepts Medicare",
      "Accepts Private Pay",
      "Accepts VA Benefits",
      "Accepts Long-Term Care Insurance"
    ]
  },
  room: {
    label: "Room Preferences",
    options: [
      "Private room required",
      "Shared room okay",
      "Private bathroom preferred"
    ]
  },
  lifestyle: {
    label: "Lifestyle",
    options: [
      "Pet-friendly (can bring pet)",
      "Pets on-site okay",
      "Smoking allowed",
      "Cultural/language preferences",
      "Religious services available"
    ]
  },
  location: {
    label: "Location",
    options: [
      "Near public transit",
      "Outdoor space / garden",
      "Ground floor / elevator access"
    ]
  }
};

interface MatchAnswers {
  relationship: string;
  location: string;
  careLevel: string;
  specificNeeds: string[];
  preferences: string[];
  timeline: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  textUpdates: boolean;
}

export default function MatchWizard() {
  const [, setLocation] = useLocation();

  // Intro state
  const [showIntro, setShowIntro] = useState(true);
  const [introIndex, setIntroIndex] = useState(0);
  const [introFading, setIntroFading] = useState(false);

  // Wizard state
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  // Location autocomplete
  const [locationInput, setLocationInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Answers
  const [answers, setAnswers] = useState<MatchAnswers>({
    relationship: "",
    location: "",
    careLevel: "",
    specificNeeds: [],
    preferences: [],
    timeline: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    textUpdates: false
  });

  // Filtered suggestions for location autocomplete
  const locationSuggestions = useMemo(() => {
    if (!locationInput || locationInput.length < 2) return [];
    const input = locationInput.toLowerCase();

    // Check if it's a zip code (numeric)
    if (/^\d+$/.test(locationInput)) {
      return WA_ZIPS.filter(zip => zip.startsWith(locationInput)).slice(0, 5);
    }

    // Otherwise search cities
    return WA_CITIES.filter(city =>
      city.toLowerCase().startsWith(input)
    ).slice(0, 5);
  }, [locationInput]);

  // Auto-advance intro messages
  useEffect(() => {
    if (!showIntro) return;

    const timer = setTimeout(() => {
      if (introIndex < INTRO_MESSAGES.length - 1) {
        setIntroFading(true);
        setTimeout(() => {
          setIntroIndex(introIndex + 1);
          setIntroFading(false);
        }, 300);
      } else {
        // Fade out intro after last message
        setIntroFading(true);
        setTimeout(() => {
          setShowIntro(false);
        }, 500);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [introIndex, showIntro]);

  const skipIntro = () => {
    setIntroFading(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 300);
  };

  const handleNext = () => {
    if (step === 7) {
      // Submit and show results
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate match count (mock)
    const count = Math.floor(Math.random() * 15) + 8;
    setMatchCount(count);
    setIsSubmitting(false);
    setShowResults(true);
  };

  const handleSkipToResults = () => {
    handleSubmit();
  };

  const viewMatches = () => {
    // Build query params from answers
    const params = new URLSearchParams();
    if (answers.location) params.set("city", answers.location);
    if (answers.careLevel) params.set("careLevel", answers.careLevel);
    if (answers.preferences.includes("Accepts Medicaid")) params.set("medicaid", "true");

    setLocation(`/directory?${params.toString()}`);
  };

  const toggleArrayValue = (arr: string[], value: string) => {
    if (arr.includes(value)) {
      return arr.filter(v => v !== value);
    }
    return [...arr, value];
  };

  const handleNoneOfAbove = (field: 'specificNeeds' | 'preferences') => {
    setAnswers({ ...answers, [field]: [] });
  };

  // All steps are now optional except welcome and timeline
  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return true; // Relationship optional
      case 2: return true; // Location optional
      case 3: return true; // Care level optional
      case 4: return true; // Specific needs optional
      case 5: return true; // Preferences optional
      case 6: return true; // Timeline optional
      case 7: return true; // Contact info optional
      default: return false;
    }
  };

  // Select location from suggestions
  const selectLocation = (loc: string) => {
    setLocationInput(loc);
    setAnswers({ ...answers, location: loc });
    setShowSuggestions(false);
  };

  // =============== FLASH INTRO ===============
  if (showIntro) {
    const message = INTRO_MESSAGES[introIndex];

    return (
      <div className="min-h-screen w-full flex flex-col">
        {/* Header - solid light background */}
        <div className="bg-white border-b border-gray-100">
          <Header />
        </div>

        {/* Flash intro content area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-teal-400/5 blur-3xl pointer-events-none" />

          {/* Skip button - prominent for impatient users */}
          <button
            onClick={skipIntro}
            className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white font-medium text-sm flex items-center gap-2 transition-all z-20 backdrop-blur-sm"
          >
            Skip Intro <ArrowRight className="w-4 h-4" />
          </button>

          {/* Centered content */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div
              className={cn(
                "text-center transition-all duration-300",
                introFading ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
              )}
            >
              <div className="text-6xl mb-6">{message.icon}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {message.title}
              </h1>
              <p className="text-lg text-white/70 max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {message.text}
              </p>
            </div>
          </div>

          {/* Progress dots - fixed at bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
            {INTRO_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === introIndex ? "bg-teal-400 w-6" : "bg-white/30 w-2"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =============== RESULTS SCREEN ===============
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            We found {matchCount} homes that match your needs!
          </h1>
          <p className="text-slate-500 mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Based on your preferences, we've identified care homes{answers.location ? ` near ${answers.location}` : ""} that could be a great fit.
          </p>
          <Button
            onClick={viewMatches}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            View My Matches
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        </div>
      </div>
    );
  }

  // =============== LOADING SCREEN ===============
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-slate-800 mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Finding your matches...
            </h2>
            <p className="text-slate-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Our algorithm is searching for the perfect homes for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Card component for selectable options with animations
  const SelectableCard = ({
    selected,
    onClick,
    children,
    className = ""
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        selected
          ? "border-l-4 border-l-teal-500 border-t-teal-200 border-r-teal-200 border-b-teal-200 bg-teal-50/50"
          : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm",
        className
      )}
    >
      {children}
    </button>
  );

  // =============== MAIN WIZARD ===============
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30">
      {/* Site Header */}
      <Header />

      {/* Progress bar */}
      {step > 0 && (
        <div className="sticky top-[72px] bg-white/80 backdrop-blur-sm border-b border-slate-200/50 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Step {step} of 7</span>
              <span className="text-sm text-teal-600 font-medium">{Math.round((step / 7) * 100)}% complete</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-in fade-in duration-500">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Secure & Confidential
            </div>

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Let's Find Your Perfect Match
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              A few quick questions help our algorithm match you with homes that truly fit your needs.
            </p>

            {/* Info boxes */}
            <div className="flex justify-center gap-4 mb-10">
              <div className="px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-teal-600">7</div>
                <div className="text-xs text-slate-500">Questions</div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-teal-600">~3</div>
                <div className="text-xs text-slate-500">Minutes</div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-teal-600">
                  <Sparkles className="w-6 h-6 inline" />
                </div>
                <div className="text-xs text-slate-500">Smart Matches</div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Begin Matching
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-1">
              <Shield className="w-4 h-4" />
              Your information stays private. We never share your data.
            </p>

            <p className="mt-8 text-xs text-slate-400">
              Powered by Okapi's proprietary matching algorithm
            </p>
          </div>
        )}

        {/* Step 1: Relationship */}
        {step === 1 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Who are you looking for care for?
            </h2>
            <p className="text-slate-500 text-center mb-8">Select all that apply (optional)</p>

            <div className="grid gap-3">
              {["Myself", "My Parent", "My Spouse/Partner", "Another Family Member", "A Client (I'm a professional)"].map((option) => (
                <SelectableCard
                  key={option}
                  selected={answers.relationship === option}
                  onClick={() => setAnswers({ ...answers, relationship: option })}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{option}</span>
                    {answers.relationship === option && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              What area are you searching in?
            </h2>
            <p className="text-slate-500 text-center mb-8">Enter a city or zip code (optional)</p>

            <div className="max-w-md mx-auto relative">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Enter city or zip code"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setAnswers({ ...answers, location: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-12 py-6 text-lg rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-0"
                />
              </div>

              {/* Autocomplete suggestions */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-10">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={() => selectLocation(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular cities */}
              <div className="mt-6">
                <p className="text-sm text-slate-500 mb-3">Popular areas:</p>
                <div className="flex flex-wrap gap-2">
                  {["Seattle", "Tacoma", "Bellevue", "Spokane", "Everett", "Olympia"].map((city) => (
                    <button
                      key={city}
                      onClick={() => selectLocation(city)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm transition-all",
                        answers.location === city
                          ? "bg-teal-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Care Level */}
        {step === 3 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              What level of care is needed?
            </h2>
            <p className="text-slate-500 text-center mb-8">Select all that apply (optional)</p>

            <div className="grid gap-3">
              {CARE_LEVELS.map((option) => (
                <SelectableCard
                  key={option.id}
                  selected={answers.careLevel === option.id}
                  onClick={() => setAnswers({ ...answers, careLevel: option.id })}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{option.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 mb-1">{option.label}</div>
                      <div className="text-sm text-slate-500 leading-relaxed">{option.description}</div>
                    </div>
                    {answers.careLevel === option.id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Specific Needs */}
        {step === 4 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Any specific care needs?
            </h2>
            <p className="text-slate-500 text-center mb-8">Select all that apply (optional)</p>

            <div className="space-y-6">
              {Object.entries(CARE_NEEDS).map(([key, category]) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                    {category.label}
                  </h3>
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <SelectableCard
                        key={option}
                        selected={answers.specificNeeds.includes(option)}
                        onClick={() => {
                          const newNeeds = toggleArrayValue(answers.specificNeeds, option);
                          setAnswers({ ...answers, specificNeeds: newNeeds });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">{option}</span>
                          {answers.specificNeeds.includes(option) && (
                            <Check className="w-5 h-5 text-teal-500" />
                          )}
                        </div>
                      </SelectableCard>
                    ))}
                  </div>
                </div>
              ))}

              {/* None of the above */}
              <button
                onClick={() => handleNoneOfAbove('specificNeeds')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  answers.specificNeeds.length === 0
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">None of the above / Skip this step</span>
                  {answers.specificNeeds.length === 0 && (
                    <Check className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Preferences */}
        {step === 5 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              What matters most to you?
            </h2>
            <p className="text-slate-500 text-center mb-8">Select all that apply (optional)</p>

            <div className="space-y-6">
              {Object.entries(PREFERENCES).map(([key, category]) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                    {category.label}
                  </h3>
                  <div className="grid gap-2">
                    {category.options.map((option) => (
                      <SelectableCard
                        key={option}
                        selected={answers.preferences.includes(option)}
                        onClick={() => {
                          const newPrefs = toggleArrayValue(answers.preferences, option);
                          setAnswers({ ...answers, preferences: newPrefs });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700">{option}</span>
                          {answers.preferences.includes(option) && (
                            <Check className="w-5 h-5 text-teal-500" />
                          )}
                        </div>
                      </SelectableCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Timeline */}
        {step === 6 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              When do you need placement?
            </h2>
            <p className="text-slate-500 text-center mb-8">Select all that apply (optional)</p>

            <div className="grid gap-3">
              {[
                { id: "immediate", label: "Immediately (within days)", icon: "🚨" },
                { id: "1-3months", label: "Within 1-3 months", icon: "📅" },
                { id: "3-6months", label: "Within 3-6 months", icon: "🗓️" },
                { id: "researching", label: "Just researching for now", icon: "🔍" },
              ].map((option) => (
                <SelectableCard
                  key={option.id}
                  selected={answers.timeline === option.id}
                  onClick={() => setAnswers({ ...answers, timeline: option.id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-slate-700">{option.label}</span>
                    </div>
                    {answers.timeline === option.id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Contact Info */}
        {step === 7 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              How can we reach you?
            </h2>
            <p className="text-slate-500 text-center mb-2">
              Want us to send your matches? Leave your info below, or skip to see results now.
            </p>
            <p className="text-sm text-teal-600 text-center mb-8">All fields are optional</p>

            <div className="max-w-md mx-auto space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 mb-2 block text-sm font-medium">First Name</Label>
                  <Input
                    placeholder="First name"
                    value={answers.firstName}
                    onChange={(e) => setAnswers({ ...answers, firstName: e.target.value })}
                    className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-0"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 mb-2 block text-sm font-medium">Last Name</Label>
                  <Input
                    placeholder="Last name"
                    value={answers.lastName}
                    onChange={(e) => setAnswers({ ...answers, lastName: e.target.value })}
                    className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-slate-700 mb-2 block text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={answers.email}
                  onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                  className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-0"
                />
              </div>

              {/* Phone */}
              <div>
                <Label className="text-slate-700 mb-2 block text-sm font-medium">Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={answers.phone}
                  onChange={(e) => setAnswers({ ...answers, phone: e.target.value })}
                  className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-0"
                />
              </div>

              {/* Text updates checkbox - only show if phone entered */}
              {answers.phone && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Checkbox
                    id="textUpdates"
                    checked={answers.textUpdates}
                    onCheckedChange={(checked) => setAnswers({ ...answers, textUpdates: checked as boolean })}
                  />
                  <Label htmlFor="textUpdates" className="text-slate-600 cursor-pointer text-sm">
                    Text me updates about my matches
                  </Label>
                </div>
              )}

              {/* Privacy note */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <span>Your information is never shared. We only use it to send your personalized matches.</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkipToResults}
                  className="flex-1 py-6 rounded-xl border-2 border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Skip & View Results
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!answers.email}
                  className={cn(
                    "flex-1 py-6 rounded-xl transition-all",
                    answers.email
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Send My Matches
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons - hide on step 7 since it has its own buttons */}
        {step > 0 && step < 7 && (
          <div className="flex justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              className="px-8 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Back button only for step 7 */}
        {step === 7 && (
          <div className="flex justify-start mt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
