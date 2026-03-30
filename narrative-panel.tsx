import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Copy, Check, Zap, Brain, Heart, Sparkles } from "lucide-react";
import { type AwarenessScore } from "@shared/schema";

interface NarrativePanelProps {
  awareness: {
    spleen: AwarenessScore;
    ajna: AwarenessScore;
    solar_plexus: AwarenessScore;
  };
}

const PERSPECTIVE_CONFIG = {
  spleen: {
    title: "Splenic Perspective",
    icon: Zap,
    color: "text-emerald-500",
    description: "Instinctive and survival-based intelligence",
  },
  ajna: {
    title: "Mental Perspective",
    icon: Brain,
    color: "text-indigo-500",
    description: "Conceptual and analytical processing",
  },
  solar_plexus: {
    title: "Emotional Perspective",
    icon: Heart,
    color: "text-orange-500",
    description: "Emotional wave and feeling intelligence",
  },
};

function generateNarrative(type: "spleen" | "ajna" | "solar_plexus", awareness: AwarenessScore): string {
  const intensity = awareness.score > 0.6 ? "strongly" : awareness.score > 0.3 ? "moderately" : "subtly";
  const gateCount = awareness.activatedGates.length;
  
  const narratives = {
    spleen: gateCount > 0
      ? `Your splenic awareness is ${intensity} activated through ${gateCount} gate${gateCount > 1 ? 's' : ''}. This indicates a heightened instinctive intelligence operating in the moment. The activated gates (${awareness.activatedGates.join(', ')}) create a pattern of intuitive knowing that processes information instantaneously. Trust your gut reactions and in-the-moment awareness.`
      : "Your splenic gates are currently unactivated in this chart configuration. This suggests the instinctive awareness may operate more subtly or through other centers. Pay attention to sudden knowings and survival instincts.",
    ajna: gateCount > 0
      ? `Your mental awareness shows ${intensity} activation across ${gateCount} gate${gateCount > 1 ? 's' : ''}. The Ajna center processes concepts and ideas through gates ${awareness.activatedGates.join(', ')}. This configuration supports analytical thinking and conceptual understanding. Remember that mental awareness is for processing, not decision-making.`
      : "The Ajna gates show minimal activation in this configuration. Mental processing may happen through other channels or in more fluid ways. Avoid over-relying on mental analysis for major decisions.",
    solar_plexus: gateCount > 0
      ? `Your emotional awareness is ${intensity} engaged through ${gateCount} gate${gateCount > 1 ? 's' : ''}. The Solar Plexus gates (${awareness.activatedGates.join(', ')}) create emotional depth and wave patterns. This emotional intelligence requires time to reach clarity. Wait through your emotional wave before making significant decisions.`
      : "The emotional gates are less active in this chart. This may indicate a more consistent emotional baseline without strong wave patterns. Emotional clarity may come more quickly for you.",
  };

  return narratives[type];
}

function generateCollapsedNarrative(awareness: NarrativePanelProps["awareness"]): string {
  const totalActivated = awareness.spleen.activatedGates.length + 
                         awareness.ajna.activatedGates.length + 
                         awareness.solar_plexus.activatedGates.length;
  
  const dominant = [
    { type: "splenic", score: awareness.spleen.score },
    { type: "mental", score: awareness.ajna.score },
    { type: "emotional", score: awareness.solar_plexus.score },
  ].sort((a, b) => b.score - a.score)[0];

  return `This chart configuration activates ${totalActivated} awareness gates across three intelligence centers. The ${dominant.type} awareness appears most prominent with a score of ${(dominant.score * 100).toFixed(0)}%. This suggests a primary mode of processing information through ${dominant.type === "splenic" ? "instant intuitive knowing" : dominant.type === "mental" ? "conceptual analysis" : "emotional waves and feelings"}. Integration of all three awareness forms creates a holistic intelligence pattern unique to this chart.`;
}

export function NarrativePanel({ awareness }: NarrativePanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("collapsed");

  const handleCopy = async () => {
    const narrative = activeTab === "collapsed"
      ? generateCollapsedNarrative(awareness)
      : generateNarrative(activeTab as "spleen" | "ajna" | "solar_plexus", awareness[activeTab as keyof typeof awareness]);
    
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-card-border" data-testid="narrative-panel">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <MessageSquare className="h-5 w-5 text-primary" />
            Awareness Narrative
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            data-testid="button-copy-narrative"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          QCE triad outputs from three awareness perspectives
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="collapsed" className="gap-1.5" data-testid="tab-collapsed">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Synthesis</span>
            </TabsTrigger>
            <TabsTrigger value="spleen" className="gap-1.5" data-testid="tab-spleen">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Spleen</span>
            </TabsTrigger>
            <TabsTrigger value="ajna" className="gap-1.5" data-testid="tab-ajna">
              <Brain className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Ajna</span>
            </TabsTrigger>
            <TabsTrigger value="solar_plexus" className="gap-1.5" data-testid="tab-solar-plexus">
              <Heart className="h-3.5 w-3.5 text-orange-500" />
              <span className="hidden sm:inline">Solar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collapsed">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Synthesized Narrative</span>
                <Badge variant="secondary" className="text-xs">Combined</Badge>
              </div>
              <ScrollArea className="h-32">
                <p className="text-sm leading-relaxed" data-testid="narrative-collapsed">
                  {generateCollapsedNarrative(awareness)}
                </p>
              </ScrollArea>
            </div>
          </TabsContent>

          {(["spleen", "ajna", "solar_plexus"] as const).map((type) => {
            const config = PERSPECTIVE_CONFIG[type];
            const Icon = config.icon;
            
            return (
              <TabsContent key={type} value={type}>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="font-medium">{config.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {(awareness[type].score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
                  <ScrollArea className="h-28">
                    <p className="text-sm leading-relaxed" data-testid={`narrative-${type}`}>
                      {generateNarrative(type, awareness[type])}
                    </p>
                  </ScrollArea>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
