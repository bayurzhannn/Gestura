// Lesson logic for the Russian fingerspelling trainer, ported from admit/app.js.
import type { Classification, DactylModel } from './model';
import type { ConfidenceId, FeedbackId } from '../i18n';

export interface Point { x: number; y: number; z?: number }

export const alphabet = [...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'];
const images = 'a b v g d e e zh z i j k l m n o p r s t u f h ts ch sh shch tvjordyj-znak y myagkij-znak ee yu ya'.split(' ');
export const referenceImage = (letter: string) =>
  `${import.meta.env.BASE_URL}references/alphabet/${images[alphabet.indexOf(letter)]}.png`;


export const motionLetters = new Set(['Д', 'Ё', 'Й', 'К', 'Щ', 'Ъ', 'Ь']);
export const movementSymbols: Record<string, string> = {
  'Д': '◌', 'Ё': '↔', 'Й': '↶', 'К': '↓', 'Щ': '↓', 'Ъ': '•', 'Ь': '•',
};

const baseClass = (letter: string) =>
  letter === 'Й' ? 'И' : 'ШЩ'.includes(letter) ? 'Ш/Щ' : 'ЪЬ'.includes(letter) ? 'Ъ/Ь' : letter;

// ---------- Skeleton features ----------

const fingerColors: Record<string, string> = {
  palm: '#ff3030', thumb: '#ffe5b4', index: '#804080',
  middle: '#ffcc00', ring: '#30ff30', pinky: '#1565c0',
};
const edges: [number, number, string][] = [
  [0,1,'palm'],[0,5,'palm'],[0,9,'palm'],[0,13,'palm'],[0,17,'palm'],
  [5,9,'palm'],[9,13,'palm'],[13,17,'palm'],
  [1,2,'thumb'],[2,3,'thumb'],[3,4,'thumb'],
  [5,6,'index'],[6,7,'index'],[7,8,'index'],
  [9,10,'middle'],[10,11,'middle'],[11,12,'middle'],
  [13,14,'ring'],[14,15,'ring'],[15,16,'ring'],
  [17,18,'pinky'],[18,19,'pinky'],[19,20,'pinky'],
];
const dotType = (index: number) => [0,1,5,9,13,17].includes(index) ? 'palm' :
  index <= 4 ? 'thumb' : index <= 8 ? 'index' : index <= 12 ? 'middle' :
  index <= 16 ? 'ring' : 'pinky';

/** Fits the hand into a 192px square and returns x0..x20,y0..y20 in 0..1, as the model expects. */
export function landmarkFeatures(landmarks: Point[], aspectRatio: number): number[] | null {
  const x = landmarks.map((point) => point.x * aspectRatio);
  const y = landmarks.map((point) => point.y);
  const minX = Math.min(...x), minY = Math.min(...y);
  const size = Math.max(Math.max(...x) - minX, Math.max(...y) - minY);
  if (size < 0.02) return null;
  const xs = x.map((value) => (10 + (value - minX) * 172 / size) / 192);
  const ys = y.map((value) => (10 + (value - minY) * 172 / size) / 192);
  return [...xs, ...ys];
}

export function drawSkeleton(ctx: CanvasRenderingContext2D, features: number[] | null) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  if (!features) return;
  const points = Array.from({ length: 21 }, (_, i) => ({ x: features[i] * width, y: features[i + 21] * height }));
  ctx.lineCap = 'round';
  for (const [a, b, type] of edges) {
    ctx.strokeStyle = type === 'palm' ? '#808080' : fingerColors[type];
    ctx.lineWidth = type === 'palm' ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(points[a].x, points[a].y);
    ctx.lineTo(points[b].x, points[b].y);
    ctx.stroke();
  }
  points.forEach((point, i) => {
    ctx.fillStyle = fingerColors[dotType(i)];
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------- Finger angles ----------

const fingerJoints = [6, 10, 14, 18];

function jointAngle(points: Point[], joint: number, aspectRatio: number) {
  const center = points[joint], prev = points[joint - 1], next = points[joint + 1];
  const a = [(prev.x - center.x) * aspectRatio, prev.y - center.y];
  const b = [(next.x - center.x) * aspectRatio, next.y - center.y];
  const length = Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]);
  if (length < 1e-6) return null;
  return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / length))) * 180 / Math.PI;
}

function measuredFingerAngles(points: Point[] | null, aspectRatio: number) {
  if (!points || points.length < 21) return null;
  const angles = fingerJoints.map((joint) => jointAngle(points, joint, aspectRatio));
  if (angles.some((angle) => angle === null || !Number.isFinite(angle))) return null;
  return angles as number[];
}

// ---------- Motion tracking ----------

interface MotionSample {
  time: number; y: number; span: number; tipX: number; tipY: number;
  twist: number; roll: number; fingerDepth: number; upperFingersDrop: number;
}

function turnedAndReturned(values: number[], amount: number) {
  const start = values[0], end = values[values.length - 1];
  return values.slice(1, -1).some((middle) =>
    (middle - start > amount && middle - end > amount) ||
    (start - middle > amount && end - middle > amount));
}

