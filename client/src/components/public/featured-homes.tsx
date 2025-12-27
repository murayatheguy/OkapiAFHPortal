/**
 * Featured Homes Section
 * Shows 4 real homes from the directory on the homepage
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, Bed, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Facility {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  description?: string;
  capacity?: number;
  availableBeds?: number;
  currentOccupancy?: number;
  specialties?: string[];
  amenities?: string[];
  acceptsMedicaid?: boolean;
  acceptsPrivatePay?: boolean;
  priceMin?: number;
  priceMax?: number;
  images?: string[];
  featured?: boolean;
  licenseStatus?: string;
}

export function FeaturedHomes() {
  const [, setLocation] = useLocation();

  // Fetch facilities from API
  const { data: facilities, isLoading, error } = useQuery<Facility[]>({
    queryKey: ["featured-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/facilities");
      if (!response.ok) {
        throw new Error("Failed to fetch facilities");
      }
      const data = await response.json();
      // Prefer featured homes, otherwise take first 4
      if (Array.isArray(data)) {
        const featured = data.filter((f: Facility) => f.featured);
        if (featured.length >= 4) {
          return featured.slice(0, 4);
        }
        return data.slice(0, 4);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Homes Ready to Welcome Your Loved One
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error or no facilities - don't show section
  if (error || !facilities || facilities.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Homes Ready to Welcome Your Loved One
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            These are real homes with real families. Each one is licensed,
            inspected, and ready to provide the care your loved one deserves.
          </p>
        </div>

        {/* Homes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onClick={() => setLocation(`/facility/${facility.id}`)}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation("/directory")}
            className="border-2"
          >
            View All Homes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Individual Facility Card
 */
function FacilityCard({ facility, onClick }: { facility: Facility; onClick: () => void }) {
  const availableBeds = facility.availableBeds ??
    (facility.capacity ? facility.capacity - (facility.currentOccupancy || 0) : null);

  // Get a color for the facility based on its name (for visual variety)
  const getGradient = (name: string) => {
    const gradients = [
      "from-teal-500 to-teal-600",
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-amber-500 to-amber-600",
      "from-rose-500 to-rose-600",
      "from-emerald-500 to-emerald-600",
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  // Get first specialization or care type
  const primarySpecialty = facility.specialties?.[0] || "General Care";

  // Format specialty for display
  const formatSpecialty = (specialty: string) => {
    return specialty
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Mental Health', 'Mental Health')
      .replace('Developmental Disabilities', 'DD Care')
      .trim();
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-teal-200"
      onClick={onClick}
    >
      {/* Image/Gradient Header */}
      <div className={`h-32 bg-gradient-to-br ${getGradient(facility.name)} relative`}>
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Home icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl opacity-80">🏠</span>
        </div>

        {/* Licensed badge */}
        <div className="absolute top-2 left-2">
          {facility.licenseStatus === "Active" && (
            <Badge className="bg-white/90 text-teal-700 text-xs flex items-center gap-1">
              <Check className="h-3 w-3" />
              Licensed
            </Badge>
          )}
        </div>

        {/* Availability badge */}
        {availableBeds !== null && availableBeds > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white text-xs">
              {availableBeds} bed{availableBeds > 1 ? "s" : ""} open
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors line-clamp-1">
          {facility.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">
            {facility.city}{facility.state ? `, ${facility.state}` : ""}
          </span>
        </div>

        {/* Specialty */}
        <Badge variant="secondary" className="mb-3 text-xs">
          {formatSpecialty(primarySpecialty)}
        </Badge>

        {/* Quick stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            <span>{facility.capacity || 6} beds</span>
          </div>
          {facility.acceptsMedicaid && (
            <span className="text-green-600 font-medium">Medicaid</span>
          )}
        </div>

        {/* Price range if available */}
        {facility.priceMin && facility.priceMin > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            ${facility.priceMin.toLocaleString()}
            {facility.priceMax && facility.priceMax > 0 && ` - $${facility.priceMax.toLocaleString()}`}
            /mo
          </div>
        )}
      </CardContent>
    </Card>
  );
}
