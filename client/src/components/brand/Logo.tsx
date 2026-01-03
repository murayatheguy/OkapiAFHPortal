/**
 * OKAPI Care Network Logo - Image-based Brand Component
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
  linkTo = "/"
}: LogoProps) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  const content = (
    <img
      src="/Logo.png"
      alt="Okapi Care Network"
      className={`${sizes[size]} w-auto object-contain`}
    />
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
    sm: "h-12",
    md: "h-16",
    lg: "h-20",
  };

  const content = (
    <img
      src="/Logo.png"
      alt="Okapi Care Network"
      className={`${sizes[size]} w-auto object-contain`}
    />
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