function drewCircle(history: MotionSample[]) {
  for (let start = 0; start <= history.length - 7; start++) {
    const path = history.slice(start);
    const xs = path.map((point) => point.tipX);
    const ys = path.map((point) => point.tipY);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const minSize = Math.max(0.035, path[0].span * 0.2);
    if (width < minSize || height < minSize) continue;
    const centerX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const centerY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    let turn = 0;
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const previous = Math.atan2(ys[i - 1] - centerY, xs[i - 1] - centerX);
      const current = Math.atan2(ys[i] - centerY, xs[i] - centerX);
      turn += Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
      length += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    }
    const closed = Math.hypot(xs[0] - xs[xs.length - 1], ys[0] - ys[ys.length - 1]) < Math.max(width, height) * 0.75;
    if (Math.abs(turn) > 4.4 && length > minSize * 3 && closed) return true;
  }
  return false;
}

// ---------- Lesson engine ----------

// Messages are ids rendered by the UI in the selected language (see i18n.ts).
export interface Feedback { id: FeedbackId; icon: string; letter?: string; detail?: string }
export interface Confidence { id: ConfidenceId; letter?: string; percent?: number }

export interface Verdict {
  prediction: string;
  meter: number; // 0..100
  confidence: Confidence;
  feedback: Feedback;
  completed: boolean;
}

/**
 * Tracks steadiness and motion for the current target letter.
 * Call `evaluate` once per camera frame (or once for a photo / sample).
 */
export class LessonEngine {
  private steadyFrames = 0;
  private lastAdvance = 0;
  private motionHistory: MotionSample[] = [];
  private motionShapeFrames = 0;
  private motionReadyFrames = 0;
  private motionArmedAt = 0;

  reset() {
    this.steadyFrames = 0;
    this.resetMotion();
  }

  resetMotion() {
    this.motionHistory = [];
    this.motionShapeFrames = 0;
    this.motionReadyFrames = 0;
    this.motionArmedAt = 0;
  }

  private recordMotion(landmarks: Point[], aspectRatio: number, now = Date.now()) {
    const palmSpan = Math.hypot((landmarks[5].x - landmarks[17].x) * aspectRatio, landmarks[5].y - landmarks[17].y);
    if (palmSpan < 0.01) return;
    const palmY = [5, 9, 13, 17].reduce((sum, index) => sum + landmarks[index].y, 0) / 4;
    const tipX = (landmarks[8].x + landmarks[12].x) * aspectRatio / 2;
    const tipY = (landmarks[8].y + landmarks[12].y) / 2;
    const upperFingersDrop = (tipY - palmY) / palmSpan;
    const roll = Math.atan2(landmarks[9].y - landmarks[0].y, (landmarks[9].x - landmarks[0].x) * aspectRatio);
    const twist = ((landmarks[5].z ?? 0) - (landmarks[17].z ?? 0)) * aspectRatio / palmSpan;
    // Relative fingertip depth ignores movement of the whole hand toward the camera.
    const fingerDepth = ((landmarks[8].z ?? 0) - (landmarks[5].z ?? 0)) * aspectRatio / palmSpan;
    this.motionHistory.push({ time: now, y: palmY, span: palmSpan, tipX, tipY, twist, roll, fingerDepth, upperFingersDrop });
    this.motionHistory = this.motionHistory.filter((item) => now - item.time <= 1800);
  }

  private movementDetected(letter: string) {
    const history = this.motionHistory;
    if (history.length < 3) return false;
    const first = history[0], last = history[history.length - 1];
    if (last.time - first.time < 250) return false;
    const rollDelta = (item: MotionSample) => Math.atan2(Math.sin(item.roll - first.roll), Math.cos(item.roll - first.roll));
    if (letter === 'Д') return drewCircle(history);
    if (letter === 'Ё') {
      return turnedAndReturned(history.map((item) => item.twist), 0.11) ||
        turnedAndReturned(history.map(rollDelta), 0.18);
    }
    if (letter === 'Й') {
      const rollChange = Math.max(...history.map((item) => Math.abs(rollDelta(item))));
      const twistChange = Math.max(...history.map((item) => Math.abs(item.twist - first.twist)));
      return rollChange > 0.28 || twistChange > 0.15;
    }
    if (letter === 'К') {
      const handDrop = last.y - first.y > Math.max(0.03, first.span * 0.22);
      const fingerDrop = last.upperFingersDrop - first.upperFingersDrop > 0.22;
      return handDrop || fingerDrop;
    }
    if (letter === 'Щ') return last.y - first.y > Math.max(0.035, first.span * 0.3);
    if (letter === 'Ъ') return last.fingerDepth - first.fingerDepth > 0.075;
    if (letter === 'Ь') return first.fingerDepth - last.fingerDepth > 0.075;
    return false;
  }

  private complete() {
    this.lastAdvance = Date.now();
    this.steadyFrames = 0;
    this.resetMotion();
  }

