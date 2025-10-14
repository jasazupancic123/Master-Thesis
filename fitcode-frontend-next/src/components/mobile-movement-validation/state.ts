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
import type {
  RecordedReps,
  Rep,
  RepsCount,
} from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import EnvUtil from '@/common/util/env.util';

export async function loadModel(state: {
  setPoseLandmarker: SetState<PoseLandmarker | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
}) {
  const { setPoseLandmarker, videoRef, canvasRef, drawingUtilsRef } = state;

  // const modelAssetPath = '/models/pose_landmarker/pose_landmarker_lite.task'; // lite
  // const modelAssetPath = '/models/pose_landmarker/pose_landmarker_full.task'; // full
  const modelAssetPath = '/models/pose_landmarker/pose_landmarker_heavy.task'; // heavy

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
  repStateRefL: RefObject<RepState>;
  repStateRefR: RefObject<RepState>;
  model: PoseModel;
  poseLandmarker: PoseLandmarker | null;
  keypointHistory: KeypointHistory;
  keypointBuffer: KeypointHistory;
  constantKeypointHistory: KeypointHistory;
  frameBitmapBufferRef: RefObject<FrameBitmapBuffer>;
  currentRepRefL: RefObject<Rep | null>;
  currentRepRefR: RefObject<Rep | null>;
  recordedRepsRef: RefObject<RecordedReps>;
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
  setRepCount: SetState<RepsCount>;
  setStartedExitTimeout: SetState<boolean>;
}) => {
  const {
    statusRef,
    statusMessage,
    stillnessCountdownRef,
    canProceedIntoReadyStateRef,
    repStateRefL,
    repStateRefR,
    model,
    poseLandmarker,
    keypointHistory,
    keypointBuffer,
    constantKeypointHistory,
    frameBitmapBufferRef,
    currentRepRefL,
    currentRepRefR,
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

    if (
      ![DetectionStatus.READY, DetectionStatus.RECORDING].includes(
        statusRef.current
      )
    ) {
      // to re-render ui every frame when not in ready or recording state
      setFps(instFps);
    } else {
      // only update fps every 0.5 seconds when in ready or recording state to save performance
      if (!EnvUtil.AI.disableAIFPS() && avgFps.current) {
        const frameCount = KeypointUtil.getFramesCountFromSeconds(
          0.5,
          avgFps.current.value
        ); // smooth over 0.5s
        const shouldPublish =
          !avgFps.current || avgFps.current.count % frameCount === 0; // publish every 0.5 secodns

        if (shouldPublish) setFps(instFps);
      }
    }

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
        repStateRefL,
        repStateRefR,
        currentRepBufferL: currentRepRefL.current?.buffer,
        currentRepBufferR: currentRepRefR.current?.buffer,
        keypoints,
        isMobile,
        avgFps,
      });

      PoseDetectionService.checkStatus({
        statusRef,
        canProceedIntoReadyStateRef,
        repStateRefL,
        repStateRefR,
        keypoints,
        keypointBuffer,
        avgFps: avgFps.current,
        keypointHistory,
        recordingTimestampRef,
        statusMessage,
        stillnessCountdownRef,
        videoHeight: video.videoHeight,
      });

      if (statusRef.current === DetectionStatus.RECORDING) {
        // this upper if must go into the function
        RepDetectionService.checkRepStatus({
          currentFrameKeypoints: keypoints,
          keypointHistory: keypointHistory,
          valueType: exerciseDetectionData.romValueType,
          direction: exerciseDetectionData.romStartDirection,
          avgFps: avgFps.current,
          initedFirstFrameInRecordingMode, // this is used to track if no rep was detected yet
          leftData: {
            repStateRef: repStateRefL,
            currentRepRef: currentRepRefL,
            recordedReps: recordedRepsRef.current.left,
            keypointId: exerciseDetectionData.leftSide.romKeypointId,
            exerciseStartConditions: exerciseDetectionData.leftSide.conditions,
            side: 'L',
          },
          rightData:
            recordedRepsRef.current.right && exerciseDetectionData.rightSide
              ? {
                  repStateRef: repStateRefR,
                  currentRepRef: currentRepRefR,
                  recordedReps: recordedRepsRef.current.right,
                  keypointId: exerciseDetectionData.rightSide.romKeypointId,
                  exerciseStartConditions:
                    exerciseDetectionData.rightSide.conditions,
                  side: 'R',
                }
              : undefined,
          setRepCount,
        });

        // if (
        //   repStateRefR.current &&
        //   exerciseDetectionData.rightSide &&
        //   recordedRepsRef.current.right &&
        //   repStateRefR.current.status !== RepStatus.NONE
        // ) {
        //   RepDetectionService.checkRepStatus({
        //     repStateRef: repStateRefR,
        //     currentRepRef: currentRepRefR,
        //     recordedReps: recordedRepsRef.current.right,
        //     currentFrameKeypoints: keypoints,
        //     keypointHistory: keypointHistory,
        //     keypointId: exerciseDetectionData.rightSide.romKeypointId,
        //     valueType: exerciseDetectionData.romValueType,
        //     direction: exerciseDetectionData.romStartDirection,
        //     exerciseStartConditions: exerciseDetectionData.rightSide.conditions,
        //     avgFps: avgFps.current,
        //     initedFirstFrameInRecordingMode, // this is used to track if no rep was detected yet
        //     side: 'R',
        //     setRepCount,
        //   });
        // }
      }

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
  repStateRefL: RefObject<RepState>;
  repStateRefR: RefObject<RepState>;
  currentRepBufferL?: KeypointHistory;
  currentRepBufferR?: KeypointHistory;
  keypoints: Keypoint[];
  isMobile: boolean;
  avgFps: RefObject<{ value: number; count: number } | null>;
}) {
  const {
    statusRef,
    keypointHistory,
    keypointBuffer,
    constantKeypointHistory,
    repStateRefL,
    repStateRefR,
    currentRepBufferL,
    currentRepBufferR,
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
  if (repStateRefL.current.status === RepStatus.IN_REP && currentRepBufferL) {
    currentRepBufferL.insertFrame(keypoints);
  }

  if (repStateRefR.current.status === RepStatus.IN_REP && currentRepBufferR) {
    currentRepBufferR.insertFrame(keypoints);
  }

  const hasWeakFps = avgFps.current ? avgFps.current.value <= 15 : isMobile;

  keypointBuffer.insertFrame(keypoints, avgFps.current, hasWeakFps ? 2 : 3); // keep 2 or 3 seconds of history
}

export function getStatusMessage(status: DetectionStatus) {
  return STATUS_MESSAGES[status - 1];
}

export function getTempoString(state: {
  recordedReps: Rep[];
  commonService: CommonService;
}): string {
  const { recordedReps, commonService } = state;

  let avgTimeToExtremeMs = 0,
    avgTimeAtExtremeMs = 0,
    avgTimeFromExtremeToEndMs = 0,
    avgIdleTimeMs = 0;

  for (const rep of recordedReps) {
    avgTimeToExtremeMs += rep.timeToExtremeMs || 0;
    avgTimeAtExtremeMs += rep.timeAtExtremeMs || 0;
    avgTimeFromExtremeToEndMs += rep.timeFromExtremeToEndMs || 0;
    avgIdleTimeMs += rep.idleTimeMs || 0;
  }

  const avgTimeToExtremeS = Math.max(
    EXERCISE_TIMES_ROUNDING_STEP_S,
    commonService.number.roundToStep(
      Math.max(avgTimeToExtremeMs / 1000 / recordedReps.length, 0),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgTimeAtExtremeS = commonService.number.roundToStep(
    Math.max(avgTimeAtExtremeMs / 1000 / recordedReps.length, 0),
    EXERCISE_TIMES_ROUNDING_STEP_S
  );

  const avgTimeFromExtremeToEndS = Math.max(
    commonService.number.roundToStep(
      Math.max(avgTimeFromExtremeToEndMs / 1000 / recordedReps.length, 0),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgIdleTimeS = commonService.number.roundToStep(
    Math.max(avgIdleTimeMs / 1000 / recordedReps.length, 0),
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
