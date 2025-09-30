'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import LoadingOverlay from '../loading-overlay/loading-overlay';
import FpsText from './components/fps-text';
import MovementValidationHeader from './components/movement-validation-header';
import RepsCounter from './components/reps-counter';
import { enableCam, getStatusMessage, loadModel, predictWebcam } from './state';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import type { SetState } from '@/common/type/state.type';
import { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import { ConditionDirection } from '@/controller/pose-detection/enum/condition-detection.enum';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { KeypointId } from '@/controller/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/controller/pose-detection/enum/keypoint-value-type';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/controller/pose-detection/enum/rep-state';
import { RepDetectionService } from '@/controller/pose-detection/rep-detection.service';
import type { ExerciseDetectionData } from '@/controller/pose-detection/type/exercise-start-condition.type';
import type { Rep } from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';

const DEBUG = false;

interface MobileMovementValidationProps {
  selectedExercise: TrainingExercise | undefined;
  selectedTrackingMethod: TrackingMethod | undefined;
  setSelectedTrackingMethod: SetState<TrackingMethod> | undefined;
  updateExerciseValues:
    | ((repsCount: number, tempo: number) => void)
    | undefined;
}

export default function MobileMovementValidation(
  props: MobileMovementValidationProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    selectedExercise,
    selectedTrackingMethod,
    setSelectedTrackingMethod,
    updateExerciseValues,
  } = props;

  // Buffers
  const keypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], 100, true)
  ); // first make buffer of 100 frames, later set buffer size to undefined to get all recording of exercise
  const keypointBuffer = new KeypointHistory([], 100); // 100 frames buffer, updates in the main loop based on fps
  const constantKeypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], undefined)
  ); // never cut, always all history

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

  // Rep State
  const repStateRef = useRef<RepState>({
    status: RepStatus.NONE,
    avgStartValue: null,
    avgExtremeValue: null,
  });
  const currentRepRef = useRef<Rep | null>(null);
  const recordedRepsRef = useRef<Rep[]>([]);

  // Model and PoseLandmarker
  const [model, setModel] = useState<PoseModel>(PoseModel.MEDIAPIPE);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // FPS and Error
  const [fps, setFps] = useState<number | null>(null);
  const avgFps = useRef<{ value: number; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const centerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Helper Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const romCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempoCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const initedFirstFrameInRecordingMode = useRef(false);
  const normDomainRef = useRef<{ min: number; max: number } | null>(null); // for graphs
  const dotRef = useRef<HTMLDivElement | null>(null);
  const dotBackgroundRef = useRef<HTMLDivElement | null>(null);
  const recordingTimestampRef = useRef<Date | null>(null);

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

    const wantDebug =
      /(\?|&)debug(=1)?(&|$)/.test(window.location.search) ||
      /(\?|&)eruda(=1)?(&|$)/.test(window.location.search) ||
      process.env.NEXT_PUBLIC_ENABLE_ERUDA === '1';

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
      updateExerciseValues &&
      selectedTrackingMethod === TrackingMethod.CAMERA &&
      setSelectedTrackingMethod
    ) {
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

      avgTimeAtExtremeMs = Math.max(
        Math.round(avgTimeAtExtremeMs / 1000 / recordedRepsRef.current.length),
        0
      );
      avgTimeToExtremeMs = Math.max(
        Math.round(avgTimeToExtremeMs / 1000 / recordedRepsRef.current.length),
        0
      );
      avgTimeFromExtremeToEndMs = Math.max(
        Math.round(
          avgTimeFromExtremeToEndMs / 1000 / recordedRepsRef.current.length
        ),
        0
      );
      avgIdleTimeMs = Math.max(
        Math.round(avgIdleTimeMs / 1000 / recordedRepsRef.current.length),
        0
      );

      const tempoString = `${avgTimeToExtremeMs}${avgTimeAtExtremeMs}${avgTimeFromExtremeToEndMs}${avgIdleTimeMs}`;

      let tempo = 2010;

      //check if tempo string can be converted to a number
      if (
        tempoString.trim() !== '' &&
        !isNaN(Number(tempoString)) &&
        Number(tempoString) > 999
      )
        tempo = parseInt(tempoString);

      setSelectedTrackingMethod(TrackingMethod.MANUAL);
      updateExerciseValues(recordedRepsRef.current.length, tempo);
    }
  };

  useEffect(() => {
    statusMessage.current = getStatusMessage(statusRef.current);
  }, [statusRef.current]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasCtxRef.current = canvasRef.current.getContext('2d');
    }

    loadModel({
      videoRef,
      canvasRef,
      drawingUtilsRef,
      setPoseLandmarker,
    });
  }, []);

  useEffect(() => {
    if (!exerciseDetectionData) return;

    if (statusRef.current === DetectionStatus.STOPPED) return;

    enableCam({
      poseLandmarker,
      videoRef,
      predictWebcam: async () =>
        await predictWebcam({
          statusRef,
          statusMessage,
          canProceedIntoReadyStateRef,
          repStateRef,
          model,
          poseLandmarker,
          keypointHistory: keypointHistoryRef.current,
          keypointBuffer,
          constantKeypointHistory: constantKeypointHistoryRef.current,
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
          exerciseDetectionData: exerciseDetectionData,
          initedFirstFrameInRecordingMode,
          normDomainRef,
          romCanvasRef,
          tempoCanvasRef,
          theme,
          centerPosRef,
          recordingTimestampRef,
          setFps,
          finishAiDetection,
        }),
      setError,
    });
  }, [poseLandmarker]);

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
      {!poseLandmarker && <LoadingOverlay title="Loading model..." />}

      {poseLandmarker && (
        <MovementValidationHeader
          statusMessage={error ? `${error}` : statusMessage.current}
        />
      )}

      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
        gap={1}
      >
        <Box width="100%" display="flex" justifyContent="space-between" px={1}>
          <FpsText fps={fps} avgFps={avgFps.current} />
          <RepsCounter reps={recordedRepsRef.current.length} />
        </Box>
      </Box>

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

        <canvas
          ref={tempoCanvasRef}
          style={{
            width: '100%',
            height: '50%',
            position: 'absolute',
            left: 0,
            top: 0, // top half
            zIndex: 1000,
          }}
        />

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

        <canvas
          ref={romCanvasRef}
          style={{
            width: '100%',
            height: '50%',
            position: 'absolute',
            left: 0,
            bottom: 0, // bottom half
            zIndex: 1000,
          }}
        />

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
              opacity:
                typeof window !== 'undefined' &&
                (/\bdebug\b|\beruda\b/.test(window.location.search) ||
                  process.env.NEXT_PUBLIC_ENABLE_ERUDA === '1')
                  ? 0.7
                  : 0.9,
            }}
          >
            Debug
          </button>
        )}
      </Box>
    </Box>
  );
}
