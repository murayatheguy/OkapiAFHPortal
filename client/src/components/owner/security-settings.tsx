import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Lock,
  Clock,
  Key,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SecuritySettingsProps {
  facilityId: string;
}

interface SecuritySettingsData {
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  requireMfaOwners: boolean;
  requireMfaStaff: boolean;
}

const DEFAULT_SETTINGS: SecuritySettingsData = {
  sessionTimeoutMinutes: 15,
  maxConcurrentSessions: 3,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  passwordHistoryCount: 12,
  requireMfaOwners: false,
  requireMfaStaff: false,
};

export function SecuritySettings({ facilityId }: SecuritySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SecuritySettingsData>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery<SecuritySettingsData>({
    queryKey: ["security-settings", facilityId],
    queryFn: async () => {
      const res = await fetch(
        `/api/owners/facilities/${facilityId}/security-settings`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  // Update formData when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const updateField = (field: keyof SecuritySettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const mutation = useMutation({
    mutationFn: async (data: Partial<SecuritySettingsData>) => {
      const res = await apiRequest(
        "PUT",
        `/api/owners/facilities/${facilityId}/security-settings`,
        data
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Security Settings Saved",
        description: "Your security settings have been updated successfully.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({
        queryKey: ["security-settings", facilityId],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Save",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100">
              <Shield className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg">HIPAA Security Settings</CardTitle>
              <CardDescription>Configure security policies for your facility</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            HIPAA Compliant
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Security */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Session Security</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Control session timeout and concurrent access
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={5}
                max={60}
                value={formData.sessionTimeoutMinutes}
                onChange={(e) =>
                  updateField("sessionTimeoutMinutes", parseInt(e.target.value) || 15)
                }
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                HIPAA recommends 15 minutes or less
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
              <Input
                id="maxSessions"
                type="number"
                min={1}
                max={10}
                value={formData.maxConcurrentSessions}
                onChange={(e) =>
                  updateField("maxConcurrentSessions", parseInt(e.target.value) || 3)
                }
              />
              <p className="text-xs text-muted-foreground">
                Limit simultaneous logins per user
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Login Security */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Login Security</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Protect against brute force attacks
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Failed Login Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                min={3}
                max={10}
                value={formData.maxFailedLoginAttempts}
                onChange={(e) =>
                  updateField("maxFailedLoginAttempts", parseInt(e.target.value) || 5)
                }
              />
              <p className="text-xs text-muted-foreground">
                Account locks after this many failed attempts
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                min={5}
                max={60}
                value={formData.lockoutDurationMinutes}
                onChange={(e) =>
                  updateField("lockoutDurationMinutes", parseInt(e.target.value) || 15)
                }
              />
              <p className="text-xs text-muted-foreground">
                How long account stays locked
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Password Policy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Password Policy</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enforce strong password requirements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Input
                id="minPasswordLength"
                type="number"
                min={8}
                max={32}
                value={formData.minPasswordLength}
                onChange={(e) =>
                  updateField("minPasswordLength", parseInt(e.target.value) || 12)
                }
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                HIPAA recommends 12+ characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                min={30}
                max={365}
                value={formData.passwordExpiryDays}
                onChange={(e) =>
                  updateField("passwordExpiryDays", parseInt(e.target.value) || 90)
                }
              />
              <p className="text-xs text-muted-foreground">
                Force password change after this many days
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Password Complexity Requirements
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <Label className="text-gray-700 cursor-pointer">Require Uppercase Letters</Label>
                <Switch
                  checked={formData.requireUppercase}
                  onCheckedChange={(checked) =>
                    updateField("requireUppercase", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <Label className="text-gray-700 cursor-pointer">Require Lowercase Letters</Label>
                <Switch
                  checked={formData.requireLowercase}
                  onCheckedChange={(checked) =>
                    updateField("requireLowercase", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <Label className="text-gray-700 cursor-pointer">Require Numbers</Label>
                <Switch
                  checked={formData.requireNumbers}
                  onCheckedChange={(checked) =>
                    updateField("requireNumbers", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <Label className="text-gray-700 cursor-pointer">Require Special Characters</Label>
                <Switch
                  checked={formData.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    updateField("requireSpecialChars", checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordHistory">Password History Count</Label>
            <Input
              id="passwordHistory"
              type="number"
              min={1}
              max={24}
              value={formData.passwordHistoryCount}
              onChange={(e) =>
                updateField("passwordHistoryCount", parseInt(e.target.value) || 12)
              }
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Prevent reuse of last N passwords
            </p>
          </div>
        </div>

        <Separator />

        {/* MFA Settings (Coming Soon) */}
        <div className="space-y-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Multi-Factor Authentication</h3>
            </div>
            <Badge variant="outline" className="border-teal-500 text-teal-600">
              Coming in Phase 2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Additional security layer for sensitive operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <Label className="text-gray-500">Require MFA for Owners</Label>
                <p className="text-xs text-muted-foreground">
                  Require 2FA for all owner accounts
                </p>
              </div>
              <Switch disabled checked={formData.requireMfaOwners} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <Label className="text-gray-500">Require MFA for Staff</Label>
                <p className="text-xs text-muted-foreground">
                  Require 2FA for staff accessing PHI
                </p>
              </div>
              <Switch disabled checked={formData.requireMfaStaff} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges ? (
              <>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                You have unsaved changes
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                All changes saved
              </>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || mutation.isPending}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
