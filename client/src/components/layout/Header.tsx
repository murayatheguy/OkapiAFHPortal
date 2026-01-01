/**
 * Warm Premium Header Component
 * Clean, trustworthy navigation for 50-65yo caregivers
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, X, Search, Heart, BookOpen, Building2, ChevronRight, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface HeaderProps {
  variant?: "default" | "transparent";
}

const navLinks = [
  { href: "/search", label: "Find Care Homes", icon: Search },
  { href: "/match", label: "Get Matched", icon: Heart },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function Header({ variant = "default" }: HeaderProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTransparent = variant === "transparent";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors ${
        isTransparent
          ? "bg-transparent"
          : "bg-white/98 backdrop-blur-sm border-b border-gray-100 shadow-soft"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-18 items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location === link.href || location.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <a
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    {link.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Phone number for immediate trust */}
            <a
              href="tel:1-800-555-CARE"
              className="flex items-center gap-2 text-base font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden xl:inline">1-800-555-CARE</span>
            </a>

            <div className="h-6 w-px bg-gray-200" />

            <Link href="/owner/login">
              <a className="text-base font-medium text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Owner Portal
              </a>
            </Link>

            <Link href="/match">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 rounded-xl shadow-sm"
              >
                Find Care Today
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-white">
              <SheetHeader className="p-5 border-b border-gray-100">
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
                    const isActive = location === link.href;
                    return (
                      <li key={link.href}>
                        <Link href={link.href}>
                          <a
                            className={`flex items-center gap-3 py-3.5 px-4 rounded-xl text-lg font-medium transition-colors ${
                              isActive
                                ? "bg-plum-50 text-primary"
                                : "text-foreground/80 hover:bg-gray-50"
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            {link.label}
                            <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Phone in mobile */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <a
                    href="tel:1-800-555-CARE"
                    className="flex items-center gap-3 py-3 px-4 text-lg font-medium text-sage-600"
                  >
                    <Phone className="h-5 w-5" />
                    1-800-555-CARE
                  </a>
                </div>
              </nav>

              {/* Mobile CTAs */}
              <div className="p-4 border-t border-gray-100 space-y-3 mt-auto">
                <Link href="/owner/login">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base rounded-xl border-gray-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Building2 className="h-5 w-5 mr-2" />
                    Owner Portal
                  </Button>
                </Link>
                <Link href="/match">
                  <Button
                    className="w-full h-12 text-base bg-primary hover:bg-primary/90 rounded-xl font-semibold"
                    onClick={() => setMobileOpen(false)}
                  >
                    Find Care Today
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
