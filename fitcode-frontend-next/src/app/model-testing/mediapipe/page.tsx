'use client';

//OG URL: https://codepen.io/mediapipe-preview/pen/abRLMxN

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Input,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';

export default function Mediapipe() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );
  const [webcamRunning, setWebcamRunning] = useState(false);
  const webcamRunningRef = useRef(false);

  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<any>(null);
  const lastVideoTimeRef = useRef(-1);
  const prevFrameTimeRef = useRef<number | null>(null);
  const fpsUpdateRef = useRef<number>(0);
  const [fps, setFps] = useState<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const [avgFps, setAvgFps] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      canvasCtxRef.current = canvasRef.current.getContext('2d');
    }
    setSelectedModel(localStorage.getItem('selectedModelMediapipe') || 'lite');
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      let modelPath;
      if (selectedModel === 'lite') {
        modelPath = '/models/pose_landmarker/pose_landmarker_lite.task';
      } else if (selectedModel === 'full') {
        modelPath = '/models/pose_landmarker/pose_landmarker_full.task';
      } else if (selectedModel === 'heavy') {
        modelPath = '/models/pose_landmarker/pose_landmarker_heavy.task';
      } else {
        alert('Invalid model selected: ' + selectedModel);
        return;
      }
      const vision = await FilesetResolver.forVisionTasks('/wasm');
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      setPoseLandmarker(landmarker);
    };

    loadModel();
  }, [selectedModel]);

  const enableCam = async () => {
    if (!poseLandmarker) {
      console.log('Wait! poseLandmarker not loaded yet.');
      return;
    }

    const shouldEnable = !webcamRunningRef.current;
    webcamRunningRef.current = shouldEnable;
    setWebcamRunning(shouldEnable);

    if (shouldEnable && videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
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
        predictWebcam();
      };
    }
  };

  const predictWebcam = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvasCtxRef.current;
    const drawingUtils = drawingUtilsRef.current;

    const fullStringForAlert = `video: ${video!!.videoWidth}, ${video!!.videoHeight}, canvas: ${canvas!!.width}, ${canvas!!.height}`;

    if (!video || !canvas || !ctx || !poseLandmarker || !drawingUtils) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

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

      // Save delta for average FPS calc
      frameTimesRef.current.push(delta);

      // Only keep last 100 frames (optional)
      if (frameTimesRef.current.length > 100) {
        frameTimesRef.current.shift();
      }

      // Throttle UI update to once per second
      if (startTimeMs - fpsUpdateRef.current > 1000) {
        const avgDelta =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;

        const instFps = Math.round(1000 / delta);
        const average = Math.round(1000 / avgDelta);

        setFps(instFps);
        setAvgFps(average);
        fpsUpdateRef.current = startTimeMs;
      }
    }

    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;

      if (prevFrameTimeRef.current) {
        const delta = (startTimeMs - prevFrameTimeRef.current) / 1000;
        if (startTimeMs - fpsUpdateRef.current > 1000) {
          setFps(Math.round(1 / delta));
          fpsUpdateRef.current = startTimeMs;
        }
      }
      prevFrameTimeRef.current = startTimeMs;

      poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Flip horizontally to mirror webcam
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        for (const landmark of result.landmarks) {
          drawingUtils.drawLandmarks(landmark);
          drawingUtils.drawConnectors(
            landmark,
            PoseLandmarker.POSE_CONNECTIONS
          );
        }

        ctx.restore();
      });
    }

    if (webcamRunningRef.current) {
      window.requestAnimationFrame(predictWebcam);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'black', // optional fallback
        }}
      >
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
          autoPlay
          playsInline
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 10,
          }}
        >
          <Button variant="contained" onClick={enableCam}>
            {webcamRunning ? 'Disable camera' : 'Enable camera'}
          </Button>
          <div>FPS: {fps ?? '--'}</div>
          <div>Avg: {avgFps ?? '--'}</div>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 10,
          }}
        >
          <InputLabel htmlFor="model">Select model</InputLabel>
          <Select
            value={selectedModel}
            onChange={(e) => {
              if (!e.target.value) return;
              try {
                localStorage.setItem('selectedModelMediapipe', e.target.value);
                window.location.reload();
              } catch (e) {
                toast.error('Error changing model');
              }
            }}
          >
            <MenuItem value="lite">Lite</MenuItem>
            <MenuItem value="full">Full</MenuItem>
            <MenuItem value="heavy">Heavy</MenuItem>
          </Select>
        </Box>
      </Box>
    </Box>
  );
}
