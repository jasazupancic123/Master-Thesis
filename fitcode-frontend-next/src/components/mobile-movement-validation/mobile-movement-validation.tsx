'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box, Button } from '@mui/material';
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
import { ValuesBuffer } from '@/controller/pose-detection/class/values-buffer';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import { ConditionDirection } from '@/controller/pose-detection/enum/condition-detection.enum';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { KeypointId } from '@/controller/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/controller/pose-detection/enum/keypoint-value-type';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { RepStatus } from '@/controller/pose-detection/enum/rep-state';
import type { ExerciseDetectionData } from '@/controller/pose-detection/type/exercise-start-condition.type';
import type { Keypoint } from '@/controller/pose-detection/type/keypoint.type';
import type { Rep } from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';

const DEBUG = false;

interface MobileMovementValidationProps {
  selectedExercise: TrainingExercise | undefined;
  updateExerciseReps: ((repsCount: number) => void) | undefined;
  setSelectedTrackingMethod: SetState<TrackingMethod> | undefined;
}

export default function MobileMovementValidation(
  props: MobileMovementValidationProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { selectedExercise, updateExerciseReps, setSelectedTrackingMethod } =
    props;

  // Buffers
  const keypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], 100, true)
  ); // first make buffer of 100 frames, later set buffer size to undefined to get all recording of exercise
  const keypointBuffer = new KeypointHistory([], 100); // 100 frames buffer, updates in the main loop based on fps
  const romBuffer = new ValuesBuffer(100); // range of motion buffer to show on graph, max 3 seconds of frames

  const exerciseDetectionData: ExerciseDetectionData | undefined =
    selectedExercise
      ? EXERCISE_POSES.find((e) => e.exerciseIds.includes(selectedExercise.id))
          ?.data
      : {
          romKeypointId: KeypointId.LEFT_WRIST,
          romValueType: KeypointValueType.POSITION_Y,
          romStartDirection: ConditionDirection.POSITIVE,
          conditions: [
            {
              keypointId: KeypointId.LEFT_WRIST,
              type: KeypointValueType.POSITION_Y,
              direction: ConditionDirection.POSITIVE,
              duration: 750, // ms
              distance: 0.1, // meters
            },
          ],
        };

  // Main Status
  const statusRef = useRef<DetectionStatus>(DetectionStatus.NOT_FULLY_IN_FRAME);
  const [statusMessage, setStatusMessage] = useState(
    STATUS_MESSAGES[statusRef.current]
  );

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

  // Helper Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const romCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const initedFirstFrameInRecordingMode = useRef(false);
  // Normalization domain that only expands
  const normDomainRef = useRef<{ min: number; max: number } | null>(null);

  const expandDomain = (vals: number[]) => {
    if (!vals.length) return;
    const vmin = Math.min(...vals);
    const vmax = Math.max(...vals);
    if (!normDomainRef.current) {
      const safeMax = vmax === vmin ? vmin + 1e-9 : vmax;
      normDomainRef.current = { min: vmin, max: safeMax };
      return;
    }
    const d = normDomainRef.current;
    const newMin = Math.min(d.min, vmin);
    let newMax = Math.max(d.max, vmax);
    if (newMax === newMin) newMax = newMin + 1e-9;
    // only expand (never shrink)
    normDomainRef.current = { min: newMin, max: newMax };
  };

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

        drawGraph();
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

  useEffect(() => {
    setStatusMessage(getStatusMessage(statusRef.current));
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

    enableCam({
      poseLandmarker,
      videoRef,
      predictWebcam: async () =>
        await predictWebcam({
          statusRef,
          repStateRef,
          model,
          poseLandmarker,
          keypointHistory: keypointHistoryRef.current,
          keypointBuffer,
          romBuffer,
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
          setFps,
          setStatusMessage,
          renderROM,
        }),
      setError,
    });
  }, [poseLandmarker]);

  const drawRomOverlayBarChart = (state: {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    startValueNormalized: number; // current rep start (0..1)
    endValueNormalized: number; // current rep end (0..1)
    extremeValueNormalized: number; // current rep extreme (0..1)
    currentValueNormalized: number; // current rep current (0..1)
    previousNormalizedStartValues: number[]; // per rep (0..1)
    previousNormalizedEndValues: number[]; // per rep (0..1)
    previousNormalizedExtremeValues: number[]; // per rep (0..1)
    rising: boolean;
    inset?: number;
  }) => {
    const {
      ctx,
      w,
      h,
      startValueNormalized,
      endValueNormalized,
      extremeValueNormalized,
      currentValueNormalized,
      previousNormalizedStartValues,
      previousNormalizedEndValues,
      previousNormalizedExtremeValues,
      rising,
      inset = 12,
    } = state;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const startN = clamp01(startValueNormalized);
    const endN = clamp01(endValueNormalized);
    const extremeN = clamp01(extremeValueNormalized);
    const currentN = clamp01(currentValueNormalized);

    // full-canvas drawing area
    ctx.clearRect(0, 0, w, h);
    const x0 = inset;
    const x1 = w - inset;
    const y0 = inset;
    const y1 = h - inset;
    const toY = (v: number) => y1 - v * (y1 - y0);

    // layout: thin bars, tiny gap within a pair, small gap between reps
    const barW = 5; // thin
    const pairGap = 0; // between green/red in the same rep
    const repGap = 10; // between reps
    const pairWidth = barW * 2 + pairGap;

    let x = x0;

    // helper to draw a vertical segment between two normalized values
    const drawSegment = (
      bx: number,
      fromN: number,
      toN: number,
      color: string
    ) => {
      const yFrom = toY(clamp01(fromN));
      const yTo = toY(clamp01(toN));
      const y = Math.min(yFrom, yTo);
      const hSeg = Math.max(1, Math.abs(yFrom - yTo));
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(bx, y, barW, hSeg);
      ctx.restore();
    };

    // ---- 1) draw all previous reps as frozen pairs ----
    const Nprev = Math.min(
      previousNormalizedStartValues.length,
      previousNormalizedExtremeValues.length
    );
    for (let i = 0; i < Nprev; i++) {
      const startN = clamp01(previousNormalizedStartValues[i]);
      const endN = clamp01(previousNormalizedEndValues[i]);
      const extremeN = clamp01(previousNormalizedExtremeValues[i]);

      // stop if no more horizontal space
      if (x + pairWidth > x1) break;

      const greenX = x;
      const redX = x + barW + pairGap;

      // for finished reps:
      //  - green shows start → extreme (upstroke)
      //  - red shows extreme → start (downstroke)
      drawSegment(greenX, startN, extremeN, theme.palette.success.main);
      drawSegment(redX, extremeN, endN, theme.palette.error.main);

      x += pairWidth + repGap;
    }

    // ---- 2) draw the current rep at the end (live) ----
    if (x + pairWidth <= x1) {
      const greenX = x;
      const redX = x + barW + pairGap;

      if (rising) {
        // still going up: green live start → current, red empty
        drawSegment(greenX, startN, currentN, theme.palette.success.main);
      } else {
        // going down: green frozen start → extreme, red live extreme → current
        drawSegment(greenX, startN, extremeN, theme.palette.success.main);
        drawSegment(redX, extremeN, currentN, theme.palette.error.main);
      }
    }
  };

  // call this right after you push a new ROM sample into romBuffer
  const renderROM = () => {
    if (!exerciseDetectionData || !currentRepRef.current) return;

    const canvas = romCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If we haven't reached the extremum yet, then green color and positive bar value, if we have,
    // then red color and negative bar value

    const correctKeypointHistory: Keypoint[][] | undefined = recordedRepsRef
      .current.length
      ? recordedRepsRef.current
          .flatMap((r) => r.buffer.history)
          .concat(currentRepRef.current.buffer.history)
      : currentRepRef.current
        ? currentRepRef.current.buffer.history
        : undefined;

    if (!correctKeypointHistory) return;

    const values = correctKeypointHistory
      .flat()
      .filter((k) => k.id === exerciseDetectionData.romKeypointId)
      .map((k) =>
        KeypointUtil.getKeypointValueByType(
          k,
          exerciseDetectionData.romValueType
        )
      )
      .filter((v): v is number => v !== undefined); // type guard

    const minValue = values.length > 0 ? Math.min(...values) : undefined;
    const maxValue = values.length > 0 ? Math.max(...values) : undefined;

    if (minValue === undefined || maxValue === undefined) return;

    const detectedExtremum = currentRepRef.current?.detectedExtremum;

    if (currentRepRef.current.extremeValue === undefined && !detectedExtremum)
      return;

    const n = currentRepRef.current.buffer.history.length;

    const currentKeypoints = currentRepRef.current.buffer.history[n - 1];
    if (!currentKeypoints) return;

    const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentKeypoints,
      exerciseDetectionData.romKeypointId
    );
    if (!currentKeypoint) return;

    const currentValue = KeypointUtil.getKeypointValueByType(
      currentKeypoint,
      exerciseDetectionData.romValueType
    );

    if (currentValue === undefined) return;

    const allRawForDomain: number[] = [
      ...values, // from history (recorded + current)
      currentRepRef.current.startValue,
      currentRepRef.current.extremeValue!,
      currentValue,
    ];
    expandDomain(allRawForDomain);

    // now normalize with the UPDATED domain
    const domain = normDomainRef.current!;
    const norm = (v: number) => (v - domain.min) / (domain.max - domain.min);

    const currentValueNormalized = norm(currentValue);
    const startValueNormalized = norm(currentRepRef.current.startValue);
    const endValueNormalized = norm(currentRepRef.current.endValue!);
    const extremeValueNormalized = norm(currentRepRef.current.extremeValue!);

    // previous reps normalized with the SAME (expanded) domain
    const previousNormalizedStartValues = recordedRepsRef.current
      .map((r) => r.startValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    const previousNormalizedEndValues = recordedRepsRef.current
      .map((r) => r.endValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    const previousNormalizedExtremeValues = recordedRepsRef.current
      .map((r) => r.extremeValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    // optional: clamp to [0,1] only for drawing safety (should rarely matter now)
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    // draw
    drawRomOverlayBarChart({
      ctx,
      w: canvas.width,
      h: canvas.height,
      currentValueNormalized: clamp01(currentValueNormalized),
      startValueNormalized: clamp01(startValueNormalized),
      endValueNormalized: clamp01(endValueNormalized),
      extremeValueNormalized: clamp01(extremeValueNormalized),
      previousNormalizedStartValues: previousNormalizedStartValues.map(clamp01),
      previousNormalizedEndValues: previousNormalizedEndValues.map(clamp01),
      previousNormalizedExtremeValues:
        previousNormalizedExtremeValues.map(clamp01),
      rising: !detectedExtremum,
    });
  };

  const drawGraph = () => {
    if (!exerciseDetectionData) return;

    const keypointIds = exerciseDetectionData.conditions.map(
      (condition) => condition.keypointId
    );

    keypointIds.forEach((id) => {
      KeypointUtil.drawKeypointValuesGraph(
        keypointHistoryRef.current.history,
        id,
        KeypointValueType.POSITION_Y,
        'whole_exercise'
      );
    });
  };

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
        {poseLandmarker && (
          <MovementValidationHeader
            statusMessage={error ? `${error}` : statusMessage}
          />
        )}
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
          ref={romCanvasRef}
          style={{
            height: '100%',
            position: 'absolute',
            left: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        />

        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          gap={2}
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 0,
          }}
        >
          <Button variant="contained" onClick={drawGraph} sx={{ mt: 2 }}>
            Save Graph
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (updateExerciseReps && setSelectedTrackingMethod) {
                setSelectedTrackingMethod(TrackingMethod.MANUAL);
                updateExerciseReps(recordedRepsRef.current.length);
              }
            }}
            sx={{ mt: 2 }}
          >
            Finish
          </Button>
        </Box>

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
