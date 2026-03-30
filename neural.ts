/**
 * Neural Network Inference Module
 * Uses ONNX Runtime to run the trained Human Design GNN
 */
import * as ort from 'onnxruntime-node';
import * as path from 'path';
import * as fs from 'fs';
import {
  type Placement,
  GATE_DATA,
  PLANETS,
  CHANNEL_EDGES,
  AWARENESS_SETS,
  HEART_GATES,
  MIND_GATES,
} from '@shared/schema';

const MODEL_PATH = path.join(process.cwd(), 'ml', 'model.onnx');

let session: ort.InferenceSession | null = null;
let modelLoaded = false;

export interface NeuralOutput {
  codons: number[];
  spleen: number;
  ajna: number;
  solarPlexus: number;
  heart: number;
  mind: number;
}

/**
 * Initialize the ONNX Runtime session
 */
export async function initializeModel(): Promise<boolean> {
  if (modelLoaded && session) {
    return true;
  }

  if (!fs.existsSync(MODEL_PATH)) {
    console.log('[Neural] Model not found at', MODEL_PATH);
    return false;
  }

  try {
    console.log('[Neural] Loading ONNX model...');
    session = await ort.InferenceSession.create(MODEL_PATH);
    modelLoaded = true;
    console.log('[Neural] Model loaded successfully');
    return true;
  } catch (error) {
    console.error('[Neural] Failed to load model:', error);
    return false;
  }
}

/**
 * Build node features from placements (matches Python implementation)
 */
function buildNodeFeatures(placements: Placement[]): Float32Array {
  const numPlanets = PLANETS.length;
  const planetToIdx: Record<string, number> = {};
  PLANETS.forEach((p, i) => {
    planetToIdx[p] = i;
  });

  // 64 nodes x 34 features
  const features = new Float32Array(64 * 34);

  // Track activated gates
  const activatedGates = new Set<number>();

  for (const p of placements) {
    const gateIdx = p.gate - 1; // 0-indexed
    const planetIdx = planetToIdx[p.planet] ?? 0;

    activatedGates.add(p.gate);

    if (p.stream === 'body') {
      // Body planet one-hot: dims 0-12
      features[gateIdx * 34 + planetIdx] = 1.0;
    } else {
      // Design planet one-hot: dims 13-25
      features[gateIdx * 34 + numPlanets + planetIdx] = 1.0;
    }

    // Line one-hot: dims 26-31
    const lineIdx = 26 + (p.line - 1);
    features[gateIdx * 34 + lineIdx] = 1.0;

    // Definition flag (defined by placement): dim 32
    features[gateIdx * 34 + 32] = 1.0;
  }

  // Check channel definitions
  for (const [a, b] of CHANNEL_EDGES) {
    if (activatedGates.has(a) && activatedGates.has(b)) {
      // Both ends activated = channel defined
      features[(a - 1) * 34 + 33] = 1.0;
      features[(b - 1) * 34 + 33] = 1.0;
    }
  }

  return features;
}

/**
 * Build sun encoding for FiLM modulation
 */
function buildSunEncoding(sunGate: number, sunLine: number): Float32Array {
  const encoding = new Float32Array(70);
  encoding[sunGate - 1] = 1.0; // Gate one-hot
  encoding[64 + sunLine - 1] = 1.0; // Line one-hot
  return encoding;
}

/**
 * Find body Sun from placements
 */
function findBodySun(placements: Placement[]): { gate: number; line: number } {
  for (const p of placements) {
    if (p.planet === 'Sun' && p.stream === 'body') {
      return { gate: p.gate, line: p.line };
    }
  }
  return { gate: 1, line: 1 };
}

/**
 * Run neural network inference on placements
 */
export async function runInference(placements: Placement[]): Promise<NeuralOutput | null> {
  if (!session) {
    const loaded = await initializeModel();
    if (!loaded || !session) {
      return null;
    }
  }

  try {
    // Build inputs
    const nodeFeatures = buildNodeFeatures(placements);
    const bodySun = findBodySun(placements);
    const sunEncoding = buildSunEncoding(bodySun.gate, bodySun.line);

    // Create tensors
    const nodeFeatTensor = new ort.Tensor('float32', nodeFeatures, [64, 34]);
    const sunEncTensor = new ort.Tensor('float32', sunEncoding, [70]);

    // Run inference
    const results = await session.run({
      node_features: nodeFeatTensor,
      sun_encoding: sunEncTensor,
    });

    // Extract outputs
    const codons = Array.from(results.codons.data as Float32Array);
    const spleen = (results.spleen.data as Float32Array)[0];
    const ajna = (results.ajna.data as Float32Array)[0];
    const solarPlexus = (results.solar_plexus.data as Float32Array)[0];
    const heart = (results.heart.data as Float32Array)[0];
    const mind = (results.mind.data as Float32Array)[0];

    return {
      codons,
      spleen,
      ajna,
      solarPlexus,
      heart,
      mind,
    };
  } catch (error) {
    console.error('[Neural] Inference error:', error);
    return null;
  }
}

/**
 * Check if model is available
 */
export function isModelAvailable(): boolean {
  return fs.existsSync(MODEL_PATH);
}

/**
 * Get model info
 */
export function getModelInfo(): { available: boolean; path: string } {
  return {
    available: fs.existsSync(MODEL_PATH),
    path: MODEL_PATH,
  };
}
