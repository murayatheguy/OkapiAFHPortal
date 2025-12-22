import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { AddMedicationDialog } from "./add-medication-dialog";
import { Loader2, Plus, Edit, XCircle, Pill, Clock, User } from "lucide-react";

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

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
}

interface ResidentMedicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  resident: Resident;
}

export function ResidentMedicationsDialog({
  open,
  onOpenChange,
  facilityId,
  resident,
}: ResidentMedicationsDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [discontinuingMed, setDiscontinuingMed] = useState<Medication | null>(null);

  const residentName = `${resident.firstName} ${resident.lastName}`;

  // Fetch medications
  const { data: medications = [], isLoading } = useQuery<Medication[]>({
    queryKey: ["resident-medications", facilityId, resident.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/medications`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open,
  });

  // Discontinue mutation
  const discontinueMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/owners/facilities/${facilityId}/residents/${resident.id}/medications/${medicationId}/discontinue`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["resident-medications", facilityId, resident.id],
      });
      toast({ title: "Medication discontinued" });
      setDiscontinuingMed(null);
    },
    onError: () => {
      toast({
        title: "Failed to discontinue medication",
        variant: "destructive",
      });
    },
  });

  const activeMeds = medications.filter((m) => m.status === "active");
  const discontinuedMeds = medications.filter((m) => m.status === "discontinued");

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-stone-900 border-amber-900/30">
          <DialogHeader>
            <DialogTitle className="text-stone-200 flex items-center gap-2">
              <Pill className="h-5 w-5 text-amber-400" />
              Medications for {residentName}
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              Manage prescriptions and medications
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="border-green-600 text-green-400">
                {activeMeds.length} Active
              </Badge>
              {discontinuedMeds.length > 0 && (
                <Badge variant="outline" className="border-stone-600 text-stone-400">
                  {discontinuedMeds.length} Discontinued
                </Badge>
              )}
            </div>
            <Button
              onClick={() => {
                setEditingMed(null);
                setAddMedOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          ) : medications.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-400">No medications on file</p>
              <p className="text-stone-500 text-sm mt-1">
                Click "Add Medication" to add the first prescription
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Medications */}
              {activeMeds.length > 0 && (
                <div>
                  <h3 className="text-stone-300 font-medium mb-2">Active Medications</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/20">
                          <TableHead className="text-stone-400">Medication</TableHead>
                          <TableHead className="text-stone-400">Dosage</TableHead>
                          <TableHead className="text-stone-400">Frequency</TableHead>
                          <TableHead className="text-stone-400">Prescriber</TableHead>
                          <TableHead className="text-stone-400">Started</TableHead>
                          <TableHead className="text-stone-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeMeds.map((med) => (
                          <TableRow key={med.id} className="border-amber-900/20">
                            <TableCell>
                              <div>
                                <div className="text-stone-200 font-medium">{med.name}</div>
                                {med.instructions && (
                                  <div className="text-stone-500 text-xs mt-1 max-w-xs truncate">
                                    {med.instructions}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-stone-400">
                              <div>
                                {med.dosage || "—"}
                              </div>
                              {med.route && (
                                <div className="text-stone-500 text-xs">{med.route}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-amber-900/30 text-stone-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {med.frequency?.interval || "PRN"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-stone-400">
                              {med.prescribedBy ? (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {med.prescribedBy}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-stone-400">
                              {formatDate(med.startDate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 h-8 px-2"
                                  onClick={() => {
                                    setEditingMed(med);
                                    setAddMedOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
                                  onClick={() => setDiscontinuingMed(med)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Discontinued Medications */}
              {discontinuedMeds.length > 0 && (
                <div>
                  <h3 className="text-stone-500 font-medium mb-2">Discontinued</h3>
                  <div className="overflow-x-auto opacity-60">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-stone-700">
                          <TableHead className="text-stone-500">Medication</TableHead>
                          <TableHead className="text-stone-500">Dosage</TableHead>
                          <TableHead className="text-stone-500">Prescriber</TableHead>
                          <TableHead className="text-stone-500">Ended</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discontinuedMeds.map((med) => (
                          <TableRow key={med.id} className="border-stone-700">
                            <TableCell className="text-stone-400">{med.name}</TableCell>
                            <TableCell className="text-stone-500">
                              {med.dosage || "—"}
                            </TableCell>
                            <TableCell className="text-stone-500">{med.prescribedBy || "—"}</TableCell>
                            <TableCell className="text-stone-500">
                              {formatDate(med.endDate)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Medication Dialog */}
      <AddMedicationDialog
        open={addMedOpen}
        onOpenChange={setAddMedOpen}
        facilityId={facilityId}
        residentId={resident.id}
        residentName={residentName}
        editingMedication={editingMed}
      />

      {/* Discontinue Confirmation */}
      <AlertDialog
        open={!!discontinuingMed}
        onOpenChange={(open) => !open && setDiscontinuingMed(null)}
      >
        <AlertDialogContent className="bg-stone-900 border-amber-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-200">
              Discontinue Medication?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              Are you sure you want to discontinue{" "}
              <span className="text-amber-400 font-medium">{discontinuingMed?.name}</span> for{" "}
              {residentName}? This medication will be marked as discontinued with today's date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-700 text-stone-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => discontinuingMed && discontinueMutation.mutate(discontinuingMed.id)}
              className="bg-red-600 hover:bg-red-500"
              disabled={discontinueMutation.isPending}
            >
              {discontinueMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Discontinuing...
                </>
              ) : (
                "Discontinue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
