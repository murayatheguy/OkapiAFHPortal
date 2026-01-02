/**
 * Admin Dashboard
 *
 * Overview stats, quick actions, and recent activity
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/admin-auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  ClipboardCheck,
  Clock,
  ArrowRight,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  facilities: {
    total: number;
    byClaimStatus: Record<string, number>;
  };
  owners: {
    total: number;
    activeLastMonth: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, any> | null;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { admin, isLoading: authLoading, isAuthenticated } = useAdminAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="p-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {admin?.name}. Here's what's happening.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Facilities"
            value={stats?.facilities.total}
            icon={Building2}
            loading={statsLoading}
            color="blue"
          />
          <StatCard
            title="Claimed Facilities"
            value={stats?.facilities.byClaimStatus?.claimed}
            icon={ClipboardCheck}
            loading={statsLoading}
            color="green"
          />
          <StatCard
            title="Pending Claims"
            value={stats?.facilities.byClaimStatus?.pending}
            icon={Clock}
            loading={statsLoading}
            color="yellow"
          />
          <StatCard
            title="Total Owners"
            value={stats?.owners.total}
            icon={Users}
            loading={statsLoading}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setLocation("/admin/facilities")}
              >
                <span>Manage Facilities</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setLocation("/admin/owners")}
              >
                <span>View Owners</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setLocation("/admin/defaults")}
              >
                <span>Template Defaults</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Admin Activity
              </CardTitle>
              <CardDescription className="text-slate-400">
                Latest actions by administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                          {formatAction(activity.action)}
                        </p>
                        {activity.metadata && (
                          <p className="text-xs text-slate-400 truncate">
                            {formatMetadata(activity.metadata)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Facility Status Overview */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Facility Claim Status</CardTitle>
            <CardDescription className="text-slate-400">
              Distribution of facilities by claim status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex gap-4 flex-wrap">
                {Object.entries(stats?.facilities.byClaimStatus || {}).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === "claimed"
                          ? "bg-green-500"
                          : status === "pending"
                          ? "bg-yellow-500"
                          : "bg-slate-500"
                      }`}
                    />
                    <span className="text-slate-300 capitalize">{status}</span>
                    <span className="text-white font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value?: number;
  icon: any;
  loading: boolean;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-white mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
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
  };
  return actionMap[action] || action;
}

function formatMetadata(metadata: Record<string, any>): string {
  if (metadata.facilityName) return metadata.facilityName;
  if (metadata.fields) return `Fields: ${metadata.fields.join(", ")}`;
  return JSON.stringify(metadata);
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
