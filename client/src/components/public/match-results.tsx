import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Bed,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Heart,
  Building2,
} from "lucide-react";
import { FacilityWithMatch, CareNeeds, MatchReason } from "@/types/care-matching";

// Helper to get facility photos with fallback
function getMatchFacilityPhoto(facility: FacilityWithMatch): { photo: string; isPlaceholder: boolean } {
  if (facility.photos && facility.photos.length > 0) {
    return { photo: facility.photos[0], isPlaceholder: false };
  }
  // Return placeholder based on facility type
  const type = facility.facilityType?.toLowerCase() || 'default';
  const placeholderPaths: Record<string, string> = {
    afh: '/placeholders/afh-placeholder.svg',
    alf: '/placeholders/alf-placeholder.svg',
    snf: '/placeholders/snf-placeholder.svg',
    hospice: '/placeholders/hospice-placeholder.svg',
    default: '/placeholders/default-placeholder.svg',
  };
  return {
    photo: placeholderPaths[type] || placeholderPaths.default,
    isPlaceholder: true
  };
}

interface MatchResultsProps {
  matches: FacilityWithMatch[];
  careNeeds: CareNeeds;
  onBack: () => void;
  isLoading?: boolean;
}

function MatchScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", text: "text-green-400" };
    if (s >= 60) return { stroke: "#eab308", text: "text-yellow-400" };
    if (s >= 40) return { stroke: "#f97316", text: "text-orange-400" };
    return { stroke: "#ef4444", text: "text-red-400" };
  };

  const colors = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-lg font-bold ${colors.text}`}
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          {score}%
        </span>
      </div>
    </div>
  );
}

function MatchReasonBadge({ reason }: { reason: MatchReason }) {
  const Icon = reason.positive ? CheckCircle2 : reason.weight > 0 ? AlertCircle : XCircle;
  const colorClass = reason.positive
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : reason.weight > 0
    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${colorClass}`}
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      <Icon className="w-3 h-3" />
      <span>{reason.text}</span>
    </div>
  );
}

