/**
 * What is an Adult Family Home Section
 * Educational content explaining AFHs to families
 */

import {
  Home,
  Users,
  Heart,
  Shield,
  Check,
  HelpCircle,
  Building2,
  UserCheck,
  Clock,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";

export function WhatIsAFH() {
  const benefits = [
    {
      icon: Home,
      title: "Home-Like Environment",
      description: "AFHs are real homes in residential neighborhoods, not institutional facilities. Residents live in a warm, family atmosphere.",
    },
    {
      icon: Users,
      title: "Small & Personal",
      description: `Maximum of ${BRAND.maxBeds} residents means personalized attention. Caregivers know each resident's preferences, routines, and needs.`,
    },
    {
      icon: Heart,
      title: "24/7 Care",
      description: "Licensed caregivers live on-site or provide round-the-clock supervision. Help is always available when needed.",
    },
    {
      icon: Shield,
      title: "State Licensed",
      description: `All AFHs are licensed and inspected by ${BRAND.regulator}. Regular oversight ensures quality care and safety standards.`,
    },
  ];

  const comparisonPoints = [
    {
      label: "Residents",
      afh: `1-${BRAND.maxBeds}`,
      assistedLiving: "20-200+",
      nursingHome: "50-300+",
    },
    {
      label: "Staff Ratio",
      afh: "1:3 or better",
      assistedLiving: "1:8 to 1:15",
      nursingHome: "1:6 to 1:12",
    },
    {
      label: "Setting",
      afh: "Residential home",
      assistedLiving: "Large facility",
      nursingHome: "Medical facility",
    },
    {
      label: "Monthly Cost",
      afh: "$4,000-$8,000",
      assistedLiving: "$4,500-$10,000",
      nursingHome: "$8,000-$15,000+",
    },
    {
      label: "Meals",
      afh: "Home-cooked",
      assistedLiving: "Cafeteria style",
      nursingHome: "Institutional",
    },
  ];

  const faqs = [
    {
      question: "Who lives in Adult Family Homes?",
      answer: "AFHs serve adults who need help with daily activities like bathing, dressing, medication management, and meals. Residents include seniors, people with dementia, those recovering from illness, and adults with developmental disabilities.",
    },
    {
      question: "How are AFHs licensed?",
      answer: `${BRAND.state} State's ${BRAND.regulator} licenses and inspects all AFHs. Providers must complete training, pass background checks, and meet specific facility requirements. Homes are inspected regularly.`,
    },
    {
      question: "What services do AFHs provide?",
      answer: "Services typically include personal care (bathing, dressing, grooming), medication management, meals, housekeeping, laundry, transportation to appointments, and recreational activities. Many also provide specialized care for dementia, mental health, or developmental disabilities.",
    },
    {
      question: "How much does an AFH cost?",
      answer: "Costs vary based on care level and location, typically ranging from $4,000-$8,000/month. Many residents use Medicaid COPES, VA benefits, or long-term care insurance. Private pay is also common.",
    },
    {
      question: "Can I visit my loved one anytime?",
      answer: "Yes! AFHs encourage family involvement. You can visit during reasonable hours, participate in care planning, and stay connected with your loved one's daily life.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Learn About AFHs
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What is an Adult Family Home?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Adult Family Homes are licensed residential care homes where trained caregivers
            provide personalized care for up to {BRAND.maxBeds} adults in a home setting.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="text-center border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            How AFHs Compare to Other Options
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[600px] bg-white rounded-xl shadow-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 md:p-4 font-medium text-gray-500 min-w-[100px]"></th>
                  <th className="p-3 md:p-4 bg-teal-50 min-w-[140px]">
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Home className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                      <span className="font-bold text-teal-800 text-sm md:text-base">AFH</span>
                    </div>
                  </th>
                  <th className="p-3 md:p-4 min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Building2 className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <span className="font-medium text-gray-600 text-sm md:text-base">Assisted</span>
                    </div>
                  </th>
                  <th className="p-3 md:p-4 min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Building2 className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <span className="font-medium text-gray-600 text-sm md:text-base">Nursing</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonPoints.map((point, index) => (
                  <tr key={point.label} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-3 md:p-4 font-medium text-gray-700 text-sm md:text-base">{point.label}</td>
                    <td className="p-3 md:p-4 text-center bg-teal-50/50 font-semibold text-teal-700 text-sm md:text-base">
                      {point.afh}
                    </td>
                    <td className="p-3 md:p-4 text-center text-gray-600 text-sm md:text-base">{point.assistedLiving}</td>
                    <td className="p-3 md:p-4 text-center text-gray-600 text-sm md:text-base">{point.nursingHome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why Choose AFH */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Families Choose Adult Family Homes
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Personalized attention and care routines",
              "Home-cooked meals tailored to preferences",
              "Consistent caregivers who know your loved one",
              "Quiet, peaceful residential setting",
              "Often more affordable than larger facilities",
              "Family-like relationships with other residents",
              "Flexible visiting hours and family involvement",
              "Direct communication with care providers",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Compact version for landing pages
 */
export function WhatIsAFHCompact() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Left: Content */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              What is an Adult Family Home?
            </h3>
            <p className="text-gray-600 mb-4">
              Adult Family Homes are licensed residential care homes where trained caregivers
              provide personalized care for up to {BRAND.maxBeds} adults in a warm, home-like setting.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500" />
                Maximum {BRAND.maxBeds} residents for personalized attention
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500" />
                State-licensed and regularly inspected
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500" />
                24/7 care in a residential neighborhood
              </li>
            </ul>
          </div>

          {/* Right: Stats */}
          <div className="flex gap-4 md:gap-6">
            <div className="text-center p-4 bg-teal-50 rounded-xl">
              <UserCheck className="h-8 w-8 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-700">1:3</p>
              <p className="text-xs text-teal-600">Staff Ratio</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">24/7</p>
              <p className="text-xs text-blue-600">Care Available</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">30%</p>
              <p className="text-xs text-purple-600">Cost Savings</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
