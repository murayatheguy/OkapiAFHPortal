import { Link } from "wouter";
import { Facility } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Phone, Calendar, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={facility.images[0]} 
          alt={facility.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {facility.beds_available > 0 ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">
              {facility.beds_available} Bed{facility.beds_available > 1 ? 's' : ''} Available
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
            <span>{facility.zip}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-serif font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors">
              {facility.name}
            </h3>
            {facility.is_claimed && (
              <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Claimed
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {facility.description}
          </p>
        </div>

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

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Price</p>
            <p className="font-medium text-sm">
              ${facility.price_min.toLocaleString()} - ${facility.price_max.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span>
            </p>
          </div>
          <div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Trust</p>
             <div className="flex flex-col gap-1">
               {facility.has_okapi_certified_staff && (
                 <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                   <ShieldCheck className="h-3.5 w-3.5" />
                   Okapi Certified
                 </div>
               )}
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                 <CheckCircle2 className="h-3.5 w-3.5" />
                 DSHS Verified
               </div>
             </div>
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