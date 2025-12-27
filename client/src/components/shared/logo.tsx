/**
 * OKAPI Care Network Logo
 * EXACT copy from production owner login page
 * ALWAYS clickable, ALWAYS goes to homepage
 */

import { useLocation } from "wouter";

interface LogoProps {
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  variant?: "light" | "dark";
  /** Size: "sm" (1rem), "md" (1.25rem), "lg" (1.5rem) */
  size?: "sm" | "md" | "lg";
  /** Additional className for the container */
  className?: string;
}

/**
 * The official OKAPI Care Network logo
 * Uses Cormorant serif font with specific styling
 *
 * Dark variant (for light backgrounds): teal OKAPI, gray Care Network
 * Light variant (for dark backgrounds): gold OKAPI, cream Care Network
 */
export function Logo({
  variant = "dark",
  size = "md",
  className = ""
}: LogoProps) {
  const [, setLocation] = useLocation();

  const sizeMap = {
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
  };

  const fontSize = sizeMap[size];

  // Colors based on variant
  const colors = variant === "dark"
    ? {
        okapi: "#0d9488",      // teal-600
        network: "#374151",    // gray-700
      }
    : {
        okapi: "#c9a962",      // gold
        network: "#e8e4dc",    // cream
      };

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex items-center gap-1.5 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to homepage"
    >
      <span
        style={{
          fontFamily: "'Cormorant', serif",
          fontWeight: 400,
          color: colors.okapi,
          letterSpacing: "0.1em",
          fontSize
        }}
      >
        OKAPI
      </span>
      <span
        style={{
          fontFamily: "'Cormorant', serif",
          fontWeight: 300,
          fontStyle: "italic",
          color: colors.network,
          fontSize
        }}
      >
        Care Network
      </span>
    </button>
  );
}

/**
 * Logo as a clickable button (for when using wouter's setLocation)
 */
export function LogoButton({
  variant = "dark",
  size = "md",
  onClick,
  className = ""
}: Omit<LogoProps, "linkTo"> & { onClick: () => void }) {
  const sizeMap = {
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
  };

  const fontSize = sizeMap[size];

  const colors = variant === "dark"
    ? {
        okapi: "#0d9488",
        network: "#374151",
      }
    : {
        okapi: "#c9a962",
        network: "#e8e4dc",
      };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${className}`}
    >
      <span
        style={{
          fontFamily: "'Cormorant', serif",
          fontWeight: 400,
          color: colors.okapi,
          letterSpacing: "0.1em",
          fontSize
        }}
      >
        OKAPI
      </span>
      <span
        style={{
          fontFamily: "'Cormorant', serif",
          fontWeight: 300,
          fontStyle: "italic",
          color: colors.network,
          fontSize
        }}
      >
        Care Network
      </span>
    </button>
  );
}
