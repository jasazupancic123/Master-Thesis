import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision';
import savitzkyGolay from 'ml-savitzky-golay';
import toast from 'react-hot-toast';

import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';
import { MetricConversionType } from '../enum/metric-conversion-type.enum';
import { PoseModel } from '../enum/pose-model.enum';
import type { Keypoint } from '../type/keypoint.type';
import type { NumericValueFrameNum } from '../type/numeric-value-frame-num';
import { lib } from '@/lib';
import { Point2D } from '../type/point.type';

export class KeypointUtil {
  private static _instance: KeypointUtil;

  private constructor() {}

  static get instance(): KeypointUtil {
    if (!KeypointUtil._instance) KeypointUtil._instance = new KeypointUtil();
    return KeypointUtil._instance;
  }

  getDesiredKeypointsByModel(
    // add different types to currentFrameKeypoints for different models
    currentFrameKeypoints: Landmark[] | undefined,
    currentFrameKeypointsPixel2D: NormalizedLandmark[] | undefined,
    model: PoseModel,
    capturedAt: Date,
    frameNum: number,
    videoWidth: number,
    videoHeight: number,
    centerHipsYToMiddleAnkleOrigin = false,
    centerKneesXToMiddleAnklesOrigin = false // we need this for lateral squat
  ): Keypoint[] {
    if (!currentFrameKeypoints) return [];

    let keypoints: Keypoint[] = [];

    switch (model) {
      case PoseModel.MEDIAPIPE: {
        const keypointIds = Object.values(KeypointId);

        currentFrameKeypoints.forEach((kp, i) => {
          const kp2D = currentFrameKeypointsPixel2D?.[i];

          keypoints.push({
            id: keypointIds[i] as unknown as KeypointId,
            position: {
              x: kp2D!.x,
              y: kp2D!.y,
              z: kp.z,
            },
            pixelPosition: {
              x: kp2D!.x,
              y: kp2D!.y,
            },
            velocity: 0,
            isValid: true,
            frameNum,
            capturedAt,
            visibility: kp.visibility,
          });
        });

        if (lib.common.env.convertToMetricScale()) {
          keypoints = this.convertToMetricScale(
            keypoints,
            MetricConversionType.SHOULDER_WIDTH,
            videoWidth,
            videoHeight
          );
        }

        if (centerHipsYToMiddleAnkleOrigin) {
          // Center LEFT_HIP and RIGHT_HIP to the origin of (LEFT_ANKLE + RIGHT_ANKLE)/2
          const leftHip = keypoints.find((k) => k.id === KeypointId.LEFT_HIP);
          const rightHip = keypoints.find((k) => k.id === KeypointId.RIGHT_HIP);

          const leftAnkle = keypoints.find(
            (k) => k.id === KeypointId.LEFT_ANKLE
          );
          const rightAnkle = keypoints.find(
            (k) => k.id === KeypointId.RIGHT_ANKLE
          );

          if (!leftHip || !rightHip || !leftAnkle || !rightAnkle) break;

          const y = (leftAnkle.position.y + rightAnkle.position.y) / 2;

          leftHip.position.y -= y;
          rightHip.position.y -= y;
        }

        if (centerKneesXToMiddleAnklesOrigin) {
          // Center LEFT_KNEE and RIGHT_KNEE to the origin of (LEFT_ANKLE + RIGHT_ANKLE)/2
          const leftKnee = keypoints.find((k) => k.id === KeypointId.LEFT_KNEE);
          const rightKnee = keypoints.find(
            (k) => k.id === KeypointId.RIGHT_KNEE
          );

          const leftAnkle = keypoints.find(
            (k) => k.id === KeypointId.LEFT_ANKLE
          );
          const rightAnkle = keypoints.find(
            (k) => k.id === KeypointId.RIGHT_ANKLE
          );

          if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) break;

          const x = (leftAnkle.position.x + rightAnkle.position.x) / 2;

          leftKnee.position.x -= x;
          rightKnee.position.x -= x;
        }

        break;
      }
      default: {
        return [];
      }
    }

