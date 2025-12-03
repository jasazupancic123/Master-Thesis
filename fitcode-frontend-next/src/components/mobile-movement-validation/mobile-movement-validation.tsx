'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import TempoChart from '../charts/tempo/tempo-chart';
import { updateTrainingExerciseWithAI } from '../training-in-progress/actions/actions-exercise';
import { finishSet } from '../training-in-progress/actions/actions-exercise-set';
import FpsText from './fps-text';
import MovementValidationHeader from './movement-validation-header';
import {
  enableCam,
  getStatusMessage,
  getTempoObject,
  getTempoString,
  predictWebcam,
  setupVideoAndContex,
} from './state';
import { FrameBitmapBuffer } from '@/core/exercise-ai-prescriptions/class/frame-bitmap-buffer';
import { KeypointHistory } from '@/core/exercise-ai-prescriptions/class/keypoint-history';
import { EXERCISE_POSES } from '@/core/exercise-ai-prescriptions/const/exercise-poses';
import { STATUS_MESSAGES } from '@/core/exercise-ai-prescriptions/const/status-messages';
import { CurrentSideMutexValues } from '@/core/exercise-ai-prescriptions/enum/current-side-mutex-values.enum';
import { DetectionStatus } from '@/core/exercise-ai-prescriptions/enum/detection-status';
import { PoseModel } from '@/core/exercise-ai-prescriptions/enum/pose-model.enum';
import { RepStatus } from '@/core/exercise-ai-prescriptions/enum/rep-state';
import { RepDetectionService } from '@/core/exercise-ai-prescriptions/rep-detection.service';
import type { AvgFps } from '@/core/exercise-ai-prescriptions/type/avg-fps.type';
import type { CurrentSideMutex } from '@/core/exercise-ai-prescriptions/type/current-side-mutex.type';
import type {
  ExerciseAiPrescriptionData,
  ExerciseAngleCondition,
} from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';
import type { Point2D } from '@/core/exercise-ai-prescriptions/type/point.type';
import type {
  RecordedReps,
  Rep,
  RepInfo,
  RepsCount,
} from '@/core/exercise-ai-prescriptions/type/rep.type';
import type { RepState } from '@/core/exercise-ai-prescriptions/type/rep-state.type';
import { getPoseLandmarker } from '@/core/exercise-ai-prescriptions/util/pose-landmarker-loader.util';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { Training } from '@/core/training/type/training.type';
import type {
  RepImage,
  RepRomTimestamp,
  TrainingExercise,
  TrainingExerciseRecordedSet,
} from '@/core/training/type/training-exercise.type';
import type {
  PartialWorkload,
  Workload,
} from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import LoadingOverlay from '@/ui/loading-overlay';

const DEBUG = false;

export const EXERCISE_TIMES_ROUNDING_STEP_S = 0.1; // round to 0.1

interface MobileMovementValidationProps {
  userId: string;
  selectedExercise: TrainingExercise | undefined;
  setSelectedExercise:
    | SetState<TrainingExercise | undefined>
    | SetState<TrainingExercise | null>
    | undefined;
  selectedTrackingMethod: TrackingMethod | undefined;
  setSelectedTrackingMethod: SetState<TrackingMethod> | undefined;
  trainingId: string;
  componentId: string;
  supersetIndex: number;
  setIndex: number;
  stationViewProps?: {
    individualTraining: Training;
    workloads: Workload[];
    router: AppRouterInstance;
    handleUpsertSetFromStationView: (
      body: PartialWorkload,
      state: {
        exerciseId: string;
        supersetIndex: number;
        setIndex: number;
        isAiRecorded?: boolean;
      },
      router: AppRouterInstance
    ) => Promise<void>;
  };
}

