import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Building2, Users, MessageSquare, Star, LayoutDashboard, LogOut,
  CheckCircle, XCircle, Mail, Phone, MapPin, Calendar,
  Home, TrendingUp, Shield, Search, Trash2, ExternalLink, UserCheck, Clock
} from "lucide-react";
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
import type { Facility, Inquiry, Review, Owner, ClaimRequest } from "@shared/schema";
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

function AdminLogin({ onLogin }: { onLogin: (admin: AdminData) => void }) {
  const handleSignIn = () => {
    const adminData: AdminData = {
      id: "dev-admin",
      email: "admin@okapicare.com",
      name: "Admin User",
      role: "super_admin"
    };
    localStorage.setItem("adminData", JSON.stringify(adminData));
    onLogin(adminData);
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
            <CardTitle className="text-2xl font-serif text-white">Admin Portal</CardTitle>
            <CardDescription className="text-gray-400">
              Manage Okapi Care Network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignIn}
              className="w-full bg-[#c9a962] hover:bg-[#b89952] text-black font-medium"
              data-testid="button-admin-login"
            >
              Sign In
            </Button>
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

function Dashboard({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Homes" value={stats.totalFacilities} icon={Building2} />
        <StatCard title="Active Homes" value={stats.activeFacilities} icon={CheckCircle} />
        <StatCard title="Total Owners" value={stats.totalOwners} icon={Users} />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={Star} />
        <StatCard title="New Inquiries" value={stats.newInquiries} icon={MessageSquare} />
      </div>
    </div>
  );
}

function FacilitiesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<string>("all");

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

function AdminDashboard({ admin, onLogout }: { admin: AdminData; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="min-h-screen bg-[#0d1a14]">
      <header className="bg-[#1a2f25] border-b border-[#2a3f35] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#c9a962]" />
              <div>
                <h1 className="text-xl font-serif text-white">Admin Portal</h1>
                <p className="text-gray-400 text-sm">{admin.email}</p>
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
                onClick={onLogout}
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
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminData | null>(() => {
    const stored = localStorage.getItem("adminData");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("adminData");
    setAdmin(null);
  };

  if (!admin) {
    return <AdminLogin onLogin={setAdmin} />;
  }

  return <AdminDashboard admin={admin} onLogout={handleLogout} />;
}
