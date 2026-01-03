/**
 * Washington State Resources Content
 *
 * Structured data for the /resources page.
 * Keep card descriptions concise (1-2 lines).
 * TODO: Create detail pages for guides/checklists with expanded content.
 */

// ============================================================================
// Types
// ============================================================================

export type BadgeType = "Guide" | "Checklist" | "External Link";

export type IconKey =
  | "book-open"
  | "dollar-sign"
  | "shield"
  | "heart"
  | "users"
  | "clipboard-list"
  | "file-text"
  | "phone";

export interface ResourceCard {
  id: string;
  title: string;
  description: string;
  badge: BadgeType;
  /** Internal route or external URL */
  href?: string;
  /** If true, opens in new tab with external link icon */
  isExternal?: boolean;
  /** Optional bullet points for expanded view (future use) */
  bulletPoints?: string[];
  /** Short "why this matters" tagline (future use) */
  whyThisMatters?: string;
}

export interface ResourceSection {
  id: string;
  title: string;
  iconKey: IconKey;
  /** Optional WA-specific note for the section */
  waNote?: string;
  cards: ResourceCard[];
}

export interface ResourcesPageContent {
  /** Page-level WA indicator */
  regionLabel: string;
  regionSublabel: string;
  heroTitle: string;
  heroDescription: string;
  sections: ResourceSection[];
  ctaTitle: string;
  ctaDescription: string;
  ctaPhone: string;
}

// ============================================================================
// Washington State Content
// ============================================================================

