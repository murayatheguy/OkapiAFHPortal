/**
 * Impersonation Banner Component
 *
 * Shows a fixed banner when admin is impersonating a facility
 * Displays facility name and provides "Exit Admin Mode" button
 */

import { useLocation } from "wouter";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const [, setLocation] = useLocation();
  const { impersonatedFacility, stopImpersonating, isImpersonating } = useAdminAuth();
  const { toast } = useToast();

  if (!isImpersonating || !impersonatedFacility) {
    return null;
  }

  const handleExit = async () => {
    try {
      await stopImpersonating();
      toast({
        title: "Exited Admin Mode",
        description: "You are no longer viewing as the facility owner.",
      });
      setLocation("/admin/facilities");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to exit admin mode. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-amber-500 text-black px-4 py-2 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="font-semibold">ADMIN MODE:</span>
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Viewing as "{impersonatedFacility.name}"
            {impersonatedFacility.ownerName && (
              <span className="text-amber-900">
                (Owner: {impersonatedFacility.ownerName})
              </span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 border-amber-600 text-amber-900 hover:bg-white hover:text-amber-800"
          onClick={handleExit}
        >
          <X className="h-4 w-4 mr-1" />
          Exit Admin Mode
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook to check if user is viewing via admin impersonation
 * Can be used by owner portal components to show admin-specific UI
 */
export function useIsAdminImpersonating(): boolean {
  try {
    const { isImpersonating } = useAdminAuth();
    return isImpersonating;
  } catch {
    // Not in AdminAuthProvider context (e.g., on regular owner pages)
    return false;
  }
}
