import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { DrawingUtils } from '@mediapipe/tasks-vision';
import type { RefObject } from 'react';

import { EXERCISE_TIMES_ROUNDING_STEP_S } from './mobile-movement-validation';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import type { FrameBitmapBuffer } from '@/lib/pose-detection/class/frame-bitmap-buffer';
import type { KeypointHistory } from '@/lib/pose-detection/class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from '@/lib/pose-detection/const/pose-detection-constrains.const';
import { STATUS_MESSAGES } from '@/lib/pose-detection/const/status-messages';
import { DetectionStatus } from '@/lib/pose-detection/enum/detection-status';
import type { PoseModel } from '@/lib/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/lib/pose-detection/enum/rep-state';
import type { AvgFps } from '@/lib/pose-detection/type/avg-fps.type';
import type { CurrentSideMutex } from '@/lib/pose-detection/type/current-side-mutex.type';
import type {
  ExerciseAngleCondition,
  ExerciseDetectionData,
} from '@/lib/pose-detection/type/exercise-start-condition.type';
import type { Keypoint } from '@/lib/pose-detection/type/keypoint.type';
import type {
  RecordedReps,
  Rep,
  RepsCount,
} from '@/lib/pose-detection/type/rep.type';
import type { RepState } from '@/lib/pose-detection/type/rep-state.type';
import { theme } from '@/app/style';
import { Point2D } from '@/lib/pose-detection/type/point.type';
import dayjs from 'dayjs';

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

