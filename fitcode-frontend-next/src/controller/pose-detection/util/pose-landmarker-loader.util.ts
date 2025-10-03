// lib/pose-landmarker.singleton.ts
'use client';

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null;

export async function preloadPoseLandmarker() {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const modelAssetPath =
        '/models/pose_landmarker/pose_landmarker_full.task'; // full
      // const modelAssetPath = '/models/pose_landmarker/pose_landmarker_heavy.task'; // heavy

      const vision = await FilesetResolver.forVisionTasks('/wasm');

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: true,
      });

      return landmarker;
    })();
  }

  return poseLandmarkerPromise;
}

export async function getPoseLandmarker() {
  // ensures a single instance; call this where you need it
  return await preloadPoseLandmarker();
}
