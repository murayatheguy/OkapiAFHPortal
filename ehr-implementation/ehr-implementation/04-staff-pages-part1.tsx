// ============================================================================
// STAFF PORTAL - REACT PAGES
// Add these files to client/src/pages/staff/
// ============================================================================

// ============================================================================
// client/src/pages/staff/staff-login.tsx
// ============================================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useStaffAuth } from "@/lib/staff-auth";

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useStaffAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  
  const loginMutation = useMutation({
    mutationFn: async (data: { email?: string; password?: string; pin?: string }) => {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      login(data);
      setLocation("/staff/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };
  
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, pin });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-teal-700 mb-2">🦓 OKAPI</div>
          <CardTitle>Staff Portal</CardTitle>
          <CardDescription>Sign in to access resident care</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="pin">Quick PIN</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="pin">
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin-email">Email</Label>
                  <Input
                    id="pin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// client/src/pages/staff/staff-setup.tsx
// ============================================================================

import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function StaffSetup() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  
  // Validate token
  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ["staff-setup-validate", token],
    queryFn: async () => {
      const res = await fetch(`/api/staff/setup/validate?token=${token}`);
      if (!res.ok) throw new Error("Invalid or expired invite");
      return res.json();
    },
    enabled: !!token,
  });
  
  const setupMutation = useMutation({
    mutationFn: async (data: { token: string; password: string; pin?: string }) => {
      const res = await fetch("/api/staff/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Setup failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account setup complete!",
        description: "You can now log in to the Staff Portal.",
      });
      setLocation("/staff/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setupMutation.mutate({ token: token!, password, pin: pin || undefined });
  };
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-gray-600">This setup link is missing or invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  if (error || !tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid or Expired Invite</h2>
            <p className="text-gray-600">This invite link has expired or is no longer valid. Please contact your administrator for a new invite.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-teal-700 mb-2">🦓 OKAPI</div>
          <CardTitle>Set Up Your Account</CardTitle>
          <CardDescription>
            Welcome, {tokenData.firstName}! Create your password to access the Staff Portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={tokenData.email} disabled className="bg-gray-50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">Quick PIN (Optional)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4-6 digit PIN for quick login"
                className="text-center tracking-widest"
              />
              <p className="text-xs text-gray-500">Set a PIN for faster mobile login</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// client/src/pages/staff/staff-dashboard.tsx
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Pill, ClipboardList, AlertTriangle, 
  Activity, Clock, RefreshCw, ChevronRight 
} from "lucide-react";
import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { formatTime, formatRelativeTime } from "@/lib/utils";

export default function StaffDashboard() {
  const { staff } = useStaffAuth();
  
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/staff/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
  
  const getCurrentShiftLabel = (shift: string) => {
    switch (shift) {
      case 'day': return 'Day Shift (8am - 4pm)';
      case 'swing': return 'Swing Shift (4pm - 12am)';
      case 'night': return 'Night Shift (12am - 8am)';
      default: return shift;
    }
  };
  
  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </StaffLayout>
    );
  }
  
  return (
    <StaffLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good {getTimeOfDay()}, {staff?.firstName}
            </h1>
            <p className="text-gray-500">{getCurrentShiftLabel(dashboard?.currentShift)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/staff/residents">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-teal-600" />
                  <span className="text-2xl font-bold">{dashboard?.stats.totalResidents}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Residents</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/staff/mar">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Pill className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl font-bold">{dashboard?.stats.upcomingMeds}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Meds Due</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/staff/notes">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-8 w-8 text-amber-600" />
                  <span className="text-2xl font-bold">{dashboard?.stats.pendingNotes}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Notes Due</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/staff/incidents">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <span className="text-2xl font-bold">{dashboard?.stats.openIncidents}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Open Incidents</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        {/* Upcoming Meds */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Upcoming Medications
              </CardTitle>
              <Link href="/staff/mar">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboard?.upcomingMeds?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming meds in the next 2 hours</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.upcomingMeds?.map((item: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.resident.firstName} {item.resident.lastName.charAt(0)}.
                        </span>
                        {item.medication.isControlled && (
                          <Badge variant="outline" className="text-xs">Controlled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.medication.name} {item.medication.dosage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        {formatTime(item.scheduledTime)}
                      </p>
                      <Link href={`/staff/mar/give/${item.medication.id}?time=${item.scheduledTime}`}>
                        <Button size="sm" className="mt-1 bg-teal-600 hover:bg-teal-700">
                          Give
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/staff/notes/new">
            <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs">Daily Note</span>
            </Button>
          </Link>
          
          <Link href="/staff/vitals/new">
            <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
              <Activity className="h-5 w-5" />
              <span className="text-xs">Log Vitals</span>
            </Button>
          </Link>
          
          <Link href="/staff/incidents/new">
            <Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-red-600 border-red-200 hover:bg-red-50">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs">Report Incident</span>
            </Button>
          </Link>
          
          <Link href="/staff/handoff">
            <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
              <Users className="h-5 w-5" />
              <span className="text-xs">Shift Handoff</span>
            </Button>
          </Link>
        </div>
      </div>
    </StaffLayout>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}