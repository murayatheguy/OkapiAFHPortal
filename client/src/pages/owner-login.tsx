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
  Globe,
  ClipboardList,
  CheckCircle,
  Users,
  BarChart3,
  GraduationCap,
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

  const features = [
    {
      icon: Globe,
      title: "Public Directory Listing",
      description: "Get discovered by families searching for quality care in your area"
    },
    {
      icon: ClipboardList,
      title: "Complete EHR System",
      description: "Digital care notes, MAR, incident reports - all mobile-friendly"
    },
    {
      icon: CheckCircle,
      title: "DSHS Compliance Made Easy",
      description: "Fillable NCP forms, auto-generated reports, credential tracking"
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Track credentials, certifications, and training expiration"
    },
    {
      icon: BarChart3,
      title: "Powerful Reporting",
      description: "Print-ready reports for DSHS inspections and audits"
    },
    {
      icon: GraduationCap,
      title: "Okapi Academy",
      description: "Training resources and compliance guides included"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="relative z-50 px-6 py-4 flex items-center justify-between border-b border-border bg-white shadow-soft">
        <Logo size="md" />

        <Link href="/">
          <Button variant="ghost" className="text-foreground/70 hover:text-primary">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT SIDE - Value Proposition */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary to-plum-700 p-12 xl:p-16 flex-col">
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            {/* Hero Section */}
            <div className="space-y-6 mb-10">
              <p className="text-plum-200 text-sm font-medium tracking-wide uppercase">
                Washington State's Premier Platform
              </p>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Grow Your Adult Family Home Business
              </h1>
              <p className="text-plum-100 text-lg leading-relaxed">
                Join hundreds of AFH providers using Okapi to streamline operations,
                stay compliant, and connect with families seeking quality care.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 mb-10 pb-10 border-b border-plum-400/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-plum-200 text-sm">Active Facilities</div>
              </div>
              <div className="w-px h-12 bg-plum-300/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-plum-200 text-sm">Satisfaction Rate</div>
              </div>
              <div className="w-px h-12 bg-plum-300/30" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-plum-200 text-sm">Support Available</div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-plum-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section - Bottom of left panel */}
          <div className="mt-auto pt-10 border-t border-plum-400/30">
            <p className="text-plum-200 text-sm font-medium mb-4">Questions? We're here to help.</p>
            <div className="space-y-3">
              <a
                href="tel:1-800-225-5652"
                className="flex items-center gap-3 text-white hover:text-plum-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">1-800-CALL-OKAPI</span>
                  <span className="text-plum-300 text-sm ml-2">(1-800-225-5652)</span>
                </div>
              </a>
              <a
                href="mailto:info@okapihealthcare.com"
                className="flex items-center gap-3 text-white hover:text-plum-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>info@okapihealthcare.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-ivory">
          <div className="w-full max-w-md">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome Back
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
                  <p className="text-foreground/60 text-sm">
                    Need help?{" "}
                    <a href="mailto:info@okapihealthcare.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                      Contact support
                    </a>
                  </p>
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
      </div>
    </div>
  );
}
