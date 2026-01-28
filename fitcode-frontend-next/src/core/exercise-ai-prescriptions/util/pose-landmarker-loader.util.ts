import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { RefObject } from 'react';

import { lib } from '@/lib';
import { PoseModel } from '../enum/pose-model.enum';
import {
  POSE_LANDMARKER_LITE_PATH,
  POSE_LANDMARKER_HEAVY_PATH,
  POSE_LANDMARKER_FULL_PATH,
} from '../const/pose-landmarker-paths';

let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null;

export async function preloadPoseLandmarker(
  model:
    | PoseModel.MEDIAPIPE_LITE
    | PoseModel.MEDIAPIPE_FULL
    | PoseModel.MEDIAPIPE_HEAVY,
  forceReload?: boolean,
  imageMode: boolean = false
) {
  if (!poseLandmarkerPromise || forceReload) {
    poseLandmarkerPromise = (async () => {
      const modelAssetPath =
        model === PoseModel.MEDIAPIPE_LITE
          ? POSE_LANDMARKER_LITE_PATH
          : model === PoseModel.MEDIAPIPE_HEAVY
            ? POSE_LANDMARKER_HEAVY_PATH
            : POSE_LANDMARKER_FULL_PATH;

      const vision = await FilesetResolver.forVisionTasks('/wasm');

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: imageMode ? 'IMAGE' : 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return landmarker;
    })();
  }

  return poseLandmarkerPromise;
}

export async function getPoseLandmarker(
  model:
    | PoseModel.MEDIAPIPE_LITE
    | PoseModel.MEDIAPIPE_FULL
    | PoseModel.MEDIAPIPE_HEAVY,
  loadedPoseLandmarkerTimestampRef: RefObject<Date | null>,
  forceReload?: boolean,
  imageMode: boolean = false
) {
  const lm = await preloadPoseLandmarker(model, forceReload, imageMode);

  loadedPoseLandmarkerTimestampRef.current = new Date();

  return lm;
}
