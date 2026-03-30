import { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLANETS, STREAMS, type Placement, type TransitSun } from "@shared/schema";

interface PlacementFormProps {
  onSubmit: (placements: Placement[], transitSun?: TransitSun) => void;
  isLoading: boolean;
}

const DEFAULT_PLACEMENTS: Placement[] = [
  { planet: "Sun", stream: "body", gate: 46, line: 3 },
  { planet: "Earth", stream: "body", gate: 25, line: 3 },
  { planet: "Moon", stream: "body", gate: 30, line: 2 },
  { planet: "Sun", stream: "design", gate: 4, line: 5 },
  { planet: "Earth", stream: "design", gate: 49, line: 5 },
];

export function PlacementForm({ onSubmit, isLoading }: PlacementFormProps) {
  const [placements, setPlacements] = useState<Placement[]>(DEFAULT_PLACEMENTS);
  const [transitSun, setTransitSun] = useState<TransitSun>({ gate: 1, line: 1 });
  const [useTransit, setUseTransit] = useState(false);

  const addPlacement = () => {
    setPlacements([
      ...placements,
      { planet: "Mercury", stream: "body", gate: 1, line: 1 },
    ]);
  };

  const removePlacement = (index: number) => {
    setPlacements(placements.filter((_, i) => i !== index));
  };

  const updatePlacement = (index: number, field: keyof Placement, value: string | number) => {
    const updated = [...placements];
    if (field === "gate" || field === "line") {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPlacements(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(placements, useTransit ? transitSun : undefined);
  };

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Sparkles className="h-5 w-5 text-primary" />
          Chart Placements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            {placements.map((placement, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-md bg-muted/50"
                data-testid={`placement-row-${index}`}
              >
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Planet</Label>
                    <Select
                      value={placement.planet}
                      onValueChange={(v) => updatePlacement(index, "planet", v)}
                    >
                      <SelectTrigger data-testid={`select-planet-${index}`} className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANETS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Stream</Label>
                    <Select
                      value={placement.stream}
                      onValueChange={(v) => updatePlacement(index, "stream", v)}
                    >
                      <SelectTrigger data-testid={`select-stream-${index}`} className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STREAMS.map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge variant={s === "body" ? "default" : "secondary"} className="text-xs">
                              {s}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Gate</Label>
                    <Input
                      type="number"
                      min={1}
                      max={64}
                      value={placement.gate}
                      onChange={(e) => updatePlacement(index, "gate", e.target.value)}
                      className="h-9 font-mono"
                      data-testid={`input-gate-${index}`}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Line</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={placement.line}
                      onChange={(e) => updatePlacement(index, "line", e.target.value)}
                      className="h-9 font-mono"
                      data-testid={`input-line-${index}`}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlacement(index)}
                  className="mt-5"
                  data-testid={`button-remove-placement-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPlacement}
            className="w-full"
            data-testid="button-add-placement"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Placement
          </Button>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Transit Sun Modulation</Label>
              <Button
                type="button"
                variant={useTransit ? "default" : "outline"}
                size="sm"
                onClick={() => setUseTransit(!useTransit)}
                data-testid="button-toggle-transit"
              >
                {useTransit ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {useTransit && (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-muted/50">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Transit Gate</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    value={transitSun.gate}
                    onChange={(e) => setTransitSun({ ...transitSun, gate: Number(e.target.value) })}
                    className="h-9 font-mono"
                    data-testid="input-transit-gate"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Transit Line</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={transitSun.line}
                    onChange={(e) => setTransitSun({ ...transitSun, line: Number(e.target.value) })}
                    className="h-9 font-mono"
                    data-testid="input-transit-line"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || placements.length === 0}
            data-testid="button-analyze-chart"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Chart
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
