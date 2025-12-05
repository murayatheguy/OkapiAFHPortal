import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function OwnerSetup() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const response = await fetch(`/api/owners/setup/validate?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          setIsValid(true);
          setOwnerName(data.name || "");
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter and confirm your password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/owners/setup", { token, password });
      setSetupComplete(true);
      toast({
        title: "Account Created",
        description: "Your account is ready. You can now sign in.",
      });
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to set up account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
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
        {!isValid ? (
          <Card className="w-full max-w-md border-amber-900/20" style={{ backgroundColor: 'rgba(20, 35, 28, 0.8)' }}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-400" style={{ fontFamily: "'Cormorant', serif" }}>
                Invalid or Expired Link
              </CardTitle>
              <CardDescription className="text-stone-400">
                This setup link is no longer valid. It may have expired or already been used.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Link href="/owner/login">
                <Button className="bg-amber-600 hover:bg-amber-500">
                  Go to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : setupComplete ? (
          <Card className="w-full max-w-md border-amber-900/20" style={{ backgroundColor: 'rgba(20, 35, 28, 0.8)' }}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                Account Ready!
              </CardTitle>
              <CardDescription className="text-stone-400">
                Your password has been set. You can now sign in to manage your listings.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Link href="/owner/login">
                <Button className="bg-amber-600 hover:bg-amber-500">
                  Sign In Now
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-md border-amber-900/20" style={{ backgroundColor: 'rgba(20, 35, 28, 0.8)' }}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-amber-100" style={{ fontFamily: "'Cormorant', serif" }}>
                Complete Your Account
              </CardTitle>
              <CardDescription className="text-stone-400">
                {ownerName ? `Welcome, ${ownerName}! ` : ""}
                Set a password to access your provider dashboard.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-stone-300">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-stone-900/50 border-amber-900/30 text-stone-100 pr-10"
                      data-testid="input-setup-password"
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
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-stone-300">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-stone-900/50 border-amber-900/30 text-stone-100"
                    data-testid="input-setup-confirm-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  disabled={isSubmitting}
                  data-testid="button-setup-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
