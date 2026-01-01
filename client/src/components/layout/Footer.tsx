/**
 * Unified Footer Component
 * Consistent footer across all public pages
 */

import { Link } from "wouter";
import { Phone, Mail, MapPin, ExternalLink, Heart } from "lucide-react";
import { LogoStacked } from "@/components/brand/Logo";

const footerLinks = {
  families: [
    { label: "Search Homes", href: "/search" },
    { label: "Get Matched", href: "/match" },
    { label: "What is an AFH?", href: "/resources/what-is-afh" },
    { label: "Cost Guide", href: "/resources/cost-guide" },
    { label: "Tour Checklist", href: "/resources/tour-checklist" },
  ],
  owners: [
    { label: "Owner Login", href: "/owner/login" },
    { label: "List Your Home", href: "/owner/login" },
    { label: "Owner Dashboard", href: "/owner/dashboard" },
  ],
  resources: [
    { label: "DSHS Provider Lookup", href: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx", external: true },
    { label: "ALTSA Resources", href: "https://www.dshs.wa.gov/altsa", external: true },
    { label: "WAC 388-76 Regulations", href: "https://app.leg.wa.gov/wac/default.aspx?cite=388-76", external: true },
  ],
  cities: [
    { label: "Seattle", href: "/search?city=Seattle" },
    { label: "Tacoma", href: "/search?city=Tacoma" },
    { label: "Bellevue", href: "/search?city=Bellevue" },
    { label: "Spokane", href: "/search?city=Spokane" },
    { label: "Everett", href: "/search?city=Everett" },
    { label: "All Cities", href: "/search" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1e1b4b] text-white">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <LogoStacked variant="white" size="md" linkTo="/" />
            </div>
            <p className="text-purple-200 text-sm mb-4">
              Helping Washington families find the right Adult Family Home care.
            </p>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <MapPin className="h-4 w-4" />
              <span>Washington State</span>
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

          {/* Browse by City */}
          <div>
            <h4 className="font-semibold mb-4">Browse by City</h4>
            <ul className="space-y-2">
              {footerLinks.cities.map((link) => (
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
              <strong className="text-purple-100">Important:</strong> Okapi Care Network provides
              information about licensed Adult Family Homes in Washington State. All homes
              listed are licensed by the Washington State Department of Social and Health Services (DSHS).
              Licensing status should be verified directly with DSHS. This platform does not
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
              &copy; {currentYear} Okapi Care Network. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-purple-200">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400 fill-red-400" />
              <span>for Washington families</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy">
                <a className="text-purple-200 hover:text-white transition-colors">Privacy</a>
              </Link>
              <Link href="/terms">
                <a className="text-purple-200 hover:text-white transition-colors">Terms</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Compact footer for secondary pages
 */
export function FooterCompact() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoStacked variant="default" size="sm" linkTo="/" />
            <span className="text-sm text-gray-400 ml-2">
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
            <a
              href="https://www.dshs.wa.gov/altsa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 flex items-center gap-1"
            >
              DSHS
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
