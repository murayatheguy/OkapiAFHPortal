/**
 * FAQ Page - Frequently Asked Questions about Okapi Care Network
 */

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, Search, Users, Building2, Shield, CreditCard, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  questions: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "families",
    title: "For Families",
    icon: Users,
    questions: [
      {
        question: "How do I search for an Adult Family Home?",
        answer: "You can search for AFHs using our search page. Enter a city, ZIP code, or use your current location. You can filter by care specialties, payment options, and other criteria to find homes that match your needs."
      },
      {
        question: "Is Okapi Care Network free to use?",
        answer: "Yes! Searching for care homes and accessing facility information is completely free for families. We never charge families for using our platform."
      },
      {
        question: "How is your facility data sourced?",
        answer: "All our listings come from official Washington State DSHS (Department of Social and Health Services) records. We sync this data regularly to ensure accuracy and include licensing status, inspection history, and compliance information."
      },
      {
        question: "What is the Match Wizard?",
        answer: "Our Match Wizard is a guided questionnaire that helps you find the right AFH based on your specific needs. Answer questions about location, care requirements, budget, and preferences, and we'll recommend homes that match your criteria."
      },
      {
        question: "Can I tour a facility before making a decision?",
        answer: "Absolutely! We encourage families to visit facilities in person. You can contact homes directly through our platform to schedule tours. Many homes offer virtual tours as well."
      },
      {
        question: "What's the difference between AFH and Assisted Living?",
        answer: "Adult Family Homes (AFH) are residential homes that care for 2-6 residents, offering a more intimate, home-like setting. Assisted Living Facilities (ALF) are larger facilities that can house many more residents. Both are licensed and regulated, but AFHs typically provide more personalized, one-on-one care."
      }
    ]
  },
  {
    id: "owners",
    title: "For AFH Owners",
    icon: Building2,
    questions: [
      {
        question: "How do I claim my facility listing?",
        answer: "Visit our Owner Portal and click 'Claim Your Listing'. You'll need to verify your identity and ownership through a multi-step verification process. Once verified, you can manage your listing, update information, and respond to inquiries."
      },
      {
        question: "Is there a cost to list my facility?",
        answer: "Basic listings are free for all licensed AFH owners. We also offer premium features and enhanced visibility options for owners who want to showcase their facilities more prominently."
      },
      {
        question: "How do I update my facility information?",
        answer: "After claiming your listing, log into the Owner Portal to update your facility details, photos, services offered, and contact information. Changes are reviewed and typically published within 24 hours."
      },
      {
        question: "Can I manage multiple facilities?",
        answer: "Yes! Our Owner Portal supports multi-facility management. You can claim and manage multiple AFH listings from a single account, making it easy to oversee all your properties."
      },
      {
        question: "How do I respond to family inquiries?",
        answer: "When families contact you through our platform, you'll receive notifications via email and in your Owner Portal dashboard. You can respond directly through our messaging system or contact them via the information they provide."
      }
    ]
  },
  {
    id: "licensing",
    title: "Licensing & Compliance",
    icon: Shield,
    questions: [
      {
        question: "What does DSHS licensing mean?",
        answer: "DSHS (Department of Social and Health Services) licensing means a facility has met Washington State's requirements for operating an Adult Family Home. This includes background checks, facility inspections, caregiver training, and ongoing compliance monitoring."
      },
      {
        question: "How can I view a facility's inspection history?",
        answer: "Each facility listing includes a compliance section showing recent inspections and any citations. For complete inspection records, you can also visit the official DSHS website or request records directly from the department."
      },
      {
        question: "What happens if a facility has violations?",
        answer: "We display all public compliance information so families can make informed decisions. Minor violations are common and typically corrected quickly. Facilities with serious or repeated violations may face penalties, required corrective actions, or in extreme cases, license revocation."
      },
      {
        question: "How often is compliance data updated?",
        answer: "We sync with DSHS records daily to ensure our compliance information is current. Any changes to licensing status, new inspections, or citations are reflected on our platform within 24 hours of being published by DSHS."
      }
    ]
  },
  {
    id: "payment",
    title: "Payment & Insurance",
    icon: CreditCard,
    questions: [
      {
        question: "Does Medicaid cover AFH care?",
        answer: "Yes, many AFHs accept Medicaid through Washington's COPES (Community Options Program Entry System) program. Our search filters allow you to find homes that accept Medicaid. Eligibility is determined by DSHS based on care needs and financial criteria."
      },
      {
        question: "What is the average cost of AFH care?",
        answer: "Costs vary based on location, level of care needed, and amenities. In Washington State, private pay rates typically range from $4,000 to $8,000 per month. Many homes accept a combination of private pay, Medicaid, and long-term care insurance."
      },
      {
        question: "Does Medicare cover AFH care?",
        answer: "Medicare generally does not cover long-term residential care in Adult Family Homes. However, Medicare may cover specific medical services like skilled nursing visits or therapy provided at the home. Most families use a combination of private pay, Medicaid, and long-term care insurance."
      },
      {
        question: "Do AFHs accept long-term care insurance?",
        answer: "Many AFHs accept long-term care insurance. We recommend contacting your insurance provider and the specific facility to understand coverage details and any required documentation."
      }
    ]
  },
  {
    id: "general",
    title: "General Questions",
    icon: HelpCircle,
    questions: [
      {
        question: "Why is it called 'Okapi'?",
        answer: "The okapi is a unique animal known for being gentle, elusive, and caring for its young with exceptional dedication. These qualities reflect our mission: to provide gentle guidance to families navigating the often-overwhelming process of finding quality care for their loved ones."
      },
      {
        question: "Does Okapi operate outside of Washington State?",
        answer: "Currently, Okapi Care Network focuses exclusively on Washington State. This allows us to provide deep expertise in Washington's AFH regulations, Medicaid programs, and local resources. We may expand to other states in the future."
      },
      {
        question: "How do I report incorrect information?",
        answer: "If you notice incorrect information on a listing, please contact us through our Contact page. We investigate all reports and update information as needed. Facility owners can also update their own listings through the Owner Portal."
      },
      {
        question: "Can I save facilities to compare later?",
        answer: "Yes! Create a free account to save favorite facilities, compare options side-by-side, and receive updates about homes you're interested in. Your saved searches and preferences are stored for easy access."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-plum-50 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
            Find answers to common questions about Adult Family Homes and using Okapi Care Network
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {faqCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-foreground/70 hover:border-primary hover:text-primary transition-colors"
            >
              <category.icon className="h-4 w-4" />
              {category.title}
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {filteredCategories.map((category) => (
            <section key={category.id} id={category.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{category.title}</h2>
              </div>

              <div className="space-y-3">
                {category.questions.map((item, index) => {
                  const isOpen = openItems.has(`${category.id}-${index}`);
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(category.id, index)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-foreground pr-4">{item.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-foreground/40 flex-shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0">
                          <p className="text-foreground/70 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Still Have Questions */}
        <section className="mt-16 bg-gradient-to-r from-plum-50 to-sage-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Still Have Questions?</h2>
          <p className="text-foreground/70 mb-6">
            Can't find what you're looking for? Our team is here to help.
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
