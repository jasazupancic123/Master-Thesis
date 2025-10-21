'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import AthleteTrainingExerciseSets from '../athlete/athlete-training-exercise-sets';
import TempoChart from '../charts/tempo/tempo-chart';
import { updateTrainingExerciseWithAI } from '../training-in-progress/components/training-in-progress-exercise-card/actions/actions-exercise';
import { finishSet } from '../training-in-progress/components/training-in-progress-exercise-card/actions/actions-exercise-set';
import FpsText from './components/fps-text';
import MovementValidationHeader from './components/movement-validation-header';
import {
  enableCam,
  getStatusMessage,
  getTempoString,
  predictWebcam,
  setupVideoAndContex,
} from './state';
import { FrameBitmapBuffer } from '@/core/pose-detection/class/frame-bitmap-buffer';
import { KeypointHistory } from '@/core/pose-detection/class/keypoint-history';
import { EXERCISE_POSES } from '@/core/pose-detection/const/exercise-poses';
import { POSE_DETECTION_CONSTRAINTS } from '@/core/pose-detection/const/pose-detection-constrains.const';
import { STATUS_MESSAGES } from '@/core/pose-detection/const/status-messages';
import { ConditionDirection } from '@/core/pose-detection/enum/condition-detection.enum';
import { CurrentSideMutexValues } from '@/core/pose-detection/enum/current-side-mutex-values.enum';
import { DetectionStatus } from '@/core/pose-detection/enum/detection-status';
import { KeypointId } from '@/core/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/core/pose-detection/enum/keypoint-value-type';
import { PoseModel } from '@/core/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/core/pose-detection/enum/rep-state';
import { RepDetectionService } from '@/core/pose-detection/rep-detection.service';
import type { AvgFps } from '@/core/pose-detection/type/avg-fps.type';
import type { CurrentSideMutex } from '@/core/pose-detection/type/current-side-mutex.type';
import type { ExerciseDetectionData } from '@/core/pose-detection/type/exercise-start-condition.type';
import type {
  RecordedReps,
  Rep,
  RepInfo,
  RepsCount,
} from '@/core/pose-detection/type/rep.type';
import type { RepState } from '@/core/pose-detection/type/rep-state.type';
import { KeypointUtil } from '@/core/pose-detection/util/keypoint.util';
import { getPoseLandmarker } from '@/core/pose-detection/util/pose-landmarker-loader.util';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type {
  RepImage,
  RepRomTimestamp,
  TrainingExerciseRecordedSet,
  TrainingExerciseRecording,
} from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import LoadingOverlay from '@/util/loading-overlay';

const DEBUG = false;

const commonService = lib.common;
const firebaseStorage = lib.firebase.storage;

export const EXERCISE_TIMES_ROUNDING_STEP_S = 0.1; // round to 0.1

interface MobileMovementValidationProps {
  selectedExercise: TrainingExerciseRecording | undefined;
  setSelectedExercise:
    | SetState<TrainingExerciseRecording | undefined>
    | undefined;
  selectedTrackingMethod: TrackingMethod | undefined;
  setSelectedTrackingMethod: SetState<TrackingMethod> | undefined;
  trainingId: string;
  componentId: string;
  supersetIndex: number;
  setIndex: number;
}

