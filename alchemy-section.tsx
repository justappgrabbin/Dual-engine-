import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Wind, Mountain, Sparkles } from "lucide-react";
import { type AlchemyLayer, TRIA_PRIMA, OPUS_PHASES } from "@shared/schema";

interface AlchemySectionProps {
  alchemy: AlchemyLayer;
}

const OPUS_COLORS: Record<typeof OPUS_PHASES[number], string> = {
  nigredo: "bg-gray-800 text-gray-100",
  albedo: "bg-white text-gray-900 border border-gray-300",
  citrinitas: "bg-amber-400 text-amber-900",
  rubedo: "bg-red-600 text-white",
};

const OPUS_DESCRIPTIONS: Record<typeof OPUS_PHASES[number], string> = {
  nigredo: "Blackening - Decomposition & shadow work",
  albedo: "Whitening - Purification & clarity",
  citrinitas: "Yellowing - Awakening & illumination",
  rubedo: "Reddening - Integration & wholeness",
};

export function AlchemySection({ alchemy }: AlchemySectionProps) {
  const { triaPrima, opusPhase, interaction } = alchemy;

  return (
    <Card className="border-card-border" data-testid="alchemy-section">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Alchemy Layer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tria Prima composition and opus phase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-4 py-4">
          <Badge 
            className={`text-sm px-4 py-2 ${OPUS_COLORS[opusPhase]}`}
            data-testid="opus-phase"
          >
            {opusPhase.charAt(0).toUpperCase() + opusPhase.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {OPUS_DESCRIPTIONS[opusPhase]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <TriaPrimaCard
            name="Sulfur"
            symbol={TRIA_PRIMA.sulfur.symbol}
            element="Fire"
            complex="Heart"
            score={triaPrima.sulfur}
            icon={Flame}
            colorClass="text-orange-500"
            bgClass="bg-orange-500/10"
            progressColor="hsl(25, 95%, 53%)"
          />
          <TriaPrimaCard
            name="Mercury"
            symbol={TRIA_PRIMA.mercury.symbol}
            element="Air"
            complex="Mind"
            score={triaPrima.mercury}
            icon={Wind}
            colorClass="text-sky-500"
            bgClass="bg-sky-500/10"
            progressColor="hsl(200, 95%, 53%)"
          />
          <TriaPrimaCard
            name="Salt"
            symbol={TRIA_PRIMA.salt.symbol}
            element="Earth"
            complex="Body"
            score={triaPrima.salt}
            icon={Mountain}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
            progressColor="hsl(142, 71%, 45%)"
          />
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Mind-Heart-Body Interaction</h4>
            <Badge 
              variant={interaction.outcome === "coherence" ? "default" : interaction.outcome === "mediated" ? "secondary" : "destructive"}
              data-testid="interaction-outcome"
            >
              {interaction.outcome}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Leader:</span>
              <span className="ml-2 font-medium capitalize">{interaction.leader}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Triad:</span>
              <span className="ml-2 font-mono">{interaction.triad.toFixed(3)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
            <div className="text-center">
              <span>Mind↔Heart</span>
              <div className="font-mono mt-1">{interaction.couplings.mind_heart.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <span>Heart↔Body</span>
              <div className="font-mono mt-1">{interaction.couplings.heart_body.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <span>Mind↔Body</span>
              <div className="font-mono mt-1">{interaction.couplings.mind_body.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TriaPrimaCardProps {
  name: string;
  symbol: string;
  element: string;
  complex: string;
  score: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  progressColor: string;
}

function TriaPrimaCard({
  name,
  symbol,
  element,
  complex,
  score,
  icon: Icon,
  colorClass,
  bgClass,
  progressColor,
}: TriaPrimaCardProps) {
  const percentage = Math.round(score * 100);

  return (
    <div 
      className={`p-4 rounded-lg ${bgClass} border border-border`}
      data-testid={`tria-prima-${name.toLowerCase()}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${colorClass}`} />
        <div>
          <span className="font-medium">{name}</span>
          <span className="ml-1 text-lg">{symbol}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        {element} → {complex}
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono font-bold">{score.toFixed(2)}</span>
          <span className={`text-sm ${colorClass}`}>{percentage}%</span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          style={{ "--progress-background": progressColor } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
