import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Keep the WASM runtime in step with the installed @mediapipe/tasks-vision package.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;
const cache = new Map<string, Promise<HandLandmarker>>();

export function getHandLandmarker(runningMode: 'VIDEO' | 'IMAGE', numHands: number): Promise<HandLandmarker> {
  const key = `${runningMode}:${numHands}`;
  let landmarker = cache.get(key);
  if (!landmarker) {
    visionPromise ??= FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = visionPromise.then((vision) => HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode,
      numHands,
      minHandDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }));
    landmarker.catch(() => { cache.delete(key); visionPromise = null; });
    cache.set(key, landmarker);
  }
  return landmarker;
}
