/**
 * Care Matching Wizard - Premium Design
 * Flash intro with 4 messages, then 7-step questionnaire
 * Updated to match homepage UI (dark green + gold/amber)
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
      <div className="min-h-screen w-full overflow-hidden relative" style={{ backgroundColor: '#0d1a14' }}>
        {/* Texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/10 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-emerald-800/10 blur-3xl" />

        {/* Header with logo */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
          <Link href="/" className="flex items-center gap-1.5">
            <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
              OKAPI
            </span>
            <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.25rem' }}>
              Care Network
            </span>
          </Link>

          {/* Skip button */}
          <button
            onClick={skipIntro}
            className="flex items-center gap-1 transition-colors hover:text-amber-300"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: '#a8a49c' }}
          >
            Skip <ArrowRight className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <div className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
          <div
            className={cn(
              "text-center transition-all duration-300",
              introFading ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
            )}
          >
            <div className="text-6xl mb-6">{message.icon}</div>
            <h1
              className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              {message.title}
            </h1>
            <p
              className="text-lg max-w-md mx-auto"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, color: '#c8c4bc' }}
            >
              {message.text}
            </p>
          </div>

          {/* Progress dots */}
          <div className="absolute bottom-12 flex gap-2">
            {INTRO_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === introIndex ? "w-6" : "w-2"
                )}
                style={{ backgroundColor: idx === introIndex ? '#c9a962' : 'rgba(201, 169, 98, 0.3)' }}
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0d1a14' }}>
        {/* Texture overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 text-center max-w-md">
          <div
            className="w-20 h-20 rounded flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(201, 169, 98, 0.2)' }}
          >
            <Sparkles className="w-10 h-10" style={{ color: '#e8c55a' }} />
          </div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
          >
            We found {matchCount} homes that match your needs!
          </h1>
          <p
            className="mb-8"
            style={{ fontFamily: "'Jost', sans-serif", fontSize: '1rem', color: '#c8c4bc' }}
          >
            Based on your preferences, we've identified care homes{answers.location ? ` near ${answers.location}` : ""} that could be a great fit.
          </p>
          <button
            onClick={viewMatches}
            className="inline-flex items-center gap-2 px-8 py-4 transition-all hover:opacity-90"
            style={{
              backgroundColor: '#c9a962',
              color: '#0d1a14',
              fontFamily: "'Jost', sans-serif",
              fontWeight: 500,
              fontSize: '1rem',
              letterSpacing: '0.05em',
              borderRadius: '2px'
            }}
          >
            View My Matches
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // =============== LOADING SCREEN ===============
  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0d1a14' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6" style={{ color: '#c9a962' }} />
          <h2
            className="text-2xl mb-2"
            style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
          >
            Finding your matches...
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '1rem', color: '#c8c4bc' }}>
            Our algorithm is searching for the perfect homes for you.
          </p>
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
        "w-full p-4 rounded text-left transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        className
      )}
      style={{
        backgroundColor: selected ? 'rgba(201, 169, 98, 0.1)' : 'rgba(255, 255, 255, 0.03)',
        border: selected ? '1px solid rgba(201, 169, 98, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: selected ? '4px solid #c9a962' : '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {children}
    </button>
  );

  // =============== MAIN WIZARD ===============
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1a14' }}>
      {/* Texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header with logo and progress */}
      <header className="sticky top-0 z-20 border-b bg-[#0d1a14]/90 backdrop-blur-sm" style={{ borderColor: 'rgba(201, 169, 98, 0.2)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-1.5">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.1rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.1rem' }}>
                Care Network
              </span>
            </Link>
            {step > 0 && (
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#c9a962' }}>
                {Math.round((step / 7) * 100)}% complete
              </span>
            )}
          </div>
          {step > 0 && (
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#a8a49c' }}>
                Step {step} of 7
              </span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(201, 169, 98, 0.2)' }}>
                <div
                  className="h-full transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(step / 7) * 100}%`, backgroundColor: '#c9a962' }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-in fade-in duration-500">
            {/* Trust badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{
                backgroundColor: 'rgba(34, 87, 64, 0.2)',
                border: '1px solid rgba(34, 87, 64, 0.4)',
                color: '#4ade80'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Secure & Confidential
            </div>

            {/* Icon */}
            <div
              className="w-20 h-20 rounded flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(201, 169, 98, 0.15)' }}
            >
              <Heart className="w-10 h-10" style={{ color: '#e8c55a' }} />
            </div>

            <h1
              className="text-3xl md:text-4xl mb-3"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              Let's Find Your <span style={{ color: '#e8c55a', fontStyle: 'italic' }}>Perfect Match</span>
            </h1>
            <p
              className="text-lg mb-8 max-w-md mx-auto"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, color: '#c8c4bc' }}
            >
              A few quick questions help our algorithm match you with homes that truly fit your needs.
            </p>

            {/* Info boxes */}
            <div className="flex justify-center gap-4 mb-10">
              {[
                { value: '7', label: 'Questions' },
                { value: '~3', label: 'Minutes' },
                { value: '✨', label: 'Smart Matches' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-4 py-3 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(201, 169, 98, 0.2)'
                  }}
                >
                  <div style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 600, color: '#e8c55a' }}>
                    {item.value}
                  </div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#a8a49c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-8 py-4 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#c9a962',
                color: '#0d1a14',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                fontSize: '1rem',
                letterSpacing: '0.05em',
                borderRadius: '2px'
              }}
            >
              Begin Matching
              <ArrowRight className="w-5 h-5" />
            </button>

            <p
              className="mt-6 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#6b7c72' }}
            >
              <Shield className="w-4 h-4" />
              Your information stays private. We never share your data.
            </p>

            <p
              className="mt-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72' }}
            >
              Powered by Okapi's proprietary matching algorithm
            </p>
          </div>
        )}

        {/* Step 1: Relationship */}
        {step === 1 && (
          <div className="animate-in fade-in duration-500">
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              Who are you looking for care for?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Select all that apply (optional)
            </p>

            <div className="grid gap-3">
              {["Myself", "My Parent", "My Spouse/Partner", "Another Family Member", "A Client (I'm a professional)"].map((option) => (
                <SelectableCard
                  key={option}
                  selected={answers.relationship === option}
                  onClick={() => setAnswers({ ...answers, relationship: option })}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: '#f5f3ef' }}>{option}</span>
                    {answers.relationship === option && (
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#c9a962' }} />
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
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              What area are you searching in?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Enter a city or zip code (optional)
            </p>

            <div className="max-w-md mx-auto relative">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#c9a962' }} />
                <input
                  placeholder="Enter city or zip code"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setAnswers({ ...answers, location: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-12 py-4 rounded focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(201, 169, 98, 0.3)',
                    color: '#f5f3ef',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Autocomplete suggestions */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded overflow-hidden z-10"
                  style={{
                    backgroundColor: '#1a2f25',
                    border: '1px solid rgba(201, 169, 98, 0.3)'
                  }}
                >
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={() => selectLocation(suggestion)}
                      className="w-full px-4 py-3 text-left flex items-center gap-2 transition-colors hover:bg-amber-900/20"
                    >
                      <MapPin className="w-4 h-4" style={{ color: '#c9a962' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", color: '#f5f3ef' }}>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular cities */}
              <div className="mt-6">
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#a8a49c', marginBottom: '0.75rem' }}>
                  Popular areas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Seattle", "Tacoma", "Bellevue", "Spokane", "Everett", "Olympia"].map((city) => (
                    <button
                      key={city}
                      onClick={() => selectLocation(city)}
                      className="px-4 py-2 rounded-full text-sm transition-all"
                      style={{
                        backgroundColor: answers.location === city ? '#c9a962' : 'rgba(255, 255, 255, 0.08)',
                        color: answers.location === city ? '#0d1a14' : '#c8c4bc',
                        fontFamily: "'Jost', sans-serif",
                        border: '1px solid',
                        borderColor: answers.location === city ? '#c9a962' : 'rgba(255, 255, 255, 0.1)'
                      }}
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
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              What level of care is needed?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Select all that apply (optional)
            </p>

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
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: '#f5f3ef', marginBottom: '0.25rem' }}>
                        {option.label}
                      </div>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#a8a49c', lineHeight: 1.5 }}>
                        {option.description}
                      </div>
                    </div>
                    {answers.careLevel === option.id && (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#c9a962' }} />
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
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              Any specific care needs?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Select all that apply (optional)
            </p>

            <div className="space-y-6">
              {Object.entries(CARE_NEEDS).map(([key, category]) => (
                <div key={key}>
                  <h3
                    className="mb-3"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: '#c9a962', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                  >
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
                          <span style={{ fontFamily: "'Jost', sans-serif", color: '#e8e4dc' }}>{option}</span>
                          {answers.specificNeeds.includes(option) && (
                            <Check className="w-5 h-5" style={{ color: '#c9a962' }} />
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
                className="w-full p-4 rounded text-left transition-all"
                style={{
                  backgroundColor: answers.specificNeeds.length === 0 ? 'rgba(107, 124, 114, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: answers.specificNeeds.length === 0 ? 'rgba(107, 124, 114, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'Jost', sans-serif", color: '#a8a49c' }}>None of the above / Skip this step</span>
                  {answers.specificNeeds.length === 0 && (
                    <Check className="w-5 h-5" style={{ color: '#6b7c72' }} />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Preferences */}
        {step === 5 && (
          <div className="animate-in fade-in duration-500">
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              What matters most to you?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Select all that apply (optional)
            </p>

            <div className="space-y-6">
              {Object.entries(PREFERENCES).map(([key, category]) => (
                <div key={key}>
                  <h3
                    className="mb-3"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: '#c9a962', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                  >
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
                          <span style={{ fontFamily: "'Jost', sans-serif", color: '#e8e4dc' }}>{option}</span>
                          {answers.preferences.includes(option) && (
                            <Check className="w-5 h-5" style={{ color: '#c9a962' }} />
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
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              When do you need placement?
            </h2>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Select all that apply (optional)
            </p>

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
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: '#f5f3ef' }}>{option.label}</span>
                    </div>
                    {answers.timeline === option.id && (
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#c9a962' }} />
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
            <h2
              className="text-2xl md:text-3xl mb-2 text-center"
              style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#ffffff' }}
            >
              How can we reach you?
            </h2>
            <p
              className="text-center mb-2"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#a8a49c' }}
            >
              Want us to send your matches? Leave your info below, or skip to see results now.
            </p>
            <p
              className="text-center mb-8"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#c9a962' }}
            >
              All fields are optional
            </p>

            <div className="max-w-md mx-auto space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block mb-2"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#c8c4bc' }}
                  >
                    First Name
                  </label>
                  <input
                    placeholder="First name"
                    value={answers.firstName}
                    onChange={(e) => setAnswers({ ...answers, firstName: e.target.value })}
                    className="w-full py-3 px-4 rounded focus:outline-none"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(201, 169, 98, 0.2)',
                      color: '#f5f3ef',
                      fontFamily: "'Jost', sans-serif"
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-2"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#c8c4bc' }}
                  >
                    Last Name
                  </label>
                  <input
                    placeholder="Last name"
                    value={answers.lastName}
                    onChange={(e) => setAnswers({ ...answers, lastName: e.target.value })}
                    className="w-full py-3 px-4 rounded focus:outline-none"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(201, 169, 98, 0.2)',
                      color: '#f5f3ef',
                      fontFamily: "'Jost', sans-serif"
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  className="block mb-2"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#c8c4bc' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={answers.email}
                  onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                  className="w-full py-3 px-4 rounded focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    color: '#f5f3ef',
                    fontFamily: "'Jost', sans-serif"
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  className="block mb-2"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#c8c4bc' }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={answers.phone}
                  onChange={(e) => setAnswers({ ...answers, phone: e.target.value })}
                  className="w-full py-3 px-4 rounded focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(201, 169, 98, 0.2)',
                    color: '#f5f3ef',
                    fontFamily: "'Jost', sans-serif"
                  }}
                />
              </div>

              {/* Text updates checkbox - only show if phone entered */}
              {answers.phone && (
                <div
                  className="flex items-center gap-3 p-4 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(201, 169, 98, 0.15)'
                  }}
                >
                  <Checkbox
                    id="textUpdates"
                    checked={answers.textUpdates}
                    onCheckedChange={(checked) => setAnswers({ ...answers, textUpdates: checked as boolean })}
                  />
                  <label
                    htmlFor="textUpdates"
                    className="cursor-pointer"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#c8c4bc' }}
                  >
                    Text me updates about my matches
                  </label>
                </div>
              )}

              {/* Privacy note */}
              <div
                className="flex items-center justify-center gap-2 pt-2"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#6b7c72' }}
              >
                <Shield className="w-4 h-4" style={{ color: '#c9a962' }} />
                <span>Your information is never shared. We only use it to send your personalized matches.</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleSkipToResults}
                  className="flex-1 py-4 rounded transition-all hover:bg-white/5"
                  style={{
                    border: '1px solid rgba(201, 169, 98, 0.4)',
                    color: '#c9a962',
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 500
                  }}
                >
                  Skip & View Results
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!answers.email}
                  className="flex-1 py-4 rounded transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: answers.email ? '#c9a962' : 'rgba(107, 124, 114, 0.3)',
                    color: answers.email ? '#0d1a14' : '#6b7c72',
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 500,
                    cursor: answers.email ? 'pointer' : 'not-allowed'
                  }}
                >
                  Send My Matches
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons - hide on step 7 since it has its own buttons */}
        {step > 0 && step < 7 && (
          <div className="flex justify-between mt-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 transition-colors hover:text-amber-300"
              style={{ fontFamily: "'Jost', sans-serif", color: '#a8a49c' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#c9a962',
                color: '#0d1a14',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                borderRadius: '2px'
              }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back button only for step 7 */}
        {step === 7 && (
          <div className="flex justify-start mt-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 transition-colors hover:text-amber-300"
              style={{ fontFamily: "'Jost', sans-serif", color: '#a8a49c' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
