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
    sm: "h-10",
    md: "h-14",
    lg: "h-16",
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
    sm: "h-14",
    md: "h-20",
    lg: "h-24",
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
