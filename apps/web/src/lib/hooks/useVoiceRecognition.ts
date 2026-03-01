"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Web Speech API type declarations (vendor-prefixed)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useCallback, useRef, useEffect } from "react";

// Language map from i18n codes to Web Speech API BCP-47 codes
const LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

interface UseVoiceRecognitionOptions {
  lang?: string; // i18n language code (en, hi, as)
  onResult?: (transcript: string) => void;
  continuous?: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceRecognition({
  lang = "en",
  onResult,
  continuous = false,
}: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    setTranscript("");

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = LANG_MAP[lang] || "en-IN";
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show interim results while speaking
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      // When final result is available, fire callback
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are not real errors
      if (event.error === "no-speech" || event.error === "aborted") {
        setIsListening(false);
        return;
      }
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, continuous, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    error,
  };
}
