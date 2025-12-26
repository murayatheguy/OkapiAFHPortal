import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Building2,
  Hospital,
  Heart,
  HelpCircle,
  Brain,
  Pill,
  Accessibility,
  HeartPulse,
  Users,
  Wind,
  Activity,
  Utensils,
  Droplets,
  Shirt,
  ArrowUpDown,
  Footprints,
  DoorClosed,
  PawPrint,
  TreePine,
  Church,
  Globe,
  Salad,
  MapPin,
  DollarSign,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  CareNeeds,
  CareType,
  MedicalNeed,
  DailyHelp,
  Preference,
  Timeline,
  WIZARD_STEPS,
  CARE_TYPE_OPTIONS,
  MEDICAL_NEED_OPTIONS,
  DAILY_HELP_OPTIONS,
  PREFERENCE_OPTIONS,
  TIMELINE_OPTIONS,
  DEFAULT_CARE_NEEDS,
} from "@/types/care-matching";

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Building2,
  Hospital,
  Heart,
  HelpCircle,
  Brain,
  Pill,
  Accessibility,
  HeartPulse,
  Users,
  Wind,
  Activity,
  Utensils,
  Droplets,
  Shirt,
  ArrowUpDown,
  Footprints,
  DoorClosed,
  PawPrint,
  TreePine,
  Church,
  Globe,
  Salad,
  Pills: Pill,
  Bandage: HeartPulse,
  Bath: Droplets,
  UtensilsCrossed: Utensils,
};

interface CareNeedsWizardProps {
  onComplete: (needs: CareNeeds) => void;
  onClose: () => void;
}

