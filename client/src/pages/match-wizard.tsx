/**
 * Care Matching Wizard - Premium Warm Design
 * Matches homepage styling with soft tiles, trust chips, and warm palette
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Heart, CheckCircle2, MapPin,
  Shield, Sparkles, Loader2, Check
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
    description: "Minimal daily assistance. Social activities, meals, and light housekeeping."
  },
  {
    id: "assisted",
    icon: "🤝",
    label: "Personal Care / Assisted Living",
    description: "Help with bathing, dressing, grooming, and medication reminders."
  },
  {
    id: "afh",
    icon: "🏡",
    label: "Adult Family Home (AFH)",
    description: "Small setting (2-6 residents) with personalized care in a home environment."
  },
  {
    id: "memory",
    icon: "🧠",
    label: "Specialized Memory Care",
    description: "Secure environment for dementia, Alzheimer's, or cognitive decline."
  },
  {
    id: "skilled",
    icon: "⚕️",
    label: "Skilled Nursing Facility",
    description: "24/7 medical care by licensed nurses for complex medical needs."
  },
  {
    id: "unsure",
    icon: "❓",
    label: "Not Sure Yet",
    description: "We'll help determine the right level based on your other answers."
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

// Step metadata for progress
const STEP_META = [
  { step: 0, title: "Welcome", helper: "" },
  { step: 1, title: "Who are you looking for care for?", helper: "Select one option" },
  { step: 2, title: "What area are you searching in?", helper: "Enter a city or zip code" },
  { step: 3, title: "What level of care is needed?", helper: "Select one option" },
  { step: 4, title: "Any specific care needs?", helper: "Select all that apply" },
  { step: 5, title: "What matters most to you?", helper: "Select all that apply" },
  { step: 6, title: "When do you need placement?", helper: "Select one option" },
  { step: 7, title: "How can we reach you?", helper: "All fields are optional" }
];

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

// ============ SUBCOMPONENTS ============

function TrustChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-black/5 shadow-sm">
      <span className="text-primary">{icon}</span>
      {text}
    </span>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const percent = Math.round((step / total) * 100);

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Step {step} of {total}</p>
          <p className="mt-0.5 text-xs text-slate-500">Takes about 2-3 minutes</p>
        </div>
        <p className="text-sm font-semibold text-primary">{percent}%</p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-sage-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function OptionTile({
  icon,
  label,
  desc,
  selected,
  onClick,
}: {
  icon?: string;
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-2xl p-4 text-left transition-all duration-200",
        "ring-1 focus:outline-none focus-visible:ring-2",
        "hover:scale-[1.01] active:scale-[0.99]",
        selected
          ? "bg-primary/5 ring-primary/30 focus-visible:ring-primary/40"
          : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 focus-visible:ring-primary/25"
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-lg flex-shrink-0",
              selected ? "bg-white ring-1 ring-primary/20" : "bg-slate-50 ring-1 ring-slate-200"
            )}
          >
            <span aria-hidden="true">{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={cn("font-semibold", selected ? "text-primary" : "text-slate-900")}>{label}</p>
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs flex-shrink-0",
                selected
                  ? "bg-primary text-white"
                  : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
              )}
              aria-hidden="true"
            >
              ✓
            </span>
          </div>
          {desc && <p className="mt-1 text-sm leading-snug text-slate-600">{desc}</p>}
        </div>
      </div>
    </button>
  );
}

function SimpleOptionTile({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-xl p-3.5 text-left transition-all duration-200",
        "ring-1 focus:outline-none focus-visible:ring-2",
        selected
          ? "bg-primary/5 ring-primary/30 focus-visible:ring-primary/40"
          : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 focus-visible:ring-primary/25"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-sm", selected ? "text-primary font-medium" : "text-slate-700")}>{label}</span>
        {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
      </div>
    </button>
  );
}

// ============ MAIN COMPONENT ============

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
    if (/^\d+$/.test(locationInput)) {
      return WA_ZIPS.filter(zip => zip.startsWith(locationInput)).slice(0, 5);
    }
    return WA_CITIES.filter(city => city.toLowerCase().startsWith(input)).slice(0, 5);
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
        setIntroFading(true);
        setTimeout(() => setShowIntro(false), 500);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [introIndex, showIntro]);

  const skipIntro = () => {
    setIntroFading(true);
    setTimeout(() => setShowIntro(false), 300);
  };

  const handleNext = () => {
    if (step === 7) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const count = Math.floor(Math.random() * 15) + 8;
    setMatchCount(count);
    setIsSubmitting(false);
    setShowResults(true);
  };

  const handleSkipToResults = () => handleSubmit();

  const viewMatches = () => {
    const params = new URLSearchParams();
    if (answers.location) params.set("city", answers.location);
    if (answers.careLevel) params.set("careLevel", answers.careLevel);
    if (answers.preferences.includes("Accepts Medicaid")) params.set("medicaid", "true");
    setLocation(`/search?${params.toString()}`);
  };

  const toggleArrayValue = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  };

  const selectLocation = (loc: string) => {
    setLocationInput(loc);
    setAnswers({ ...answers, location: loc });
    setShowSuggestions(false);
  };

  const currentMeta = STEP_META[step] || STEP_META[0];

  // =============== FLASH INTRO ===============
  if (showIntro) {
    const message = INTRO_MESSAGES[introIndex];
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="bg-white border-b border-gray-100">
          <Header />
        </div>
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-sage-500/10 blur-3xl pointer-events-none" />

          <button
            onClick={skipIntro}
            className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white font-medium text-sm flex items-center gap-2 transition-all z-20 backdrop-blur-sm"
          >
            Skip Intro <ArrowRight className="w-4 h-4" />
          </button>

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className={cn(
              "text-center transition-all duration-300",
              introFading ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}>
              <div className="text-6xl mb-6">{message.icon}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{message.title}</h1>
              <p className="text-lg text-white/70 max-w-md mx-auto">{message.text}</p>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
            {INTRO_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === introIndex ? "bg-white w-6" : "bg-white/30 w-2"
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
      <div className="min-h-screen bg-[#fbf7f2]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#f6efe6] to-transparent" />
        <div className="relative">
          <Header />
          <div className="flex items-center justify-center px-4 py-16">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-sage-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-3">
                We found {matchCount} homes that match!
              </h1>
              <p className="text-slate-600 mb-8">
                Based on your preferences, we've identified care homes{answers.location ? ` near ${answers.location}` : ""} that could be a great fit.
              </p>
              <button
                onClick={viewMatches}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-sm bg-gradient-to-r from-primary to-sage-600 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                View My Matches
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============== LOADING SCREEN ===============
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#fbf7f2]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#f6efe6] to-transparent" />
        <div className="relative">
          <Header />
          <div className="flex items-center justify-center px-4 py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">Finding your matches...</h2>
              <p className="text-slate-600">Our algorithm is searching for the perfect homes for you.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============== MAIN WIZARD ===============
  return (
    <div className="h-screen bg-[#fbf7f2] flex flex-col overflow-hidden">
      {/* Soft top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#f6efe6] to-transparent" />

      <div className="relative flex-shrink-0">
        <Header />
      </div>

      <main className="relative flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex-1 flex flex-col py-4 lg:py-6">
          {/* Mini hero - show on step 0 or step 1+ */}
          {step === 0 ? (
            // Welcome screen - centered
            <section className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-black/5 backdrop-blur mb-4">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                Washington State Licensed Homes Only
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                Let's find the right <span className="text-primary">care home</span> — together
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-slate-600 mb-4">
                Answer a few quick questions so we can match you with licensed, compassionate homes that fit your needs.
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-5">
                <TrustChip icon="✔" text="Washington Licensed" />
                <TrustChip icon="✔" text="Verified & Inspected" />
                <TrustChip icon="✔" text="Free Guidance" />
              </div>

              {/* Info boxes */}
              <div className="flex justify-center gap-3 mb-6">
                <div className="px-4 py-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="text-xl font-bold text-primary">7</div>
                  <div className="text-xs text-slate-500">Questions</div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="text-xl font-bold text-primary">~3</div>
                  <div className="text-xs text-slate-500">Minutes</div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <div className="text-xl font-bold text-primary">
                    <Sparkles className="w-5 h-5 inline" />
                  </div>
                  <div className="text-xs text-slate-500">Smart Match</div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg bg-gradient-to-r from-primary to-sage-600 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
              >
                Begin Matching
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>

              <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Your information stays private. We never share your data.
              </p>
            </section>
          ) : (
            // Steps 1-7 - compact layout
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Compact header with progress */}
              <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-black/5 backdrop-blur">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    WA Licensed
                  </div>
                  <div className="hidden sm:flex gap-1.5">
                    <TrustChip icon="✔" text="Verified" />
                    <TrustChip icon="✔" text="Free" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">Step {step}/7</span>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-sage-500 rounded-full transition-all duration-300"
                      style={{ width: `${(step / 7) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Step Card - fills remaining space */}
              <section className="flex-1 flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden min-h-0">
                <div className="flex-shrink-0 border-b border-slate-100 px-5 py-3">
                  <h2 className="text-lg font-semibold text-slate-900">{currentMeta.title}</h2>
                  {currentMeta.helper && <p className="text-sm text-slate-500">{currentMeta.helper}</p>}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {/* Step 1: Relationship */}
                  {step === 1 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { value: "myself", label: "Myself", desc: "I'm looking for care for me.", icon: "👤" },
                        { value: "parent", label: "My Parent", desc: "Care for my mom or dad.", icon: "👵" },
                        { value: "spouse", label: "My Spouse/Partner", desc: "Care for my spouse or partner.", icon: "❤️" },
                        { value: "family", label: "Another Family Member", desc: "Care for a relative.", icon: "👨‍👩‍👧" },
                        { value: "client", label: "A Client (Professional)", desc: "I'm helping someone I serve.", icon: "🧑‍⚕️" },
                      ].map((opt) => (
                        <OptionTile
                          key={opt.value}
                          icon={opt.icon}
                          label={opt.label}
                          desc={opt.desc}
                          selected={answers.relationship === opt.value}
                          onClick={() => setAnswers({ ...answers, relationship: opt.value })}
                        />
                      ))}
                    </div>
                  )}

                  {/* Step 2: Location */}
                  {step === 2 && (
                    <div className="max-w-md mx-auto">
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
                          className="w-full pl-12 py-4 text-base rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0"
                        />
                      </div>
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-10 w-full max-w-md">
                          {locationSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onMouseDown={() => selectLocation(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      )}
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
                                  ? "bg-primary text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary"
                              )}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Care Level */}
                  {step === 3 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CARE_LEVELS.map((opt) => (
                        <OptionTile
                          key={opt.id}
                          icon={opt.icon}
                          label={opt.label}
                          desc={opt.description}
                          selected={answers.careLevel === opt.id}
                          onClick={() => setAnswers({ ...answers, careLevel: opt.id })}
                        />
                      ))}
                    </div>
                  )}

                  {/* Step 4: Specific Needs */}
                  {step === 4 && (
                    <div className="space-y-6">
                      {Object.entries(CARE_NEEDS).map(([key, category]) => (
                        <div key={key}>
                          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                            {category.label}
                          </h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {category.options.map((option) => (
                              <SimpleOptionTile
                                key={option}
                                label={option}
                                selected={answers.specificNeeds.includes(option)}
                                onClick={() => {
                                  const newNeeds = toggleArrayValue(answers.specificNeeds, option);
                                  setAnswers({ ...answers, specificNeeds: newNeeds });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 5: Preferences */}
                  {step === 5 && (
                    <div className="space-y-6">
                      {Object.entries(PREFERENCES).map(([key, category]) => (
                        <div key={key}>
                          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                            {category.label}
                          </h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {category.options.map((option) => (
                              <SimpleOptionTile
                                key={option}
                                label={option}
                                selected={answers.preferences.includes(option)}
                                onClick={() => {
                                  const newPrefs = toggleArrayValue(answers.preferences, option);
                                  setAnswers({ ...answers, preferences: newPrefs });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 6: Timeline */}
                  {step === 6 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: "immediate", label: "Immediately (within days)", desc: "Urgent placement needed", icon: "🚨" },
                        { id: "1-3months", label: "Within 1-3 months", desc: "Planning ahead", icon: "📅" },
                        { id: "3-6months", label: "Within 3-6 months", desc: "Long-term planning", icon: "🗓️" },
                        { id: "researching", label: "Just researching", desc: "Exploring options", icon: "🔍" },
                      ].map((opt) => (
                        <OptionTile
                          key={opt.id}
                          icon={opt.icon}
                          label={opt.label}
                          desc={opt.desc}
                          selected={answers.timeline === opt.id}
                          onClick={() => setAnswers({ ...answers, timeline: opt.id })}
                        />
                      ))}
                    </div>
                  )}

                  {/* Step 7: Contact */}
                  {step === 7 && (
                    <div className="max-w-md mx-auto space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 mb-2 block text-sm font-medium">First Name</Label>
                          <Input
                            placeholder="First name"
                            value={answers.firstName}
                            onChange={(e) => setAnswers({ ...answers, firstName: e.target.value })}
                            className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 mb-2 block text-sm font-medium">Last Name</Label>
                          <Input
                            placeholder="Last name"
                            value={answers.lastName}
                            onChange={(e) => setAnswers({ ...answers, lastName: e.target.value })}
                            className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-700 mb-2 block text-sm font-medium">Email</Label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={answers.email}
                          onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                          className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 mb-2 block text-sm font-medium">Phone</Label>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={answers.phone}
                          onChange={(e) => setAnswers({ ...answers, phone: e.target.value })}
                          className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0"
                        />
                      </div>
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
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>Your information is never shared.</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Navigation - fixed at bottom of card */}
                <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    {step === 7 ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSkipToResults}
                          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!answers.email}
                          className={cn(
                            "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm",
                            answers.email
                              ? "text-white bg-gradient-to-r from-primary to-sage-600 hover:opacity-95"
                              : "text-slate-400 bg-slate-200 cursor-not-allowed"
                          )}
                        >
                          Send Matches
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm bg-gradient-to-r from-primary to-sage-600 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
