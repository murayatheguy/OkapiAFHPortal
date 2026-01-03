/**
 * Resources Page - Helpful guides for families and AFH owners
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ExternalLink,
  Users,
  Home,
  Phone,
  BookOpen,
  Shield,
  Heart,
  DollarSign,
  ClipboardList,
  GraduationCap
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("families");

  // Resources for Families
  const familyResources = [
    {
      category: "Getting Started",
      icon: BookOpen,
      items: [
        {
          title: "How to Choose an Adult Family Home",
          description: "A step-by-step guide to finding the right care for your loved one",
          type: "guide",
          link: "#"
        },
        {
          title: "Questions to Ask During a Tour",
          description: "Essential questions to help evaluate potential homes",
          type: "checklist",
          link: "#"
        },
        {
          title: "Understanding Levels of Care",
          description: "Learn about different care levels: personal care, memory care, hospice",
          type: "guide",
          link: "#"
        }
      ]
    },
    {
      category: "Financial Resources",
      icon: DollarSign,
      items: [
        {
          title: "Paying for Adult Family Home Care",
          description: "Overview of payment options: Medicaid, private pay, VA benefits, LTC insurance",
          type: "guide",
          link: "#"
        },
        {
          title: "Washington Medicaid Eligibility",
          description: "Learn if your loved one qualifies for Medicaid coverage",
          type: "external",
          link: "https://www.dshs.wa.gov/altsa/home-and-community-services/medicaid-eligibility"
        },
        {
          title: "VA Aid & Attendance Benefits",
          description: "Benefits for veterans and surviving spouses",
          type: "external",
          link: "https://www.va.gov/pension/aid-attendance-housebound/"
        }
      ]
    },
    {
      category: "DSHS & Regulations",
      icon: Shield,
      items: [
        {
          title: "DSHS AFH Lookup Tool",
          description: "Official state database to verify licenses and inspection reports",
          type: "external",
          link: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx"
        },
        {
          title: "Understanding Inspection Reports",
          description: "How to read and interpret DSHS compliance reports",
          type: "guide",
          link: "#"
        },
        {
          title: "Resident Rights in Washington",
          description: "Know your loved one's legal rights in care facilities",
          type: "external",
          link: "https://www.dshs.wa.gov/altsa/residential-care-services/resident-rights"
        }
      ]
    },
    {
      category: "Support & Advocacy",
      icon: Heart,
      items: [
        {
          title: "Long-Term Care Ombudsman",
          description: "Free advocacy services for residents and families",
          type: "external",
          link: "https://www.waombudsman.org/"
        },
        {
          title: "Caregiver Support Resources",
          description: "Resources for family members navigating care decisions",
          type: "guide",
          link: "#"
        },
        {
          title: "Report a Concern",
          description: "How to report concerns about care quality or safety",
          type: "external",
          link: "https://www.dshs.wa.gov/altsa/residential-care-services/how-file-complaint"
        }
      ]
    }
  ];

  // Resources for Owners
  const ownerResources = [
    {
      category: "Getting Listed",
      icon: Home,
      items: [
        {
          title: "How to Claim Your Listing",
          description: "Step-by-step guide to claiming and managing your AFH profile",
          type: "guide",
          link: "#"
        },
        {
          title: "Optimizing Your Profile",
          description: "Tips for creating an attractive listing that families trust",
          type: "guide",
          link: "#"
        },
        {
          title: "Photo Guidelines",
          description: "Best practices for showcasing your home with photos",
          type: "guide",
          link: "#"
        }
      ]
    },
    {
      category: "Compliance & Licensing",
      icon: ClipboardList,
      items: [
        {
          title: "DSHS Licensing Requirements",
          description: "Official requirements for operating an AFH in Washington",
          type: "external",
          link: "https://www.dshs.wa.gov/altsa/residential-care-services/adult-family-home-licensing"
        },
        {
          title: "Inspection Preparation Checklist",
          description: "Prepare your home for DSHS inspections",
          type: "checklist",
          link: "#"
        },
        {
          title: "Required Training Hours",
          description: "Annual training requirements for AFH providers",
          type: "external",
          link: "https://www.dshs.wa.gov/altsa/training/adult-family-home-training-requirements"
        }
      ]
    },
    {
      category: "Training & Education",
      icon: GraduationCap,
      items: [
        {
          title: "Okapi Academy",
          description: "Complete your required training through our certified program",
          type: "internal",
          link: "/academy"
        },
        {
          title: "Continuing Education Courses",
          description: "Browse CE courses for caregivers and administrators",
          type: "internal",
          link: "/academy/courses"
        },
        {
          title: "Specialty Certifications",
          description: "Dementia care, mental health, and other specialty training",
          type: "internal",
          link: "/academy/certifications"
        }
      ]
    },
    {
      category: "Business Resources",
      icon: FileText,
      items: [
        {
          title: "AFH Association of Washington",
          description: "Join the statewide association for AFH providers",
          type: "external",
          link: "https://www.wa-afh.org/"
        },
        {
          title: "Insurance Requirements",
          description: "Liability insurance requirements for AFH operators",
          type: "guide",
          link: "#"
        },
        {
          title: "Medicaid Provider Enrollment",
          description: "How to become a Medicaid-approved provider",
          type: "external",
          link: "https://www.hca.wa.gov/billers-providers-partners/prior-authorization-claims-and-billing/provider-enrollment"
        }
      ]
    }
  ];

  interface ResourceItem {
    title: string;
    description: string;
    type: string;
    link: string;
  }

  const ResourceCard = ({ resource }: { resource: ResourceItem }) => (
    <a
      href={resource.link}
      target={resource.type === "external" ? "_blank" : undefined}
      rel={resource.type === "external" ? "noopener noreferrer" : undefined}
      className="block"
    >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-medium">{resource.title}</CardTitle>
            {resource.type === "external" ? (
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : resource.type === "checklist" ? (
              <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{resource.description}</CardDescription>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              resource.type === "external"
                ? "bg-blue-100 text-blue-700"
                : resource.type === "checklist"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {resource.type === "external" ? "External Link" :
               resource.type === "checklist" ? "Checklist" :
               resource.type === "internal" ? "Okapi Resource" : "Guide"}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );

  interface ResourceSection {
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    items: ResourceItem[];
  }

  const ResourceSectionComponent = ({ resources }: { resources: ResourceSection[] }) => (
    <div className="space-y-8">
      {resources.map((section, idx) => (
        <div key={idx}>
          <div className="flex items-center gap-2 mb-4">
            <section.icon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{section.category}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.items.map((item, itemIdx) => (
              <ResourceCard key={itemIdx} resource={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Resources</h1>
          <p className="text-lg text-foreground/70 max-w-2xl">
            Helpful guides, checklists, and links for families searching for care
            and Adult Family Home owners managing their homes.
          </p>
        </div>
      </div>

      {/* Prominent Section Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-10 h-auto p-2 bg-muted/50 rounded-2xl">
            <TabsTrigger
              value="families"
              className="flex items-center justify-center gap-3 py-5 px-6 text-lg font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Users className="h-6 w-6" />
              For Families
            </TabsTrigger>
            <TabsTrigger
              value="owners"
              className="flex items-center justify-center gap-3 py-5 px-6 text-lg font-semibold rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Home className="h-6 w-6" />
              For Owners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="families">
            <ResourceSectionComponent resources={familyResources} />
          </TabsContent>

          <TabsContent value="owners">
            <ResourceSectionComponent resources={ownerResources} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-foreground/70 mb-6">
              Our team is here to help you navigate care options in Washington State.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Phone className="h-5 w-5" />
              <span className="text-lg font-medium">1-800-555-CARE</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
