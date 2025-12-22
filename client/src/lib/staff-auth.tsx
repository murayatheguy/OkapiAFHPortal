import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { StaffAuth, StaffPermissions } from "@shared/schema";

type StaffWithoutPassword = Omit<StaffAuth, "passwordHash" | "pin" | "inviteToken">;

interface StaffAuthContextType {
  staff: StaffWithoutPassword | null;
  permissions: StaffPermissions | null;
  facilityId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (email: string, pin: string) => Promise<void>;
  loginWithFacilityPin: (facilityPin: string, staffName: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchStaff: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useQuery<{
    staff: StaffWithoutPassword;
    permissions: StaffPermissions | null;
    facilityId: string;
  } | null>({
    queryKey: ["staff-me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/ehr/auth/me", {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch staff");
        }
        const data = await response.json();
        return {
          staff: data.staff,
          permissions: data.permissions || null,
          facilityId: data.facilityId,
        };
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/ehr/auth/login", { email, password });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-me"] });
    },
  });

  const loginPinMutation = useMutation({
    mutationFn: async ({ email, pin }: { email: string; pin: string }) => {
      const response = await apiRequest("POST", "/api/ehr/auth/login/pin", { email, pin });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-me"] });
    },
  });

  const loginFacilityPinMutation = useMutation({
    mutationFn: async ({ facilityPin, staffName }: { facilityPin: string; staffName: string }) => {
      const response = await apiRequest("POST", "/api/ehr/auth/facility-pin-login", { facilityPin, staffName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/ehr/auth/logout", undefined);
    },
    onSuccess: () => {
      queryClient.setQueryData(["staff-me"], null);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const loginWithPin = async (email: string, pin: string) => {
    await loginPinMutation.mutateAsync({ email, pin });
  };

  const loginWithFacilityPin = async (facilityPin: string, staffName: string) => {
    await loginFacilityPinMutation.mutateAsync({ facilityPin, staffName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <StaffAuthContext.Provider
      value={{
        staff: staffData?.staff || null,
        permissions: staffData?.permissions || null,
        facilityId: staffData?.facilityId || null,
        isLoading: staffLoading,
        isAuthenticated: !!staffData?.staff,
        login,
        loginWithPin,
        loginWithFacilityPin,
        logout,
        refetchStaff: () => refetchStaff(),
      }}
    >
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
