import { KeypointId } from '../enum/keypoint-id';
import { PoseModel } from '../enum/pose-model.enum';
import { Landmark } from '@mediapipe/tasks-vision';
import { Keypoint } from '../type/keypoint.type';
import { KeypointValueType } from '../enum/keypoint-value-type';
import savitzkyGolay from 'ml-savitzky-golay';
import { Point3D } from '../type/point-3d.type';

export class KeypointUtil {
  static getDesiredKeypointsByModel(
    // add different types to currentFrameKeypoints for different models
    currentFrameKeypoints: Landmark[] | undefined,
    model: PoseModel,
    capturedAt: Date,
    frameNum: number,
    centerHipsYToMiddleAnkleOrigin = true
  ): Keypoint[] {
    if (!currentFrameKeypoints) return [];

    let keypoints: Keypoint[] = [];
    switch (model) {
      case PoseModel.MEDIAPIPE: {
        const keypointIds = Object.values(KeypointId);
        currentFrameKeypoints.forEach((kp, i) => {
          keypoints.push({
            id: keypointIds[i] as unknown as KeypointId,
            position: {
              x: kp.x,
              y: kp.y,
              z: kp.z,
            },
            velocity: 0,
            isValid: true,
            frameNum,
            capturedAt,
            visibility: kp.visibility,
          });
        });

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
        }

        break;
      }
      default: {
        return [];
      }
    }

    return keypoints;
  }

  static getDesiredKeypointFromArray(
    keypoints: Keypoint[],
    keypointId: KeypointId
  ): Keypoint | undefined {
    return keypoints.find((kp) => kp.id === keypointId);
  }

  static getKeypointsValuesByType(
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

  static getKeypointValueByType(
    keypoint: Keypoint,
    type: KeypointValueType
  ): number | undefined {
    switch (type) {
      case KeypointValueType.POSITION_X:
        return keypoint.position.x;
      case KeypointValueType.POSITION_Y:
        return -keypoint.position.y; // invert Y to have +Y as up
      case KeypointValueType.POSITION_Z:
        return keypoint.position.z;
      case KeypointValueType.VELOCITY:
        return keypoint.velocity;
      default:
        return undefined;
    }
  }

  static smoothKeypointValues(
    keypointValues: number[],
    fps = 30,
    windowSizeProps?: number,
    polynomialProps?: number
  ): number[] {
    // ~0.5–1.5 reps/sec → use a small odd window (11–21 for 30 fps)
    const windowSize = windowSizeProps || 11;
    const polynomial = polynomialProps || 3;

    // sampling interval (seconds per sample)
    const dx = 1 / fps;

    return savitzkyGolay(keypointValues, dx, {
      windowSize,
      polynomial,
      derivative: 0,
      pad: 'pre', // handle edges
      padValue: 'replicate',
    });
  }

  static drawKeypointValuesGraph(
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
          let v = KeypointUtil.getKeypointValueByType(kp, type);
          if (v == null || !Number.isFinite(Number(v))) return undefined;

          return Number(v);
        })
        .filter((v): v is number => Number.isFinite(v));

    const isNumberArray = (arr: any[]): arr is number[] => {
      return arr.every((item) => typeof item === 'number');
    };

    const fullVals: number[] = isNumberArray(history)
      ? history
      : seriesFrom(history);

    const smoothedVals = this.smoothKeypointValues(fullVals);

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

  static getFramesCountFromSeconds(seconds: number, fps: number): number {
    return Math.ceil(seconds * fps);
  }

  static getVelocityFromValues(values: number[]) {
    const n = values.length;
    const velocity: number[] = Array(n).fill(0);
    for (let i = 1; i < n; i++) velocity[i] = values[i] - values[i - 1];

    return velocity;
  }
}
