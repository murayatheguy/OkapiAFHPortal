import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/lib/owner-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Home,
  Eye,
  EyeOff,
  MapPin,
  ClipboardList,
  CheckCircle,
  Users,
  BarChart3,
  GraduationCap,
  ArrowRight
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const benefits = [
    {
      icon: MapPin,
      title: "FREE Public Listing",
      description: "Get found by families searching for care in your area"
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
      description: "Free training resources and compliance guides"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#0d9488', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#374151', fontSize: '1.25rem' }}>
            Care Network
          </span>
        </Link>

        <Link href="/">
          <Button variant="ghost" className="text-gray-600 hover:text-teal-700">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT SIDE - Value Proposition */}
        <div className="lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-700 p-8 lg:p-12 flex flex-col justify-center text-white">
          <div className="max-w-lg mx-auto lg:mx-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ fontFamily: "'Cormorant', serif" }}>
              Grow Your Adult Family Home Business
            </h1>
            <p className="text-teal-100 text-lg mb-8">
              Join Washington's premier AFH platform - trusted by families and facility owners
            </p>

            {/* Benefits List */}
            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-teal-100" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-teal-100 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Claim Facility CTA */}
            <div className="mt-10 pt-8 border-t border-teal-500/30">
              <p className="text-teal-100 mb-3">Don't have a facility listed yet?</p>
              <Link href="/owner">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-teal-700 transition-colors"
                >
                  Claim Your Facility
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gray-50">
          <Card className="w-full max-w-md border-gray-200 shadow-lg bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-900" style={{ fontFamily: "'Cormorant', serif" }}>
                Provider Login
              </CardTitle>
              <CardDescription className="text-gray-500">
                Sign in to manage your Adult Family Home listings
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                    data-testid="input-login-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:border-teal-500 focus:ring-teal-500"
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isSubmitting}
                  data-testid="button-login-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="text-center space-y-2">
                  <Link href="/owner/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 block">
                    Forgot password?
                  </Link>
                  <p className="text-sm text-gray-500">
                    Need help?{" "}
                    <a href="mailto:support@okapicare.com" className="text-teal-600 hover:text-teal-700">
                      Contact support
                    </a>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
