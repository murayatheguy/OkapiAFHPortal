import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { Owner, Facility, ClaimRequest } from "@shared/schema";

type OwnerWithoutPassword = Omit<Owner, "passwordHash">;

interface OwnerAuthContextType {
  owner: OwnerWithoutPassword | null;
  facilities: Facility[];
  claims: ClaimRequest[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchOwner: () => void;
}

const OwnerAuthContext = createContext<OwnerAuthContextType | undefined>(undefined);

// Demo mode test owner for bypassing login (for testing)
const DEMO_OWNER: OwnerWithoutPassword = {
  id: "demo-test-owner",
  email: "demo@okapi.care",
  name: "Demo Owner",
  phone: "555-123-4567",
  status: "active",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
};

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: owner, isLoading: ownerLoading, refetch: refetchOwner } = useQuery<OwnerWithoutPassword | null>({
    queryKey: ["owner-me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/owners/me", {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            // Return demo owner instead of null for testing
            return DEMO_OWNER;
          }
          throw new Error("Failed to fetch owner");
        }
        return response.json();
      } catch {
        // Return demo owner on error for testing
        return DEMO_OWNER;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["owner-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/owners/me/facilities", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch facilities");
      }
      return response.json();
    },
    enabled: !!owner,
    retry: false,
  });

  const { data: claims = [] } = useQuery<ClaimRequest[]>({
    queryKey: ["owner-claims"],
    queryFn: async () => {
      const response = await fetch("/api/owners/me/claims", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("Failed to fetch claims");
      }
      return response.json();
    },
    enabled: !!owner,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/owners/login", { email, password });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-me"] });
      queryClient.invalidateQueries({ queryKey: ["owner-facilities"] });
      queryClient.invalidateQueries({ queryKey: ["owner-claims"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/owners/logout", undefined);
    },
    onSuccess: () => {
      queryClient.setQueryData(["owner-me"], null);
      queryClient.setQueryData(["owner-facilities"], []);
      queryClient.setQueryData(["owner-claims"], []);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <OwnerAuthContext.Provider
      value={{
        owner: owner || null,
        facilities,
        claims,
        isLoading: ownerLoading,
        isAuthenticated: !!owner,
        login,
        logout,
        refetchOwner: () => refetchOwner(),
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);
  if (context === undefined) {
    throw new Error("useOwnerAuth must be used within an OwnerAuthProvider");
  }
  return context;
}
