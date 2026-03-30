import { 
  type Placement, 
  type TransitSun, 
  type ChartResponse, 
  type CodonScore, 
  type AwarenessScore,
  type ModulatorScore,
  type AlchemyLayer,
  type TriaPrimaScore,
  type Interaction,
  type ResonanceSentence,
  GATE_DATA,
  AWARENESS_SETS,
  HEART_GATES,
  MIND_GATES,
  CHANNEL_EDGES,
  TRIA_PRIMA,
  OPUS_PHASES,
  calculateFiLMParams,
  findBodySun
} from "@shared/schema";
import { runInference, isModelAvailable, initializeModel } from "./neural";
import { 
  deriveExtendedPlacementFromGate, 
  generateResonanceSentence,
  type ExtendedPlacement,
  type ResonanceSentence
} from "@shared/sentence-engine";

export interface IStorage {
  analyzeChart(placements: Placement[], transitSun?: TransitSun): Promise<ChartResponse>;
}

export class MemStorage implements IStorage {
  private neuralInitialized = false;
  private neuralAvailable = false;

  async analyzeChart(placements: Placement[], transitSun?: TransitSun): Promise<ChartResponse> {
    // Try neural network inference first
    if (!this.neuralInitialized) {
      this.neuralInitialized = true;
      this.neuralAvailable = await initializeModel();
      console.log(`[Storage] Neural network: ${this.neuralAvailable ? 'enabled' : 'using fallback'}`);
    }

    const activatedGates = new Set<number>();
    const gateScores = new Map<number, number>();
    
    let bodySun = findBodySun(placements);
    let bodySunGate = bodySun?.gate || 1;
    let bodySunLine = bodySun?.line || 1;
    
    if (transitSun) {
      bodySunGate = transitSun.gate;
      bodySunLine = transitSun.line;
    }

    // Track placements
    placements.forEach((p) => {
      activatedGates.add(p.gate);
    });
    
    // Find defined channels
    const definedChannels: [number, number][] = [];
    const channelDefinedGates = new Set<number>();
    
    CHANNEL_EDGES.forEach(([from, to]) => {
      if (activatedGates.has(from) && activatedGates.has(to)) {
        definedChannels.push([from, to]);
        channelDefinedGates.add(from);
        channelDefinedGates.add(to);
      }
    });

    // Try neural network inference
    let neuralOutput = null;
    if (this.neuralAvailable) {
      neuralOutput = await runInference(placements);
    }

    if (neuralOutput) {
      // Use neural network outputs
      console.log('[Storage] Using neural network inference');
      
      const codons: CodonScore[] = GATE_DATA.map((gate, i) => ({
        gate: gate.id,
        score: neuralOutput!.codons[i],
        name: gate.name,
        center: gate.center,
        circuitGroup: gate.circuitGroup,
        isActivated: activatedGates.has(gate.id),
        definedByPlacement: activatedGates.has(gate.id),
        definedByChannel: channelDefinedGates.has(gate.id),
      }));

      const filmParams = calculateFiLMParams(bodySunGate, bodySunLine);

      const calculateAwareness = (type: "spleen" | "ajna" | "solar_plexus", neuralScore: number): AwarenessScore => {
        const gateSet = AWARENESS_SETS[type];
        const activated = gateSet.filter((g) => activatedGates.has(g));
        return {
          type,
          score: neuralScore,
          activatedGates: activated,
        };
      };

      const triaPrima = this.calculateTriaPrima(codons);
      const interaction = this.calculateInteraction(triaPrima);
      const opusPhase = this.determineOpusPhase(triaPrima, interaction);

      // Generate resonance sentences for all placements
      const sentences = this.generateSentences(placements);

      return {
        codons,
        awareness: {
          spleen: calculateAwareness("spleen", neuralOutput.spleen),
          ajna: calculateAwareness("ajna", neuralOutput.ajna),
          solar_plexus: calculateAwareness("solar_plexus", neuralOutput.solarPlexus),
        },
        heart: {
          score: neuralOutput.heart,
          baseScore: neuralOutput.heart / (filmParams.gamma || 1),
          filmParams,
          rationale: `Neural network prediction with FiLM modulation via Gate ${bodySunGate}.${bodySunLine}`,
        },
        mind: {
          score: neuralOutput.mind,
          baseScore: neuralOutput.mind / (filmParams.gamma || 1),
          filmParams,
          rationale: `Neural network prediction with FiLM modulation via Gate ${bodySunGate}.${bodySunLine}`,
        },
        definedChannels,
        alchemy: {
          triaPrima,
          opusPhase,
          interaction,
        },
        sentences,
      };
    }

    // Fallback to deterministic calculation
    console.log('[Storage] Using deterministic fallback');
    return this.deterministicAnalysis(placements, transitSun);
  }