export default function MobileMovementValidation(
  props: MobileMovementValidationProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const pathname = usePathname();

  const trainingContext = useTraining();
  const { trainingInProgress, setTrainingInProgress } = trainingContext || {};

  const trainingInProgressContext = useTrainingInProgress();
  const { handleUpsertSet } = trainingInProgressContext || {};

  const authenticatedAuthContext = useAuthenticatedAuth();
  const { user } = authenticatedAuthContext || { user: null };

  const {
    selectedExercise,
    selectedTrackingMethod,
    setSelectedTrackingMethod,
    trainingId,
    componentId,
    supersetIndex,
    setIndex,
  } = props;

  // Buffers
  const keypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], 100, true)
  ); // first make buffer of 100 frames, later set buffer size to undefined to get all recording of exercise
  const keypointBuffer = new KeypointHistory([], 100); // 100 frames buffer, updates in the main loop based on fps
  const constantKeypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], undefined)
  ); // never cut, always all history
  const frameBitmapBufferRef = useRef<FrameBitmapBuffer>(
    new FrameBitmapBuffer(60)
  ); // buffer of image blobs

  const defaultExerciseName = 'Biceps Curl';
  const exercisePose = {
    romValueType: KeypointValueType.POSITION_Y,
    leftSide: {
      romKeypointId: KeypointId.LEFT_WRIST,
      conditions: [
        {
          keypointId: KeypointId.LEFT_WRIST,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.POSITIVE,
          duration: 750, // ms
          distance: 0.1, // meters
        },
      ],
    },
    rightSide: {
      romKeypointId: KeypointId.RIGHT_WRIST,
      conditions: [
        {
          keypointId: KeypointId.RIGHT_WRIST,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.POSITIVE,
          duration: 750, // ms
          distance: 0.1, // meters
        },
      ],
    },
  };

  const exerciseDetectionData: ExerciseDetectionData | undefined =
    selectedExercise
      ? EXERCISE_POSES.find((e) => e.exerciseIds.includes(selectedExercise.id))
          ?.data
      : exercisePose;

  // Main Status
  const statusRef = useRef<DetectionStatus>(DetectionStatus.NOT_FULLY_IN_FRAME);
  const statusMessage = useRef<string>(STATUS_MESSAGES[statusRef.current]);
  const canProceedIntoReadyStateRef = useRef(false); // used for clearing buffer before detecting stillness
  const stillnessCountdownRef = useRef<Date | null>(null); // countdown to recording start when stillness is detected

  // Model and PoseLandmarker
  const [model] = useState<PoseModel>(PoseModel.MEDIAPIPE);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // Rep State
  const repStateRefL = useRef<RepState>({
    status: RepStatus.NONE,
    avgStartValue: null,
    avgExtremeValue: null,
  });
  const repStateRefR = useRef<RepState>({
    status: RepStatus.NONE,
    avgStartValue: null,
    avgExtremeValue: null,
  });

  const currentRepRefL = useRef<Rep | null>(null);
  const currentRepRefR = useRef<Rep | null>(null);

  const recordedRepsRef = useRef<RecordedReps>({
    left: [],
    right: exerciseDetectionData?.rightSide ? [] : undefined,
  });

  const lastRecordedRepRef = useRef<Rep | null>(null);

  const currentSideMutexRef = useRef<CurrentSideMutex>(
    exerciseDetectionData?.cannotDoBothSidesSimultaneously
      ? CurrentSideMutexValues.NoneAtm
      : undefined
  );

  // const recordedRepsRef = useRef<RecordedReps>({
  //   left: demoReps,
  //   right: demoReps,
  // });

  const [repCount, setRepCount] = useState<RepsCount>({
    left: 0,
    right: exerciseDetectionData?.rightSide ? 0 : undefined,
  });
  const repCountPrev = useRef<RepsCount>({
    left: 0,
    right: exerciseDetectionData?.rightSide ? 0 : undefined,
  });

  // FPS and Error
  const [fps, setFps] = useState<number | null>(null);
  const avgFps = useRef<AvgFps>(null);
  const [error, setError] = useState<string | null>(null);

  const centerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Helper Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const initedFirstFrameInRecordingMode = useRef(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const dotBackgroundRef = useRef<HTMLDivElement | null>(null);
  const recordingTimestampRef = useRef<Date | null>(null);
  const isCurrentlySavingImageRef = useRef(false);
  const canExitWhenImageIsDoneSavingRef = useRef(false);
  const [startedExitTimeout, setStartedExitTimeout] = useState(false);

  useEffect(() => {
    let raf: number | null = null;

    const tick = () => {
      const v = videoRef.current;
      const background = dotBackgroundRef.current;
      const c = centerPosRef.current;

      const dot = dotRef.current;

      if (!v || !background || !dot || !c) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const rect = v.getBoundingClientRect();

      // normalized landmark coords [0..1]; flip X if video is mirrored
      const nx = 1 - c.x;
      const ny = c.y;

      // intrinsic video size (source space)
      const vw = v.videoWidth || rect.width;
      const vh = v.videoHeight || rect.height;

      // element size (display space)
      const elW = rect.width;
      const elH = rect.height;

      // account for CSS object-fit
      const ofit = getComputedStyle(v).objectFit || 'cover';

      let drawnW = elW;
      let drawnH = elH;

      if (ofit === 'cover') {
        const scale = Math.max(elW / vw, elH / vh);
        drawnW = vw * scale;
        drawnH = vh * scale;
      } else if (ofit === 'contain' || ofit === 'scale-down') {
        const scale = Math.min(elW / vw, elH / vh);
        drawnW = vw * scale;
        drawnH = vh * scale;
      } else if (ofit === 'none') {
        drawnW = vw; // 1:1 pixels
        drawnH = vh;
      } // "fill" falls back to element size (stretches to elW x elH)

      // assume object-position: 50% 50% (center) – default for <video>
      const offsetX = (elW - drawnW) / 2;
      const offsetY = (elH - drawnH) / 2;

      // map normalized coords -> displayed pixels inside the drawn video
      const px = offsetX + nx * drawnW;
      const py = offsetY + ny * drawnH;

      // center the dot element (don’t hardcode; use its actual size)
      const halfWBackground = (background.offsetWidth || 8) / 2;
      const halfHBackground = (background.offsetHeight || 8) / 2;

      const halfWDot = (dot.offsetWidth || 8) / 2;
      const halfHDot = (dot.offsetHeight || 8) / 2;

      background.style.transform = `translate3d(${px - halfWBackground}px, ${py - halfHBackground}px, 0)`;
      dotRef.current!.style.transform = `translate3d(${px - halfWDot}px, ${py - halfHDot}px, 0)`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [centerPosRef]);

  {
    /* <HELPER TO DRAW GRAPH>*/
  }
  const [spaceDown, setSpaceDown] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // stop page scroll
        if (!spaceDown) setSpaceDown(true);

        RepDetectionService.saveRepTimesToJsonFiles({
          recordedRepsRef,
          selectedExercise,
        });
      }
    };

    // TS types allow options as EventListenerOptions
    window.addEventListener('keydown', onKeyDown, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [spaceDown]);
  {
    /* </HELPER TO DRAW GRAPH>*/
  }

  // ✅ (1) Mobile console: load Eruda when requested
  useEffect(() => {
    if (!DEBUG) return;

    if (typeof window === 'undefined') return;

    const wantDebug = !lib.common.env.disableErudaAI();

    if (!wantDebug) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error eruda is dynamically loaded and not typed
      window.eruda?.init();
    };
    document.body.appendChild(script);

    return () => {
      // @ts-expect-error eruda is dynamically loaded and not typed
      window.eruda?.destroy?.();
      script.remove();
    };
  }, []);

  // (optional) programmatic toggle you can call e.g. from a button
  const openConsole = async () => {
    if (!DEBUG) return;

    if (typeof window === 'undefined') return;
    // @ts-expect-error eruda is dynamically loaded and not typed
    if (window.eruda) {
      // @ts-expect-error eruda is dynamically loaded and not typed
      window.eruda.show();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error eruda is dynamically loaded and not typed
      window.eruda?.init();
      // @ts-expect-error eruda is dynamically loaded and not typed
      window.eruda?.show();
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (!exerciseDetectionData) return;

    if (statusRef.current === DetectionStatus.STOPPED) return;

    enableCam({
      poseLandmarker,
      videoRef,
      setError,
      predictWebcam: async () =>
        await predictWebcam({
          statusRef,
          statusMessage,
          stillnessCountdownRef,
          canProceedIntoReadyStateRef,
          repStateRefL,
          repStateRefR,
          model,
          poseLandmarker,
          keypointHistory: keypointHistoryRef.current,
          keypointBuffer,
          constantKeypointHistory: constantKeypointHistoryRef.current,
          frameBitmapBufferRef,
          currentRepRefL,
          currentRepRefR,
          recordedRepsRef,
          lastRecordedRepRef,
          videoRef,
          canvasRef,
          drawingUtilsRef,
          canvasCtxRef,
          prevFrameTimeRef,
          lastVideoTimeRef,
          frameCountRef,
          isMobile: screenSize.isMobile,
          avgFps,
          exerciseDetectionData: exerciseDetectionData!,
          currentSideMutexRef,
          initedFirstFrameInRecordingMode,
          centerPosRef,
          recordingTimestampRef,
          isCurrentlySavingImageRef,
          canExitWhenImageIsDoneSavingRef,
          setFps,
          finishAiDetection,
          setRepCount,
          setStartedExitTimeout,
        }),
    });
  }, [poseLandmarker]);

  const finishAiDetection = async () => {
    statusMessage.current = getStatusMessage(DetectionStatus.STOPPED);

    // await RepsGraphService.downloadReps(
    //   {
    //     recordedRepsRef,
    //     keypointId: exerciseDetectionData!.leftSide.romKeypointId,
    //     valueType: exerciseDetectionData!.romValueType,
    //     constantKeypointHistory: constantKeypointHistoryRef.current,
    //     smooth: true,
    //   },
    //   { filenameBase: 'session', combine: true }
    // );

    // KeypointUtil.drawKeypointValuesGraph(
    //   constantKeypointHistoryRef.current.history,
    //   exerciseDetectionData!.romKeypointId,
    //   exerciseDetectionData!.romValueType,
    //   'whole_exercise'
    // );

    // RepDetectionService.saveRepTimesToJsonFiles({
    //   recordedRepsRef,
    //   selectedExercise,
    // });

    if (
      selectedTrackingMethod === TrackingMethod.CAMERA &&
      setSelectedTrackingMethod &&
      trainingInProgress &&
      setTrainingInProgress !== undefined &&
      handleUpsertSet !== undefined &&
      selectedExercise !== undefined &&
      setIndex !== undefined &&
      user !== null &&
      user !== undefined
    ) {
      if (!recordedRepsRef.current.left.length) {
        if (
          recordedRepsRef.current.right &&
          !recordedRepsRef.current.right.length
        ) {
          setSelectedTrackingMethod(TrackingMethod.MANUAL);
          return;
        } else {
          setSelectedTrackingMethod(TrackingMethod.MANUAL);
          return;
        }
      }

      const sides = [
        recordedRepsRef.current.left,
        recordedRepsRef.current.right,
      ].filter((r) => r !== undefined) as Rep[][];

      const updatedExercise = {
        ...selectedExercise,
      } as TrainingExerciseRecording;

      let recordedSets: TrainingExerciseRecordedSet[] | undefined =
        updatedExercise.recordedSets;

      let tempoL: string | null = null;
      let tempoR: string | null = null;

      let i = 0; // 0 for left side, 1 for right

      for (const side of sides) {
        const images = side
          .map((rep) => {
            if (!rep.extremumImageUrl) return null;

            return {
              repNumber: rep.repNumber,
              url: rep.extremumImageUrl || '',
            };
          })
          .filter((i) => i !== null) as RepImage[];

        const reps = side.map((rep) => {
          return {
            repNumber: rep.repNumber,
            startTimestamp: rep.startTimestamp,
            endTimestamp: rep.endValueTimestamp,
            idleTimeMs: rep.idleTimeMs,
            timeToExtremeMs: rep.timeToExtremeMs,
            timeAtExtremeMs: rep.timeAtExtremeMs,
            timeFromExtremeToEndMs: rep.timeFromExtremeToEndMs,
            durationMs: rep.durationMs,
            minRomValue: rep.minRomValue,
            maxRomValue: rep.maxRomValue,
            startRomValue: rep.startRomValue,
            extremumRomValue: rep.extremeValue,
          } as RepInfo;
        });

        if (!recordedSets) {
          // can only happen for left side
          recordedSets = [
            {
              setIndex,
              imagesL: images,
              repsL: reps,
            },
          ];
        } else {
          if (recordedSets.find((rs) => rs.setIndex === setIndex)) {
            // already recorded for this set, update it
            recordedSets = recordedSets.map((rs) => {
              if (rs.setIndex !== setIndex) return rs;

              if (i === 0) {
                // left side
                return {
                  ...rs,
                  repsL: reps,
                  imagesL: images,
                };
              } else if (i === 1) {
                // right side
                return {
                  ...rs,
                  repsR: reps,
                  imagesR: images,
                };
              }

              return rs;
            });
          } else {
            // did not yet record for this set, insert only, can only happen for left side
            recordedSets.push({
              setIndex,
              imagesL: images,
              repsL: reps,
            });
          }
        }

        if (i === 0) {
          tempoL = getTempoString({
            recordedReps: side,
            commonService,
          });
        } else if (i === 1) {
          tempoR = getTempoString({
            recordedReps: side,
            commonService,
          });
        }

        i++;
      }

      // const romLKeypoints = constantKeypointHistoryRef.current.getHistoryById(
      //   exercisePose.leftSide.romKeypointId
      // );

      const romLKeypoints = recordedRepsRef.current.left
        .map((r) =>
          r.buffer.getHistoryById(exercisePose.leftSide.romKeypointId)
        )
        .flat();

      const romL = romLKeypoints
        .map((r) => ({
          value: KeypointUtil.getKeypointValueByType(
            r,
            exercisePose.romValueType
          ),
          timestamp: r.capturedAt,
        }))
        .filter((v) => v !== undefined) as RepRomTimestamp[];

      // const romRKeypoints: Keypoint[] | undefined = exercisePose.rightSide
      //   ? constantKeypointHistoryRef.current.getHistoryById(
      //       exercisePose.rightSide.romKeypointId
      //     )
      //   : undefined;

      const romRKeypoints =
        recordedRepsRef.current.right && exercisePose.rightSide
          ? recordedRepsRef.current.right
              .map((r) =>
                r.buffer.getHistoryById(exercisePose.rightSide.romKeypointId)
              )
              .flat()
          : undefined;

      const romR = romRKeypoints
        ? (romRKeypoints
            .map((r) => ({
              value: KeypointUtil.getKeypointValueByType(
                r,
                exercisePose.romValueType
              ),
              timestamp: r.capturedAt,
            }))
            .filter((v) => v !== undefined) as RepRomTimestamp[])
        : undefined;

      recordedSets = recordedSets
        ? recordedSets.map((rs) => {
            if (rs.setIndex !== setIndex) return rs;

            return {
              ...rs,
              romL: romL.length ? romL : undefined,
              romR: romR && romR.length ? romR : undefined,
            };
          })
        : undefined;

      updatedExercise.recordedSets = recordedSets;

      updateTrainingExerciseWithAI(
        recordedRepsRef.current.left.length,
        recordedRepsRef.current.right?.length,
        tempoL,
        tempoR,
        updatedExercise,
        true,
        { ...trainingContext, trainingInProgress },
        trainingInProgressContext
      );

      await finishSet({
        exercise: updatedExercise,
        setIndex,
        trainingInProgress,
        setTrainingInProgress,
        handleUpsertSet,
      });

      setSelectedTrackingMethod(TrackingMethod.MANUAL);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    statusMessage.current = getStatusMessage(statusRef.current);
  }, [statusRef.current]);

  useEffect(() => {
    if (canvasRef.current)
      canvasCtxRef.current = canvasRef.current.getContext('2d');

    const loadModel = async () => {
      const lm = await getPoseLandmarker();
      setPoseLandmarker(lm);
    };

    loadModel();

    setupVideoAndContex({
      videoRef,
      canvasRef,
      drawingUtilsRef,
    });
  }, [canvasRef]);

  useEffect(() => {
    // Post save images to firestore

    if (
      !recordedRepsRef.current.left.length &&
      !recordedRepsRef.current.right?.length
    )
      return;

    let correctSideLabel: string | null = null;

    if (repCount.left !== repCountPrev.current.left) correctSideLabel = 'left';
    else if (repCount.right !== repCountPrev.current.right)
      correctSideLabel = 'right';

    if (!correctSideLabel) return;

    const side =
      correctSideLabel === 'left'
        ? recordedRepsRef.current.left
        : recordedRepsRef.current.right;

    if (!side) return;

    const postImages = async () => {
      isCurrentlySavingImageRef.current = true;

      const lastRep = side[side.length - 1];

      if (!lastRep || lastRep.extremumImageUrl || !lastRep.extremeKeypoint)
        return;

      const blob = await frameBitmapBufferRef.current.toBlobByFrameNum(
        lastRep.extremeKeypoint.frameNum,
        undefined,
        undefined,
        document
      );

      if (!blob) return;

      // training/trainingId:userId:componentId:supersetIndex:exerciseId:setIndex:repNumber:side
      const fileName = `${user.uid}:${componentId}:${supersetIndex}:${selectedExercise?.id}:${setIndex}:${lastRep.repNumber}:${correctSideLabel}`;

      const file = new File([blob], `${fileName}.jpg`, {
        type: blob.type || 'image/jpeg',
      });

      const path = `training/${trainingId}/${file.name}`;

      const url = await firebaseStorage.uploadFile(file, path);

      lastRep.extremumImageUrl = url;

      isCurrentlySavingImageRef.current = false;
    };

    postImages();

    repCountPrev.current = { ...repCount };
  }, [repCount]);

  useEffect(() => {
    const checkExit = async () => {
      if (
        isCurrentlySavingImageRef.current === false &&
        canExitWhenImageIsDoneSavingRef.current === true
      ) {
        await finishAiDetection();
        canExitWhenImageIsDoneSavingRef.current = false;
      }
    };

    checkExit();
  }, [isCurrentlySavingImageRef.current]);

  useEffect(() => {
    if (startedExitTimeout) {
      setTimeout(async () => {
        await finishAiDetection();
        canExitWhenImageIsDoneSavingRef.current = false;
        setStartedExitTimeout(false);
      }, 5000);
    }
  }, [startedExitTimeout]);

  if (!exerciseDetectionData) {
    return <div>No pose detection logic for this exercise yet</div>;
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{
        position: 'relative',
      }}
    >
      {!pathname.endsWith('pose-model') &&
        canExitWhenImageIsDoneSavingRef.current === true && (
          <LoadingOverlay title="Saving images..." topDownCircularProgress />
        )}

      {!poseLandmarker && (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          sx={{
            position: 'relative',
          }}
        >
          <LoadingOverlay title="Loading model...">
            <Button
              variant="contained"
              sx={{
                position: 'fixed',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                mx: 'auto',
                zIndex: 100000,
              }}
              onClick={() => {
                setSelectedTrackingMethod?.(TrackingMethod.MANUAL);
              }}
            >
              Cancel
            </Button>
          </LoadingOverlay>
        </Box>
      )}

      {poseLandmarker && (
        <>
          {statusRef.current === DetectionStatus.RECORDING &&
          (recordedRepsRef.current.left.length ||
            recordedRepsRef.current.right?.length) ? (
            <></>
          ) : (
            <MovementValidationHeader
              statusRef={statusRef}
              statusMessage={error ? `${error}` : statusMessage.current}
              defaultExerciseName={
                selectedExercise?.exercise?.name || defaultExerciseName
              }
              countdownValue={
                statusRef.current === DetectionStatus.NOT_STILL &&
                stillnessCountdownRef.current !== null
                  ? Math.max(
                      dayjs(stillnessCountdownRef.current)
                        .add(
                          POSE_DETECTION_CONSTRAINTS.STILLNESS_COUNTDOWN_DURATION_S +
                            1,
                          'seconds'
                        )
                        .diff(dayjs(), 'second'),
                      0
                    )
                  : null
              }
            />
          )}
        </>
      )}

      {!lib.common.env.disableFpsAI() && (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          sx={{
            position: 'absolute',
            bottom: 100,
            transform: ' translateY(-50%)',
            zIndex: 1000,
          }}
          gap={1}
        >
          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            px={1}
          >
            <FpsText fps={fps} avgFps={avgFps.current} />
          </Box>
        </Box>
      )}

      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          position: 'relative',
          aspectRatio: screenSize.isMobile ? '9 / 16' : undefined,
        }}
      >
        <video
          ref={videoRef}
          width="100vw"
          height="100vh"
          autoPlay
          playsInline
          style={{ transform: 'scaleX(-1)', objectFit: 'cover' }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />

        {/* Reps and tempo chart */}
        <Box
          width={'100%'}
          height={140}
          display="flex"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          {[
            DetectionStatus.READY,
            DetectionStatus.RECORDING,
            DetectionStatus.STOPPED,
          ].includes(statusRef.current) ? (
            <>
              <Box
                width={Math.max(160, window.innerWidth / 5)}
                height="100%"
                display="flex"
                flexDirection="column"
                justifyContent="flex-end"
                sx={{
                  position: 'relative',
                  zIndex: 0,
                }}
              >
                <Box
                  width="100%"
                  height="50%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backgroundColor: theme.palette.background.dark,
                  }}
                >
                  <Typography
                    fontSize={8}
                    lineHeight={1.2}
                    textAlign="center"
                    sx={{
                      color: theme.palette.background.lightBorder,
                    }}
                  >
                    Rep
                  </Typography>
                  <Typography
                    fontSize={32}
                    lineHeight={1.2}
                    fontWeight="bold"
                    textAlign="center"
                  >
                    {recordedRepsRef.current.left.length +
                      (recordedRepsRef.current.right
                        ? recordedRepsRef.current.right.length
                        : 0)}
                  </Typography>
                </Box>
                <Divider
                  sx={{ backgroundColor: theme.palette.background.lightBorder }}
                />
                <Box
                  width="100%"
                  height="50%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backgroundColor: theme.palette.background.dark,
                  }}
                >
                  <Typography
                    fontSize={8}
                    lineHeight={1.2}
                    textAlign="center"
                    sx={{
                      color: theme.palette.background.lightBorder,
                    }}
                  >
                    Tempo
                  </Typography>
                  <Typography
                    fontSize={32}
                    lineHeight={1.2}
                    fontWeight="bold"
                    textAlign="center"
                  >
                    {lastRecordedRepRef.current
                      ? `${lastRecordedRepRef.current.timeToExtremeMs !== undefined ? lastRecordedRepRef.current.timeToExtremeMs! / 1000 : '-'} - ${lastRecordedRepRef.current.timeFromExtremeToEndMs !== undefined ? lastRecordedRepRef.current.timeFromExtremeToEndMs! / 1000 : '-'}`
                      : '- : -'}
                  </Typography>
                </Box>
              </Box>

              {recordedRepsRef.current.left.length ||
              recordedRepsRef.current.right?.length ? (
                <TempoChart
                  selectedExercise={selectedExercise}
                  setIndex={-1}
                  width={
                    typeof window !== 'undefined'
                      ? window.innerWidth - 160
                      : 300
                  }
                  height={140}
                  passedReps={recordedRepsRef.current}
                  passedExercisePose={exercisePose}
                  isUnilateral={
                    selectedExercise?.exercise?.isUnilateral ||
                    exerciseDetectionData.rightSide !== undefined
                  }
                  hideLabels={true}
                  aiRecordingView
                  sx={{
                    width: `calc(100% - ${window !== undefined ? Math.max(160, window.innerWidth / 5) : 160}px)`,
                    backgroundColor: theme.palette.background.default,
                    opacity: 0.8,
                  }}
                />
              ) : (
                <Box
                  width={
                    typeof window !== 'undefined'
                      ? window.innerWidth - 160
                      : '100%'
                  }
                  height={140}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    opacity: 0.8,
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Box
                width="100%"
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                <Typography
                  width="100%"
                  textAlign="center"
                  fontWeight="bold"
                  fontSize={20}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    py: 1,
                    textTransform: 'uppercase',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {selectedExercise?.exercise?.name || defaultExerciseName}
                </Typography>
                {trainingInProgress?.training &&
                  selectedExercise &&
                  selectedExercise.sets[setIndex] && (
                    <AthleteTrainingExerciseSets
                      training={trainingInProgress?.training}
                      exercise={selectedExercise}
                      borderBottomRadius={false}
                      expanded={false}
                      trainingInProgressView
                      passedSet={selectedExercise.sets[setIndex]}
                      supersetIndex={supersetIndex}
                      setIndex={setIndex}
                      colorSetsToPrimary
                      aiDetectionView
                    />
                  )}
              </Box>
            </>
          )}
        </Box>

        {statusRef.current !== DetectionStatus.STOPPED && (
          <>
            {/* Person dot */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              <div
                ref={dotBackgroundRef}
                style={{
                  position: 'absolute',
                  width: 50,
                  height: 50,
                  borderRadius: '30%',
                  background: theme.palette.primary.main,
                  willChange: 'transform',
                }}
              />
              <div
                ref={dotRef}
                style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: theme.palette.background.default,
                  willChange: 'transform',
                }}
              />
            </div>
          </>
        )}

        <Button
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            mx: 'auto',
            zIndex: 100000,
          }}
          onClick={async () => {
            await finishAiDetection();
          }}
        >
          Finish
        </Button>

        {/* 🔧 Optional floating debug button (only shows if you want) */}
        {DEBUG && (
          <button
            onClick={openConsole}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              background: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: !lib.common.env.disableErudaAI() ? 0.7 : 0.9,
            }}
          >
            Debug
          </button>
        )}
      </Box>
    </Box>
  );
}
