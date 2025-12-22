import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useStaffAuth } from "@/lib/staff-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home, Eye, EyeOff, KeyRound, Lock, Building2, LogOut, ArrowRight } from "lucide-react";

const TEAL = "#0d9488";

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { login, loginWithPin, loginWithFacilityPin, logout, isLoading, isAuthenticated, staff } = useStaffAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinEmail, setPinEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Facility PIN login state
  const [facilityPin, setFacilityPin] = useState("");
  const [staffName, setStaffName] = useState("");

  // Handle logout to switch users
  const handleLogoutAndSwitch = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You can now sign in as a different user.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      setLocation("/staff/dashboard");
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

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinEmail || pin.length < 4) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and complete the PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithPin(pinEmail, pin);
      setLocation("/staff/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid PIN. Please try again.",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacilityPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (facilityPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter the 4-digit facility PIN.",
        variant: "destructive",
      });
      return;
    }

    if (!staffName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithFacilityPin(facilityPin, staffName.trim());
      setLocation("/staff/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid facility PIN. Please try again.",
        variant: "destructive",
      });
      setFacilityPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: TEAL }} />
      </div>
    );
  }

  // Show "already logged in" screen with options
  if (isAuthenticated && staff) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="px-4 py-3 flex items-center justify-between border-b bg-white">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: TEAL }}
            >
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Okapi</span>
              <span className="text-gray-600 ml-1">EHR</span>
            </div>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
        </header>

        {/* Already Logged In Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600">
                You're already signed in
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200 text-center">
                <p className="text-teal-800 font-medium">
                  {staff.firstName} {staff.lastName}
                </p>
                <p className="text-sm text-teal-600 capitalize">{staff.role}</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setLocation("/staff/dashboard")}
                  className="w-full text-white"
                  style={{ backgroundColor: TEAL }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Dashboard
                </Button>

                <Button
                  onClick={handleLogoutAndSwitch}
                  variant="outline"
                  className="w-full"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign in as Different User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-sm text-gray-500">
          <p>Okapi Care Network EHR</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: TEAL }}
          >
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Okapi</span>
            <span className="text-gray-600 ml-1">EHR</span>
          </div>
        </div>

        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Staff Sign In
            </CardTitle>
            <CardDescription className="text-gray-600">
              Access your facility's EHR system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="facility" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="facility" className="gap-1 text-xs sm:text-sm">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Facility</span> PIN
                </TabsTrigger>
                <TabsTrigger value="password" className="gap-1 text-xs sm:text-sm">
                  <Lock className="h-4 w-4" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="pin" className="gap-1 text-xs sm:text-sm">
                  <KeyRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick</span> PIN
                </TabsTrigger>
              </TabsList>

              {/* Facility PIN Login Tab - Quick staff access */}
              <TabsContent value="facility">
                <form onSubmit={handleFacilityPinLogin} className="space-y-4">
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <p className="text-sm text-teal-800">
                      Quick access for staff. Get your facility's 4-digit PIN from your administrator.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Facility PIN</Label>
                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={4}
                        value={facilityPin}
                        onChange={setFacilityPin}
                        disabled={isSubmitting}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
                          <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
                          <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
                          <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-name">Your Name</Label>
                    <Input
                      id="staff-name"
                      type="text"
                      placeholder="Enter your name"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="name"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: TEAL }}
                    disabled={isSubmitting || facilityPin.length !== 4 || !staffName.trim()}
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
                </form>
              </TabsContent>

              {/* Password Login Tab */}
              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@facility.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: TEAL }}
                    disabled={isSubmitting}
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
                </form>
              </TabsContent>

              {/* PIN Login Tab */}
              <TabsContent value="pin">
                <form onSubmit={handlePinLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin-email">Email Address</Label>
                    <Input
                      id="pin-email"
                      type="email"
                      placeholder="staff@facility.com"
                      value={pinEmail}
                      onChange={(e) => setPinEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Enter Your PIN</Label>
                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={6}
                        value={pin}
                        onChange={setPin}
                        disabled={isSubmitting}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                          <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                          <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                          <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                          <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                          <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Enter your 4-6 digit PIN for quick access
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: TEAL }}
                    disabled={isSubmitting || pin.length < 4}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In with PIN"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Need access?{" "}
                <span className="text-gray-700">
                  Contact your facility administrator.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>Okapi Care Network EHR</p>
      </footer>
    </div>
  );
}
