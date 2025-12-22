import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useStaffAuth } from "@/lib/staff-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Pill,
  FileText,
  AlertTriangle,
  Activity,
  Menu,
  ArrowLeft,
  LogOut,
  Settings,
  User,
} from "lucide-react";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

const TEAL = "#0d9488";

const navItems = [
  { href: "/staff/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/staff/mar", icon: Pill, label: "Meds" },
  { href: "/staff/vitals", icon: Activity, label: "Vitals" },
  { href: "/staff/notes", icon: FileText, label: "Notes" },
  { href: "/staff/incidents", icon: AlertTriangle, label: "Incidents" },
];

export function StaffLayout({ children, title, showBack, backHref = "/staff/dashboard" }: StaffLayoutProps) {
  const [location, setLocation] = useLocation();
  const { staff, logout } = useStaffAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/staff/login");
  };

  const getInitials = () => {
    if (!staff) return "?";
    return `${staff.firstName?.[0] || ""}${staff.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: TEAL }}
      >
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">Okapi EHR</span>
            </div>
          )}
          {title && <h1 className="text-white font-medium text-lg">{title}</h1>}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 py-4 border-b">
                <Avatar className="h-12 w-12" style={{ backgroundColor: TEAL }}>
                  <AvatarFallback className="text-white font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {staff?.firstName} {staff?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{staff?.role}</p>
                </div>
              </div>

              <nav className="flex-1 py-4 space-y-1">
                <Link href="/staff/profile" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <User className="h-5 w-5" />
                    My Profile
                  </Button>
                </Link>
                <Link href="/staff/settings" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Settings className="h-5 w-5" />
                    Settings
                  </Button>
                </Link>
              </nav>

              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "text-teal-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon
                    className="h-5 w-5"
                    style={isActive ? { color: TEAL } : undefined}
                  />
                  <span
                    className={`text-xs font-medium ${isActive ? "text-teal-600" : ""}`}
                    style={isActive ? { color: TEAL } : undefined}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
