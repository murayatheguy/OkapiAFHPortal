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
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: '#0d1a14' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#c9a962' }} />
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
    <div className="h-screen w-screen overflow-hidden relative" style={{ backgroundColor: '#0d1a14' }}>
      {/* Texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative Blobs - Updated to match homepage */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/10 blur-3xl" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-800/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header - Matching Homepage */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-amber-900/30 bg-[#0d1a14]/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-1.5">
            <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
              OKAPI
            </span>
            <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.25rem' }}>
              Care Network
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '0.85rem', letterSpacing: '0.1em', color: '#c8c4bc' }}
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
                className="w-full max-w-md p-8 rounded border"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderColor: "rgba(201, 169, 98, 0.3)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="text-center mb-6">
                  <h1 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.75rem', fontWeight: 500, color: '#ffffff', marginBottom: '0.25rem' }}>
                    Owner Portal
                  </h1>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#c8c4bc' }}>
                    Sign in to manage your facilities
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div
                      className="p-3 text-sm rounded border"
                      style={{
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderColor: 'rgba(220, 38, 38, 0.3)',
                        color: '#fca5a5'
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      className="block mb-1.5"
                      style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#c8c4bc' }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 rounded transition-all disabled:opacity-50 focus:outline-none"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(201, 169, 98, 0.2)',
                        color: '#f5f3ef',
                        fontFamily: "'Jost', sans-serif",
                        fontSize: '0.9rem'
                      }}
                      data-testid="input-login-email"
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1.5"
                      style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#c8c4bc' }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded transition-all disabled:opacity-50 focus:outline-none"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(201, 169, 98, 0.2)',
                          color: '#f5f3ef',
                          fontFamily: "'Jost', sans-serif",
                          fontSize: '0.9rem'
                        }}
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#a8a49c' }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/owner/forgot-password"
                      className="transition-colors hover:text-amber-300"
                      style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#a8a49c' }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: '#c9a962',
                      color: '#0d1a14',
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.05em'
                    }}
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

                <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'rgba(201, 169, 98, 0.2)' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#a8a49c', marginBottom: '0.75rem' }}>
                    Don't have an account?
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded border transition-all hover:bg-white/5"
                    style={{
                      borderColor: 'rgba(201, 169, 98, 0.4)',
                      color: '#c9a962',
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
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
                <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 500, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Resources for Owners
                </h2>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#a8a49c' }}>
                  Everything you need to succeed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {resources.map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border transition-all hover:border-amber-700/40"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderColor: "rgba(201, 169, 98, 0.15)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <section.icon className="w-4 h-4" style={{ color: '#c9a962' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.875rem', color: '#f5f3ef' }}>
                        {section.title}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i}>
                          <a
                            href={item.link}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className="flex items-center gap-1 transition-colors hover:text-amber-300"
                            style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#a8a49c' }}
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
                className="mt-4 p-4 rounded border block transition-all hover:border-amber-600/50"
                style={{
                  background: "rgba(201, 169, 98, 0.08)",
                  borderColor: "rgba(201, 169, 98, 0.25)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <p className="flex items-center gap-2" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '0.875rem', color: '#e8c55a' }}>
                  New: Okapi Academy
                  <ExternalLink className="w-3 h-3" />
                </p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#a8a49c', marginTop: '0.25rem' }}>
                  Complete your required training online
                </p>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-3 text-center border-t" style={{ borderColor: 'rgba(201, 169, 98, 0.15)' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#6b7c72' }}>
            © 2025 Okapi Care Network · <Link href="/privacy" className="hover:text-amber-300 transition-colors">Privacy</Link> · <Link href="/terms" className="hover:text-amber-300 transition-colors">Terms</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
