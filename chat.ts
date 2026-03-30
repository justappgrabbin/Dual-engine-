import type { ChartResponse, CodonScore, AwarenessScore } from "@shared/schema";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GATE_INSIGHTS: Record<number, string> = {
  1: "Gate 1 represents creative self-expression and individuality. It's about bringing forth your unique creative vision.",
  2: "Gate 2 is the Driver, connected to receptivity and direction. It helps you know which way to go.",
  3: "Gate 3 brings innovation through mutation. You process difficulty to create new beginnings.",
  4: "Gate 4 is mental formulization - you seek logical answers to life's questions.",
  5: "Gate 5 establishes fixed patterns and rhythms. Consistency and timing are your gifts.",
  6: "Gate 6 manages emotional intimacy and friction. You navigate the waters of closeness.",
  7: "Gate 7 represents democratic leadership. You guide others through example.",
  8: "Gate 8 is about contribution - making a unique mark through your individual expression.",
  9: "Gate 9 brings focus and determination. You have the power to concentrate on details.",
  10: "Gate 10 governs self-behavior and love of self. Authenticity is your path.",
  11: "Gate 11 holds ideas and possibilities. Your mind is fertile ground for concepts.",
  12: "Gate 12 brings caution in expression. You articulate with social awareness.",
  13: "Gate 13 is the Listener - you collect and share human stories and experiences.",
  14: "Gate 14 holds power skills and resources. You can direct energy toward material success.",
  15: "Gate 15 brings rhythm extremes - your flow moves between stillness and activity.",
  16: "Gate 16 represents mastery through repetition. Skills develop through practice.",
  17: "Gate 17 forms opinions and follows patterns. You organize ideas logically.",
  18: "Gate 18 seeks correction and improvement. You see what needs fixing.",
  19: "Gate 19 is about wanting and needing. You sense what resources are required.",
  20: "Gate 20 is the Now - presence and immediate action. You express in the moment.",
  21: "Gate 21 is the Hunter - control and willpower in action.",
  22: "Gate 22 brings emotional openness and grace. You share feelings through charm.",
  23: "Gate 23 splits apart and assimilates. You translate complexity into simplicity.",
  24: "Gate 24 rationalizes and returns to thoughts. Mental processing cycles deeply.",
  25: "Gate 25 carries innocence and universal love. Spirit moves through you.",
  26: "Gate 26 is the Egoist - persuasion and salesmanship serve the tribe.",
  27: "Gate 27 nurtures and cares. You provide sustenance to others.",
  28: "Gate 28 is the Game Player - you struggle with life's big questions.",
  29: "Gate 29 commits and perseveres. You say yes and follow through.",
  30: "Gate 30 holds feelings and desires. Emotional depth fuels your experiences.",
  31: "Gate 31 represents democratic leadership through influence.",
  32: "Gate 32 brings continuity and duration. You preserve what has lasting value.",
  33: "Gate 33 retreats to process. Privacy helps you integrate experience.",
  34: "Gate 34 holds pure power and energy for action.",
  35: "Gate 35 seeks progress through change and new experiences.",
  36: "Gate 36 processes crisis and emotional depth. You transform through feeling.",
  37: "Gate 37 creates friendship and family bonds through emotional connection.",
  38: "Gate 38 is the Fighter - you struggle for individual purpose.",
  39: "Gate 39 provokes emotional response. You catalyze feelings in others.",
  40: "Gate 40 needs aloneness to recover. Solitude restores your will.",
  41: "Gate 41 contracts and fantasizes. New experiences begin in imagination.",
  42: "Gate 42 brings growth to completion. You see things through to the end.",
  43: "Gate 43 holds breakthrough insight. Your inner knowing emerges suddenly.",
  44: "Gate 44 senses patterns from the past. You recognize what has worked before.",
  45: "Gate 45 gathers and rules. You bring people together around resources.",
  46: "Gate 46 loves the body. Physical experience is your teacher.",
  47: "Gate 47 realizes through oppression. Mental pressure creates understanding.",
  48: "Gate 48 holds depth and fear of inadequacy. Mastery comes through practice.",
  49: "Gate 49 brings revolution through principles. You transform through rejection.",
  50: "Gate 50 holds values and responsibility. You establish what matters.",
  51: "Gate 51 shocks and initiates. You wake others through sudden action.",
  52: "Gate 52 is stillness and focus. Concentration is your gift.",
  53: "Gate 53 begins new cycles. Starting energy moves through you.",
  54: "Gate 54 drives ambition. You rise through determination.",
  55: "Gate 55 carries spirit and melancholy. Emotional waves bring abundance.",
  56: "Gate 56 stimulates through storytelling. You share experiences vividly.",
  57: "Gate 57 holds intuitive clarity. You sense what's right in the moment.",
  58: "Gate 58 brings joyful vitality. Aliveness corrects through delight.",
  59: "Gate 59 breaks down barriers to intimacy. You dissolve resistance.",
  60: "Gate 60 accepts limitation. Constraints become your creative container.",
  61: "Gate 61 holds inner truth and mystery. You seek to know the unknowable.",
  62: "Gate 62 expresses detail. You name and organize precisely.",
  63: "Gate 63 holds doubt. Logical questioning drives understanding.",
  64: "Gate 64 holds confusion before completion. You imagine possible futures.",
};

