import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1a14' }}>
      <header className="sticky top-0 z-50 border-b border-amber-900/20" style={{ backgroundColor: 'rgba(13, 26, 20, 0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="px-5 md:px-12 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/">
            <a className="flex items-center gap-1.5 cursor-pointer">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.15em', fontSize: '1.1rem' }}>
                OKAPI
              </span>
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.1rem' }}>
                Care
              </span>
            </a>
          </Link>
          <Link href="/">
            <a className="flex items-center gap-2 text-stone-400 hover:text-amber-200 transition-colors" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </Link>
        </div>
      </header>

      <main className="px-5 md:px-12 py-12 max-w-4xl mx-auto">
        <h1 style={{ fontFamily: "'Cormorant', serif", fontSize: '2.5rem', fontWeight: 400, color: '#e8e4dc', marginBottom: '0.5rem' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#6b7c72', marginBottom: '2rem' }}>
          Last Updated: December 2024
        </p>

        <div className="prose prose-invert max-w-none" style={{ fontFamily: "'Jost', sans-serif", color: '#c4c0b8' }}>
          <p className="text-stone-300 leading-relaxed mb-6">
            Okapi Health, Inc. ("Okapi," "we," "us," or "our") operates the Okapi Care Network platform, including okapicarenetwork.com and related mobile applications and services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.
          </p>

          <p className="text-amber-200 font-medium mb-6">
            By using the Platform, you consent to the collection, storage, use, and disclosure of your information as described in this Privacy Policy.
          </p>

          <Section title="1. Information We Collect">
            <p><strong>Information You Provide:</strong></p>
            <ul>
              <li>Registration information (name, email, phone, password)</li>
              <li>AFH Owner information (license number, facility details, photos)</li>
              <li>Care Seeker information (care needs, preferences, health information)</li>
              <li>Transport booking information (locations, mobility needs)</li>
              <li>Okapi Academy enrollment and completion data</li>
            </ul>
            <p><strong>Information Collected Automatically:</strong></p>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and approximate location</li>
              <li>Pages viewed and actions taken</li>
              <li>Search queries and filter selections</li>
            </ul>
            <p><strong>Information from Third Parties:</strong></p>
            <ul>
              <li>Washington State DSHS public records</li>
              <li>Identity verification services</li>
              <li>Transport provider trip information</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li>Create and manage your account</li>
              <li>Display AFH listings and match Care Seekers with facilities</li>
              <li>Process listing claims and verify ownership</li>
              <li>Facilitate communication between users</li>
              <li>Process payments and subscriptions</li>
              <li>Coordinate transport bookings</li>
              <li>Deliver training courses and track certifications</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. How We Share Your Information">
            <p><strong>With Other Platform Users:</strong> Information in your AFH listing is visible to Care Seekers. Reviews you post are visible to other users.</p>
            <p><strong>With Service Providers:</strong> Payment processors, identity verification services, cloud hosting, analytics providers.</p>
            <p><strong>With Transport Providers:</strong> Trip information necessary for booking.</p>
            <p><strong>As Required by Law:</strong> When required by court order or governmental regulation.</p>
          </Section>

          <Section title="4. DSHS Data and Public Records">
            <p>The Platform displays publicly available information from DSHS regarding licensed Adult Family Homes, including license status, inspection history, and violation records. This is public record displayed to help families make informed decisions. AFH Owners may claim listings and add information but cannot modify DSHS-sourced compliance data.</p>
          </Section>

          <Section title="5. Verification and Background Checks">
            <p>When AFH Owners claim a listing, we verify identity and ownership through phone matching, document verification, and name matching. Background checks may be conducted by third-party consumer reporting agencies subject to the Fair Credit Reporting Act.</p>
            <p className="text-amber-200">Background checks are not 100% accurate and cannot guarantee safety. Users should conduct their own due diligence.</p>
          </Section>

          <Section title="6. Your Privacy Rights">
            <ul>
              <li><strong>Access and Correction:</strong> Update your information through account settings or contact us.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal information.</li>
              <li><strong>Communication Preferences:</strong> Opt out of marketing emails via unsubscribe links.</li>
              <li><strong>California Residents:</strong> Additional rights under CCPA including right to know and request deletion.</li>
              <li><strong>Washington Residents:</strong> Rights under the Washington My Health My Data Act.</li>
            </ul>
          </Section>

          <Section title="7. Data Security and Retention">
            <p>We implement industry-standard security measures including encryption, secure infrastructure, and access controls. We retain information as long as your account is active or as needed for legal compliance. When you close your account, we delete or anonymize your information within a reasonable timeframe.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.</p>
          </Section>

          <Section title="9. Contact Us">
            <p>For questions about this Privacy Policy or to exercise your privacy rights:</p>
            <p>
              Okapi Health, Inc.<br />
              Email: privacy@okapicarenetwork.com<br />
              Website: okapicarenetwork.com
            </p>
          </Section>
        </div>
      </main>

      <footer className="py-8 border-t border-amber-900/20" style={{ backgroundColor: '#0a1410' }}>
        <div className="px-5 md:px-12 max-w-6xl mx-auto text-center">
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72' }}>
            © 2024 Okapi Care Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 400, color: '#c9a962', marginBottom: '1rem' }}>
        {title}
      </h2>
      <div className="text-stone-300 leading-relaxed space-y-3 text-sm">
        {children}
      </div>
    </section>
  );
}
