/**
 * OKAPI Care Network Logo
 * Bold stacked design with deep purple color
 * Matches the Copilot-generated brand logo
 */

import { useLocation } from "wouter";

interface LogoProps {
  variant?: "default" | "light" | "compact";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ variant = "default", className = "", size = "md" }: LogoProps) {
  const [, setLocation] = useLocation();

  // Size configurations
  const sizes = {
    sm: { okapi: "text-xl", care: "text-[10px]", gap: "gap-0" },
    md: { okapi: "text-2xl", care: "text-xs", gap: "gap-0.5" },
    lg: { okapi: "text-4xl", care: "text-sm", gap: "gap-1" },
  };

  const s = sizes[size];

  // Color based on variant
  const color = variant === "light" ? "text-white" : "text-[#4C1D95]";

  if (variant === "compact") {
    // Single line version for tight spaces
    return (
      <button
        onClick={() => setLocation("/")}
        className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
        aria-label="Go to homepage"
      >
        <span className="text-[#4C1D95]">
          <span className="font-black text-xl tracking-tight">OKAPI</span>
          <span className="font-semibold text-sm ml-2 tracking-wide">CARE NETWORK</span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex flex-col ${s.gap} hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to homepage"
    >
      {/* OKAPI - Bold */}
      <span className={`font-black ${s.okapi} tracking-tight ${color}`}>
        OKAPI
      </span>
      {/* CARE NETWORK - Lighter weight, tracked */}
      <span className={`font-semibold ${s.care} tracking-[0.2em] ${color}`}>
        CARE NETWORK
      </span>
    </button>
  );
}

/**
 * Inline logo for headers (single line)
 */
export function LogoInline({ variant = "default", className = "" }: { variant?: "default" | "light"; className?: string }) {
  const [, setLocation] = useLocation();
  const color = variant === "light" ? "text-white" : "text-[#4C1D95]";

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex items-baseline hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to homepage"
    >
      <span className={`font-black text-xl tracking-tight ${color}`}>OKAPI</span>
      <span className={`font-semibold text-xs tracking-[0.15em] ml-2 ${color}`}>CARE NETWORK</span>
    </button>
  );
}

/**
 * Logo as a clickable button (for when using wouter's setLocation)
 * @deprecated Use Logo or LogoInline instead
 */
export function LogoButton({
  variant = "default",
  size = "md",
  onClick,
  className = ""
}: { variant?: "default" | "light"; size?: "sm" | "md" | "lg"; onClick: () => void; className?: string }) {
  // Size configurations
  const sizes = {
    sm: { okapi: "text-xl", care: "text-[10px]", gap: "gap-0" },
    md: { okapi: "text-2xl", care: "text-xs", gap: "gap-0.5" },
    lg: { okapi: "text-4xl", care: "text-sm", gap: "gap-1" },
  };

  const s = sizes[size];
  const color = variant === "light" ? "text-white" : "text-[#4C1D95]";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col ${s.gap} hover:opacity-80 transition-opacity ${className}`}
    >
      <span className={`font-black ${s.okapi} tracking-tight ${color}`}>
        OKAPI
      </span>
      <span className={`font-semibold ${s.care} tracking-[0.2em] ${color}`}>
        CARE NETWORK
      </span>
    </button>
  );
}
