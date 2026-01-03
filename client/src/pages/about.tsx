/**
 * About Page - Company story and mission
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Heart, Shield, Users, MapPin, Target, Eye } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-plum-50 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About Okapi Care Network
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Helping Washington families find the right Adult Family Home care since 2024
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Mission Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed mb-4">
            Finding care for someone you love shouldn't be so hard. That's why we created Okapi Care Network
            — to make the search for quality Adult Family Home care in Washington State simple, transparent,
            and stress-free.
          </p>
          <p className="text-lg text-foreground/80 leading-relaxed">
            We believe every family deserves easy access to accurate, up-to-date information about licensed
            care homes. Our platform connects families with vetted Adult Family Homes, providing the tools
            and resources needed to make informed decisions about care.
          </p>
        </section>

        {/* Why AFH Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-sage-700" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Why Adult Family Homes?</h2>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed mb-4">
            Adult Family Homes (AFHs) are licensed residential care facilities that provide room, board,
            and personal care in a home-like setting. Limited to just 2-6 residents, AFHs offer a level
            of personalized attention that larger facilities often can't match.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-ivory rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">Small, Intimate Setting</h3>
              <p className="text-foreground/70">
                With a maximum of 6 residents, caregivers can provide truly personalized attention
                and build meaningful relationships with each person in their care.
              </p>
            </div>
            <div className="bg-ivory rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">Home-Like Environment</h3>
              <p className="text-foreground/70">
                AFHs are real homes in residential neighborhoods, offering comfort and familiarity
                that institutional settings often lack.
              </p>
            </div>
            <div className="bg-ivory rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">DSHS Licensed</h3>
              <p className="text-foreground/70">
                All AFHs in Washington are licensed and regularly inspected by the Department of
                Social and Health Services (DSHS).
              </p>
            </div>
            <div className="bg-ivory rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">Specialized Care</h3>
              <p className="text-foreground/70">
                Many AFHs specialize in specific needs like dementia care, mental health support,
                or developmental disabilities.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-plum-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-plum-700" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Our Values</h2>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Transparency</h3>
                <p className="text-foreground/70">
                  We provide honest, accurate information about every home. Licensing status, inspection
                  history, and real reviews — all in one place.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Compassion</h3>
                <p className="text-foreground/70">
                  We understand this is an emotional journey. Our platform is designed to reduce stress
                  and help families feel confident in their decisions.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Accountability</h3>
                <p className="text-foreground/70">
                  We hold ourselves to the highest standards. Our data comes directly from DSHS and is
                  regularly updated to ensure accuracy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Washington Focus */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-sage-700" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Washington State Focus</h2>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Okapi Care Network is dedicated exclusively to Adult Family Homes in Washington State.
            This focus allows us to provide deep expertise in Washington's unique AFH regulations,
            Medicaid programs (COPES), and local resources. We partner with DSHS to ensure our
            listings are accurate and up-to-date.
          </p>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-plum-50 to-sage-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Have Questions?</h2>
          <p className="text-foreground/70 mb-6">
            Our team is here to help you navigate care options in Washington State.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </section>
      </div>

      <Footer />
    </div>
  );
}
