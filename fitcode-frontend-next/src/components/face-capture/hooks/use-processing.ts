import type {
  FaceLandmarker,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import { drawGuide, drawProgress } from '../actions/actions-canvas';
import {
  captureFrame,
  computeBBoxFromLandmarks,
  createDetector,
  estimateYawFromNose,
  pauseProcessing,
  resumeProcessing,
  startLoop,
  stopLoop,
} from '../actions/actions-processing';
import { playSuccessSound } from '../actions/actions-utils';
import type { FaceCaptureProps } from '../face-capture';
import { BASE_ASSET_URL, FACE_LANDMARKER_MODEL_URL } from '../face-capture';
import type { UseFaceCaptureDisplayReturnType } from './use-display';
import type { UseFaceCaptureUtilsReturnType } from './use-utils';
import { FaceCaptureStep } from '@/core/profile/enum/face-capture-step.enum';

export type UseFaceCaptureProcessingReturnType = ReturnType<
  typeof useFaceCaptureProcessing
>;

interface UseFaceCaptureProcessingProps {
  input: FaceCaptureProps;
  useFaceCaptureUtils: UseFaceCaptureUtilsReturnType;
  useFaceCaptureDisplay: UseFaceCaptureDisplayReturnType;
}

export default function useFaceCaptureProcessing(
  props: UseFaceCaptureProcessingProps
) {
  const { input, useFaceCaptureUtils, useFaceCaptureDisplay } = props;

  const {
    width = window ? window.innerWidth : 300,
    height = window ? window.innerHeight : 300,
    previews,
    setPreviews,
    setCaptures,
  } = input;

  const {
    isActive,
    openModal,
    labelRef,
    isDoneRef,
    setLabel,
    setIsActive,
    setOpenModal,
    setStreamError,
  } = useFaceCaptureUtils;

  const { viewport, overlayRef, drawRef } = useFaceCaptureDisplay;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stepRef = useRef<FaceCaptureStep>(FaceCaptureStep.FRONT);
  const isCapturingRef = useRef(false);
  const runningRef = useRef(true); // controls the RAF loop (processing on/off)
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<FaceLandmarker>(null);
  const stabilityRef = useRef(0);
  const faceBigEnoughRef = useRef(true);

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

    if (!video || !overlay || !draw || !detector) {
      return;
    }

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
      if (stepRef.current === FaceCaptureStep.FRONT)
        ok = Math.abs(yawDeg) <= thresholds.frontYawDeg && faceBigEnough;
      else if (stepRef.current === FaceCaptureStep.RIGHT)
        ok = yawDeg >= thresholds.profileYawDeg && faceBigEnough;
      else if (stepRef.current === FaceCaptureStep.LEFT)
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
        const stepAtCapture: FaceCaptureStep = stepRef.current; // snapshot
        stabilityRef.current = 0; // reset right away

        captureFrame({ videoRef, viewport }).then(({ blob, dataUrl }) => {
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
          if (stepAtCapture === FaceCaptureStep.FRONT) {
            stepRef.current = FaceCaptureStep.RIGHT;
          } else if (stepAtCapture === FaceCaptureStep.RIGHT) {
            stepRef.current = FaceCaptureStep.LEFT;
          } else if (stepAtCapture === FaceCaptureStep.LEFT) {
            // Done: stop stream and emit
            isDoneRef.current = true;
            setOpenModal(true);
            setIsActive(false);
            pauseProcessing({
              videoRef,
              rafRef,
              runningRef,
              stopTracks: false,
            }); // stop the loop & pause video during modal
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

  useEffect(() => {
    if (openModal)
      pauseProcessing({ videoRef, runningRef, rafRef, stopTracks: false });
    else if (isActive && !isDoneRef.current)
      resumeProcessing({ videoRef, runningRef, rafRef, tick });
  }, [openModal]);

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
        startLoop({ runningRef, rafRef, tick });
      } catch (e: unknown) {
        setStreamError(
          (e as Error)?.message ?? 'Unable to access camera or load face model.'
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) stopLoop({ runningRef, rafRef });
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      if (detectorRef.current?.close) detectorRef.current.close();
    };
  }, []);

  return {
    videoRef,
    stepRef,
    isCapturingRef,
    runningRef,
    rafRef,
    detectorRef,
    stabilityRef,
    faceBigEnoughRef,
    thresholds,
    tick,
  };
}
