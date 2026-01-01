/**
 * Warm Premium Footer Component
 * Deep plum background with good contrast for accessibility
 */

import { Link } from "wouter";
import { Phone, Mail, MapPin, ExternalLink, Heart, Shield } from "lucide-react";
import { LogoStacked } from "@/components/brand/Logo";

const footerLinks = {
  families: [
    { label: "Find Care Homes", href: "/search" },
    { label: "Get Matched", href: "/match" },
    { label: "What is an AFH?", href: "/resources/what-is-afh" },
    { label: "Cost Guide", href: "/resources/cost-guide" },
    { label: "Tour Checklist", href: "/resources/tour-checklist" },
  ],
  owners: [
    { label: "Owner Portal", href: "/owner/login" },
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
    <footer className="bg-gradient-to-b from-plum-800 to-plum-900 text-white">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <LogoStacked variant="white" size="md" linkTo="/" />
            </div>
            <p className="text-white/70 text-base leading-relaxed mb-5">
              Helping Washington families find the right Adult Family Home care.
            </p>
            <div className="flex items-center gap-2 text-base text-white/60">
              <MapPin className="h-4 w-4" />
              <span>Washington State</span>
            </div>
          </div>

          {/* For Families */}
          <div>
            <h4 className="font-semibold text-lg mb-5">For Families</h4>
            <ul className="space-y-3">
              {footerLinks.families.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-white/70 hover:text-white text-base transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="font-semibold text-lg mb-5">For Owners</h4>
            <ul className="space-y-3">
              {footerLinks.owners.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-white/70 hover:text-white text-base transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* WA Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-5">WA Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white text-base transition-colors flex items-center gap-1.5"
                    >
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <a className="text-white/70 hover:text-white text-base transition-colors">
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
            <h4 className="font-semibold text-lg mb-5">Browse by City</h4>
            <ul className="space-y-3">
              {footerLinks.cities.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a className="text-white/70 hover:text-white text-base transition-colors">
                      {link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DSHS Disclaimer */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-5 flex items-start gap-4">
            <Shield className="h-6 w-6 text-sage-400 shrink-0 mt-0.5" />
            <p className="text-sm text-white/60 leading-relaxed">
              <strong className="text-white/80">Important:</strong> Okapi Care Network provides
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
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-base text-white/60">
              &copy; {currentYear} Okapi Care Network. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-base text-white/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400 fill-red-400" />
              <span>for Washington families</span>
            </div>
            <div className="flex items-center gap-6 text-base">
              <Link href="/privacy">
                <a className="text-white/60 hover:text-white transition-colors">Privacy</a>
              </Link>
              <Link href="/terms">
                <a className="text-white/60 hover:text-white transition-colors">Terms</a>
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
    <footer className="bg-ivory border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <LogoStacked variant="default" size="sm" linkTo="/" />
            <span className="text-base text-foreground/50 ml-2">
              &copy; {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-6 text-base text-foreground/60">
            <Link href="/privacy">
              <a className="hover:text-foreground transition-colors">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="hover:text-foreground transition-colors">Terms</a>
            </Link>
            <a
              href="https://www.dshs.wa.gov/altsa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              DSHS
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
