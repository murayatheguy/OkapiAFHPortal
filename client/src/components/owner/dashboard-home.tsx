/**
 * Dashboard Home Component
 * Main dashboard view with insights integration
 * This is a NEW component that can be safely added
 */

import { DashboardInsights } from "./dashboard-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  Settings,
  FileText,
  Bed,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface DashboardHomeProps {
  facility: {
    id: string;
    name: string;
    bedCount: number;
  };
  stats: {
    activeResidents: number;
    totalStaff: number;
    pendingTasks: number;
    upcomingExpirations: number;
  };
  onNavigate: (section: string) => void;
}

export function DashboardHome({ facility, stats, onNavigate }: DashboardHomeProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-muted-foreground">Here's what's happening at {facility.name}</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('care-management')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeResidents}</p>
                <p className="text-sm text-muted-foreground">Active Residents</p>
              </div>
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Bed className="h-3 w-3 mr-1" />
              {facility.bedCount - stats.activeResidents} beds available
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('care-management')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('care-management')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.upcomingExpirations}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
              <div className={`p-2 rounded-lg ${stats.upcomingExpirations > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                <Calendar className={`h-5 w-5 ${stats.upcomingExpirations > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('care-management')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
              </div>
              <div className={`p-2 rounded-lg ${stats.pendingTasks > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.pendingTasks > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Proposition Insights */}
      <DashboardInsights
        facilityId={facility.id}
        facilityName={facility.name}
        onNavigate={onNavigate}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('care-management')}
            >
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-sm">Add Resident</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('care-portal')}
            >
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Care Portal</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('forms')}
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm">DSHS Forms</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => onNavigate('settings')}
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
