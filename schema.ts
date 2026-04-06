import { z } from "zod";

export const PLANETS = [
  "Sun", "Earth", "Moon", "Mercury", "Venus", "Mars", 
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", 
  "North Node", "South Node"
] as const;

export const STREAMS = ["body", "design"] as const;

export const CENTERS = [
  "Head", "Ajna", "Throat", "G", "Heart", 
  "Spleen", "Solar Plexus", "Sacral", "Root"
] as const;

export const AWARENESS_SETS = {
  spleen: [57, 44, 50, 32, 28, 18],
  ajna: [47, 24, 4, 17, 11, 43],
  solar_plexus: [55, 49, 37, 22, 30, 36, 6],
} as const;

export const HEART_GATES = [21, 51, 26, 40] as const;
export const MIND_GATES = [47, 24, 4, 17, 11, 43] as const;

export const TRIA_PRIMA = {
  sulfur: { name: "Sulfur", symbol: "🜍", element: "fire", complex: "Heart", centers: ["G", "Heart", "Solar Plexus"] },
  mercury: { name: "Mercury", symbol: "☿", element: "air", complex: "Mind", centers: ["Head", "Ajna", "Throat"] },
  salt: { name: "Salt", symbol: "🜔", element: "earth", complex: "Body", centers: ["Spleen", "Sacral", "Root"] },
} as const;

export const OPUS_PHASES = ["nigredo", "albedo", "citrinitas", "rubedo"] as const;

export const placementSchema = z.object({
  planet: z.enum(PLANETS),
  stream: z.enum(STREAMS),
  gate: z.number().min(1).max(64),
  line: z.number().min(1).max(6),
  degree: z.number().optional(),
  color: z.number().min(1).max(6).optional(),
  tone: z.number().min(1).max(6).optional(),
  base: z.number().min(1).max(5).optional(),
});

export type Placement = z.infer<typeof placementSchema>;

export const extendedPlacementSchema = z.object({
  planet: z.string(),
  stream: z.enum(["design", "personality"]),
  gate: z.number().min(1).max(64),
  line: z.number().min(1).max(6),
  color: z.number().min(1).max(6),
  tone: z.number().min(1).max(6),
  base: z.number().min(1).max(5),
  degree: z.number(),
  minute: z.number(),
  second: z.number(),
  zodiacSign: z.string(),
  house: z.number().min(1).max(12),
});

export type ExtendedPlacement = z.infer<typeof extendedPlacementSchema>;

// ResonanceSentence is now imported from sentence-engine.ts for the full implementation
// Re-export for backward compatibility
export type { ResonanceSentence, ExtendedPlacement as SentenceExtendedPlacement, ChartResonance } from "./sentence-engine";

export const transitSunSchema = z.object({
  gate: z.number().min(1).max(64),
  line: z.number().min(1).max(6),
});

export type TransitSun = z.infer<typeof transitSunSchema>;

export const chartRequestSchema = z.object({
  placements: z.array(placementSchema).min(1),
  transitSun: transitSunSchema.optional(),
});

export type ChartRequest = z.infer<typeof chartRequestSchema>;

export interface CodonScore {
  gate: number;
  score: number;
  name: string;
  center: string;
  circuitGroup: string;
  isActivated: boolean;
  definedByPlacement: boolean;
  definedByChannel: boolean;
}

export interface AwarenessScore {
  type: "spleen" | "ajna" | "solar_plexus";
  score: number;
  activatedGates: number[];
}

export interface FiLMParams {
  gamma: number;
  beta: number;
  sunGate: number;
  sunLine: number;
  seed: number;
}

export interface ModulatorScore {
  score: number;
  baseScore: number;
  filmParams: FiLMParams;
  rationale: string;
}

export interface TriaPrimaScore {
  sulfur: number;
  mercury: number;
  salt: number;
}

export interface Interaction {
  leader: "mind" | "heart" | "body";
  outcome: "coherence" | "mediated" | "conflict";
  triad: number;
  couplings: {
    mind_heart: number;
    heart_body: number;
    mind_body: number;
  };
}