function FacilityMatchCard({
  facility,
  rank,
}: {
  facility: FacilityWithMatch;
  rank: number;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const photoData = getMatchFacilityPhoto(facility);
  const primaryPhoto = photoData.photo;

  const positiveReasons = facility.matchScore.reasons.filter((r) => r.positive);
  const neutralReasons = facility.matchScore.reasons.filter(
    (r) => !r.positive && r.weight > 0
  );
  const negativeReasons = facility.matchScore.reasons.filter(
    (r) => !r.positive && r.weight === 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-48 h-48 md:h-auto shrink-0">
          <img
            src={primaryPhoto}
            alt={facility.name}
            className={`w-full h-full ${
              photoData.isPlaceholder ? "object-contain p-2" : "object-cover"
            }`}
          />
          {/* Rank Badge */}
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            <Sparkles className="w-3 h-3" />#{rank}
          </div>
          {/* Availability Badge */}
          <div
            className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${
              facility.availableBeds > 0
                ? "bg-green-600 text-white"
                : "bg-stone-600 text-white"
            }`}
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {facility.availableBeds > 0
              ? `${facility.availableBeds} bed${facility.availableBeds > 1 ? "s" : ""} available`
              : "Waitlist"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3
                className="text-lg font-semibold text-stone-800 mb-1"
                style={{ fontFamily: "'Cormorant', serif" }}
              >
                {facility.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-stone-500 mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {facility.city}, WA
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  {facility.capacity} beds
                </span>
                {facility.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {facility.rating}
                    {facility.reviewCount && (
                      <span className="text-stone-400">
                        ({facility.reviewCount})
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-stone-600 mb-3">
                <DollarSign className="w-4 h-4" />
                <span style={{ fontFamily: "'Jost', sans-serif" }}>
                  {facility.priceMin
                    ? `From $${facility.priceMin.toLocaleString()}/mo`
                    : "Contact for pricing"}
                  {facility.priceMax && facility.priceMin !== facility.priceMax && (
                    <span className="text-stone-400">
                      {" "}
                      - ${facility.priceMax.toLocaleString()}/mo
                    </span>
                  )}
                </span>
              </div>

              {/* Top Match Reasons */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {positiveReasons.slice(0, 3).map((reason, i) => (
                  <MatchReasonBadge key={i} reason={reason} />
                ))}
                {neutralReasons.length > 0 && positiveReasons.length < 3 && (
                  <>
                    {neutralReasons.slice(0, 3 - positiveReasons.length).map((reason, i) => (
                      <MatchReasonBadge key={`n-${i}`} reason={reason} />
                    ))}
                  </>
                )}
              </div>

              {/* Specialties Tags */}
              {facility.specialties && facility.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {facility.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {specialty}
                    </span>
                  ))}
                  {facility.specialties.length > 3 && (
                    <span
                      className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-xs"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      +{facility.specialties.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Match Score */}
            <div className="text-center shrink-0">
              <MatchScoreRing score={facility.matchScore.overall} />
              <p
                className="text-xs text-stone-500 mt-1"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Match
              </p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 transition-colors mt-2"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show match details
              </>
            )}
          </button>

          {/* Expanded Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-stone-200 mt-4 space-y-4">
                  {/* Score Breakdown */}
                  <div>
                    <h4
                      className="text-sm font-medium text-stone-700 mb-2"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      Match Breakdown
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(facility.matchScore.breakdown).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="text-center p-2 bg-stone-50 rounded"
                          >
                            <div
                              className={`text-lg font-bold ${
                                value >= 80
                                  ? "text-green-600"
                                  : value >= 60
                                  ? "text-yellow-600"
                                  : "text-stone-400"
                              }`}
                              style={{ fontFamily: "'Jost', sans-serif" }}
                            >
                              {value}%
                            </div>
                            <div
                              className="text-xs text-stone-500 capitalize"
                              style={{ fontFamily: "'Jost', sans-serif" }}
                            >
                              {key.replace("Match", "")}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* All Match Reasons */}
                  <div>
                    <h4
                      className="text-sm font-medium text-stone-700 mb-2"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      Why this matches
                    </h4>
                    <div className="space-y-2">
                      {positiveReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {positiveReasons.map((reason, i) => (
                            <MatchReasonBadge key={i} reason={reason} />
                          ))}
                        </div>
                      )}
                      {neutralReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {neutralReasons.map((reason, i) => (
                            <MatchReasonBadge key={i} reason={reason} />
                          ))}
                        </div>
                      )}
                      {negativeReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {negativeReasons.map((reason, i) => (
                            <MatchReasonBadge key={i} reason={reason} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
            <Link
              href={`/facility/${facility.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              <Building2 className="w-4 h-4" />
              View Details
            </Link>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg transition-colors text-sm"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              <Heart className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MatchResults({
  matches,
  careNeeds,
  onBack,
  isLoading,
}: MatchResultsProps) {
  const [sortBy, setSortBy] = useState<"match" | "price" | "rating">("match");

  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case "match":
        return b.matchScore.overall - a.matchScore.overall;
      case "price":
        return (a.priceMin || 0) - (b.priceMin || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full"
        />
        <p
          className="mt-4 text-stone-400"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          Finding your perfect matches...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors mb-4"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Start Over
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-medium text-white"
              style={{ fontFamily: "'Cormorant', serif" }}
            >
              Your Personalized Matches
            </h2>
            <p
              className="text-stone-400"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Found {matches.length} homes matching your needs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm text-stone-400"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              <option value="match">Best Match</option>
              <option value="price">Lowest Price</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      {matches.length === 0 ? (
        <div className="text-center py-12 bg-stone-800/50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-stone-500 mx-auto mb-4" />
          <h3
            className="text-lg font-medium text-stone-300 mb-2"
            style={{ fontFamily: "'Cormorant', serif" }}
          >
            No Matches Found
          </h3>
          <p
            className="text-stone-400 mb-4"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Try adjusting your criteria for more results
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Modify Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMatches.map((facility, index) => (
            <FacilityMatchCard
              key={facility.id}
              facility={facility}
              rank={index + 1}
            />
          ))}
        </div>
      )}

      {/* Load More / See All */}
      {matches.length > 0 && (
        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            View All Homes
          </Link>
        </div>
      )}
    </div>
  );
}
