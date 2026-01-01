/**
 * Coming Soon Component
 *
 * Displays a placeholder for features that are not yet available.
 * Used for PHI-related features that require HIPAA compliance.
 */

import { Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PHASE_2_TARGET } from "@shared/featureFlags";

interface ComingSoonProps {
  title: string;
  description?: string;
  features?: string[];
  targetDate?: string;
  compact?: boolean;
}

/**
 * Full-page Coming Soon display
 */
export function ComingSoon({
  title,
  description,
  features = [],
  targetDate = PHASE_2_TARGET,
  compact = false,
}: ComingSoonProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Clock className="h-4 w-4" />
        <span>Coming {targetDate}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description || "This feature is coming soon."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {features.length > 0 && (
            <div className="text-left space-y-2">
              <p className="text-sm font-medium text-muted-foreground">What's included:</p>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Expected {targetDate}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            We're building HIPAA-compliant infrastructure to keep your residents' data safe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline Coming Soon badge for navigation items
 */
export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <Badge variant="outline" className={`text-xs py-0 px-1.5 ${className}`}>
      Soon
    </Badge>
  );
}

/**
 * Coming Soon overlay for partially-built features
 */
export function ComingSoonOverlay({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center p-6">
          <div className="mb-3 h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Coming {PHASE_2_TARGET}
          </p>
        </div>
      </div>
    </div>
  );
}