export interface IncarnationCross {
  name: string;
  gates: {
    design_sun: number;
    design_earth: number;
    personality_sun: number;
    personality_earth: number;
  };
  compound: {
    elements: string[];
    formula: string;
  };
  bias: {
    mind: number;
    heart: number;
    body: number;
  };
}

export interface AlchemyLayer {
  triaPrima: TriaPrimaScore;
  opusPhase: typeof OPUS_PHASES[number];
  interaction: Interaction;
  cross?: IncarnationCross;
}

export interface ChartResponse {
  codons: CodonScore[];
  awareness: {
    spleen: AwarenessScore;
    ajna: AwarenessScore;
    solar_plexus: AwarenessScore;
  };
  heart: ModulatorScore;
  mind: ModulatorScore;
  definedChannels: [number, number][];
  alchemy: AlchemyLayer;
  sentences?: ResonanceSentence[];
}

export interface GateInfo {
  id: number;
  name: string;
  center: string;
  circuitGroup: string;
  channels: number[];
  awarenessCenter: string | null;
}

export const GATE_DATA: GateInfo[] = [
  { id: 1, name: "The Creative", center: "G", circuitGroup: "Individual", channels: [8], awarenessCenter: null },
  { id: 2, name: "The Receptive", center: "G", circuitGroup: "Individual", channels: [14], awarenessCenter: null },
  { id: 3, name: "Difficulty at the Beginning", center: "Sacral", circuitGroup: "Individual", channels: [60], awarenessCenter: null },
  { id: 4, name: "Youthful Folly", center: "Ajna", circuitGroup: "Collective", channels: [63], awarenessCenter: "ajna" },
  { id: 5, name: "Waiting (Fixed Patterns)", center: "Sacral", circuitGroup: "Collective", channels: [15], awarenessCenter: null },
  { id: 6, name: "Conflict (Friction)", center: "Solar Plexus", circuitGroup: "Tribal", channels: [59], awarenessCenter: "solar_plexus" },
  { id: 7, name: "The Army (Role of Self)", center: "G", circuitGroup: "Collective", channels: [31], awarenessCenter: null },
  { id: 8, name: "Holding Together (Contribution)", center: "Throat", circuitGroup: "Individual", channels: [1], awarenessCenter: null },
  { id: 9, name: "The Taming Power of the Small (Focus)", center: "Sacral", circuitGroup: "Collective", channels: [52], awarenessCenter: null },
  { id: 10, name: "Treading (Behavior of Self)", center: "G", circuitGroup: "Individual", channels: [20, 34, 57], awarenessCenter: null },
  { id: 11, name: "Peace (Ideas)", center: "Ajna", circuitGroup: "Collective", channels: [56], awarenessCenter: "ajna" },
  { id: 12, name: "Standstill (Caution)", center: "Throat", circuitGroup: "Individual", channels: [22], awarenessCenter: null },
  { id: 13, name: "Fellowship of Man (Listener)", center: "G", circuitGroup: "Collective", channels: [33], awarenessCenter: null },
  { id: 14, name: "Possession in Great Measure (Power Skills)", center: "Sacral", circuitGroup: "Individual", channels: [2], awarenessCenter: null },
  { id: 15, name: "Modesty (Extremes)", center: "G", circuitGroup: "Collective", channels: [5], awarenessCenter: null },
  { id: 16, name: "Enthusiasm (Skills)", center: "Throat", circuitGroup: "Collective", channels: [48], awarenessCenter: null },
  { id: 17, name: "Following (Opinions)", center: "Ajna", circuitGroup: "Collective", channels: [62], awarenessCenter: "ajna" },
  { id: 18, name: "Work on What Has Been Spoilt (Correction)", center: "Spleen", circuitGroup: "Collective", channels: [58], awarenessCenter: "spleen" },
  { id: 19, name: "Approach", center: "Root", circuitGroup: "Tribal", channels: [49], awarenessCenter: null },
  { id: 20, name: "Contemplation (The Now)", center: "Throat", circuitGroup: "Individual", channels: [10, 34, 57], awarenessCenter: null },
  { id: 21, name: "Biting Through (The Hunter)", center: "Heart", circuitGroup: "Tribal", channels: [45], awarenessCenter: null },
  { id: 22, name: "Grace (Openness)", center: "Solar Plexus", circuitGroup: "Individual", channels: [12], awarenessCenter: "solar_plexus" },
  { id: 23, name: "Splitting Apart (Assimilation)", center: "Throat", circuitGroup: "Individual", channels: [43], awarenessCenter: null },
  { id: 24, name: "Returning (Rationalization)", center: "Ajna", circuitGroup: "Individual", channels: [61], awarenessCenter: "ajna" },
  { id: 25, name: "Innocence (Spirit of Self)", center: "G", circuitGroup: "Individual", channels: [51], awarenessCenter: null },
  { id: 26, name: "Taming Power of the Great (The Egoist)", center: "Heart", circuitGroup: "Tribal", channels: [44], awarenessCenter: null },
  { id: 27, name: "Nourishment (Caring)", center: "Sacral", circuitGroup: "Tribal", channels: [50], awarenessCenter: null },
  { id: 28, name: "Preponderance of the Great (The Game Player)", center: "Spleen", circuitGroup: "Individual", channels: [38], awarenessCenter: "spleen" },
  { id: 29, name: "The Abysmal (Perseverance)", center: "Sacral", circuitGroup: "Collective", channels: [46], awarenessCenter: null },
  { id: 30, name: "The Clinging Fire (Feelings)", center: "Solar Plexus", circuitGroup: "Collective", channels: [41], awarenessCenter: "solar_plexus" },
  { id: 31, name: "Influence (Leadership)", center: "Throat", circuitGroup: "Collective", channels: [7], awarenessCenter: null },
  { id: 32, name: "Duration (Continuity)", center: "Spleen", circuitGroup: "Tribal", channels: [54], awarenessCenter: "spleen" },
  { id: 33, name: "Retreat (Privacy)", center: "Throat", circuitGroup: "Collective", channels: [13], awarenessCenter: null },
  { id: 34, name: "Power of the Great (Power)", center: "Sacral", circuitGroup: "Individual", channels: [10, 20, 57], awarenessCenter: null },
  { id: 35, name: "Progress (Change)", center: "Throat", circuitGroup: "Collective", channels: [36], awarenessCenter: null },
  { id: 36, name: "Darkening of the Light (Crisis)", center: "Solar Plexus", circuitGroup: "Collective", channels: [35], awarenessCenter: "solar_plexus" },
  { id: 37, name: "The Family (Friendship)", center: "Solar Plexus", circuitGroup: "Tribal", channels: [40], awarenessCenter: "solar_plexus" },
  { id: 38, name: "Opposition (The Fighter)", center: "Root", circuitGroup: "Individual", channels: [28], awarenessCenter: null },
  { id: 39, name: "Obstruction (Provocation)", center: "Root", circuitGroup: "Individual", channels: [55], awarenessCenter: null },
  { id: 40, name: "Deliverance (Aloneness)", center: "Heart", circuitGroup: "Tribal", channels: [37], awarenessCenter: null },
  { id: 41, name: "Decrease (Contraction)", center: "Root", circuitGroup: "Collective", channels: [30], awarenessCenter: null },
  { id: 42, name: "Increase (Growth)", center: "Sacral", circuitGroup: "Collective", channels: [53], awarenessCenter: null },
  { id: 43, name: "Breakthrough (Insight)", center: "Ajna", circuitGroup: "Individual", channels: [23], awarenessCenter: "ajna" },
  { id: 44, name: "Coming to Meet (Alertness)", center: "Spleen", circuitGroup: "Tribal", channels: [26], awarenessCenter: "spleen" },
  { id: 45, name: "Gathering Together (The Gatherer)", center: "Throat", circuitGroup: "Tribal", channels: [21], awarenessCenter: null },
  { id: 46, name: "Pushing Upward (Determination of Self)", center: "G", circuitGroup: "Collective", channels: [29], awarenessCenter: null },
  { id: 47, name: "Oppression (Realization)", center: "Ajna", circuitGroup: "Collective", channels: [64], awarenessCenter: "ajna" },
  { id: 48, name: "The Well (Depth)", center: "Spleen", circuitGroup: "Collective", channels: [16], awarenessCenter: "spleen" },
  { id: 49, name: "Revolution (Principles)", center: "Solar Plexus", circuitGroup: "Tribal", channels: [19], awarenessCenter: "solar_plexus" },
  { id: 50, name: "The Cauldron (Values)", center: "Spleen", circuitGroup: "Tribal", channels: [27], awarenessCenter: "spleen" },
  { id: 51, name: "The Arousing (Shock)", center: "Heart", circuitGroup: "Individual", channels: [25], awarenessCenter: null },
  { id: 52, name: "Keeping Still (Inaction)", center: "Root", circuitGroup: "Collective", channels: [9], awarenessCenter: null },
  { id: 53, name: "Development (Beginnings)", center: "Root", circuitGroup: "Collective", channels: [42], awarenessCenter: null },
  { id: 54, name: "The Marrying Maiden (Ambition)", center: "Root", circuitGroup: "Tribal", channels: [32], awarenessCenter: null },
  { id: 55, name: "Abundance (Spirit)", center: "Solar Plexus", circuitGroup: "Individual", channels: [39], awarenessCenter: "solar_plexus" },
  { id: 56, name: "The Wanderer (Stimulation)", center: "Throat", circuitGroup: "Collective", channels: [11], awarenessCenter: null },
  { id: 57, name: "The Gentle (Intuitive Clarity)", center: "Spleen", circuitGroup: "Integration", channels: [10, 20, 34], awarenessCenter: "spleen" },
  { id: 58, name: "The Joyous (Aliveness)", center: "Root", circuitGroup: "Collective", channels: [18], awarenessCenter: null },
  { id: 59, name: "Dispersion (Sexuality)", center: "Sacral", circuitGroup: "Tribal", channels: [6], awarenessCenter: null },
  { id: 60, name: "Limitation (Acceptance)", center: "Root", circuitGroup: "Individual", channels: [3], awarenessCenter: null },
  { id: 61, name: "Inner Truth (Mystery)", center: "Head", circuitGroup: "Individual", channels: [24], awarenessCenter: null },
  { id: 62, name: "Preponderance of the Small (Detail)", center: "Throat", circuitGroup: "Collective", channels: [17], awarenessCenter: null },
  { id: 63, name: "After Completion (Doubt)", center: "Head", circuitGroup: "Collective", channels: [4], awarenessCenter: null },
  { id: 64, name: "Before Completion (Confusion)", center: "Head", circuitGroup: "Collective", channels: [47], awarenessCenter: null },
];

