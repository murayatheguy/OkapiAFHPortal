/**
 * Sync Status Indicator
 * Shows what EHR data is synced to public profile
 */

import { useState } from "react";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bed,
  Users,
  Award,
  DollarSign,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SyncItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  synced: boolean;
  value: string;
  publicValue: string;
}

interface SyncStatusIndicatorProps {
  facilityId: string;
  lastSynced?: Date;
  className?: string;
}

export function SyncStatusIndicator({ facilityId, lastSynced, className }: SyncStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // In real implementation, compare EHR data to public profile
  const syncItems: SyncItem[] = [
    {
      id: "beds",
      label: "Bed Availability",
      icon: <Bed className="h-4 w-4" />,
      synced: true,
      value: "4 occupied, 2 available",
      publicValue: "2 beds available",
    },
    {
      id: "staff",
      label: "Staff Count",
      icon: <Users className="h-4 w-4" />,
      synced: true,
      value: "3 active staff",
      publicValue: "1:3 ratio",
    },
    {
      id: "specializations",
      label: "Specializations",
      icon: <Award className="h-4 w-4" />,
      synced: true,
      value: "Dementia, Diabetes",
      publicValue: "Dementia, Diabetes",
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: <DollarSign className="h-4 w-4" />,
      synced: true,
      value: "$5,500 - $7,500",
      publicValue: "$5,500 - $7,500/mo",
    },
  ];

  const allSynced = syncItems.every((item) => item.synced);
  const syncedCount = syncItems.filter((item) => item.synced).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 h-8",
            allSynced ? "text-green-600" : "text-amber-600",
            className
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isOpen && "animate-spin")} />
          <span className="text-xs">
            {allSynced ? "Synced" : `${syncedCount}/${syncItems.length} synced`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Public Profile Sync</h4>
            {allSynced ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                All synced
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Your EHR data automatically updates your public listing.
          </p>

          <div className="space-y-2">
            {syncItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded text-sm",
                  item.synced ? "bg-green-50" : "bg-amber-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.publicValue}</span>
                  {item.synced ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {lastSynced && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3" />
              Last synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
