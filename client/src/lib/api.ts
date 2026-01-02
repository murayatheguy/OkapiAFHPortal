import type { Facility, TeamMember, Credential, Inquiry, ClaimRequest, Owner } from "@shared/schema";

const API_BASE = "/api";

// Helper to create fetch options with credentials
const fetchWithCredentials = (options: RequestInit = {}): RequestInit => ({
  ...options,
  credentials: "include",
});

// Featured Facilities API
export async function getFeaturedFacilities(limit: number = 6): Promise<Facility[]> {
  const response = await fetch(`${API_BASE}/facilities/featured?limit=${limit}`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch featured facilities");
  return response.json();
}

// Autocomplete API for searching facilities by name
export type AutocompleteResult = Pick<Facility, 'id' | 'name' | 'city' | 'zipCode'>;

export async function autocompleteFacilities(query: string, limit: number = 10): Promise<AutocompleteResult[]> {
  if (query.length < 2) return [];
  const response = await fetch(`${API_BASE}/facilities/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to search facilities");
  return response.json();
}

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

  const response = await fetch(`${API_BASE}/facilities?${searchParams}`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch facilities");
  return response.json();
}

// Facilities with Capabilities API (for care matching)
export async function searchFacilitiesWithCapabilities(params?: {
  city?: string;
  county?: string;
  specialties?: string[];
  acceptsMedicaid?: boolean;
  availableBeds?: boolean;
}): Promise<(Facility & { capabilities: any })[]> {
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

  const response = await fetch(`${API_BASE}/facilities/with-capabilities?${searchParams}`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch facilities with capabilities");
  return response.json();
}

export async function getFacility(id: string): Promise<Facility> {
  const response = await fetch(`${API_BASE}/facilities/${id}`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch facility");
  return response.json();
}

export async function getFacilityWithTeam(id: string): Promise<{
  facility: Facility;
  team: Array<TeamMember & { credentials: Credential[] }>;
}> {
  const response = await fetch(`${API_BASE}/facilities/${id}/full`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch facility details");
  return response.json();
}

// Team Members API
export async function getTeamMembers(facilityId: string): Promise<Array<TeamMember & { credentials: Credential[] }>> {
  const response = await fetch(`${API_BASE}/facilities/${facilityId}/team`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch team members");
  return response.json();
}

export async function createTeamMember(data: {
  facilityId: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate?: string;
  role: string;
  status: string;
  isManualEntry: boolean;
}): Promise<TeamMember> {
  const response = await fetch(`${API_BASE}/team-members`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to create team member");
  return response.json();
}

export async function updateTeamMember(
  id: string,
  data: Partial<TeamMember>
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE}/team-members/${id}`, fetchWithCredentials({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to update team member");
  return response.json();
}

export async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/team-members/${id}`, fetchWithCredentials({
    method: "DELETE",
  }));
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
  const response = await fetch(`${API_BASE}/credentials`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to create credential");
  return response.json();
}

export async function updateCredential(
  id: string,
  data: Partial<Credential>
): Promise<Credential> {
  const response = await fetch(`${API_BASE}/credentials/${id}`, fetchWithCredentials({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to update credential");
  return response.json();
}

export async function deleteCredential(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/credentials/${id}`, fetchWithCredentials({
    method: "DELETE",
  }));
  if (!response.ok) throw new Error("Failed to delete credential");
}

// Inquiries API
export async function getInquiries(facilityId: string): Promise<Inquiry[]> {
  const response = await fetch(`${API_BASE}/facilities/${facilityId}/inquiries`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch inquiries");
  return response.json();
}

export async function createInquiry(data: {
  facilityId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  careType?: string;
  moveInTimeline?: string;
}): Promise<Inquiry> {
  const response = await fetch(`${API_BASE}/inquiries`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to create inquiry");
  return response.json();
}

export async function updateInquiry(
  id: string,
  data: Partial<Inquiry>
): Promise<Inquiry> {
  const response = await fetch(`${API_BASE}/inquiries/${id}`, fetchWithCredentials({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) throw new Error("Failed to update inquiry");
  return response.json();
}

// Claims API
export async function submitClaimRequest(data: {
  facilityId: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhone?: string;
  relationship?: string;
}): Promise<{ claim: Partial<ClaimRequest>; message: string }> {
  const response = await fetch(`${API_BASE}/claims`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit claim request");
  }
  return response.json();
}

export async function verifyClaimRequest(
  claimId: string,
  verificationCode: string
): Promise<{ claim: ClaimRequest; message: string }> {
  const response = await fetch(`${API_BASE}/claims/${claimId}/verify`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verificationCode }),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to verify claim");
  }
  return response.json();
}

export async function getClaimsByFacility(facilityId: string): Promise<ClaimRequest[]> {
  const response = await fetch(`${API_BASE}/facilities/${facilityId}/claims`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch claims");
  return response.json();
}

// Owner API
export async function loginOwner(email: string, password: string): Promise<{ owner: Owner }> {
  const response = await fetch(`${API_BASE}/owners/login`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }
  return response.json();
}

export async function setupOwnerAccount(data: {
  email: string;
  password: string;
  token?: string;
}): Promise<{ owner: Owner; message: string }> {
  const response = await fetch(`${API_BASE}/owners/setup`, fetchWithCredentials({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Account setup failed");
  }
  return response.json();
}

export async function getOwnerFacilities(ownerId: string): Promise<Facility[]> {
  const response = await fetch(`${API_BASE}/owners/${ownerId}/facilities`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch owner facilities");
  return response.json();
}

// DSHS Inspections
export interface DshsInspection {
  id: string;
  facilityId: string;
  inspectionDate: string;
  inspectionType: string;
  violationCount: number;
  outcomeSummary?: string;
  enforcementActions?: string;
  sourceUrl?: string;
  scrapedAt: string;
}

export async function getFacilityInspections(facilityId: string): Promise<DshsInspection[]> {
  const response = await fetch(`${API_BASE}/facilities/${facilityId}/inspections`, fetchWithCredentials());
  if (!response.ok) throw new Error("Failed to fetch inspections");
  return response.json();
}
