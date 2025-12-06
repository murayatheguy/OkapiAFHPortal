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

// Dev mode test owner for bypassing login (development only)
const DEV_OWNER: OwnerWithoutPassword = {
  id: "dev-test-owner",
  email: "dev@okapi.care",
  name: "Dev Test Owner",
  phone: "555-123-4567",
  status: "active",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
};

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const isDev = import.meta.env.DEV;

  const { data: owner, isLoading: ownerLoading, refetch: refetchOwner } = useQuery<OwnerWithoutPassword | null>({
    queryKey: ["owner-me"],
    queryFn: async () => {
      // In development mode, auto-authenticate for testing
      if (isDev) {
        return DEV_OWNER;
      }
      try {
        const response = await fetch("/api/owners/me", {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch owner");
        }
        return response.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["owner-facilities"],
    queryFn: async () => {
      // In development mode, return sample facility for testing
      if (isDev) {
        return [{
          id: "dev-facility-1",
          name: "Demo Adult Family Home",
          address: "123 Care Lane",
          city: "Seattle",
          state: "WA",
          zipCode: "98101",
          county: "King",
          phone: "206-555-0100",
          email: "demo@facility.com",
          capacity: 6,
          currentOccupancy: 4,
          licenseNumber: "DEMO-12345",
          licenseStatus: "Active",
          licenseExpiration: new Date("2025-12-31"),
          ownerName: "Dev Test Owner",
          ownerId: "dev-test-owner",
          rating: 4.5,
          reviewCount: 12,
          description: "A demo facility for testing the owner portal",
          amenities: ["Private Rooms", "Garden", "24/7 Care"],
          specialties: ["Memory Care", "Mobility Assistance"],
          photos: [],
          acceptsMedicaid: true,
          acceptsMedicare: true,
          acceptsPrivatePay: true,
          isFeatured: false,
          isVerified: true,
          lastInspectionDate: new Date("2024-06-15"),
          violationCount: 0,
          status: "active",
          slug: "demo-adult-family-home",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Facility];
      }
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
