/**
 * Unified Header Component
 * Clean, minimal header with glassmorphism effect
 */

import { useLocation } from "wouter";
import { LogoInline } from "@/components/shared/logo";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setLocation("/")}>
          <LogoInline />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/directory")}
            className={`text-sm hidden sm:block font-medium transition-colors ${
              location === "/directory" || location.startsWith("/search")
                ? "text-[#4C1D95]"
                : "text-gray-600 hover:text-[#4C1D95]"
            }`}
          >
            Browse All
          </button>
          <button
            onClick={() => setLocation("/owner/login")}
            className="text-sm px-4 py-2 bg-[#4C1D95] text-white rounded-lg hover:bg-[#5B21B6] font-medium transition-colors"
          >
            AFH Owners
          </button>
        </div>
      </div>
    </header>
  );
}
