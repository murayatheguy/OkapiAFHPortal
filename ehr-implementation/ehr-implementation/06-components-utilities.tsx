// ============================================================================
// STAFF PORTAL - COMPONENTS & UTILITIES
// ============================================================================

// ============================================================================
// client/src/components/staff/staff-layout.tsx
// ============================================================================

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, Users, Pill, ClipboardList, AlertTriangle, 
  Menu, X, LogOut, ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { useStaffAuth } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function StaffLayout({ children, title, showBack = true }: StaffLayoutProps) {
  const [location, setLocation] = useLocation();
  const { staff, logout } = useStaffAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const navItems = [
    { href: "/staff/dashboard", icon: Home, label: "Dashboard" },
    { href: "/staff/residents", icon: Users, label: "Residents" },
    { href: "/staff/mar", icon: Pill, label: "MAR" },
    { href: "/staff/notes", icon: ClipboardList, label: "Notes" },
    { href: "/staff/incidents", icon: AlertTriangle, label: "Incidents" },
  ];
  
  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST", credentials: "include" });
    logout();
    setLocation("/staff/login");
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-teal-700 text-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {showBack && location !== "/staff/dashboard" ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-teal-600"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <span className="text-xl font-bold">🦓</span>
            )}
            <span className="font-semibold">{title || "Staff Portal"}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-teal-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-teal-700 border-t border-teal-600 shadow-lg">
            <nav className="p-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left",
                      location === item.href 
                        ? "bg-teal-600 text-white" 
                        : "text-teal-100 hover:bg-teal-600"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </Link>
              ))}
              
              <hr className="my-2 border-teal-600" />
              
              <div className="px-4 py-2 text-sm text-teal-200">
                {staff?.firstName} {staff?.lastName}
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-teal-100 hover:bg-teal-600"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "flex flex-col items-center p-2 rounded-lg min-w-[60px]",
                location === item.href || location.startsWith(item.href + "/")
                  ? "text-teal-600" 
                  : "text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </Link>
        ))}
      </nav>
    </div>
  );
}

// ============================================================================
// client/src/lib/staff-auth.tsx
// ============================================================================

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: {
    canAdministerMeds: boolean;
    canAdministerControlled: boolean;
    canFileIncidents: boolean;
    canEditCarePlans: boolean;
    canViewAllResidents: boolean;
    canInviteStaff: boolean;
  };
  facilityId: number;
}

