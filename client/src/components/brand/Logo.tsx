/**
 * OKAPI Care Network Logo - Warm Premium Brand Component
 * Deep plum primary with sage accents for trust and warmth
 */

import { Link } from "wouter";

interface LogoProps {
  variant?: "default" | "white" | "dark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkTo?: string | null;
}

// Icon mark - abstract caring hands / home shape
function IconMark({ className, variant }: { className?: string; variant: "default" | "white" | "dark" }) {
  const colors = {
    default: { primary: "hsl(262 62% 34%)", accent: "hsl(154 28% 45%)" },
    white: { primary: "#ffffff", accent: "rgba(255,255,255,0.7)" },
    dark: { primary: "#ffffff", accent: "rgba(255,255,255,0.6)" },
  };
  const c = colors[variant];

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Home/heart shape */}
      <path
        d="M16 4L4 14v14a2 2 0 002 2h20a2 2 0 002-2V14L16 4z"
        fill={c.primary}
        opacity="0.1"
      />
      {/* Roof accent */}
      <path
        d="M16 4L4 14h24L16 4z"
        fill={c.primary}
      />
      {/* Caring hands heart */}
      <path
        d="M16 12c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5L16 23l5.5-5.5c1.5-1.5 1.5-4 0-5.5s-4-1.5-5.5 0z"
        fill={c.accent}
      />
    </svg>
  );
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  linkTo = "/"
}: LogoProps) {
  const sizes = {
    sm: { icon: "w-6 h-6", container: "gap-2", okapi: "text-lg", care: "text-[9px]" },
    md: { icon: "w-8 h-8", container: "gap-2.5", okapi: "text-xl", care: "text-[10px]" },
    lg: { icon: "w-10 h-10", container: "gap-3", okapi: "text-2xl", care: "text-xs" },
  };

  const colors = {
    default: {
      okapi: "text-plum-600",
      care: "text-sage-600",
    },
    white: {
      okapi: "text-white",
      care: "text-white/70",
    },
    dark: {
      okapi: "text-white",
      care: "text-white/60",
    },
  };

  const content = (
    <div className={`flex items-center ${sizes[size].container}`}>
      <IconMark className={sizes[size].icon} variant={variant} />
      <div className="flex flex-col -space-y-0.5">
        <span className={`font-bold tracking-tight leading-none ${sizes[size].okapi} ${colors[variant].okapi}`}>
          Okapi
        </span>
        {showText && (
          <span className={`font-medium tracking-wide leading-none ${sizes[size].care} ${colors[variant].care}`}>
            Care Network
          </span>
        )}
      </div>
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
    sm: { icon: "w-8 h-8", okapi: "text-xl", care: "text-[10px]", gap: "gap-1" },
    md: { icon: "w-10 h-10", okapi: "text-2xl", care: "text-xs", gap: "gap-1.5" },
    lg: { icon: "w-14 h-14", okapi: "text-4xl", care: "text-sm", gap: "gap-2" },
  };

  const colors = {
    default: { okapi: "text-plum-600", care: "text-sage-600" },
    white: { okapi: "text-white", care: "text-white/70" },
    dark: { okapi: "text-white", care: "text-white/60" },
  };

  const s = sizes[size];
  const c = colors[variant];

  const content = (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <IconMark className={s.icon} variant={variant} />
      <div className="flex flex-col items-center -space-y-0.5">
        <span className={`font-bold tracking-tight leading-none ${s.okapi} ${c.okapi}`}>
          Okapi
        </span>
        <span className={`font-medium tracking-wide leading-none ${s.care} ${c.care}`}>
          Care Network
        </span>
      </div>
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
