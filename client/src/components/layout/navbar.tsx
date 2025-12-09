import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const isOwnerRoute = location.startsWith("/owner");

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-primary tracking-tight">
          Okapi<span className="text-foreground font-sans font-normal text-lg ml-1">Care Network</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" ? "text-primary" : "text-muted-foreground")}>
            Home
          </Link>
          <Link href="/search" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/search" ? "text-primary" : "text-muted-foreground")}>
            Find Care
          </Link>
          <Link 
            href="/owner/login" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5", 
              isOwnerRoute ? "text-primary" : "text-muted-foreground"
            )}
            data-testid="link-owner-portal"
          >
            <Building2 className="h-4 w-4" />
            Owner Portal
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/owner/login">
            <Button 
              variant="outline" 
              className="hidden sm:inline-flex border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10 hover:text-[#c9a962]"
              data-testid="button-owner-portal"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Owner Portal
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}