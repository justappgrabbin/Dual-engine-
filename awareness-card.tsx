import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Zap } from "lucide-react";
import { type AwarenessScore, GATE_DATA } from "@shared/schema";

interface AwarenessCardProps {
  awareness: AwarenessScore;
}

const AWARENESS_CONFIG = {
  spleen: {
    title: "Splenic Awareness",
    subtitle: "Instinctive Intelligence",
    icon: Zap,
    color: "hsl(142, 71%, 45%)",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  ajna: {
    title: "Mental Awareness",
    subtitle: "Conceptual Intelligence",
    icon: Brain,
    color: "hsl(245, 75%, 58%)",
    bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
    borderClass: "border-indigo-500/30",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
  solar_plexus: {
    title: "Emotional Awareness",
    subtitle: "Emotional Intelligence",
    icon: Heart,
    color: "hsl(25, 95%, 53%)",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-600 dark:text-orange-400",
  },
};

export function AwarenessCard({ awareness }: AwarenessCardProps) {
  const config = AWARENESS_CONFIG[awareness.type];
  const Icon = config.icon;
  const percentage = Math.round(awareness.score * 100);

  return (
    <Card
      className={`border-card-border overflow-visible ${config.borderClass}`}
      data-testid={`awareness-card-${awareness.type}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${config.bgClass}`}>
              <Icon className={`h-4 w-4 ${config.textClass}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-bold" data-testid={`awareness-score-${awareness.type}`}>
              {awareness.score.toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${config.textClass}`}>
              {percentage}%
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            style={{ 
              "--progress-background": config.color 
            } as React.CSSProperties}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Activated Gates</p>
          <div className="flex flex-wrap gap-1">
            {awareness.activatedGates.length > 0 ? (
              awareness.activatedGates.map((gateId) => {
                const gate = GATE_DATA.find((g) => g.id === gateId);
                return (
                  <Badge
                    key={gateId}
                    variant="secondary"
                    className="font-mono text-xs"
                    data-testid={`activated-gate-${gateId}`}
                  >
                    {gateId}
                    {gate && <span className="ml-1 text-muted-foreground">· {gate.name.slice(0, 10)}</span>}
                  </Badge>
                );
              })
            ) : (
              <span className="text-xs text-muted-foreground italic">No gates activated</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
