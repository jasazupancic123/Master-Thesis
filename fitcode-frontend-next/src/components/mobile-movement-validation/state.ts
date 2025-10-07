import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { DrawingUtils, FilesetResolver } from '@mediapipe/tasks-vision';
import type { RefObject } from 'react';

import { EXERCISE_TIMES_ROUNDING_STEP_S } from './mobile-movement-validation';
import type { CommonService } from '@/common/service/common.service';
import type { SetState } from '@/common/type/state.type';
import type { FrameBitmapBuffer } from '@/controller/pose-detection/class/frame-bitmap-buffer';
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

export async function setupVideoAndContex(state: {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
}) {
  const { videoRef, canvasRef, drawingUtilsRef } = state;

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
  setError: SetState<string | null>;
  predictWebcam: () => Promise<void>;
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
  stillnessCountdownRef: RefObject<Date | null>;
  canProceedIntoReadyStateRef: RefObject<boolean>;
  repStateRef: RefObject<RepState>;
  model: PoseModel;
  poseLandmarker: PoseLandmarker | null;
  keypointHistory: KeypointHistory;
  keypointBuffer: KeypointHistory;
  constantKeypointHistory: KeypointHistory;
  frameBitmapBufferRef: RefObject<FrameBitmapBuffer>;
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
  centerPosRef: RefObject<{ x: number; y: number } | null>;
  recordingTimestampRef: RefObject<Date | null>;
  isCurrentlySavingImageRef: RefObject<boolean>;
  canExitWhenImageIsDoneSavingRef: RefObject<boolean>;
  setFps: SetState<number | null>;
  finishAiDetection: () => Promise<void>;
  setRepCount: SetState<number>;
  setStartedExitTimeout: SetState<boolean>;
}) => {
  const {
    statusRef,
    statusMessage,
    stillnessCountdownRef,
    canProceedIntoReadyStateRef,
    repStateRef,
    model,
    poseLandmarker,
    keypointHistory,
    keypointBuffer,
    constantKeypointHistory,
    frameBitmapBufferRef,
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
    centerPosRef,
    recordingTimestampRef,
    isCurrentlySavingImageRef,
    canExitWhenImageIsDoneSavingRef,
    setFps,
    finishAiDetection,
    setRepCount,
    setStartedExitTimeout,
  } = state;

  if (statusRef.current === DetectionStatus.STOPPED) {
    if (isCurrentlySavingImageRef.current === true) {
      canExitWhenImageIsDoneSavingRef.current = true;
      setStartedExitTimeout(true);
    } else {
      await finishAiDetection();
    }
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvasCtxRef.current;
  const drawingUtils = drawingUtilsRef.current;

  if (!video || !canvas || !ctx || !poseLandmarker || !drawingUtils) return;

  if (
    !frameBitmapBufferRef.current.canvas ||
    !frameBitmapBufferRef.current.canvas?.height ||
    !frameBitmapBufferRef.current.canvas?.width
  ) {
    frameBitmapBufferRef.current.setCanvasWidthHeight(document, video);
  }

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
  if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  let startTimeMs = performance.now();

  if (
    prevFrameTimeRef.current !== null &&
    startTimeMs <= prevFrameTimeRef.current
  ) {
    startTimeMs = prevFrameTimeRef.current + 0.01;
  }

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
    // --- FOR TESTING PURPOSES ONLY ---
    // const newRep = {
    //   repNumber: 1,
    //   startValue: 1,
    //   startValueFrameNum: 1,
    //   startTimestamp: new Date(),
    //   buffer: new KeypointHistory([]),
    //   detectedExtremum: true,
    //   currentlyInExtremumRange: false,
    //   idleTimeMs: 1000,
    //   timeToExtremeMs: 1000,
    //   timeAtExtremeMs: 500,
    //   timeFromExtremeToEndMs: 1000,
    //   durationMs: 2500,
    //   endValueTimestamp: new Date(),
    // } as Rep;

    // if (!recordedRepsRef.current.length) {
    //   recordedRepsRef.current.push(newRep);
    // }

    // currentRepRef.current = newRep;

    // PoseDetectionGraphsUtil.renderROMAndTempoGraphs({
    //   exerciseDetectionData,
    //   currentRepRef,
    //   recordedRepsRef,
    //   romCanvasRef,
    //   tempoCanvasRef,
    //   normDomainRef,
    //   theme,
    // });

    lastVideoTimeRef.current = video.currentTime;
    prevFrameTimeRef.current = startTimeMs;

    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      frameCountRef.current += 1;

      frameBitmapBufferRef.current.insertFrame(
        frameCountRef.current,
        video,
        document
      );

      const hasPose =
        result.landmarks &&
        result.landmarks.length > 0 &&
        result.worldLandmarks &&
        result.worldLandmarks.length > 0;

      if (!hasPose) {
        return;
      }

      // console.log(
      //   frameCountRef.current,
      //   frameBitmapBufferRef.current.history[0]?.frameNum,
      //   frameBitmapBufferRef.current.history[
      //     frameBitmapBufferRef.current.history.length - 1
      //   ]?.frameNum
      // );

      const keypoints = KeypointUtil.getDesiredKeypointsByModel(
        result.worldLandmarks[0], // unit: m, origin: center of hips
        result.landmarks[0],
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
        stillnessCountdownRef,
        videoHeight: video.videoHeight,
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
          setRepCount,
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

export function getTempoString(state: {
  recordedRepsRef: RefObject<Rep[]>;
  commonService: CommonService;
}): string {
  const { recordedRepsRef, commonService } = state;

  let avgTimeToExtremeMs = 0,
    avgTimeAtExtremeMs = 0,
    avgTimeFromExtremeToEndMs = 0,
    avgIdleTimeMs = 0;

  for (const rep of recordedRepsRef.current) {
    avgTimeToExtremeMs += rep.timeToExtremeMs || 0;
    avgTimeAtExtremeMs += rep.timeAtExtremeMs || 0;
    avgTimeFromExtremeToEndMs += rep.timeFromExtremeToEndMs || 0;
    avgIdleTimeMs += rep.idleTimeMs || 0;
  }

  const avgTimeToExtremeS = Math.max(
    EXERCISE_TIMES_ROUNDING_STEP_S,
    commonService.number.roundToStep(
      Math.max(avgTimeToExtremeMs / 1000 / recordedRepsRef.current.length, 0),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgTimeAtExtremeS = commonService.number.roundToStep(
    Math.max(avgTimeAtExtremeMs / 1000 / recordedRepsRef.current.length, 0),
    EXERCISE_TIMES_ROUNDING_STEP_S
  );

  const avgTimeFromExtremeToEndS = Math.max(
    commonService.number.roundToStep(
      Math.max(
        avgTimeFromExtremeToEndMs / 1000 / recordedRepsRef.current.length,
        0
      ),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgIdleTimeS = commonService.number.roundToStep(
    Math.max(avgIdleTimeMs / 1000 / recordedRepsRef.current.length, 0),
    EXERCISE_TIMES_ROUNDING_STEP_S
  );

  const avgTimesSStrings = [
    avgTimeToExtremeS.toString(),
    avgTimeAtExtremeS.toString(),
    avgTimeFromExtremeToEndS.toString(),
    avgIdleTimeS.toString(),
  ];

  const avgTimesSStringsSliced = avgTimesSStrings.map((s) => {
    const dotIndex = s.indexOf('.');
    if (dotIndex === -1) return s;

    if (s.length > dotIndex + 2) return s.slice(0, dotIndex + 2);

    return s;
  });

  return avgTimesSStringsSliced.join(':');
}
