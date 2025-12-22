import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, CheckCircle2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: "caregiver", label: "Caregiver", description: "Basic care documentation access" },
  { value: "med_tech", label: "Medication Technician", description: "Can administer medications" },
  { value: "shift_lead", label: "Shift Lead", description: "Supervises shift operations" },
  { value: "nurse", label: "Nurse", description: "Full clinical access and oversight" },
];

export function InviteStaffDialog({ open, onOpenChange, facilityId, onSuccess }: InviteStaffDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "caregiver",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", `/api/owners/facilities/${facilityId}/staff/invite-admin`, formData);
      const data = await response.json();

      if (data.inviteLink) {
        const fullLink = `${window.location.origin}${data.inviteLink}`;
        setInviteLink(fullLink);
        toast({
          title: "Invitation Sent",
          description: `Staff invitation created for ${formData.firstName} ${formData.lastName}`,
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to create invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Invite link copied to clipboard",
      });
    }
  };

  const handleClose = () => {
    setFormData({ email: "", firstName: "", lastName: "", role: "caregiver" });
    setInviteLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-stone-900 border-amber-900/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-100 flex items-center gap-2" style={{ fontFamily: "'Cormorant', serif" }}>
            <UserPlus className="h-5 w-5" />
            Invite Staff Member
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Send an invitation to join your facility's care portal
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <Alert className="bg-green-900/20 border-green-900/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 ml-2">
                Invitation created successfully!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-stone-400">Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="bg-stone-800 border-amber-900/30 text-stone-200 text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  className="border-amber-900/30 text-stone-300 hover:text-amber-200 shrink-0"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-stone-500 text-xs">
                Share this link with {formData.firstName}. The link expires in 7 days.
              </p>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-amber-600 hover:bg-amber-500"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-stone-400">First Name *</Label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                  className="bg-stone-800 border-amber-900/30 text-stone-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-stone-400">Last Name *</Label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Smith"
                  className="bg-stone-800 border-amber-900/30 text-stone-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-stone-400">Email Address *</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane.smith@example.com"
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-stone-400">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-stone-800 border-amber-900/30 text-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span>{role.label}</span>
                        <span className="text-xs text-stone-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-amber-900/30 text-stone-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
