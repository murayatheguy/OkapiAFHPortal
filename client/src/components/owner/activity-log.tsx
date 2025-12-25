import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Users,
  Shield,
  Pill,
  AlertTriangle,
  FileText,
  GraduationCap,
  Settings,
  Building2,
  Truck,
  MessageSquare,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  Edit,
  Eye,
  Printer,
  Check,
  X,
  Clock,
  Filter,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface ActivityLogEntry {
  id: string;
  userId?: string;
  userType?: string;
  userName?: string;
  action: string;
  category?: string;
  description?: string;
  facilityId?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

interface ActivityLogSummary {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  byCategory: Record<string, number>;
  recentActivity: ActivityLogEntry[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  auth: LogIn,
  resident: Users,
  staff: Shield,
  medication: Pill,
  incident: AlertTriangle,
  form: FileText,
  credential: GraduationCap,
  settings: Settings,
  facility: Building2,
  transport: Truck,
  inquiry: MessageSquare,
};

const ACTION_ICONS: Record<string, React.ComponentType<any>> = {
  login: LogIn,
  logout: LogOut,
  login_failed: X,
  create: UserPlus,
  update: Edit,
  delete: UserMinus,
  view: Eye,
  print: Printer,
  submit: Check,
  give: Check,
  miss: X,
  refuse: X,
  expire: Clock,
  renew: Check,
  resolve: Check,
  discharge: UserMinus,
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-100 text-blue-800",
  resident: "bg-teal-100 text-teal-800",
  staff: "bg-purple-100 text-purple-800",
  medication: "bg-pink-100 text-pink-800",
  incident: "bg-red-100 text-red-800",
  form: "bg-amber-100 text-amber-800",
  credential: "bg-indigo-100 text-indigo-800",
  settings: "bg-gray-100 text-gray-800",
  facility: "bg-emerald-100 text-emerald-800",
  transport: "bg-orange-100 text-orange-800",
  inquiry: "bg-cyan-100 text-cyan-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: "Authentication",
  resident: "Residents",
  staff: "Staff",
  medication: "Medications",
  incident: "Incidents",
  form: "Forms",
  credential: "Credentials",
  settings: "Settings",
  facility: "Facility",
  transport: "Transport",
  inquiry: "Inquiries",
};

interface ActivityLogProps {
  facilityId: string;
  compact?: boolean;
}

export function ActivityLog({ facilityId, compact = false }: ActivityLogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7");

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: logs, isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: [
      "activity-log",
      facilityId,
      selectedCategory,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: compact ? "10" : "100",
      });
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      const res = await fetch(
        `/api/owners/facilities/${facilityId}/activity-log?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch activity log");
      return res.json();
    },
    enabled: !!facilityId,
  });

  const { data: summary } = useQuery<ActivityLogSummary>({
    queryKey: ["activity-log-summary", facilityId],
    queryFn: async () => {
      const res = await fetch(
        `/api/owners/facilities/${facilityId}/activity-log/summary`
      );
      if (!res.ok) throw new Error("Failed to fetch activity summary");
      return res.json();
    },
    enabled: !!facilityId && !compact,
  });

  const getCategoryIcon = (category?: string) => {
    const Icon = CATEGORY_ICONS[category || ""] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    return <Icon className="h-3.5 w-3.5" />;
  };

  const getCategoryColor = (category?: string) => {
    return CATEGORY_COLORS[category || ""] || "bg-gray-100 text-gray-800";
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-sm py-1.5 border-b last:border-0"
                >
                  <div
                    className={`p-1 rounded-full ${getCategoryColor(log.category)}`}
                  >
                    {getCategoryIcon(log.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.userName && <span>{log.userName} · </span>}
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.todayCount}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-green-100">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.weekCount}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-purple-100">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.monthCount}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-amber-100">
                  <Filter className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(summary.byCategory).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && Object.keys(summary.byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byCategory).map(([cat, count]) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className={`${getCategoryColor(cat)} border-0 gap-1.5`}
                >
                  {getCategoryIcon(cat)}
                  {CATEGORY_LABELS[cat] || cat}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity Log</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="resident">Residents</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="medication">Medications</SelectItem>
                  <SelectItem value="incident">Incidents</SelectItem>
                  <SelectItem value="form">Forms</SelectItem>
                  <SelectItem value="credential">Credentials</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading activity log...
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-1.5 rounded-full ${getCategoryColor(log.category)}`}
                    >
                      {getCategoryIcon(log.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {log.description || `${log.action} ${log.entityType || ""}`}
                        </p>
                        <Badge variant="outline" className="text-xs h-5">
                          {getActionIcon(log.action)}
                          <span className="ml-1">{log.action}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {log.userName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {log.userName}
                          </span>
                        )}
                        <span>·</span>
                        <span>
                          {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                        {log.entityName && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">
                              {log.entityName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity found for the selected filters
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Widget version for dashboard
export function ActivityLogWidget({ facilityId }: { facilityId: string }) {
  return <ActivityLog facilityId={facilityId} compact />;
}