export default function MobileMovementValidation(
  props: MobileMovementValidationProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const pathname = usePathname();

  const { user: authenticatedUser } = useAuthenticatedAuth() || {};
  const mainContext = useMain();
  const { exerciseAiPrescriptions, activeTraining } = mainContext || {};

  const trainingContext = useTrainings();
  const { trainingInProgress, setTrainingInProgress } = trainingContext || {};

  const trainingInProgressContext = useTrainingInProgress();

  const {
    userId,
    selectedExercise,
    selectedTrackingMethod,
    setSelectedTrackingMethod,
    trainingId,
    componentId,
    supersetIndex,
    setIndex,
    stationViewProps,
  } = props;

  const { handleUpsertSet } = trainingInProgressContext || {};

  // If stationViewProps is undefined, then we are in normal athlete view, so use authenticated user
  const user =
    !stationViewProps && authenticatedUser
      ? authenticatedUser
      : (mainContext?.users || []).find((u) => u.uid === userId) || null;

  const POSE_DETECTION_CONSTANTS = lib.common.env.getAiNumericConstants();

  const isSandbox = pathname.endsWith('pose-model');

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

  const [sandboxExercisesIds] = useState<string[] | undefined>(
    isSandbox
      ? EXERCISE_POSES.map((e) => e.exerciseIds)
          .flat()
          .sort()
      : undefined
  );
  const [sandboxExerciseId, setSandboxExercise] = useState<string | undefined>(
    sandboxExercisesIds && sandboxExercisesIds.length
      ? sandboxExercisesIds[0]
      : undefined
  );

  const [defaultExerciseName, setDefaultExerciseName] = useState('');

  const [exercisePose, setExercisePose] = useState<
    ExerciseAiPrescriptionData | undefined
  >(
    selectedExercise
      ? (exerciseAiPrescriptions || EXERCISE_POSES).find((e) =>
          e.exerciseIds.includes(selectedExercise.id)
        )?.data
      : (exerciseAiPrescriptions || EXERCISE_POSES)[0].data
  );

  const exerciseDetectionDataRef = useRef<
    ExerciseAiPrescriptionData | undefined
  >(
    selectedExercise
      ? (exerciseAiPrescriptions || EXERCISE_POSES).find((e) =>
          e.exerciseIds.includes(selectedExercise.id)
        )?.data
      : exercisePose
  );

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
    right: exerciseDetectionDataRef.current?.rightSide ? [] : undefined,
  });

  const lastRecordedRepRef = useRef<Rep | null>(null);

  const currentSideMutexRef = useRef<CurrentSideMutex>(
    exerciseDetectionDataRef.current?.cannotDoBothSidesSimultaneously
      ? CurrentSideMutexValues.NoneAtm
      : undefined
  );

  // const recordedRepsRef = useRef<RecordedReps>({
  //   left: demoReps,
  //   right: demoReps,
  // });

  const [repCount, setRepCount] = useState<RepsCount>({
    left: 0,
    right: exerciseDetectionDataRef.current?.rightSide ? 0 : undefined,
  });
  const repCountPrev = useRef<RepsCount>({
    left: 0,
    right: exerciseDetectionDataRef.current?.rightSide ? 0 : undefined,
  });

  // FPS and Error
  const [fps, setFps] = useState<number | null>(null);
  const avgFps = useRef<AvgFps>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedExitTimeout, setStartedExitTimeout] = useState(false);

  const centerPosRef = useRef<Point2D | null>(null);

  const currentInvalidAnglesRef = useRef<ExerciseAngleCondition[]>([]);

  // Helper Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const initedFirstFrameInRecordingMode = useRef(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const dotBackgroundRef = useRef<HTMLDivElement | null>(null);
  const recordingTimestampRef = useRef<Date | null>(null);
  const isCurrentlySavingImageRef = useRef(false);
  const canExitWhenImageIsDoneSavingRef = useRef(false);
  const doItTimestamp = useRef<Date | null>(null); // When the user gets into do it state
  const mapRef = useRef<HTMLDivElement | null>(null); // map (main) container
  const reloadingModelRef = useRef(false);
  const loadedPoseLandmarkerTimestampRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!sandboxExerciseId) return;

    const foundExercisePose = (exerciseAiPrescriptions || EXERCISE_POSES).find(
      (e) => e.exerciseIds.includes(sandboxExerciseId)
    );

    if (!foundExercisePose) return;

    setExercisePose(foundExercisePose.data);
    setDefaultExerciseName(sandboxExerciseId.replace('-', ' '));
  }, [sandboxExerciseId]);

  useEffect(() => {
    if (!exercisePose) return;

    if (exercisePose.rightSide) {
      recordedRepsRef.current.right = [];
      repCountPrev.current.right = 0;
    }

    if (!isSandbox) return;

    exerciseDetectionDataRef.current = exercisePose;

    if (exercisePose.cannotDoBothSidesSimultaneously)
      currentSideMutexRef.current = CurrentSideMutexValues.NoneAtm;
  }, [exercisePose]);

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
    if (!exerciseDetectionDataRef) return;

    if (statusRef.current === DetectionStatus.STOPPED) return;

    enableCam({
      poseLandmarker,
      videoRef,
      setError,
      looserConstraints:
        POSE_DETECTION_CONSTANTS.DISABLE_TIGHT_VIDEO_CONSTRAINTS === 1,
      predictWebcam: async () =>
        await predictWebcam({
          statusRef,
          statusMessage,
          doItTimestamp,
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
          currentInvalidAnglesRef,
          videoRef,
          canvasRef,
          canvasCtxRef,
          drawingUtilsRef,
          prevFrameTimeRef,
          lastVideoTimeRef,
          frameCountRef,
          isMobile: screenSize.isMobile,
          avgFps,
          exerciseDetectionDataRef,
          currentSideMutexRef,
          initedFirstFrameInRecordingMode,
          centerPosRef,
          recordingTimestampRef,
          isCurrentlySavingImageRef,
          canExitWhenImageIsDoneSavingRef,
          reloadingModelRef,
          POSE_DETECTION_CONSTANTS,
          setFps,
          finishAiDetection,
          setRepCount,
          setStartedExitTimeout,
          reloadModel,
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

    // Coach training station view - handle set finish differently

    if (stationViewProps) {
      if (!setSelectedTrackingMethod || !selectedExercise) return;

      if (!recordedRepsRef.current.left.length) {
        if (
          recordedRepsRef.current.right &&
          !recordedRepsRef.current.right.length
        ) {
          setSelectedTrackingMethod(TrackingMethod.MANUAL);
          return;
        } else if (!recordedRepsRef.current.right) {
          setSelectedTrackingMethod(TrackingMethod.MANUAL);
          return;
        }
      }

      const tempoL = getTempoObject({
        recordedReps: recordedRepsRef.current.left,
      });
      const tempoR = recordedRepsRef.current.right
        ? getTempoObject({
            recordedReps: recordedRepsRef.current.right,
          })
        : null;

      const {
        individualTraining,
        workloads,
        handleUpsertSetFromStationView,
        router,
      } = stationViewProps;

      await finishSet({
        userId: userId,
        exercise: selectedExercise,
        setIndex,
        supersetIndex,
        newRecordedSets: [],
        setTrainingInProgress,
        stationsViewProps: {
          individualTraining,
          componentId,
          router,
          handleUpsertSetFromStationView,
          workloadInput: {
            reps: recordedRepsRef.current.left.length,
            repsR: recordedRepsRef.current.right
              ? recordedRepsRef.current.right.length
              : undefined,
            tempoEcc: tempoL ? tempoL.ecc : undefined,
            tempoIso: tempoL ? tempoL.iso : undefined,
            tempoCon: tempoL ? tempoL.con : undefined,
            tempoIdle: tempoL ? tempoL.idle : undefined,
            tempoEccR: tempoR ? tempoR.ecc : undefined,
            tempoIsoR: tempoR ? tempoR.iso : undefined,
            tempoConR: tempoR ? tempoR.con : undefined,
            tempoIdleR: tempoR ? tempoR.idle : undefined,
          },
        },
        isAiRecorded: true,
        workloads: workloads || [],
        imagesL: recordedRepsRef.current.left
          .map((rep) => {
            if (!rep.extremumImageUrl) return null;

            return {
              repNumber: rep.repNumber,
              url: rep.extremumImageUrl || '',
              side: 'L',
            };
          })
          .filter((i) => i !== null) as RepImage[],
        imagesR: recordedRepsRef.current.right
          ? (recordedRepsRef.current.right
              .map((rep) => {
                if (!rep.extremumImageUrl) return null;

                return {
                  repNumber: rep.repNumber,
                  url: rep.extremumImageUrl || '',
                  side: 'R',
                };
              })
              .filter((i) => i !== null) as RepImage[])
          : [],
      });

      // handleAdvanceInSuperset({
      //   useTraining: { ...trainingContext, trainingInProgress },
      //   useTrainingInProgress: trainingInProgressContext,
      // });

      setSelectedTrackingMethod(TrackingMethod.MANUAL);

      return;
    }

    // Athlete mobile view - handle set finish normally
    if (
      selectedTrackingMethod === TrackingMethod.CAMERA &&
      exercisePose &&
      setSelectedTrackingMethod &&
      activeTraining &&
      trainingInProgress &&
      setTrainingInProgress !== undefined &&
      handleUpsertSet !== undefined &&
      selectedExercise !== undefined &&
      setIndex !== undefined &&
      supersetIndex !== undefined &&
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
        } else if (!recordedRepsRef.current.right) {
          setSelectedTrackingMethod(TrackingMethod.MANUAL);
          return;
        }
      }

      const tempoL = getTempoString({
        recordedReps: recordedRepsRef.current.left,
      });
      const tempoR = recordedRepsRef.current.right
        ? getTempoString({
            recordedReps: recordedRepsRef.current.right,
          })
        : null;

      let currentRecordedSets = trainingInProgress.recordedSets || [];

      const romLKeypoints = recordedRepsRef.current.left
        .map((r) =>
          r.buffer.getHistoryById(exercisePose.leftSide.romKeypointId)
        )
        .flat();

      const romL = romLKeypoints
        .map((r) => ({
          value: lib.ai.keypoint.getKeypointValueByType(
            r,
            exercisePose.romValueType
          ),
          timestamp: r.capturedAt,
        }))
        .filter((v) => v !== undefined) as RepRomTimestamp[];

      const romRKeypoints =
        recordedRepsRef.current.right && exercisePose.rightSide
          ? recordedRepsRef.current.right
              .map((r) =>
                r.buffer.getHistoryById(exercisePose.rightSide!.romKeypointId)
              )
              .flat()
          : undefined;

      const romR = romRKeypoints
        ? (romRKeypoints
            .map((r) => ({
              value: lib.ai.keypoint.getKeypointValueByType(
                r,
                exercisePose.romValueType
              ),
              timestamp: r.capturedAt,
            }))
            .filter((v) => v !== undefined) as RepRomTimestamp[])
        : undefined;

      const recordedSet: TrainingExerciseRecordedSet = {
        setIndex: setIndex,
        exerciseId: selectedExercise.id,
        supersetIndex: supersetIndex,
        repsL: recordedRepsRef.current.left.map((rep) => {
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
        }),
        repsR: recordedRepsRef.current.right
          ? recordedRepsRef.current.right.map((rep) => {
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
            })
          : undefined,
        romL,
        romR,
        imagesL: recordedRepsRef.current.left
          .map((rep) => {
            if (!rep.extremumImageUrl) return null;

            return {
              repNumber: rep.repNumber,
              url: rep.extremumImageUrl || '',
            };
          })
          .filter((i) => i !== null) as RepImage[],
        imagesR: recordedRepsRef.current.right
          ? (recordedRepsRef.current.right
              .map((rep) => {
                if (!rep.extremumImageUrl) return null;

                return {
                  repNumber: rep.repNumber,
                  url: rep.extremumImageUrl || '',
                };
              })
              .filter((i) => i !== null) as RepImage[])
          : undefined,
      };

      if (
        currentRecordedSets.some(
          (s) =>
            s.setIndex === setIndex &&
            s.supersetIndex === supersetIndex &&
            s.exerciseId === selectedExercise.id
        )
      ) {
        // replace existing set
        currentRecordedSets = currentRecordedSets.map((s) => {
          if (
            s.setIndex === setIndex &&
            s.supersetIndex === supersetIndex &&
            s.exerciseId === selectedExercise!.id
          ) {
            return recordedSet;
          }
          return s;
        });
      } else {
        // add new set
        currentRecordedSets.push(recordedSet);
      }

      updateTrainingExerciseWithAI(
        recordedRepsRef.current.left.length,
        recordedRepsRef.current.right?.length,
        tempoL,
        tempoR,
        selectedExercise,
        true,
        { ...trainingContext, trainingInProgress },
        trainingInProgressContext
      );

      await finishSet({
        userId: user.uid,
        exercise: selectedExercise,
        setIndex,
        supersetIndex,
        trainingInProgress,
        newRecordedSets: currentRecordedSets,
        setTrainingInProgress,
        handleUpsertSet,
        isAiRecorded: true,
        workloads: activeTraining?.workloads || [],
        imagesL: recordedRepsRef.current.left
          .map((rep) => {
            if (!rep.extremumImageUrl) return null;

            return {
              repNumber: rep.repNumber,
              url: rep.extremumImageUrl || '',
              side: 'L',
            };
          })
          .filter((i) => i !== null) as RepImage[],
        imagesR: recordedRepsRef.current.right
          ? (recordedRepsRef.current.right
              .map((rep) => {
                if (!rep.extremumImageUrl) return null;

                return {
                  repNumber: rep.repNumber,
                  url: rep.extremumImageUrl || '',
                  side: 'R',
                };
              })
              .filter((i) => i !== null) as RepImage[])
          : [],
      });

      // handleAdvanceInSuperset({
      //   useTraining: { ...trainingContext, trainingInProgress },
      //   useTrainingInProgress: trainingInProgressContext,
      // });

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
      const lm = await getPoseLandmarker(loadedPoseLandmarkerTimestampRef);
      setPoseLandmarker(lm);
    };

    loadModel();

    setupVideoAndContex({
      videoRef,
      canvasRef,
      drawingUtilsRef,
    });
  }, [canvasRef]);

  const reloadModel = async () => {
    if (POSE_DETECTION_CONSTANTS.DISABLE_MODEL_RELOAD) return;

    if (reloadingModelRef.current === true) return;

    if (
      loadedPoseLandmarkerTimestampRef.current &&
      Math.abs(
        dayjs().diff(loadedPoseLandmarkerTimestampRef.current, 'seconds')
      ) < POSE_DETECTION_CONSTANTS.TIME_BETWEEN_MODEL_RELOAD_S
    ) {
      return;
    }

    setPoseLandmarker(null);

    reloadingModelRef.current = true;

    await lib.common.generic.sleep(2); // wait for 2 secodns before reloading

    const lm = await getPoseLandmarker(loadedPoseLandmarkerTimestampRef, true);

    keypointHistoryRef.current.clear();

    setPoseLandmarker(lm);

    reloadingModelRef.current = false;
  };

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

      if (
        !lastRep ||
        lastRep.extremumImageUrl ||
        !lastRep.extremeKeypoint ||
        !user
      )
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

      const url = await lib.firebase.storage.uploadFile(file, path);

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

  if (!exerciseDetectionDataRef) {
    return <div>No pose detection logic for this exercise yet</div>;
  }

  return (
    <Box
      ref={mapRef}
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{
        position: 'relative',
      }}
    >
      {!isSandbox && canExitWhenImageIsDoneSavingRef.current === true && (
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
          <LoadingOverlay
            title={
              reloadingModelRef.current === true
                ? 'Reloading model...'
                : 'Loading model...'
            }
          >
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
                          POSE_DETECTION_CONSTANTS.STILLNESS_COUNTDOWN_DURATION_S,
                          'seconds'
                        )
                        .diff(dayjs(), 'second'),
                      0
                    ) + 1
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
          autoPlay
          playsInline
          muted // helps autoplay on iOS
          style={{
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
            objectFit: 'cover', // fills; will crop a bit by design
          }}
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
                {exerciseDetectionDataRef.current?.leftSide.extremumAngles !==
                  undefined && (
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
                      {lastRecordedRepRef.current?.extremumAngles
                        ? lastRecordedRepRef.current?.extremumAngles[0].name
                        : 'Angle'}
                    </Typography>
                    <Typography
                      fontSize={32}
                      lineHeight={1.2}
                      fontWeight="bold"
                      textAlign="center"
                    >
                      {lastRecordedRepRef.current?.extremumAngles
                        ? lastRecordedRepRef.current?.extremumAngles[0].value
                        : '-'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {recordedRepsRef.current.left.length ||
              recordedRepsRef.current.right?.length ? (
                <TempoChart
                  selectedExercise={selectedExercise}
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
                    exerciseDetectionDataRef.current?.rightSide !== undefined
                  }
                  hideLabels={true}
                  aiRecordingView
                  sx={{
                    width: `calc(100% - ${typeof window !== 'undefined' ? Math.max(160, window.innerWidth / 5) : 160}px)`,
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
              {isSandbox && (
                <Box
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                >
                  <Select
                    value={sandboxExerciseId}
                    onChange={(e) =>
                      setSandboxExercise(e.target.value as string)
                    }
                    sx={{
                      width: '70%',
                      mt: 1,
                      zIndex: 200,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    {(sandboxExercisesIds || []).map((exerciseId, i) => {
                      return (
                        <MenuItem
                          key={i}
                          value={exerciseId}
                          sx={{
                            textAlign: 'center',
                            textShadow: '1px 1px 2px rgba(23, 16, 16, 0.5)',
                          }}
                        >
                          {exerciseId}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </Box>
              )}
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
