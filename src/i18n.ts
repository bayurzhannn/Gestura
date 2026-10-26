import { createContext, useContext } from 'react';

export type Lang = 'kk' | 'ru' | 'en';

export const languages: { value: Lang; label: string }[] = [
  { value: 'kk', label: 'Қазақша' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export const speechTags: Record<Lang, string> = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-US' };
export const languageNames: Record<Lang, string> = { kk: 'Kazakh', ru: 'Russian', en: 'English' };

export interface Settings { lang: Lang; voice: boolean }
export const SettingsContext = createContext<Settings>({ lang: 'ru', voice: true });
export const useSettings = () => useContext(SettingsContext);

// ---------- App chrome and gesture translator ----------

export const ui = {
  kk: {
    modeGestures: 'Ым аудармашы', modeAlphabet: 'Дактиль әліпбиі',
    engineActive: 'Көру жүйесі қосулы', interfaceLanguage: 'Интерфейс тілі',
    voiceOn: 'Дыбыс қосулы', voiceOff: 'Дыбыс өшірулі',
    inputControls: 'Басқару', activeCamera: 'Камера', outputLanguage: 'Сөйлем тілі',
    clearQueue: 'Кезекті тазалау', loadingEngine: 'Көру жүйесі жүктелуде...',
    cameraDenied: 'Камераға рұқсат жоқ. Браузерде камераға рұқсат беріңіз.',
    cameraFailed: 'Камераға қосылу мүмкін болмады.', retry: 'Қайта қосылу',
    currentToken: 'Соңғы ым', history: 'Анықталғандар тарихы', aiTriggered: 'ЖИ іске қосылды...',
    speaking: 'Дыбыстау', engineStats: 'Жүйе күйі', hands: 'Қолдар:', active: 'Белсенді', loading: 'Жүктелуде',
    tokens: 'Ымдар:', inQueue: 'кезекте', queue: 'Ым кезегі', waiting: 'Ымдар күтілуде...',
    synthesis: 'Сөйлем', noOutput: 'Әзірге бос...', synthesizing: 'Сөйлем құралуда...',
    noKey: 'Gemini кілті орнатылмаған, сөздер тікелей оқылады.', genError: 'Сөйлем құру кезінде қате шықты.',
    speakAgain: 'Қайта тыңдау', guide: 'Ымдар анықтамасы', oneHand: 'Бір қол', twoHands: 'Екі қол',
  },
  ru: {
    modeGestures: 'Переводчик жестов', modeAlphabet: 'Дактильный алфавит',
    engineActive: 'Распознавание активно', interfaceLanguage: 'Язык интерфейса',
    voiceOn: 'Озвучка включена', voiceOff: 'Озвучка выключена',
    inputControls: 'Управление', activeCamera: 'Камера', outputLanguage: 'Язык предложения',
    clearQueue: 'Очистить очередь', loadingEngine: 'Загрузка распознавания...',
    cameraDenied: 'Нет доступа к камере. Разрешите камеру в браузере.',
    cameraFailed: 'Не удалось подключиться к камере.', retry: 'Подключить снова',
    currentToken: 'Последний жест', history: 'История распознавания', aiTriggered: 'Запущен ИИ...',
    speaking: 'Озвучка', engineStats: 'Состояние', hands: 'Руки:', active: 'Активно', loading: 'Загрузка',
    tokens: 'Жесты:', inQueue: 'в очереди', queue: 'Очередь жестов', waiting: 'Ожидание жестов...',
    synthesis: 'Предложение', noOutput: 'Пока пусто...', synthesizing: 'Составляем предложение...',
    noKey: 'Ключ Gemini не задан — слова озвучиваются напрямую.', genError: 'Не удалось составить предложение.',
    speakAgain: 'Повторить', guide: 'Справочник жестов', oneHand: 'Одна рука', twoHands: 'Две руки',
  },
  en: {
    modeGestures: 'Gesture Translator', modeAlphabet: 'Fingerspelling',
    engineActive: 'Vision Engine Active', interfaceLanguage: 'Interface language',
    voiceOn: 'Voice on', voiceOff: 'Voice off',
    inputControls: 'Input Controls', activeCamera: 'Active Camera', outputLanguage: 'Sentence Language',
    clearQueue: 'Clear Queue', loadingEngine: 'Loading Vision Engine...',
    cameraDenied: 'Camera access denied. Please allow camera permissions in your browser.',
    cameraFailed: 'Failed to connect to the camera.', retry: 'Retry Connection',
    currentToken: 'Current Token', history: 'Detection History', aiTriggered: 'AI Triggered...',
    speaking: 'TTS: Speaking', engineStats: 'Engine Stats', hands: 'Hands:', active: 'Active', loading: 'Loading',
    tokens: 'Tokens:', inQueue: 'in queue', queue: 'Gesture Queue', waiting: 'Waiting for gestures...',
    synthesis: 'Gemini AI Synthesis', noOutput: 'No output yet...', synthesizing: 'Synthesizing...',
    noKey: 'Gemini key is not set — speaking the words directly.', genError: 'Error generating sentence.',
    speakAgain: 'Speak again', guide: 'Gesture Guide', oneHand: 'One hand', twoHands: 'Two hands',
  },
} satisfies Record<Lang, Record<string, string>>;

export type GestureId =
  | 'Hello' | 'OK' | 'Good' | 'Fist' | 'One' | 'Peace' | 'Three' | 'Four' | 'Rock' | 'Call' | 'Love' | 'Gun'
  | 'Heart' | 'Family' | 'Stop' | 'Thanks' | 'Home' | 'Help' | 'Super' | 'Together';

export const twoHandGestures: GestureId[] = ['Heart', 'Family', 'Stop', 'Thanks', 'Home', 'Help', 'Super', 'Together'];
export const oneHandGestures: GestureId[] = ['Hello', 'OK', 'Good', 'Fist', 'One', 'Peace', 'Three', 'Four', 'Rock', 'Call', 'Love', 'Gun'];

export const gestureWords: Record<Lang, Record<GestureId, string>> = {
  kk: {
    Hello: 'Сәлем', OK: 'Жарайды', Good: 'Жақсы', Fist: 'Жұдырық', One: 'Бір', Peace: 'Бейбітшілік',
    Three: 'Үш', Four: 'Төрт', Rock: 'Рок', Call: 'Хабарлас', Love: 'Сүйемін', Gun: 'Тапанша',
    Heart: 'Жүрек', Family: 'Отбасы', Stop: 'Тоқта', Thanks: 'Рақмет', Home: 'Үй', Help: 'Көмек',
    Super: 'Керемет', Together: 'Бірге',
  },
  ru: {
    Hello: 'Привет', OK: 'Окей', Good: 'Хорошо', Fist: 'Кулак', One: 'Один', Peace: 'Мир',
    Three: 'Три', Four: 'Четыре', Rock: 'Рок', Call: 'Позвони', Love: 'Люблю', Gun: 'Пистолет',
    Heart: 'Сердце', Family: 'Семья', Stop: 'Стоп', Thanks: 'Спасибо', Home: 'Дом', Help: 'Помощь',
    Super: 'Супер', Together: 'Вместе',
  },
  en: {
    Hello: 'Hello', OK: 'OK', Good: 'Good', Fist: 'Fist', One: 'One', Peace: 'Peace',
    Three: 'Three', Four: 'Four', Rock: 'Rock', Call: 'Call me', Love: 'I love you', Gun: 'Gun',
    Heart: 'Heart', Family: 'Family', Stop: 'Stop', Thanks: 'Thank you', Home: 'Home', Help: 'Help',
    Super: 'Super', Together: 'Together',
  },
};

export const gestureHowTo: Record<Lang, Partial<Record<GestureId, string>>> = {
  kk: {
    Heart: 'Екі қолдың сұқ саусақтары мен бас бармақтарын түйістір',
    Family: 'Жүрек сияқты, бірақ ортан саусақтар жазулы',
    Stop: 'Екі алақанды ашып, камераға көрсет',
    Thanks: 'Алақандарды бір-біріне жапсыр',
    Home: 'Ашық алақандардың ұштарын шатыр сияқты түйістір',
    Help: 'Бас бармақты көтерген жұдырықты ашық алақанға қой',
    Super: 'Екі қолдың да бас бармағын көтер',
    Together: 'Екі жұдырықты бір-біріне тигіз',
  },
  ru: {
    Heart: 'Соедини кончики указательных и больших пальцев обеих рук',
    Family: 'Как сердце, но средние пальцы выпрямлены',
    Stop: 'Покажи камере обе раскрытые ладони',
    Thanks: 'Сложи ладони вместе',
    Home: 'Соедини кончики раскрытых ладоней «крышей»',
    Help: 'Поставь кулак с поднятым большим пальцем на раскрытую ладонь',
    Super: 'Подними большие пальцы на обеих руках',
    Together: 'Соедини два кулака',
  },
  en: {
    Heart: 'Touch index fingertips and thumbs of both hands',
    Family: 'Like heart, but with middle fingers extended',
    Stop: 'Show both open palms to the camera',
    Thanks: 'Press your palms together',
    Home: 'Touch the fingertips of both open hands like a roof',
    Help: 'Rest a thumbs-up fist on your open palm',
    Super: 'Thumbs up with both hands',
    Together: 'Bump two fists together',
  },
};

// ---------- Fingerspelling trainer ----------

export type FeedbackId =
  | 'loading' | 'modelReady' | 'modelError' | 'startingCamera' | 'cameraError' | 'showLetter' | 'showHand'
  | 'recognitionError' | 'checkingPhoto' | 'noHandPhoto' | 'cantExtract' | 'photoError' | 'sampleError'
  | 'allDone' | 'restart' | 'practice'
  | 'shapeOkNeedMotion' | 'shapeNotConfirmed' | 'showShapeFirst' | 'shapeFoundAddMotion' | 'showShapeAgain'
  | 'seeLetterMotion' | 'motionNoticed' | 'seeLetterHold' | 'seeLetterSample' | 'notConfirmed';

export type ConfidenceId =
  | 'pointCamera' | 'noHand' | 'extraCheck' | 'dNeedsCircle' | 'notConfirmedYet' | 'modelScore' | 'checkingMotion' | 'shExtraCheck';

type Msg = (letter: string, hint: string, detail: string) => string;

interface TrainerText {
  feedback: Record<FeedbackId, [Msg, Msg]>;
  confidence: Record<ConfidenceId, (letter: string, percent: number) => string>;
  labels: Record<string, string>;
  speech: { correct: (letter: string) => string; next: (letter: string) => string; done: string };
}

const hint: Msg = (_l, h) => h;
const detail: Msg = (_l, _h, d) => d;

export const trainerText: Record<Lang, TrainerText> = {
  kk: {
    feedback: {
      loading: [() => 'Сабаққа дайындалып жатырмыз', () => 'Модель жүктелуде…'],
      modelReady: [() => 'Модель дайын', () => 'Камераны қос, фото жүкте немесе үлгіні тексер.'],
      modelError: [() => 'Модель жүктелмеді', detail],
      startingCamera: [() => 'Камера қосылуда', () => 'Браузер терезесінде рұқсат бер.'],
      cameraError: [() => 'Камера қосылмады', detail],
      showLetter: [(l) => `${l} әрпін көрсет`, () => 'Бір қолды кадрға толық орналастыр.'],
      showHand: [() => 'Қолды кадрда көрсет', () => 'Барлық саусақтар көрінетіндей қолыңды көтер.'],
      recognitionError: [() => 'Тану қатесі', detail],
      checkingPhoto: [() => 'Фото тексерілуде', () => 'Суреттен қолды іздеп жатырмыз…'],
      noHandPhoto: [() => 'Фотода қол көрінбейді', () => 'Бір қол толық көрінетін анық фото жүкте.'],
      cantExtract: [() => 'Қолды бөліп алу мүмкін болмады', () => 'Саусақтары анық көрінетін басқа фото көр.'],
      photoError: [() => 'Суретті тексеру мүмкін болмады', detail],
      sampleError: [() => 'Үлгіні тексеру мүмкін болмады', detail],
      allDone: [() => 'Бүкіл әліпби өтілді', () => 'Кез келген әріпті таңдауға немесе сабақты қайта өтуге болады.'],
      restart: [() => 'Қайта бастаймыз', () => 'А әрпін көрсет.'],
      practice: [(l) => `${l} әрпін көрсет`, hint],
      shapeOkNeedMotion: [() => 'Қол пішіні сәйкес', (l, h) => `${l} әрпіне қозғалыс керек. Камераны қос: ${h}`],
      shapeNotConfirmed: [() => 'Пішін әлі расталмады', hint],
      showShapeFirst: [() => 'Алдымен қол пішінін көрсет', hint],
      shapeFoundAddMotion: [() => 'Пішін табылды — қозғалыс қос', hint],
      showShapeAgain: [() => 'Пішінді қайта көрсет', () => 'Пішін расталған соң бірден қозғалысты жаса.'],
      seeLetterMotion: [(l) => `${l} әрпін көріп тұрмын`, () => 'Пішін мен қозғалыс сәйкес келді.'],
      motionNoticed: [() => 'Қозғалыс байқалды', hint],
      seeLetterHold: [(l) => `${l} әрпін көріп тұрмын`, () => 'Ымды тағы біраз ұстап тұр.'],
      seeLetterSample: [(l) => `${l} әрпін көріп тұрмын`, () => 'Үлгі танылды.'],
      notConfirmed: [(l) => `${l} әрпі әлі расталмады`, hint],
    },
    confidence: {
      pointCamera: () => 'Қолды камераға бағытта',
      noHand: () => 'Қол табылмады',
      extraCheck: (l) => `${l} пішіні қосымша тексеруден өтті`,
      shExtraCheck: () => 'Ш пішіні қосымша тексеруден өтті',
      dNeedsCircle: () => 'Д пішіні табылды · есепке алу үшін шеңбер керек',
      notConfirmedYet: (l) => `${l} пішіні әлі расталмады`,
      modelScore: (_l, p) => `Модель бағасы: ${p}% · қателік болуы мүмкін`,
      checkingMotion: () => 'Пішін табылды · қозғалысты тексеріп жатырмын',
    },
    labels: {
      task: 'Тапсырма', lessonDone: 'Сабақ аяқталды',
      doneHint: 'Бүкіл әліпбиді өттің. Анықтамадан әріп таңдап, қайталауға болады.',
      practiceCamera: 'Камерамен жаттығу', on: 'Қосулы', off: 'Өшірулі',
      turnOnCamera: 'Жаттығуды бастау үшін камераны қос', waitingHand: 'Қол күтілуде',
      handFound: 'Қол табылды', handLost: 'Қол табылмады', cameraIsOn: 'Камера қосулы', starting: 'Қосылуда…',
      startCamera: 'Камераны қосу', uploadPhoto: 'Фото жүктеу', checkSample: 'Үлгіні тексеру',
      analysis: 'Ымды талдау', recognized: 'Танылды', reference: 'Ым анықтамасы · бүкіл әліпби', letters: 'әріп',
      intro: 'Әріпті таңдап, «Жаттығу» батырмасын бас. Д, Ё, Й, К, Щ, Ъ және Ь үшін камера керек: бір фото қозғалысты көрсетпейді.',
      needsMotion: 'Камера мен қозғалыс керек', cameraOk: 'Камерамен тексеруге болады',
      practiceLetter: 'Әріпті жаттығу', images: 'Суреттер', model: 'модель', progress: 'Сенің прогресің',
      of: '/', again: 'Қайта өту', listen: 'Тыңдау', sampleAlt: 'Ым үлгісі', skeletonAlt: 'Анықталған қолдың контуры',
      letter: 'Әріп',
    },
    speech: {
      correct: (l) => `Дұрыс! ${l} әрпі.`,
      next: (l) => `Енді ${l} әрпін көрсет.`,
      done: 'Жарайсың! Бүкіл әліпбиді өттің.',
    },
  },
  ru: {
    feedback: {
      loading: [() => 'Готовимся к уроку', () => 'Загрузка модели…'],
      modelReady: [() => 'Модель готова', () => 'Включи камеру, загрузи фото или проверь образец.'],
      modelError: [() => 'Не удалось загрузить модель', detail],
      startingCamera: [() => 'Запускаем камеру', () => 'Разреши доступ в окне браузера.'],
      cameraError: [() => 'Не удалось включить камеру', detail],
      showLetter: [(l) => `Покажи букву ${l}`, () => 'Расположи одну руку полностью в кадре.'],
      showHand: [() => 'Покажи руку в кадре', () => 'Подними кисть так, чтобы были видны все пальцы.'],
      recognitionError: [() => 'Ошибка распознавания', detail],
      checkingPhoto: [() => 'Проверяем фото', () => 'Ищем кисть руки на изображении…'],
      noHandPhoto: [() => 'Не вижу руку на фото', () => 'Загрузи чёткое фото одной руки целиком.'],
      cantExtract: [() => 'Не удалось выделить руку', () => 'Попробуй другое фото с чётко видимыми пальцами.'],
      photoError: [() => 'Не удалось проверить изображение', detail],
      sampleError: [() => 'Не удалось проверить образец', detail],
      allDone: [() => 'Весь алфавит пройден', () => 'Можешь выбрать любую букву или пройти урок снова.'],
      restart: [() => 'Начинаем снова', () => 'Покажи букву А.'],
      practice: [(l) => `Покажи букву ${l}`, hint],
      shapeOkNeedMotion: [() => 'Форма руки подходит', (l, h) => `Для буквы ${l} нужно движение. Включи камеру: ${h}`],
      shapeNotConfirmed: [() => 'Форма пока не подтверждена', hint],
      showShapeFirst: [() => 'Сначала покажи форму руки', hint],
      shapeFoundAddMotion: [() => 'Форма найдена — добавь движение', hint],
      showShapeAgain: [() => 'Покажи форму ещё раз', () => 'После подтверждения формы сразу выполни движение.'],
      seeLetterMotion: [(l) => `Вижу букву ${l}`, () => 'Форма и движение совпали.'],
      motionNoticed: [() => 'Движение замечено', hint],
      seeLetterHold: [(l) => `Вижу букву ${l}`, () => 'Удерживай жест ещё немного.'],
      seeLetterSample: [(l) => `Вижу букву ${l}`, () => 'Образец распознан.'],
      notConfirmed: [(l) => `Пока не подтверждаю букву ${l}`, hint],
    },
    confidence: {
      pointCamera: () => 'Наведите руку на камеру',
      noHand: () => 'Рука не найдена',
      extraCheck: (l) => `Форма ${l} прошла дополнительную проверку`,
      shExtraCheck: () => 'Форма Ш прошла дополнительную проверку',
      dNeedsCircle: () => 'Форма Д найдена · для зачёта нужен круг',
      notConfirmedYet: (l) => `Форма ${l} пока не подтверждена`,
      modelScore: (_l, p) => `Оценка модели: ${p}% · возможна ошибка`,
      checkingMotion: () => 'Форма найдена · проверяю движение',
    },
    labels: {
      task: 'Твоё задание', lessonDone: 'Урок завершён',
      doneHint: 'Ты прошёл весь алфавит. Можно выбрать букву в справочнике и повторить её.',
      practiceCamera: 'Практика с камерой', on: 'Включена', off: 'Выключена',
      turnOnCamera: 'Включи камеру, чтобы начать практику', waitingHand: 'Ожидание руки',
      handFound: 'Рука найдена', handLost: 'Рука не найдена', cameraIsOn: 'Камера включена', starting: 'Запуск…',
      startCamera: 'Включить камеру', uploadPhoto: 'Загрузить фото', checkSample: 'Проверить образец',
      analysis: 'Анализ жеста', recognized: 'Распознано', reference: 'Справочник жестов · весь алфавит', letters: 'буквы',
      intro: 'Выбери букву и нажми «Тренировать». Для Д, Ё, Й, К, Щ, Ъ и Ь нужна камера: одно фото не показывает движение.',
      needsMotion: 'Нужна камера и движение', cameraOk: 'Можно проверить камерой',
      practiceLetter: 'Тренировать букву', images: 'Рисунки', model: 'модель', progress: 'Твой прогресс',
      of: 'из', again: 'Пройти снова', listen: 'Прослушать', sampleAlt: 'Образец жеста', skeletonAlt: 'Контур обнаруженной руки',
      letter: 'Буква',
    },
    speech: {
      correct: (l) => `Верно! Буква ${l}.`,
      next: (l) => `Теперь покажи букву ${l}.`,
      done: 'Молодец! Весь алфавит пройден.',
    },
  },
  en: {
    feedback: {
      loading: [() => 'Getting the lesson ready', () => 'Loading the model…'],
      modelReady: [() => 'Model ready', () => 'Turn on the camera, upload a photo or check the sample.'],
      modelError: [() => 'Could not load the model', detail],
      startingCamera: [() => 'Starting the camera', () => 'Allow access in the browser prompt.'],
      cameraError: [() => 'Could not turn on the camera', detail],
      showLetter: [(l) => `Show the letter ${l}`, () => 'Keep one whole hand in the frame.'],
      showHand: [() => 'Show your hand', () => 'Raise your hand so all fingers are visible.'],
      recognitionError: [() => 'Recognition error', detail],
      checkingPhoto: [() => 'Checking the photo', () => 'Looking for a hand in the image…'],
      noHandPhoto: [() => 'No hand in the photo', () => 'Upload a clear photo of one whole hand.'],
      cantExtract: [() => 'Could not isolate the hand', () => 'Try another photo with clearly visible fingers.'],
      photoError: [() => 'Could not check the image', detail],
      sampleError: [() => 'Could not check the sample', detail],
      allDone: [() => 'Whole alphabet completed', () => 'Pick any letter or go through the lesson again.'],
      restart: [() => 'Starting over', () => 'Show the letter А.'],
      practice: [(l) => `Show the letter ${l}`, hint],
      shapeOkNeedMotion: [() => 'Hand shape matches', (l, h) => `The letter ${l} needs a movement. Turn on the camera: ${h}`],
      shapeNotConfirmed: [() => 'Shape not confirmed yet', hint],
      showShapeFirst: [() => 'Show the hand shape first', hint],
      shapeFoundAddMotion: [() => 'Shape found — now add the movement', hint],
      showShapeAgain: [() => 'Show the shape again', () => 'Do the movement right after the shape is confirmed.'],
      seeLetterMotion: [(l) => `I see the letter ${l}`, () => 'Shape and movement match.'],
      motionNoticed: [() => 'Movement noticed', hint],
      seeLetterHold: [(l) => `I see the letter ${l}`, () => 'Hold the sign a little longer.'],
      seeLetterSample: [(l) => `I see the letter ${l}`, () => 'Sample recognized.'],
      notConfirmed: [(l) => `Letter ${l} not confirmed yet`, hint],
    },
    confidence: {
      pointCamera: () => 'Point your hand at the camera',
      noHand: () => 'No hand found',
      extraCheck: (l) => `Shape ${l} passed the extra check`,
      shExtraCheck: () => 'Shape Ш passed the extra check',
      dNeedsCircle: () => 'Shape Д found · draw a circle to complete it',
      notConfirmedYet: (l) => `Shape ${l} not confirmed yet`,
      modelScore: (_l, p) => `Model score: ${p}% · may be wrong`,
      checkingMotion: () => 'Shape found · checking the movement',
    },
    labels: {
      task: 'Your task', lessonDone: 'Lesson complete',
      doneHint: 'You finished the whole alphabet. Pick a letter in the reference to repeat it.',
      practiceCamera: 'Camera practice', on: 'On', off: 'Off',
      turnOnCamera: 'Turn on the camera to start practicing', waitingHand: 'Waiting for a hand',
      handFound: 'Hand found', handLost: 'No hand', cameraIsOn: 'Camera is on', starting: 'Starting…',
      startCamera: 'Turn on camera', uploadPhoto: 'Upload photo', checkSample: 'Check sample',
      analysis: 'Sign analysis', recognized: 'Recognized', reference: 'Sign reference · whole alphabet', letters: 'letters',
      intro: 'Pick a letter and press “Practice”. Д, Ё, Й, К, Щ, Ъ and Ь need the camera: a single photo cannot show movement.',
      needsMotion: 'Needs camera and movement', cameraOk: 'Can be checked with the camera',
      practiceLetter: 'Practice letter', images: 'Drawings', model: 'model', progress: 'Your progress',
      of: 'of', again: 'Start again', listen: 'Listen', sampleAlt: 'Sign sample', skeletonAlt: 'Outline of the detected hand',
      letter: 'Letter',
    },
    speech: {
      correct: (l) => `Correct! ${l}.`,
      next: (l) => `Now show ${l}.`,
      done: 'Well done! You finished the whole alphabet.',
    },
  },
};

export const showLetterTitle = (lang: Lang, letter: string) =>
  lang === 'kk' ? `${letter} әрпін көрсет` : lang === 'ru' ? `Покажи букву ${letter}` : `Show the letter ${letter}`;

export const movementLabels: Record<Lang, Record<string, string>> = {
  kk: { 'Д': 'Екі саусақпен шеңбер', 'Ё': 'Ары-бері бұру', 'Й': 'Қол басын бұру', 'К': 'Қол басы төмен', 'Щ': 'Қол басы төмен', 'Ъ': 'Өзіңе қарай еңкейту', 'Ь': 'Өзіңнен ары еңкейту' },
  ru: { 'Д': 'Круг двумя пальцами', 'Ё': 'Поворот туда и обратно', 'Й': 'Поворот кисти', 'К': 'Кисть вниз', 'Щ': 'Кисть вниз', 'Ъ': 'Наклон к себе', 'Ь': 'Наклон от себя' },
  en: { 'Д': 'Circle with two fingers', 'Ё': 'Turn there and back', 'Й': 'Turn the hand', 'К': 'Hand down', 'Щ': 'Hand down', 'Ъ': 'Tilt toward you', 'Ь': 'Tilt away from you' },
};

export const hints: Record<Lang, Record<string, string>> = {
  ru: {
    'А': 'Сожми пальцы в кулак. Большой палец прижми сбоку к указательному, как на образце.',
    'Б': 'Выпрями указательный палец. Средний держи рядом, согнув его верхнюю фалангу; безымянный и мизинец прижми к ладони.',
    'В': 'Раскрой ладонь и выпрями четыре пальца, держи их вместе.',
    'Г': 'Выпрями указательный палец, остальные три прижми к ладони. Большой палец отведи в сторону, кисть направь пальцами вниз.',
    'Д': 'Выпрями и соедини указательный со средним, остальные пальцы согни. Когда форма найдена, нарисуй двумя пальцами небольшой круг в воздухе.',
    'Е': 'Согни пальцы в пучок, чтобы их кончики встретились с большим пальцем.',
    'Ё': 'Сложи пальцы как для Е. Когда форма найдена, поверни кисть влево и вправо.',
    'Ж': 'Согни четыре пальца у основания примерно под прямым углом и положи их на большой палец.',
    'З': 'Выпрями указательный палец, остальные согни. Полный жест рисует указательным букву З в воздухе; пока проверяется только форма руки.',
    'И': 'Выпрями безымянный палец и мизинец вверх, слегка разведи их. Указательный и средний прижми к ладони большим пальцем.',
    'Й': 'Покажи форму И: безымянный палец и мизинец вверх, указательный и средний согнуты. Затем поверни кисть дугой в сторону.',
    'К': 'Выпрями указательный и средний пальцы, слегка разведи их. Безымянный и мизинец согни к ладони. Когда форма найдена, коротко опусти кисть вниз.',
    'Л': 'Выпрями и разведи указательный и средний пальцы. Остальные прижми к ладони, кисть направь пальцами вниз.',
    'М': 'Направь кисть пальцами вниз. Выпрями указательный, средний и безымянный, а мизинец соедини с большим пальцем.',
    'Н': 'Выпрями указательный, средний и мизинец. Безымянный соедини с большим пальцем.',
    'О': 'Соедини указательный и большой пальцы в кольцо. Средний, безымянный и мизинец выпрями.',
    'П': 'Выпрями и соедини указательный со средним, остальные согни. Кисть направь пальцами вниз.',
    'Р': 'Соедини средний и большой пальцы в кольцо. Указательный, безымянный и мизинец выпрями.',
    'С': 'Слегка согни все пальцы, чтобы кисть напоминала букву С.',
    'Т': 'Направь кисть пальцами вниз. Указательный, средний и безымянный выпрями и соедини; мизинец согни.',
    'У': 'Выпрями мизинец и отведи большой палец в сторону. Остальные пальцы согни.',
    'Ф': 'Согни четыре пальца у основания примерно под прямым углом; большой палец прижми сбоку, как на образце.',
    'Х': 'Согни указательный палец крючком. Остальные пальцы прижми к ладони.',
    'Ц': 'Выпрями и соедини указательный со средним, остальные согни. Полный жест включает короткое движение кисти вниз; пока проверяется только форма руки.',
    'Ч': 'Согни указательный и средний у основания и положи их на большой палец. Безымянный и мизинец прижми к ладони.',
    'Ш': 'Выпрями указательный, средний и безымянный. Мизинец соедини с большим пальцем.',
    'Щ': 'Покажи форму Ш. Когда форма найдена, коротко опусти всю кисть вниз.',
    'Ъ': 'Выпрями указательный палец и отведи большой в сторону, остальные согни. Затем слегка наклони кисть так, чтобы указательный палец ушёл к тебе, от камеры.',
    'Ы': 'Выпрями указательный палец и мизинец. Средний и безымянный прижми к ладони большим пальцем.',
    'Ь': 'Выпрями указательный палец и отведи большой в сторону, остальные согни. Затем слегка наклони кисть так, чтобы указательный палец ушёл от тебя, к камере.',
    'Э': 'Согни указательный и большой пальцы навстречу друг другу, образуя полукольцо. Остальные прижми к ладони.',
    'Ю': 'Подними мизинец, остальные пальцы собери к большому, как на образце.',
    'Я': 'Положи средний палец на указательный. Безымянный и мизинец прижми к ладони.',
  },
  kk: {
    'А': 'Саусақтарды жұдырыққа түй. Бас бармақты үлгідегідей сұқ саусақтың бүйіріне қыс.',
    'Б': 'Сұқ саусақты түзу ұста. Ортан саусақты қасында ұстап, жоғарғы буынын бүк; атсыз саусақ пен шынашақты алақанға қыс.',
    'В': 'Алақанды аш, төрт саусақты түзу әрі бірге ұста.',
    'Г': 'Сұқ саусақты түзу ұста, қалған үшеуін алақанға қыс. Бас бармақты бір жаққа ашып, қол басын саусақтарымен төмен бағытта.',
    'Д': 'Сұқ және ортан саусақтарды түзулеп біріктір, қалғандарын бүк. Пішін табылған соң екі саусақпен ауада кішкентай шеңбер сыз.',
    'Е': 'Саусақтарды шоқтай бүгіп, ұштарын бас бармақпен түйістір.',
    'Ё': 'Саусақтарды Е әрпіндегідей қой. Пішін табылған соң қол басын солға және оңға бұр.',
    'Ж': 'Төрт саусақты негізінен шамамен тік бұрышпен бүгіп, бас бармақтың үстіне қой.',
    'З': 'Сұқ саусақты түзу ұста, қалғандарын бүк. Толық ым сұқ саусақпен ауада З әрпін сызады; әзірге тек қол пішіні тексеріледі.',
    'И': 'Атсыз саусақ пен шынашақты жоғары түзулеп, сәл ашып ұста. Сұқ және ортан саусақты бас бармақпен алақанға қыс.',
    'Й': 'И пішінін көрсет: атсыз саусақ пен шынашақ жоғары, сұқ және ортан саусақ бүгулі. Содан кейін қол басын доға бойымен бір жаққа бұр.',
    'К': 'Сұқ және ортан саусақтарды түзулеп, сәл аш. Атсыз саусақ пен шынашақты алақанға бүк. Пішін табылған соң қол басын қысқа төмен түсір.',
    'Л': 'Сұқ және ортан саусақтарды түзулеп аш. Қалғандарын алақанға қысып, қол басын саусақтарымен төмен бағытта.',
    'М': 'Қол басын саусақтарымен төмен бағытта. Сұқ, ортан және атсыз саусақтарды түзу, ал шынашақты бас бармақпен түйістір.',
    'Н': 'Сұқ, ортан саусақ пен шынашақты түзу ұста. Атсыз саусақты бас бармақпен түйістір.',
    'О': 'Сұқ саусақ пен бас бармақты сақина етіп түйістір. Ортан, атсыз саусақ пен шынашақты түзу ұста.',
    'П': 'Сұқ және ортан саусақтарды түзулеп біріктір, қалғандарын бүк. Қол басын саусақтарымен төмен бағытта.',
    'Р': 'Ортан саусақ пен бас бармақты сақина етіп түйістір. Сұқ, атсыз саусақ пен шынашақты түзу ұста.',
    'С': 'Қол басы С әрпіне ұқсайтындай барлық саусақтарды сәл бүк.',
    'Т': 'Қол басын саусақтарымен төмен бағытта. Сұқ, ортан және атсыз саусақтарды түзулеп біріктір; шынашақты бүк.',
    'У': 'Шынашақты түзулеп, бас бармақты бір жаққа аш. Қалған саусақтарды бүк.',
    'Ф': 'Төрт саусақты негізінен шамамен тік бұрышпен бүк; бас бармақты үлгідегідей бүйірден қыс.',
    'Х': 'Сұқ саусақты ілмек сияқты бүк. Қалған саусақтарды алақанға қыс.',
    'Ц': 'Сұқ және ортан саусақтарды түзулеп біріктір, қалғандарын бүк. Толық ымда қол басы қысқа төмен қозғалады; әзірге тек қол пішіні тексеріледі.',
    'Ч': 'Сұқ және ортан саусақты негізінен бүгіп, бас бармақтың үстіне қой. Атсыз саусақ пен шынашақты алақанға қыс.',
    'Ш': 'Сұқ, ортан және атсыз саусақтарды түзу ұста. Шынашақты бас бармақпен түйістір.',
    'Щ': 'Ш пішінін көрсет. Пішін табылған соң бүкіл қол басын қысқа төмен түсір.',
    'Ъ': 'Сұқ саусақты түзулеп, бас бармақты бір жаққа аш, қалғандарын бүк. Содан кейін сұқ саусақ өзіңе қарай, камерадан ары кететіндей қол басын сәл еңкейт.',
    'Ы': 'Сұқ саусақ пен шынашақты түзу ұста. Ортан және атсыз саусақты бас бармақпен алақанға қыс.',
    'Ь': 'Сұқ саусақты түзулеп, бас бармақты бір жаққа аш, қалғандарын бүк. Содан кейін сұқ саусақ өзіңнен ары, камераға қарай кететіндей қол басын сәл еңкейт.',
    'Э': 'Сұқ саусақ пен бас бармақты бір-біріне қарай бүгіп, жартылай сақина жаса. Қалғандарын алақанға қыс.',
    'Ю': 'Шынашақты көтер, қалған саусақтарды үлгідегідей бас бармаққа жина.',
    'Я': 'Ортан саусақты сұқ саусақтың үстіне қой. Атсыз саусақ пен шынашақты алақанға қыс.',
  },
  en: {
    'А': 'Make a fist. Press the thumb against the side of the index finger, as in the sample.',
    'Б': 'Straighten the index finger. Keep the middle finger next to it with its top joint bent; press the ring and little fingers to the palm.',
    'В': 'Open the palm and straighten four fingers, keeping them together.',
    'Г': 'Straighten the index finger and press the other three to the palm. Move the thumb aside and point the fingers down.',
    'Д': 'Straighten and join the index and middle fingers, bend the rest. Once the shape is found, draw a small circle in the air with the two fingers.',
    'Е': 'Bend the fingers into a bunch so their tips meet the thumb.',
    'Ё': 'Make the Е shape. Once it is found, turn the hand left and right.',
    'Ж': 'Bend four fingers at the base at roughly a right angle and rest them on the thumb.',
    'З': 'Straighten the index finger and bend the rest. The full sign draws a З in the air; for now only the hand shape is checked.',
    'И': 'Raise the ring and little fingers and spread them slightly. Hold the index and middle fingers to the palm with the thumb.',
    'Й': 'Make the И shape: ring and little fingers up, index and middle bent. Then turn the hand sideways in an arc.',
    'К': 'Straighten the index and middle fingers and spread them slightly. Bend the ring and little fingers. Once the shape is found, briefly drop the hand.',
    'Л': 'Straighten and spread the index and middle fingers. Press the rest to the palm and point the fingers down.',
    'М': 'Point the fingers down. Straighten the index, middle and ring fingers and touch the little finger to the thumb.',
    'Н': 'Straighten the index, middle and little fingers. Touch the ring finger to the thumb.',
    'О': 'Join the index finger and thumb into a ring. Straighten the middle, ring and little fingers.',
    'П': 'Straighten and join the index and middle fingers, bend the rest. Point the fingers down.',
    'Р': 'Join the middle finger and thumb into a ring. Straighten the index, ring and little fingers.',
    'С': 'Bend all fingers slightly so the hand looks like the letter С.',
    'Т': 'Point the fingers down. Straighten and join the index, middle and ring fingers; bend the little finger.',
    'У': 'Straighten the little finger and move the thumb aside. Bend the other fingers.',
    'Ф': 'Bend four fingers at the base at roughly a right angle; press the thumb to the side, as in the sample.',
    'Х': 'Bend the index finger into a hook. Press the other fingers to the palm.',
    'Ц': 'Straighten and join the index and middle fingers, bend the rest. The full sign includes a short drop of the hand; for now only the shape is checked.',
    'Ч': 'Bend the index and middle fingers at the base and rest them on the thumb. Press the ring and little fingers to the palm.',
    'Ш': 'Straighten the index, middle and ring fingers. Touch the little finger to the thumb.',
    'Щ': 'Make the Ш shape. Once it is found, briefly drop the whole hand.',
    'Ъ': 'Straighten the index finger, move the thumb aside and bend the rest. Then tilt the hand so the index finger moves toward you, away from the camera.',
    'Ы': 'Straighten the index and little fingers. Hold the middle and ring fingers to the palm with the thumb.',
    'Ь': 'Straighten the index finger, move the thumb aside and bend the rest. Then tilt the hand so the index finger moves away from you, toward the camera.',
    'Э': 'Bend the index finger and thumb toward each other to form a half ring. Press the rest to the palm.',
    'Ю': 'Raise the little finger and gather the others to the thumb, as in the sample.',
    'Я': 'Cross the middle finger over the index finger. Press the ring and little fingers to the palm.',
  },
};
