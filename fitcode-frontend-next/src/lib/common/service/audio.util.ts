export class AudioUtil {
  playSound(path: string) {
    const audio = new Audio(path);
    audio.play().catch((err) => {
      console.error('Error playing audio:', err);
    });
  }
}
