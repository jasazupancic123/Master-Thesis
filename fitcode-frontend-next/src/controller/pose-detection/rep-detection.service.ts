import { KeypointHistory } from './class/keypoint-history';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { ConditionDirection } from './type/exercise-start-condition';
import { Keypoint } from './type/keypoint';
import { KeypointUtil } from './util/keypoint.util';

export class RepDetectionService {
  static findStartOfFirstRep(state: {
    buffer: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    slopeK: number; // how many std devs below 0 to call “down”
    sustainW: number; // frames of sustained slope
    preWindow: number; // look for local max/min in this many frames before the sustain
  }): { index: number; message: string } {
    const {
      buffer,
      keypointId,
      valueType,
      direction,
      slopeK,
      sustainW,
      preWindow,
    } = state;

    const rawKeypoints: (Keypoint | undefined)[] =
      buffer.getHistoryById(keypointId);
    const lastUndefIndx = rawKeypoints.lastIndexOf(undefined);
    const tail = rawKeypoints.slice(lastUndefIndx + 1);

    const keypoints: Keypoint[] = tail.filter(
      (k): k is Keypoint => k !== undefined
    );

    const unsmoothedValues = keypoints
      .map((k) => KeypointUtil.getKeypointValueByType(k, valueType))
      .filter((v): v is number => v !== undefined);

    const values = KeypointUtil.smoothKeypointValues(
      unsmoothedValues,
      undefined,
      13,
      2
    );

    const n = values.length;

    // Velocity
    const velocity: number[] = Array(n).fill(0);
    for (let i = 1; i < n; i++) velocity[i] = values[i] - values[i - 1];

    // Used to calculate min and std of the first half of the velocity data (assumes user starts from still)
    const firstHalfVelocity = velocity.slice(1, Math.floor(n / 2));

    // Data-driven threshold: k * std(v)
    const meanV =
      firstHalfVelocity.reduce((a, b) => a + b, 0) / firstHalfVelocity.length;
    const stdV = Math.sqrt(
      firstHalfVelocity.reduce((a, b) => a + (b - meanV) ** 2, 0) /
        firstHalfVelocity.length
    );

    const scale = Math.max(stdV, 1e-6);

    // 3) Walk backwards using per-frame K score (z-score of velocity)
    // K = v / scale. For NEGATIVE: K <= -slopeK; POSITIVE: K >= +slopeK; ANY: |K| >= slopeK
    let s = n - 1;
    let found = false;
    let run = 0; // length of the current satisfied streak

    while (s >= 0) {
      const K = velocity[s] / Math.max(scale, 1e-6);

      console.log('K', K);

      let hit: boolean;
      if (direction === ConditionDirection.NEGATIVE) {
        hit = K >= -slopeK;
      } else if (direction === ConditionDirection.POSITIVE) {
        hit = K <= +slopeK;
      } else {
        // ANY
        hit = Math.abs(K) >= slopeK;
      }

      if (hit) {
        run += 1;
        if (run >= sustainW) {
          // s now points to the EARLIEST frame of the sustained block (since we’re walking backwards)
          found = true;
          break;
        }
      } else {
        run = 0; // reset the streak
      }

      s -= 1;
    }

    console.log('s', s);

    // If ANY, infer actual direction from sustained window
    let effDir = direction;
    if (direction === ConditionDirection.ANY && found) {
      const meanLast = (() => {
        let sum = 0;
        for (let k = 0; k < sustainW; k++) sum += velocity[s - k];
        return sum / sustainW;
      })();
      effDir =
        meanLast <= 0
          ? ConditionDirection.NEGATIVE
          : ConditionDirection.POSITIVE;
    }

    // 4) If nothing found, fallback to global extremum consistent with effDir
    if (!found) {
      if (direction === ConditionDirection.POSITIVE) {
        let minIdx = 0,
          minVal = values[0];
        for (let i = 1; i < n; i++)
          if (values[i] <= minVal) {
            minVal = values[i];
            minIdx = i;
          }
        return { index: minIdx, message: 'global min' };
      } else if (direction === ConditionDirection.NEGATIVE) {
        let maxIdx = 0,
          maxVal = values[0];
        for (let i = 1; i < n; i++)
          if (values[i] >= maxVal) {
            maxVal = values[i];
            maxIdx = i;
          }
        return { index: maxIdx, message: 'global max' };
      } else {
        // infer by overall trend: default to NEGATIVE if end < start
        if (values[n - 1] < values[0]) {
          let maxIdx = 0,
            maxVal = values[0];
          for (let i = 1; i < n; i++)
            if (values[i] >= maxVal) {
              maxVal = values[i];
              maxIdx = i;
            }
          return { index: maxIdx, message: 'global max any' };
        } else {
          let minIdx = 0,
            minVal = values[0];
          for (let i = 1; i < n; i++)
            if (values[i] <= minVal) {
              minVal = values[i];
              minIdx = i;
            }
          return { index: minIdx, message: 'global min any' };
        }
      }
    }

    // 5) Find last local extremum before s within preWindow
    const left = Math.max(0, s - preWindow);
    let extremumIdx = left,
      extremumVal = values[left];

    if (effDir === ConditionDirection.NEGATIVE) {
      // look for local MAX
      for (let i = left + 1; i <= s; i++) {
        if (values[i] >= extremumVal) {
          extremumVal = values[i];
          extremumIdx = i;
        }
      }
    } else {
      // look for local MIN
      for (let i = left + 1; i <= s; i++) {
        if (values[i] <= extremumVal) {
          extremumVal = values[i];
          extremumIdx = i;
        }
      }
    }

    // If you want the frame AFTER the extremum, use Math.min(extremumIdx + 1, n - 1)
    return { index: extremumIdx, message: 'local extremum' };
  }
}
