import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Building2, Users, MessageSquare, Star, LayoutDashboard, LogOut,
  CheckCircle, XCircle, Mail, Phone, MapPin, Calendar,
  Home, TrendingUp, Shield, Search, Trash2, ExternalLink, UserCheck, Clock,
  RefreshCw, Database, AlertCircle, Play, Loader2, Car, Plus, Edit, Globe,
  Eye, EyeOff, Lock, UserCog, Activity, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Facility, Inquiry, Review, Owner, ClaimRequest, TransportProvider, TransportBooking, ProviderReview } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminStats {
  totalFacilities: number;
  activeFacilities: number;
  totalOwners: number;
  pendingReviews: number;
  newInquiries: number;
}

function AdminLogin() {
  const { login } = useAdminAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1a14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-[#c9a962]" />
            </div>
            <CardTitle className="text-2xl font-serif text-white flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Portal
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your administrator credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@okapicarenetwork.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-[#0d1a14] border-[#2a3f35] text-white placeholder:text-gray-500 focus:border-[#c9a962]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-[#0d1a14] border-[#2a3f35] text-white placeholder:text-gray-500 pr-10 focus:border-[#c9a962]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#c9a962] hover:bg-[#b89952] text-black font-medium"
                disabled={isSubmitting}
                data-testid="button-admin-login"
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
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Link href="/">
            <span className="text-gray-400 hover:text-[#c9a962] text-sm cursor-pointer flex items-center justify-center gap-1">
              <Home className="h-4 w-4" />
              Back to Home
            </span>
          </Link>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: number; icon: any; trend?: string }) {
  return (
    <Card className="bg-[#1a2f25] border-[#2a3f35]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-3xl font-semibold text-white mt-1">{value}</p>
            {trend && (
              <p className="text-[#c9a962] text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {trend}
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-[#c9a962]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    login: "Admin logged in",
    logout: "Admin logged out",
    impersonate_start: "Started impersonation",
    impersonate_stop: "Stopped impersonation",
    edit_facility: "Edited facility",
    create_default: "Created default",
    update_default: "Updated default",
    propagate_defaults: "Propagated defaults",
    approve_claim: "Approved claim",
    reject_claim: "Rejected claim",
    approve_review: "Approved review",
    reject_review: "Rejected review",
  };
  return actionMap[action] || action;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const { data: activityData } = useQuery<{ recentActivity: ActivityLogEntry[] }>({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Homes" value={stats.totalFacilities} icon={Building2} />
        <StatCard title="Active Homes" value={stats.activeFacilities} icon={CheckCircle} />
        <StatCard title="Total Owners" value={stats.totalOwners} icon={Users} />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={Star} />
        <StatCard title="New Inquiries" value={stats.newInquiries} icon={MessageSquare} />
      </div>

      {/* Recent Activity */}
      <Card className="bg-[#1a2f25] border-[#2a3f35]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#c9a962]" />
            Recent Admin Activity
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest actions by administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData?.recentActivity && activityData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {activityData.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1a14]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#c9a962]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-[#c9a962]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {formatAction(activity.action)}
                    </p>
                    {activity.metadata && (
                      <p className="text-xs text-gray-400 truncate">
                        {activity.metadata.facilityName ||
                         (activity.metadata.fields ? `Fields: ${activity.metadata.fields.join(", ")}` : "")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FacilitiesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { impersonate } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<string>("all");
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const { data: facilities = [], isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ["/api/owners"],
  });

  const updateFacilityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Facility> }) => {
      const res = await apiRequest("PATCH", `/api/facilities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Facility updated" });
    },
  });

  const handleImpersonate = async (facility: Facility) => {
    setImpersonatingId(facility.id);
    try {
      await impersonate(facility.id);
      toast({
        title: "Admin Mode Started",
        description: `Now viewing as "${facility.name}"`,
      });
      setLocation("/owner/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to impersonate",
        variant: "destructive",
      });
    } finally {
      setImpersonatingId(null);
    }
  };

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return null;
    const owner = owners.find(o => o.id === ownerId);
    return owner?.name || "Unknown";
  };

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    const matchesClaim = claimFilter === "all" || f.claimStatus === claimFilter;
    return matchesSearch && matchesStatus && matchesClaim;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-600/20 text-gray-400 hover:bg-gray-600/30">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading facilities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or city..."
            className="pl-10 bg-[#0d1a14] border-[#2a3f35] text-white"
            data-testid="input-search-facilities"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="active" className="text-white">Active</SelectItem>
            <SelectItem value="pending" className="text-white">Pending</SelectItem>
            <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={claimFilter} onValueChange={setClaimFilter}>
          <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white" data-testid="select-claim-filter">
            <SelectValue placeholder="Ownership" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
            <SelectItem value="all" className="text-white">All Ownership</SelectItem>
            <SelectItem value="claimed" className="text-white">Claimed</SelectItem>
            <SelectItem value="pending" className="text-white">Claim Pending</SelectItem>
            <SelectItem value="unclaimed" className="text-white">Unclaimed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredFacilities.map((facility) => {
          const ownerName = getOwnerName(facility.ownerId);
          return (
          <Card key={facility.id} className="bg-[#1a2f25] border-[#2a3f35]" data-testid={`card-facility-${facility.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#0d1a14] overflow-hidden flex-shrink-0">
                    {facility.images?.[0] && (
                      <img src={facility.images[0]} alt={facility.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{facility.name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {facility.city}, WA
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(facility.status)}
                      {facility.featured && (
                        <Badge className="bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30">Featured</Badge>
                      )}
                      <span className="text-gray-400 text-sm">
                        {facility.availableBeds} beds available
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline"
                        className={
                          facility.claimStatus === "claimed" 
                            ? "text-green-400 border-green-600/30" 
                            : facility.claimStatus === "pending"
                            ? "text-yellow-400 border-yellow-600/30"
                            : "text-gray-400 border-gray-600/30"
                        }
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        {facility.claimStatus === "claimed" ? "Claimed" : facility.claimStatus === "pending" ? "Claim Pending" : "Unclaimed"}
                      </Badge>
                      {ownerName && (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ownerName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/facility/${facility.id}`}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" data-testid={`button-view-facility-${facility.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10"
                    onClick={() => handleImpersonate(facility)}
                    disabled={impersonatingId === facility.id}
                    data-testid={`button-impersonate-${facility.id}`}
                  >
                    {impersonatingId === facility.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCog className="h-4 w-4 mr-1" />
                        Manage
                      </>
                    )}
                  </Button>
                  <Select
                    value={facility.status}
                    onValueChange={(value) => updateFacilityMutation.mutate({ id: facility.id, data: { status: value } })}
                  >
                    <SelectTrigger className="w-[120px] bg-[#0d1a14] border-[#2a3f35] text-white text-sm" data-testid={`select-facility-status-${facility.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
                      <SelectItem value="active" className="text-white">Active</SelectItem>
                      <SelectItem value="pending" className="text-white">Pending</SelectItem>
                      <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={facility.featured ? "text-[#c9a962]" : "text-gray-400 hover:text-[#c9a962]"}
                    onClick={() => updateFacilityMutation.mutate({ id: facility.id, data: { featured: !facility.featured } })}
                    data-testid={`button-toggle-featured-${facility.id}`}
                  >
                    <Star className={`h-4 w-4 ${facility.featured ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No facilities found matching your criteria.
        </div>
      )}
    </div>
  );
}

function OwnersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newOwner, setNewOwner] = useState({ name: "", email: "", phone: "", password: "" });

  const { data: owners = [], isLoading } = useQuery<Owner[]>({
    queryKey: ["/api/owners"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const createOwnerMutation = useMutation({
    mutationFn: async (data: typeof newOwner) => {
      const res = await apiRequest("POST", "/api/owners", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowAddDialog(false);
      setNewOwner({ name: "", email: "", phone: "", password: "" });
      toast({ title: "Owner added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getOwnerFacilityCount = (ownerId: string) => {
    return facilities.filter(f => f.ownerId === ownerId).length;
  };

  const filteredOwners = statusFilter === "all" 
    ? owners 
    : owners.filter(o => {
        if (statusFilter === "pending") {
          return o.status === "pending" || o.status === "pending_verification";
        }
        return o.status === statusFilter;
      });

  if (isLoading) {
    return <div className="text-gray-400">Loading owners...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-gray-400">{filteredOwners.length} registered owners</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#c9a962] hover:bg-[#b89952] text-black"
          data-testid="button-add-owner"
        >
          Add Owner
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredOwners.map((owner) => {
          const facilityCount = getOwnerFacilityCount(owner.id);
          return (
            <Card key={owner.id} className="bg-[#1a2f25] border-[#2a3f35]" data-testid={`card-owner-${owner.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">{owner.name}</h3>
                      <Badge 
                        variant={owner.status === "active" ? "default" : "secondary"}
                        className={
                          owner.status === "active" 
                            ? "bg-green-600/20 text-green-400 border-green-600/30" 
                            : (owner.status === "pending" || owner.status === "pending_verification")
                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                            : owner.status === "suspended"
                            ? "bg-red-600/20 text-red-400 border-red-600/30"
                            : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                        }
                      >
                        {owner.status === "pending_verification" ? "Pending Setup" : owner.status || "pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {owner.email}
                      </span>
                      {owner.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {owner.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {facilityCount} {facilityCount === 1 ? "facility" : "facilities"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                      {owner.lastLoginAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last login {new Date(owner.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!owner.emailVerified && (
                      <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                        Email not verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#1a2f25] border-[#2a3f35]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Owner</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new owner account for facility management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name</Label>
              <Input
                value={newOwner.name}
                onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                placeholder="John Smith"
                className="bg-[#0d1a14] border-[#2a3f35] text-white"
                data-testid="input-owner-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={newOwner.email}
                onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                placeholder="owner@example.com"
                className="bg-[#0d1a14] border-[#2a3f35] text-white"
                data-testid="input-owner-email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Phone</Label>
              <Input
                value={newOwner.phone}
                onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                placeholder="(206) 555-0123"
                className="bg-[#0d1a14] border-[#2a3f35] text-white"
                data-testid="input-owner-phone"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input
                type="password"
                value={newOwner.password}
                onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })}
                placeholder="••••••••"
                className="bg-[#0d1a14] border-[#2a3f35] text-white"
                data-testid="input-owner-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={() => createOwnerMutation.mutate(newOwner)}
              className="bg-[#c9a962] hover:bg-[#b89952] text-black"
              disabled={!newOwner.name || !newOwner.email}
              data-testid="button-save-owner"
            >
              Add Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InquiriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/admin/inquiries"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Inquiry> }) => {
      const res = await apiRequest("PATCH", `/api/inquiries/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Inquiry updated" });
    },
  });

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name || "Unknown Facility";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">New</Badge>;
      case "contacted":
        return <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Contacted</Badge>;
      case "toured":
        return <Badge className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30">Toured</Badge>;
      case "admitted":
        return <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">Admitted</Badge>;
      case "closed":
        return <Badge className="bg-gray-600/20 text-gray-400 hover:bg-gray-600/30">Closed</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400">{status}</Badge>;
    }
  };

  const filteredInquiries = inquiries.filter((i) => {
    return statusFilter === "all" || i.status === statusFilter;
  });

  if (isLoading) {
    return <div className="text-gray-400">Loading inquiries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">{inquiries.length} total inquiries</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white" data-testid="select-inquiry-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="new" className="text-white">New</SelectItem>
            <SelectItem value="contacted" className="text-white">Contacted</SelectItem>
            <SelectItem value="toured" className="text-white">Toured</SelectItem>
            <SelectItem value="admitted" className="text-white">Admitted</SelectItem>
            <SelectItem value="closed" className="text-white">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredInquiries.map((inquiry) => (
          <Card key={inquiry.id} className="bg-[#1a2f25] border-[#2a3f35]" data-testid={`card-inquiry-${inquiry.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{inquiry.name}</h3>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <p className="text-[#c9a962] text-sm mt-1">{getFacilityName(inquiry.facilityId)}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {inquiry.email}
                    </span>
                    {inquiry.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {inquiry.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  {inquiry.message && (
                    <p className="text-gray-300 text-sm mt-2 line-clamp-2">{inquiry.message}</p>
                  )}
                </div>
                <Select
                  value={inquiry.status}
                  onValueChange={(value) => updateInquiryMutation.mutate({ id: inquiry.id, data: { status: value } })}
                >
                  <SelectTrigger className="w-[130px] bg-[#0d1a14] border-[#2a3f35] text-white text-sm" data-testid={`select-inquiry-status-${inquiry.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
                    <SelectItem value="new" className="text-white">New</SelectItem>
                    <SelectItem value="contacted" className="text-white">Contacted</SelectItem>
                    <SelectItem value="toured" className="text-white">Toured</SelectItem>
                    <SelectItem value="admitted" className="text-white">Admitted</SelectItem>
                    <SelectItem value="closed" className="text-white">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInquiries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No inquiries found.
        </div>
      )}
    </div>
  );
}

interface ClaimWithFacility extends ClaimRequest {
  facility?: Facility;
}

function ClaimsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithFacility | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: allClaims = [], isLoading } = useQuery<ClaimRequest[]>({
    queryKey: ["/api/claims"],
  });

  const { data: pendingClaims = [] } = useQuery<ClaimWithFacility[]>({
    queryKey: ["/api/claims/pending"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const approveMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
      const res = await apiRequest("POST", `/api/claims/${claimId}/approve`, { 
        adminId: adminData.id 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Claim approved", description: "Owner account created/linked successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
      const res = await apiRequest("POST", `/api/claims/${claimId}/reject`, { 
        adminId: adminData.id,
        rejectionReason: reason
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      setShowRejectDialog(false);
      setSelectedClaim(null);
      setRejectionReason("");
      toast({ title: "Claim rejected" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name || "Unknown Facility";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Pending</Badge>;
      case "verified":
        return <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">Verified</Badge>;
      case "approved":
        return <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400">{status}</Badge>;
    }
  };

  const displayClaims = statusFilter === "all" ? allClaims : 
    allClaims.filter(c => c.status === statusFilter);

  if (isLoading) {
    return <div className="text-gray-400">Loading claims...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-gray-400">{pendingClaims.length} pending claims</p>
          <Badge className="bg-[#c9a962]/20 text-[#c9a962]">{allClaims.length} total</Badge>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white" data-testid="select-claim-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
            <SelectItem value="all" className="text-white">All Claims</SelectItem>
            <SelectItem value="pending" className="text-white">Pending Review</SelectItem>
            <SelectItem value="verified" className="text-white">Verified</SelectItem>
            <SelectItem value="approved" className="text-white">Approved</SelectItem>
            <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {displayClaims.map((claim) => (
          <Card key={claim.id} className="bg-[#1a2f25] border-[#2a3f35]" data-testid={`card-claim-${claim.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-white">{claim.requesterName}</h3>
                    {getStatusBadge(claim.status)}
                  </div>
                  <p className="text-[#c9a962] text-sm mb-2">
                    Claiming: {getFacilityName(claim.facilityId)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {claim.requesterEmail}
                    </span>
                    {claim.requesterPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {claim.requesterPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  {claim.relationship && (
                    <p className="text-gray-400 text-sm mt-2">Role: {claim.relationship}</p>
                  )}
                  {claim.rejectionReason && (
                    <p className="text-red-400 text-sm mt-2">Rejected: {claim.rejectionReason}</p>
                  )}
                </div>
                {(claim.status === "pending" || claim.status === "verified") && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                      onClick={() => approveMutation.mutate(claim.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-claim-${claim.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setShowRejectDialog(true);
                      }}
                      data-testid={`button-reject-claim-${claim.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayClaims.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No claims found.
        </div>
      )}

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#1a2f25] border-[#2a3f35]">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Claim</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this ownership claim.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="bg-[#0d1a14] border-[#2a3f35] text-white"
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={() => selectedClaim && rejectMutation.mutate({ claimId: selectedClaim.id, reason: rejectionReason })}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Review> }) => {
      const res = await apiRequest("PATCH", `/api/reviews/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Review updated" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Review deleted" });
    },
  });

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name || "Unknown Facility";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400">{status}</Badge>;
    }
  };

  const filteredReviews = reviews.filter((r) => {
    return statusFilter === "all" || r.status === statusFilter;
  });

  if (isLoading) {
    return <div className="text-gray-400">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">{reviews.length} total reviews</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-[#0d1a14] border-[#2a3f35] text-white" data-testid="select-review-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="pending" className="text-white">Pending</SelectItem>
            <SelectItem value="approved" className="text-white">Approved</SelectItem>
            <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="bg-[#1a2f25] border-[#2a3f35]" data-testid={`card-review-${review.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{review.authorName}</h3>
                    {getStatusBadge(review.status)}
                    <div className="flex items-center text-[#c9a962]">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#c9a962] text-sm mt-1">{getFacilityName(review.facilityId)}</p>
                  {review.title && (
                    <p className="text-white font-medium mt-2">{review.title}</p>
                  )}
                  <p className="text-gray-300 text-sm mt-1">{review.content}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {review.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        onClick={() => updateReviewMutation.mutate({ id: review.id, data: { status: "approved" } })}
                        data-testid={`button-approve-review-${review.id}`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => updateReviewMutation.mutate({ id: review.id, data: { status: "rejected" } })}
                        data-testid={`button-reject-review-${review.id}`}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                    onClick={() => deleteReviewMutation.mutate(review.id)}
                    data-testid={`button-delete-review-${review.id}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No reviews found.
        </div>
      )}
    </div>
  );
}

interface DshsSyncLog {
  id: string;
  syncType: string;
  status: string;
  homesChecked: number;
  homesAdded: number;
  homesUpdated: number;
  inspectionsAdded: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

interface DshsSyncStatus {
  logs: DshsSyncLog[];
  totalHomes: number;
  syncedHomes: number;
}

function DshsSyncTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>();

  const { data: syncStatus, isLoading } = useQuery<DshsSyncStatus>({
    queryKey: ["/api/admin/dshs-sync"],
    refetchInterval: 10000,
  });

  const { data: counties } = useQuery<{ counties: string[] }>({
    queryKey: ["/api/admin/dshs-sync/counties"],
  });

  const triggerSyncMutation = useMutation({
    mutationFn: async ({ type, county }: { type: string; county?: string }) => {
      const res = await fetch("/api/admin/dshs-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, county }),
      });
      if (!res.ok) throw new Error("Failed to start sync");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "The DSHS sync has been initiated. This may take several hours.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dshs-sync"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start sync",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-900/20 text-green-400 border-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">In Progress</Badge>;
      case "failed":
        return <Badge className="bg-red-900/20 text-red-400 border-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-800">{status}</Badge>;
    }
  };

  const isAnyInProgress = syncStatus?.logs?.some(log => log.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Facilities</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {isLoading ? "-" : syncStatus?.totalHomes || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#c9a962]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Synced with DSHS</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {isLoading ? "-" : syncStatus?.syncedHomes || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sync Status</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {isAnyInProgress ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      Running
                    </span>
                  ) : (
                    "Idle"
                  )}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a2f25] border-[#2a3f35]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#c9a962]" />
            Manual Sync Controls
          </CardTitle>
          <CardDescription className="text-gray-400">
            Trigger a sync with the Washington State DSHS database. Full sync takes 2-4 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => triggerSyncMutation.mutate({ type: "full" })}
              disabled={triggerSyncMutation.isPending || isAnyInProgress}
              className="bg-[#c9a962] hover:bg-[#b89952] text-black"
              data-testid="button-full-sync"
            >
              {triggerSyncMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Full Sync
            </Button>

            <div className="flex items-center gap-2">
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-[200px] bg-[#0d1a14] border-[#2a3f35] text-white">
                  <SelectValue placeholder="Select county..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
                  {counties?.counties?.map((county) => (
                    <SelectItem key={county} value={county} className="text-white hover:bg-[#2a3f35]">
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => selectedCounty && triggerSyncMutation.mutate({ type: "single", county: selectedCounty })}
                disabled={!selectedCounty || triggerSyncMutation.isPending || isAnyInProgress}
                variant="outline"
                className="border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10"
                data-testid="button-county-sync"
              >
                Sync County
              </Button>
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            Auto-sync runs daily at 3 AM Pacific. Last sync information shown below.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#1a2f25] border-[#2a3f35]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#c9a962]" />
            Sync History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading sync logs...
            </div>
          ) : syncStatus?.logs && syncStatus.logs.length > 0 ? (
            <div className="space-y-4">
              {syncStatus.logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-[#0d1a14] rounded-lg border border-[#2a3f35]"
                  data-testid={`sync-log-${log.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      <span className="text-white font-medium">
                        {log.syncType === "full" ? "Full Sync" : "Single County Sync"}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {log.startedAt ? new Date(log.startedAt).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Checked:</span>{" "}
                      <span className="text-white">{log.homesChecked}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Added:</span>{" "}
                      <span className="text-green-400">{log.homesAdded}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Updated:</span>{" "}
                      <span className="text-[#c9a962]">{log.homesUpdated}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Inspections:</span>{" "}
                      <span className="text-blue-400">{log.inspectionsAdded}</span>
                    </div>
                  </div>
                  {log.errorMessage && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-800">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {log.errorMessage}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No sync logs yet. Start a sync to see the history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TransportStats {
  totalProviders: number;
  activeProviders: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalReviews: number;
  pendingReviews: number;
}

function TransportTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [subTab, setSubTab] = useState("providers");
  const [editingProvider, setEditingProvider] = useState<TransportProvider | null>(null);
  const [showProviderForm, setShowProviderForm] = useState(false);

  const { data: stats } = useQuery<TransportStats>({
    queryKey: ["/api/admin/transport/stats"],
  });

  const { data: providers = [], isLoading: loadingProviders } = useQuery<TransportProvider[]>({
    queryKey: ["/api/admin/transport/providers"],
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<TransportBooking[]>({
    queryKey: ["/api/admin/transport/bookings"],
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<ProviderReview[]>({
    queryKey: ["/api/admin/transport/reviews"],
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: Partial<TransportProvider>) => {
      const res = await fetch("/api/admin/transport/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create provider");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/stats"] });
      setShowProviderForm(false);
      toast({ title: "Provider created" });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransportProvider> }) => {
      const res = await fetch(`/api/admin/transport/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update provider");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/providers"] });
      setEditingProvider(null);
      toast({ title: "Provider updated" });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/transport/providers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete provider");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/stats"] });
      toast({ title: "Provider deleted" });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransportBooking> }) => {
      const res = await fetch(`/api/admin/transport/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/stats"] });
      toast({ title: "Booking updated" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProviderReview> }) => {
      const res = await fetch(`/api/admin/transport/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transport/stats"] });
      toast({ title: "Review updated" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600/20 text-green-400">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-600/20 text-gray-400">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600/20 text-yellow-400">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-600/20 text-blue-400">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-600/20 text-green-400">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-600/20 text-red-400">Cancelled</Badge>;
      case "approved":
        return <Badge className="bg-green-600/20 text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600/20 text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Providers</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {stats?.activeProviders ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-[#c9a962]/10 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-[#c9a962]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {stats?.totalBookings ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Bookings</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {stats?.pendingBookings ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2f25] border-[#2a3f35]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Reviews</p>
                <p className="text-3xl font-semibold text-white mt-1">
                  {stats?.pendingReviews ?? 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-[#1a2f25] border border-[#2a3f35]">
          <TabsTrigger value="providers" className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black">
            Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black">
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black">
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-medium">Transport Providers</h3>
            <Button
              onClick={() => setShowProviderForm(true)}
              className="bg-[#c9a962] hover:bg-[#b89952] text-black"
              data-testid="button-add-provider"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          {loadingProviders ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#c9a962]" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No transport providers yet. Add your first provider to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="bg-[#1a2f25] border-[#2a3f35]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-[#c9a962]/10 flex items-center justify-center">
                          <Car className="h-6 w-6 text-[#c9a962]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{provider.name}</h4>
                            {getStatusBadge(provider.status)}
                            {provider.isFeatured && (
                              <Badge className="bg-[#c9a962]/20 text-[#c9a962]">Featured</Badge>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">{provider.email} • {provider.phone}</div>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-gray-500">
                              Rating: {provider.rating || "N/A"} ({provider.reviewCount || 0} reviews)
                            </span>
                            {provider.website && (
                              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-[#c9a962] hover:underline flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#2a3f35] text-gray-300 hover:bg-[#2a3f35]"
                          onClick={() => setEditingProvider(provider)}
                          data-testid={`button-edit-provider-${provider.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-800 text-red-400 hover:bg-red-900/20"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this provider?")) {
                              deleteProviderMutation.mutate(provider.id);
                            }
                          }}
                          data-testid={`button-delete-provider-${provider.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <h3 className="text-white text-lg font-medium mb-4">Transport Bookings</h3>
          
          {loadingBookings ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#c9a962]" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No transport bookings yet.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="bg-[#1a2f25] border-[#2a3f35]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium">#{booking.bookingNumber}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-gray-400 text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.pickupLocation}
                          </div>
                          <div>Resident: {booking.residentInitials || "N/A"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-500"
                              onClick={() => updateBookingMutation.mutate({ id: booking.id, data: { status: "confirmed" } })}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-800 text-red-400 hover:bg-red-900/20"
                              onClick={() => updateBookingMutation.mutate({ id: booking.id, data: { status: "cancelled" } })}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-500"
                            onClick={() => updateBookingMutation.mutate({ id: booking.id, data: { status: "completed" } })}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <h3 className="text-white text-lg font-medium mb-4">Provider Reviews</h3>
          
          {loadingReviews ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#c9a962]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No provider reviews yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-[#1a2f25] border-[#2a3f35]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                              />
                            ))}
                          </div>
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-gray-300 mb-2">{review.reviewText || review.title || "No review text"}</p>
                        <div className="text-gray-500 text-sm">
                          {new Date(review.createdAt || "").toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-500"
                              onClick={() => updateReviewMutation.mutate({ id: review.id, data: { status: "approved" } })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-800 text-red-400 hover:bg-red-900/20"
                              onClick={() => updateReviewMutation.mutate({ id: review.id, data: { status: "rejected" } })}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showProviderForm || !!editingProvider} onOpenChange={(open) => {
        if (!open) {
          setShowProviderForm(false);
          setEditingProvider(null);
        }
      }}>
        <DialogContent className="bg-[#1a2f25] border-[#2a3f35] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProvider ? "Edit Provider" : "Add New Provider"}
            </DialogTitle>
          </DialogHeader>
          <ProviderForm
            provider={editingProvider}
            onSubmit={(data) => {
              if (editingProvider) {
                updateProviderMutation.mutate({ id: editingProvider.id, data });
              } else {
                createProviderMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowProviderForm(false);
              setEditingProvider(null);
            }}
            isLoading={createProviderMutation.isPending || updateProviderMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProviderForm({ 
  provider, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  provider: TransportProvider | null;
  onSubmit: (data: Partial<TransportProvider>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || "",
    slug: provider?.slug || "",
    email: provider?.email || "",
    phone: provider?.phone || "",
    website: provider?.website || "",
    description: provider?.description || "",
    status: provider?.status || "active",
    acceptsMedicaid: provider?.acceptsMedicaid || false,
    acceptsMedicare: provider?.acceptsMedicare || false,
    acceptsPrivatePay: provider?.acceptsPrivatePay ?? true,
    isFeatured: provider?.isFeatured || false,
    baseRateCents: provider?.baseRateCents || 0,
    pricePerMileCents: provider?.pricePerMileCents || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onSubmit({ ...formData, slug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Provider Name *</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-[#0d1a14] border-[#2a3f35] text-white"
            data-testid="input-provider-name"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="bg-[#0d1a14] border-[#2a3f35] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2f25] border-[#2a3f35]">
              <SelectItem value="active" className="text-white">Active</SelectItem>
              <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-[#0d1a14] border-[#2a3f35] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-[#0d1a14] border-[#2a3f35] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Website</Label>
        <Input
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="bg-[#0d1a14] border-[#2a3f35] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-[#0d1a14] border-[#2a3f35] text-white min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Base Rate (cents)</Label>
          <Input
            type="number"
            value={formData.baseRateCents}
            onChange={(e) => setFormData({ ...formData, baseRateCents: parseInt(e.target.value) || 0 })}
            className="bg-[#0d1a14] border-[#2a3f35] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Price per Mile (cents)</Label>
          <Input
            type="number"
            value={formData.pricePerMileCents}
            onChange={(e) => setFormData({ ...formData, pricePerMileCents: parseInt(e.target.value) || 0 })}
            className="bg-[#0d1a14] border-[#2a3f35] text-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptsMedicaid}
            onChange={(e) => setFormData({ ...formData, acceptsMedicaid: e.target.checked })}
            className="rounded"
          />
          Accepts Medicaid
        </label>
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptsMedicare}
            onChange={(e) => setFormData({ ...formData, acceptsMedicare: e.target.checked })}
            className="rounded"
          />
          Accepts Medicare
        </label>
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptsPrivatePay}
            onChange={(e) => setFormData({ ...formData, acceptsPrivatePay: e.target.checked })}
            className="rounded"
          />
          Accepts Private Pay
        </label>
        <label className="flex items-center gap-2 text-[#c9a962] cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            className="rounded"
          />
          Featured Provider
        </label>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-[#2a3f35] text-gray-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#c9a962] hover:bg-[#b89952] text-black"
          data-testid="button-submit-provider"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            provider ? "Update Provider" : "Create Provider"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { admin, logout, isImpersonating } = useAdminAuth();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#0d1a14]">
      {/* Impersonation Banner - shown at very top when impersonating */}
      {isImpersonating && <ImpersonationBanner />}

      <header className="bg-[#1a2f25] border-b border-[#2a3f35] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#c9a962]" />
              <div>
                <h1 className="text-xl font-serif text-white">Admin Portal</h1>
                <p className="text-gray-400 text-sm">{admin?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="link-home">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1a2f25] border border-[#2a3f35]">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-dashboard"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="facilities"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-facilities"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Homes
            </TabsTrigger>
            <TabsTrigger
              value="owners"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-owners"
            >
              <Users className="h-4 w-4 mr-2" />
              Owners
            </TabsTrigger>
            <TabsTrigger
              value="inquiries"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-inquiries"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-reviews"
            >
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger
              value="claims"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-claims"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Claims
            </TabsTrigger>
            <TabsTrigger
              value="dshs-sync"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-dshs-sync"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              DSHS Sync
            </TabsTrigger>
            <TabsTrigger
              value="transport"
              className="data-[state=active]:bg-[#c9a962] data-[state=active]:text-black"
              data-testid="tab-transport"
            >
              <Car className="h-4 w-4 mr-2" />
              Transport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {stats && <Dashboard stats={stats} />}
          </TabsContent>

          <TabsContent value="facilities">
            <FacilitiesTab />
          </TabsContent>

          <TabsContent value="owners">
            <OwnersTab />
          </TabsContent>

          <TabsContent value="inquiries">
            <InquiriesTab />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab />
          </TabsContent>

          <TabsContent value="claims">
            <ClaimsTab />
          </TabsContent>

          <TabsContent value="dshs-sync">
            <DshsSyncTab />
          </TabsContent>

          <TabsContent value="transport">
            <TransportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1a14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a962]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
