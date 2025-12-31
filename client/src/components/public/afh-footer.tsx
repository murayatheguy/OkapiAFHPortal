/**
 * AFH Footer
 * Footer with Washington State resources and AFH-specific links
 */

import { Link } from "wouter";
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Heart,
} from "lucide-react";
import { BRAND, WA_DSHS } from "@/lib/constants";
import { Logo } from "@/components/shared/logo";

export function AFHFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    families: [
      { label: "Find an AFH", href: "/find-care" },
      { label: "Browse Directory", href: "/directory" },
      { label: "Search by City", href: "/search" },
    ],
    owners: [
      { label: "Owner Login", href: "/owner/login" },
      { label: "Owner Dashboard", href: "/owner/dashboard" },
      { label: "Get Started", href: "/owner/setup" },
    ],
    resources: [
      { label: "DSHS Provider Lookup", href: WA_DSHS.providerSearchUrl, external: true },
      { label: "ALTSA Resources", href: WA_DSHS.websiteUrl, external: true },
      { label: "WAC 388-76 Regulations", href: "https://app.leg.wa.gov/wac/default.aspx?cite=388-76", external: true },
      { label: "RCW 70.128 AFH Law", href: "https://app.leg.wa.gov/rcw/default.aspx?cite=70.128", external: true },
    ],
    company: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-[#1e1b4b] text-white">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo variant="light" size="md" />
            </div>
            <p className="text-purple-200 text-sm mb-4">
              Helping families find the right Adult Family Home in Washington State.
            </p>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <MapPin className="h-4 w-4" />
              <span>{BRAND.state} State</span>
            </div>
          </div>

          {/* For Families */}
          <div>
            <h4 className="font-semibold mb-4">For Families</h4>
            <ul className="space-y-2">
              {footerLinks.families.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-purple-200 hover:text-white text-sm transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="font-semibold mb-4">For Owners</h4>
            <ul className="space-y-2">
              {footerLinks.owners.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-purple-200 hover:text-white text-sm transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* WA Resources */}
          <div>
            <h4 className="font-semibold mb-4">WA Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-200 hover:text-white text-sm transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <a className="text-purple-200 hover:text-white text-sm transition-colors">
                        {link.label}
                      </a>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-purple-200 hover:text-white text-sm transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DSHS Disclaimer */}
        <div className="mt-12 pt-8 border-t border-purple-800">
          <div className="bg-purple-900/50 rounded-lg p-4">
            <p className="text-xs text-purple-200">
              <strong className="text-purple-100">Important:</strong> {BRAND.name} provides
              information about licensed Adult Family Homes in {BRAND.state} State. All homes
              listed are licensed by {WA_DSHS.name} ({WA_DSHS.abbreviation}). Licensing status
              should be verified directly with {WA_DSHS.abbreviation}. This platform does not
              endorse any specific home and families should conduct their own due diligence
              when selecting care.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-purple-200">
              &copy; {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-purple-200">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>for {BRAND.state} families</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Compact footer for internal pages
 */
export function AFHFooterCompact() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="default" size="sm" />
            <span className="text-sm text-gray-400">
              &copy; {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy">
              <a className="hover:text-gray-700">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="hover:text-gray-700">Terms</a>
            </Link>
            <Link href="/contact">
              <a className="hover:text-gray-700">Contact</a>
            </Link>
            <a
              href={WA_DSHS.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 flex items-center gap-1"
            >
              {WA_DSHS.abbreviation}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