const AWARENESS_DESCRIPTIONS = {
  spleen: {
    name: "Splenic Awareness",
    description: "Your instinctive, survival-based awareness. Connected to fear, health, and intuitive knowing in the moment.",
    high: "Strong intuitive sensing. Trust your gut reactions - they're operating well.",
    medium: "Moderate intuitive capacity. Pay attention to subtle body signals.",
    low: "Intuition may be quieter. Create space to listen to body wisdom.",
  },
  ajna: {
    name: "Mental Awareness",
    description: "Your conceptual processing center. How you think, analyze, and form opinions.",
    high: "Active mental processing. Your ideas and concepts are flowing strongly.",
    medium: "Balanced mental activity. Good capacity for analysis without overwhelm.",
    low: "Mental center is quieter. This can mean openness to others' ideas.",
  },
  solar_plexus: {
    name: "Emotional Awareness",
    description: "Your emotional wave and depth. Connected to feeling, passion, and emotional truth.",
    high: "Strong emotional energy. Allow your wave to move - clarity comes with time.",
    medium: "Moderate emotional depth. You navigate feelings with some consistency.",
    low: "Emotional center is more open. You sense and amplify others' emotions.",
  },
};

function getTopActivatedGates(codons: CodonScore[], limit = 5): CodonScore[] {
  return codons
    .filter(c => c.isActivated)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function generateGateResponse(gate: number, codon: CodonScore | undefined): string {
  const insight = GATE_INSIGHTS[gate] || `Gate ${gate} is part of the 64-gate system.`;
  if (codon?.isActivated) {
    return `${insight}\n\nIn your chart, Gate ${gate} is activated with a score of ${(codon.score * 100).toFixed(0)}%. This gate is in your ${codon.center} center and belongs to the ${codon.circuitGroup} circuit.`;
  }
  return insight;
}

function generateAwarenessResponse(awareness: AwarenessScore): string {
  const desc = AWARENESS_DESCRIPTIONS[awareness.type];
  let level = "low";
  if (awareness.score > 0.6) level = "high";
  else if (awareness.score > 0.3) level = "medium";
  
  let response = `**${desc.name}** (Score: ${(awareness.score * 100).toFixed(0)}%)\n\n${desc.description}\n\n`;
  response += desc[level as "high" | "medium" | "low"];
  
  if (awareness.activatedGates.length > 0) {
    response += `\n\nActivated gates in this center: ${awareness.activatedGates.join(", ")}`;
  }
  
  return response;
}

function generateOverviewResponse(chart: ChartResponse): string {
  const activatedCount = chart.codons.filter(c => c.isActivated).length;
  const topGates = getTopActivatedGates(chart.codons, 3);
  
  let response = `**Your Chart Overview**\n\n`;
  response += `You have ${activatedCount} activated gates out of 64, with ${chart.definedChannels.length} defined channels.\n\n`;
  
  response += `**Top Activated Gates:**\n`;
  topGates.forEach(g => {
    response += `- Gate ${g.gate} (${g.name}): ${(g.score * 100).toFixed(0)}%\n`;
  });
  
  response += `\n**Awareness Centers:**\n`;
  response += `- Splenic: ${(chart.awareness.spleen.score * 100).toFixed(0)}%\n`;
  response += `- Mental: ${(chart.awareness.ajna.score * 100).toFixed(0)}%\n`;
  response += `- Emotional: ${(chart.awareness.solar_plexus.score * 100).toFixed(0)}%\n`;
  
  response += `\n**Heart/Mind Modulation:**\n`;
  response += `Heart score: ${(chart.heart.score * 100).toFixed(0)}% | Mind score: ${(chart.mind.score * 100).toFixed(0)}%\n`;
  response += `FiLM modulation via Gate ${chart.heart.filmParams.sunGate}.${chart.heart.filmParams.sunLine}`;
  
  return response;
}

function generateAlchemyResponse(chart: ChartResponse): string {
  const { triaPrima, opusPhase, interaction } = chart.alchemy;
  
  let response = `**Alchemical Analysis**\n\n`;
  response += `Your chart is in the **${opusPhase.charAt(0).toUpperCase() + opusPhase.slice(1)}** phase of the alchemical opus.\n\n`;
  
  response += `**Tria Prima Scores:**\n`;
  response += `- Sulfur (Spirit/Will): ${(triaPrima.sulfur * 100).toFixed(0)}%\n`;
  response += `- Mercury (Mind): ${(triaPrima.mercury * 100).toFixed(0)}%\n`;
  response += `- Salt (Body): ${(triaPrima.salt * 100).toFixed(0)}%\n\n`;
  
  response += `**Interaction:** ${interaction.leader.charAt(0).toUpperCase() + interaction.leader.slice(1)} leads with ${interaction.outcome} outcome.\n`;
  response += `Triad balance: ${(interaction.triad * 100).toFixed(0)}%`;
  
  return response;
}

export function processChat(userMessage: string, chart: ChartResponse | null): string {
  if (!chart) {
    return "I don't have your chart data yet. Please analyze your chart first by entering your placements, then we can discuss it!";
  }
  
  const msg = userMessage.toLowerCase();
  
  // Check for gate-specific questions
  const gateMatch = msg.match(/gate\s*(\d+)/);
  if (gateMatch) {
    const gateNum = parseInt(gateMatch[1]);
    if (gateNum >= 1 && gateNum <= 64) {
      const codon = chart.codons.find(c => c.gate === gateNum);
      return generateGateResponse(gateNum, codon);
    }
  }
  
  // Check for awareness questions
  if (msg.includes("spleen") || msg.includes("intuition") || msg.includes("instinct")) {
    return generateAwarenessResponse(chart.awareness.spleen);
  }
  if (msg.includes("ajna") || msg.includes("mental") || msg.includes("mind") || msg.includes("think")) {
    return generateAwarenessResponse(chart.awareness.ajna);
  }
  if (msg.includes("solar plexus") || msg.includes("emotional") || msg.includes("feeling")) {
    return generateAwarenessResponse(chart.awareness.solar_plexus);
  }
  if (msg.includes("awareness")) {
    return `**Your Awareness Centers**\n\n${generateAwarenessResponse(chart.awareness.spleen)}\n\n---\n\n${generateAwarenessResponse(chart.awareness.ajna)}\n\n---\n\n${generateAwarenessResponse(chart.awareness.solar_plexus)}`;
  }
  
  // Alchemy questions
  if (msg.includes("alchemy") || msg.includes("tria prima") || msg.includes("opus") || msg.includes("sulfur") || msg.includes("mercury") || msg.includes("salt")) {
    return generateAlchemyResponse(chart);
  }
  
  // Heart/Mind questions
  if (msg.includes("heart") && msg.includes("mind")) {
    return `**Heart & Mind Modulators**\n\nHeart Score: ${(chart.heart.score * 100).toFixed(0)}% (base: ${(chart.heart.baseScore * 100).toFixed(0)}%)\nMind Score: ${(chart.mind.score * 100).toFixed(0)}% (base: ${(chart.mind.baseScore * 100).toFixed(0)}%)\n\n${chart.heart.rationale}`;
  }
  if (msg.includes("heart")) {
    return `**Heart Modulator**\n\nScore: ${(chart.heart.score * 100).toFixed(0)}%\n\n${chart.heart.rationale}`;
  }
  if (msg.includes("film") || msg.includes("modulation")) {
    return `**FiLM Modulation**\n\nYour chart uses Feature-wise Linear Modulation based on your Body Sun position.\n\nGate ${chart.heart.filmParams.sunGate}.${chart.heart.filmParams.sunLine}\nγ (gamma): ${chart.heart.filmParams.gamma.toFixed(3)}\nβ (beta): ${chart.heart.filmParams.beta.toFixed(3)}\nSeed: ${chart.heart.filmParams.seed}`;
  }
  
  // Channel questions
  if (msg.includes("channel")) {
    if (chart.definedChannels.length === 0) {
      return "Your chart doesn't have any fully defined channels. Channels form when both gates on opposite ends are activated, creating a fixed energy flow between two centers.";
    }
    return `**Defined Channels**\n\nYou have ${chart.definedChannels.length} defined channel(s):\n${chart.definedChannels.map(([a, b]) => `- Gate ${a} ↔ Gate ${b}`).join("\n")}\n\nDefined channels create consistent energy flow between centers.`;
  }
  
  // Overview/general questions
  if (msg.includes("overview") || msg.includes("summary") || msg.includes("chart") || msg.includes("tell me about") || msg.includes("what") || msg.includes("explain")) {
    return generateOverviewResponse(chart);
  }
  
  // Strongest/top gates
  if (msg.includes("strong") || msg.includes("top") || msg.includes("highest") || msg.includes("best")) {
    const topGates = getTopActivatedGates(chart.codons, 5);
    let response = `**Your Strongest Gates**\n\n`;
    topGates.forEach((g, i) => {
      response += `${i + 1}. Gate ${g.gate} - ${g.name} (${(g.score * 100).toFixed(0)}%)\n   Center: ${g.center} | Circuit: ${g.circuitGroup}\n\n`;
    });
    return response;
  }
  
  // Help
  if (msg.includes("help") || msg.includes("what can")) {
    return `**I can help you understand your Human Design chart!**\n\nTry asking about:\n- "Tell me about my chart" - Overview\n- "Gate 13" - Specific gate info\n- "My strongest gates" - Top activated gates\n- "Splenic awareness" - Awareness centers\n- "Alchemy analysis" - Tria Prima & Opus phase\n- "Heart and mind" - Modulator scores\n- "My channels" - Defined channels\n- "FiLM modulation" - Neural network modulation`;
  }
  
  // Default response
  return `I can discuss your Human Design chart! Ask me about specific gates (e.g., "Gate 13"), your awareness centers, channels, or say "overview" for a summary. Type "help" for more options.`;
}
