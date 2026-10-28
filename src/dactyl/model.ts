// Russian fingerspelling (dactyl) models ported from the admit project.
// The main classifier is a 42 -> 96 -> 64 -> 31 MLP over normalized landmark
// coordinates; the "invariant" detectors are 210 -> 64 -> 32 -> 1 MLPs over
// pairwise landmark distances that double-check hard letters (А, И/Й, К, Д, Ш/Щ).
// Everything runs in plain TypeScript, so TensorFlow.js is not needed.

// BASE_URL is '/' locally and '/Gestura/' on GitHub Pages.
const MODEL_BASE = `${import.meta.env?.BASE_URL ?? '/'}models`;

type Tensors = Record<string, Float32Array>;

export interface InvariantDetector {
  mean: Float32Array; scale: Float32Array;
  kernel0: Float32Array; bias0: Float32Array;
  kernel1: Float32Array; bias1: Float32Array;
  kernel2: Float32Array; bias2: Float32Array;
  threshold: number;
}

export interface DactylModel {
  classes: string[];
  mean: Float32Array;
  scale: Float32Array;
  layers: { kernel: Float32Array; bias: Float32Array; inputs: number; units: number }[];
  detectors: Record<'А' | 'Ш' | 'И' | 'К' | 'Д', InvariantDetector>;
}

export interface Classification {
  letter: string;
  score: number;
  aScore: number | null;
  shScore: number | null;
  iScore: number | null;
  kScore: number | null;
  dScore: number | null;
}

interface TensorEntry { name: string; shape: number[]; offset: number; length: number }
interface ModelMeta { format: string; classes: string[]; tensors: TensorEntry[]; threshold?: number }

async function fetchModel(name: string) {
  const [metaResponse, weightsResponse] = await Promise.all([
    fetch(`${MODEL_BASE}/${name}-model.json`), fetch(`${MODEL_BASE}/${name}-weights.bin`),
  ]);
  if (!metaResponse.ok || !weightsResponse.ok) throw new Error('Не удалось загрузить файлы модели');
  const meta: ModelMeta = await metaResponse.json();
  const binary = new Float32Array(await weightsResponse.arrayBuffer());
  const tensors: Tensors = Object.fromEntries(meta.tensors.map((entry) => [
    entry.name, binary.subarray(entry.offset, entry.offset + entry.length),
  ]));
  return { meta, tensors };
}

async function loadDetector(name: string, letter: string): Promise<InvariantDetector> {
  const { meta, tensors } = await fetchModel(`${name}-invariant`);
  if (meta.format !== `rsl-${name}-invariant-distances-mlp-v1` || meta.tensors.length !== 8) {
    throw new Error(`Неизвестный формат модели ${letter}`);
  }
  if (tensors.mean.length !== 210 || tensors.scale.length !== 210 ||
      tensors.kernel0.length !== 210 * 64 || tensors.kernel1.length !== 64 * 32 || tensors.kernel2.length !== 32) {
    throw new Error(`Неверный размер модели ${letter}`);
  }
  const { mean, scale, kernel0, bias0, kernel1, bias1, kernel2, bias2 } = tensors;
  return { mean, scale, kernel0, bias0, kernel1, bias1, kernel2, bias2, threshold: meta.threshold ?? 0.5 };
}

let modelPromise: Promise<DactylModel> | null = null;

export function loadDactylModel(): Promise<DactylModel> {
  modelPromise ??= (async () => {
    const [{ meta, tensors }, a, sh, i, k, d] = await Promise.all([
      fetchModel('alphabet'),
      loadDetector('a', 'А'), loadDetector('sh', 'Ш/Щ'), loadDetector('i', 'И'),
      loadDetector('k', 'К'), loadDetector('d', 'Д'),
    ]);
    if (meta.format !== 'rsl-landmarks-mlp-v1' || meta.tensors.length !== 8 || meta.classes.length !== 31) {
      throw new Error('Неизвестный формат модели');
    }
    return {
      classes: meta.classes,
      mean: tensors.mean,
      scale: tensors.scale,
      layers: [
        { kernel: tensors.kernel0, bias: tensors.bias0, inputs: 42, units: 96 },
        { kernel: tensors.kernel1, bias: tensors.bias1, inputs: 96, units: 64 },
        { kernel: tensors.kernel2, bias: tensors.bias2, inputs: 64, units: 31 },
      ],
      detectors: { 'А': a, 'Ш': sh, 'И': i, 'К': k, 'Д': d },
    };
  })();
  modelPromise.catch(() => { modelPromise = null; });
  return modelPromise;
}

let examplesPromise: Promise<Record<string, number[]>> | null = null;

export function loadExamples(): Promise<Record<string, number[]>> {
  examplesPromise ??= fetch(`${MODEL_BASE}/alphabet-examples.json`).then((response) => {
    if (!response.ok) throw new Error('Образцы не загрузились');
    return response.json();
  });
  examplesPromise.catch(() => { examplesPromise = null; });
  return examplesPromise;
}

// Keras dense layer: kernel is [inputs, units] in row-major order.
function dense(input: Float32Array, kernel: Float32Array, bias: Float32Array, units: number, relu: boolean) {
  const output = new Float32Array(units);
  for (let unit = 0; unit < units; unit++) {
    let value = bias[unit];
    for (let i = 0; i < input.length; i++) value += input[i] * kernel[i * units + unit];
    output[unit] = relu ? Math.max(0, value) : value;
  }
  return output;
}

function softmax(logits: Float32Array) {
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - max));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

export function scoreInvariant(features: ArrayLike<number>, net: InvariantDetector) {
  const distances = new Float32Array(210);
  let pair = 0;
  for (let i = 0; i < 21; i++) {
    for (let j = i + 1; j < 21; j++) {
      const dx = features[i] - features[j];
      const dy = features[i + 21] - features[j + 21];
      distances[pair] = (Math.hypot(dx, dy) - net.mean[pair]) / net.scale[pair];
      pair++;
    }
  }
  const h1 = dense(distances, net.kernel0, net.bias0, 64, true);
  const h2 = dense(h1, net.kernel1, net.bias1, 32, true);
  const logit = dense(h2, net.kernel2, net.bias2, 1, false)[0];
  return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, logit))));
}

// Only the detectors relevant to the current target letter are evaluated.
export function classify(model: DactylModel, features: number[], target?: string): Classification {
  let activations = Float32Array.from(features, (value, i) => (value - model.mean[i]) / model.scale[i]);
  model.layers.forEach((layer, index) => {
    activations = dense(activations, layer.kernel, layer.bias, layer.units, index < model.layers.length - 1);
  });
  const scores = softmax(activations);
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
  const { detectors } = model;
  return {
    letter: model.classes[best],
    score: scores[best],
    aScore: target === 'А' ? scoreInvariant(features, detectors['А']) : null,
    shScore: target === 'Щ' ? scoreInvariant(features, detectors['Ш']) : null,
    iScore: target === 'И' || target === 'Й' ? scoreInvariant(features, detectors['И']) : null,
    kScore: target === 'К' ? scoreInvariant(features, detectors['К']) : null,
    dScore: target === 'Д' ? scoreInvariant(features, detectors['Д']) : null,
  };
}
