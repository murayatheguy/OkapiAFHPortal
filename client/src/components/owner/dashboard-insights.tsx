/**
 * Dashboard Insights Section
 * Combines all value proposition widgets in one place
 */

import { ProfilePerformanceWidget } from "./profile-performance-widget";
import { ProfileCompletionMeter } from "./profile-completion-meter";
import { QualityBadges } from "./quality-badges";
import { FamilyInquiries } from "./family-inquiries";
import { SyncStatusIndicator } from "./sync-status-indicator";

interface DashboardInsightsProps {
  facilityId: string;
  facilityName: string;
  onNavigate?: (section: string) => void;
}

export function DashboardInsights({ facilityId, facilityName, onNavigate }: DashboardInsightsProps) {
  return (
    <div className="space-y-4">
      {/* Top Row: Performance + Sync Status */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <SyncStatusIndicator facilityId={facilityId} lastSynced={new Date()} />
        </div>
        <ProfilePerformanceWidget facilityId={facilityId} facilityName={facilityName} />
      </div>

      {/* Second Row: Completion + Badges */}
      <div className="grid md:grid-cols-2 gap-4">
        <ProfileCompletionMeter facilityId={facilityId} onNavigate={onNavigate} />
        <QualityBadges facilityId={facilityId} />
      </div>

      {/* Third Row: Family Inquiries */}
      <FamilyInquiries facilityId={facilityId} />
    </div>
  );
}

// Also export individual components for flexible use
export {
  ProfilePerformanceWidget,
  ProfileCompletionMeter,
  QualityBadges,
  FamilyInquiries,
  SyncStatusIndicator,
};
