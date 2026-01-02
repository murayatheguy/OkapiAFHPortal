/**
 * Warm Premium FacilityCardSimple - Clean facility card for directory listings
 * Larger text and touch targets for 50-65yo demographic
 */

import { useState } from "react";
import { Link } from "wouter";
import type { Facility } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Star, Eye, Shield } from "lucide-react";
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
    <Card
      className={cn(
        "overflow-hidden group hover:shadow-card-hover transition-all duration-300",
        "border-gray-100 bg-white flex flex-col h-full rounded-2xl",
        className
      )}
    >
      {/* Photo with subtle overlay */}
      <div className="relative h-52 overflow-hidden shrink-0 bg-ivory">
        <img
          src={primaryPhoto}
          alt={facility.name}
          className={cn(
            "w-full h-full transition-transform duration-500 group-hover:scale-105",
            photoData.isPlaceholder ? "object-contain p-6" : "object-cover"
          )}
        />
        {/* Licensed badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
          <Shield className="h-3.5 w-3.5 text-sage-600" />
          <span className="text-xs font-medium text-foreground/80">Licensed</span>
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-1">
        {/* Name - larger for readability */}
        <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
          {facility.name}
        </h3>

        {/* Full Address */}
        <div className="flex items-start gap-2 text-foreground/60 text-sm mb-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{facility.address}, {facility.city}, WA {facility.zipCode}</span>
        </div>

        {/* Reviews count - only if has reviews */}
        {hasReviews && (
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
            <span className="text-base text-foreground/70">
              {facility.reviewCount} review{facility.reviewCount !== 1 ? "s" : ""}
            </span>
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
                  "text-sm font-medium px-3 py-1 rounded-lg",
                  badge.includes("Available")
                    ? "bg-sage-50 text-sage-700 hover:bg-sage-50"
                    : "bg-plum-50 text-plum-700 hover:bg-plum-50"
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons - larger touch targets */}
        <div className="flex gap-3 mt-4">
          {showPhone && facility.phone ? (
            <a
              href={`tel:${facility.phone}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1 h-12 text-base rounded-xl text-sage-700 border-sage-200 hover:bg-sage-50"
              )}
            >
              <Phone className="h-4 w-4 mr-2" />
              {facility.phone}
            </a>
          ) : (
            <Button
              variant="outline"
              className="flex-1 h-12 text-base rounded-xl text-foreground/70 hover:text-sage-700 hover:border-sage-200 hover:bg-sage-50"
              onClick={() => setShowPhone(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          )}

          <Link
            href={`/facility/${facility.id}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex-1 h-12 text-base rounded-xl bg-primary hover:bg-primary/90"
            )}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
