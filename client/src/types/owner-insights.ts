/**
 * Types for Owner Dashboard Insights
 * Connects EHR data to public profile performance
 */

// Profile performance metrics
export interface ProfilePerformance {
  profileViews: number;
  profileViewsChange: number; // percentage change vs last period
  contactRequests: number;
  pendingRequests: number;
  availableBeds: number;
  totalBeds: number;
  searchRank: number;
  searchRankCity: string;
  lastSyncedAt: Date;
}

// Profile completion tracking
export interface ProfileCompletionItem {
  id: string;
  label: string;
  completed: boolean;
  points: number;
  tip?: string;
  action?: string;
  actionUrl?: string;
}

export interface ProfileCompletion {
  percentage: number;
  items: ProfileCompletionItem[];
  totalPoints: number;
  earnedPoints: number;
}

// Quality badges
export interface QualityBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'earned' | 'almost' | 'locked';
  requirement: string;
  progress?: number; // 0-100
  earnedAt?: Date;
}

// Family inquiry
export interface FamilyInquiry {
  id: number;
  familyName: string;
  familyEmail: string;
  familyPhone?: string;
  residentName: string;
  residentAge?: number;
  careNeeds: string[];
  paymentTypes: string[];
  timeline: string;
  message?: string;
  matchScore: number;
  status: 'new' | 'contacted' | 'touring' | 'archived';
  createdAt: Date;
  respondedAt?: Date;
}

export interface InquiryStats {
  total: number;
  new: number;
  avgResponseTime: number; // in hours
  responseRate: number; // percentage
}

// Public profile sync status
export interface SyncStatus {
  lastSynced: Date;
  fieldsInSync: number;
  totalFields: number;
  pendingChanges: string[];
}
