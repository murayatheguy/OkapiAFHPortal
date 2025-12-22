import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStaffAuth } from "@/lib/staff-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";

const TEAL = "#0d9488";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber?: string;
}

const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "behavior", label: "Behavior" },
  { value: "health", label: "Health" },
  { value: "family", label: "Family Communication" },
  { value: "other", label: "Other" },
];

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({ open, onOpenChange }: AddNoteDialogProps) {
  const { staff } = useStaffAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = staff?.facilityId;

  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [noteText, setNoteText] = useState("");

  // Fetch residents
  const { data: residents = [], isLoading: residentsLoading } = useQuery<Resident[]>({
    queryKey: ["staff-residents", facilityId],
    queryFn: async () => {
      const response = await fetch(`/api/ehr/residents?status=active`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!facilityId && open,
  });

  // Get current shift based on time
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return "day";
    if (hour >= 14 && hour < 22) return "swing";
    return "night";
  };

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/ehr/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          residentId: selectedResidentId,
          date: today,
          shift: getCurrentShift(),
          notes: noteText,
          mood: noteType === "behavior" ? "noted" : undefined,
          hasConcerns: noteType === "health",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save note");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note Saved",
        description: "Daily note has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["ehr-notes"] });
      // Reset form
      setSelectedResidentId("");
      setNoteType("general");
      setNoteText("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      toast({
        title: "Select Resident",
        description: "Please select a resident.",
        variant: "destructive",
      });
      return;
    }
    if (!noteText.trim()) {
      toast({
        title: "Enter Note",
        description: "Please enter a note.",
        variant: "destructive",
      });
      return;
    }
    saveNoteMutation.mutate();
  };

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: TEAL }} />
            Add Note
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resident Selector */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Choose Client</Label>
            {residentsLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Tap to choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.firstName} {resident.lastName}
                      {resident.roomNumber && ` (Room ${resident.roomNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Note Type */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Note Category</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note Text */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Your Note</Label>
            <Textarea
              placeholder="What would you like to document?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="resize-none text-base"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-h-[48px] text-base"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white min-h-[48px] text-base font-medium"
              style={{ backgroundColor: TEAL }}
              disabled={saveNoteMutation.isPending}
            >
              {saveNoteMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
