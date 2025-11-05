export class TextToSpeechUtil {
  speak(text: string) {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;

    if (!synth) return;

    const u = new SpeechSynthesisUtterance(text);

    // tweak to taste
    u.rate = 1;
    u.pitch = 1;

    // cancel anything queued so it plays immediately
    synth.cancel();
    synth.speak(u);
  }
}
