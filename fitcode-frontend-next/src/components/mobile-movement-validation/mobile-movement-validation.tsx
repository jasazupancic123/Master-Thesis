'use client';

import { useEffect, useRef, useState } from 'react';
import { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Box } from '@mui/material';
import { enableCam, getStatusMessage, loadModel, predictWebcam } from './state';
import FpsText from './components/fps-text';
import StillnessText from './components/stillness-text';
import { DetectionStatus } from '@/controller/pose-detection/enum/detection-status';
import { STATUS_MESSAGES } from '@/controller/pose-detection/const/status-messages';
import MovementValidationHeader from './components/movement-validation-header';
import LoadingOverlay from '../loading-overlay/loading-overlay';
import { PoseModel } from '@/controller/pose-detection/enum/pose-model.enum';

export default function MobileMovementValidation() {
  const statusRef = useRef<DetectionStatus>(DetectionStatus.NOT_FULLY_IN_FRAME);
  const [model, setModel] = useState<PoseModel>(PoseModel.MEDIAPIPE);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  const [isStill, setIsStill] = useState(false);

  const [fps, setFps] = useState<number | null>(null);
  const [avgFps, setAvgFps] = useState<{ value: number; count: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingUtilsRef = useRef<DrawingUtils>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevFrameTimeRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);

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
          videoRef,
          canvasRef,
          drawingUtilsRef,
          canvasCtxRef,
          prevFrameTimeRef,
          lastVideoTimeRef,
          frameCountRef,
          setFps,
          setAvgFps,
        }),
      setError,
    });
  }, [poseLandmarker]);

  return (
    <Box width="100%" display="flex" flexDirection="column">
      {!poseLandmarker && <LoadingOverlay title="Loading model..." />}

      <MovementValidationHeader
        statusMessage={error ? `${error}` : getStatusMessage(statusRef.current)}
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

        <FpsText fps={fps} avgFps={avgFps} />

        <StillnessText isStill={isStill} />
      </Box>
    </Box>
  );
}