interface StaffAuthContextType {
  staff: Staff | null;
  isLoading: boolean;
  login: (staff: Staff) => void;
  logout: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if logged in on mount
    fetch("/api/staff/me", { credentials: "include" })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then(data => {
        setStaff(data);
      })
      .catch(() => {
        setStaff(null);
        // Redirect to login if on staff pages
        if (location.startsWith("/staff") && !location.includes("/login") && !location.includes("/setup")) {
          setLocation("/staff/login");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
  const login = (staffData: Staff) => {
    setStaff(staffData);
  };
  
  const logout = () => {
    setStaff(null);
  };
  
  return (
    <StaffAuthContext.Provider value={{ staff, isLoading, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
}

// ============================================================================
// client/src/lib/offline-storage.ts - IndexedDB for offline support
// ============================================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  residents: {
    key: number;
    value: any;
  };
  medications: {
    key: number;
    value: any;
    indexes: { 'by-resident': number };
  };
  medicationLogs: {
    key: string; // localId
    value: any;
    indexes: { 'by-sync-status': string };
  };
  dailyNotes: {
    key: string;
    value: any;
    indexes: { 'by-sync-status': string };
  };
  incidentReports: {
    key: string;
    value: any;
    indexes: { 'by-sync-status': string };
  };
  vitalsLog: {
    key: string;
    value: any;
    indexes: { 'by-sync-status': string };
  };
  syncQueue: {
    key: string;
    value: {
      localId: string;
      tableName: string;
      action: 'create' | 'update' | 'delete';
      payload: any;
      createdAt: string;
    };
  };
  meta: {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<OfflineDB>;

export async function initOfflineDB() {
  db = await openDB<OfflineDB>('okapi-staff', 1, {
    upgrade(db) {
      // Residents store
      db.createObjectStore('residents', { keyPath: 'id' });
      
      // Medications store
      const medStore = db.createObjectStore('medications', { keyPath: 'id' });
      medStore.createIndex('by-resident', 'residentId');
      
      // Medication logs store
      const logStore = db.createObjectStore('medicationLogs', { keyPath: 'localId' });
      logStore.createIndex('by-sync-status', 'syncStatus');
      
      // Daily notes store
      const notesStore = db.createObjectStore('dailyNotes', { keyPath: 'localId' });
      notesStore.createIndex('by-sync-status', 'syncStatus');
      
      // Incident reports store
      const incidentStore = db.createObjectStore('incidentReports', { keyPath: 'localId' });
      incidentStore.createIndex('by-sync-status', 'syncStatus');
      
      // Vitals log store
      const vitalsStore = db.createObjectStore('vitalsLog', { keyPath: 'localId' });
      vitalsStore.createIndex('by-sync-status', 'syncStatus');
      
      // Sync queue
      db.createObjectStore('syncQueue', { keyPath: 'localId' });
      
      // Meta store for cache timestamps
      db.createObjectStore('meta', { keyPath: 'key' });
    },
  });
  
  return db;
}

// Generate local ID
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Cache residents and medications from server
export async function cacheServerData(data: { residents: any[]; medications: any[] }) {
  const tx = db.transaction(['residents', 'medications', 'meta'], 'readwrite');
  
  // Clear and repopulate residents
  await tx.objectStore('residents').clear();
  for (const resident of data.residents) {
    await tx.objectStore('residents').put(resident);
  }
  
  // Clear and repopulate medications
  await tx.objectStore('medications').clear();
  for (const med of data.medications) {
    await tx.objectStore('medications').put(med);
  }
  
  // Update cache timestamp
  await tx.objectStore('meta').put({ key: 'lastSync', value: new Date().toISOString() });
  
  await tx.done;
}

// Get cached residents
export async function getCachedResidents(): Promise<any[]> {
  return db.getAll('residents');
}

// Get cached medications for resident
export async function getCachedMedications(residentId?: number): Promise<any[]> {
  if (residentId) {
    return db.getAllFromIndex('medications', 'by-resident', residentId);
  }
  return db.getAll('medications');
}

// Save offline data
export async function saveOfflineData(tableName: string, data: any): Promise<string> {
  const localId = generateLocalId();
  const record = {
    ...data,
    localId,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  // Save to appropriate store
  await db.put(tableName as any, record);
  
  // Add to sync queue
  await db.put('syncQueue', {
    localId,
    tableName,
    action: 'create',
    payload: data,
    createdAt: new Date().toISOString(),
  });
  
  return localId;
}

// Get pending sync items
export async function getPendingSyncItems(): Promise<any[]> {
  return db.getAll('syncQueue');
}

// Mark item as synced
export async function markAsSynced(localId: string, serverId?: number) {
  // Remove from sync queue
  await db.delete('syncQueue', localId);
  
  // Update the record with server ID if provided
  // This would need to know which store to update...
}

// Clear synced items
export async function clearSyncedItems() {
  await db.clear('syncQueue');
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Sync with server
export async function syncWithServer(): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    throw new Error('No internet connection');
  }
  
  const pendingItems = await getPendingSyncItems();
  
  if (pendingItems.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  const response = await fetch('/api/staff/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: pendingItems }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Sync failed');
  }
  
  const results = await response.json();
  
  let success = 0;
  let failed = 0;
  
  for (const result of results.results) {
    if (result.success) {
      await markAsSynced(result.localId, result.serverId);
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}

// ============================================================================
// client/src/lib/utils.ts - Add these utility functions
// ============================================================================

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getCurrentShift(): 'day' | 'swing' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 16) return 'day';
  if (hour >= 16 && hour < 24) return 'swing';
  return 'night';
}

// ============================================================================
// Update client/src/App.tsx - Add staff routes
// ============================================================================

/*
Add these imports at the top:

import { StaffAuthProvider } from "@/lib/staff-auth";
import StaffLogin from "@/pages/staff/staff-login";
import StaffSetup from "@/pages/staff/staff-setup";
import StaffDashboard from "@/pages/staff/staff-dashboard";
import StaffResidents from "@/pages/staff/staff-residents";
import StaffResidentDetail from "@/pages/staff/staff-resident-detail";
import StaffMAR from "@/pages/staff/staff-mar";
import StaffDailyNotes from "@/pages/staff/staff-daily-notes";
import StaffIncidents from "@/pages/staff/staff-incidents";

Then wrap your routes with StaffAuthProvider and add staff routes:

<StaffAuthProvider>
  <Switch>
    {/* ... existing routes ... *}
    
    {/* Staff Portal Routes *}
    <Route path="/staff/login" component={StaffLogin} />
    <Route path="/staff/setup" component={StaffSetup} />
    <Route path="/staff/dashboard" component={StaffDashboard} />
    <Route path="/staff/residents" component={StaffResidents} />
    <Route path="/staff/residents/:id" component={StaffResidentDetail} />
    <Route path="/staff/mar" component={StaffMAR} />
    <Route path="/staff/notes" component={StaffDailyNotes} />
    <Route path="/staff/notes/new" component={StaffDailyNoteForm} />
    <Route path="/staff/incidents" component={StaffIncidents} />
    <Route path="/staff/incidents/new" component={StaffIncidentForm} />
    <Route path="/staff/vitals/new" component={StaffVitalsForm} />
    <Route path="/staff/handoff" component={StaffHandoff} />
  </Switch>
</StaffAuthProvider>
*/

// ============================================================================
// PWA Manifest - public/manifest.json
// ============================================================================

/*
{
  "name": "Okapi Staff Portal",
  "short_name": "Okapi Staff",
  "description": "Care management for Adult Family Homes",
  "start_url": "/staff/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
*/

// ============================================================================
// Service Worker - public/sw.js (basic offline support)
// ============================================================================

/*
const CACHE_NAME = 'okapi-staff-v1';
const OFFLINE_URL = '/staff/offline';

const STATIC_ASSETS = [
  '/staff/login',
  '/staff/dashboard',
  '/staff/residents',
  '/staff/mar',
  // Add other static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached response or offline message
          return new Response(
            JSON.stringify({ offline: true, message: 'You are offline' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }
  
  // For page requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This would trigger the sync from IndexedDB to server
  // Implementation depends on how you structure the sync
}
*/