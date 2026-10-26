import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker } from '@mediapipe/tasks-vision';
import { GoogleGenAI } from '@google/genai';
import { getHandLandmarker } from './landmarker';
import AlphabetTrainer from './dactyl/AlphabetTrainer';
import {
  gestureHowTo, gestureWords, languageNames, languages, oneHandGestures, SettingsContext, twoHandGestures, ui, useSettings,
  type GestureId, type Lang, type Settings,
} from './i18n';
import { speak, stopSpeaking } from './speech';

// Created lazily so the app (and the alphabet trainer) still works without a Gemini key.
let ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

const getDistance = (p1: any, p2: any) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
};

const detectGesture = (landmarks: any[]) => {
  const wrist = landmarks[0];
  const palmSize = getDistance(wrist, landmarks[9]); // Distance from wrist to middle finger MCP

  // Helper to check if a finger is explicitly extended
  const isFingerExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];
    const isStraight = getDistance(tip, mcp) > palmSize * 0.7;
    const isOutward = getDistance(tip, wrist) > getDistance(pip, wrist);
    return isStraight && isOutward;
  };

  // Helper to check if a finger is explicitly curled
  const isFingerCurled = (tipIdx: number, mcpIdx: number) => {
    return getDistance(landmarks[tipIdx], landmarks[mcpIdx]) < palmSize * 0.6;
  };

  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  // Thumb extension: tip is further from pinky base than IP is, and tip is far from index base
  const thumbExtended = getDistance(thumbTip, pinkyMcp) > getDistance(thumbIp, pinkyMcp) + palmSize * 0.1 &&
                        getDistance(thumbTip, indexMcp) > palmSize * 0.6;
  
  const thumbCurled = getDistance(thumbTip, indexMcp) < palmSize * 0.5;

  const indexExt = isFingerExtended(8, 6, 5);
  const middleExt = isFingerExtended(12, 10, 9);
  const ringExt = isFingerExtended(16, 14, 13);
  const pinkyExt = isFingerExtended(20, 18, 17);

  const indexCurled = isFingerCurled(8, 5);
  const middleCurled = isFingerCurled(12, 9);
  const ringCurled = isFingerCurled(16, 13);
  const pinkyCurled = isFingerCurled(20, 17);

  const thumbIndexDist = getDistance(thumbTip, landmarks[8]);

  // OK Sign: Thumb and Index tips touching, others extended
  if (thumbIndexDist < palmSize * 0.3 && middleExt && ringExt && pinkyExt) return "OK";

  // Good (Thumbs Up): Thumb extended, ALL others strictly curled
  if (thumbExtended && indexCurled && middleCurled && ringCurled && pinkyCurled) return "Good";

  // Fist: ALL fingers curled
  if (thumbCurled && indexCurled && middleCurled && ringCurled && pinkyCurled) return "Fist";

  // Hello (Open Palm): All fingers extended
  if (thumbExtended && indexExt && middleExt && ringExt && pinkyExt) return "Hello";

  // One: Only index extended
  if (!thumbExtended && indexExt && middleCurled && ringCurled && pinkyCurled) return "One";

  // Peace / Two: Index and middle extended, others curled
  if (!thumbExtended && indexExt && middleExt && ringCurled && pinkyCurled) return "Peace";

  // Three: Index, middle, ring extended
  if (!thumbExtended && indexExt && middleExt && ringExt && pinkyCurled) return "Three";

  // Four: Index, middle, ring, pinky extended, thumb curled
  if (!thumbExtended && indexExt && middleExt && ringExt && pinkyExt) return "Four";

  // Rock: Index and pinky extended, middle and ring curled
  if (!thumbExtended && indexExt && middleCurled && ringCurled && pinkyExt) return "Rock";

  // Call (Shaka): Thumb and pinky extended, others curled
  if (thumbExtended && indexCurled && middleCurled && ringCurled && pinkyExt) return "Call";

  // Love (ILY): Thumb, index, pinky extended, middle and ring curled
  if (thumbExtended && indexExt && middleCurled && ringCurled && pinkyExt) return "Love";

  // Gun: Thumb and index extended, others curled
  if (thumbExtended && indexExt && middleCurled && ringCurled && pinkyCurled) return "Gun";

  return null;
};

