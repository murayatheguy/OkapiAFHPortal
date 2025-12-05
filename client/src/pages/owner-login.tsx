import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/lib/owner-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home, Eye, EyeOff } from "lucide-react";

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
    
    setIsSubmitting(true);
    try {
      // Dev bypass: empty email and password allows quick access
      if (!email.trim() && !password.trim()) {
        try {
          const response = await fetch("/api/owners/dev-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (response.ok) {
            window.location.href = "/owner/dashboard";
            return;
          } else {
            const data = await response.json();
            toast({
              title: "Quick Login Failed",
              description: data.error || "Could not log in. Please try again.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          toast({
            title: "Connection Error",
            description: "Could not connect to server. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      if (!email || !password) {
        toast({
          title: "Missing Information",
          description: "Please enter your email and password.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1a14' }}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0d1a14' }}>
      <header className="relative z-50 px-5 py-4 flex items-center justify-between border-b border-amber-900/20">
        <Link href="/" className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.1em', fontSize: '1.25rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.25rem' }}>
            Care
          </span>
        </Link>
        
        <Link href="/">
          <Button variant="ghost" className="text-stone-400 hover:text-amber-200">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-900/20" style={{ backgroundColor: 'rgba(20, 35, 28, 0.8)' }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
              Provider Login
            </CardTitle>
            <CardDescription className="text-stone-400">
              Sign in to manage your Adult Family Home listings
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-stone-900/50 border-amber-900/30 text-stone-100"
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-stone-900/50 border-amber-900/30 text-stone-100 pr-10"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white"
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
              <div className="text-center text-sm text-stone-400">
                <p>
                  Don't have an account?{" "}
                  <Link href="/search" className="text-amber-400 hover:text-amber-300">
                    Find your facility
                  </Link>
                  {" "}and claim it.
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
