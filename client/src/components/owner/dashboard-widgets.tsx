import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileText,
  Users,
  ClipboardList,
  Activity,
  Bell,
  ChevronRight,
  Loader2,
  GraduationCap,
  Pill,
  Shield,
  CalendarPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardWidgetsProps {
  facilityId: string;
  onNavigate?: (section: string) => void;
  onNavigateWithTab?: (section: string, tab: string) => void;
}

interface UpcomingEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string | null;
  time?: string | null;
  priority: "high" | "medium" | "low";
  relatedId?: string | null;
  relatedType?: string | null;
  eventId?: number;
}

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  performedBy: string;
  timestamp: string;
  relatedId?: string | null;
  relatedType?: string | null;
}

const EVENT_TYPES = [
  { value: "appointment", label: "Medical Appointment" },
  { value: "care_conference", label: "Care Conference" },
  { value: "fire_drill", label: "Fire Drill" },
  { value: "inspection", label: "Inspection" },
  { value: "training", label: "Training" },
  { value: "custom", label: "Other" },
];

const QUICK_ACTIONS = [
  {
    id: "residents",
    title: "Residents",
    icon: Users,
    color: "bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200",
    section: "care",
    tab: "residents",
  },
  {
    id: "staff",
    title: "Staff",
    icon: Shield,
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
    section: "care",
    tab: "staff",
  },
  {
    id: "credentials",
    title: "Credentials",
    icon: GraduationCap,
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
    section: "care",
    tab: "credentials",
  },
  {
    id: "care-portal",
    title: "Care Portal",
    icon: Activity,
    color: "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200",
    section: "portal",
    tab: null,
  },
];

export function DashboardWidgets({ facilityId, onNavigate, onNavigateWithTab }: DashboardWidgetsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "appointment",
    eventDate: "",
    eventTime: "",
  });

  // Fetch upcoming events
  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery<{
    events: UpcomingEvent[];
    summary: { total: number; credentials: number; appointments: number; other: number };
  }>({
    queryKey: ["dashboard-upcoming", facilityId],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/dashboard/upcoming?days=30`,
        { credentials: "include" }
      );
      if (!response.ok) return { events: [], summary: { total: 0, credentials: 0, appointments: 0, other: 0 } };
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Fetch recent activity
  const { data: activityData = [], isLoading: loadingActivity } = useQuery<ActivityItem[]>({
    queryKey: ["dashboard-activity", facilityId],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/dashboard/activity?limit=10`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      const response = await fetch(`/api/owners/facilities/${facilityId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-upcoming", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity", facilityId] });
      setShowAddEventDialog(false);
      setNewEvent({
        title: "",
        description: "",
        eventType: "appointment",
        eventDate: "",
        eventTime: "",
      });
      toast({
        title: "Event Created",
        description: "The event has been added to your calendar.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete event mutation
  const completeEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/events/${eventId}/complete`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-upcoming", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity", facilityId] });
      toast({
        title: "Event Completed",
        description: "The event has been marked as complete.",
      });
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.eventDate) {
      toast({
        title: "Missing Information",
        description: "Please enter a title and date for the event.",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate(newEvent);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "credential_expiring":
        return <GraduationCap className="h-4 w-4" />;
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "training":
        return <GraduationCap className="h-4 w-4" />;
      case "inspection":
        return <Shield className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "medication_given":
        return <Pill className="h-4 w-4 text-green-500" />;
      case "incident_filed":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "incident_resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "event_created":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "event_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const upcomingEvents = upcomingData?.events || [];

  return (
    <div className="grid lg:grid-cols-3 gap-6 mt-6">
      {/* Upcoming Events Widget */}
      <Card className="lg:col-span-2 border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Upcoming Events
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddEventDialog(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
          {upcomingData?.summary && (
            <div className="flex gap-4 text-sm text-gray-500 mt-2">
              {upcomingData.summary.credentials > 0 && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {upcomingData.summary.credentials} credential{upcomingData.summary.credentials !== 1 ? "s" : ""} expiring
                </span>
              )}
              {upcomingData.summary.appointments > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {upcomingData.summary.appointments} appointment{upcomingData.summary.appointments !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loadingUpcoming ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No upcoming events in the next 30 days</p>
              <Button
                variant="link"
                className="text-teal-600 mt-2"
                onClick={() => setShowAddEventDialog(true)}
              >
                Schedule an event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getPriorityColor(event.priority)}`}
                >
                  <div className="flex-shrink-0">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{event.title}</div>
                    {event.description && (
                      <div className="text-xs opacity-75 truncate">{event.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {formatDate(event.date)}
                      {event.time && ` at ${event.time}`}
                    </Badge>
                    {event.eventId && event.type !== "credential_expiring" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => completeEventMutation.mutate(event.eventId!)}
                        disabled={completeEventMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {upcomingEvents.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-gray-500"
                  onClick={() => onNavigate?.("resources")}
                >
                  View all {upcomingEvents.length} events
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Widget */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.section === "portal") {
                    window.open('/staff/portal', '_blank');
                  } else if (action.tab && onNavigateWithTab) {
                    onNavigateWithTab(action.section, action.tab);
                  } else {
                    onNavigate?.(action.section);
                  }
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md ${action.color}`}
              >
                <action.icon className="h-6 w-6 mb-2" />
                <span className="text-xs font-medium text-center">{action.title}</span>
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
            {loadingActivity ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : activityData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {activityData.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 truncate">{activity.title}</div>
                      <div className="text-xs text-gray-500">
                        {activity.performedBy} - {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-teal-600" />
              Schedule Event
            </DialogTitle>
            <DialogDescription>
              Add a new event to your facility calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={newEvent.eventType}
                  onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Dr. Smith appointment"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Time (optional)</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={newEvent.eventTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Add any notes or details..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddEventDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
