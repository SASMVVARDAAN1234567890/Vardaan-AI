// Voice Utilities for Speech-to-Text and Text-to-Speech

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // defaults to English (India) with Hindi accents

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (this.onResultCallback && text) {
          this.onResultCallback(text, !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.onErrorCallback?.('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          // Ignore silence
        } else {
          this.onErrorCallback?.(`Voice input error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEndCallback?.();
      };
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public setLanguage(lang: 'en-IN' | 'hi-IN' | 'en-US') {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start({
    onResult,
    onError,
    onEnd,
    lang = 'en-IN',
  }: {
    onResult: (text: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    lang?: 'en-IN' | 'hi-IN' | 'en-US';
  }) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.recognition.lang = lang;

    try {
      this.isListening = true;
      this.recognition.start();
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  public getActive(): boolean {
    return this.isListening;
  }
}

// Clean markdown for text to speech
function cleanMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ') // remove large code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/>\s+/g, '') // blockquotes
    .replace(/[-*+]\s+/g, '') // list items
    .replace(/\n{2,}/g, '. ') // double newlines
    .replace(/\n/g, ' ')
    .trim();
}

export class SpeechSpeaker {
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStateChangeCallback?: (isSpeaking: boolean) => void;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(
    text: string,
    onStateChange?: (isSpeaking: boolean) => void
  ) {
    if (!this.isSupported()) return;

    this.stop(); // Stop any previous speech
    this.onStateChangeCallback = onStateChange;

    const cleanedText = cleanMarkdownForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    this.currentUtterance = utterance;

    // Detect if text contains Devanagari Hindi characters
    const hasHindiChars = /[\u0900-\u097F]/.test(cleanedText);
    const voices = window.speechSynthesis.getVoices();

    if (hasHindiChars) {
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      const naturalVoice = voices.find(
        v => (v.lang.startsWith('en-IN') || v.lang.startsWith('en-US')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onStateChangeCallback?.(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onStateChangeCallback?.(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onStateChangeCallback?.(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onStateChangeCallback?.(false);
    }
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechRecognizer = new SpeechRecognizer();
export const speechSpeaker = new SpeechSpeaker();
