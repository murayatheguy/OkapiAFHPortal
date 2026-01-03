/**
 * Resources Page - Washington State specific guides for families
 *
 * Renders content from /content/resources.ts data file.
 * All text content is externalized for maintainability.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  waResourcesContent,
  iconMap,
  badgeStyles,
  getBadgeIcon,
  type ResourceCard as ResourceCardType,
  type ResourceSection
} from "@/content/resources";

// ============================================================================
// Resource Card Component
// ============================================================================

interface ResourceCardProps {
  resource: ResourceCardType;
}

function ResourceCard({ resource }: ResourceCardProps) {
  const BadgeIcon = getBadgeIcon(resource.badge);
  const isExternal = resource.isExternal;
  const href = resource.href || "#";

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="block h-full"
    >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium leading-snug">
              {resource.title}
            </CardTitle>
            <BadgeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {resource.description}
          </CardDescription>
          <div className="mt-3">
            <span className={`text-xs px-2 py-1 rounded-full ${badgeStyles[resource.badge]}`}>
              {resource.badge}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// ============================================================================
// Resource Section Component
// ============================================================================

interface ResourceSectionProps {
  section: ResourceSection;
}

function ResourceSectionComponent({ section }: ResourceSectionProps) {
  const Icon = iconMap[section.iconKey];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
          {section.waNote && (
            <p className="text-sm text-muted-foreground">{section.waNote}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.cards.map((card) => (
          <ResourceCard key={card.id} resource={card} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ResourcesPage() {
  const content = waResourcesContent;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-plum-50 to-background border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          {/* WA-specific badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-100 text-sage-700 text-sm font-medium mb-4">
            <MapPin className="h-4 w-4" />
            <span>{content.regionLabel}</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {content.heroTitle}
            </h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-2xl">
            {content.heroDescription}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {content.regionSublabel}
          </p>
        </div>
      </div>

      {/* Resources Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-12">
          {content.sections.map((section) => (
            <ResourceSectionComponent key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">{content.ctaTitle}</h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              {content.ctaDescription}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Phone className="h-5 w-5" />
              <a href={`tel:${content.ctaPhone.replace(/[^0-9]/g, "")}`} className="text-lg font-medium hover:underline">
                {content.ctaPhone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
