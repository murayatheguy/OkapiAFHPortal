/**
 * OKAPI Care Network Logo - Image-based Component
 */

import { useLocation } from "wouter";

interface LogoProps {
  variant?: "default" | "light" | "compact";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ variant = "default", className = "", size = "md" }: LogoProps) {
  const [, setLocation] = useLocation();

  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to homepage"
    >
      <img
        src="/Logo.png"
        alt="Okapi Care Network"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </button>
  );
}

/**
 * Inline logo for headers (single line)
 */
export function LogoInline({ variant = "default", className = "" }: { variant?: "default" | "light"; className?: string }) {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/")}
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to homepage"
    >
      <img
        src="/Logo.png"
        alt="Okapi Care Network"
        className="h-8 w-auto object-contain"
      />
    </button>
  );
}

/**
 * Logo as a clickable button
 * @deprecated Use Logo or LogoInline instead
 */
export function LogoButton({
  variant = "default",
  size = "md",
  onClick,
  className = ""
}: { variant?: "default" | "light"; size?: "sm" | "md" | "lg"; onClick: () => void; className?: string }) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
    >
      <img
        src="/Logo.png"
        alt="Okapi Care Network"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </button>
  );
}
