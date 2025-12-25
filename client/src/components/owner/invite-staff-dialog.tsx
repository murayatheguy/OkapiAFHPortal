import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, KeyRound, CheckCircle2, ArrowRight, RefreshCw, Calendar, Mail, Briefcase } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { TeamMember } from "@shared/schema";

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  onSuccess?: () => void;
  onNavigateToTeam?: () => void;
}

const ROLE_OPTIONS = [
  { value: "caregiver", label: "Caregiver", description: "Basic care documentation access" },
  { value: "med_tech", label: "Medication Technician", description: "Can administer medications" },
  { value: "shift_lead", label: "Shift Lead", description: "Supervises shift operations" },
  { value: "nurse", label: "Nurse", description: "Full clinical access and oversight" },
  { value: "admin", label: "Administrator", description: "Full access to all features" },
];

export function InviteStaffDialog({
  open,
  onOpenChange,
  facilityId,
  onSuccess,
  onNavigateToTeam
}: InviteStaffDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [invitedName, setInvitedName] = useState("");
  const [createdPin, setCreatedPin] = useState("");

  // Get team members who don't have portal access yet
  const { data: availableMembers = [], isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["team-members-without-portal", facilityId],
    queryFn: async () => {
      const res = await fetch(`/api/owners/facilities/${facilityId}/team-members/without-portal-access`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch team members");
      }
      return res.json();
    },
    enabled: open && !!facilityId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { teamMemberId: string; role?: string; temporaryPin: string }) => {
      const res = await apiRequest("POST", `/api/owners/facilities/${facilityId}/staff/grant-access`, data);
      return res.json();
    },
    onSuccess: (data) => {
      const member = availableMembers.find(m => m.id === selectedTeamMemberId);
      setInvitedName(member?.name || "Team member");
      setCreatedPin(tempPin);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["team-members-without-portal", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["facility-staff", facilityId] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to Grant Access",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setTempPin(pin);
  };

  const handleGrantAccess = () => {
    if (!selectedTeamMemberId || !tempPin || tempPin.length !== 4) {
      toast({
        title: "Missing Information",
        description: "Please select a team member and enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({
      teamMemberId: selectedTeamMemberId,
      role: selectedRole || undefined,
      temporaryPin: tempPin,
    });
  };

  const handleClose = () => {
    setSelectedTeamMemberId("");
    setSelectedRole("");
    setTempPin("");
    setShowSuccess(false);
    setInvitedName("");
    setCreatedPin("");
    onOpenChange(false);
  };

  const handleGoToTeam = () => {
    handleClose();
    onNavigateToTeam?.();
  };

  const selectedMember = availableMembers.find(m => m.id === selectedTeamMemberId);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not set";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-stone-900 border-amber-900/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100 flex items-center gap-2" style={{ fontFamily: "'Cormorant', serif" }}>
            <KeyRound className="h-5 w-5" />
            Grant Care Portal Access
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Select a team member and create their login PIN
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-amber-100 font-medium">Portal Access Granted!</p>
                <p className="text-stone-400 text-sm mt-1">
                  {invitedName} can now log in to the Care Portal.
                </p>
              </div>
            </div>

            <div className="bg-stone-800 p-4 rounded-lg border border-amber-900/20">
              <p className="text-stone-400 text-sm mb-2">Login Credentials:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Name:</span>
                  <span className="text-amber-200 font-medium">{invitedName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">PIN:</span>
                  <span className="text-amber-200 font-mono text-lg font-bold tracking-widest">{createdPin}</span>
                </div>
              </div>
              <p className="text-stone-500 text-xs mt-3">
                Share these credentials with the staff member. They can change their PIN after first login.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-amber-600 hover:bg-amber-500">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-400">Error loading team members</p>
            <p className="text-stone-500 text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : availableMembers.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-stone-600 mb-3" />
            <p className="text-stone-300 font-medium">No Team Members Available</p>
            <p className="text-stone-500 text-sm mt-1">
              All team members already have portal access, or you haven't added any team members yet.
            </p>
            {onNavigateToTeam && (
              <Button
                variant="outline"
                className="mt-4 border-amber-900/30 text-stone-300 hover:text-amber-200"
                onClick={handleGoToTeam}
              >
                Go to Team Members
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Team Member Selection */}
            <div className="space-y-2">
              <Label className="text-stone-400">Select Team Member *</Label>
              <Select value={selectedTeamMemberId} onValueChange={setSelectedTeamMemberId}>
                <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-amber-900/30">
                  {availableMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      className="text-stone-200 focus:bg-stone-700 focus:text-amber-200"
                    >
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        <Badge variant="outline" className="text-xs border-stone-600 text-stone-400">
                          {member.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show selected member details for verification */}
            {selectedMember && (
              <>
                <div className="bg-stone-800/50 p-4 rounded-lg border border-amber-900/20">
                  <p className="text-stone-400 text-sm font-medium mb-3">Verify Team Member:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-stone-500 mt-0.5" />
                      <div>
                        <p className="text-stone-500 text-xs">Name</p>
                        <p className="text-amber-200 font-medium">{selectedMember.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-stone-500 mt-0.5" />
                      <div>
                        <p className="text-stone-500 text-xs">Date of Birth</p>
                        <p className="text-amber-200 font-medium">
                          {formatDate(selectedMember.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 text-stone-500 mt-0.5" />
                      <div>
                        <p className="text-stone-500 text-xs">Role</p>
                        <p className="text-amber-200 font-medium">{selectedMember.role}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-stone-500 mt-0.5" />
                      <div>
                        <p className="text-stone-500 text-xs">Email</p>
                        <p className="text-amber-200 font-medium">{selectedMember.email || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portal Role Selection */}
                <div className="space-y-2">
                  <Label className="text-stone-400">Portal Role (optional)</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
                      <SelectValue placeholder="Auto-detect from team role" />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-800 border-amber-900/30">
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem
                          key={role.value}
                          value={role.value}
                          className="text-stone-200 focus:bg-stone-700 focus:text-amber-200"
                        >
                          <div className="flex flex-col">
                            <span>{role.label}</span>
                            <span className="text-xs text-stone-500">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temporary PIN Entry */}
                <div className="space-y-2">
                  <Label className="text-stone-400">Create Login PIN *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={tempPin}
                      onChange={(e) => setTempPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="bg-stone-800 border-amber-900/30 text-stone-200 font-mono text-xl tracking-widest text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePin}
                      className="border-amber-900/30 text-stone-300 hover:text-amber-200 shrink-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-stone-500 text-xs">
                    Share this PIN with {selectedMember.name}. They'll use their name and this PIN to log into the Care Portal.
                  </p>
                </div>
              </>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-amber-900/30 text-stone-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGrantAccess}
                disabled={!selectedTeamMemberId || tempPin.length !== 4 || inviteMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Grant Portal Access
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
