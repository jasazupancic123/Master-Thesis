import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';
import type { Theme } from '@mui/material';
import type { RefObject } from 'react';

import type { SetState } from '@/common/type/state.type';
import type { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from '@/controller/pose-detection/const/pose-detection-constrains.const';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import type { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/controller/pose-detection/enum/rep-state';
import { PoseDetectionService } from '@/controller/pose-detection/pose-detection.service';
import { RepDetectionService } from '@/controller/pose-detection/rep-detection.service';
import type { ExerciseDetectionData } from '@/controller/pose-detection/type/exercise-start-condition.type';
import type { Keypoint } from '@/controller/pose-detection/type/keypoint.type';
import type { Rep } from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import { PoseDetectionGraphsUtil } from '@/controller/pose-detection/util/pose-detection-graphs-util';

export async function loadModel(state: {
  setPoseLandmarker: SetState<PoseLandmarker | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
}) {
  const { setPoseLandmarker, videoRef, canvasRef, drawingUtilsRef } = state;

  // const modelAssetPath = '/models/pose_landmarker/pose_landmarker_lite.task'; // lite
  const modelAssetPath = '/models/pose_landmarker/pose_landmarker_full.task'; // full
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

  setPoseLandmarker(landmarker);

  if (!videoRef?.current || !canvasRef?.current) return;

  const video = videoRef.current!;
  const canvas = canvasRef.current!;

  // Get native resolution from video feed
  const w = video.videoWidth;
  const h = video.videoHeight;

  // Match canvas drawing resolution to video
  canvas.width = w;
  canvas.height = h;

  // Match CSS display size (this ensures it visually fits)
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  video.style.width = '100%';
  video.style.height = '100%';

  drawingUtilsRef.current = new DrawingUtils(canvas.getContext('2d')!);
}

export function enableCam(state: {
  poseLandmarker: PoseLandmarker | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  predictWebcam: () => Promise<void>;
  setError: SetState<string | null>;
}) {
  const { poseLandmarker, videoRef, predictWebcam, setError } = state;

  if (!poseLandmarker) return;

  // Activate the webcam stream.
  if (videoRef !== null && videoRef.current !== null) {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      })
      .then((stream) => {
        videoRef.current!.srcObject = stream;
        videoRef.current!.addEventListener('loadeddata', predictWebcam);
      })
      .catch((err) => {
        setError(err || 'Error accessing webcam');
      });
  }
}