export const CHANNEL_EDGES: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31],
  [9, 52], [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33],
  [16, 48], [17, 62], [18, 58], [19, 49], [20, 34], [20, 57], [21, 45],
  [23, 43], [24, 61], [25, 51], [26, 44], [27, 50], [28, 38], [29, 46],
  [30, 41], [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53],
  [47, 64]
];

export const CENTER_COLORS: Record<string, string> = {
  "Head": "hsl(262, 83%, 58%)",
  "Ajna": "hsl(245, 75%, 58%)",
  "Throat": "hsl(280, 65%, 55%)",
  "G": "hsl(45, 93%, 47%)",
  "Heart": "hsl(0, 84%, 60%)",
  "Spleen": "hsl(142, 71%, 45%)",
  "Solar Plexus": "hsl(25, 95%, 53%)",
  "Sacral": "hsl(0, 84%, 60%)",
  "Root": "hsl(295, 60%, 52%)",
};

export function calculateFiLMParams(sunGate: number, sunLine: number): FiLMParams {
  const seed = (sunGate * 7 + sunLine * 13) % 97;
  const gamma = 1.0 + ((seed % 11) - 5) / 50.0;
  const beta = ((seed % 7) - 3) / 20.0;
  return { gamma, beta, sunGate, sunLine, seed };
}

export function findBodySun(placements: Placement[]): { gate: number; line: number } | null {
  for (const p of placements) {
    if (p.planet.toLowerCase() === "sun" && p.stream === "body") {
      return { gate: p.gate, line: p.line };
    }
  }
  return null;
}

export function getChannelPairs(): Set<string> {
  const pairs = new Set<string>();
  for (const [a, b] of CHANNEL_EDGES) {
    pairs.add(`${a}-${b}`);
    pairs.add(`${b}-${a}`);
  }
  return pairs;
}