// Cross-hand distances ignore z: MediaPipe depth is relative to each hand's own wrist.
const getDistance2d = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

const detectTwoHandedGesture = (landmarks1: any[], landmarks2: any[]): GestureId | null => {
  const palmSize1 = getDistance(landmarks1[0], landmarks1[9]);
  const palmSize2 = getDistance(landmarks2[0], landmarks2[9]);
  const avgPalmSize = (palmSize1 + palmSize2) / 2;
  const tipsTouch = (index: number) => getDistance2d(landmarks1[index], landmarks2[index]) < avgPalmSize * 0.5;
  const wristGap = getDistance2d(landmarks1[0], landmarks2[0]) / avgPalmSize;

  // Thanks: palms pressed together, so fingertips and wrists are all close.
  if (tipsTouch(8) && tipsTouch(12) && tipsTouch(16) && wristGap < 1.0) return 'Thanks';

  // Home: fingertips meet above while wrists stay apart, like a roof.
  const tipsAboveWrists = landmarks1[12].y < landmarks1[0].y && landmarks2[12].y < landmarks2[0].y;
  if (tipsTouch(8) && tipsTouch(12) && !tipsTouch(4) && wristGap > 1.2 && tipsAboveWrists) return 'Home';

  // Gestures built from two one-hand shapes go before Heart, whose touching
  // fingertips would otherwise also match two fists or two thumbs held together.
  const g1 = detectGesture(landmarks1);
  const g2 = detectGesture(landmarks2);

  if (g1 === 'Good' && g2 === 'Good') return 'Super';

  // Help: a thumbs-up fist resting on the other open palm.
  if ((g1 === 'Good' && g2 === 'Hello') || (g1 === 'Hello' && g2 === 'Good')) {
    const [fist, palm] = g1 === 'Good' ? [landmarks1, landmarks2] : [landmarks2, landmarks1];
    if (getDistance2d(fist[0], palm[9]) < avgPalmSize * 1.5) return 'Help';
  }

  if (g1 === 'Fist' && g2 === 'Fist' && getDistance2d(landmarks1[9], landmarks2[9]) < avgPalmSize * 1.6) return 'Together';

  const indexDist = getDistance(landmarks1[8], landmarks2[8]);
  const thumbDist = getDistance(landmarks1[4], landmarks2[4]);

  const m1 = getDistance(landmarks1[12], landmarks1[9]) > palmSize1 * 0.7;
  const m2 = getDistance(landmarks2[12], landmarks2[9]) > palmSize2 * 0.7;

  if (indexDist < avgPalmSize * 0.5 && thumbDist < avgPalmSize * 0.5 && !m1 && !m2) return "Heart";
  if (indexDist < avgPalmSize * 0.5 && thumbDist < avgPalmSize * 0.5 && m1 && m2) return "Family";

  if (g1 === 'Hello' && g2 === 'Hello') return "Stop";

  return null;
};

const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
  ctx.fillStyle = '#E07A5F';
  ctx.strokeStyle = '#E07A5F';
  ctx.lineWidth = 2;
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];
  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    ctx.beginPath();
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    ctx.stroke();
  }
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
};


type Mode = 'gestures' | 'alphabet';

const readStored = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};
const store = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