export async function enableCam(state: {
  poseLandmarker: PoseLandmarker | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  setError: SetState<string | null>;
  predictWebcam: () => Promise<void>;
}) {
  const { poseLandmarker, videoRef, predictWebcam, setError } = state;

  if (!poseLandmarker) return;

  // Activate the webcam stream.
  if (videoRef !== null && videoRef.current !== null) {
    await navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { exact: 'user' }, // front cam
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 9 / 16 }, // you want portrait
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
  doItTimestamp: RefObject<Date | null>;
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
  lastRecordedRepRef: RefObject<Rep | null>;
  currentInvalidAnglesRef: RefObject<ExerciseAngleCondition[]>;
  exerciseDetectionDataRef: RefObject<ExerciseDetectionData | undefined>;
  currentSideMutexRef: RefObject<CurrentSideMutex>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasCtxRef: RefObject<CanvasRenderingContext2D | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
  prevFrameTimeRef: RefObject<number | null>;
  lastVideoTimeRef: RefObject<number>;
  isMobile: boolean;
  frameCountRef: RefObject<number>;
  initedFirstFrameInRecordingMode: RefObject<boolean>;
  avgFps: RefObject<AvgFps>;
  centerPosRef: RefObject<Point2D | null>;
  recordingTimestampRef: RefObject<Date | null>;
  isCurrentlySavingImageRef: RefObject<boolean>;
  canExitWhenImageIsDoneSavingRef: RefObject<boolean>;
  reloadingModelRef: RefObject<boolean>;
  setFps: SetState<number | null>;
  finishAiDetection: () => Promise<void>;
  setRepCount: SetState<RepsCount>;
  setStartedExitTimeout: SetState<boolean>;
  reloadModel: () => Promise<void>;
}) => {
  const {
    statusRef,
    statusMessage,
    doItTimestamp,
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
    lastRecordedRepRef,
    currentInvalidAnglesRef,
    exerciseDetectionDataRef,
    currentSideMutexRef,
    videoRef,
    canvasRef,
    canvasCtxRef,
    drawingUtilsRef,
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
    reloadingModelRef,
    setFps,
    finishAiDetection,
    setRepCount,
    setStartedExitTimeout,
    reloadModel,
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

  if (
    !video ||
    !canvas ||
    !ctx ||
    !poseLandmarker ||
    !drawingUtils ||
    !exerciseDetectionDataRef.current
  )
    return;

  const exerciseDetectionData = exerciseDetectionDataRef.current;
  const drawLines = exerciseDetectionData.drawLines;
  const drawRadars = exerciseDetectionData.drawRadars;

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
      ) ||
      (statusRef.current === DetectionStatus.RECORDING &&
        dayjs(dayjs()).diff(doItTimestamp.current, 'second') < 1)
    ) {
      // to re-render ui every frame when not in ready or recording state, or in the first second of recording
      setFps(instFps);
    } else {
      // only update fps every 0.5 seconds when in ready or recording state to save performance
      if (!lib.common.env.disableErudaAI() && avgFps.current) {
        const frameCount = lib.ai.keypoint.getFramesCountFromSeconds(
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

    poseLandmarker.detectForVideo(video, startTimeMs, async (result) => {
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

      const keypoints = lib.ai.keypoint.getDesiredKeypointsByModel(
        result.worldLandmarks[0], // unit: m, origin: center of hips
        result.landmarks[0], // unit: normalized to [0,1], origin: top-left of image
        model,
        new Date(),
        frameCountRef.current,
        videoWidth,
        videoHeight
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

      await lib.ai.pose.checkStatus({
        statusRef,
        canProceedIntoReadyStateRef,
        repStateRefL,
        repStateRefR,
        keypoints,
        keypointBuffer,
        keypointHistory,
        exerciseDetectionData,
        avgFps: avgFps.current,
        recordingTimestampRef,
        statusMessage,
        stillnessCountdownRef,
        videoHeight: video.videoHeight,
        doItTimestamp,
        reloadingModelRef,
        reloadModel,
      });

      if (statusRef.current === DetectionStatus.RECORDING) {
        // this upper if must go into the function
        lib.ai.rep.checkRepStatus({
          currentFrameKeypoints: keypoints,
          keypointHistory: keypointHistory,
          constantKeypointHistory,
          lastRecordedRepRef,
          valueType: exerciseDetectionData.romValueType,
          avgFps: avgFps.current,
          initedFirstFrameInRecordingMode, // this is used to track if no rep was detected yet
          exerciseDetectionData,
          currentSideMutexRef,
          currentInvalidAnglesRef,
          leftData: {
            side: 'L',
            repStateRef: repStateRefL,
            currentRepRef: currentRepRefL,
            recordedReps: recordedRepsRef.current.left,
            keypointId: exerciseDetectionData.leftSide.romKeypointId,
            direction: exerciseDetectionData.leftSide.conditions[0].direction,
            exerciseStartConditions: exerciseDetectionData.leftSide.conditions,
            recordingStillnesses:
              exerciseDetectionData.leftSide.recordingStillnesses,
            requiredPoseConditions:
              exerciseDetectionData.leftSide.requiredPoseConditions,
            feedbackAngles: exerciseDetectionData.leftSide.feedbackAngles,
            extremumAngles: exerciseDetectionData.leftSide.extremumAngles,
          },
          rightData:
            recordedRepsRef.current.right && exerciseDetectionData.rightSide
              ? {
                  side: 'R',
                  repStateRef: repStateRefR,
                  currentRepRef: currentRepRefR,
                  recordedReps: recordedRepsRef.current.right,
                  keypointId: exerciseDetectionData.rightSide.romKeypointId,
                  direction:
                    exerciseDetectionData.rightSide.conditions[0].direction,
                  exerciseStartConditions:
                    exerciseDetectionData.rightSide.conditions,
                  recordingStillnesses:
                    exerciseDetectionData.rightSide.recordingStillnesses,
                  requiredPoseConditions:
                    exerciseDetectionData.rightSide.requiredPoseConditions,
                  feedbackAngles:
                    exerciseDetectionData.rightSide.feedbackAngles,
                  extremumAngles:
                    exerciseDetectionData.rightSide.extremumAngles,
                }
              : undefined,
          setRepCount,
        });
      }

      // DRAWING
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to identity
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Flip horizontally to mirror webcam
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // Set center for the yellow person indicator
      lib.ai.draw.setSmoothedCenter(result, centerPosRef);

      // Draw lines between keypoints if provided
      if (drawLines && drawLines.length)
        lib.ai.draw.drawLines(
          drawLines,
          keypoints,
          canvas,
          ctx,
          theme.palette.primary.main
        );

      // Invalid angles indicators
      if (currentInvalidAnglesRef.current.length)
        lib.ai.draw.drawInvalidAngles(
          currentInvalidAnglesRef,
          keypoints,
          canvas,
          ctx
        );

      // Draw radars
      if (drawRadars && drawRadars.length)
        lib.ai.draw.drawRadars({
          currentRepRefL,
          currentRepRefR,
          repStateRefL,
          repStateRefR,
          keypoints,
          canvas,
          ctx,
          drawRadars,
        });

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
  avgFps: RefObject<AvgFps>;
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

export function getTempoString(state: { recordedReps: Rep[] }): string {
  const { recordedReps } = state;

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
    lib.common.number.roundToStep(
      Math.max(avgTimeToExtremeMs / 1000 / recordedReps.length, 0),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgTimeAtExtremeS = lib.common.number.roundToStep(
    Math.max(avgTimeAtExtremeMs / 1000 / recordedReps.length, 0),
    EXERCISE_TIMES_ROUNDING_STEP_S
  );

  const avgTimeFromExtremeToEndS = Math.max(
    lib.common.number.roundToStep(
      Math.max(avgTimeFromExtremeToEndMs / 1000 / recordedReps.length, 0),
      EXERCISE_TIMES_ROUNDING_STEP_S
    )
  );

  const avgIdleTimeS = lib.common.number.roundToStep(
    Math.max(avgIdleTimeMs / 1000 / recordedReps.length, 0),
    EXERCISE_TIMES_ROUNDING_STEP_S
  );

  if (
    isNaN(avgTimeToExtremeS) ||
    isNaN(avgTimeAtExtremeS) ||
    isNaN(avgTimeFromExtremeToEndS) ||
    isNaN(avgIdleTimeS)
  ) {
    return '0:0:0:0';
  }

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
