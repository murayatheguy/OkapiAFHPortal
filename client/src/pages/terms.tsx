import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                Care Network
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
          Terms of Use
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#6b7c72', marginBottom: '2rem' }}>
          Last Updated: December 2024
        </p>

        <div className="prose prose-invert max-w-none" style={{ fontFamily: "'Jost', sans-serif", color: '#c4c0b8' }}>
          <p className="text-stone-300 leading-relaxed mb-6">
            Welcome to the Okapi Care Network. These Terms of Use ("Terms") govern your access to and use of okapicarenetwork.com, our mobile applications, and all related services (collectively, the "Platform") operated by Okapi Health, Inc. ("Okapi," "we," "us," or "our").
          </p>

          <p className="text-amber-200 font-medium mb-6">
            BY ACCESSING OR USING THE PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE PLATFORM.
          </p>

          <Section title="1. Description of Services">
            <p>The Okapi Care Network is an integrated platform that connects families seeking care with licensed Adult Family Homes (AFHs) in Washington State. Our services include:</p>
            <ul>
              <li><strong>AFH Care Network:</strong> A searchable directory of licensed Adult Family Homes featuring DSHS compliance data, owner-managed profiles, photos, availability, and reviews.</li>
              <li><strong>Healthcare Partner Portal:</strong> A discharge planning tool for hospitals, clinics, and healthcare facilities.</li>
              <li><strong>Transport Marketplace:</strong> A booking platform connecting users with non-emergency medical transportation (NEMT) providers.</li>
              <li><strong>Okapi Academy:</strong> An online learning management system offering DSHS-compliant training courses for caregivers.</li>
            </ul>
            <p className="text-amber-200 mt-4">
              IMPORTANT: Okapi does not employ any caregiver, operate any care facility, or provide any care services directly. We are a technology platform that facilitates connections between users.
            </p>
          </Section>

          <Section title="2. Eligibility and Account Registration">
            <p>To use the Platform, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding agreements</li>
              <li>Provide accurate and complete registration information</li>
              <li>Not be prohibited from using the Platform under applicable laws</li>
            </ul>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </Section>

          <Section title="3. User Types and Responsibilities">
            <p><strong>Care Seekers:</strong> Use the Platform only for legitimate care-seeking purposes and conduct your own due diligence before selecting any care facility.</p>
            <p><strong>AFH Owners:</strong> Represent and warrant that you hold a valid DSHS license and all information you provide is accurate.</p>
            <p><strong>Healthcare Partners:</strong> Use the Platform for legitimate discharge planning and protect patient privacy in accordance with HIPAA.</p>
            <p><strong>Transport Users:</strong> Provide accurate information about passenger mobility needs and be present at scheduled pickup times.</p>
          </Section>

          <Section title="4. AFH Listing Claims and Verification">
            <p>AFH listings are initially created using publicly available DSHS data. AFH Owners may claim their listings to add additional information, photos, and manage their profiles through our verification process.</p>
          </Section>

          <Section title="5. DSHS Data and Compliance Information">
            <p>The Platform displays publicly available information from the Washington State Department of Social and Health Services (DSHS). While we strive to keep data current, we cannot guarantee real-time accuracy. Users should verify current licensing and compliance status directly with DSHS.</p>
          </Section>

          <Section title="6. Subscriptions and Payments">
            <p>We offer various subscription tiers for AFH Owners. Paid subscriptions are billed in advance. You may cancel at any time through your account settings, effective at the end of the current billing period.</p>
          </Section>

          <Section title="7. Transport Booking Services">
            <p>Transportation services are provided by independent third-party NEMT providers, not by Okapi. We facilitate booking but are not a party to the transportation contract. Okapi is not responsible for any injuries, damages, delays, or issues arising from transportation services.</p>
          </Section>

          <Section title="8. Okapi Academy Training Services">
            <p>Okapi Academy provides online training courses designed to meet DSHS requirements. Course content is for educational purposes only. It is your responsibility to verify that courses meet your specific licensing or employment requirements.</p>
          </Section>

          <Section title="9. User Content and Conduct">
            <p>You retain ownership of content you submit but grant us a license to use it in connection with the Platform. You may not submit false, misleading, defamatory, or illegal content or interfere with the Platform's operation.</p>
          </Section>

          <Section title="10. Disclaimers and Limitations">
            <p className="text-amber-200">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. OKAPI DOES NOT GUARANTEE THE QUALITY, SAFETY, OR SUITABILITY OF ANY CARE FACILITY. YOU ARE SOLELY RESPONSIBLE FOR EVALUATING AND SELECTING CARE FACILITIES.
            </p>
          </Section>

          <Section title="11. Contact Information">
            <p>For questions about these Terms, contact us at:</p>
            <p>
              Okapi Health, Inc.<br />
              Email: legal@okapicarenetwork.com<br />
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
