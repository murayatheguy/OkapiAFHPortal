import type { Facility, TeamMember, Credential } from "@shared/schema";

const API_BASE = "/api";

// Facilities API
export async function searchFacilities(params?: {
  city?: string;
  county?: string;
  specialties?: string[];
  acceptsMedicaid?: boolean;
  availableBeds?: boolean;
}): Promise<Facility[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.city) searchParams.append("city", params.city);
  if (params?.county) searchParams.append("county", params.county);
  if (params?.specialties) {
    params.specialties.forEach(s => searchParams.append("specialties", s));
  }
  if (params?.acceptsMedicaid !== undefined) {
    searchParams.append("acceptsMedicaid", String(params.acceptsMedicaid));
  }
  if (params?.availableBeds !== undefined) {
    searchParams.append("availableBeds", String(params.availableBeds));
  }

  const response = await fetch(`${API_BASE}/facilities?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch facilities");
  return response.json();
}

export async function getFacility(id: string): Promise<Facility> {
  const response = await fetch(`${API_BASE}/facilities/${id}`);
  if (!response.ok) throw new Error("Failed to fetch facility");
  return response.json();
}

export async function getFacilityWithTeam(id: string): Promise<{
  facility: Facility;
  team: Array<TeamMember & { credentials: Credential[] }>;
}> {
  const response = await fetch(`${API_BASE}/facilities/${id}/full`);
  if (!response.ok) throw new Error("Failed to fetch facility details");
  return response.json();
}

// Team Members API
export async function getTeamMembers(facilityId: string): Promise<Array<TeamMember & { credentials: Credential[] }>> {
  const response = await fetch(`${API_BASE}/facilities/${facilityId}/team`);
  if (!response.ok) throw new Error("Failed to fetch team members");
  return response.json();
}

export async function createTeamMember(data: {
  facilityId: string;
  name: string;
  email?: string;
  role: string;
  status: string;
  isManualEntry: boolean;
}): Promise<TeamMember> {
  const response = await fetch(`${API_BASE}/team-members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create team member");
  return response.json();
}

export async function updateTeamMember(
  id: string,
  data: Partial<TeamMember>
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE}/team-members/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update team member");
  return response.json();
}

export async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/team-members/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete team member");
}

// Credentials API
export async function createCredential(data: {
  teamMemberId: string;
  name: string;
  type: string;
  status: string;
  issuedDate?: string;
  expiryDate?: string;
  source: string;
  issuer?: string;
}): Promise<Credential> {
  const response = await fetch(`${API_BASE}/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create credential");
  return response.json();
}

export async function updateCredential(
  id: string,
  data: Partial<Credential>
): Promise<Credential> {
  const response = await fetch(`${API_BASE}/credentials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update credential");
  return response.json();
}

export async function deleteCredential(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/credentials/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete credential");
}
