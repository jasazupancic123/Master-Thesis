import type { Theme } from '@mui/material';
import type { RefObject } from 'react';

import type { ExerciseDetectionData } from '../type/exercise-start-condition.type';
import type { Keypoint } from '../type/keypoint.type';
import type { Rep } from '../type/rep.type';
import { KeypointUtil } from './keypoint.util';
import { TimeUtil } from './time.util';
import { X } from '@mui/icons-material';

export class PoseDetectionGraphsUtil {
  // Call this right after you push a new ROM sample into romBuffer
  static renderROMAndTempoGraphs = (state: {
    exerciseDetectionData: ExerciseDetectionData;
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    romCanvasRef: RefObject<HTMLCanvasElement | null>;
    tempoCanvasRef: RefObject<HTMLCanvasElement | null>;
    normDomainRef: RefObject<{ min: number; max: number } | null>;
    theme: Theme;
  }) => {
    const {
      exerciseDetectionData,
      currentRepRef,
      recordedRepsRef,
      romCanvasRef,
      tempoCanvasRef,
      normDomainRef,
      theme,
    } = state;

    if (!exerciseDetectionData || !currentRepRef.current) return;

    const canvasROM = romCanvasRef.current;
    const canvasTempo = tempoCanvasRef.current;
    if (!canvasROM || !canvasTempo) return;

    const ctxROM = canvasROM.getContext('2d');
    const ctxTempo = canvasTempo.getContext('2d');
    if (!ctxROM || !ctxTempo) return;

    // ---- TEMPO GRAPH ----
    const longestRep = recordedRepsRef.current.length
      ? recordedRepsRef.current.reduce((longest, current) => {
          if (!longest.endValueTimestamp || !current.endValueTimestamp)
            return longest;
          const longestDuration =
            TimeUtil.getMsDiff(
              longest.startTimestamp,
              longest.endValueTimestamp
            ) - (longest.timeAtExtremeMs || 0);
          const currentDuration =
            TimeUtil.getMsDiff(
              current.startTimestamp,
              current.endValueTimestamp
            ) - (current.timeAtExtremeMs || 0);

          return currentDuration > longestDuration ? current : longest;
        })
      : currentRepRef.current;

    if (longestRep && longestRep.endValueTimestamp) {
      // const longestRepDuration =
      //   TimeUtil.getMsDiff(
      //     longestRep.startTimestamp,
      //     longestRep.endValueTimestamp
      //   ) - (longestRep.timeAtExtremeMs || 0);

      const longestRepDuration = TimeUtil.getMsDiff(
        longestRep.startTimestamp,
        longestRep.endValueTimestamp
      );

      const normalizedTimesToExtremeMs: number[] = [];
      const normalizedTimesFromExtremeToEndMs: number[] = [];
      const normalizedTimesAtExtremeMs: number[] = [];

      recordedRepsRef.current.forEach((rep) => {
        if (
          rep.timeToExtremeMs === undefined ||
          rep.timeFromExtremeToEndMs === undefined ||
          rep.timeAtExtremeMs === undefined
        ) {
          console.log('INVALID REP', { rep });
          return;
        }

        normalizedTimesToExtremeMs.push(
          rep.timeToExtremeMs / longestRepDuration
        );
        normalizedTimesFromExtremeToEndMs.push(
          rep.timeFromExtremeToEndMs / longestRepDuration
        );
        normalizedTimesAtExtremeMs.push(
          rep.timeAtExtremeMs / longestRepDuration
        );
      });

      const tempoRect = canvasTempo.getBoundingClientRect();

      PoseDetectionGraphsUtil.drawTempoOverlayBarChart({
        ctx: ctxTempo,
        w: tempoRect.width,
        h: tempoRect.height,
        normalizedTimesToExtremeMs,
        normalizedTimesFromExtremeToEndMs,
        normalizedTimesAtExtremeMs,
        theme,
      });
    }

    // ---- ROM GRAPH ----
    // If we haven't reached the extremum yet, then green color and positive bar value, if we have,
    // then red color and negative bar value

    const correctKeypointHistory: Keypoint[][] | undefined = recordedRepsRef
      .current.length
      ? recordedRepsRef.current
          .flatMap((r) => r.buffer.history)
          .concat(currentRepRef.current.buffer.history)
      : currentRepRef.current
        ? currentRepRef.current.buffer.history
        : undefined;

    if (!correctKeypointHistory) return;

    const values = correctKeypointHistory
      .flat()
      .filter((k) => k.id === exerciseDetectionData.romKeypointId)
      .map((k) =>
        KeypointUtil.getKeypointValueByType(
          k,
          exerciseDetectionData.romValueType
        )
      )
      .filter((v): v is number => v !== undefined); // type guard

    const minValue = values.length > 0 ? Math.min(...values) : undefined;
    const maxValue = values.length > 0 ? Math.max(...values) : undefined;

    if (minValue === undefined || maxValue === undefined) return;

    const detectedExtremum = currentRepRef.current?.detectedExtremum;

    if (currentRepRef.current.extremeValue === undefined && !detectedExtremum)
      return;

    const n = currentRepRef.current.buffer.history.length;

    const currentKeypoints = currentRepRef.current.buffer.history[n - 1];
    if (!currentKeypoints) return;

    const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentKeypoints,
      exerciseDetectionData.romKeypointId
    );
    if (!currentKeypoint) return;

