/**
 * Quality Badges Component
 * Shows badges earned from EHR activity that display on public profile
 */

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Brain,
  Clock,
  Pill,
  FileCheck,
  Shield,
  Heart,
  Star,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QualityBadge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  requirement: string;
  status: 'earned' | 'almost' | 'locked';
  progress: number;
  earnedAt?: string;
}

interface QualityBadgesProps {
  facilityId: string;
}

export function QualityBadges({ facilityId }: QualityBadgesProps) {
  // Fetch or calculate badges based on EHR data
  const { data: badges } = useQuery({
    queryKey: ["quality-badges", facilityId],
    queryFn: async () => {
      // In real implementation, calculate from actual EHR data
      return getDefaultBadges();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const earnedBadges = badges?.filter((b: QualityBadge) => b.status === 'earned') || [];
  const almostBadges = badges?.filter((b: QualityBadge) => b.status === 'almost') || [];
  const lockedBadges = badges?.filter((b: QualityBadge) => b.status === 'locked') || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Quality Badges
            </CardTitle>
            <CardDescription>
              Earned from your care quality. Displayed on your public profile.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-amber-600">
            {earnedBadges.length} earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TooltipProvider>
            {/* Earned Badges */}
            {earnedBadges.map((badge: QualityBadge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200 cursor-help">
                    <div className="p-2 rounded-full bg-green-100">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{badge.name}</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-green-600">Earned</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <p className="text-xs mt-1">Requirement: {badge.requirement}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Almost Earned */}
            {almostBadges.map((badge: QualityBadge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200 cursor-help">
                    <div className="p-2 rounded-full bg-amber-100">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{badge.name}</span>
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      </div>
                      <div className="mt-1">
                        <Progress value={badge.progress} className="h-1.5" />
                        <p className="text-xs text-amber-600 mt-0.5">{badge.progress}% - Almost there!</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <p className="text-xs mt-1">Requirement: {badge.requirement}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Locked */}
            {lockedBadges.slice(0, 2).map((badge: QualityBadge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200 opacity-60 cursor-help">
                    <div className="p-2 rounded-full bg-gray-100">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate text-gray-500">{badge.name}</span>
                        <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500">Locked</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <p className="text-xs mt-1">To unlock: {badge.requirement}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Badges build trust with families and improve your search ranking.
        </p>
      </CardContent>
    </Card>
  );
}

function getDefaultBadges(): QualityBadge[] {
  return [
    {
      id: "dementia-specialist",
      name: "Dementia Specialist",
      icon: <Brain className="h-5 w-5 text-purple-600" />,
      description: "Specialized training and experience in dementia care",
      requirement: "3+ dementia residents, staff dementia training",
      status: "earned",
      progress: 100,
      earnedAt: "2024-10-15",
    },
    {
      id: "highly-responsive",
      name: "Highly Responsive",
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      description: "Quick response to family inquiries",
      requirement: "Respond to inquiries within 24 hours",
      status: "earned",
      progress: 100,
      earnedAt: "2024-11-01",
    },
    {
      id: "med-compliance",
      name: "Medication Star",
      icon: <Pill className="h-5 w-5 text-teal-600" />,
      description: "Excellent medication administration compliance",
      requirement: "99%+ on-time medication rate for 30 days",
      status: "almost",
      progress: 87,
    },
    {
      id: "documentation-pro",
      name: "Documentation Pro",
      icon: <FileCheck className="h-5 w-5 text-green-600" />,
      description: "Thorough and timely care documentation",
      requirement: "All care plans current, daily notes logged",
      status: "almost",
      progress: 75,
    },
    {
      id: "zero-incidents",
      name: "Safety Champion",
      icon: <Shield className="h-5 w-5 text-amber-600" />,
      description: "Outstanding safety record",
      requirement: "90 days with zero reportable incidents",
      status: "locked",
      progress: 45,
    },
    {
      id: "family-favorite",
      name: "Family Favorite",
      icon: <Heart className="h-5 w-5 text-red-500" />,
      description: "Loved by families",
      requirement: "5+ reviews with 4.5+ average rating",
      status: "locked",
      progress: 20,
    },
  ];
}
