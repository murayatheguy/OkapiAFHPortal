import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/lib/owner-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  ClipboardList,
  GraduationCap,
  FileText,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ExternalLink
} from "lucide-react";

export default function OwnerLogin() {
  const [, setLocation] = useLocation();
  const { login, isLoading: authLoading, isAuthenticated } = useOwnerAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    setLocation("/owner/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(email, password);
      setLocation("/owner/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const OKAPI_ACADEMY_URL = "https://okapi-health-ai-info10705.replit.app/academy/login";

  const resources = [
    { icon: Home, title: "Getting Listed", items: [
      { name: "Claim Your Listing", link: "/" },
      { name: "Optimize Profile", link: "#" },
      { name: "Photo Tips", link: "#" }
    ]},
    { icon: ClipboardList, title: "Compliance", items: [
      { name: "DSHS Requirements", link: "https://www.dshs.wa.gov/altsa/residential-care-services/adult-family-home-licensing", external: true },
      { name: "Inspection Prep", link: "#" },
      { name: "Training Requirements", link: "https://www.dshs.wa.gov/altsa/training/adult-family-home-training-requirements", external: true }
    ]},
    { icon: GraduationCap, title: "Education", items: [
      { name: "Okapi Academy", link: OKAPI_ACADEMY_URL, external: true },
      { name: "CE Courses", link: OKAPI_ACADEMY_URL, external: true },
      { name: "Certifications", link: OKAPI_ACADEMY_URL, external: true }
    ]},
    { icon: FileText, title: "Business", items: [
      { name: "AFH Association", link: "https://www.wa-afh.org/", external: true },
      { name: "Insurance", link: "#" },
      { name: "Medicaid Enrollment", link: "https://www.hca.wa.gov/billers-providers-partners/prior-authorization-claims-and-billing/provider-enrollment", external: true }
    ]},
  ];

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, #1a365d 0%, #2d3748 40%, #1a202c 100%)",
        }}
      />

      {/* Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <div>
              <span className="text-white font-semibold text-lg">Okapi</span>
              <span className="text-white/60 text-xs block -mt-1">Care Network</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

            {/* Left - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <div
                className="w-full max-w-md p-8 rounded-2xl border border-white/20"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Owner Portal</h1>
                  <p className="text-white/60 text-sm">Sign in to manage your facilities</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-300 bg-red-500/20 border border-red-500/30 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-white/80 text-sm mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all disabled:opacity-50"
                      data-testid="input-login-email"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all disabled:opacity-50"
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/owner/forgot-password" className="text-sm text-white/60 hover:text-white transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    data-testid="button-login-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-white/50 text-sm mb-3">Don't have an account?</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Claim Your Facility
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right - Resources */}
            <div className="hidden lg:block">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-1">Resources for Owners</h2>
                <p className="text-white/50 text-sm">Everything you need to succeed</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {resources.map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <section.icon className="w-4 h-4 text-teal-400" />
                      <span className="text-white font-medium text-sm">{section.title}</span>
                    </div>
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i}>
                          <a
                            href={item.link}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className="text-white/50 text-xs hover:text-white/80 transition-colors flex items-center gap-1"
                          >
                            {item.name}
                            {item.external && <ExternalLink className="w-2.5 h-2.5" />}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <a
                href={OKAPI_ACADEMY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 p-4 rounded-xl border border-teal-500/30 block hover:border-teal-400/50 transition-all"
                style={{
                  background: "rgba(20, 184, 166, 0.1)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <p className="text-teal-300 text-sm font-medium flex items-center gap-2">
                  New: Okapi Academy
                  <ExternalLink className="w-3 h-3" />
                </p>
                <p className="text-white/50 text-xs mt-1">Complete your required training online</p>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-3 text-center">
          <p className="text-white/30 text-xs">
            © 2025 Okapi Care Network · <Link href="/privacy" className="hover:text-white/50">Privacy</Link> · <Link href="/terms" className="hover:text-white/50">Terms</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
