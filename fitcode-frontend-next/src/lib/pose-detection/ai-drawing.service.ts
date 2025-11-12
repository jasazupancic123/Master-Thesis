import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { RefObject } from 'react';

import { lib } from '..';
import { HorizontalVertical } from './enum/horizontal-vertical.enum';
import type { KeypointId } from './enum/keypoint-id';
import { RepStatus } from './enum/rep-state';
import type {
  DrawRadar,
  ExerciseAngleCondition,
} from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { Point2D } from './type/point.type';
import type { Rep } from './type/rep.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import { theme } from '@/app/style';

export class AIDrawingService {
  private static _instance: AIDrawingService;
  private readonly keypoint: KeypointUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
  }

  static get instance(): AIDrawingService {
    if (!AIDrawingService._instance)
      AIDrawingService._instance = new AIDrawingService();
    return AIDrawingService._instance;
  }

  drawLines(
    drawLines: KeypointId[][][],
    keypoints: Keypoint[],
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    color: string
  ) {
    if (drawLines && drawLines.length) {
      drawLines.forEach((line) => {
        const points: Point2D[] = [];

        line.forEach((keypointIds) => {
          const pointKeypoints = keypointIds.map((kId) =>
            this.keypoint.getDesiredKeypointFromArray(keypoints, kId)
          );

          if (!lib.common.typeChecker.isKeypointArray(pointKeypoints)) return;

          const point = this.keypoint.getAvgPointCoordinates(
            pointKeypoints,
            true
          );

          if (!point) return;

          point.x = canvas.width * point.x;
          point.y = canvas.height * point.y;

          points.push(point);
        });

        for (let i = 0; i < points.length - 1; i++) {
          const prevDot = points[i];
          const nextDot = points[i + 1];

          lib.common.canvas.drawLine(ctx, prevDot, nextDot, color);
        }
      });
    }
  }

  drawLinesFromKeypoints(
    keypoints: (Keypoint | Point2D)[],
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    color: string
  ) {
    const points: Point2D[] = keypoints.map((keypoint) => {
      if (lib.common.typeChecker.isPoint2D(keypoint))
        return { x: keypoint.x * canvas.width, y: keypoint.y * canvas.height };

      return {
        x: keypoint.pixelPosition.x * canvas.width,
        y: keypoint.pixelPosition.y * canvas.height,
      };
    });

    for (let i = 0; i < points.length - 1; i++) {
      const prevDot = points[i];
      const nextDot = points[i + 1];

      lib.common.canvas.drawLine(ctx, prevDot, nextDot, color);
    }
  }

  drawInvalidAngles(
    currentInvalidAnglesRef: RefObject<ExerciseAngleCondition[]>,
    keypoints: Keypoint[],
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) {
    currentInvalidAnglesRef.current.forEach((angle) => {
      const angleKeypoints = angle.origin.map((kId) =>
        this.keypoint.getDesiredKeypointFromArray(keypoints, kId)
      );

      if (!lib.common.typeChecker.isKeypointArray(angleKeypoints)) return;

      const avgOriginPoint = this.keypoint.getAvgPointCoordinates(
        angleKeypoints,
        true
      );

      if (!avgOriginPoint) return;

      lib.common.canvas.drawCircle(
        ctx,
        {
          x: avgOriginPoint.x * canvas.width,
          y: avgOriginPoint.y * canvas.height,
        },
        20,
        theme.palette.error.main,
        theme.palette.common.white
      );
    });
  }

  drawRadars(state: {
    currentRepRefL: RefObject<Rep | null>;
    currentRepRefR: RefObject<Rep | null>;
    repStateRefL: RefObject<RepState>;
    repStateRefR: RefObject<RepState>;
    keypoints: Keypoint[];
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    drawRadars: DrawRadar[];
  }) {
    const {
      currentRepRefL,
      currentRepRefR,
      repStateRefL,
      repStateRefR,
      keypoints,
      canvas,
      ctx,
      drawRadars,
    } = state;

    const currentReps: Rep[] = [];

    if (
      currentRepRefL.current &&
      repStateRefL.current.status === RepStatus.IN_REP
    )
      currentReps.push(currentRepRefL.current);

    if (
      currentRepRefR.current &&
      repStateRefR.current.status === RepStatus.IN_REP
    )
      currentReps.push(currentRepRefR.current);

    if (currentReps.length && drawRadars && drawRadars.length) {
      for (const rep of currentReps) {
        drawRadars.forEach((radar) => {
          const originKeypoints = radar.startKeypointOrigin.map((kId) =>
            this.keypoint.getDesiredKeypointFromArray(
              rep.startFrameKeypoints,
              kId
            )
          );

          if (!lib.common.typeChecker.isKeypointArray(originKeypoints)) return;

          const origin = this.keypoint.getAvgPointCoordinates(
            originKeypoints,
            true
          );

          let startDynamicPoint = this.keypoint.getDesiredKeypointFromArray(
            rep.startFrameKeypoints,
            radar.dynamicKeypoint
          );

          const currentDynamicPoint = this.keypoint.getDesiredKeypointFromArray(
            keypoints,
            radar.dynamicKeypoint
          );

          if (!origin || !startDynamicPoint || !currentDynamicPoint) return;

          // If alignStartPoint is vertical, its navpična črta at x of origin, if horizontal then it's vodoravna črta at y of origin
          if (radar.alignStartPoint) {
            if (radar.alignStartPoint === HorizontalVertical.VERTICAL) {
              startDynamicPoint = {
                ...startDynamicPoint,
                pixelPosition: {
                  x: origin.x,
                  y: startDynamicPoint.pixelPosition.y,
                },
              };
            } else if (
              radar.alignStartPoint === HorizontalVertical.HORIZONTAL
            ) {
              startDynamicPoint = {
                ...startDynamicPoint,
                pixelPosition: {
                  x: startDynamicPoint.pixelPosition.x,
                  y: origin.y,
                },
              };
            }
          }

          lib.common.canvas.drawRadar(
            origin,
            {
              x: startDynamicPoint.pixelPosition.x,
              y: startDynamicPoint.pixelPosition.y,
            },
            {
              x: currentDynamicPoint.pixelPosition.x,
              y: currentDynamicPoint.pixelPosition.y,
            },
            canvas,
            ctx,
            theme.palette.error.main
          );
        });
      }
    }
  }

  setSmoothedCenter(
    result: PoseLandmarkerResult,
    centerPosRef: RefObject<Point2D | null>
  ) {
    let smoothedCenter: {
      x: number;
      y: number;
      z: number;
      visibility: number;
    } | null = null;

    for (const landmark of result.landmarks) {
      const keepKeypointsIndexes = [11, 12, 23, 24]; // shoulder & hip indices

      // pick only those 4
      const kept = landmark.filter((_, i) => keepKeypointsIndexes.includes(i));

      if (kept.length > 0) {
        const cx = kept.reduce((s, k) => s + k.x, 0) / kept.length;
        const cy = kept.reduce((s, k) => s + k.y, 0) / kept.length;
        const cz = kept.reduce((s, k) => s + (k.z ?? 0), 0) / kept.length;
        const cv =
          kept.reduce((s, k) => s + (k.visibility ?? 0), 0) / kept.length;

        const current = { x: cx, y: cy, z: cz, visibility: cv };

        // smoothing factor (0.2 = 20% new, 80% old)
        const alpha = 10;
        if (smoothedCenter) {
          smoothedCenter = {
            x: smoothedCenter.x * (1 - alpha) + current.x * alpha,
            y: smoothedCenter.y * (1 - alpha) + current.y * alpha,
            z: smoothedCenter.z * (1 - alpha) + current.z * alpha,
            visibility:
              smoothedCenter.visibility * (1 - alpha) +
              current.visibility * alpha,
          };
        } else {
          smoothedCenter = current;
        }

        centerPosRef.current = { x: smoothedCenter.x, y: smoothedCenter.y };
      }
    }
  }
}
