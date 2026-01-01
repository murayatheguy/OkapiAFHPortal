/**
 * OKAPI Care Network Logo - Unified Brand Component
 * Single source of truth for all logo usage across the application
 */

import { Link } from "wouter";

interface LogoProps {
  variant?: "default" | "white" | "dark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkTo?: string | null;
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  linkTo = "/"
}: LogoProps) {
  const sizes = {
    sm: { container: "gap-2", okapi: "text-lg", care: "text-[9px]" },
    md: { container: "gap-2", okapi: "text-xl", care: "text-[10px]" },
    lg: { container: "gap-3", okapi: "text-2xl", care: "text-xs" },
  };

  const colors = {
    default: {
      okapi: "text-[#4C1D95]",
      care: "text-[#4C1D95]",
    },
    white: {
      okapi: "text-white",
      care: "text-purple-200",
    },
    dark: {
      okapi: "text-white",
      care: "text-gray-400",
    },
  };

  const content = (
    <div className={`flex items-baseline ${sizes[size].container}`}>
      <span className={`font-black tracking-tight ${sizes[size].okapi} ${colors[variant].okapi}`}>
        OKAPI
      </span>
      {showText && (
        <span className={`font-semibold tracking-[0.15em] ${sizes[size].care} ${colors[variant].care}`}>
          CARE NETWORK
        </span>
      )}
    </div>
  );

  if (linkTo === null) {
    return content;
  }

  return (
    <Link href={linkTo}>
      <a className="flex items-center hover:opacity-90 transition-opacity">
        {content}
      </a>
    </Link>
  );
}

/**
 * Stacked Logo variant for footers and larger displays
 */
export function LogoStacked({
  variant = "default",
  size = "md",
  linkTo = "/"
}: Omit<LogoProps, 'showText'>) {
  const sizes = {
    sm: { okapi: "text-xl", care: "text-[10px]", gap: "gap-0" },
    md: { okapi: "text-2xl", care: "text-xs", gap: "gap-0.5" },
    lg: { okapi: "text-4xl", care: "text-sm", gap: "gap-1" },
  };

  const colors = {
    default: "text-[#4C1D95]",
    white: "text-white",
    dark: "text-white",
  };

  const s = sizes[size];
  const color = colors[variant];

  const content = (
    <div className={`flex flex-col ${s.gap}`}>
      <span className={`font-black ${s.okapi} tracking-tight ${color}`}>
        OKAPI
      </span>
      <span className={`font-semibold ${s.care} tracking-[0.2em] ${variant === 'default' ? 'text-[#4C1D95]' : variant === 'white' ? 'text-purple-200' : 'text-gray-400'}`}>
        CARE NETWORK
      </span>
    </div>
  );

  if (linkTo === null) {
    return content;
  }

  return (
    <Link href={linkTo}>
      <a className="hover:opacity-90 transition-opacity">
        {content}
      </a>
    </Link>
  );
}
