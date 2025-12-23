// ============================================================================
// STAFF PORTAL - REACT PAGES - PART 2
// ============================================================================

// ============================================================================
// client/src/pages/staff/staff-mar.tsx - Medication Administration Record
// ============================================================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pill, Check, X, Clock, AlertTriangle, 
  ChevronLeft, ChevronRight, Search, User
} from "lucide-react";
import { StaffLayout } from "@/components/staff/staff-layout";
import { useToast } from "@/hooks/use-toast";
import { formatTime, cn } from "@/lib/utils";

export default function StaffMAR() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [showGiveDialog, setShowGiveDialog] = useState(false);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  
  const [logData, setLogData] = useState({
    status: 'given' as 'given' | 'missed' | 'refused' | 'held',
    missedReason: '',
    notes: '',
    witnessedBy: null as number | null,
    vitalsBeforeAdmin: null as any,
  });
  
  // Get MAR data
  const { data: marData, isLoading } = useQuery({
    queryKey: ["staff-mar", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/staff/mar?date=${selectedDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load MAR");
      return res.json();
    },
  });
  
  // Get staff list for witnesses
  const { data: staffList } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const res = await fetch("/api/staff/sync/cache", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load staff");
      const data = await res.json();
      return data.staff;
    },
  });
  
  // Log medication mutation
  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/staff/mar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Medication logged successfully" });
      queryClient.invalidateQueries({ queryKey: ["staff-mar"] });
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      setShowGiveDialog(false);
      setShowRefuseDialog(false);
      setSelectedMed(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const handleGive = () => {
    if (selectedMed.medication.isControlled && !logData.witnessedBy) {
      toast({ 
        title: "Witness required", 
        description: "Controlled substances require a witness", 
        variant: "destructive" 
      });
      return;
    }
    
    logMutation.mutate({
      medicationId: selectedMed.medication.id,
      residentId: selectedMed.resident.id,
      scheduledTime: selectedMed.scheduledTime || new Date(),
      status: 'given',
      notes: logData.notes,
      witnessedBy: logData.witnessedBy,
      vitalsBeforeAdmin: logData.vitalsBeforeAdmin,
    });
  };
  
  const handleRefuse = () => {
    if (!logData.missedReason) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    
    logMutation.mutate({
      medicationId: selectedMed.medication.id,
      residentId: selectedMed.resident.id,
      scheduledTime: selectedMed.scheduledTime || new Date(),
      status: logData.status,
      missedReason: logData.missedReason,
      notes: logData.notes,
    });
  };
  
  // Group medications by resident
  const groupedMeds = marData?.reduce((acc: any, item: any) => {
    const residentId = item.resident.id;
    if (!acc[residentId]) {
      acc[residentId] = {
        resident: item.resident,
        medications: [],
      };
    }
    acc[residentId].medications.push(item);
    return acc;
  }, {}) || {};
  
  // Filter by search
  const filteredGroups = Object.values(groupedMeds).filter((group: any) => {
    const fullName = `${group.resident.firstName} ${group.resident.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };
  
  return (
    <StaffLayout title="Medication Administration">
      <div className="p-4 space-y-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-center"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search residents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* MAR List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No medications found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group: any) => (
              <Card key={group.resident.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {group.resident.firstName} {group.resident.lastName}
                    {group.resident.roomNumber && (
                      <Badge variant="outline">Room {group.resident.roomNumber}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.medications.map((item: any, index: number) => {
                    const isLogged = !!item.log;
                    const logStatus = item.log?.status;
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isLogged && logStatus === 'given' && "bg-green-50 border-green-200",
                          isLogged && logStatus === 'refused' && "bg-red-50 border-red-200",
                          isLogged && logStatus === 'missed' && "bg-amber-50 border-amber-200",
                          !isLogged && "bg-white"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{item.medication.name}</span>
                            {item.medication.isControlled && (
                              <Badge variant="destructive" className="text-xs">C</Badge>
                            )}
                            {item.medication.isPRN && (
                              <Badge variant="secondary" className="text-xs">PRN</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {item.medication.dosage} - {item.medication.route}
                          </p>
                          {item.medication.instructions && (
                            <p className="text-xs text-gray-500 ml-6 mt-1">
                              {item.medication.instructions}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.medication.frequency?.times?.map((time: string) => (
                            <Badge key={time} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                          
                          {isLogged ? (
                            <Badge 
                              variant={logStatus === 'given' ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {logStatus === 'given' ? (
                                <><Check className="h-3 w-3 mr-1" /> Given</>
                              ) : logStatus === 'refused' ? (
                                <><X className="h-3 w-3 mr-1" /> Refused</>
                              ) : (
                                <><AlertTriangle className="h-3 w-3 mr-1" /> {logStatus}</>
                              )}
                            </Badge>
                          ) : (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedMed(item);
                                  setLogData({ ...logData, status: 'given' });
                                  setShowGiveDialog(true);
                                }}
                              >
                                Give
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-200"
                                onClick={() => {
                                  setSelectedMed(item);
                                  setShowRefuseDialog(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Give Medication Dialog */}
      <Dialog open={showGiveDialog} onOpenChange={setShowGiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administer Medication</DialogTitle>
          </DialogHeader>
          
          {selectedMed && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedMed.resident.firstName} {selectedMed.resident.lastName}</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedMed.medication.name} {selectedMed.medication.dosage}
                </p>
                <p className="text-sm text-gray-600">{selectedMed.medication.route}</p>
                {selectedMed.medication.instructions && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ {selectedMed.medication.instructions}
                  </p>
                )}
              </div>
              
              {selectedMed.medication.isControlled && (
                <div className="space-y-2">
                  <Label>Witness (Required for controlled substances)</Label>
                  <Select
                    value={logData.witnessedBy?.toString() || ""}
                    onValueChange={(v) => setLogData({ ...logData, witnessedBy: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select witness" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedMed.medication.requiresVitals && (
                <div className="space-y-2">
                  <Label>Vitals Before Administration</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="BP (e.g., 120/80)"
                      onChange={(e) => setLogData({
                        ...logData,
                        vitalsBeforeAdmin: { ...logData.vitalsBeforeAdmin, bp: e.target.value }
                      })}
                    />
                    <Input 
                      placeholder="Pulse"
                      type="number"
                      onChange={(e) => setLogData({
                        ...logData,
                        vitalsBeforeAdmin: { ...logData.vitalsBeforeAdmin, pulse: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any observations..."
                  value={logData.notes}
                  onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGiveDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGive}
              disabled={logMutation.isPending}
            >
              {logMutation.isPending ? "Logging..." : "Confirm Given"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Refuse/Miss Dialog */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Medication Issue</DialogTitle>
          </DialogHeader>
          
          {selectedMed && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedMed.resident.firstName} {selectedMed.resident.lastName}</p>
                <p className="font-bold">{selectedMed.medication.name} {selectedMed.medication.dosage}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={logData.status}
                  onValueChange={(v) => setLogData({ ...logData, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refused">Refused by Resident</SelectItem>
                    <SelectItem value="held">Held (Clinical reason)</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="not_available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  placeholder="Explain why medication was not given..."
                  value={logData.missedReason}
                  onChange={(e) => setLogData({ ...logData, missedReason: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional observations..."
                  value={logData.notes}
                  onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefuseDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRefuse}
              disabled={logMutation.isPending}
            >
              {logMutation.isPending ? "Logging..." : "Log Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}

// ============================================================================
// client/src/pages/staff/staff-residents.tsx - Resident List
// ============================================================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, AlertCircle, ChevronRight } from "lucide-react";
import { StaffLayout } from "@/components/staff/staff-layout";

export default function StaffResidents() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: residents, isLoading } = useQuery({
    queryKey: ["staff-residents"],
    queryFn: async () => {
      const res = await fetch("/api/staff/residents?status=active", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load residents");
      return res.json();
    },
  });
  
  const filteredResidents = residents?.filter((r: any) => {
    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }) || [];
  
  return (
    <StaffLayout title="Residents">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search residents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Resident List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResidents.map((resident: any) => (
              <Link key={resident.id} href={`/staff/residents/${resident.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={resident.photo} />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {resident.firstName[0]}{resident.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {resident.firstName} {resident.lastName}
                          </h3>
                          {resident.allergies?.length > 0 && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {resident.roomNumber && (
                            <span>Room {resident.roomNumber}</span>
                          )}
                          {resident.codeStatus !== 'FULL' && (
                            <Badge variant="outline" className="text-xs">
                              {resident.codeStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

// ============================================================================
// client/src/pages/staff/staff-resident-detail.tsx
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Pill, Heart, AlertTriangle, Phone, 
  FileText, Activity, ClipboardList, Plus
} from "lucide-react";
import { StaffLayout } from "@/components/staff/staff-layout";
import { formatDate } from "@/lib/utils";

export default function StaffResidentDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: resident, isLoading } = useQuery({
    queryKey: ["staff-resident", id],
    queryFn: async () => {
      const res = await fetch(`/api/staff/residents/${id}/full`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load resident");
      return res.json();
    },
  });
  
  if (isLoading) {
    return (
      <StaffLayout title="Resident">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </StaffLayout>
    );
  }
  
  if (!resident) {
    return (
      <StaffLayout title="Resident">
        <div className="p-4 text-center text-gray-500">Resident not found</div>
      </StaffLayout>
    );
  }
  
  return (
    <StaffLayout title={`${resident.firstName} ${resident.lastName}`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={resident.photo} />
                <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
                  {resident.firstName[0]}{resident.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {resident.preferredName || resident.firstName} {resident.lastName}
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  {resident.roomNumber && (
                    <Badge variant="outline">Room {resident.roomNumber}</Badge>
                  )}
                  <Badge 
                    variant={resident.codeStatus === 'FULL' ? 'default' : 'destructive'}
                  >
                    {resident.codeStatus}
                  </Badge>
                </div>
                
                {/* Allergies Banner */}
                {resident.allergies?.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Allergies:
                    </p>
                    <p className="text-sm text-red-600">
                      {resident.allergies.map((a: any) => a.allergen).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Link href={`/staff/residents/${id}/mar`}>
                <Button variant="outline" className="w-full h-12 flex flex-col gap-1">
                  <Pill className="h-4 w-4" />
                  <span className="text-xs">MAR</span>
                </Button>
              </Link>
              <Link href={`/staff/notes/new?residentId=${id}`}>
                <Button variant="outline" className="w-full h-12 flex flex-col gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-xs">Add Note</span>
                </Button>
              </Link>
              <Link href={`/staff/vitals/new?residentId=${id}`}>
                <Button variant="outline" className="w-full h-12 flex flex-col gap-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs">Vitals</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs defaultValue="meds">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="meds">Meds</TabsTrigger>
            <TabsTrigger value="care">Care Plan</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          {/* Medications Tab */}
          <TabsContent value="meds" className="space-y-2 mt-4">
            {resident.medications?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active medications</p>
            ) : (
              resident.medications?.map((med: any) => (
                <Card key={med.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{med.name}</span>
                          {med.isControlled && (
                            <Badge variant="destructive" className="text-xs">C</Badge>
                          )}
                          {med.isPRN && (
                            <Badge variant="secondary" className="text-xs">PRN</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{med.dosage} - {med.route}</p>
                        {med.instructions && (
                          <p className="text-xs text-amber-600 mt-1">{med.instructions}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {med.frequency?.times?.join(", ")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Care Plans Tab */}
          <TabsContent value="care" className="space-y-2 mt-4">
            {resident.carePlans?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active care plans</p>
            ) : (
              resident.carePlans?.map((plan: any) => (
                <Card key={plan.id}>
                  <CardContent className="p-3">
                    <Badge variant="outline" className="mb-2">{plan.category}</Badge>
                    <h4 className="font-medium">{plan.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{plan.goal}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Interventions:</p>
                      <ul className="text-sm list-disc list-inside">
                        {plan.interventions?.map((i: any, idx: number) => (
                          <li key={idx}>{i.intervention}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-2 mt-4">
            {resident.recentNotes?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent notes</p>
            ) : (
              resident.recentNotes?.map((note: any) => (
                <Card key={note.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{note.shift} shift</Badge>
                      <span className="text-xs text-gray-500">{formatDate(note.date)}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Mood:</span> {note.mood || '-'}
                      </div>
                      <div>
                        <span className="text-gray-500">Appetite:</span> {note.appetite || '-'}
                      </div>
                      <div>
                        <span className="text-gray-500">Pain:</span> {note.painLevel ?? '-'}
                      </div>
                    </div>
                    {note.notes && (
                      <p className="text-sm mt-2">{note.notes}</p>
                    )}
                    {note.hasConcerns && (
                      <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-700">
                        ⚠️ {note.concerns}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date of Birth</span>
                  <span>{formatDate(resident.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admission Date</span>
                  <span>{formatDate(resident.admissionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Diagnoses</span>
                  <span>{resident.diagnoses?.join(", ") || "None listed"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Diet</span>
                  <span>{resident.dietaryRestrictions?.join(", ") || "Regular"}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Contacts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resident.emergencyContacts?.map((contact: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-gray-500">{contact.relationship}</p>
                    <a href={`tel:${contact.phone}`} className="text-teal-600">
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Physician */}
            {resident.primaryPhysician && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4" /> Primary Physician
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">{resident.primaryPhysician.name}</p>
                  <a href={`tel:${resident.primaryPhysician.phone}`} className="text-teal-600">
                    {resident.primaryPhysician.phone}
                  </a>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
}