    const currentValue = KeypointUtil.getKeypointValueByType(
      currentKeypoint,
      exerciseDetectionData.romValueType
    );

    if (currentValue === undefined) return;

    const allRawForDomain: number[] = [
      ...values, // from history (recorded + current)
      currentRepRef.current.startValue,
      currentRepRef.current.extremeValue!,
      currentValue,
    ];
    this.expandDomain(allRawForDomain, normDomainRef);

    // now normalize with the UPDATED domain
    const domain = normDomainRef.current!;
    const norm = (v: number) => (v - domain.min) / (domain.max - domain.min);

    const currentValueNormalized = norm(currentValue);
    const startValueNormalized = norm(currentRepRef.current.startValue);
    const endValueNormalized = norm(currentRepRef.current.endValue!);
    const extremeValueNormalized = norm(currentRepRef.current.extremeValue!);

    // previous reps normalized with the SAME (expanded) domain
    const previousNormalizedStartValues = recordedRepsRef.current
      .map((r) => r.startValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    const previousNormalizedEndValues = recordedRepsRef.current
      .map((r) => r.endValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    const previousNormalizedExtremeValues = recordedRepsRef.current
      .map((r) => r.extremeValue)
      .filter((v): v is number => v !== undefined)
      .map(norm);

    // optional: clamp to [0,1] only for drawing safety (should rarely matter now)
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    // draw
    PoseDetectionGraphsUtil.drawRomOverlayBarChart({
      ctx: ctxROM,
      w: canvasROM.width,
      h: canvasROM.height,
      currentValueNormalized: clamp01(currentValueNormalized),
      startValueNormalized: clamp01(startValueNormalized),
      endValueNormalized: clamp01(endValueNormalized),
      extremeValueNormalized: clamp01(extremeValueNormalized),
      previousNormalizedStartValues: previousNormalizedStartValues.map(clamp01),
      previousNormalizedEndValues: previousNormalizedEndValues.map(clamp01),
      previousNormalizedExtremeValues:
        previousNormalizedExtremeValues.map(clamp01),
      rising: !detectedExtremum,
      theme,
    });
  };

  private static expandDomain = (
    vals: number[],
    normDomainRef: RefObject<{ min: number; max: number } | null>
  ) => {
    if (!vals.length) return;
    const vmin = Math.min(...vals);
    const vmax = Math.max(...vals);
    if (!normDomainRef.current) {
      const safeMax = vmax === vmin ? vmin + 1e-9 : vmax;
      normDomainRef.current = { min: vmin, max: safeMax };
      return;
    }
    const d = normDomainRef.current;
    const newMin = Math.min(d.min, vmin);
    let newMax = Math.max(d.max, vmax);
    if (newMax === newMin) newMax = newMin + 1e-9;
    // only expand (never shrink)
    normDomainRef.current = { min: newMin, max: newMax };
  };

  private static drawTempoOverlayBarChart = (state: {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    normalizedTimesToExtremeMs: number[];
    normalizedTimesFromExtremeToEndMs: number[];
    normalizedTimesAtExtremeMs: number[];
    theme: Theme;
    inset?: number;
  }) => {
    const {
      ctx,
      w,
      h,
      normalizedTimesToExtremeMs,
      normalizedTimesFromExtremeToEndMs,
      normalizedTimesAtExtremeMs,
      theme,
      inset = 12,
    } = state;

    if (
      normalizedTimesToExtremeMs.length !==
        normalizedTimesFromExtremeToEndMs.length ||
      normalizedTimesToExtremeMs.length !== normalizedTimesAtExtremeMs.length
    ) {
      console.error('Tempo times lengths mismatch');
      return;
    }

    // HiDPI crispness
    const dpr = window.devicePixelRatio || 1;
    if ((ctx as any).__scaledForDPR__ !== dpr) {
      const canvas = ctx.canvas;
      const cssW = w,
        cssH = h;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      (ctx as any).__scaledForDPR__ = dpr;
    }

    ctx.clearRect(0, 0, w, h);

    // Layout
    const barW = 10; // wider
    const repGap = 10; // between reps
    const n = normalizedTimesToExtremeMs.length;

    // center line (dotted)
    const centerY = h / 2;
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(inset, centerY);
    ctx.lineTo(w - inset, centerY);
    ctx.stroke();
    ctx.restore();

    const left = inset; // x-start

    // max drawable half-height
    const halfH = Math.max(0, centerY - inset);

    // helpers
    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radii: { tl?: number; tr?: number; br?: number; bl?: number }
    ) => {
      const r = {
        tl: radii.tl ?? 0,
        tr: radii.tr ?? 0,
        br: radii.br ?? 0,
        bl: radii.bl ?? 0,
      };
      ctx.beginPath();
      ctx.moveTo(x + r.tl, y);
      ctx.lineTo(x + width - r.tr, y);
      if (r.tr) ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
      ctx.lineTo(x + width, y + height - r.br);
      if (r.br)
        ctx.quadraticCurveTo(
          x + width,
          y + height,
          x + width - r.br,
          y + height
        );
      ctx.lineTo(x + r.bl, y + height);
      if (r.bl) ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
      ctx.lineTo(x, y + r.tl);
      if (r.tl) ctx.quadraticCurveTo(x, y, x + r.tl, y);
      ctx.closePath();
    };

    // draw each rep
    for (let i = 0; i < n; i++) {
      const x = left + i * (barW + repGap);

      const timeToExtreme = Math.max(0, normalizedTimesToExtremeMs[i]); // 0..1 expected
      const timeFromExtremeToEnd = Math.max(
        0,
        normalizedTimesFromExtremeToEndMs[i]
      ); // 0..1 expected

      // scale normalized values to pixels
      const topLen = Math.min(1, timeToExtreme) * halfH;
      const bottomLen = Math.min(1, timeFromExtremeToEnd) * halfH;

      // subtle shadow for depth
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      // bottom segment: center → down (#EAFF48), rounded only at the bottom
      if (bottomLen > 0) {
        drawRoundedRect(
          x,
          centerY,
          barW,
          bottomLen,
          { br: barW / 2, bl: barW / 2 } // round at far (bottom) end
        );
        ctx.fillStyle = theme.palette.secondary.main;
        ctx.fill();
      }

      // top segment: center → up (#FFD734), rounded only at the top
      if (topLen > 0) {
        drawRoundedRect(
          x,
          centerY - topLen,
          barW,
          topLen,
          { tl: barW / 2, tr: barW / 2 } // round at far (top) end
        );
        ctx.fillStyle = theme.palette.primary.main;
        ctx.fill();
      }

      // Middle black bar for time at extreme (0..1 -> pixels)
      const atExtremeNorm = Math.max(
        0,
        Math.min(1, normalizedTimesAtExtremeMs[i])
      );

      if (atExtremeNorm > 0) {
        const blackBarW = 2; // keep it within bar width if you like
        const blackBarLenPx = -1 * atExtremeNorm * halfH; // full height range around center

        // center the black bar on the same x as the pair, centered over the green/red
        const bx = x + (barW - blackBarW) / 2;
        const by = centerY;

        // rounded vertical bar
        drawRoundedRect(bx, by, blackBarW, blackBarLenPx, {
          tl: blackBarW,
          tr: blackBarW,
        });

        ctx.fillStyle = '#222222';
        ctx.fill();
      }

      ctx.restore();
    }
  };

