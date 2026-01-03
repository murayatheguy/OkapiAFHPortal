/**
 * Care Matching Wizard - Premium Design
 * Flash intro with 4 messages, then 7-step questionnaire
 */

import { useState, useEffect } from "react";
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

// Washington State Counties
const WA_COUNTIES = [
  "King", "Pierce", "Snohomish", "Spokane", "Clark", "Thurston",
  "Kitsap", "Yakima", "Whatcom", "Benton", "Skagit", "Cowlitz",
  "Grant", "Franklin", "Chelan", "Lewis", "Grays Harbor", "Mason",
  "Clallam", "Walla Walla", "Stevens", "Whitman", "Island", "Douglas",
  "Okanogan", "Kittitas", "Jefferson", "Pacific", "Adams", "Klickitat",
  "San Juan", "Asotin", "Skamania", "Pend Oreille", "Ferry", "Lincoln",
  "Columbia", "Garfield", "Wahkiakum"
].sort();

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

interface MatchAnswers {
  relationship: string;
  county: string;
  city: string;
  careLevel: string;
  specificNeeds: string[];
  preferences: string[];
  timeline: string;
  firstName: string;
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

  // Answers
  const [answers, setAnswers] = useState<MatchAnswers>({
    relationship: "",
    county: "",
    city: "",
    careLevel: "",
    specificNeeds: [],
    preferences: [],
    timeline: "",
    firstName: "",
    email: "",
    phone: "",
    textUpdates: false
  });

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