export function CareNeedsWizard({ onComplete, onClose }: CareNeedsWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [needs, setNeeds] = useState<CareNeeds>(DEFAULT_CARE_NEEDS);
  const [direction, setDirection] = useState(1);

  const step = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const goNext = () => {
    if (isLastStep) {
      onComplete(needs);
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleArrayValue = <T extends string>(
    array: T[],
    value: T,
    setter: (arr: T[]) => void
  ) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderStepContent = () => {
    switch (step.id) {
      case "care-type":
        return (
          <div className="grid grid-cols-1 gap-3">
            {CARE_TYPE_OPTIONS.map((option) => {
              const Icon = ICON_MAP[option.icon] || HelpCircle;
              const isSelected = needs.careType === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setNeeds({ ...needs, careType: option.value as CareType })
                  }
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-stone-700 hover:border-amber-500/50 bg-stone-800/50"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? "bg-amber-500/20" : "bg-stone-700/50"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? "text-amber-400" : "text-stone-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isSelected ? "text-amber-300" : "text-stone-200"
                      }`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.label}
                    </p>
                    <p
                      className="text-sm text-stone-400"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        );

      case "medical-needs":
        return (
          <div className="space-y-4">
            <p
              className="text-stone-400 text-sm mb-4"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Select all that apply (or skip if none)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MEDICAL_NEED_OPTIONS.map((option) => {
                const Icon = ICON_MAP[option.icon] || HelpCircle;
                const isSelected = needs.medicalNeeds.includes(
                  option.value as MedicalNeed
                );
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      toggleArrayValue(
                        needs.medicalNeeds,
                        option.value as MedicalNeed,
                        (arr) => setNeeds({ ...needs, medicalNeeds: arr })
                      )
                    }
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 text-left ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-amber-400" : "text-stone-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isSelected ? "text-amber-300" : "text-stone-300"
                      }`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "daily-help":
        return (
          <div className="space-y-4">
            <p
              className="text-stone-400 text-sm mb-4"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              What daily activities does the person need help with?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DAILY_HELP_OPTIONS.map((option) => {
                const Icon = ICON_MAP[option.icon] || HelpCircle;
                const isSelected = needs.dailyHelp.includes(
                  option.value as DailyHelp
                );
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      toggleArrayValue(
                        needs.dailyHelp,
                        option.value as DailyHelp,
                        (arr) => setNeeds({ ...needs, dailyHelp: arr })
                      )
                    }
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 text-left ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-amber-400" : "text-stone-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isSelected ? "text-amber-300" : "text-stone-300"
                      }`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                className="block text-stone-300 text-sm font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                City or Town
              </label>
              <input
                type="text"
                placeholder="e.g., Seattle, Bellevue, Tacoma..."
                value={needs.location.city || ""}
                onChange={(e) =>
                  setNeeds({
                    ...needs,
                    location: { ...needs.location, city: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                style={{ fontFamily: "'Jost', sans-serif" }}
              />
            </div>
            <div className="space-y-2">
              <label
                className="block text-stone-300 text-sm font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                OR enter ZIP Code
              </label>
              <input
                type="text"
                placeholder="e.g., 98101"
                value={needs.location.zipCode || ""}
                onChange={(e) =>
                  setNeeds({
                    ...needs,
                    location: { ...needs.location, zipCode: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                style={{ fontFamily: "'Jost', sans-serif" }}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <label
                className="block text-stone-300 text-sm font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Search Radius: {needs.location.maxDistance} miles
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={needs.location.maxDistance}
                onChange={(e) =>
                  setNeeds({
                    ...needs,
                    location: {
                      ...needs.location,
                      maxDistance: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-amber-500"
              />
              <div
                className="flex justify-between text-xs text-stone-500"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                <span>5 mi</span>
                <span>25 mi</span>
                <span>50 mi</span>
              </div>
            </div>
          </div>
        );

      case "budget":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label
                className="block text-stone-300 text-sm font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Monthly Budget Range
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1">
                    Minimum
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="number"
                      placeholder="0"
                      value={needs.budget.min || ""}
                      onChange={(e) =>
                        setNeeds({
                          ...needs,
                          budget: {
                            ...needs.budget,
                            min: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-9 pr-4 py-3 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                  </div>
                </div>
                <span className="text-stone-500 pt-5">to</span>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1">
                    Maximum
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="number"
                      placeholder="10000"
                      value={needs.budget.max || ""}
                      onChange={(e) =>
                        setNeeds({
                          ...needs,
                          budget: {
                            ...needs.budget,
                            max: parseInt(e.target.value) || 10000,
                          },
                        })
                      }
                      className="w-full pl-9 pr-4 py-3 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  setNeeds({
                    ...needs,
                    budget: {
                      ...needs.budget,
                      hasInsurance: !needs.budget.hasInsurance,
                    },
                  })
                }
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  needs.budget.hasInsurance
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                }`}
              >
                <span
                  className="text-stone-300"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  I have long-term care insurance
                </span>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    needs.budget.hasInsurance
                      ? "bg-amber-500 border-amber-500"
                      : "border-stone-600"
                  }`}
                >
                  {needs.budget.hasInsurance && (
                    <Check className="w-3 h-3 text-stone-900" />
                  )}
                </div>
              </button>

              <button
                onClick={() =>
                  setNeeds({
                    ...needs,
                    budget: {
                      ...needs.budget,
                      hasMedicaid: !needs.budget.hasMedicaid,
                    },
                  })
                }
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  needs.budget.hasMedicaid
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                }`}
              >
                <span
                  className="text-stone-300"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  Medicaid/COPES eligible
                </span>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    needs.budget.hasMedicaid
                      ? "bg-amber-500 border-amber-500"
                      : "border-stone-600"
                  }`}
                >
                  {needs.budget.hasMedicaid && (
                    <Check className="w-3 h-3 text-stone-900" />
                  )}
                </div>
              </button>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-4">
            <p
              className="text-stone-400 text-sm mb-4"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Any additional preferences? (optional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCE_OPTIONS.map((option) => {
                const Icon = ICON_MAP[option.icon] || HelpCircle;
                const isSelected = needs.preferences.includes(
                  option.value as Preference
                );
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      toggleArrayValue(
                        needs.preferences,
                        option.value as Preference,
                        (arr) => setNeeds({ ...needs, preferences: arr })
                      )
                    }
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 text-left ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-amber-400" : "text-stone-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isSelected ? "text-amber-300" : "text-stone-300"
                      }`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="grid grid-cols-1 gap-3">
            {TIMELINE_OPTIONS.map((option) => {
              const isSelected = needs.timeline === option.value;
              const urgencyColors = {
                high: "border-red-500 bg-red-500/10",
                medium: "border-amber-500 bg-amber-500/10",
                low: "border-emerald-500 bg-emerald-500/10",
                none: "border-stone-500 bg-stone-500/10",
              };
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setNeeds({ ...needs, timeline: option.value as Timeline })
                  }
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? urgencyColors[option.urgency as keyof typeof urgencyColors]
                      : "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                  }`}
                >
                  <Clock
                    className={`w-5 h-5 ${
                      isSelected ? "text-amber-400" : "text-stone-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isSelected ? "text-amber-300" : "text-stone-200"
                      }`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.label}
                    </p>
                    <p
                      className="text-sm text-stone-400"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {option.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-amber-400" />}
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#1a2f25] rounded-xl shadow-2xl border border-amber-900/30 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2
                className="text-lg font-medium text-white"
                style={{ fontFamily: "'Cormorant', serif" }}
              >
                Find Your Perfect Match
              </h2>
              <p
                className="text-xs text-stone-400"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-stone-900/30">
          <div className="flex gap-1">
            {WIZARD_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-amber-500" : "bg-stone-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Title */}
        <div className="px-6 py-4">
          <h3
            className="text-xl font-medium text-white"
            style={{ fontFamily: "'Cormorant', serif" }}
          >
            {step.title}
          </h3>
          <p
            className="text-sm text-stone-400"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {step.description}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 min-h-[320px] overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-900/30 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isFirstStep
                ? "text-stone-600 cursor-not-allowed"
                : "text-stone-300 hover:bg-stone-800"
            }`}
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Find Matches
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
