import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-primary tracking-tight">
          Okapi<span className="text-foreground font-sans font-normal text-lg">Portal</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" ? "text-primary" : "text-muted-foreground")}>
            Home
          </Link>
          <Link href="/search" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/search" ? "text-primary" : "text-muted-foreground")}>
            Find Care
          </Link>
          <Link href="/academy" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Okapi Academy
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex">
            For AFH Owners
          </Button>
          <Button>Sign In</Button>
        </div>
      </div>
    </nav>
  );
}