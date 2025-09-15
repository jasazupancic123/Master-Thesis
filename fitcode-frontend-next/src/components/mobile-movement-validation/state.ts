import { SetState } from '@/common/type/state.type';
import { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from '@/controller/pose-detection/const/pose-detection-constrains.const';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { KeypointId } from '@/controller/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/controller/pose-detection/enum/keypoint-value-type';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { PoseDetectionService } from '@/controller/pose-detection/pose-detection.service';
import { RepDetectionService } from '@/controller/pose-detection/rep-detection.service';
import {
  ConditionDirection,
  ExerciseStartCondition,
} from '@/controller/pose-detection/type/exercise-start-condition';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';
import { RefObject } from 'react';

export async function loadModel(state: {
  setPoseLandmarker: SetState<PoseLandmarker | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
}) {
  const { setPoseLandmarker, videoRef, canvasRef, drawingUtilsRef } = state;

  const modelAssetPath = '/models/pose_landmarker/pose_landmarker_full.task';

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
      .getUserMedia({ video: true })
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
  model: PoseModel;
  poseLandmarker: PoseLandmarker | null;
  keypointHistory: KeypointHistory;
  keypointBuffer: KeypointHistory;
  exerciseStartConditions: ExerciseStartCondition[];
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingUtilsRef: RefObject<DrawingUtils | null>;
  canvasCtxRef: RefObject<CanvasRenderingContext2D | null>;
  prevFrameTimeRef: RefObject<number | null>;
  lastVideoTimeRef: RefObject<number>;
  isMobile: boolean;
  frameCountRef: RefObject<number>;
  firstFrameInRecordingMode: RefObject<boolean>;
  avgFps: RefObject<{ value: number; count: number } | null>;
  setFps: SetState<number | null>;
  setStatusMessage: SetState<string>;
}) => {
  const {
    statusRef,
    model,
    poseLandmarker,
    keypointHistory,
    keypointBuffer,
    exerciseStartConditions,
    videoRef,
    canvasRef,
    drawingUtilsRef,
    canvasCtxRef,
    prevFrameTimeRef,
    lastVideoTimeRef,
    isMobile,
    frameCountRef,
    firstFrameInRecordingMode,
    avgFps,
    setFps,
    setStatusMessage,
  } = state;

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

      if (
        firstFrameInRecordingMode.current === false &&
        statusRef.current === DetectionStatus.RECORDING
      ) {
        const slopeK = 3; // naklon premice
        const sustainW = 2; // look for 2 consecutive frames of sustained slope

        const preWindow = Math.min(
          4,
          KeypointUtil.getFramesCountFromSeconds(
            0.15,
            avgFps.current?.value || 30
          )
        ); // look for 0.15s of frames of sustained slope, min 4 frames

        const { index: startOfFirstRepIndex, message } =
          RepDetectionService.findStartOfFirstRep({
            buffer: keypointHistory,
            keypointId: KeypointId.LEFT_EYE,
            valueType: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            slopeK,
            sustainW,
            preWindow,
          });

        keypointHistory.cutAtIndex(startOfFirstRepIndex, true);

        firstFrameInRecordingMode.current = true;
        keypointHistory.bufferLength = undefined;
      }

      // if we are in recording state, don't update the buffer's size
      if (statusRef.current === DetectionStatus.RECORDING)
        keypointHistory.insertFrame(keypoints);
      else {
        // only keep KEYPOINT_BUFFER_DURATION_MS of frames in history
        keypointHistory.insertFrame(
          keypoints,
          avgFps.current,
          POSE_DETECTION_CONSTRAINTS.KEYPOINT_BUFFER_DURATION_MS * 1000
        );
      }

      const hasWeakFps = avgFps.current ? avgFps.current.value <= 15 : isMobile;

      keypointBuffer.insertFrame(keypoints, avgFps.current, hasWeakFps ? 2 : 3); // keep 2 or 3 seconds of history

      PoseDetectionService.checkStatus(
        statusRef,
        keypoints,
        setStatusMessage,
        keypointBuffer,
        exerciseStartConditions,
        avgFps.current
      );

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Flip horizontally to mirror webcam
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      for (const landmark of result.landmarks) {
        drawingUtils.drawLandmarks(landmark);
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
      }

      ctx.restore();
    });
  }

  window.requestAnimationFrame(predictWebcam.bind(null, state));
};

export function getStatusMessage(status: DetectionStatus) {
  return STATUS_MESSAGES[status - 1];
}
