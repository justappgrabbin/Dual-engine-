import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Network, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { type CodonScore, CHANNEL_EDGES, CENTER_COLORS, GATE_DATA } from "@shared/schema";

interface GraphVisualizationProps {
  codons: CodonScore[];
  definedChannels: [number, number][];
}

const CENTER_POSITIONS: Record<string, { x: number; y: number }> = {
  "Head": { x: 200, y: 30 },
  "Ajna": { x: 200, y: 90 },
  "Throat": { x: 200, y: 170 },
  "G": { x: 200, y: 270 },
  "Heart": { x: 280, y: 230 },
  "Spleen": { x: 100, y: 340 },
  "Solar Plexus": { x: 300, y: 340 },
  "Sacral": { x: 200, y: 400 },
  "Root": { x: 200, y: 480 },
};

function getGatePosition(gateId: number, gatesInCenter: number[], centerPos: { x: number; y: number }) {
  const index = gatesInCenter.indexOf(gateId);
  const total = gatesInCenter.length;
  const spread = Math.min(60, total * 12);
  const angle = (index / Math.max(1, total - 1)) * Math.PI - Math.PI / 2;
  const radius = 35;
  
  if (total === 1) {
    return { x: centerPos.x, y: centerPos.y };
  }
  
  const offsetX = Math.cos(angle) * radius;
  const offsetY = (index - (total - 1) / 2) * 14;
  
  return {
    x: centerPos.x + offsetX,
    y: centerPos.y + offsetY,
  };
}

export function GraphVisualization({ codons, definedChannels }: GraphVisualizationProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredGate, setHoveredGate] = useState<number | null>(null);

  const gatesByCenter = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    GATE_DATA.forEach((gate) => {
      if (!grouped[gate.center]) grouped[gate.center] = [];
      grouped[gate.center].push(gate.id);
    });
    return grouped;
  }, []);

  const gatePositions = useMemo(() => {
    const positions: Record<number, { x: number; y: number }> = {};
    GATE_DATA.forEach((gate) => {
      const centerPos = CENTER_POSITIONS[gate.center];
      if (centerPos) {
        const gatesInCenter = gatesByCenter[gate.center] || [];
        positions[gate.id] = getGatePosition(gate.id, gatesInCenter, centerPos);
      }
    });
    return positions;
  }, [gatesByCenter]);

  const codonMap = useMemo(() => {
    const map = new Map<number, CodonScore>();
    codons.forEach((c) => map.set(c.gate, c));
    return map;
  }, [codons]);

  const definedChannelSet = useMemo(() => {
    return new Set(definedChannels.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  }, [definedChannels]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <Card className="border-card-border h-full" data-testid="graph-visualization">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <Network className="h-5 w-5 text-primary" />
            Channel Graph
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={handleZoomOut} data-testid="button-zoom-out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleZoomIn} data-testid="button-zoom-in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleReset} data-testid="button-reset-zoom">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          64 gates connected by channels • {definedChannels.length} defined channels
        </p>
      </CardHeader>
      <CardContent className="relative overflow-hidden">
        <div 
          className="w-full h-[520px] overflow-auto rounded-lg bg-muted/20"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <svg
            viewBox="0 0 400 520"
            className="w-full h-full"
            style={{ minWidth: 400, minHeight: 520 }}
          >
            {Object.entries(CENTER_POSITIONS).map(([center, pos]) => (
              <g key={center}>
                <ellipse
                  cx={pos.x}
                  cy={pos.y}
                  rx={50}
                  ry={35}
                  fill={`${CENTER_COLORS[center]}15`}
                  stroke={CENTER_COLORS[center]}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                />
                <text
                  x={pos.x}
                  y={pos.y - 45}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-medium"
                >
                  {center}
                </text>
              </g>
            ))}

            {CHANNEL_EDGES.map(([from, to]) => {
              const fromPos = gatePositions[from];
              const toPos = gatePositions[to];
              if (!fromPos || !toPos) return null;

              const channelKey = `${Math.min(from, to)}-${Math.max(from, to)}`;
              const isDefined = definedChannelSet.has(channelKey);
              const isHovered = hoveredGate === from || hoveredGate === to;

              return (
                <line
                  key={channelKey}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isDefined ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth={isDefined ? 2 : 0.5}
                  strokeOpacity={isHovered ? 1 : isDefined ? 0.8 : 0.2}
                  className="transition-all duration-200"
                />
              );
            })}

            {codons.map((codon) => {
              const pos = gatePositions[codon.gate];
              if (!pos) return null;

              const gate = GATE_DATA.find((g) => g.id === codon.gate);
              const centerColor = CENTER_COLORS[codon.center] || "hsl(0, 0%, 50%)";
              const isHovered = hoveredGate === codon.gate;
              const radius = codon.isActivated ? 8 + codon.score * 4 : 5;

              return (
                <Tooltip key={codon.gate}>
                  <TooltipTrigger asChild>
                    <g
                      onMouseEnter={() => setHoveredGate(codon.gate)}
                      onMouseLeave={() => setHoveredGate(null)}
                      className="cursor-pointer"
                      data-testid={`graph-node-${codon.gate}`}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill={codon.isActivated ? centerColor : "hsl(var(--muted))"}
                        stroke={isHovered ? "hsl(var(--primary))" : "transparent"}
                        strokeWidth={2}
                        opacity={codon.isActivated ? 0.9 : 0.4}
                        className="transition-all duration-200"
                      />
                      {codon.isActivated && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 3}
                          fill="none"
                          stroke={centerColor}
                          strokeWidth={1}
                          opacity={0.3}
                          className="animate-pulse"
                        />
                      )}
                      <text
                        x={pos.x}
                        y={pos.y + 3}
                        textAnchor="middle"
                        className="fill-current text-[6px] font-mono font-bold pointer-events-none"
                        style={{ 
                          fill: codon.isActivated ? "white" : "hsl(var(--muted-foreground))" 
                        }}
                      >
                        {codon.gate}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">Gate {codon.gate}</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: centerColor }}
                        />
                      </div>
                      {gate && <p className="text-sm">{gate.name}</p>}
                      <p className="text-xs text-muted-foreground">
                        {codon.center} • Score: {codon.score.toFixed(3)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