export const predictWebcam = async (state: {
  statusRef: RefObject<DetectionStatus>;
  statusMessage: RefObject<string>;
  canProceedIntoReadyStateRef: RefObject<boolean>;
  repStateRef: RefObject<RepState>;
  model: PoseModel;
  poseLandmarker: PoseLandmarker | null;
  keypointHistory: KeypointHistory;
  keypointBuffer: KeypointHistory;
  constantKeypointHistory: KeypointHistory;
  currentRepRef: RefObject<Rep | null>;
  recordedRepsRef: RefObject<Rep[]>;
  exerciseDetectionData: ExerciseDetectionData;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
  canvasCtxRef: RefObject<CanvasRenderingContext2D | null>;
  prevFrameTimeRef: RefObject<number | null>;
  lastVideoTimeRef: RefObject<number>;
  isMobile: boolean;
  frameCountRef: RefObject<number>;
  initedFirstFrameInRecordingMode: RefObject<boolean>;
  avgFps: RefObject<{ value: number; count: number } | null>;
  normDomainRef: RefObject<{ min: number; max: number } | null>;
  romCanvasRef: RefObject<HTMLCanvasElement | null>;
  tempoCanvasRef: RefObject<HTMLCanvasElement | null>;
  theme: Theme;
  centerPosRef: RefObject<{ x: number; y: number } | null>;
  recordingTimestampRef: RefObject<Date | null>;
  setFps: SetState<number | null>;
  finishAiDetection: () => Promise<void>;
}) => {
  const {
    statusRef,
    statusMessage,
    canProceedIntoReadyStateRef,
    repStateRef,
    model,
    poseLandmarker,
    keypointHistory,
    keypointBuffer,
    constantKeypointHistory,
    currentRepRef,
    recordedRepsRef,
    exerciseDetectionData,
    videoRef,
    canvasRef,
    drawingUtilsRef,
    canvasCtxRef,
    prevFrameTimeRef,
    lastVideoTimeRef,
    isMobile,
    frameCountRef,
    initedFirstFrameInRecordingMode,
    avgFps,
    normDomainRef,
    romCanvasRef,
    tempoCanvasRef,
    theme,
    centerPosRef,
    recordingTimestampRef,
    setFps,
    finishAiDetection,
  } = state;

  if (statusRef.current === DetectionStatus.STOPPED) {
    await finishAiDetection();
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvasCtxRef.current;
  const drawingUtils = drawingUtilsRef.current;

  if (!video || !canvas || !ctx || !poseLandmarker || !drawingUtils) return;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (
    !videoWidth ||
    !videoHeight ||
    Number.isNaN(videoWidth) ||
    Number.isNaN(videoHeight)
  ) {
    return;
  }

  // Set actual drawing resolution
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  // Optional: scale the visible canvas with CSS
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  video.width = videoWidth;
  video.height = videoHeight;

  const startTimeMs = performance.now();

  if (prevFrameTimeRef.current) {
    const delta = startTimeMs - prevFrameTimeRef.current;
    const instFps = Math.round(1000 / delta);

    setFps(instFps);

    if (!avgFps.current) avgFps.current = { value: instFps, count: 1 };
    else {
      avgFps.current = {
        value:
          (avgFps.current.value * avgFps.current.count + instFps) /
          (avgFps.current.count + 1),
        count: avgFps.current.count + 1,
      };
    }
  }

  if (lastVideoTimeRef.current !== video.currentTime) {
    lastVideoTimeRef.current = video.currentTime;
    prevFrameTimeRef.current = startTimeMs;

    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      frameCountRef.current += 1;

      const keypoints = KeypointUtil.getDesiredKeypointsByModel(
        result.worldLandmarks[0], // unit: m, origin: center of hips
        model,
        new Date(),
        frameCountRef.current
      );

      insertKeypointsIntoBuffers({
        statusRef,
        keypointHistory,
        keypointBuffer,
        constantKeypointHistory: constantKeypointHistory,
        repStateRef,
        currentRepBuffer: currentRepRef.current?.buffer,
        keypoints,
        isMobile,
        avgFps,
      });

      PoseDetectionService.checkStatus({
        statusRef,
        canProceedIntoReadyStateRef,
        repStateRef,
        keypoints,
        keypointBuffer,
        exerciseStartConditions: exerciseDetectionData.conditions,
        avgFps: avgFps.current,
        keypointHistory,
        recordingTimestampRef,
        statusMessage,
      });

      if (
        statusRef.current === DetectionStatus.RECORDING &&
        repStateRef.current.status !== RepStatus.NONE
      ) {
        RepDetectionService.checkRepStatus({
          repStateRef,
          currentRepRef,
          recordedRepsRef,
          currentFrameKeypoints: keypoints,
          keypointHistory: keypointHistory,
          keypointId: exerciseDetectionData.romKeypointId,
          valueType: exerciseDetectionData.romValueType,
          direction: exerciseDetectionData.romStartDirection,
          exerciseStartConditions: exerciseDetectionData.conditions,
          avgFps: avgFps.current,
          initedFirstFrameInRecordingMode, // this is used to track if no rep was detected yet
        });
      }

      if (
        (repStateRef.current.status === RepStatus.IN_REP &&
          currentRepRef.current) ||
        recordedRepsRef.current.length > 0
      ) {
        PoseDetectionGraphsUtil.renderROMAndTempoGraphs({
          exerciseDetectionData,
          currentRepRef,
          recordedRepsRef,
          romCanvasRef,
          tempoCanvasRef,
          normDomainRef,
          theme,
        });
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Flip horizontally to mirror webcam
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      let smoothedCenter: {
        x: number;
        y: number;
        z: number;
        visibility: number;
      } | null = null;

      for (const landmark of result.landmarks) {
        const keepKeypointsIndexes = [11, 12, 23, 24]; // shoulder & hip indices

        // pick only those 4
        const kept = landmark.filter((_, i) =>
          keepKeypointsIndexes.includes(i)
        );

        if (kept.length > 0) {
          const cx = kept.reduce((s, k) => s + k.x, 0) / kept.length;
          const cy = kept.reduce((s, k) => s + k.y, 0) / kept.length;
          const cz = kept.reduce((s, k) => s + (k.z ?? 0), 0) / kept.length;
          const cv =
            kept.reduce((s, k) => s + (k.visibility ?? 0), 0) / kept.length;

          const current = { x: cx, y: cy, z: cz, visibility: cv };

          // smoothing factor (0.2 = 20% new, 80% old)
          const alpha = 10;
          if (smoothedCenter) {
            smoothedCenter = {
              x: smoothedCenter.x * (1 - alpha) + current.x * alpha,
              y: smoothedCenter.y * (1 - alpha) + current.y * alpha,
              z: smoothedCenter.z * (1 - alpha) + current.z * alpha,
              visibility:
                smoothedCenter.visibility * (1 - alpha) +
                current.visibility * alpha,
            };
          } else {
            smoothedCenter = current;
          }

          centerPosRef.current = { x: smoothedCenter.x, y: smoothedCenter.y };

          // drawingUtils.drawLandmarks([smoothedCenter]);
        }
        // drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
      }

      ctx.restore();
    });
  }

  window.requestAnimationFrame(predictWebcam.bind(null, state));
};

