import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Grid3X3 } from "lucide-react";
import { type CodonScore, CENTER_COLORS } from "@shared/schema";

interface CodonGridProps {
  codons: CodonScore[];
}

export function CodonGrid({ codons }: CodonGridProps) {
  const [hoveredGate, setHoveredGate] = useState<number | null>(null);

  const getScoreColor = (score: number, isActivated: boolean) => {
    if (!isActivated) return "bg-muted/30";
    const intensity = Math.min(score * 100, 100);
    return `bg-primary/${Math.max(10, Math.round(intensity))}`;
  };

  const sortedCodons = [...codons].sort((a, b) => a.gate - b.gate);

  return (
    <Card className="border-card-border" data-testid="codon-grid">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Grid3X3 className="h-5 w-5 text-primary" />
          Codon Activation Grid
        </CardTitle>
        <p className="text-sm text-muted-foreground">64 gates displayed as 8×8 matrix</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2">
          {sortedCodons.map((codon) => {
            const centerColor = CENTER_COLORS[codon.center] || "hsl(0, 0%, 50%)";
            const isHovered = hoveredGate === codon.gate;
            
            return (
              <Tooltip key={codon.gate}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`
                      aspect-square rounded-md flex flex-col items-center justify-center
                      transition-all duration-200 cursor-pointer
                      ${codon.isActivated 
                        ? "ring-2 ring-offset-1 ring-offset-background" 
                        : "opacity-50 hover:opacity-80"
                      }
                      ${isHovered ? "scale-110 z-10" : ""}
                      hover-elevate
                    `}
                    style={{
                      backgroundColor: codon.isActivated 
                        ? `${centerColor}${Math.round(Math.max(0.2, codon.score) * 255).toString(16).padStart(2, '0')}`
                        : "hsl(var(--muted) / 0.3)",
                      borderColor: codon.isActivated ? centerColor : "transparent",
                      "--tw-ring-color": codon.isActivated ? centerColor : undefined,
                    } as React.CSSProperties}
                    onMouseEnter={() => setHoveredGate(codon.gate)}
                    onMouseLeave={() => setHoveredGate(null)}
                    data-testid={`codon-cell-${codon.gate}`}
                  >
                    <span className="font-mono text-sm font-bold leading-none">
                      {codon.gate}
                    </span>
                    {codon.isActivated && (
                      <span className="text-[10px] font-mono opacity-80 mt-0.5">
                        {(codon.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">Gate {codon.gate}</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: centerColor }}
                      />
                    </div>
                    <p className="text-sm font-medium">{codon.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{codon.center} Center</span>
                      <span>·</span>
                      <span>Score: {codon.score.toFixed(3)}</span>
                    </div>
                    {codon.isActivated && (
                      <span className="inline-block text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        Activated
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <p className="text-xs text-muted-foreground font-medium w-full">Centers:</p>
          {Object.entries(CENTER_COLORS).map(([center, color]) => (
            <div key={center} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{center}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
