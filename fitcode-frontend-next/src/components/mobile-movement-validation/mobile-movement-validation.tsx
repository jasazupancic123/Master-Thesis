'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import AthleteTrainingExerciseSets from '../athlete-training-exercise-sets/athlete-training-exercise-sets';
import LoadingOverlay from '../../util/loading-overlay/loading-overlay';
import { finishSet } from '../training-in-progress/components/training-in-progress-exercise-card/actions/actions-exercise-set';
import TrainingInProgressTempoChart from '../../common/util/tempo-chart';
import FpsText from './components/fps-text';
import MovementValidationHeader from './components/movement-validation-header';
import {
  enableCam,
  getStatusMessage,
  getTempoString,
  predictWebcam,
  setupVideoAndContex,
} from './state';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import { CommonService } from '@/common/service/common.service';
import type { SetState } from '@/common/type/state.type';
import { FrameBitmapBuffer } from '@/controller/pose-detection/class/frame-bitmap-buffer';
import { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { POSE_DETECTION_CONSTRAINTS } from '@/controller/pose-detection/const/pose-detection-constrains.const';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import { ConditionDirection } from '@/controller/pose-detection/enum/condition-detection.enum';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { KeypointId } from '@/controller/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/controller/pose-detection/enum/keypoint-value-type';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/controller/pose-detection/enum/rep-state';
import { RepDetectionService } from '@/controller/pose-detection/rep-detection.service';
import type { ExerciseDetectionData } from '@/controller/pose-detection/type/exercise-start-condition.type';
import type { Rep, RepInfo } from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import { getPoseLandmarker } from '@/controller/pose-detection/util/pose-landmarker-loader.util';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import EnvUtil from '@/common/util/env.util';
import { updateExerciseValues } from '../training-in-progress/components/training-in-progress-exercise-card/actions/actions-exercise';

const DEBUG = false;

const commonService = CommonService.instance;
const firebaseStorage = FirebaseStorageUtil.Instance;

export const EXERCISE_TIMES_ROUNDING_STEP_S = 0.2; // round to 0.2

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

  const trainingContext = useTraining();
  const { trainingInProgress, setTrainingInProgress } = trainingContext || {};

  const trainingInProgressContext = useTrainingInProgress();
  const { handleUpsertSet } = trainingInProgressContext || {};

  const authenticatedAuthContext = useAuthenticatedAuth();
  const { user } = authenticatedAuthContext || { user: null };

  const {
    selectedExercise,
    setSelectedExercise,
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

  const exerciseDetectionData: ExerciseDetectionData | undefined =
    selectedExercise
      ? EXERCISE_POSES.find((e) => e.exerciseIds.includes(selectedExercise.id))
          ?.data
      : {
          romKeypointId: KeypointId.LEFT_HIP,
          romValueType: KeypointValueType.POSITION_Y,
          romStartDirection: ConditionDirection.NEGATIVE,
          conditions: [
            {
              keypointId: KeypointId.LEFT_HIP,
              type: KeypointValueType.POSITION_Y,
              direction: ConditionDirection.NEGATIVE,
              duration: 1000, // ms
              distance: 0.04, // meters}
            },
          ],
        };

  // {
  // romKeypointId: KeypointId.RIGHT_WRIST,
  // romValueType: KeypointValueType.POSITION_Y,
  // romStartDirection: ConditionDirection.POSITIVE,
  // conditions: [
  //   {
  //     keypointId: KeypointId.RIGHT_WRIST,
  //     type: KeypointValueType.POSITION_Y,
  //     direction: ConditionDirection.POSITIVE,
  //     duration: 750, // ms
  //     distance: 0.1, // meters
  //   },
  // ],
  // };
  // : {
  //     romKeypointId: KeypointId.LEFT_HIP,
  //     romValueType: KeypointValueType.POSITION_Y,
  //     romStartDirection: ConditionDirection.NEGATIVE,
  //     conditions: [
  //       {
  //         keypointId: KeypointId.LEFT_HIP,
  //         type: KeypointValueType.POSITION_Y,
  //         direction: ConditionDirection.NEGATIVE,
  //         duration: 750, // ms
  //         distance: 0.05, // meters}
  //       },
  //     ],
  //   };

  // Main Status
  const statusRef = useRef<DetectionStatus>(DetectionStatus.NOT_FULLY_IN_FRAME);
  const statusMessage = useRef<string>(STATUS_MESSAGES[statusRef.current]);
  const canProceedIntoReadyStateRef = useRef(false); // used for clearing buffer before detecting stillness
  const stillnessCountdownRef = useRef<Date | null>(null); // countdown to recording start when stillness is detected

  // Model and PoseLandmarker
  const [model, setModel] = useState<PoseModel>(PoseModel.MEDIAPIPE);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // Rep State
  const repStateRef = useRef<RepState>({
    status: RepStatus.NONE,
    avgStartValue: null,
    avgExtremeValue: null,
  });
  const currentRepRef = useRef<Rep | null>(null);
  const recordedRepsRef = useRef<Rep[]>([]);
  const [repCount, setRepCount] = useState(0);

  // FPS and Error
  const [fps, setFps] = useState<number | null>(null);
  const avgFps = useRef<{ value: number; count: number } | null>(null);
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

    const wantDebug = !EnvUtil.AI.disableEruda();

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
          repStateRef,
          model,
          poseLandmarker,
          keypointHistory: keypointHistoryRef.current,
          keypointBuffer,
          constantKeypointHistory: constantKeypointHistoryRef.current,
          frameBitmapBufferRef,
          currentRepRef,
          recordedRepsRef,
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
    //     keypointId: exerciseDetectionData!.romKeypointId,
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
      !recordedRepsRef.current.length &&
      setSelectedTrackingMethod !== undefined
    ) {
      setSelectedTrackingMethod(TrackingMethod.MANUAL);
      return;
    }

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
      const images: ({ repNumber: number; url: string } | null)[] =
        recordedRepsRef.current
          .map((rep) => {
            if (!rep.extremumImageUrl) return null;

            return {
              repNumber: rep.repNumber,
              url: rep.extremumImageUrl || '',
            };
          })
          .filter((i) => i !== null) as { repNumber: number; url: string }[];

      let updatedExercise = {
        ...selectedExercise,
      } as TrainingExerciseRecording;

      if (selectedExercise) {
        updatedExercise = {
          ...selectedExercise,
          recordedSets: !selectedExercise.recordedSets
            ? [
                {
                  setIndex,
                  images,
                  reps: recordedRepsRef.current.map((rep) => {
                    return {
                      repNumber: rep.repNumber,
                      idleTimeMs: rep.idleTimeMs,
                      timeToExtremeMs: rep.timeToExtremeMs,
                      timeAtExtremeMs: rep.timeAtExtremeMs,
                      timeFromExtremeToEndMs: rep.timeFromExtremeToEndMs,
                      durationMs: rep.durationMs,
                    } as RepInfo;
                  }),
                },
              ]
            : [
                ...selectedExercise.recordedSets.filter(
                  (si) => si.setIndex !== setIndex
                ),
                {
                  setIndex,
                  images,
                  reps: recordedRepsRef.current.map((rep) => {
                    return {
                      repNumber: rep.repNumber,
                      idleTimeMs: rep.idleTimeMs,
                      timeToExtremeMs: rep.timeToExtremeMs,
                      timeAtExtremeMs: rep.timeAtExtremeMs,
                      timeFromExtremeToEndMs: rep.timeFromExtremeToEndMs,
                      durationMs: rep.durationMs,
                    } as RepInfo;
                  }),
                },
              ],
        } as TrainingExerciseRecording;

        // setSelectedExercise(updatedExercise);
      }

      const tempo = getTempoString({
        recordedRepsRef,
        commonService,
      });

      updateExerciseValues(
        {
          repsCount: recordedRepsRef.current.length,
          tempo,
          passedExercise: updatedExercise,
          updateSelectedExercise: true,
        },
        {
          useTraining: { ...trainingContext, trainingInProgress },
          useTrainingInProgress: trainingInProgressContext,
        }
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
    if (!recordedRepsRef.current.length) return;

    const postImages = async () => {
      isCurrentlySavingImageRef.current = true;

      const lastRep =
        recordedRepsRef.current[recordedRepsRef.current.length - 1];

      if (!lastRep || lastRep.extremumImageUrl || !lastRep.extremeKeypoint)
        return;

      const blob = await frameBitmapBufferRef.current.toBlobByFrameNum(
        lastRep.extremeKeypoint.frameNum,
        undefined,
        undefined,
        document
      );

      if (!blob) return;

      // training/trainingId-userId-componentId-supersetIndex-exerciseId-setIndex-repNumber
      const fileName = `${user.uid}:${componentId}:${supersetIndex}:${selectedExercise?.id}:${setIndex}:${lastRep.repNumber}`;

      const file = new File([blob], `${fileName}.jpg`, {
        type: blob.type || 'image/jpeg',
      });

      const path = `training/${trainingId}/${file.name}`;

      const url = await firebaseStorage.uploadFile(file, path);

      lastRep.extremumImageUrl = url;

      isCurrentlySavingImageRef.current = false;
    };

    postImages();
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
    let timeout: NodeJS.Timeout | null = null;
    if (startedExitTimeout) {
      timeout = setTimeout(async () => {
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
      {canExitWhenImageIsDoneSavingRef.current === true && (
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
          recordedRepsRef.current.length ? (
            <></>
          ) : (
            <MovementValidationHeader
              statusRef={statusRef}
              statusMessage={error ? `${error}` : statusMessage.current}
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

      {!EnvUtil.AI.disableAIFPS() && (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          sx={{
            position: 'absolute',
            bottom: 0,
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
          aspectRatio: screenSize.isSmallerThanLaptop ? '9 / 16' : undefined,
        }}
      >
        <video
          ref={videoRef}
          width="100%"
          height="100%"
          autoPlay
          playsInline
          style={{ transform: 'scaleX(-1)', objectFit: 'cover' }}
        />

        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', left: 0, top: 0 }}
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
                width={160}
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
                    {recordedRepsRef.current.length}
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
                    {recordedRepsRef.current.length
                      ? `${recordedRepsRef.current[recordedRepsRef.current.length - 1]?.timeToExtremeMs !== undefined ? recordedRepsRef.current[recordedRepsRef.current.length - 1].timeToExtremeMs! / 1000 : '-'} - ${recordedRepsRef.current[recordedRepsRef.current.length - 1]?.timeFromExtremeToEndMs !== undefined ? recordedRepsRef.current[recordedRepsRef.current.length - 1].timeFromExtremeToEndMs! / 1000 : '-'}`
                      : '- : -'}
                  </Typography>
                </Box>
              </Box>

              {recordedRepsRef.current.length ? (
                <TrainingInProgressTempoChart
                  selectedExercise={selectedExercise}
                  setIndex={-1}
                  width={
                    typeof window !== 'undefined'
                      ? window.innerWidth - 160
                      : 300
                  }
                  height={140}
                  passedReps={recordedRepsRef.current}
                  hideLabels={true}
                  aiRecordingView
                  sx={{
                    width: '100% !important',
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
              {trainingInProgress?.training &&
                selectedExercise &&
                selectedExercise.sets[setIndex] && (
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
                      {selectedExercise.exercise?.name}
                    </Typography>
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
              opacity: !EnvUtil.AI.disableEruda() ? 0.7 : 0.9,
            }}
          >
            Debug
          </button>
        )}
      </Box>
    </Box>
  );
}