  private async deterministicAnalysis(placements: Placement[], transitSun?: TransitSun): Promise<ChartResponse> {
    const activatedGates = new Set<number>();
    const gateScores = new Map<number, number>();
    
    let bodySun = findBodySun(placements);
    let bodySunGate = bodySun?.gate || 1;
    let bodySunLine = bodySun?.line || 1;
    
    placements.forEach((p) => {
      activatedGates.add(p.gate);
      const currentScore = gateScores.get(p.gate) || 0;
      
      let weight = 0.2;
      if (p.planet === "Sun") weight = 0.5;
      else if (p.planet === "Earth") weight = 0.4;
      else if (p.planet === "Moon") weight = 0.35;
      else if (p.planet === "Mercury" || p.planet === "Venus") weight = 0.3;
      
      if (p.stream === "body") weight *= 1.2;
      
      gateScores.set(p.gate, Math.min(1, currentScore + weight));
    });
    
    if (transitSun) {
      bodySunGate = transitSun.gate;
      bodySunLine = transitSun.line;
    }
    
    const definedChannels: [number, number][] = [];
    const channelDefinedGates = new Set<number>();
    
    CHANNEL_EDGES.forEach(([from, to]) => {
      if (activatedGates.has(from) && activatedGates.has(to)) {
        definedChannels.push([from, to]);
        channelDefinedGates.add(from);
        channelDefinedGates.add(to);
        const channelBonus = 0.15;
        gateScores.set(from, Math.min(1, (gateScores.get(from) || 0) + channelBonus));
        gateScores.set(to, Math.min(1, (gateScores.get(to) || 0) + channelBonus));
      }
    });
    
    const codons: CodonScore[] = GATE_DATA.map((gate) => ({
      gate: gate.id,
      score: gateScores.get(gate.id) || 0,
      name: gate.name,
      center: gate.center,
      circuitGroup: gate.circuitGroup,
      isActivated: activatedGates.has(gate.id),
      definedByPlacement: activatedGates.has(gate.id),
      definedByChannel: channelDefinedGates.has(gate.id),
    }));
    
    const calculateAwareness = (type: "spleen" | "ajna" | "solar_plexus"): AwarenessScore => {
      const gateSet = AWARENESS_SETS[type];
      const activated = gateSet.filter((g) => activatedGates.has(g));
      const totalScore = activated.reduce((sum, g) => sum + (gateScores.get(g) || 0), 0);
      const normalizedScore = gateSet.length > 0 ? totalScore / gateSet.length : 0;
      
      return {
        type,
        score: Math.min(1, normalizedScore * 1.5),
        activatedGates: activated,
      };
    };
    
    const filmParams = calculateFiLMParams(bodySunGate, bodySunLine);
    
    const calculateModulator = (gateSet: readonly number[]): ModulatorScore => {
      const activated = gateSet.filter((g) => activatedGates.has(g));
      let baseScore = activated.reduce((sum, g) => sum + (gateScores.get(g) || 0), 0);
      if (gateSet.length > 0) {
        baseScore = baseScore / gateSet.length;
      }
      
      const modulatedScore = Math.min(1, Math.max(0, filmParams.gamma * baseScore + filmParams.beta));
      
      return {
        score: modulatedScore,
        baseScore: baseScore,
        filmParams: filmParams,
        rationale: `FiLM modulation: γ=${filmParams.gamma.toFixed(3)}, β=${filmParams.beta.toFixed(3)} via seed ${filmParams.seed} from Gate ${bodySunGate}.${bodySunLine}`,
      };
    };

    const triaPrima = this.calculateTriaPrima(codons);
    const interaction = this.calculateInteraction(triaPrima);
    const opusPhase = this.determineOpusPhase(triaPrima, interaction);
    
    // Generate resonance sentences for all placements
    const sentences = this.generateSentences(placements);
    
    return {
      codons,
      awareness: {
        spleen: calculateAwareness("spleen"),
        ajna: calculateAwareness("ajna"),
        solar_plexus: calculateAwareness("solar_plexus"),
      },
      heart: calculateModulator(HEART_GATES),
      mind: calculateModulator(MIND_GATES),
      definedChannels,
      alchemy: {
        triaPrima,
        opusPhase,
        interaction,
      },
      sentences,
    };
  }

