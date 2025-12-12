import { Link } from "wouter";
import type { Facility } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Phone, Calendar, CheckCircle2, ShieldCheck, AlertCircle, Check, Home, Building2, Hospital, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const FACILITY_TYPE_CONFIG = {
  afh: { label: 'Adult Family Home', icon: Home, color: 'bg-emerald-600/90' },
  alf: { label: 'Assisted Living', icon: Building2, color: 'bg-blue-600/90' },
  snf: { label: 'Skilled Nursing', icon: Hospital, color: 'bg-purple-600/90' },
  hospice: { label: 'Hospice', icon: Heart, color: 'bg-rose-600/90' },
} as const;

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const hasImage = facility.images && facility.images.length > 0;
  const safeImages = facility.images || [];
  const facilityTypeKey = (facility.facilityType || 'afh') as keyof typeof FACILITY_TYPE_CONFIG;
  const typeConfig = FACILITY_TYPE_CONFIG[facilityTypeKey];
  const TypeIcon = typeConfig.icon;
  
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-card flex flex-col h-full">
      <div className="relative h-48 overflow-hidden shrink-0 bg-muted/30">
        {hasImage && (
          <img 
            src={safeImages[0]} 
            alt={facility.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className={cn(typeConfig.color, "text-white border-none shadow-sm flex items-center gap-1.5")}>
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </Badge>
          {facility.availableBeds > 0 ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">
              {facility.availableBeds} Bed{facility.availableBeds > 1 ? 's' : ''} Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted/80 backdrop-blur text-muted-foreground">
              Waitlist Only
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" />
            <span>{facility.city}, WA</span>
            <span className="mx-1">•</span>
            <span>{facility.zipCode}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4 flex-1">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-serif font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors">
              {facility.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {facility.description || "Quality care in a comfortable, home-like setting."}
          </p>
        </div>

        {facility.specialties && facility.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {facility.specialties.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="outline" className="text-xs font-normal bg-muted/30">
                {spec}
              </Badge>
            ))}
            {facility.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal bg-muted/30">
                +{facility.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Capacity</p>
            <p className="font-medium text-sm">
              {facility.capacity} beds
            </p>
          </div>
          <div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Payment</p>
             <div className="flex flex-col gap-1">
               {facility.acceptsMedicaid && (
                 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                   <CheckCircle2 className="h-3.5 w-3.5" />
                   Medicaid
                 </div>
               )}
               {facility.acceptsPrivatePay && (
                 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                   <CheckCircle2 className="h-3.5 w-3.5" />
                   Private Pay
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Compliance Snapshot</p>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
               <span className={cn("font-medium", facility.licenseStatus === 'Active' ? "text-green-600" : "text-amber-600")}>
                 License: {facility.licenseStatus}
               </span>
               <span className="text-muted-foreground">•</span>
               <span className={cn((facility.violationsCount || 0) > 0 ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                 {facility.violationsCount || 0} Violations
               </span>
            </div>
            {facility.lastInspectionDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Last Inspection: {new Date(facility.lastInspectionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <Check className="h-3 w-3 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/facility/${facility.id}`} className={cn(buttonVariants({ variant: "default" }), "w-full")}>
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}