  evaluate(model: DactylModel, target: string, result: Classification, fromCamera: boolean,
           landmarks: Point[] | null = null, aspectRatio = 1): Verdict {
    const { detectors } = model;
    const say = (id: FeedbackId, icon: string): Feedback => ({ id, icon, letter: target });
    const angles = measuredFingerAngles(landmarks, aspectRatio);
    const invariantA = target === 'А' && result.aScore !== null &&
      result.aScore >= detectors['А'].threshold && (!angles || angles.every((angle) => angle <= 145));
    const isI = target === 'И' || target === 'Й';
    const invariantI = isI && result.iScore != null && result.iScore >= detectors['И'].threshold;
    const invariantK = target === 'К' && result.kScore != null && result.kScore >= detectors['К'].threshold;
    const invariantD = target === 'Д' && result.dScore != null && result.dScore >= detectors['Д'].threshold;
    const dBaseShape = target === 'Д' && (result.letter === 'Д' || result.letter === 'Ц') && result.score >= 0.6;
    const percent = Math.round(result.score * 100);

    let prediction = invariantA ? 'А' : isI ? invariantI ? 'И' : '—' :
      target === 'К' ? invariantK ? 'К' : '—' : target === 'Д' ? invariantD || dBaseShape ? 'Д' : '—' : result.letter;
    let meter = invariantA || invariantI || invariantK || invariantD ? 100 :
      dBaseShape ? percent : isI || target === 'К' || target === 'Д' ? 0 : percent;
    let confidence: Confidence = invariantA ? { id: 'extraCheck', letter: 'А' } :
      invariantI ? { id: 'extraCheck', letter: 'И' } :
      invariantK ? { id: 'extraCheck', letter: 'К' } :
      invariantD ? { id: 'extraCheck', letter: 'Д' } :
      dBaseShape ? { id: 'dNeedsCircle' } :
      isI ? { id: 'notConfirmedYet', letter: 'И' } :
      target === 'К' || target === 'Д' ? { id: 'notConfirmedYet', letter: target } :
      { id: 'modelScore', percent };
    const verdict = (feedback: Feedback, completed = false): Verdict =>
      ({ prediction, meter, confidence, feedback, completed });

    const matchingShape = result.letter === baseClass(target);
    // Finger angles are useful advice, but webcam landmarks are noisy. Do not
    // veto a strong matching prediction because one 2-D joint angle disagrees.
    const clearShape = target === 'А' ? invariantA : target === 'И' ? invariantI : matchingShape && result.score >= 0.7;

    if (motionLetters.has(target)) {
      const invariantSh = target === 'Щ' && result.shScore != null && result.shScore >= detectors['Ш'].threshold;
      const shapeSeen = target === 'Й' ? invariantI : target === 'К' ? invariantK : target === 'Д' ? invariantD || dBaseShape :
        (matchingShape && result.score >= 0.45) || invariantSh;
      this.steadyFrames = 0;
      if (invariantSh) {
        prediction = 'Ш/Щ';
        confidence = { id: 'shExtraCheck' };
        meter = 100;
      }
      if (!fromCamera || !landmarks) {
        this.resetMotion();
        return verdict(say(shapeSeen ? 'shapeOkNeedMotion' : 'shapeNotConfirmed', '↔'));
      }
      if (!this.motionArmedAt) {
        this.motionShapeFrames = shapeSeen ? Math.min(this.motionShapeFrames + 1, 3) : Math.max(0, this.motionShapeFrames - 1);
        if (this.motionShapeFrames < 2) return verdict(say('showShapeFirst', '↻'));
        this.motionArmedAt = Date.now();
        this.motionHistory = [];
        this.recordMotion(landmarks, aspectRatio);
        return verdict(say('shapeFoundAddMotion', '↔'));
      }
      if (Date.now() - this.motionArmedAt > 5000) {
        this.resetMotion();
        return verdict(say('showShapeAgain', '↻'));
      }
      this.recordMotion(landmarks, aspectRatio);
      prediction = target;
      confidence = { id: 'checkingMotion' };
      meter = 60;
      this.motionReadyFrames = this.movementDetected(target) ? this.motionReadyFrames + 1 : 0;
      if (this.motionReadyFrames >= 2 && Date.now() - this.lastAdvance > 700) {
        this.complete();
        return verdict(say('seeLetterMotion', '✓'), true);
      }
      return verdict(say(this.motionReadyFrames ? 'motionNoticed' : 'shapeFoundAddMotion', '↔'));
    }

    if (clearShape) {
      this.steadyFrames++;
      const feedback = say(fromCamera ? 'seeLetterHold' : 'seeLetterSample', '✓');
      if (!fromCamera || (this.steadyFrames >= 5 && Date.now() - this.lastAdvance > 1000)) {
        this.complete();
        return verdict(feedback, true);
      }
      return verdict(feedback);
    }
    this.steadyFrames = 0;
    return verdict(say('notConfirmed', '↻'));
  }
}
