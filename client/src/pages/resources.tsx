/**
 * Resources Page - Helpful guides for families searching for care
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ExternalLink,
  Users,
  Phone,
  BookOpen,
  Shield,
  Heart,
  DollarSign,
  ClipboardList
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ResourcesPage() {
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
               resource.type === "checklist" ? "Checklist" : "Guide"}
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
    <div className="space-y-10">
      {resources.map((section, idx) => (
        <div key={idx}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <section.icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{section.category}</h2>
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

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-plum-50 to-background border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Resources for Families</h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-2xl">
            Helpful guides, checklists, and links to help you find the right care
            for your loved one in Washington State.
          </p>
        </div>
      </div>

      {/* Resources Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <ResourceSectionComponent resources={familyResources} />
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Need Help Finding Care?</h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              Our team is here to help you navigate care options in Washington State.
              Call us or use our care matching tool to find the right home.
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