  private calculateTriaPrima(codons: CodonScore[]): TriaPrimaScore {
    let sulfur = 0, mercury = 0, salt = 0;
    let sulfurCount = 0, mercuryCount = 0, saltCount = 0;
    
    codons.forEach((codon) => {
      if (!codon.isActivated) return;
      
      const score = codon.score;
      
      if ((TRIA_PRIMA.sulfur.centers as readonly string[]).includes(codon.center)) {
        sulfur += score;
        sulfurCount++;
      }
      if ((TRIA_PRIMA.mercury.centers as readonly string[]).includes(codon.center)) {
        mercury += score;
        mercuryCount++;
      }
      if ((TRIA_PRIMA.salt.centers as readonly string[]).includes(codon.center)) {
        salt += score;
        saltCount++;
      }
    });
    
    return {
      sulfur: sulfurCount > 0 ? sulfur / sulfurCount : 0,
      mercury: mercuryCount > 0 ? mercury / mercuryCount : 0,
      salt: saltCount > 0 ? salt / saltCount : 0,
    };
  }

  private calculateInteraction(triaPrima: TriaPrimaScore): Interaction {
    const values = [
      { key: "mind", value: triaPrima.mercury },
      { key: "heart", value: triaPrima.sulfur },
      { key: "body", value: triaPrima.salt },
    ];
    
    values.sort((a, b) => b.value - a.value);
    const leader = values[0].key as "mind" | "heart" | "body";
    
    const mind_heart = Math.abs(triaPrima.mercury - triaPrima.sulfur);
    const heart_body = Math.abs(triaPrima.sulfur - triaPrima.salt);
    const mind_body = Math.abs(triaPrima.mercury - triaPrima.salt);
    
    const avgCoupling = (mind_heart + heart_body + mind_body) / 3;
    
    let outcome: "coherence" | "mediated" | "conflict";
    if (avgCoupling < 0.15) {
      outcome = "coherence";
    } else if (avgCoupling < 0.35) {
      outcome = "mediated";
    } else {
      outcome = "conflict";
    }
    
    const triad = (triaPrima.sulfur + triaPrima.mercury + triaPrima.salt) / 3;
    
    return {
      leader,
      outcome,
      triad,
      couplings: {
        mind_heart,
        heart_body,
        mind_body,
      },
    };
  }

  private determineOpusPhase(triaPrima: TriaPrimaScore, interaction: Interaction): typeof OPUS_PHASES[number] {
    const total = triaPrima.sulfur + triaPrima.mercury + triaPrima.salt;
    
    if (total < 0.5) return "nigredo";
    if (interaction.outcome === "conflict") return "nigredo";
    if (total < 1.2) return "albedo";
    if (total < 2.0) return "citrinitas";
    return "rubedo";
  }

  /**
   * Generate resonance sentences for all chart placements
   * Uses ephemeris-calibrated fractal sublayers: Gate → Line → Color → Tone → Base
   * Respects provided color/tone/base values from ephemeris if available
   */
  private generateSentences(placements: Placement[]): ResonanceSentence[] {
    return placements.map(p => {
      // Map "body" stream to "design" for sentence engine compatibility
      const stream = p.stream === "body" ? "design" : "personality";
      
      // Derive extended placement with all fractal sublayers
      // Use provided color/tone/base if available (from ephemeris data)
      const extendedPlacement = deriveExtendedPlacementFromGate(
        p.planet,
        stream,
        p.gate,
        p.line,
        p.color,  // Optional: use provided value if available
        p.tone,   // Optional: use provided value if available
        p.base    // Optional: use provided value if available
      );
      
      // Generate the full resonance sentence
      return generateResonanceSentence(extendedPlacement);
    });
  }
}

export const storage = new MemStorage();
