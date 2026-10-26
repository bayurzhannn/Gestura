import { speechTags, type Lang } from './i18n';

// Many systems ship without a Kazakh voice; Kazakh Cyrillic read by a Russian
// voice is understandable, so fall back to it rather than staying silent.
const fallbacks: Record<Lang, Lang[]> = { kk: ['kk', 'ru'], ru: ['ru'], en: ['en'] };

function pickVoice(lang: Lang) {
  const voices = window.speechSynthesis.getVoices();
  for (const candidate of fallbacks[lang]) {
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(candidate));
    if (voice) return voice;
  }
  return null;
}

export function speak(text: string, lang: Lang) {
  if (!text || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  utterance.lang = voice?.lang ?? speechTags[lang];
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Voices load asynchronously in Chrome; touching the list early warms it up.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices();
