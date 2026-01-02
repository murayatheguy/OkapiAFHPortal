/**
 * Admin Authentication Context
 *
 * Separate from owner auth - provides admin session management and impersonation
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  canImpersonate: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ImpersonatedFacility {
  id: string;
  name: string;
  city: string | null;
  ownerName: string | null;
}

interface AdminAuthContextType {
  admin: Admin | null;
  impersonatedFacility: ImpersonatedFacility | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  impersonate: (facilityId: string) => Promise<ImpersonatedFacility>;
  stopImpersonating: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [impersonatedFacility, setImpersonatedFacility] = useState<ImpersonatedFacility | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdmin = async () => {
    try {
      const response = await fetch("/api/admin/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data);
        setImpersonatedFacility(data.impersonatedFacility || null);
      } else {
        setAdmin(null);
        setImpersonatedFacility(null);
      }
    } catch (error) {
      console.error("Failed to fetch admin:", error);
      setAdmin(null);
      setImpersonatedFacility(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/admin/login", { email, password });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    setAdmin(data.admin);
    setImpersonatedFacility(null);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setAdmin(null);
    setImpersonatedFacility(null);
  };

  const impersonate = async (facilityId: string): Promise<ImpersonatedFacility> => {
    const response = await apiRequest("POST", "/api/admin/impersonate", { facilityId });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Impersonation failed");
    }

    const facility: ImpersonatedFacility = {
      id: data.facility.id,
      name: data.facility.name,
      city: null,
      ownerName: data.facility.ownerName,
    };

    setImpersonatedFacility(facility);
    return facility;
  };

  const stopImpersonating = async () => {
    const response = await apiRequest("POST", "/api/admin/stop-impersonate");

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to stop impersonation");
    }

    setImpersonatedFacility(null);
  };

  const refetch = async () => {
    await fetchAdmin();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        impersonatedFacility,
        isLoading,
        isAuthenticated: !!admin,
        isImpersonating: !!impersonatedFacility,
        login,
        logout,
        impersonate,
        stopImpersonating,
        refetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
