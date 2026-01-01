/**
 * OwnerLayout - Layout for owner portal pages
 * Includes sidebar navigation and consistent styling
 */

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Building2,
  Image,
  MessageSquare,
  Star,
  Users,
  FileText,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  Bell,
  X,
} from "lucide-react";

interface OwnerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/owner/dashboard", label: "Dashboard", icon: Home },
  { href: "/owner/facility", label: "My Facility", icon: Building2 },
  { href: "/owner/photos", label: "Photos", icon: Image },
  { href: "/owner/inquiries", label: "Inquiries", icon: MessageSquare, badge: "3" },
  { href: "/owner/reviews", label: "Reviews", icon: Star },
  { href: "/owner/staff", label: "Staff", icon: Users },
  { href: "/owner/forms", label: "DSHS Forms", icon: FileText },
  { href: "/owner/settings", label: "Settings", icon: Settings },
];

const comingSoonItems = [
  { label: "Residents", icon: Users },
  { label: "Care Logs", icon: FileText },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    // Clear session and redirect
    window.location.href = "/owner/login";
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Logo size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/owner/dashboard" && location.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? "bg-purple-50 text-[#4C1D95]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge className="bg-[#4C1D95] text-xs">{item.badge}</Badge>
                      )}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Coming Soon Section */}
          <div className="mt-6 pt-6 border-t">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Coming Soon
            </p>
            <ul className="space-y-1">
              {comingSoonItems.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-400 cursor-not-allowed">
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    <Badge variant="outline" className="text-xs">Soon</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center px-4 lg:px-8">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Owner Navigation</SheetTitle>
                <div className="flex items-center justify-between">
                  <Logo size="sm" linkTo={null} />
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>
              <nav className="p-4">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                            location === item.href
                              ? "bg-purple-50 text-[#4C1D95]"
                              : "text-gray-700"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="mr-2">
            <Bell className="w-5 h-5" />
          </Button>

          {/* View Public Listing */}
          <Link href="/search">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View Public Site
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