  private static drawRomOverlayBarChart = (state: {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    startValueNormalized: number; // current rep start (0..1)
    endValueNormalized: number; // current rep end (0..1)
    extremeValueNormalized: number; // current rep extreme (0..1)
    currentValueNormalized: number; // current rep current (0..1)
    previousNormalizedStartValues: number[]; // per rep (0..1)
    previousNormalizedEndValues: number[]; // per rep (0..1)
    previousNormalizedExtremeValues: number[]; // per rep (0..1)
    rising: boolean;
    theme: Theme;
    inset?: number;
  }) => {
    const {
      ctx,
      w,
      h,
      startValueNormalized,
      endValueNormalized,
      extremeValueNormalized,
      currentValueNormalized,
      previousNormalizedStartValues,
      previousNormalizedEndValues,
      previousNormalizedExtremeValues,
      rising,
      theme,
      inset = 12,
    } = state;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const startN = clamp01(startValueNormalized);
    const endN = clamp01(endValueNormalized);
    const extremeN = clamp01(extremeValueNormalized);
    const currentN = clamp01(currentValueNormalized);

    // full-canvas drawing area
    ctx.clearRect(0, 0, w, h);
    const x0 = inset;
    const x1 = w - inset;
    const y0 = inset;
    const y1 = h - inset;
    const toY = (v: number) => y1 - v * (y1 - y0);

    // layout: thin bars, tiny gap within a pair, small gap between reps
    const barW = 5; // thin
    const pairGap = 0; // between green/red in the same rep
    const repGap = 10; // between reps
    const pairWidth = barW * 2 + pairGap;

    let x = x0;

    // helper to draw a vertical segment between two normalized values
    const drawSegment = (
      bx: number,
      fromN: number,
      toN: number,
      color: string
    ) => {
      const yFrom = toY(clamp01(fromN));
      const yTo = toY(clamp01(toN));
      const y = Math.min(yFrom, yTo);
      const hSeg = Math.max(1, Math.abs(yFrom - yTo));
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(bx, y, barW, hSeg);
      ctx.restore();
    };

    // ---- 1) draw all previous reps as frozen pairs ----
    const Nprev = Math.min(
      previousNormalizedStartValues.length,
      previousNormalizedExtremeValues.length
    );
    for (let i = 0; i < Nprev; i++) {
      const startN = clamp01(previousNormalizedStartValues[i]);
      const endN = clamp01(previousNormalizedEndValues[i]);
      const extremeN = clamp01(previousNormalizedExtremeValues[i]);

      // stop if no more horizontal space
      if (x + pairWidth > x1) break;

      const greenX = x;
      const redX = x + barW + pairGap;

      // for finished reps:
      //  - green shows start → extreme (upstroke)
      //  - red shows extreme → start (downstroke)
      drawSegment(greenX, startN, extremeN, theme.palette.success.main);
      drawSegment(redX, extremeN, endN, theme.palette.error.main);

      x += pairWidth + repGap;
    }

    // ---- 2) draw the current rep at the end (live) ----
    if (x + pairWidth <= x1) {
      const greenX = x;
      const redX = x + barW + pairGap;

      if (rising) {
        // still going up: green live start → current, red empty
        drawSegment(greenX, startN, currentN, theme.palette.success.main);
      } else {
        // going down: green frozen start → extreme, red live extreme → current
        drawSegment(greenX, startN, extremeN, theme.palette.success.main);
        drawSegment(redX, extremeN, currentN, theme.palette.error.main);
      }
    }
  };
}
