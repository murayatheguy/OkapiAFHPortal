/**
 * Unified Header Component
 * Consistent navigation across all public pages
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, X, Search, Heart, Building2, BookOpen, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface HeaderProps {
  variant?: "default" | "transparent";
}

const navLinks = [
  { href: "/search", label: "Find Homes", icon: Search },
  { href: "/match", label: "Get Matched", icon: Heart },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function Header({ variant = "default" }: HeaderProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTransparent = variant === "transparent";

  return (
    <header className={`sticky top-0 z-50 w-full border-b ${isTransparent ? "bg-transparent border-transparent" : "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-gray-200"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-base font-medium transition-colors hover:text-[#4C1D95] ${
                    location === link.href || location.startsWith(link.href + "/")
                      ? "text-[#4C1D95]"
                      : "text-gray-700"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/owner/login">
              <a className="text-base font-medium text-gray-700 hover:text-[#4C1D95] flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Owner Login
              </a>
            </Link>
            <Link href="/owner/login">
              <Button className="bg-[#4C1D95] hover:bg-[#5B21B6] text-base px-5 h-10">
                List Your Home
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center justify-between">
                  <Logo size="sm" linkTo={null} />
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Mobile Nav */}
              <nav className="flex-1 p-4">
                <ul className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.href}>
                        <Link href={link.href}>
                          <a
                            className={`flex items-center gap-3 py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                              location === link.href
                                ? "bg-purple-50 text-[#4C1D95]"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            {link.label}
                            <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Mobile CTAs */}
              <div className="p-4 border-t space-y-3 mt-auto">
                <Link href="/owner/login">
                  <Button variant="outline" className="w-full h-12 text-base" onClick={() => setMobileOpen(false)}>
                    <Building2 className="h-5 w-5 mr-2" />
                    Owner Login
                  </Button>
                </Link>
                <Link href="/owner/login">
                  <Button className="w-full h-12 text-base bg-[#4C1D95] hover:bg-[#5B21B6]" onClick={() => setMobileOpen(false)}>
                    List Your Home
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