  const viewMatches = () => {
    // Build query params from answers
    const params = new URLSearchParams();
    if (answers.county) params.set("county", answers.county);
    if (answers.city) params.set("city", answers.city);
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

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return answers.relationship !== "";
      case 2: return answers.county !== "";
      case 3: return answers.careLevel !== "";
      case 4: return true; // Optional
      case 5: return true; // Optional
      case 6: return answers.timeline !== "";
      case 7: return answers.firstName !== "" && answers.email !== "";
      default: return false;
    }
  };

  // =============== FLASH INTRO ===============
  if (showIntro) {
    const message = INTRO_MESSAGES[introIndex];

    return (
      <div className="min-h-screen w-full overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-teal-400/5 blur-3xl" />

        {/* Skip button */}
        <button
          onClick={skipIntro}
          className="absolute top-6 right-6 text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors z-20"
        >
          Skip <ArrowRight className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
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

          {/* Progress dots */}
          <div className="absolute bottom-12 flex gap-2">
            {INTRO_MESSAGES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === introIndex ? "bg-teal-400 w-6" : "bg-white/30"
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            We found {matchCount} homes that match your needs!
          </h1>
          <p className="text-slate-500 mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Based on your preferences, we've identified Adult Family Homes in {answers.county} County that could be a great fit.
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
    );
  }

  // =============== LOADING SCREEN ===============
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30 flex items-center justify-center px-4">
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
    );
  }

  // =============== MAIN WIZARD ===============
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30">
      {/* Header with progress */}
      {step > 0 && (
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/50 z-20">
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
            <p className="text-slate-500 text-center mb-8">Select one option</p>

            <div className="grid gap-3">
              {["Myself", "My Parent", "My Spouse/Partner", "Another Family Member", "A Client (I'm a professional)"].map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, relationship: option })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    answers.relationship === option
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white hover:border-teal-300 text-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {answers.relationship === option && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </button>
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
            <p className="text-slate-500 text-center mb-8">Select a Washington State county</p>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 mb-2 block">County *</Label>
                <select
                  value={answers.county}
                  onChange={(e) => setAnswers({ ...answers, county: e.target.value })}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white focus:border-teal-500 focus:ring-0 text-slate-700"
                >
                  <option value="">Select a county...</option>
                  {WA_COUNTIES.map((county) => (
                    <option key={county} value={county}>{county} County</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">Specific city or zip (optional)</Label>
                <Input
                  placeholder="e.g., Seattle or 98101"
                  value={answers.city}
                  onChange={(e) => setAnswers({ ...answers, city: e.target.value })}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-teal-500"
                />
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
            <p className="text-slate-500 text-center mb-8">Select the best match</p>

            <div className="grid gap-3">
              {[
                { id: "independent", label: "Independent Living", desc: "Minimal assistance, mostly social" },
                { id: "personal", label: "Personal Care", desc: "Help with daily activities (bathing, dressing)" },
                { id: "memory", label: "Specialized Memory Care", desc: "Dementia or Alzheimer's support" },
                { id: "skilled", label: "Skilled Nursing", desc: "Medical care needs" },
                { id: "unsure", label: "Not Sure", desc: "We'll help figure it out" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAnswers({ ...answers, careLevel: option.id })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    answers.careLevel === option.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{option.label}</div>
                      <div className="text-sm text-slate-500">{option.desc}</div>
                    </div>
                    {answers.careLevel === option.id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
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

            <div className="grid gap-3">
              {[
                "Mobility assistance (wheelchair, walker)",
                "Medication management",
                "Diabetes care",
                "Mental health support",
                "Behavioral support",
                "Hospice/End of life care",
                "None of the above"
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (option === "None of the above") {
                      setAnswers({ ...answers, specificNeeds: ["None of the above"] });
                    } else {
                      const newNeeds = toggleArrayValue(
                        answers.specificNeeds.filter(n => n !== "None of the above"),
                        option
                      );
                      setAnswers({ ...answers, specificNeeds: newNeeds });
                    }
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    answers.specificNeeds.includes(option)
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">{option}</span>
                    {answers.specificNeeds.includes(option) && (
                      <Check className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </button>
              ))}
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

            <div className="grid gap-3">
              {[
                "Private room",
                "Accepts Medicaid",
                "Accepts VA benefits",
                "Pet-friendly",
                "Cultural/language preferences",
                "Near public transit",
                "Outdoor space/garden"
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, preferences: toggleArrayValue(answers.preferences, option) })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    answers.preferences.includes(option)
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">{option}</span>
                    {answers.preferences.includes(option) && (
                      <Check className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </button>
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
            <p className="text-slate-500 text-center mb-8">Select your timeline</p>

            <div className="grid gap-3">
              {[
                { id: "immediate", label: "Immediately (within days)", icon: "🚨" },
                { id: "2weeks", label: "Within 2 weeks", icon: "📅" },
                { id: "1-2months", label: "Within 1-2 months", icon: "🗓️" },
                { id: "researching", label: "Just researching for now", icon: "🔍" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAnswers({ ...answers, timeline: option.id })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    answers.timeline === option.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Contact Info */}
        {step === 7 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
              How can we reach you with matches?
            </h2>
            <p className="text-slate-500 text-center mb-8">We'll send your personalized results</p>

            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <Label className="text-slate-700 mb-2 block">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Your first name"
                    value={answers.firstName}
                    onChange={(e) => setAnswers({ ...answers, firstName: e.target.value })}
                    className="w-full pl-12 p-4 rounded-xl border-2 border-slate-200 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={answers.email}
                    onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                    className="w-full pl-12 p-4 rounded-xl border-2 border-slate-200 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={answers.phone}
                    onChange={(e) => setAnswers({ ...answers, phone: e.target.value })}
                    className="w-full pl-12 p-4 rounded-xl border-2 border-slate-200 focus:border-teal-500"
                  />
                </div>
              </div>

              {answers.phone && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                  <Checkbox
                    id="textUpdates"
                    checked={answers.textUpdates}
                    onCheckedChange={(checked) => setAnswers({ ...answers, textUpdates: checked as boolean })}
                  />
                  <Label htmlFor="textUpdates" className="text-slate-600 cursor-pointer">
                    Text me updates about my matches
                  </Label>
                </div>
              )}

              <p className="text-sm text-slate-400 text-center flex items-center justify-center gap-1">
                <Shield className="w-4 h-4" />
                We'll never spam you or share your info.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step > 0 && (
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
              disabled={!canProceed()}
              className={cn(
                "px-8 rounded-xl transition-all",
                canProceed()
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {step === 7 ? "Find My Matches" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
