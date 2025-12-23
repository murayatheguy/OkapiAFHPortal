import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, ChevronsUpDown, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicationReference {
  name: string;
  genericName?: string;
  commonStrengths: string[];
  form: string;
  route: string;
  category: string;
  commonFrequencies: string[];
  defaultInstructions?: string;
}

interface Medication {
  id: string;
  residentId: string;
  facilityId: string;
  name: string;
  dosage?: string;
  route?: string;
  frequency?: { times: string[]; interval?: string } | null;
  instructions?: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  residentId: string;
  residentName: string;
  editingMedication?: Medication | null;
}

const FREQUENCY_OPTIONS = [
  { value: "QD", label: "Once daily (QD)" },
  { value: "BID", label: "Twice daily (BID)" },
  { value: "TID", label: "Three times daily (TID)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "QHS", label: "At bedtime (QHS)" },
  { value: "Q4H", label: "Every 4 hours" },
  { value: "Q6H", label: "Every 6 hours" },
  { value: "Q8H", label: "Every 8 hours" },
  { value: "Q12H", label: "Every 12 hours" },
  { value: "PRN", label: "As needed (PRN)" },
  { value: "Weekly", label: "Weekly" },
];

const FORM_OPTIONS = [
  "tablet",
  "capsule",
  "liquid",
  "injection",
  "patch",
  "cream",
  "ointment",
  "gel",
  "drops",
  "inhaler",
  "powder",
  "solution",
  "suppository",
];

const ROUTE_OPTIONS = [
  "oral",
  "topical",
  "subcutaneous",
  "intramuscular",
  "intravenous",
  "inhalation",
  "transdermal",
  "sublingual",
  "ophthalmic",
  "otic",
  "nasal",
  "rectal",
];

export function AddMedicationDialog({
  open,
  onOpenChange,
  facilityId,
  residentId,
  residentName,
  editingMedication,
}: AddMedicationDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!editingMedication;

  // Form state
  const [name, setName] = useState(editingMedication?.name || "");
  const [dosage, setDosage] = useState(editingMedication?.dosage || "");
  const [form, setForm] = useState(""); // Form is not stored in schema, but used for display
  const [route, setRoute] = useState(editingMedication?.route || "");
  const [frequency, setFrequency] = useState(editingMedication?.frequency?.interval || "");
  const [instructions, setInstructions] = useState(editingMedication?.instructions || "");
  const [prescriber, setPrescriber] = useState(editingMedication?.prescribedBy || "");
  const [startDate, setStartDate] = useState(
    editingMedication?.startDate || new Date().toISOString().split("T")[0]
  );

  // Autocomplete state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<MedicationReference | null>(null);

  // Search medications
  const { data: searchResults = [] } = useQuery<MedicationReference[]>({
    queryKey: ["medication-search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await fetch(`/api/medications/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Reset form when dialog opens/closes or editingMedication changes
  useEffect(() => {
    if (open) {
      setName(editingMedication?.name || "");
      setDosage(editingMedication?.dosage || "");
      setForm("");
      setRoute(editingMedication?.route || "");
      setFrequency(editingMedication?.frequency?.interval || "");
      setInstructions(editingMedication?.instructions || "");
      setPrescriber(editingMedication?.prescribedBy || "");
      setStartDate(editingMedication?.startDate || new Date().toISOString().split("T")[0]);
      setSelectedMed(null);
      setSearchQuery("");
    }
  }, [open, editingMedication]);

  // When a medication is selected from autocomplete
  const handleSelectMedication = (med: MedicationReference) => {
    setSelectedMed(med);
    setName(med.name);
    setForm(med.form);
    setRoute(med.route);
    if (med.commonStrengths.length > 0) {
      setDosage(med.commonStrengths[0]);
    }
    if (med.commonFrequencies.length > 0) {
      setFrequency(med.commonFrequencies[0]);
    }
    if (med.defaultInstructions) {
      setInstructions(med.defaultInstructions);
    }
    setSearchOpen(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/owners/facilities/${facilityId}/residents/${residentId}/medications`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["resident-medications", facilityId, residentId],
      });
      toast({ title: "Medication added successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add medication",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/owners/facilities/${facilityId}/residents/${residentId}/medications/${editingMedication?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["resident-medications", facilityId, residentId],
      });
      toast({ title: "Medication updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update medication",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Missing required field",
        description: "Please enter a medication name",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name,
      dosage: dosage || "As directed",
      route: route || "oral",
      frequency: frequency || null,
      instructions: instructions || null,
      prescriber: prescriber || null,
      startDate: startDate || new Date().toISOString().split("T")[0],
      status: "active",
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-stone-900 border-amber-900/30">
        <DialogHeader>
          <DialogTitle className="text-stone-200 flex items-center gap-2">
            <Pill className="h-5 w-5 text-amber-400" />
            {isEditing ? "Edit Medication" : "Add Medication"}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {isEditing
              ? `Update medication for ${residentName}`
              : `Add a new medication for ${residentName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drug Name with Autocomplete */}
          <div className="space-y-2">
            <Label className="text-stone-300">Drug Name *</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
                >
                  {name || "Search for medication..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-stone-800 border-stone-700" align="start">
                <Command className="bg-stone-800">
                  <CommandInput
                    placeholder="Type drug name..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="text-stone-200"
                  />
                  <CommandList>
                    <CommandEmpty className="text-stone-400 py-2 text-center text-sm">
                      {searchQuery.length < 2 ? "Type at least 2 characters" : "No medications found"}
                    </CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((med) => (
                        <CommandItem
                          key={med.name}
                          value={med.name}
                          onSelect={() => handleSelectMedication(med)}
                          className="text-stone-200 hover:bg-stone-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              name === med.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div className="font-medium">{med.name}</div>
                            {med.genericName && med.genericName !== med.name.toLowerCase() && (
                              <div className="text-xs text-stone-400">({med.genericName})</div>
                            )}
                            <div className="text-xs text-stone-500">
                              {med.category} • {med.form}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* Manual entry fallback */}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Or type medication name manually"
              className="bg-stone-800 border-stone-700 text-stone-200 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dosage */}
            <div className="space-y-2">
              <Label className="text-stone-300">Dosage</Label>
              {selectedMed && selectedMed.commonStrengths.length > 0 ? (
                <Select value={dosage} onValueChange={setDosage}>
                  <SelectTrigger className="bg-stone-800 border-stone-700 text-stone-200">
                    <SelectValue placeholder="Select dosage" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {selectedMed.commonStrengths.map((s) => (
                      <SelectItem key={s} value={s} className="text-stone-200">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g., 10mg, 5mL"
                  className="bg-stone-800 border-stone-700 text-stone-200"
                />
              )}
            </div>

            {/* Form */}
            <div className="space-y-2">
              <Label className="text-stone-300">Form</Label>
              <Select value={form} onValueChange={setForm}>
                <SelectTrigger className="bg-stone-800 border-stone-700 text-stone-200">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  {FORM_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f} className="text-stone-200 capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Route */}
            <div className="space-y-2">
              <Label className="text-stone-300">Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger className="bg-stone-800 border-stone-700 text-stone-200">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  {ROUTE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-stone-200 capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-stone-300">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-stone-800 border-stone-700 text-stone-200">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-stone-200">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prescriber */}
            <div className="space-y-2">
              <Label className="text-stone-300">Prescriber</Label>
              <Input
                value={prescriber}
                onChange={(e) => setPrescriber(e.target.value)}
                placeholder="Dr. Smith"
                className="bg-stone-800 border-stone-700 text-stone-200"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-stone-300">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-stone-800 border-stone-700 text-stone-200"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label className="text-stone-300">Instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Take with food, avoid alcohol, etc."
              className="bg-stone-800 border-stone-700 text-stone-200 min-h-[80px]"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-stone-700"
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
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : isEditing ? (
                "Update Medication"
              ) : (
                "Add Medication"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
