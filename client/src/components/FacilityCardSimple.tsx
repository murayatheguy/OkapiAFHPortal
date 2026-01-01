/**
 * FacilityCardSimple - Clean, uncluttered facility card for directory listings
 */

import { useState } from "react";
import { Link } from "wouter";
import type { Facility } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Star, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFacilityPhotos } from "@/lib/facility-photos";

interface FacilityCardSimpleProps {
  facility: Facility;
  className?: string;
}

export function FacilityCardSimple({ facility, className }: FacilityCardSimpleProps) {
  const [showPhone, setShowPhone] = useState(false);
  const photoData = getFacilityPhotos(facility);
  const primaryPhoto = photoData.photos[0];

  // Check if facility has reviews
  const hasReviews = facility.reviewCount && facility.reviewCount > 0;

  // Select max 2 badges to show
  const badges: string[] = [];
  if (facility.availableBeds > 0) {
    badges.push(`${facility.availableBeds} Bed${facility.availableBeds > 1 ? 's' : ''} Available`);
  }
  if (facility.acceptsMedicaid) {
    badges.push("Medicaid");
  }
  if (badges.length < 2 && facility.acceptsPrivatePay) {
    badges.push("Private Pay");
  }

  return (
    <Card className={cn(
      "overflow-hidden group hover:shadow-lg transition-all duration-300 border-gray-200 bg-white flex flex-col h-full",
      className
    )}>
      {/* Clean photo - no overlay */}
      <div className="relative h-48 overflow-hidden shrink-0 bg-gray-100">
        <img
          src={primaryPhoto}
          alt={facility.name}
          className={cn(
            "w-full h-full transition-transform duration-500 group-hover:scale-105",
            photoData.isPlaceholder ? "object-contain p-4" : "object-cover"
          )}
        />
      </div>

      <CardContent className="p-5 flex flex-col flex-1">
        {/* Name */}
        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#4C1D95] transition-colors mb-1">
          {facility.name}
        </h3>

        {/* City */}
        <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-3">
          <MapPin className="h-4 w-4" />
          <span>{facility.city}, WA</span>
        </div>

        {/* Reviews count - only if has reviews */}
        {hasReviews && (
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-gray-600 text-sm">{facility.reviewCount} review{facility.reviewCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Max 2 badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {badges.slice(0, 2).map((badge, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={cn(
                  "text-xs font-medium",
                  badge.includes("Available")
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-100"
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {showPhone && facility.phone ? (
            <a
              href={`tel:${facility.phone}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              )}
            >
              <Phone className="h-4 w-4 mr-2" />
              {facility.phone}
            </a>
          ) : (
            <Button
              variant="outline"
              className="flex-1 text-gray-700 hover:text-emerald-700 hover:border-emerald-200"
              onClick={() => setShowPhone(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Show Phone
            </Button>
          )}

          <Link
            href={`/facility/${facility.id}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex-1 bg-[#4C1D95] hover:bg-[#3b1578]"
            )}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
