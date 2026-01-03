import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/lib/owner-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/brand/Logo";
import {
  Loader2,
  Home,
  Eye,
  EyeOff,
  ClipboardList,
  GraduationCap,
  FileText,
  ExternalLink,
  ArrowRight,
  Phone,
  Mail,
} from "lucide-react";

export default function OwnerLogin() {
  const [, setLocation] = useLocation();
  const { login, isLoading, isAuthenticated } = useOwnerAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    setLocation("/owner/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      setLocation("/owner/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Owner Resources
  const ownerResources = [
    {
      category: "Getting Listed",
      icon: Home,
      items: [
        { title: "How to Claim Your Listing", link: "#", external: false },
        { title: "Optimizing Your Profile", link: "#", external: false },
        { title: "Photo Guidelines", link: "#", external: false },
      ]
    },
    {
      category: "Compliance & Licensing",
      icon: ClipboardList,
      items: [
        { title: "DSHS Licensing Requirements", link: "https://www.dshs.wa.gov/altsa/residential-care-services/adult-family-home-licensing", external: true },
        { title: "Inspection Preparation", link: "#", external: false },
        { title: "Training Requirements", link: "https://www.dshs.wa.gov/altsa/training/adult-family-home-training-requirements", external: true },
      ]
    },
    {
      category: "Training & Education",
      icon: GraduationCap,
      items: [
        { title: "Okapi Academy", link: "/academy", external: false },
        { title: "Continuing Education", link: "/academy/courses", external: false },
        { title: "Specialty Certifications", link: "/academy/certifications", external: false },
      ]
    },
    {
      category: "Business Resources",
      icon: FileText,
      items: [
        { title: "AFH Association of Washington", link: "https://www.wa-afh.org/", external: true },
        { title: "Insurance Requirements", link: "#", external: false },
        { title: "Medicaid Provider Enrollment", link: "https://www.hca.wa.gov/billers-providers-partners/prior-authorization-claims-and-billing/provider-enrollment", external: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="relative z-50 px-6 py-4 flex items-center justify-between border-b border-border bg-white shadow-soft">
        <Link href="/">
          <Logo size="md" />
        </Link>

        <Link href="/">
          <Button variant="ghost" className="text-foreground/70 hover:text-primary">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT SIDE - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-ivory order-1 lg:order-1">
          <div className="w-full max-w-md">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                Owner Portal
              </h2>
              <p className="text-foreground/60 mt-2">Sign in to manage your facilities</p>
            </div>

            {/* Login Card */}
            <Card className="shadow-card border-0 bg-white">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-12 px-4 bg-white border-gray-200 text-foreground focus:border-primary focus:ring-primary"
                      data-testid="input-login-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="h-12 px-4 bg-white border-gray-200 text-foreground pr-12 focus:border-primary focus:ring-primary"
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base rounded-xl transition-colors"
                    disabled={isSubmitting}
                    data-testid="button-login-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <Link href="/owner/forgot-password" className="text-primary hover:text-primary/80 text-sm font-medium block transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* CTA for new users */}
            <div className="mt-8 text-center">
              <p className="text-foreground/60 mb-4">Don't have a facility listed yet?</p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-plum-50 rounded-xl transition-colors"
                >
                  Claim Your Facility
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile Contact Info */}
            <div className="lg:hidden mt-10 pt-8 border-t border-gray-200 text-center">
              <p className="text-foreground/60 text-sm mb-4">Questions? We're here to help.</p>
              <div className="space-y-2">
                <a
                  href="tel:1-800-225-5652"
                  className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  1-800-CALL-OKAPI
                </a>
                <a
                  href="mailto:info@okapihealthcare.com"
                  className="flex items-center justify-center gap-2 text-primary hover:text-primary/80"
                >
                  <Mail className="w-4 h-4" />
                  info@okapihealthcare.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Owner Resources */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[50%] bg-gradient-to-br from-secondary to-sage-700 p-12 xl:p-16 flex-col order-2 lg:order-2">
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Resources Header */}
            <div className="mb-8">
              <h2 className="text-2xl xl:text-3xl font-bold text-white mb-3">
                Resources for Owners
              </h2>
              <p className="text-sage-100 text-lg">
                Everything you need to manage and grow your Adult Family Home.
              </p>
            </div>

            {/* Resources List */}
            <div className="space-y-6">
              {ownerResources.map((section, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <section.icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">{section.category}</h3>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <a
                          href={item.link}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          className="flex items-center justify-between text-sm text-sage-100 hover:text-white transition-colors group"
                        >
                          <span>{item.title}</span>
                          {item.external && <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section - Bottom of right panel */}
          <div className="mt-auto pt-8 border-t border-sage-400/30">
            <p className="text-sage-200 text-sm font-medium mb-4">Questions? We're here to help.</p>
            <div className="space-y-3">
              <a
                href="tel:1-800-225-5652"
                className="flex items-center gap-3 text-white hover:text-sage-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">1-800-CALL-OKAPI</span>
                  <span className="text-sage-300 text-sm ml-2">(1-800-225-5652)</span>
                </div>
              </a>
              <a
                href="mailto:info@okapihealthcare.com"
                className="flex items-center gap-3 text-white hover:text-sage-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>info@okapihealthcare.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