export const waResourcesContent: ResourcesPageContent = {
  regionLabel: "Washington State",
  regionSublabel: "Resources specific to WA state regulations and programs",
  heroTitle: "Resources for Families",
  heroDescription: "Helpful guides, checklists, and official links to help you find the right care for your loved one in Washington State.",

  sections: [
    // -------------------------------------------------------------------------
    // Getting Started
    // -------------------------------------------------------------------------
    {
      id: "getting-started",
      title: "Getting Started",
      iconKey: "book-open",
      cards: [
        {
          id: "choose-afh",
          title: "How to Choose an Adult Family Home",
          description: "A step-by-step guide to evaluating AFHs based on care needs, location, and budget.",
          badge: "Guide",
          href: "/resources/choosing-afh",
          whyThisMatters: "The right fit impacts quality of life for years to come.",
          bulletPoints: [
            "Assess your loved one's care level needs",
            "Consider location and family accessibility",
            "Evaluate home environment and staff ratios",
            "Review licensing and inspection history"
          ]
          // TODO: Create /resources/choosing-afh detail page
        },
        {
          id: "tour-questions",
          title: "Questions to Ask During a Tour",
          description: "Essential questions covering staff, daily routines, meals, and emergency protocols.",
          badge: "Checklist",
          href: "/resources/tour-checklist",
          bulletPoints: [
            "What is the caregiver-to-resident ratio?",
            "How are medications managed?",
            "What activities are offered daily?",
            "How do you handle medical emergencies?"
          ]
          // TODO: Create /resources/tour-checklist detail page with printable PDF
        },
        {
          id: "care-levels",
          title: "Understanding Levels of Care",
          description: "Learn the difference between personal care, memory care, skilled nursing, and hospice.",
          badge: "Guide",
          href: "/resources/care-levels",
          whyThisMatters: "Matching care level to needs ensures safety and appropriate support."
          // TODO: Create /resources/care-levels detail page
        }
      ]
    },

    // -------------------------------------------------------------------------
    // Financial Resources
    // -------------------------------------------------------------------------
    {
      id: "financial",
      title: "Financial Resources",
      iconKey: "dollar-sign",
      waNote: "Washington has robust Medicaid programs for long-term care",
      cards: [
        {
          id: "payment-options",
          title: "Paying for Adult Family Home Care",
          description: "Overview of payment options: Medicaid, private pay, VA benefits, and long-term care insurance.",
          badge: "Guide",
          href: "/resources/payment-options",
          bulletPoints: [
            "Washington Medicaid (COPES program)",
            "Private pay and sliding scale options",
            "Veterans benefits (Aid & Attendance)",
            "Long-term care insurance claims"
          ]
          // TODO: Create /resources/payment-options detail page
        },
        {
          id: "medicaid-eligibility",
          title: "Washington Medicaid (COPES) Eligibility",
          description: "Check if your loved one qualifies for Washington's Community Options Program Entry System.",
          badge: "External Link",
          href: "https://www.dshs.wa.gov/altsa/home-and-community-services/medicaid-eligibility",
          isExternal: true,
          whyThisMatters: "COPES covers most AFH costs for eligible Washington residents."
        },
        {
          id: "va-benefits",
          title: "VA Aid & Attendance Benefits",
          description: "Monthly benefits for veterans and surviving spouses needing daily assistance.",
          badge: "External Link",
          href: "https://www.va.gov/pension/aid-attendance-housebound/",
          isExternal: true,
          whyThisMatters: "Can provide $1,500-$2,500+/month toward care costs."
        }
      ]
    },

    // -------------------------------------------------------------------------
    // DSHS & Regulations
    // -------------------------------------------------------------------------
    {
      id: "dshs-regulations",
      title: "DSHS & Regulations",
      iconKey: "shield",
      waNote: "All WA Adult Family Homes are licensed and inspected by DSHS",
      cards: [
        {
          id: "dshs-lookup",
          title: "DSHS AFH Lookup Tool",
          description: "Official state database to verify licenses, capacity, and inspection history.",
          badge: "External Link",
          href: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx",
          isExternal: true,
          whyThisMatters: "Always verify a home's license status before visiting."
        },
        {
          id: "inspection-reports",
          title: "Understanding Inspection Reports",
          description: "How to read DSHS compliance reports and what citation types mean.",
          badge: "Guide",
          href: "/resources/inspection-reports",
          bulletPoints: [
            "Types of inspections (initial, renewal, complaint)",
            "Citation severity levels explained",
            "How facilities correct violations",
            "Red flags to watch for"
          ]
          // TODO: Create /resources/inspection-reports detail page
        },
        {
          id: "resident-rights",
          title: "Resident Rights in Washington",
          description: "Know your loved one's legal rights in licensed care facilities.",
          badge: "External Link",
          href: "https://www.dshs.wa.gov/altsa/residential-care-services/resident-rights",
          isExternal: true,
          whyThisMatters: "Residents retain rights to dignity, privacy, and self-determination."
        }
      ]
    },

    // -------------------------------------------------------------------------
    // Support & Advocacy
    // -------------------------------------------------------------------------
    {
      id: "support-advocacy",
      title: "Support & Advocacy",
      iconKey: "heart",
      cards: [
        {
          id: "ombudsman",
          title: "Long-Term Care Ombudsman",
          description: "Free, confidential advocacy for residents and families with concerns or complaints.",
          badge: "External Link",
          href: "https://www.waombudsman.org/",
          isExternal: true,
          whyThisMatters: "Ombudsmen resolve issues without fear of retaliation."
        },
        {
          id: "caregiver-support",
          title: "Family Caregiver Support",
          description: "Resources for family members navigating care decisions and caregiver stress.",
          badge: "Guide",
          href: "/resources/caregiver-support",
          bulletPoints: [
            "Washington Family Caregiver Support Program",
            "Respite care options",
            "Support groups and counseling",
            "Self-care strategies"
          ]
          // TODO: Create /resources/caregiver-support detail page
        },
        {
          id: "file-complaint",
          title: "Report a Concern",
          description: "How to report concerns about care quality, safety, or potential abuse to DSHS.",
          badge: "External Link",
          href: "https://www.dshs.wa.gov/altsa/residential-care-services/how-file-complaint",
          isExternal: true,
          whyThisMatters: "Reports help protect all residents and improve care standards."
        }
      ]
    }
  ],

  ctaTitle: "Need Help Finding Care?",
  ctaDescription: "Our team is here to help you navigate care options in Washington State. Call us or use our care matching tool to find the right home.",
  ctaPhone: "1-800-555-CARE"
};

// ============================================================================
// Helper to get icon component by key (used by the page component)
// ============================================================================

import {
  BookOpen,
  DollarSign,
  Shield,
  Heart,
  Users,
  ClipboardList,
  FileText,
  Phone,
  ExternalLink
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const iconMap: Record<IconKey, LucideIcon> = {
  "book-open": BookOpen,
  "dollar-sign": DollarSign,
  "shield": Shield,
  "heart": Heart,
  "users": Users,
  "clipboard-list": ClipboardList,
  "file-text": FileText,
  "phone": Phone
};

export const badgeStyles: Record<BadgeType, string> = {
  "Guide": "bg-gray-100 text-gray-700",
  "Checklist": "bg-green-100 text-green-700",
  "External Link": "bg-blue-100 text-blue-700"
};

export const getBadgeIcon = (badge: BadgeType): LucideIcon => {
  switch (badge) {
    case "External Link":
      return ExternalLink;
    case "Checklist":
      return ClipboardList;
    default:
      return FileText;
  }
};
