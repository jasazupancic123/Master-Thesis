'use client';

import {
  Box,
  Button,
  FormControl,
  Input,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgpu';

setWasmPaths({
  'tfjs-backend-wasm.wasm': '/tfjs/tfjs-backend-wasm.wasm',
  'tfjs-backend-wasm-simd.wasm': '/tfjs/tfjs-backend-wasm-simd.wasm',
  'tfjs-backend-wasm-threaded-simd.wasm':
    '/tfjs/tfjs-backend-wasm-threaded-simd.wasm',
});

const MODEL_WIDTH = 192;
const MODEL_HEIGHT = 256;
const CONF_THRESHOLD = 0.5;
const EDGE_THRESHOLD = 10;

export default function RTMPoseTFJS() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);
  const [backend, setBackend] = useState<string | null>(null);
  const [gpuSupported, setGpuSupported] = useState<boolean>(true);
  const [confThreshold, setConfThreshold] = useState(0.5);
  const confThresholdRef = useRef(confThreshold);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [keypointsNum, setKeypointsNum] = useState<number>();
  const [selectedModel, setSelectedModel] = useState<
    'rtmpose-t' | 'mobilenetv2'
  >('rtmpose-t');

  // FPS tracking
  const frameCount = useRef(0);
  const startTime = useRef(performance.now());
  const avgFpsRef = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem('selectedModel');
    if (stored) setSelectedModel(stored as 'rtmpose-t' | 'mobilenetv2');
  }, []);

  useEffect(() => {
    if (selectedModel === 'rtmpose-t') {
      setModelPath(
        '/models/rtmpose/rtmpose-t_body8-halpe26_700e-256x192/rtmpose_tfjs/model.json'
      );
      setKeypointsNum(26);
    } else if (selectedModel === 'mobilenetv2') {
      setModelPath(
        '/models/mobilenetv2/mobilenetv2_wo-deconv-8xb64-210e_coco-256x192_tfjs/model.json'
      );
      setKeypointsNum(17);
    }
  }, [selectedModel]);

  useEffect(() => {
    confThresholdRef.current = confThreshold;
  }, [confThreshold]);

  const updateBackend = async (backend: string) => {
    localStorage.setItem('tfjs-backend', backend);
    window.location.reload();
  };

  useEffect(() => {
    if (!modelPath) return;
    const init = async () => {
      //await tf.setBackend('webgl');
      //await tf.setBackend('cpu');
      //await tf.setBackend('webgpu');
      //await tf.setBackend('wasm');

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setGpuSupported(false);
      } else {
        try {
          const device = await adapter.requestDevice();
          setGpuSupported(true);
        } catch (e) {
          setGpuSupported(false);
        }
      }

      await tf.setBackend(localStorage.getItem('tfjs-backend') || 'webgl');
      //tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT', true);
      await tf.ready();
      setBackend(tf.getBackend());
      const loadedModel = await tf.loadGraphModel(modelPath);
      setModel(loadedModel);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };

    init();
  }, [modelPath]);

  useEffect(() => {
    confThresholdRef.current = confThreshold;
  }, [confThreshold]);

  const preprocess = (imageData: ImageData) => {
    const { data } = imageData;
    const input = new Float32Array(1 * 3 * MODEL_HEIGHT * MODEL_WIDTH);
    const mean = [123.675, 116.28, 103.53];
    const std = [58.395, 57.12, 57.375];

    for (let y = 0; y < MODEL_HEIGHT; y++) {
      for (let x = 0; x < MODEL_WIDTH; x++) {
        const idx = (y * MODEL_WIDTH + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        input[0 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] =
          (r - mean[0]) / std[0];
        input[1 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] =
          (g - mean[1]) / std[1];
        input[2 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] =
          (b - mean[2]) / std[2];
      }
    }

    return tf.tensor(input, [1, 3, MODEL_HEIGHT, MODEL_WIDTH]);
  };

  const runInference = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;

    const offscreen = document.createElement('canvas');
    offscreen.width = MODEL_WIDTH;
    offscreen.height = MODEL_HEIGHT;
    const octx = offscreen.getContext('2d');
    if (!octx) return;

    octx.drawImage(video, 0, 0, MODEL_WIDTH, MODEL_HEIGHT);
    const imageData = octx.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT);
    const inputTensor = preprocess(imageData);

    const output = await model.executeAsync({ input: inputTensor });
    const [ySimCC, xSimCC] = output;
    const xData = xSimCC.dataSync();
    const yData = ySimCC.dataSync();

    const keypoints = [];

    if (!keypointsNum) {
      toast.error('keypointsNum is not defined');
      return;
    }

    for (let i = 0; i < keypointsNum; i++) {
      const yStart = i * 512;
      const ySlice = yData.slice(yStart, yStart + 512);
      const yIdx = ySlice.indexOf(Math.max(...ySlice));
      const y = (yIdx / 512) * MODEL_HEIGHT;

      const xStart = i * 384;
      const xSlice = xData.slice(xStart, xStart + 384);
      const xIdx = xSlice.indexOf(Math.max(...xSlice));
      const x = (xIdx / 384) * MODEL_WIDTH;

      const conf = Math.max(xSlice[xIdx], ySlice[yIdx]);

      const scaledX = (x / MODEL_WIDTH) * vw;
      const scaledY = (y / MODEL_HEIGHT) * vh;

      if (
        conf > confThresholdRef.current &&
        scaledX > EDGE_THRESHOLD &&
        scaledX < vw - EDGE_THRESHOLD &&
        scaledY > EDGE_THRESHOLD &&
        scaledY < vh - EDGE_THRESHOLD
      ) {
        keypoints.push({ x: scaledX, y: scaledY, conf });
      }
    }

    frameCount.current += 1;
    const elapsed = (performance.now() - startTime.current) / 1000;
    const currentFps = frameCount.current / elapsed;
    avgFpsRef.current =
      (avgFpsRef.current * (frameCount.current - 1) + currentFps) /
      frameCount.current;

    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.fillStyle = 'lime';
    for (const kp of keypoints) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`Library: tf.js`, 10, 20);
    ctx.fillText(`FPS: ${currentFps.toFixed(1)}`, 10, 40);
    ctx.fillText(`Avg FPS: ${avgFpsRef.current.toFixed(1)}`, 10, 60);
    ctx.fillText(`Backend: ${backend}`, 10, 80);
    ctx.fillText(`WebGPU Supported: ${gpuSupported}`, 10, 100);
    ctx.fillText(`Confidence Threshold: ${confThresholdRef.current}`, 10, 120);
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    let animationFrameId: number;
    const loop = async () => {
      await runInference();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [model]);

  return (
    <div className="flex flex-col items-center">
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 130,
        }}
      >
        <FormControl variant="standard">
          <InputLabel htmlFor="model">Select model</InputLabel>
          <Select
            id="model"
            value={selectedModel}
            onChange={(e) => {
              if (!e.target.value) return;
              try {
                localStorage.setItem('selectedModel', e.target.value);
                window.location.reload();
              } catch (e) {
                toast.error('Error changing model');
              }
            }}
          >
            <MenuItem value="rtmpose-t">RTMPose-t</MenuItem>
            <MenuItem value="mobilenetv2">Mobilenetv2</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="standard">
          <InputLabel htmlFor="backend_">Select backend</InputLabel>
          <Select
            id="backend_"
            value={backend}
            onChange={(e) => {
              if (!e.target.value) return;
              updateBackend(e.target.value);
            }}
          >
            <MenuItem value="webgpu">WebGPU</MenuItem>
            <MenuItem value="webgl">WebGL</MenuItem>
            <MenuItem value="wasm">WASM</MenuItem>
            <MenuItem value="cpu">CPU</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="standard">
          <InputLabel htmlFor="conf-threshold">
            Conf Thr.(only rtmpose)
          </InputLabel>
          <Input
            id="conf-threshold"
            type="number"
            value={confThreshold}
            onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
            inputProps={{
              step: '0.1',
              max: '1',
              min: '0',
            }}
          />
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => {
            window.location.href = '/model-testing/onnx';
          }}
        >
          Go to onnx
        </Button>
      </Box>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="border border-gray-400" />
    </div>
  );
}
