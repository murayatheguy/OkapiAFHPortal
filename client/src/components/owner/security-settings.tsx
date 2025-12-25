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
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2
              className="text-xl font-semibold text-amber-100"
              style={{ fontFamily: "'Cormorant', serif" }}
            >
              HIPAA Security Settings
            </h2>
            <p className="text-sm text-stone-400">
              Configure security policies for your facility
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-green-600/50 text-green-400 bg-green-900/20"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          HIPAA Compliant
        </Badge>
      </div>

      {/* Session Security */}
      <Card className="bg-stone-900 border-amber-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-100 text-lg">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Security
          </CardTitle>
          <CardDescription className="text-stone-400">
            Control session timeout and concurrent access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-stone-300">Session Timeout (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={60}
                value={formData.sessionTimeoutMinutes}
                onChange={(e) =>
                  updateField("sessionTimeoutMinutes", parseInt(e.target.value) || 15)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                HIPAA recommends 15 minutes or less
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-stone-300">Max Concurrent Sessions</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.maxConcurrentSessions}
                onChange={(e) =>
                  updateField("maxConcurrentSessions", parseInt(e.target.value) || 3)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500">
                Limit simultaneous logins per user
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Security */}
      <Card className="bg-stone-900 border-amber-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-100 text-lg">
            <Lock className="h-5 w-5 text-amber-500" />
            Login Security
          </CardTitle>
          <CardDescription className="text-stone-400">
            Protect against brute force attacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-stone-300">Max Failed Login Attempts</Label>
              <Input
                type="number"
                min={3}
                max={10}
                value={formData.maxFailedLoginAttempts}
                onChange={(e) =>
                  updateField("maxFailedLoginAttempts", parseInt(e.target.value) || 5)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500">
                Account locks after this many failed attempts
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-stone-300">Lockout Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={60}
                value={formData.lockoutDurationMinutes}
                onChange={(e) =>
                  updateField("lockoutDurationMinutes", parseInt(e.target.value) || 15)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500">
                How long account stays locked
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card className="bg-stone-900 border-amber-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-100 text-lg">
            <Key className="h-5 w-5 text-amber-500" />
            Password Policy
          </CardTitle>
          <CardDescription className="text-stone-400">
            Enforce strong password requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-stone-300">Minimum Password Length</Label>
              <Input
                type="number"
                min={8}
                max={32}
                value={formData.minPasswordLength}
                onChange={(e) =>
                  updateField("minPasswordLength", parseInt(e.target.value) || 12)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                HIPAA recommends 12+ characters
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-stone-300">Password Expiry (days)</Label>
              <Input
                type="number"
                min={30}
                max={365}
                value={formData.passwordExpiryDays}
                onChange={(e) =>
                  updateField("passwordExpiryDays", parseInt(e.target.value) || 90)
                }
                className="bg-stone-800 border-amber-900/30 text-stone-200"
              />
              <p className="text-xs text-stone-500">
                Force password change after this many days
              </p>
            </div>
          </div>

          <div className="border-t border-amber-900/20 pt-4 space-y-3">
            <p className="text-sm text-stone-400 font-medium">
              Password Complexity Requirements
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                <Label className="text-stone-300">Require Uppercase Letters</Label>
                <Switch
                  checked={formData.requireUppercase}
                  onCheckedChange={(checked) =>
                    updateField("requireUppercase", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                <Label className="text-stone-300">Require Lowercase Letters</Label>
                <Switch
                  checked={formData.requireLowercase}
                  onCheckedChange={(checked) =>
                    updateField("requireLowercase", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                <Label className="text-stone-300">Require Numbers</Label>
                <Switch
                  checked={formData.requireNumbers}
                  onCheckedChange={(checked) =>
                    updateField("requireNumbers", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                <Label className="text-stone-300">Require Special Characters</Label>
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
            <Label className="text-stone-300">Password History Count</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={formData.passwordHistoryCount}
              onChange={(e) =>
                updateField("passwordHistoryCount", parseInt(e.target.value) || 12)
              }
              className="bg-stone-800 border-amber-900/30 text-stone-200 max-w-xs"
            />
            <p className="text-xs text-stone-500">
              Prevent reuse of last N passwords
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MFA Settings (Coming Soon) */}
      <Card className="bg-stone-900 border-amber-900/30 opacity-75">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-100 text-lg">
              <Shield className="h-5 w-5 text-amber-500" />
              Multi-Factor Authentication
            </CardTitle>
            <Badge variant="outline" className="border-amber-600/50 text-amber-400">
              Coming in Phase 2
            </Badge>
          </div>
          <CardDescription className="text-stone-400">
            Additional security layer for sensitive operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-stone-800/30 rounded-lg">
            <div>
              <Label className="text-stone-400">Require MFA for Owners</Label>
              <p className="text-xs text-stone-500">
                Require 2FA for all owner accounts
              </p>
            </div>
            <Switch disabled checked={formData.requireMfaOwners} />
          </div>
          <div className="flex items-center justify-between p-3 bg-stone-800/30 rounded-lg">
            <div>
              <Label className="text-stone-400">Require MFA for Staff</Label>
              <p className="text-xs text-stone-500">
                Require 2FA for staff accessing PHI
              </p>
            </div>
            <Switch disabled checked={formData.requireMfaStaff} />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-amber-900/20">
        <div className="flex items-center gap-2 text-sm text-stone-400">
          {hasChanges ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
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
          className="bg-amber-600 hover:bg-amber-500 text-white"
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
    </div>
  );
}
