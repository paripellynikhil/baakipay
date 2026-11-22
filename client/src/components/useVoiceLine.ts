import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import type { Lang } from '../i18n/translations';

// Minimal typings for the Web Speech API (not present in every TS lib.dom version).
interface SpeechAlternativeLike {
  transcript: string;
}
interface SpeechResultLike extends ArrayLike<SpeechAlternativeLike> {
  isFinal: boolean;
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
interface RecognizerLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognizerCtor = new () => RecognizerLike;

const RECOGNITION_LANG: Record<Lang, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };

export function getRecognizerCtor(): RecognizerCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Wraps one dictation session. Calls onPhrase with each final transcript; toggle() starts or stops.
// onError receives the Web Speech error code (e.g. 'not-allowed' when mic permission is denied).
export function useVoiceLine(onPhrase: (text: string) => void, onError: (code?: string) => void) {
  const { lang } = useI18n();
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognizerLike | null>(null);
  const phraseRef = useRef(onPhrase);
  const errorRef = useRef(onError);
  useEffect(() => {
    phraseRef.current = onPhrase;
    errorRef.current = onError;
  }, [onPhrase, onError]);

  useEffect(() => () => recRef.current?.stop(), []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognizerCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = RECOGNITION_LANG[lang];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const parts: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal && result.length > 0) parts.push(result[0].transcript);
      }
      if (parts.length > 0) phraseRef.current(parts.join(' '));
    };
    rec.onerror = (e) => {
      errorRef.current(e.error);
      setListening(false);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return { listening, toggle };
}
