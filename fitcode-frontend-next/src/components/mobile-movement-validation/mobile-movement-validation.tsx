'use client';

import { useEffect, useRef, useState } from 'react';
import { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box } from '@mui/material';
import { enableCam, getStatusMessage, loadModel, predictWebcam } from './state';
import FpsText from './components/fps-text';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import MovementValidationHeader from './components/movement-validation-header';
import LoadingOverlay from '../loading-overlay/loading-overlay';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';
import { KeypointHistory } from '@/controller/pose-detection/class/keypoint-history';
import { useScreenSize } from '@/store/screen-size.provider';
import {
  ConditionDirection,
  ExerciseStartCondition,
} from '@/controller/pose-detection/type/exercise-start-condition';
import { KeypointId } from '@/controller/pose-detection/enum/keypoint-id';
import { KeypointValueType } from '@/controller/pose-detection/enum/keypoint-value-type';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';

const DEBUG = false;

export default function MobileMovementValidation() {
  const keypointHistoryRef = useRef<KeypointHistory>(
    new KeypointHistory([], 100, true)
  ); // first make buffer of 100 frames, later set buffer size to undefined to get all recording of exercise
  const keypointBuffer = new KeypointHistory([], 100); // 100 frames buffer

  const exerciseStartConditions: ExerciseStartCondition[] = [
    {
      keypointId: KeypointId.LEFT_EYE,
      type: KeypointValueType.POSITION_Y,
      direction: ConditionDirection.ANY,
      duration: 750, // ms
      distance: 0.025, // meters
    },
    {
      keypointId: KeypointId.RIGHT_EYE,
      type: KeypointValueType.POSITION_Y,
      direction: ConditionDirection.ANY,
      duration: 750, // ms
      distance: 0.025, // meters
    },
    {
      keypointId: KeypointId.LEFT_SHOULDER,
      type: KeypointValueType.POSITION_Y,
      direction: ConditionDirection.ANY,
      duration: 750, // ms
      distance: 0.025, // meters
    },
    {
      keypointId: KeypointId.RIGHT_SHOULDER,
      type: KeypointValueType.POSITION_Y,
      direction: ConditionDirection.ANY,
      duration: 750, // ms
      distance: 0.025, // meters
    },
  ];

  const statusRef = useRef<DetectionStatus>(DetectionStatus.NOT_FULLY_IN_FRAME);
  const [statusMessage, setStatusMessage] = useState(
    STATUS_MESSAGES[statusRef.current]
  );
  const [model, setModel] = useState<PoseModel>(PoseModel.MEDIAPIPE);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  const [fps, setFps] = useState<number | null>(null);
  const avgFps = useRef<{ value: number; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const firstFrameInRecordingMode = useRef(false);

  const screenSize = useScreenSize();

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

        const keypointIds = [
          KeypointId.LEFT_EYE,
          KeypointId.RIGHT_EYE,
          KeypointId.LEFT_SHOULDER,
          KeypointId.RIGHT_SHOULDER,
        ];

        keypointIds.forEach((id) => {
          KeypointUtil.drawKeypointValuesGraph(
            keypointHistoryRef.current.history,
            id,
            KeypointValueType.POSITION_Y,
            ConditionDirection.ANY,
            0.02, // meters to move
            avgFps.current ? avgFps.current.value : 30
          );
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
      // @ts-ignore
      window.eruda?.init();
    };
    document.body.appendChild(script);

    return () => {
      // @ts-ignore
      window.eruda?.destroy?.();
      script.remove();
    };
  }, []);

  // (optional) programmatic toggle you can call e.g. from a button
  const openConsole = async () => {
    if (!DEBUG) return;

    if (typeof window === 'undefined') return;
    // @ts-ignore
    if (window.eruda) {
      // @ts-ignore
      window.eruda.show();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window.eruda?.init();
      // @ts-ignore
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
    enableCam({
      poseLandmarker,
      videoRef,
      predictWebcam: async () =>
        await predictWebcam({
          statusRef,
          model,
          poseLandmarker,
          keypointHistory: keypointHistoryRef.current,
          keypointBuffer,
          videoRef,
          canvasRef,
          drawingUtilsRef,
          canvasCtxRef,
          prevFrameTimeRef,
          lastVideoTimeRef,
          frameCountRef,
          avgFps,
          hasWeakFps: avgFps.current
            ? avgFps.current.value <= 15
            : screenSize.isMobile,
          exerciseStartConditions,
          firstFrameInRecordingMode,
          setFps,
          setStatusMessage,
        }),
      setError,
    });
  }, [poseLandmarker]);

  return (
    <Box width="100%" display="flex" flexDirection="column">
      {!poseLandmarker && <LoadingOverlay title="Loading model..." />}

      <MovementValidationHeader
        statusMessage={error ? `${error}` : statusMessage}
      />

      <Box sx={{ position: 'relative' }}>
        <video
          width="100%"
          height="100%"
          ref={videoRef}
          autoPlay
          playsInline
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', left: 0, top: 0 }}
        />

        <FpsText fps={fps} avgFps={avgFps.current} />

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
