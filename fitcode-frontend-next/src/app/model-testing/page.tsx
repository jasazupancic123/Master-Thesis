'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';

const MODEL_WIDTH = 192;
const MODEL_HEIGHT = 256;
const CONF_THRESHOLD = 0.5;
const EDGE_THRESHOLD = 10; //to remove points on edges, sometimes they get approximated to the edges, which is innacurate
const modelPath = '/models/rtmpose/rtmpose-t_body8-halpe26_700e-256x192.onnx';

export default function RTMPoseFinal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session, setSession] = useState<any>(null);

  // FPS tracking
  const frameCount = useRef(0);
  const startTime = useRef(performance.now());
  const avgFpsRef = useRef(0);

  useEffect(() => {
    const init = async () => {
      const sess = await ort.InferenceSession.create(modelPath);
      setSession(sess);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };

    init();
  }, []);

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

        input[0 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] = (r - mean[0]) / std[0];
        input[1 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] = (g - mean[1]) / std[1];
        input[2 * MODEL_HEIGHT * MODEL_WIDTH + y * MODEL_WIDTH + x] = (b - mean[2]) / std[2];
      }
    }

    return new ort.Tensor('float32', input, [1, 3, MODEL_HEIGHT, MODEL_WIDTH]);
  };

  const runInference = async () => {
    if (!session || !videoRef.current || !canvasRef.current) return;

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
    const tensor = preprocess(imageData);

    const output = await session.run({ input: tensor });
    const [xName, yName] = session.outputNames;
    const xSimCC = output[xName].data as Float32Array;
    const ySimCC = output[yName].data as Float32Array;

    const keypoints: { x: number; y: number; conf: number }[] = [];

    for (let i = 0; i < 26; i++) {
      const xStart = i * 384;
      const xSlice = xSimCC.slice(xStart, xStart + 384);
      const xIdx = xSlice.indexOf(Math.max(...xSlice));
      const x = (xIdx / 384) * MODEL_WIDTH;

      const yStart = i * 512;
      const ySlice = ySimCC.slice(yStart, yStart + 512);
      const yIdx = ySlice.indexOf(Math.max(...ySlice));
      const y = (yIdx / 512) * MODEL_HEIGHT;

      const conf = Math.max(xSlice[xIdx], ySlice[yIdx]);

      const scaledX = (x / MODEL_WIDTH) * vw;
      const scaledY = (y / MODEL_HEIGHT) * vh;

      if (
        conf > CONF_THRESHOLD &&
        scaledX > EDGE_THRESHOLD && scaledX < vw - EDGE_THRESHOLD &&
        scaledY > EDGE_THRESHOLD && scaledY < vh - EDGE_THRESHOLD
      ) {
        keypoints.push({ x: scaledX, y: scaledY, conf });
      }
    }

    // FPS calculation
    frameCount.current += 1;
    const elapsed = (performance.now() - startTime.current) / 1000; // in seconds
    const currentFps = frameCount.current / elapsed;

    // Update running average manually
    avgFpsRef.current = (avgFpsRef.current * (frameCount.current - 1) + currentFps) / frameCount.current;

    // Draw keypoints and FPS
    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.fillStyle = 'lime';

    for (const kp of keypoints) {
      if (kp.conf > CONF_THRESHOLD) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw FPS text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`FPS: ${currentFps.toFixed(1)}`, 10, 20);
    ctx.fillText(`Avg FPS: ${avgFpsRef.current.toFixed(1)}`, 10, 40);
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
  }, [session]);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="border border-gray-400" />
    </div>
  );
}