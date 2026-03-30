import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, Sun, ArrowRight } from "lucide-react";
import { type ModulatorScore, GATE_DATA } from "@shared/schema";

interface ModulatorsSectionProps {
  heart: ModulatorScore;
  mind: ModulatorScore;
}

export function ModulatorsSection({ heart, mind }: ModulatorsSectionProps) {
  const { sunGate, sunLine, gamma, beta, seed } = heart.filmParams;
  const sunGateInfo = GATE_DATA.find((g) => g.id === sunGate);

  return (
    <Card className="border-card-border" data-testid="modulators-section">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Sun className="h-5 w-5 text-amber-500" />
          FiLM Modulators
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Heart & Mind scores modulated by Body Sun (Gate {sunGate}.{sunLine})
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-4 py-4 px-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Body Sun</p>
              <p className="text-xs text-muted-foreground">Modulation Source</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <span className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">
              {sunGate}.{sunLine}
            </span>
            {sunGateInfo && (
              <p className="text-xs text-muted-foreground mt-1">{sunGateInfo.name}</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <div className="flex gap-3 font-mono text-sm">
              <span>γ={gamma.toFixed(3)}</span>
              <span>β={beta.toFixed(3)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">seed={seed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModulatorCard
            title="Heart / Ego"
            subtitle="Will & Willpower"
            icon={Heart}
            modulator={heart}
            colorClass="text-red-500"
            bgClass="bg-red-500/10 dark:bg-red-500/20"
            borderClass="border-red-500/30"
            progressColor="hsl(0, 84%, 60%)"
          />
          <ModulatorCard
            title="Mind"
            subtitle="Conceptual Processing"
            icon={Brain}
            modulator={mind}
            colorClass="text-indigo-500"
            bgClass="bg-indigo-500/10 dark:bg-indigo-500/20"
            borderClass="border-indigo-500/30"
            progressColor="hsl(245, 75%, 58%)"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ModulatorCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  modulator: ModulatorScore;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  progressColor: string;
}

function ModulatorCard({
  title,
  subtitle,
  icon: Icon,
  modulator,
  colorClass,
  bgClass,
  borderClass,
  progressColor,
}: ModulatorCardProps) {
  const percentage = Math.round(modulator.score * 100);

  return (
    <div
      className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}
      data-testid={`modulator-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono">
          γ/β FiLM
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-mono font-bold" data-testid={`modulator-score-${title.toLowerCase()}`}>
            {modulator.score.toFixed(2)}
          </span>
          <span className={`text-sm font-medium ${colorClass}`}>
            {percentage}%
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          style={{ 
            "--progress-background": progressColor 
          } as React.CSSProperties}
        />
        {modulator.rationale && (
          <p className="text-xs text-muted-foreground italic mt-2">
            {modulator.rationale}
          </p>
        )}
      </div>
    </div>
  );
}
