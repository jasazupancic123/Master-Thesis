'use client';

import type { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box, Button } from '@mui/material';
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
import type { ExerciseRepStartCondition } from '@/controller/pose-detection/type/exercise-start-condition.type';
import type { Rep } from '@/controller/pose-detection/type/rep.type';
import type { RepState } from '@/controller/pose-detection/type/rep-state.type';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { EnvUtil } from '@/common/service/util/env.util';

const DEBUG = false;

interface MobileMovementValidationProps {
  selectedExercise: TrainingExercise | undefined;
  updateExerciseReps: ((repsCount: number) => void) | undefined;
  setSelectedTrackingMethod: SetState<TrackingMethod> | undefined;
}

export default function MobileMovementValidation(
  props: MobileMovementValidationProps
) {
  const screenSize = useScreenSize();

  const { selectedExercise, updateExerciseReps, setSelectedTrackingMethod } =
    props;

  // Buffers
  const keypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], 100, true)
  ); // first make buffer of 100 frames, later set buffer size to undefined to get all recording of exercise
  const keypointBuffer = new KeypointHistory([], 100); // 100 frames buffer, updates in the main loop based on fps

  const exerciseRepStartConditions: ExerciseRepStartCondition[] | undefined =
    selectedExercise
      ? EXERCISE_POSES.find((e) => e.exerciseIds.includes(selectedExercise.id))
          ?.conditions
      : [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.1, // meters
          },
          // {
          //   keypointId: KeypointId.LEFT_EYE,
          //   type: KeypointValueType.POSITION_Y,
          //   direction: ConditionDirection.NEGATIVE,
          //   duration: 750, // ms
          //   distance: 0.025, // meters
          // },
        ];

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
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const initedFirstFrameInRecordingMode = useRef(false);

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
      runLocally: EnvUtil.isDev(),
    });
  }, []);

  useEffect(() => {
    if (!exerciseRepStartConditions) return;

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
          exerciseStartConditions: exerciseRepStartConditions,
          initedFirstFrameInRecordingMode,
          setFps,
          setStatusMessage,
        }),
      setError,
    });
  }, [poseLandmarker]);

  const drawGraph = () => {
    if (!exerciseRepStartConditions) return;

    const keypointIds = exerciseRepStartConditions.map(
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

  if (!exerciseRepStartConditions) {
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
