/**
 * Family Inquiries Component
 * Shows contact requests from families who found the home via search
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Clock,
  Phone,
  Mail,
  Calendar,
  Star,
  Archive,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FamilyInquiry {
  id: number;
  familyName: string;
  familyEmail: string;
  familyPhone?: string;
  residentName?: string;
  careNeeds: string[];
  paymentTypes: string[];
  timeline: string;
  message?: string;
  matchScore: number;
  status: 'new' | 'contacted' | 'touring' | 'archived';
  createdAt: string;
}

interface FamilyInquiriesProps {
  facilityId: string;
}

export function FamilyInquiries({ facilityId }: FamilyInquiriesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<FamilyInquiry | null>(null);

  // Fetch inquiries
  const { data: inquiryData } = useQuery({
    queryKey: ["family-inquiries", facilityId],
    queryFn: async () => {
      // Try API first
      try {
        const response = await fetch(`/api/facilities/${facilityId}/inquiries`, {
          credentials: "include",
        });
        if (response.ok) {
          return response.json();
        }
      } catch (e) {
        // API might not exist yet
      }

      // Return mock data for now
      return {
        inquiries: getMockInquiries(),
        stats: {
          total: 5,
          new: 2,
          avgResponseTime: 4.5,
          responseRate: 85,
        },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const inquiries = inquiryData?.inquiries || [];
  const stats = inquiryData?.stats || { total: 0, new: 0, avgResponseTime: 0, responseRate: 0 };

  // Update inquiry status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-inquiries"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Family Inquiries
              {stats.new > 0 && (
                <Badge className="bg-orange-100 text-orange-700 ml-2">
                  {stats.new} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Families who found you through Okapi
            </CardDescription>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{stats.avgResponseTime}h</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{stats.responseRate}%</p>
            <p className="text-xs text-muted-foreground">Response Rate</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {inquiries.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No inquiries yet. Complete your profile to attract families!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.slice(0, 5).map((inquiry: FamilyInquiry) => (
              <div
                key={inquiry.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",
                  inquiry.status === 'new' && "bg-orange-50 border-orange-200"
                )}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(
                        inquiry.status === 'new' ? "bg-orange-100 text-orange-700" : "bg-gray-100"
                      )}>
                        {inquiry.familyName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{inquiry.familyName}</span>
                        {inquiry.status === 'new' && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">NEW</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Looking for care for {inquiry.residentName || 'family member'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span className="text-sm font-medium">{inquiry.matchScore}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {inquiry.careNeeds.slice(0, 2).map((need) => (
                    <Badge key={need} variant="secondary" className="text-xs">
                      {need}
                    </Badge>
                  ))}
                  {inquiry.careNeeds.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{inquiry.careNeeds.length - 2}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {inquiry.timeline}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {stats.avgResponseTime > 4 && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-800">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              <strong>Tip:</strong> Homes that respond within 4 hours get 5x more placements.
            </p>
          </div>
        )}
      </CardContent>

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-md">
          {selectedInquiry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedInquiry.familyName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedInquiry.familyName}
                </DialogTitle>
                <DialogDescription>
                  Inquiry received {formatDistanceToNow(new Date(selectedInquiry.createdAt), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedInquiry.familyEmail}`} className="text-blue-600 hover:underline">
                      {selectedInquiry.familyEmail}
                    </a>
                  </div>
                  {selectedInquiry.familyPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedInquiry.familyPhone}`} className="text-blue-600 hover:underline">
                        {selectedInquiry.familyPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Care Needs */}
                <div>
                  <p className="text-sm font-medium mb-1">Care Needs:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedInquiry.careNeeds.map((need) => (
                      <Badge key={need} variant="secondary">{need}</Badge>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-sm font-medium mb-1">Payment Methods:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedInquiry.paymentTypes.map((type) => (
                      <Badge key={type} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Timeline: {selectedInquiry.timeline}</span>
                </div>

                {/* Message */}
                {selectedInquiry.message && (
                  <div>
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {selectedInquiry.message}
                    </p>
                  </div>
                )}

                {/* Match Score */}
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Match Score</span>
                    <span className="text-lg font-bold text-amber-600">{selectedInquiry.matchScore}%</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Based on their needs matching your capabilities
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => {
                      window.location.href = `mailto:${selectedInquiry.familyEmail}`;
                      updateStatus.mutate({ id: selectedInquiry.id, status: 'contacted' });
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Respond
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateStatus.mutate({ id: selectedInquiry.id, status: 'archived' });
                      setSelectedInquiry(null);
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function getMockInquiries(): FamilyInquiry[] {
  return [
    {
      id: 1,
      familyName: "Sarah Mitchell",
      familyEmail: "sarah.m@email.com",
      familyPhone: "206-555-1234",
      residentName: "Dorothy Mitchell",
      careNeeds: ["Dementia Care", "Medication Management"],
      paymentTypes: ["Medicaid", "Private Pay"],
      timeline: "Within 2 weeks",
      message: "Looking for a caring home for my mother who has early-stage dementia.",
      matchScore: 94,
      status: "new",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      familyName: "Michael Chen",
      familyEmail: "mchen@email.com",
      residentName: "Robert Chen",
      careNeeds: ["Diabetes Care", "Mobility Assistance"],
      paymentTypes: ["Private Pay"],
      timeline: "Within a month",
      matchScore: 87,
      status: "new",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      familyName: "Linda Thompson",
      familyEmail: "linda.t@email.com",
      familyPhone: "425-555-5678",
      residentName: "James Thompson",
      careNeeds: ["General Care"],
      paymentTypes: ["Long-term Care Insurance"],
      timeline: "Just exploring",
      matchScore: 78,
      status: "contacted",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
