/**
 * Admin Facilities List
 *
 * Paginated list of all facilities with search, filter, and impersonation
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/admin-auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Building2,
  Eye,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Facility {
  id: string;
  name: string;
  city: string;
  state: string;
  licenseNumber: string;
  licenseStatus: string;
  claimStatus: string;
  status: string;
  ownerId: string | null;
  ownerName: string | null;
  capacity: number;
  availableBeds: number;
  createdAt: string;
}

interface FacilitiesResponse {
  facilities: Facility[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminFacilities() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, impersonate } = useAdminAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [claimStatus, setClaimStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading, refetch } = useQuery<FacilitiesResponse>({
    queryKey: ["admin-facilities", search, claimStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (search) params.set("search", search);
      if (claimStatus && claimStatus !== "all") params.set("claimStatus", claimStatus);

      const response = await fetch(`/api/admin/facilities?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch facilities");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleImpersonate = async (facility: Facility) => {
    setImpersonatingId(facility.id);
    try {
      await impersonate(facility.id);
      toast({
        title: "Impersonation Started",
        description: `Now viewing as "${facility.name}"`,
      });
      // Redirect to owner dashboard
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

  const getClaimStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      claimed: { className: "bg-green-500/10 text-green-400 border-green-500/20", label: "Claimed" },
      pending: { className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Pending" },
      unclaimed: { className: "bg-slate-500/10 text-slate-400 border-slate-500/20", label: "Unclaimed" },
    };
    const variant = variants[status] || variants.unclaimed;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-7 w-7" />
            Facilities
          </h1>
          <p className="text-slate-400 mt-1">
            Manage all {data?.pagination.total || 0} facilities in the network
          </p>
        </div>

        {/* Filters */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, license, or city..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <Select
                value={claimStatus}
                onValueChange={(v) => {
                  setClaimStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Claim Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">City</TableHead>
                      <TableHead className="text-slate-400">License #</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Owner</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.facilities.map((facility) => (
                      <TableRow key={facility.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="font-medium text-white">
                          {facility.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {facility.city}, {facility.state}
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {facility.licenseNumber}
                        </TableCell>
                        <TableCell>{getClaimStatusBadge(facility.claimStatus)}</TableCell>
                        <TableCell className="text-slate-300">
                          {facility.ownerName || (
                            <span className="text-slate-500 italic">No owner</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                              onClick={() => setLocation(`/admin/facilities/${facility.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary hover:text-white"
                              onClick={() => handleImpersonate(facility)}
                              disabled={impersonatingId === facility.id}
                            >
                              {impersonatingId === facility.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCog className="h-4 w-4 mr-1" />
                                  Manage as Owner
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * 25 + 1} to{" "}
              {Math.min(page * 25, data.pagination.total)} of {data.pagination.total} facilities
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