function insertKeypointsIntoBuffers(state: {
  statusRef: RefObject<DetectionStatus>;
  keypointHistory: KeypointHistory;
  keypointBuffer: KeypointHistory;
  constantKeypointHistory: KeypointHistory;
  repStateRef: RefObject<RepState>;
  currentRepBuffer?: KeypointHistory;
  keypoints: Keypoint[];
  isMobile: boolean;
  avgFps: RefObject<{ value: number; count: number } | null>;
}) {
  const {
    statusRef,
    keypointHistory,
    keypointBuffer,
    constantKeypointHistory,
    repStateRef,
    currentRepBuffer,
    keypoints,
    isMobile,
    avgFps,
  } = state;

  // if we are in recording state, don't update the keypointHistory's size
  if (statusRef.current === DetectionStatus.RECORDING) {
    keypointHistory.insertFrame(
      keypoints,
      avgFps.current,
      POSE_DETECTION_CONSTRAINTS.KEEP_KEYPOINT_HISTORY_DURING_RECORDING_MS /
        1000
    );

    constantKeypointHistory.insertFrame(keypoints); // never cut, always all history
  } else {
    // only keep KEYPOINT_BUFFER_DURATION_MS of frames in history
    keypointHistory.insertFrame(
      keypoints,
      avgFps.current,
      POSE_DETECTION_CONSTRAINTS.KEYPOINT_BUFFER_DURATION_MS / 1000
    );
  }

  // If rep has started, then add frames to current rep buffer
  if (repStateRef.current.status === RepStatus.IN_REP && currentRepBuffer) {
    currentRepBuffer.insertFrame(keypoints);
  }

  const hasWeakFps = avgFps.current ? avgFps.current.value <= 15 : isMobile;

  keypointBuffer.insertFrame(keypoints, avgFps.current, hasWeakFps ? 2 : 3); // keep 2 or 3 seconds of history
}

export function getStatusMessage(status: DetectionStatus) {
  return STATUS_MESSAGES[status - 1];
}
