export type SpeakOptions = {
  lang?: string; // e.g. "en-US", "sl-SI"
  voiceName?: string; // exact voice name if you want a specific one
  rate?: number; // 0.1–10
  pitch?: number; // 0–2
  volume?: number; // 0–1
  cancelPrevious?: boolean; // default true
};

export class TextToSpeechUtil {
  private synth: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesReady: Promise<SpeechSynthesisVoice[]>;

  constructor() {
    if (typeof window === 'undefined') {
      this.synth = null;
      this.voicesReady = Promise.resolve([]);
      return;
    }
    this.synth = window.speechSynthesis || null;

    // iOS often returns [] first; wait for onvoiceschanged or retry a few times.
    this.voicesReady = new Promise((resolve) => {
      if (!this.synth) return resolve([]);
      const attempt = (tries = 60) => {
        const list = this.synth!.getVoices();
        if (list && list.length) {
          this.voices = list;
          resolve(list);
        } else if (tries > 0) {
          setTimeout(() => attempt(tries - 1), 100);
        } else {
          // last resort: resolve even if empty
          this.voices = [];
          resolve([]);
        }
      };

      // Some browsers fire this only once voices are ready.
      this.synth.onvoiceschanged = () => {
        const list = this.synth!.getVoices();
        if (list && list.length) {
          this.voices = list;
          resolve(list);
        }
      };

      attempt();
    });
  }

  private chooseVoice(opts: SpeakOptions): SpeechSynthesisVoice | undefined {
    const { voiceName, lang } = opts;

    if (voiceName) return this.voices.find((v) => v.name === voiceName);

    if (lang) {
      // Prefer exact lang, else startsWith match (e.g., "en" matches "en-US")
      return (
        this.voices.find((v) => v.lang === lang) ||
        this.voices.find((v) =>
          v.lang?.toLowerCase().startsWith(lang.toLowerCase())
        )
      );
    }
    // Fallback to default voice
    const voiceUri = 'Google US English Male';

    return this.voices.find((v) => v.voiceURI === voiceUri) || this.voices[0];
  }

  /**
   * Speak text. IMPORTANT on iOS: call this from a user gesture (e.g. a button click).
   * Returns a Promise that resolves when speaking ends or rejects on error.
   */
  async speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    if (!text?.trim()) return;
    if (!this.synth) return;

    await this.voicesReady;

    const { rate = 1, pitch = 1, volume = 1, cancelPrevious = true } = opts;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;

    const voice = this.chooseVoice(opts);

    if (voice) utter.voice = voice;
    if (opts.lang) utter.lang = opts.lang;

    // iOS/WebKit quirks:
    // 1) Keep resuming periodically; WebKit can auto-pause the queue.
    // 2) Defer the speak() call to the next microtask/tick to avoid first-utterance drop.
    // 3) Ensure we cancel previous if requested.
    return new Promise<void>((resolve, reject) => {
      let resumeTimer: number | undefined;

      const clearTimers = () => {
        if (resumeTimer) window.clearInterval(resumeTimer);
        resumeTimer = undefined;
      };

      utter.onend = () => {
        clearTimers();
        resolve();
      };
      utter.onerror = (e) => {
        clearTimers();
        reject(e.error || new Error('speech synthesis error'));
      };

      // Periodically try to resume (iOS bug)
      resumeTimer = window.setInterval(() => {
        try {
          // Calling resume() repeatedly is safe; does nothing if already running.
          this.synth!.resume();
        } catch {
          /* ignore */
        }
      }, 250);

      if (cancelPrevious) this.synth?.cancel();

      // Give WebKit a moment so voices/engine settle
      setTimeout(() => {
        try {
          this.synth?.speak(utter);
        } catch (err) {
          clearTimers();
          reject(err);
        }
      }, 0);
    });
  }

  /** Stop any ongoing speech. */
  stop() {
    this.synth?.cancel();
  }
}
