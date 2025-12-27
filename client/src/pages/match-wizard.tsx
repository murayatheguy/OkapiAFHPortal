/**
 * Match Wizard
 * Warm, caring step-by-step matching process
 */

import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Heart,
  Check,
  Home,
  Clock,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BRAND,
  CARE_NEEDS,
  MOBILITY_LEVELS,
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  WA_CITIES,
} from "@/lib/constants";

interface WizardData {
  location: string;
  careNeeds: string[];
  mobility: string;
  budget: string;
  timeline: string;
  name: string;
  phone: string;
  relationship: string;
}

/**
 * Step component for consistent styling
 */
function WizardStep({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
      {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

/**
 * Selectable option card
 */
function OptionCard({
  selected,
  onClick,
  icon,
  label,
  description,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  emoji?: string;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500"
          : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6 flex items-center gap-4">
        {emoji && <span className="text-2xl">{emoji}</span>}
        {icon && <div className="text-teal-600">{icon}</div>}
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900">{label}</p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {selected && (
          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Multi-select option card
 */
function MultiSelectCard({
  selected,
  onClick,
  emoji,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  description: string;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? "border-teal-500 bg-teal-50"
          : "border-gray-200 hover:border-teal-300"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <span className="text-3xl mb-2 block">{emoji}</span>
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
        {selected && (
          <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center mx-auto mt-2">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MatchWizard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    location: "",
    careNeeds: [],
    mobility: "",
    budget: "",
    timeline: "",
    name: "",
    phone: "",
    relationship: "",
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const goNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Navigate to results with filters
      const params = new URLSearchParams();
      if (data.location) params.set("city", data.location);
      if (data.careNeeds.length) params.set("needs", data.careNeeds.join(","));
      if (data.mobility) params.set("mobility", data.mobility);
      if (data.budget) params.set("budget", data.budget);
      setLocation(`/find-care?${params.toString()}`);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleCareNeed = (needId: string) => {
    setData((prev) => ({
      ...prev,
      careNeeds: prev.careNeeds.includes(needId)
        ? prev.careNeeds.filter((n) => n !== needId)
        : [...prev.careNeeds, needId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.location.length > 0;
      case 2:
        return data.careNeeds.length > 0;
      case 3:
        return data.mobility.length > 0;
      case 4:
        return data.budget.length > 0;
      case 5:
        return data.timeline.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center">
            <span className="text-lg tracking-wide">
              <span className="font-light text-gray-800">OKAPI</span>
              <span className="font-light text-gray-500 ml-1">Care Network</span>
            </span>
          </button>
          <span className="text-sm text-gray-500">
            Finding the right home
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b py-4">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Step 1: Location */}
        {step === 1 && (
          <WizardStep
            title="Where are you looking for care?"
            subtitle="We'll show you Adult Family Homes in this area."
          >
            <div className="max-w-md mx-auto">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter city or zip code"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="pl-12 h-14 text-lg"
                  list="cities-list"
                />
                <datalist id="cities-list">
                  {WA_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                We serve Adult Family Homes throughout {BRAND.state} State.
              </p>
            </div>
          </WizardStep>
        )}

        {/* Step 2: Care Needs */}
        {step === 2 && (
          <WizardStep
            title="What kind of care does your loved one need?"
            subtitle="Select all that apply. This helps us find the right match."
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {CARE_NEEDS.map((need) => (
                <MultiSelectCard
                  key={need.id}
                  selected={data.careNeeds.includes(need.id)}
                  onClick={() => toggleCareNeed(need.id)}
                  emoji={need.icon}
                  label={need.label}
                  description={need.description}
                />
              ))}
            </div>
          </WizardStep>
        )}

        {/* Step 3: Mobility */}
        {step === 3 && (
          <WizardStep
            title="How does your loved one get around?"
            subtitle="This helps us match with homes that can provide the right support."
          >
            <div className="max-w-lg mx-auto space-y-3">
              {MOBILITY_LEVELS.map((level) => (
                <OptionCard
                  key={level.id}
                  selected={data.mobility === level.id}
                  onClick={() => setData({ ...data, mobility: level.id })}
                  emoji={level.icon}
                  label={level.label}
                />
              ))}
            </div>
          </WizardStep>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <WizardStep
            title="What's your budget situation?"
            subtitle="Don't worry—many options exist. We'll help you find what works."
          >
            <div className="max-w-lg mx-auto space-y-3">
              {BUDGET_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={data.budget === option.id}
                  onClick={() => setData({ ...data, budget: option.id })}
                  icon={<DollarSign className="h-5 w-5" />}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          </WizardStep>
        )}

        {/* Step 5: Timeline */}
        {step === 5 && (
          <WizardStep
            title="When do you need care?"
            subtitle="Whether it's urgent or you're just planning ahead, we can help."
          >
            <div className="max-w-lg mx-auto space-y-3">
              {TIMELINE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={data.timeline === option.id}
                  onClick={() => setData({ ...data, timeline: option.id })}
                  emoji={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </WizardStep>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {step === totalSteps ? (
              <>
                See My Matches
                <Heart className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Reassurance */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your information stays with us. We don't share it with anyone.
          </p>
        </div>
      </main>
    </div>
  );
}
