'use client';

import type {
  FaceLandmarker,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import FaceCapturePreviewsModal from '../face-capture-previews-modal/face-capture-previews-modal';
import MyModal from '../../util/modal/modal';
import {
  computeBBoxFromLandmarks,
  createDetector,
  drawGuide,
  drawProgress,
  estimateYawFromNose,
  playSuccessSound,
  resizeCanvasToDisplaySize,
} from './state';
import { Step } from '@/common/enum/step.enum';
import type { SetState } from '@/common/type/state.type';

/**
 * FaceCapture (fixed capture reentrancy)
 * ------------------------------------------------------
 * Bugfixes:
 *  - Prevent multiple captures firing across consecutive RAF frames by using
 *    an isCapturing lock and resetting stability immediately when capture starts.
 *  - Step advancement uses the step value captured at the time of confirmation
 *    (avoids skipping RIGHT → jumping straight to LEFT).
 *  - onComplete is called using the up-to-date "next" state to avoid stale closures.
 *  - Keeps stacked overlays and safe readiness from previous iteration.
 */
const BASE_ASSET_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/wasm';
const FACE_LANDMARKER_MODEL_URL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;

type FaceCaptureProps = {
  width?: number; // video width (px)
  height?: number; // video height (px)
  setIsCapturingFace: SetState<boolean>;
  previews: {
    front?: string;
    right?: string;
    left?: string;
  };
  setPreviews: SetState<{
    front?: string;
    right?: string;
    left?: string;
  }>;
  captures: {
    front?: Blob;
    right?: Blob;
    left?: Blob;
  };
  setCaptures: SetState<{
    front?: Blob;
    right?: Blob;
    left?: Blob;
  }>;
};

export default function FaceCapture({
  width = window.innerWidth,
  height = window.innerHeight,
  setIsCapturingFace,
  previews,
  setPreviews,
  captures,
  setCaptures,
}: FaceCaptureProps) {
  const theme = useTheme();

  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<HTMLCanvasElement | null>(null);

  const detectorRef = useRef<FaceLandmarker>(null);
  const rafRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false); // <-- NEW: lock

  // Face capture state
  const stepRef = useRef<Step>(Step.FRONT);
  const isDoneRef = useRef(false);
  const stabilityRef = useRef(0);
  const faceBigEnoughRef = useRef(true);

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [isActive, setIsActive] = useState(false);
  const [openModal, setOpenModal] = useState<{ previews: boolean }>({
    previews: false,
  });
  const [streamError, setStreamError] = useState<string | null>(null);
  const [label, setLabel] = useState('Face forward');
  const labelRef = useRef(label); // tracks last emitted label

  // tweak as needed
  const thresholds = useMemo(
    () => ({
      frontYawDeg: 10,
      profileYawDeg: 35, // the degree of the face rotation
      stableFrames: 30, // number of stable frames needed to confirm detection
      minFaceBox: 0.2,
    }),
    []
  );

  const runningRef = useRef(true); // controls the RAF loop (processing on/off)

  // Start/stop the RAF loop
  const startLoop = () => {
    if (!runningRef.current) runningRef.current = true;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };
  const stopLoop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // Pause/resume processing (pause video; optionally stop camera tracks)
  const pauseProcessing = (stopTracks = false) => {
    stopLoop();
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
      if (stopTracks && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    }
  };
  const resumeProcessing = async () => {
    const v = videoRef.current;
    if (v) {
      try {
        await v.play();
      } catch {}
    }
    startLoop();
  };

  const reset = () => {
    setCaptures({});
    setPreviews({});
    stepRef.current = Step.FRONT;
    isDoneRef.current = false;
    setIsActive(true);
  };

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Start camera + detector
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        if (!window.isSecureContext) {
          toast.error('Only HTTPS is required for camera access');
          throw new Error(
            'Camera requires HTTPS (or localhost on the same device). Open this site over HTTPS.'
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: {
              ideal:
                viewport.w && viewport.h ? viewport.w / viewport.h : 16 / 9,
            },
          },
          audio: false,
        });

        if (cancelled) return;

        const video = videoRef.current!;
        video.srcObject = stream;

        try {
          await video.play();
        } catch {}

        // Wait until canplay to size canvases and start
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) return resolve();
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            resolve();
          };
          video.addEventListener('canplay', onCanPlay);
        });

        if (overlayRef.current) {
          overlayRef.current.width = width;
          overlayRef.current.height = height;
        }
        if (drawRef.current) {
          drawRef.current.width = width;
          drawRef.current.height = height;
        }

        detectorRef.current = await createDetector(
          BASE_ASSET_URL,
          FACE_LANDMARKER_MODEL_URL
        );

        if (cancelled) return;

        setIsActive(true);
        startLoop();
      } catch (e: unknown) {
        setStreamError(
          (e as Error)?.message ?? 'Unable to access camera or load face model.'
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) stopLoop();
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      if (detectorRef.current?.close) detectorRef.current.close();
    };
  }, []);

  // Main loop
  const tick = useCallback(() => {
    if (!runningRef.current) {
      rafRef.current = null;
      return;
    }

    const video = videoRef.current;
    const overlay = overlayRef.current;
    const draw = drawRef.current;
    const detector = detectorRef.current;
    if (!video || !overlay || !draw || !detector) return;

    const octx = overlay.getContext('2d');
    const dctx = draw.getContext('2d');
    if (!octx || !dctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    try {
      const newLabel = drawGuide(
        octx,
        overlay.width,
        overlay.height,
        stepRef.current,
        faceBigEnoughRef.current
      );

      // only update react state if the text actually changed
      if (labelRef.current !== newLabel) {
        labelRef.current = newLabel;
        setLabel(newLabel);
      }
    } catch {}
    try {
      dctx.clearRect(0, 0, draw.width, draw.height);
    } catch {}

    const ts = performance.now();
    let result: FaceLandmarkerResult | null = null;
    try {
      result = detector.detectForVideo(video, ts);
    } catch {
      result = null;
    }

    if (result?.faceLandmarks?.length) {
      const lms = result.faceLandmarks[0] as { x: number; y: number }[];
      try {
        dctx.save();
        dctx.setLineDash([2, 6]);
        dctx.lineWidth = 1.5;
        dctx.strokeStyle = '#00FFC2';
        dctx.fillStyle = '#00FFC2';
        for (const p of lms) {
          dctx.beginPath();
          dctx.arc(p.x * draw.width, p.y * draw.height, 1.6, 0, Math.PI * 2);
          dctx.fill();
        }
        dctx.restore();
      } catch {}

      const bbox = computeBBoxFromLandmarks(lms);
      const yawDeg = estimateYawFromNose(lms);
      const faceBigEnough = bbox.w >= thresholds.minFaceBox;

      faceBigEnoughRef.current = faceBigEnough;

      let ok = false;
      if (stepRef.current === Step.FRONT)
        ok = Math.abs(yawDeg) <= thresholds.frontYawDeg && faceBigEnough;
      else if (stepRef.current === Step.RIGHT)
        ok = yawDeg >= thresholds.profileYawDeg && faceBigEnough;
      else if (stepRef.current === Step.LEFT)
        ok = yawDeg <= -thresholds.profileYawDeg && faceBigEnough;

      // Stability counter
      stabilityRef.current = ok
        ? Math.min(stabilityRef.current + 1, thresholds.stableFrames + 2)
        : Math.max(stabilityRef.current - 1, 0);

      // If stable enough and not already capturing, capture and advance exactly one step
      if (
        ok &&
        stabilityRef.current >= thresholds.stableFrames - 1 &&
        !isCapturingRef.current
      ) {
        isCapturingRef.current = true; // lock immediately to avoid re-entry on next RAF
        const stepAtCapture: Step = stepRef.current; // snapshot
        stabilityRef.current = 0; // reset right away

        captureFrame().then(({ blob, dataUrl }) => {
          setCaptures((prev) => {
            const next = { ...prev, [stepAtCapture]: blob } as {
              front?: Blob;
              right?: Blob;
              left?: Blob;
            };
            return next;
          });
          setPreviews((prev) => ({ ...prev, [stepAtCapture]: dataUrl }));

          playSuccessSound();

          // Advance exactly one step
          if (stepAtCapture === Step.FRONT) {
            stepRef.current = Step.RIGHT;
          } else if (stepAtCapture === Step.RIGHT) {
            stepRef.current = Step.LEFT;
          } else if (stepAtCapture === Step.LEFT) {
            // Done: stop stream and emit
            isDoneRef.current = true;
            setOpenModal((prev) => ({ ...prev, previews: true }));
            setIsActive(false);
            pauseProcessing(false); // stop the loop & pause video during modal
            // Call onComplete with fresh values from state + this capture
            setCaptures((prev) => {
              const next = { ...prev, left: blob } as {
                front?: Blob;
                right?: Blob;
                left?: Blob;
              };

              return next;
            });
          }

          // small cooldown optional: setTimeout(() => { isCapturingRef.current = false; }, 80);
          isCapturingRef.current = false;
        });
      }

      try {
        drawProgress(
          octx,
          overlay.width,
          stabilityRef.current / thresholds.stableFrames
        );
      } catch {}
    } else {
      stabilityRef.current = 0;
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, [thresholds, previews]);

  // observe stage size and keep canvases in sync
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => {
      if (overlayRef.current) resizeCanvasToDisplaySize(overlayRef.current);
      if (drawRef.current) resizeCanvasToDisplaySize(drawRef.current);
    });
    ro.observe(stageRef.current);
    // kick once initially
    if (overlayRef.current) resizeCanvasToDisplaySize(overlayRef.current);
    if (drawRef.current) resizeCanvasToDisplaySize(drawRef.current);
    return () => ro.disconnect();
  }, []);

  // Capture current video frame as Blob + preview data URL
  const captureFrame = async () => {
    const video = videoRef.current!;
    const W = video.videoWidth || viewport.w || 1280;
    const H = video.videoHeight || viewport.h || 720;
    const tmp = document.createElement('canvas');
    tmp.width = W;
    tmp.height = H;
    const ctx = tmp.getContext('2d')!;
    ctx.drawImage(video, 0, 0, W, H);
    const blob: Blob = await new Promise((res) =>
      tmp.toBlob((b) => res(b!), 'image/jpeg', 0.95)
    );
    const dataUrl = tmp.toDataURL('image/jpeg', 0.92);
    return { blob, dataUrl };
  };

  useEffect(() => {
    if (openModal.previews) pauseProcessing(false);
    else if (isActive && !isDoneRef.current) resumeProcessing();
  }, [openModal.previews]);

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <div>
        <IconButton
          sx={{
            position: 'absolute',
            left: 5,
            top: 5,
            zIndex: 10000,
            p: 0.2,
            backgroundColor: theme.palette.background.default,
          }}
          onClick={() => setIsCapturingFace(false)}
        >
          <Close />
        </IconButton>

        {!openModal.previews && (
          <Typography
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              zIndex: 10000,
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.background.default,
              p: 0.2,
            }}
          >
            {labelRef.current}
          </Typography>
        )}

        {/* Stacked stage */}
        <div
          ref={stageRef}
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{
            width: '100vw',
            height: '100dvh', // dynamic viewport height on mobile (fallbacks below)
            background: '#000',
            position: 'relative',
            display: !isActive ? 'none' : undefined,
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
              objectFit: 'contain', // 👈 no crop; may letterbox
              display: isActive ? 'block' : 'none',
              transform: 'scaleX(-1)',
            }}
          />

          <canvas
            ref={drawRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
            }}
          />
          <canvas
            ref={overlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Bottom HUD */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))',
            }}
          >
            <div className="text-white text-sm">
              {stepRef.current === Step.FRONT && (
                <Typography textAlign="center">
                  Step 1/3 – Center your face inside the guide.
                </Typography>
              )}
              {stepRef.current === Step.RIGHT && (
                <Typography textAlign="center">
                  Step 2/3 – Turn right until we see your right profile.
                </Typography>
              )}
              {stepRef.current === Step.LEFT && !isDoneRef.current && (
                <Typography textAlign="center">
                  Step 3/3 – Turn left until we see your left profile.
                </Typography>
              )}
              {isDoneRef.current && (
                <Typography textAlign="center">
                  All set! You can continue.
                </Typography>
              )}
            </div>
          </div>
        </div>

        {streamError && (
          <Typography textAlign="center">{streamError}</Typography>
        )}
      </div>
      <MyModal
        isOpen={openModal.previews}
        setIsOpen={(open) =>
          setOpenModal((prev) => ({ ...prev, previews: open }))
        }
        onCancel={() => {
          reset();
          setOpenModal((prev) => ({ ...prev, previews: false }));
        }}
        cancelText="Cancel"
        sx={{ width: '100%' }}
      >
        <FaceCapturePreviewsModal
          previews={previews}
          captures={captures}
          setIsCapturingFace={setIsCapturingFace}
          heightWidthRatio={height / width}
        />
      </MyModal>
    </Box>
  );
}
