/**
 * OKAPI Care Network Logo
 * EXACT copy from production owner login page
 * DO NOT MODIFY THIS LOGO WITHOUT EXPLICIT REQUEST
 */

import { Link } from "wouter";

interface LogoProps {
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  variant?: "light" | "dark";
  /** Size: "sm" (1rem), "md" (1.25rem), "lg" (1.5rem) */
  size?: "sm" | "md" | "lg";
  /** Optional link destination, defaults to "/" */
  linkTo?: string;
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
  linkTo = "/",
  className = ""
}: LogoProps) {
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

  const content = (
    <span className={`flex items-center gap-1.5 ${className}`}>
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
    </span>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
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
