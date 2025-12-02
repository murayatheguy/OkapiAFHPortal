import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Star } from "lucide-react";
import { HERO_IMAGE, MOCK_FACILITIES } from "@/lib/mock-data";
import { FacilityCard } from "@/components/facility-card";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const featuredFacilities = MOCK_FACILITIES.slice(0, 3);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_IMAGE} 
            alt="Elderly care" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
              Find the perfect care <br/>
              <span className="text-primary-foreground/90">for your loved one.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-lg font-light">
              Connect with trusted Adult Family Homes in Washington State. Verified reviews, real-time availability, and certified staff.
            </p>

            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 max-w-lg mt-8">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                  <Input 
                    type="text" 
                    placeholder="Zip Code, City, or County" 
                    className="pl-10 bg-white/90 border-none text-black placeholder:text-gray-500 h-12 text-base focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" type="submit" className="h-12 px-8 font-semibold text-base shadow-lg">
                  Search
                </Button>
              </form>
            </div>
            
            <div className="flex items-center gap-6 pt-4 text-sm font-medium text-white/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>DSHS Verified Homes</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                <span>Certified Caregivers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Top Rated Facilities</h2>
              <p className="text-muted-foreground">Highly recommended homes with available beds near you.</p>
            </div>
            <Link href="/search" className="text-primary font-medium flex items-center gap-1 hover:underline">
              View all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredFacilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4 p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-serif">Easy Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Filter by care needs, budget, and location to find the perfect match for your family's unique situation.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-serif">Verified Compliance</h3>
              <p className="text-muted-foreground leading-relaxed">
                We automatically sync with DSHS records to show you real-time license status and inspection history.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-serif">Certified Staff</h3>
              <p className="text-muted-foreground leading-relaxed">
                Look for the Okapi Certified badge to find homes where staff training exceeds state requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}