export default function App() {
  const [mode, setMode] = useState<Mode>('gestures');
  const [lang, setLang] = useState<Lang>(() => readStored('echovision.lang', ['kk', 'ru', 'en'], 'kk'));
  const [voice, setVoice] = useState(() => readStored('echovision.voice', ['on', 'off'], 'on') === 'on');
  const t = ui[lang];

  useEffect(() => {
    store('echovision.lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    store('echovision.voice', voice ? 'on' : 'off');
    if (!voice) stopSpeaking();
  }, [voice]);

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        mode === value ? 'bg-accent-primary text-white shadow-sm' : 'text-text-dim hover:text-text-main'}`}
    >
      {label}
    </button>
  );

  const settings: Settings = { lang, voice };

  return (
    <SettingsContext.Provider value={settings}>
      <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 max-w-[1200px] mx-auto">
        <header className="soft-card flex flex-wrap gap-4 justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="brand-icon"></div>
            <div className="font-bold tracking-tight text-xl text-text-main">EchoVision Web</div>
          </div>
          <nav className="flex gap-1 bg-bg-main border border-border-soft rounded-xl p-1" aria-label="Mode">
            {tab('gestures', t.modeGestures)}
            {tab('alphabet', t.modeAlphabet)}
          </nav>
          <div className="flex items-center gap-2">
            <select
              aria-label={t.interfaceLanguage}
              className="bg-bg-main border border-border-soft text-text-main px-2.5 py-2 rounded-lg text-sm outline-none focus:border-accent-primary"
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
            >
              {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setVoice(v => !v)}
              aria-pressed={voice}
              title={voice ? t.voiceOn : t.voiceOff}
              aria-label={voice ? t.voiceOn : t.voiceOff}
              className={`w-10 h-10 rounded-lg border text-base transition-colors ${
                voice ? 'border-accent-primary bg-accent-primary/10' : 'border-border-soft bg-bg-main opacity-60'}`}
            >
              {voice ? '🔊' : '🔇'}
            </button>
          </div>
        </header>
        {/* Each mode owns its camera stream; switching unmounts the other one and releases it. */}
        {mode === 'gestures' ? <GestureTranslator /> : <AlphabetTrainer />}
      </div>
    </SettingsContext.Provider>
  );
}

interface HistoryEntry { time: string; gesture: GestureId }

function GestureTranslator() {
  const settings = useSettings();
  const t = ui[settings.lang];
  const words = gestureWords[settings.lang];

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [language, setLanguage] = useState<Lang>(settings.lang);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [queueDisplay, setQueueDisplay] = useState<GestureId[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentToken, setCurrentToken] = useState<GestureId | null>(null);
  const [finalSentence, setFinalSentence] = useState<string>('');
  const [sentenceNote, setSentenceNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<'denied' | 'failed' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  const gestureQueueRef = useRef<GestureId[]>([]);
  const lastAcceptedGestureRef = useRef<GestureId | null>(null);
  const candidateGestureRef = useRef<GestureId | null>(null);
  const candidateFramesRef = useRef(0);
  const noGestureFramesRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const languageRef = useRef(language);
  const voiceRef = useRef(settings.voice);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    voiceRef.current = settings.voice;
  }, [settings.voice]);

  // The sentence language follows the interface language unless changed here.
  useEffect(() => {
    setLanguage(settings.lang);
  }, [settings.lang]);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const landmarker = await getHandLandmarker('VIDEO', 2);
        handLandmarkerRef.current = landmarker;
        setIsModelLoaded(true);
      } catch (e) {
        console.error("Failed to load MediaPipe model", e);
      }
    };
    initMediaPipe();
  }, []);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // Request permission first to ensure we get device labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
        setCameraError(null);
      } catch (err) {
        console.error("Camera access denied or error:", err);
        setCameraError('denied');
      }
    };

    initializeCamera();
  }, []);

  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current) return;

    let stream: MediaStream | null = null;
    let cancelled = false;
    const attach = (s: MediaStream) => {
      if (cancelled) {
        s.getTracks().forEach(t => t.stop());
        return;
      }
      stream = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraError(null);
    };

    navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: selectedDeviceId } }
    }).then(attach).catch(err => {
      console.error("Error connecting to selected camera:", err);
      // Fallback to default camera if exact deviceId fails
      navigator.mediaDevices.getUserMedia({ video: true }).then(attach).catch(() => {
        setCameraError('failed');
      });
    });

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedDeviceId]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const say = (text: string, lang: Lang) => {
    if (voiceRef.current) speak(text, lang);
  };

  const processQueue = async () => {
    const gesturesToProcess = [...gestureQueueRef.current];
    if (gesturesToProcess.length === 0) return;

    gestureQueueRef.current = [];
    setQueueDisplay([]);
    const lang = languageRef.current;
    const client = getAi();

    // Without a Gemini key the localized words themselves are shown and spoken.
    if (!client) {
      const text = gesturesToProcess.map(g => gestureWords[lang][g]).join(', ');
      const sentence = text.charAt(0).toUpperCase() + text.slice(1) + '.';
      setFinalSentence(sentence);
      setSentenceNote('noKey');
      say(sentence, lang);
      return;
    }

    setIsProcessing(true);
    setSentenceNote('');
    const prompt = `Translate these gesture tokens [${gesturesToProcess.join(', ')}] into a grammatically correct, polite sentence in ${languageNames[lang]}. Return ONLY the sentence text.`;

    try {
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const text = response.text;
      if (text) {
        setFinalSentence(text);
        say(text, lang);
      }
    } catch (e) {
      console.error(e);
      setFinalSentence('');
      setSentenceNote('genError');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderLoop = () => {
    if (videoRef.current && canvasRef.current && handLandmarkerRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      let startTimeMs = performance.now();
      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (results.landmarks) {
            for (const landmarks of results.landmarks) {
              drawLandmarks(ctx, landmarks);
            }

            let detected: GestureId | null = null;
            if (results.landmarks.length === 2) {
              detected = detectTwoHandedGesture(results.landmarks[0], results.landmarks[1]);
            }
            if (!detected && results.landmarks.length > 0) {
              detected = detectGesture(results.landmarks[0]);
            }

            if (detected) {
              noGestureFramesRef.current = 0;
              if (detected === candidateGestureRef.current) {
                candidateFramesRef.current++;
                if (candidateFramesRef.current >= 8) { // Require 8 consecutive frames for confidence
                  if (detected !== lastAcceptedGestureRef.current) {
                    lastAcceptedGestureRef.current = detected;
                    gestureQueueRef.current.push(detected);
                    setQueueDisplay([...gestureQueueRef.current]);
                    setCurrentToken(detected);
                    setHistory(h => [...h.slice(-49), { time: new Date().toLocaleTimeString(), gesture: detected! }]);

                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                      processQueue();
                    }, 2000);
                  }
                }
              } else {
                candidateGestureRef.current = detected;
                candidateFramesRef.current = 1;
              }
            } else {
              noGestureFramesRef.current++;
              if (noGestureFramesRef.current > 15) {
                lastAcceptedGestureRef.current = null;
                candidateGestureRef.current = null;
                candidateFramesRef.current = 0;
              }
            }
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const selectClass = "w-full bg-bg-main border border-border-soft text-text-main p-2.5 rounded-lg text-sm outline-none focus:border-accent-primary transition-colors";

  return (
    <>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
        <aside className="soft-card flex flex-col p-5">
          <h3 className="text-xs uppercase text-text-dim font-bold mb-4 tracking-wider">{t.inputControls}</h3>
          <div className="mb-5">
            <label className="text-sm text-text-main font-medium mb-2 block">{t.activeCamera}</label>
            <select
              className={selectClass}
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
            >
              {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
            </select>
          </div>
          <div className="mb-5">
            <label className="text-sm text-text-main font-medium mb-2 block">{t.outputLanguage}</label>
            <select
              className={selectClass}
              value={language}
              onChange={e => setLanguage(e.target.value as Lang)}
            >
              {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="mt-auto">
            <button
              onClick={() => {
                gestureQueueRef.current = [];
                setQueueDisplay([]);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
              }}
              className="w-full bg-accent-primary text-white font-medium p-3 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              {t.clearQueue}
            </button>
          </div>
        </aside>

        <main className="relative bg-gray-900 border-4 border-bg-panel shadow-inner flex items-center justify-center overflow-hidden rounded-2xl min-h-[400px]">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" playsInline autoPlay muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" />

          {!isModelLoaded && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-panel/90 z-20 backdrop-blur-sm">
              <div className="text-text-main animate-pulse flex flex-col items-center gap-3 font-medium text-sm">
                <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                {t.loadingEngine}
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-panel/95 z-30 backdrop-blur-sm">
              <div className="text-accent-primary flex flex-col items-center gap-4 p-6 text-center border border-border-soft rounded-xl bg-white shadow-xl max-w-[80%]">
                <p className="font-medium text-sm leading-relaxed text-text-main">{cameraError === 'denied' ? t.cameraDenied : t.cameraFailed}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-accent-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity mt-2 shadow-sm"
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {currentToken && (
            <div className="absolute bottom-6 left-6 bg-bg-panel/90 backdrop-blur-md px-4 py-3 rounded-xl border border-border-soft shadow-lg z-20">
              <div className="text-[10px] uppercase text-text-dim font-bold mb-1 tracking-wider">{t.currentToken}</div>
              <div className="text-xl font-bold text-accent-primary">{words[currentToken]}</div>
            </div>
          )}
        </main>

        <aside className="soft-card flex flex-col p-5">
          <h3 className="text-xs uppercase text-text-dim font-bold mb-4 tracking-wider">{t.history}</h3>
          <div className="font-mono text-[11px] text-text-dim leading-relaxed overflow-y-auto flex-1 raw-log space-y-1 max-h-72">
            {history.map((entry, i) => (
              <div key={i}><span className="opacity-60">{entry.time}</span> <span className="text-text-main font-semibold">[{words[entry.gesture]}]</span></div>
            ))}
            {isProcessing && <div className="text-accent-secondary font-semibold">{t.aiTriggered}</div>}
          </div>
          <div className="mt-auto pt-4 border-t border-border-soft">
            <h3 className="text-[10px] uppercase text-text-dim font-bold mb-3 tracking-wider">{t.engineStats}</h3>
            <div className="flex justify-between text-xs mb-2 font-medium">
              <span className="text-text-dim">{t.hands}</span>
              <span className="text-text-main">{isModelLoaded ? t.active : t.loading}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-text-dim">{t.tokens}</span>
              <span className="text-text-main">{queueDisplay.length} {t.inQueue}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="soft-card p-5">
          <h3 className="text-xs uppercase text-text-dim font-bold mb-4 tracking-wider">{t.queue}</h3>
          <div className="flex flex-wrap gap-2">
            {queueDisplay.length === 0 && <span className="text-text-dim text-sm italic">{t.waiting}</span>}
            {queueDisplay.map((g, i) => (
              <span key={i} className="gesture-token">{words[g]}</span>
            ))}
          </div>
        </div>
        <div className="soft-card p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs uppercase text-text-dim font-bold tracking-wider">{t.synthesis}</h3>
            <button
              type="button"
              disabled={!finalSentence}
              onClick={() => speak(finalSentence, language)}
              className="text-xs font-semibold text-accent-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              🔊 {t.speakAgain}
            </button>
          </div>
          <div className="ai-output flex-1 flex items-center">
            {finalSentence ? `"${finalSentence}"` : <span className="text-text-dim italic text-base">{sentenceNote === 'genError' ? t.genError : t.noOutput}</span>}
          </div>
          {sentenceNote === 'noKey' && <p className="text-xs text-text-dim mt-3">{t.noKey}</p>}
          {isProcessing && (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-accent-secondary rounded-full animate-pulse"></div>
              <span className="text-xs text-text-main font-bold uppercase tracking-wider">{t.synthesizing}</span>
            </div>
          )}
        </div>
      </div>

      <div className="soft-card p-5">
        <h3 className="text-xs uppercase text-text-dim font-bold mb-4 tracking-wider">{t.guide}</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-2">✋ {t.oneHand}</h4>
            <div className="flex flex-wrap gap-2">
              {oneHandGestures.map(g => (
                <span key={g} className="text-xs bg-bg-main border border-border-soft rounded-full px-3 py-1">{words[g]}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">🙌 {t.twoHands}</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {twoHandGestures.map(g => (
                <li key={g} className="text-xs bg-bg-main border border-border-soft rounded-lg px-3 py-2">
                  <strong className="text-text-main">{words[g]}</strong>
                  <span className="text-text-dim"> — {gestureHowTo[settings.lang][g]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
