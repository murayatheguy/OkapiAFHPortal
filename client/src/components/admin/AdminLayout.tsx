/**
 * Admin Layout Component
 *
 * Dark theme layout for admin portal with sidebar navigation
 */

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  FileText,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { ImpersonationBanner } from "./ImpersonationBanner";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/facilities", label: "Facilities", icon: Building2 },
  { href: "/admin/owners", label: "Owners", icon: Users },
  { href: "/admin/defaults", label: "Template Defaults", icon: FileText },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { admin, logout, isImpersonating } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Impersonation Banner - shown at very top when impersonating */}
      {isImpersonating && <ImpersonationBanner />}

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-800 border-r border-slate-700">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-white">Okapi Admin</span>
              <p className="text-xs text-slate-400">Care Network</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {admin?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{admin?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{admin?.role?.replace("_", " ")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800 border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-white">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="font-semibold text-white">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                          isActive
                            ? "bg-primary text-white"
                            : "text-slate-300 hover:bg-slate-700/50"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-slate-700 p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-400"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-h-screen",
            "pt-14 lg:pt-0", // Mobile header offset
            "lg:ml-64" // Desktop sidebar offset
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
