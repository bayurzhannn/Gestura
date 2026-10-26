import React, { useEffect, useRef, useState } from 'react';
import { getHandLandmarker } from '../landmarker';
import { classify, loadDactylModel, loadExamples, type DactylModel } from './model';
import {
  alphabet, drawSkeleton, hints, landmarkFeatures, LessonEngine, motionLetters, movementLabels,
  movementSymbols, referenceImage, type Feedback, type Point,
} from './lesson';

const TOTAL = alphabet.length;

interface Analysis { prediction: string; meter: number; confidence: string }
const idleAnalysis: Analysis = { prediction: '—', meter: 0, confidence: 'Наведите руку на камеру' };

function nextUncompleted(completed: Set<string>, afterIndex: number) {
  for (let step = 0; step < TOTAL; step++) {
    const index = (afterIndex + step) % TOTAL;
    if (!completed.has(alphabet[index])) return index;
  }
  return TOTAL;
}

export default function AlphabetTrainer() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ title: 'Готовимся к уроку', text: 'Загрузка модели…', icon: '✳' });
  const [analysis, setAnalysis] = useState<Analysis>(idleAnalysis);
  const [cameraOn, setCameraOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [handVisible, setHandVisible] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<DactylModel | null>(null);
  const engineRef = useRef(new LessonEngine());
  const lessonRef = useRef(0);
  const completedRef = useRef(completed);
  const streamRef = useRef<MediaStream | null>(null);
  const checkingRef = useRef(false);

  const finished = lessonIndex >= TOTAL;
  const target = finished ? null : alphabet[lessonIndex];
  const selectedLetter = alphabet[selected];

  const goTo = (index: number) => {
    lessonRef.current = index;
    setLessonIndex(index);
    engineRef.current.reset();
  };

  const drawFeatures = (features: number[] | null) => {
    const ctx = skeletonRef.current?.getContext('2d');
    if (ctx) drawSkeleton(ctx, features);
  };

  // Runs one recognition pass and advances the lesson when the letter is accepted.
  const check = (features: number[], fromCamera: boolean, landmarks: Point[] | null = null, aspectRatio = 1) => {
    const model = modelRef.current;
    const index = lessonRef.current;
    if (!model || index >= TOTAL) return;
    const letter = alphabet[index];
    const verdict = engineRef.current.evaluate(model, letter, classify(model, features, letter), fromCamera, landmarks, aspectRatio);
    setAnalysis({ prediction: verdict.prediction, meter: verdict.meter, confidence: verdict.confidence });
    setFeedback(verdict.feedback);
    if (verdict.completed) {
      const done = new Set<string>(completedRef.current).add(letter);
      completedRef.current = done;
      setCompleted(done);
      const next = nextUncompleted(done, index + 1);
      goTo(next);
      if (next >= TOTAL) setFeedback({ title: 'Весь алфавит пройден', text: 'Можешь выбрать любую букву или пройти урок снова.', icon: '✓' });
    }
  };

  useEffect(() => {
    drawFeatures(null);
    loadDactylModel().then((model) => {
      modelRef.current = model;
      setFeedback({ title: 'Модель готова', text: 'Включи камеру, загрузи фото или проверь образец.', icon: '✳' });
    }).catch((error) => setFeedback({ title: 'Не удалось загрузить модель', text: error.message, icon: '!' }));
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!cameraOn) return;
    let busy = false;
    let landmarkerReady: Awaited<ReturnType<typeof getHandLandmarker>> | null = null;
    getHandLandmarker('VIDEO', 1).then((landmarker) => { landmarkerReady = landmarker; });
    const timer = setInterval(() => {
      const video = videoRef.current;
      if (busy || checkingRef.current || !landmarkerReady || !modelRef.current || !video || video.readyState < 2) return;
      if (lessonRef.current >= TOTAL) return;
      busy = true;
      try {
        const landmarks = landmarkerReady.detectForVideo(video, performance.now()).landmarks?.[0];
        if (!landmarks) {
          drawFeatures(null);
          setHandVisible(false);
          setAnalysis(idleAnalysis);
          engineRef.current.reset();
          setFeedback({ title: 'Покажи руку в кадре', text: 'Подними кисть так, чтобы были видны все пальцы.', icon: '↻' });
          return;
        }
        setHandVisible(true);
        const aspectRatio = video.videoWidth / video.videoHeight;
        const features = landmarkFeatures(landmarks, aspectRatio);
        drawFeatures(features);
        if (features) check(features, true, landmarks, aspectRatio);
      } catch (error: any) {
        setFeedback({ title: 'Ошибка распознавания', text: error.message, icon: '!' });
      } finally {
        busy = false;
      }
    }, 100);
    return () => clearInterval(timer);
  }, [cameraOn]);

  const startCamera = async () => {
    setStarting(true);
    setFeedback({ title: 'Запускаем камеру', text: 'Разреши доступ в окне браузера.', icon: '✳' });
    try {
      await Promise.all([loadDactylModel(), getHandLandmarker('VIDEO', 1)]);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setFeedback({ title: `Покажи букву ${alphabet[lessonRef.current] ?? 'А'}`, text: 'Расположи одну руку полностью в кадре.', icon: '✳' });
    } catch (error: any) {
      setFeedback({ title: 'Не удалось включить камеру', text: error.message, icon: '!' });
    } finally {
      setStarting(false);
    }
  };

  const withChecking = async (task: () => Promise<void>) => {
    checkingRef.current = true;
    setChecking(true);
    try {
      modelRef.current ??= await loadDactylModel();
      await task();
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  };

  const checkPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setFeedback({ title: 'Проверяем фото', text: 'Ищем кисть руки на изображении…', icon: '✳' });
    withChecking(async () => {
      let image: ImageBitmap | undefined;
      try {
        const landmarker = await getHandLandmarker('IMAGE', 1);
        image = await createImageBitmap(file);
        const landmarks = landmarker.detect(image).landmarks?.[0];
        const aspectRatio = image.width / image.height;
        const features = landmarks ? landmarkFeatures(landmarks, aspectRatio) : null;
        drawFeatures(features);
        if (!landmarks) {
          setAnalysis({ ...idleAnalysis, confidence: 'Рука не найдена' });
          setFeedback({ title: 'Не вижу руку на фото', text: 'Загрузи чёткое фото одной руки целиком.', icon: '↻' });
        } else if (!features) {
          setFeedback({ title: 'Не удалось выделить руку', text: 'Попробуй другое фото с чётко видимыми пальцами.', icon: '↻' });
        } else {
          check(features, false, landmarks, aspectRatio);
        }
      } catch (error: any) {
        setFeedback({ title: 'Не удалось проверить изображение', text: error.message, icon: '!' });
      } finally {
        image?.close();
        input.value = '';
      }
    });
  };

  const checkExample = () => withChecking(async () => {
    try {
      const letter = alphabet[lessonRef.current];
      const features = (await loadExamples())[letter];
      if (!features) throw new Error(`Нет образца для буквы ${letter}`);
      drawFeatures(features);
      check(features, false);
    } catch (error: any) {
      setFeedback({ title: 'Не удалось проверить образец', text: error.message, icon: '!' });
    }
  });

  const practice = (letter: string) => {
    goTo(alphabet.indexOf(letter));
    setFeedback({ title: `Покажи букву ${letter}`, text: hints[letter], icon: '✳' });
    document.getElementById('dactyl-lesson')?.scrollIntoView({ behavior: 'smooth' });
  };

  const restart = () => {
    completedRef.current = new Set<string>();
    setCompleted(completedRef.current);
    goTo(0);
    setFeedback({ title: 'Начинаем снова', text: 'Покажи букву А.', icon: '✳' });
  };

  const cardTitle = 'text-xs uppercase text-text-dim font-bold tracking-wider';
  const outlineButton = 'border border-border-soft text-text-main font-medium px-4 py-2.5 rounded-lg text-sm hover:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-6">
      <section id="dactyl-lesson" className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 scroll-mt-6">
        <div className="soft-card p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className={cardTitle}>Твоё задание</h3>
            <span className="text-xs font-semibold bg-bg-main border border-border-soft rounded-full px-2.5 py-0.5">
              {finished ? TOTAL : lessonIndex + 1} / {TOTAL}
            </span>
          </div>
          <div className="text-6xl font-bold text-accent-primary leading-none">{target ?? '✓'}</div>
          <p className="font-semibold mt-2 mb-4">{target ? `Покажи букву ${target}` : 'Урок завершён'}</p>
          {target && (
            <div className="bg-bg-main border border-border-soft rounded-xl p-3 flex items-center justify-center mb-4 overflow-hidden">
              <img src={referenceImage(target)} alt={`Образец жеста ${target}`}
                className={`max-h-40 object-contain ${target === 'А' ? 'upright-a' : ''}`} />
            </div>
          )}
          <p className="text-sm text-text-dim leading-relaxed">
            {target ? hints[target] : 'Ты прошёл весь алфавит. Можно выбрать букву в справочнике и повторить её.'}
          </p>
        </div>

        <div className="soft-card p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className={cardTitle}>Практика с камерой</h3>
            <span className="text-xs font-medium text-text-dim flex items-center gap-2">
              <span className={cameraOn ? 'status-dot' : 'status-dot status-dot-off'}></span>{cameraOn ? 'Включена' : 'Выключена'}
            </span>
          </div>
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" playsInline autoPlay muted />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm font-medium">
                Включи камеру, чтобы начать практику
              </div>
            )}
            {cameraOn && (
              <div className="absolute top-3 left-3 bg-bg-panel/90 backdrop-blur-md text-xs font-semibold px-3 py-1.5 rounded-full">
                {handVisible === null ? 'Ожидание руки' : handVisible ? 'Рука найдена' : 'Рука не найдена'}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={startCamera} disabled={cameraOn || starting}
              className="bg-accent-primary text-white font-medium px-4 py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {cameraOn ? 'Камера включена' : starting ? 'Запуск…' : 'Включить камеру'}
            </button>
            <label className={`${outlineButton} cursor-pointer ${checking ? 'opacity-50 pointer-events-none' : ''}`}>
              Загрузить фото
              <input type="file" accept="image/*" className="hidden" onChange={checkPhoto} disabled={checking} />
            </label>
            <button onClick={checkExample} disabled={checking || finished} className={outlineButton}>Проверить образец</button>
          </div>
          <div className="flex gap-3 items-start bg-bg-main border border-border-soft rounded-xl p-4" aria-live="polite">
            <div className="w-9 h-9 shrink-0 rounded-full bg-accent-secondary/40 flex items-center justify-center font-bold">{feedback.icon}</div>
            <div>
              <strong className="text-sm">{feedback.title}</strong>
              <p className="text-sm text-text-dim mt-1 leading-relaxed">{feedback.text}</p>
            </div>
          </div>
        </div>

        <div className="soft-card p-5 flex flex-col">
          <h3 className={`${cardTitle} mb-4`}>Анализ жеста</h3>
          <div className="bg-white border border-border-soft rounded-xl flex items-center justify-center p-2 mb-4">
            <canvas ref={skeletonRef} width={192} height={192} className="w-full max-w-[192px]" aria-label="Контур обнаруженной руки" />
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-text-dim">Распознано</span>
            <strong className="text-2xl text-accent-primary">{analysis.prediction}</strong>
          </div>
          <div className="h-2 bg-bg-main border border-border-soft rounded-full overflow-hidden mb-2">
            <span className="block h-full bg-accent-primary transition-all" style={{ width: `${analysis.meter}%` }} />
          </div>
          <p className="text-xs text-text-dim">{analysis.confidence}</p>
        </div>
      </section>

      <section className="soft-card p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className={cardTitle}>Справочник жестов · весь алфавит</h3>
          <span className="text-xs font-semibold text-text-dim">{TOTAL} буквы</span>
        </div>
        <p className="text-sm text-text-dim mb-4">
          Выбери букву и нажми «Тренировать». Для Д, Ё, Й, К, Щ, Ъ и Ь нужна камера: одно фото не показывает движение.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-11 gap-2 content-start">
            {alphabet.map((letter, index) => (
              <button key={letter} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index}
                aria-label={`Буква ${letter}`}
                className={`relative aspect-square rounded-lg border text-lg font-bold transition-colors ${
                  selected === index ? 'border-accent-primary bg-accent-primary text-white'
                  : completed.has(letter) ? 'border-[#81C784] bg-[#81C784]/15 text-text-main'
                  : 'border-border-soft bg-bg-main text-text-main hover:border-accent-primary'}`}>
                {letter}
                {movementSymbols[letter] && <span className="absolute top-0.5 right-1 text-[10px] opacity-70">{movementSymbols[letter]}</span>}
              </button>
            ))}
          </div>
          <div className="bg-bg-main border border-border-soft rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <strong className="text-3xl">{selectedLetter}</strong>
              <span className="text-[11px] font-semibold bg-bg-panel border border-border-soft rounded-full px-2.5 py-0.5">
                {motionLetters.has(selectedLetter) ? 'Нужна камера и движение' : 'Можно проверить камерой'}
              </span>
            </div>
            <div className="flex items-center justify-center overflow-hidden">
              <img src={referenceImage(selectedLetter)} alt={`Положение руки для буквы ${selectedLetter}`}
                className={`max-h-40 object-contain ${selectedLetter === 'А' ? 'upright-a' : ''}`} />
            </div>
            {movementLabels[selectedLetter] && (
              <div className="text-xs bg-accent-secondary/25 rounded-lg p-3">
                <strong className="block mb-1">{movementLabels[selectedLetter]}</strong>
                <span className="text-text-dim">{hints[selectedLetter]}</span>
              </div>
            )}
            <button type="button" onClick={() => practice(selectedLetter)}
              className="bg-accent-primary text-white font-medium p-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm">
              Тренировать букву {selectedLetter}
            </button>
            <p className="text-[11px] text-text-dim">
              Рисунки: <a className="underline" href="https://abvgdee.ru/alfavity/gluhonemyh" target="_blank" rel="noreferrer">abvgdee.ru</a> ·
              модель: <a className="underline" href="https://github.com/Blockbattle/RSL-Dataset" target="_blank" rel="noreferrer">RSL-Dataset</a>
            </p>
          </div>
        </div>
      </section>

      <section className="soft-card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className={cardTitle}>Твой прогресс</h3>
          <span className="text-sm font-semibold">{completed.size} из {TOTAL}</span>
        </div>
        <div className="h-3 bg-bg-main border border-border-soft rounded-full overflow-hidden">
          <span className="block h-full bg-[#81C784] transition-all" style={{ width: `${completed.size / TOTAL * 100}%` }} />
        </div>
        {finished && <button type="button" onClick={restart} className={`${outlineButton} mt-4`}>Пройти снова</button>}
      </section>
    </div>
  );
}
