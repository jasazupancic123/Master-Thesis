import { KeypointId } from '../enum/keypoint-id';
import { PoseModel } from '../enum/pose-model.enum';
import { Landmark, ObjectDetector } from '@mediapipe/tasks-vision';
import { Keypoint } from '../type/keypoint';
import { KeypointValueType } from '../enum/keypoint-value-type';
import savitzkyGolay from 'ml-savitzky-golay';
import { ConditionDirection } from '../type/exercise-start-condition';
import { POSE_DETECTION_CONSTRAINTS } from '../const/pose-detection-constrains.const';

export class KeypointUtil {
  static getDesiredKeypointsByModel(
    // add different types to currentFrameKeypoints for different models
    currentFrameKeypoints: Landmark[] | undefined,
    model: PoseModel,
    capturedAt: Date,
    frameNum: number
  ): Keypoint[] {
    if (!currentFrameKeypoints) return [];

    let keypoints: Keypoint[] = [];
    switch (model) {
      case PoseModel.MEDIAPIPE: {
        const keypointIds = Object.values(KeypointId);
        currentFrameKeypoints.forEach((kp, i) => {
          keypoints.push({
            id: keypointIds[i] as unknown as KeypointId,
            x: kp.x,
            y: kp.y,
            z: kp.z,
            velocity: 0,
            isValid: true,
            frameNum,
            capturedAt,
            visibility: kp.visibility,
          });
        });
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
        return { value1: keypoint1.x, value2: keypoint2.x };
      case KeypointValueType.POSITION_Y:
        return { value1: keypoint1.y, value2: keypoint2.y };
      case KeypointValueType.POSITION_Z:
        return { value1: keypoint1.z, value2: keypoint2.z };
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
        return keypoint.x;
      case KeypointValueType.POSITION_Y:
        return keypoint.y;
      case KeypointValueType.POSITION_Z:
        return keypoint.z;
      case KeypointValueType.VELOCITY:
        return keypoint.velocity;
      default:
        return undefined;
    }
  }

  static smoothKeypointValues(keypointValues: number[], fps = 30) {
    // ~0.5–1.5 reps/sec → use a small odd window (11–21 for 30 fps)
    const windowSize = 11; // must be odd
    const polynomial = 3; // 2–3 is typical
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

  static cutStart(
    keypointValues: number[],
    avgFps: number,
    direction: ConditionDirection,
    distanceToCover: number
  ): number[] | undefined {
    // get 300ms of fps
    const bufferSize = Math.ceil(0.3 * avgFps); // 300ms buffer window
    if (keypointValues.length < bufferSize) return undefined; // not enough data

    let bestRatio = 0;

    for (let i = bufferSize; i < keypointValues.length; i++) {
      let okConcurrentKeypoints = 0;

      let dirrection: 'up' | 'down' | undefined = undefined;

      const buffer = keypointValues.slice(i - bufferSize, i);

      for (let j = 1; j < buffer.length; j++) {
        const currentValue = buffer[j];
        const prevValue = buffer[j - 1];

        if (direction === ConditionDirection.ANY) {
          if (dirrection === undefined) {
            dirrection = currentValue > prevValue ? 'up' : 'down';
            okConcurrentKeypoints++;
            continue;
          }

          const currentDirrection = currentValue > prevValue ? 'up' : 'down';

          if (currentDirrection === dirrection) okConcurrentKeypoints++;
          else dirrection = currentDirrection;
        } else if (
          direction === ConditionDirection.POSITIVE &&
          currentValue > prevValue
        )
          okConcurrentKeypoints++;
        else if (
          direction === ConditionDirection.NEGATIVE &&
          currentValue < prevValue
        )
          okConcurrentKeypoints++;

        // if a certain % of the buffer is moving in a single direction, we have a cut point
        const ratio = okConcurrentKeypoints / buffer.length;
        if (ratio > bestRatio) bestRatio = ratio;

        const distance = Math.abs(buffer[buffer.length - 1] - buffer[0]);

        if (
          ratio >= POSE_DETECTION_CONSTRAINTS.START_CUT_OFF_CONFIDENCE &&
          distance >= distanceToCover
        ) {
          // cut off the start up to the current point minus the buffer
          console.log(`Found cut point at index ${i}, cutting off start`);
          return keypointValues.slice(i - bufferSize);
        }
      }
    }

    console.log(
      'No cut point found, best ratio:',
      bestRatio,
      'bufferSize:',
      bufferSize
    );
    return keypointValues; // no cut point found, return original
  }

  static drawKeypointValuesGraph(
    history: Keypoint[][],
    keypointId: KeypointId,
    type: KeypointValueType,
    direction: ConditionDirection,
    distanceToCover: number, // in meters
    avgFps: number
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
          // invert Y if desired
          if (type === KeypointValueType.POSITION_Y) v = 1 - Number(v);
          return Number(v);
        })
        .filter((v): v is number => Number.isFinite(v));

    const fullVals = seriesFrom(history);

    const smoothedVals = this.smoothKeypointValues(fullVals);
    const cutVals = this.cutStart(
      smoothedVals,
      avgFps,
      direction,
      distanceToCover
    ) as number[];

    console.log('smoothedVals', smoothedVals);
    console.log('cutVals', cutVals);

    const draw = (vals: number[], name: 'cut' | 'smoothed', stroke: string) => {
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

    draw(smoothedVals, 'smoothed', '#1f4eff');
    draw(cutVals, 'cut', '#ff1f4e');

    canvas.remove();
  }
}