    return keypoints;
  }

  getDesiredKeypointFromArray(
    keypoints: Keypoint[],
    keypointId: KeypointId
  ): Keypoint | undefined {
    return (keypoints || []).find((kp) => kp.id === keypointId);
  }

  /**
   * 
   * @param keypoints Ussually keypoints with same id
   * @param valueType 
   * @param pixelPosition 
   * @returns Ordered values of the provided value of keypoints
   */
  getValuesByType(
    keypoints: Keypoint[],
    valueType: KeypointValueType,
    pixelPosition?: boolean
  ): number[] {
    return keypoints
      .map((k) => this.getKeypointValueByType(k, valueType, pixelPosition))
      .filter((x) => x !== undefined);
  }

  getKeypointsValuesByType(
    keypoint1: Keypoint,
    keypoint2: Keypoint,
    type: KeypointValueType
  ): { value1: number | undefined; value2: number | undefined } {
    switch (type) {
      case KeypointValueType.POSITION_X:
        return { value1: keypoint1.position.x, value2: keypoint2.position.x };
      case KeypointValueType.POSITION_Y:
        return { value1: -keypoint1.position.y, value2: -keypoint2.position.y };
      case KeypointValueType.POSITION_Z:
        return { value1: keypoint1.position.z, value2: keypoint2.position.z };
      case KeypointValueType.VELOCITY:
        return { value1: keypoint1.velocity, value2: keypoint2.velocity };
      default:
        return { value1: undefined, value2: undefined };
    }
  }

  getKeypointValueByType(
    keypoint: Keypoint,
    type: KeypointValueType,
    pixelPosition?: boolean
  ): number | undefined {
    if (!keypoint) return undefined;

    switch (type) {
      case KeypointValueType.POSITION_X:
        if (pixelPosition) return keypoint.pixelPosition.x;
        return keypoint.position.x;
      case KeypointValueType.POSITION_Y:
        if (pixelPosition) return keypoint.pixelPosition.y;
        return -keypoint.position.y; // invert Y to have +Y as up
      case KeypointValueType.POSITION_Z:
        return keypoint.position.z;
      case KeypointValueType.VELOCITY:
        return keypoint.velocity;
      default:
        return undefined;
    }
  }

  getAvgPointCoordinates(
    keypoints: Keypoint[],
    pixelPosition?: boolean
  ): Point2D | null {
    if (keypoints.length === 0) return null;
    else if (keypoints.length === 1) {
      return {
        x: pixelPosition
          ? keypoints[0].pixelPosition.x
          : keypoints[0].position.x,
        y: pixelPosition
          ? keypoints[0].pixelPosition.y
          : keypoints[0].position.y,
      };
    }

    const xs = this.getValuesByType(
      keypoints,
      KeypointValueType.POSITION_X,
      pixelPosition
    );
    const ys = this.getValuesByType(
      keypoints,
      KeypointValueType.POSITION_Y,
      pixelPosition
    );

    if (xs.length !== keypoints.length || ys.length !== keypoints.length)
      return null;

    if (
      !lib.common.typeChecker.isNumberArray(xs) ||
      !lib.common.typeChecker.isNumberArray(ys)
    )
      return null;

    const avgX =
      xs.reduce((prev, current) => (prev += current), 0) / keypoints.length;
    const avgY =
      ys.reduce((prev, current) => (prev += current), 0) / keypoints.length;

    return {
      x: avgX,
      y: avgY,
    };
  }

  smoothKeypointValues(
    keypointValues: NumericValueFrameNum[] | number[],
    fps = 30,
    windowSizeProps?: number,
    polynomialProps?: number
  ): NumericValueFrameNum[] | number[] {
    // ~0.5–1.5 reps/sec → use a small odd window (11–21 for 30 fps)
    const windowSize = windowSizeProps || 11;
    const polynomial = polynomialProps || 3;

    // sampling interval (seconds per sample)
    const dx = 1 / fps;

    const values = savitzkyGolay(
      keypointValues.map((k) =>
        this.checkIsNumericValueFrameNum(k) ? k.value : k
      ),
      dx,
      {
        windowSize,
        polynomial,
        derivative: 0,
        pad: 'pre', // handle edges
        padValue: 'replicate',
      }
    );

    if (keypointValues.length !== values.length)
      toast.error('Smoothing error: length mismatch');

    return this.checkIsNumericValueFrameNumArray(keypointValues)
      ? values.map((v, i) => ({
          value: v,
          frameNum: keypointValues[i].frameNum,
        }))
      : values;
  }

  drawKeypointValuesGraph(
    history: Keypoint[][] | number[],
    keypointId: KeypointId,
    type: KeypointValueType,
    name?: string
  ) {
    const width = 600;
    const height = 300;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // helper to extract numeric series (no per-series normalization!)
    const seriesFrom = (h: Keypoint[][]) =>
      h
        .map((frame) => {
          const kp = frame.find((k) => k.id === keypointId);
          if (!kp) return undefined;
          // make sure you call your util correctly (args order!)
          const v = this.getKeypointValueByType(kp, type);
          if (v === null || !Number.isFinite(Number(v))) return undefined;

          return Number(v);
        })
        .filter((v): v is number => Number.isFinite(v));

    const isNumberArray = (arr: number[] | Keypoint[][]): arr is number[] => {
      return arr.every((item) => typeof item === 'number');
    };

    const fullVals: number[] = isNumberArray(history)
      ? history
      : seriesFrom(history);

    const smoothedVals = this.smoothKeypointValues(fullVals) as number[];

    const draw = (vals: number[], name: string, stroke: string) => {
      if (vals.length === 0) return;

      const globalMin = Math.min(...vals);
      const globalMax = Math.max(...vals);
      const globalRange = globalMax - globalMin || 1;
      const fullLen = vals.length; // x-scale derived from FULL length

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      // draw line using SHARED y-scale and SHARED x-spacing
      if (vals.length === 0) {
        // export empty so we can see it
        const link = document.createElement('a');
        link.download = `keypoint_${keypointId}_${type}_${name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
      }

      const firstIndex = name === 'cut' ? 0 : fullLen - vals.length;
      const xOf = (localIdx: number) => {
        const i = firstIndex + localIdx; // index in FULL axis
        return (i / Math.max(1, fullLen - 1)) * (width - 1);
      };
      const yOf = (v: number) =>
        height - ((v - globalMin) / globalRange) * (height - 1);

      ctx.lineWidth = 2;
      ctx.strokeStyle = stroke;

      if (vals.length === 1) {
        const x = xOf(0),
          y = yOf(vals[0]);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(xOf(0), yOf(vals[0]));
        for (let k = 1; k < vals.length; k++) {
          ctx.lineTo(xOf(k), yOf(vals[k]));
        }
        ctx.stroke();
      }

      // export
      const link = document.createElement('a');
      link.download = `keypoint_${keypointId}_${type}_${name}.png`; // different names
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    draw(smoothedVals, name || 'smoothed', '#1f4eff');

    canvas.remove();
  }

  getFramesCountFromSeconds(seconds: number, fps: number): number {
    return Math.ceil(seconds * fps);
  }

  getVelocityFromValues(values: number[]) {
    const n = values.length;
    const velocity: number[] = Array(n).fill(0);
    for (let i = 1; i < n; i++) velocity[i] = values[i] - values[i - 1];

    return velocity;
  }

  convertToMetricScale(
    keypoints: Keypoint[],
    conversionType: MetricConversionType,
    videoWidth: number,
    videoHeight: number
  ): Keypoint[] {
    const shoulderL = this.getDesiredKeypointFromArray(
      keypoints,
      KeypointId.LEFT_SHOULDER
    );

    const shoulderR = this.getDesiredKeypointFromArray(
      keypoints,
      KeypointId.RIGHT_SHOULDER
    );

    if (!shoulderL || !shoulderR) return keypoints;

    let pxToMeterRatio: number | null = null;

    switch (conversionType) {
      case MetricConversionType.SHOULDER_WIDTH: {
        const shoulderWidth = Math.abs(
          shoulderL.position.x - shoulderR.position.x
        );

        const shoulderWidthPx = shoulderWidth * videoWidth;

        const shoulderWidthM = 0.42; // average shoulder width in meters

        pxToMeterRatio = shoulderWidthM / shoulderWidthPx;

        break;
      }
      default:
        break;
    }

    if (pxToMeterRatio === null) return keypoints;

    return keypoints.map((kp) => {
      const { position, ...rest } = kp;

      return {
        position: {
          x: position.x * videoWidth * pxToMeterRatio,
          y: position.y * videoHeight * pxToMeterRatio,
          z: position.z * pxToMeterRatio,
        },
        ...rest,
      };
    });
  }

  private checkIsNumericValueFrameNum = (
    item: number | NumericValueFrameNum
  ): item is NumericValueFrameNum => {
    return typeof item === 'object' && 'value' in item && 'frameNum' in item;
  };

  private checkIsNumericValueFrameNumArray = (
    arr: (number | NumericValueFrameNum)[]
  ): arr is NumericValueFrameNum[] => {
    return arr.every((item) => this.checkIsNumericValueFrameNum(item));
  };
}
