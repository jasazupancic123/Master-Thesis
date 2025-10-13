import { SetState } from '@/common/type/state.type';
import { RefObject } from 'react';
import { Step } from '@/common/enum/step.enum';
import { Landmark, Scored } from '../types/landmark.type';
import { FaceCaptures, FacePreviews } from '../types/face.type';

// Load Mediapipe Tasks Vision dynamically in the browser
export async function createDetector(baseAssetUrl: string, modelUrl: string) {
  const vision = await import('@mediapipe/tasks-vision');
  const { FaceLandmarker, FilesetResolver } = vision;

  const filesetResolver = await FilesetResolver.forVisionTasks(baseAssetUrl);

  const detector = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: modelUrl,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  return detector;
}

// Capture current video frame as Blob + preview data URL
export const captureFrame = async (state: {
  videoRef: RefObject<HTMLVideoElement | null>;
  viewport: { w: number; h: number };
}) => {
  const { videoRef, viewport } = state;

  const video = videoRef.current!;
  const W = video.videoWidth || viewport.w || 1280;
  const H = video.videoHeight || viewport.h || 720;
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(video, 0, 0, W, H);
  const blob: Blob = await new Promise((res) =>
    tmp.toBlob((b) => res(b!), 'image/jpeg', 0.95)
  );
  const dataUrl = tmp.toDataURL('image/jpeg', 0.92);
  return { blob, dataUrl };
};

// Pause/resume processing (pause video; optionally stop camera tracks)
export const pauseProcessing = (state: {
  videoRef: RefObject<HTMLVideoElement | null>;
  runningRef: RefObject<boolean>;
  rafRef: RefObject<number | null>;
  stopTracks?: boolean;
}) => {
  const { videoRef, runningRef, rafRef, stopTracks = false } = state;

  stopLoop({
    runningRef,
    rafRef,
  });

  const v = videoRef.current;

  if (v) {
    try {
      v.pause();
    } catch {}
    if (stopTracks && v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
  }
};

export const resumeProcessing = async (state: {
  videoRef: RefObject<HTMLVideoElement | null>;
  runningRef: RefObject<boolean>;
  rafRef: RefObject<number | null>;
  tick: () => void;
}) => {
  const { videoRef, runningRef, rafRef, tick } = state;

  const v = videoRef.current;

  if (v) {
    try {
      await v.play();
    } catch {}
  }

  startLoop({
    runningRef,
    rafRef,
    tick,
  });
};

export const reset = (state: {
  setCaptures: SetState<FaceCaptures>;
  setPreviews: SetState<FacePreviews>;
  stepRef: RefObject<Step>;
  isDoneRef: RefObject<boolean>;
  setIsActive: SetState<boolean>;
}) => {
  const { setCaptures, setPreviews, stepRef, isDoneRef, setIsActive } = state;

  setCaptures({});
  setPreviews({});
  stepRef.current = Step.FRONT;
  isDoneRef.current = false;
  setIsActive(true);
};

// Start/stop the RAF loop
export const startLoop = (state: {
  runningRef: RefObject<boolean>;
  rafRef: RefObject<number | null>;
  tick: () => void;
}) => {
  const { runningRef, rafRef, tick } = state;

  if (!runningRef.current) runningRef.current = true;
  if (!rafRef.current) {
    rafRef.current = requestAnimationFrame(tick);
  }
};

export const stopLoop = (state: {
  runningRef: RefObject<boolean>;
  rafRef: RefObject<number | null>;
}) => {
  const { runningRef, rafRef } = state;

  runningRef.current = false;
  if (rafRef.current) cancelAnimationFrame(rafRef.current);

  rafRef.current = null;
};

// ====== Helper math for pose checks ======
export function computeBBoxFromLandmarks(
  landmarks: { x: number; y: number }[]
) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX,
    h: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function estimateYawFromNose(landmarks: Landmark[]): number {
  const bbox = computeBBoxFromLandmarks(landmarks);

  const noseFromIndex: Landmark | undefined = landmarks[1];

  const scoredBest: Scored | null = noseFromIndex
    ? null
    : landmarks.reduce<Scored | null>((best, p) => {
        const score = Math.abs(p.x - bbox.cx) + Math.abs(p.y - bbox.cy);
        if (best === null || score < best._score) {
          return { ...p, _score: score };
        }
        return best;
      }, null);

  const nose: Landmark = noseFromIndex ?? scoredBest ?? landmarks[0];

  const offset = (nose.x - bbox.cx) / Math.max(0.0001, bbox.w);
  return offset * 90; // heuristic degrees
}
