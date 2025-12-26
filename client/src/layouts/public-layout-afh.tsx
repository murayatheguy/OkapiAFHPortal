/**
 * Public Layout for AFH Pages
 * Consistent layout with navigation and footer for public-facing pages
 */

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AFHFooter, AFHFooterCompact } from "@/components/public/afh-footer";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PublicLayoutAFHProps {
  children: ReactNode;
  showFullFooter?: boolean;
}

export function PublicLayoutAFH({ children, showFullFooter = true }: PublicLayoutAFHProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Find Care", href: "/find-care" },
    { label: "Directory", href: "/directory" },
    { label: "For Owners", href: "/owner/login" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2">
                <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">O</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-gray-900">{BRAND.name}</span>
                  <p className="text-xs text-gray-500">{BRAND.state} AFHs</p>
                </div>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "text-teal-600"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={() => setLocation("/find-care")}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setLocation("/owner/login")}
              >
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Owner Login</span>
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation(link.href);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "block px-3 py-2 text-sm font-medium rounded-lg",
                      isActive(link.href)
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {showFullFooter ? <AFHFooter /> : <AFHFooterCompact />}
    </div>
  );
}
