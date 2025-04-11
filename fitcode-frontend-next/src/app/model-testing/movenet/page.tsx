'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgpu';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import * as posedetection from '@tensorflow-models/pose-detection';
import toast from 'react-hot-toast';

setWasmPaths({
  'tfjs-backend-wasm.wasm': '/tfjs/tfjs-backend-wasm.wasm',
  'tfjs-backend-wasm-simd.wasm': '/tfjs/tfjs-backend-wasm-simd.wasm',
  'tfjs-backend-wasm-threaded-simd.wasm':
    '/tfjs/tfjs-backend-wasm-threaded-simd.wasm',
});

export default function MoveNetPose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<posedetection.PoseDetector | null>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [backend, setBackend] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [fps, setFps] = useState<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const fpsUpdateRef = useRef<number>(0);
  const prevFrameTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const avgFps = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    const load = async () => {
      await tf.setBackend(
        localStorage.getItem('tfjs-backend-movenet') || 'wasm'
      );
      await tf.ready();

      setSelectedModel(
        localStorage.getItem('selectedModelMovenet') || 'lightning'
      );
      setBackend(tf.getBackend());

      const detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {
          modelType: localStorage.getItem('selectedModelMovenet')
            ? localStorage.getItem('selectedModelMovenet') === 'lightning'
              ? posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING
              : posedetection.movenet.modelType.SINGLEPOSE_THUNDER
            : posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );
      detectorRef.current = detector;
    };

    load();
  }, []);

  const updateBackend = async (backend: string) => {
    localStorage.setItem('tfjs-backend-movenet', backend);
    window.location.reload();
  };

  const startWebcam = async () => {
    if (!detectorRef.current) {
      console.warn('MoveNet detector not ready yet');
      return;
    }

    const shouldEnable = !webcamRunning;
    setWebcamRunning(shouldEnable);

    if (shouldEnable && videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.play();
        detectPose();
      };
    } else {
      // Stop webcam
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      cancelAnimationFrame(animationFrameRef.current!);
      frameCount.current = 0;
      avgFps.current = 0;
    }
  };

  const detectPose = async () => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const detector = detectorRef.current!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const poses = await detector.estimatePoses(video);

    const now = performance.now();
    if (prevFrameTimeRef.current) {
      const delta = now - prevFrameTimeRef.current;
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 100) frameTimesRef.current.shift();

      if (now - fpsUpdateRef.current > 1000) {
        const avgDelta =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;

        const currentFps = Math.round(1000 / avgDelta);

        setFps(currentFps);
        frameCount.current++;

        if (frameCount.current === 1) {
          avgFps.current = currentFps;
        } else {
          avgFps.current =
            (avgFps.current * (frameCount.current - 1) + currentFps) /
            frameCount.current;
        }

        fpsUpdateRef.current = now;
      }
    }
    prevFrameTimeRef.current = now;

    // Draw keypoints
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    poses.forEach((pose) => {
      pose.keypoints.forEach((keypoint) => {
        if (keypoint.score && keypoint.score > 0.4) {
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      });
    });

    animationFrameRef.current = requestAnimationFrame(detectPose);
  };

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'black',
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
            transform: 'scaleX(-1)', // mirror like selfie view
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
            transform: 'scaleX(-1)', // mirror like selfie view
          }}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
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
          <Button variant="contained" onClick={startWebcam}>
            {webcamRunning ? 'Disable camera' : 'Enable camera'}
          </Button>
          <div>FPS: {fps ?? '--'}</div>
          <div>
            Avg FPS:{' '}
            {isFinite(avgFps.current) ? avgFps.current.toFixed(1) : '--'}
          </div>
        </Box>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 130,
        }}
      >
        <InputLabel htmlFor="model">Select model</InputLabel>
        <Select
          value={selectedModel}
          onChange={(e) => {
            if (!e.target.value) return;
            try {
              localStorage.setItem('selectedModelMovenet', e.target.value);
              window.location.reload();
            } catch (e) {
              toast.error('Error changing model');
            }
          }}
        >
          <MenuItem value="lightning">Lightning</MenuItem>
          <MenuItem value="thunder">Thunder</MenuItem>
        </Select>
        <Typography
          variant="body1"
          color="white"
          sx={{ p: 0, m: 0, margin: 'auto' }}
        >
          Backend
        </Typography>

        <Select
          id="backend_"
          value={backend}
          onChange={(e) => {
            if (!e.target.value) return;
            updateBackend(e.target.value as string);
          }}
          sx={{ p: 0, m: 0 }}
        >
          <MenuItem value="webgl">WebGL</MenuItem>
          <MenuItem value="wasm">WASM</MenuItem>
        </Select>
      </Box>
    </Box>
  );
}
