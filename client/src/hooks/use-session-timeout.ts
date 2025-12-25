import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  enabled?: boolean;
}

/**
 * Hook to track user activity and warn/logout on session timeout
 * HIPAA-compliant session management with 15-minute default timeout
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeoutMinutes = 15,
    warningMinutes = 2,
    onTimeout,
    enabled = true,
  } = options;

  const { toast } = useToast();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const warningToastIdRef = useRef<string | null>(null);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, enabled]);

  // Check for timeout
  useEffect(() => {
    if (!enabled) return;

    const checkTimeout = () => {
      const now = Date.now();
      const elapsedMinutes = (now - lastActivity) / 1000 / 60;

      const warningThreshold = timeoutMinutes - warningMinutes;

      if (elapsedMinutes >= timeoutMinutes) {
        // Session timed out
        if (onTimeout) {
          onTimeout();
        } else {
          // Default: redirect to login with timeout reason
          window.location.href = "/login?reason=timeout";
        }
      } else if (elapsedMinutes >= warningThreshold && !showWarning) {
        // Show warning
        setShowWarning(true);
        const remainingMinutes = Math.ceil(timeoutMinutes - elapsedMinutes);

        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""} due to inactivity. Move your mouse or press a key to stay logged in.`,
          variant: "destructive",
          duration: remainingMinutes * 60 * 1000, // Keep showing until expired or activity
        });
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTimeout, 30000);

    // Also check immediately
    checkTimeout();

    return () => clearInterval(interval);
  }, [
    lastActivity,
    timeoutMinutes,
    warningMinutes,
    showWarning,
    onTimeout,
    toast,
    enabled,
  ]);

  return {
    resetTimer,
    showWarning,
    lastActivity,
    remainingMinutes: Math.max(
      0,
      timeoutMinutes - (Date.now() - lastActivity) / 1000 / 60
    ),
  };
}
