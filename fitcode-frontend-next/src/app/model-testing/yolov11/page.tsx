'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

type YoloPose = {
  box: { x1: number; y1: number; x2: number; y2: number; score: number };
  kpts: Array<{ x: number; y: number; c: number }>; // 17 keypoints (x,y,conf)
};

const MODEL_URL = '/models/yolov11/yolo11n-pose-web-model/model.json';
const INPUT_SIZE = 640;

export default function PosePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState('loading model...');
  const modelRef = useRef<tf.GraphModel | null>(null);

  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedRef = useRef(false); // Strict Mode guard

  useEffect(() => {
    if (startedRef.current) return; // prevents double-start in dev
    startedRef.current = true;

    let cancelled = false;

    const waitForVideoReady = (video: HTMLVideoElement) =>
      new Promise<void>((resolve) => {
        const check = () => {
          // HAVE_CURRENT_DATA = 2
          if (
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

    const start = async () => {
      try {
        setStatus('initializing tfjs...');
        await tf.setBackend('webgl');
        await tf.ready();

        setStatus('loading model...');
        const model = await tf.loadGraphModel(MODEL_URL);
        modelRef.current = model;

        setStatus('starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        // Wait until browser has real dimensions
        await video.play();
        await waitForVideoReady(video);

        if (cancelled) return;

        setStatus(`running (${video.videoWidth}x${video.videoHeight})`);
        runLoop();
      } catch (e: any) {
        console.error(e);
        setStatus(`error: ${e?.message ?? e}`);
      }
    };

    const runLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const model = modelRef.current;
      if (!video || !canvas || !model) return;

      // If video momentarily reports 0, skip this frame
      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        video.readyState < 2
      ) {
        rafRef.current = requestAnimationFrame(runLoop);
        return;
      }

      const ctx = canvas.getContext('2d')!;

      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();

      // internal drawing resolution (pixels)
      const cw = Math.round(rect.width);
      const ch = Math.round(rect.height);

      // only update when changed (avoid flicker)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // now draw using canvas.width/canvas.height coords
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // preprocess -> inference (keep it minimal; decode omitted here)
      const input = tf.tidy(() => {
        const frame = tf.browser.fromPixels(video);
        const resized = tf.image.resizeBilinear(frame, [
          INPUT_SIZE,
          INPUT_SIZE,
        ]);
        return resized.toFloat().div(255).expandDims(0);
      });

      try {
        const out = await model.executeAsync(input);

        const poses = await decodeYolo11Pose(
          out as tf.Tensor,
          video.videoWidth,
          video.videoHeight
        );

        console.log('poses:', poses);

        drawPoses(ctx, poses);

        tf.dispose(out);
      } finally {
        input.dispose();
      }

      rafRef.current = requestAnimationFrame(runLoop);
    };

    start();

    return () => {
      cancelled = true;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      // stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // free model (optional)
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontFamily: 'monospace' }}>{status}</div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          aspectRatio: '4 / 3', // keeps stable height; adjust if you want 16/9
          background: '#000',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // optional mirror for selfie cam
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

/**
 * YOLO11 pose TFJS export notes:
 * - metadata says task=pose, imgsz=640, kpt_shape=17x3 :contentReference[oaicite:1]{index=1}
 * - output is a single tensor ("Identity:0") :contentReference[oaicite:2]{index=2}
 *
 * In these exports, output commonly looks like:
 *   [1, 56, 8400]  OR  [1, 8400, 56]
 * Where 56 = 4 box + 1 score + 51 keypoint values (17*(x,y,conf)) :contentReference[oaicite:3]{index=3}
 */
async function decodeYolo11Pose(
  output: tf.Tensor,
  origW: number,
  origH: number
): Promise<YoloPose[]> {
  const data = (await output.data()) as Float32Array;
  const shape = output.shape;

  // Determine layout
  // Expect something like [1,56,8400] or [1,8400,56]
  const dim1 = shape[1];
  const dim2 = shape[2];

  let numCandidates: number;
  let isChannelsFirst: boolean;

  if (dim1 === 56 && dim2 !== undefined) {
    // [1,56,8400]
    isChannelsFirst = true;
    numCandidates = dim2;
  } else if (dim2 === 56 && dim1 !== undefined) {
    // [1,8400,56]
    isChannelsFirst = false;
    numCandidates = dim1;
  } else {
    // If this happens, just console.log(output.shape) and we’ll adjust decode.
    return [];
  }

  const poses: YoloPose[] = [];
  const SCORE_THRESH = 0.25;

  // Helper to read value at (cand, channel)
  const get = (cand: number, ch: number) => {
    if (isChannelsFirst) {
      // index = ch * numCandidates + cand
      return data[ch * numCandidates + cand];
    } else {
      // index = cand * 56 + ch
      return data[cand * 56 + ch];
    }
  };

  for (let i = 0; i < numCandidates; i++) {
    const score = get(i, 4);
    if (score < SCORE_THRESH) continue;

    // Box assumed in model-input pixel space (0..640-ish). If you see weird values,
    // log a few candidates and we’ll adapt (some exports use normalized coords).
    const cx = get(i, 0);
    const cy = get(i, 1);
    const w = get(i, 2);
    const h = get(i, 3);

    // Convert from 640-space to original video space
    const sx = origW / INPUT_SIZE;
    const sy = origH / INPUT_SIZE;

    const x1 = (cx - w / 2) * sx;
    const y1 = (cy - h / 2) * sy;
    const x2 = (cx + w / 2) * sx;
    const y2 = (cy + h / 2) * sy;

    const kpts: Array<{ x: number; y: number; c: number }> = [];
    // 51 values: 17*(x,y,conf) starting at channel 5
    let base = 5;
    for (let k = 0; k < 17; k++) {
      const kx = get(i, base + k * 3 + 0) * sx;
      const ky = get(i, base + k * 3 + 1) * sy;
      const kc = get(i, base + k * 3 + 2);
      kpts.push({ x: kx, y: ky, c: kc });
    }

    poses.push({ box: { x1, y1, x2, y2, score }, kpts });
  }

  // NOTE: This export has NMS disabled in metadata :contentReference[oaicite:4]{index=4}
  // so you’ll likely want to do your own NMS if you see duplicates.
  // For now: just keep top few by score.
  poses.sort((a, b) => b.box.score - a.box.score);
  return poses.slice(0, 5);
}

function drawPoses(ctx: CanvasRenderingContext2D, poses: YoloPose[]) {
  console.log('drawPoses:', poses);
  ctx.lineWidth = 2;
  ctx.font = '16px sans-serif';

  for (const p of poses) {
    const { x1, y1, x2, y2, score } = p.box;

    // bbox
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillText(score.toFixed(2), x1, Math.max(12, y1 - 4));

    // keypoints
    for (const kp of p.kpts) {
      // if (kp.c < 0.3) continue;
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
