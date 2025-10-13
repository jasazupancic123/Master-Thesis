export const playSuccessSound = () => {
  const audio = new Audio('/sounds/face-recognition-success.wav');
  audio.play().catch(() => {});
};
