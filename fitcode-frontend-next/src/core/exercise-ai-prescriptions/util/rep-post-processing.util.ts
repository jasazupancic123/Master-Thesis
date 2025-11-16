import type { RefObject } from 'react';

import { ConditionDirection } from '../enum/condition-detection.enum';
import type { KeypointId } from '../enum/keypoint-id';
import type { Keypoint } from '../type/keypoint.type';
import type { Rep } from '../type/rep.type';
import { KeypointUtil } from './keypoint.util';
import { EXERCISE_TIMES_ROUNDING_STEP_S } from '@/components/mobile-movement-validation/mobile-movement-validation';
import { lib } from '@/lib';
import { AINumericConstantName } from '../enum/ai-numeric-constant-name.enum';

export class RepPostProcessingUtil {
  private static _instance: RepPostProcessingUtil;
  private readonly keypoint: KeypointUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
  }

  static get instance(): RepPostProcessingUtil {
    if (!RepPostProcessingUtil._instance)
      RepPostProcessingUtil._instance = new RepPostProcessingUtil();
    return RepPostProcessingUtil._instance;
  }

  getAtExtremumStartAndEndTimes(input: {
    currentRepRef: RefObject<Rep | null>;
    initialValues: number[];
    avgFps: { value: number; count: number } | null;
    extremeKeypoint: Keypoint;
    keypointId: KeypointId;
    direction: ConditionDirection;
  }): {
    timeAtExtremumStartKeypoint: Keypoint | undefined;
    timeAtExtremumEndKeypoint: Keypoint | undefined;
  } {
    const {
      currentRepRef,
      initialValues,
      avgFps,
      extremeKeypoint,
      keypointId,
      direction,
    } = input;

    if (!currentRepRef.current) {
      return {
        timeAtExtremumStartKeypoint: undefined,
        timeAtExtremumEndKeypoint: undefined,
      };
    }

    const initialVelocity = this.keypoint.getVelocityFromValues(
      initialValues
    ) as number[];

    const velocity = this.keypoint.smoothKeypointValues(
      initialVelocity,
      undefined,
      13,
      2
    ) as number[];

    const indexOfExtreme = currentRepRef.current.buffer.history.findIndex(
      (keypoints) =>
        keypoints.some((k) => k.frameNum === extremeKeypoint.frameNum)
    );

    if (indexOfExtreme === -1)
      return {
        timeAtExtremumStartKeypoint: undefined,
        timeAtExtremumEndKeypoint: undefined,
      };

    const kTreshold =
      lib.common.env.ai.TIME_AT_EXTREMUM_VELOCITY_THRESHOLD_M_PER_S() / (avgFps?.value || 30);

    let timeAtExtremumStartKeypoint: Keypoint | undefined;
    let timeAtExtremumEndKeypoint: Keypoint | undefined;

    const numConsecutiveFrames = this.keypoint.getFramesCountFromSeconds(
      lib.common.env.ai.TIME_AT_EXTREMUM_VELOCITY_SUSTAIN_S(),
      avgFps?.value || 30
    );

    // time at extremum start meassurement
    let startHit = 0;
    for (let i = indexOfExtreme; i >= 0; i--) {
      const currentKeypoint = this.keypoint.getDesiredKeypointFromArray(
        currentRepRef.current.buffer.history[i],
        keypointId
      );

      if (!currentKeypoint) continue;

      if (currentKeypoint.frameNum >= extremeKeypoint.frameNum) continue;

      const K = velocity[i];

      if (
        (direction === ConditionDirection.POSITIVE && K > kTreshold && K > 0) ||
        (direction === ConditionDirection.NEGATIVE && K < -kTreshold && K < 0)
      ) {
        startHit++;
      } else {
        startHit = 0;
      }

      if (startHit >= numConsecutiveFrames) {
        const keypointIndex = i + numConsecutiveFrames - 1;

        timeAtExtremumStartKeypoint = this.keypoint.getDesiredKeypointFromArray(
          currentRepRef.current.buffer.history[keypointIndex],
          keypointId
        );

        currentRepRef.current.timeAtExtremumStartKeypoint =
          timeAtExtremumStartKeypoint;

        currentRepRef.current.timeAtExtremumStartTimestamp =
          timeAtExtremumStartKeypoint?.capturedAt;

        break;
      }
    }

    // time at extremum end meassurement
    let endHit = 0;
    for (
      let i = indexOfExtreme;
      i < currentRepRef.current.buffer.history.length;
      i++
    ) {
      const currentKeypoint = this.keypoint.getDesiredKeypointFromArray(
        currentRepRef.current.buffer.history[i],
        keypointId
      );

      if (!currentKeypoint) continue;

      if (currentKeypoint.frameNum <= extremeKeypoint.frameNum) continue;

      const K = velocity[i];

      if (
        (direction === ConditionDirection.POSITIVE &&
          K < -kTreshold &&
          K < 0) ||
        (direction === ConditionDirection.NEGATIVE && K > kTreshold && K > 0)
      ) {
        endHit++;
      } else {
        endHit = 0;
      }

      if (endHit >= numConsecutiveFrames) {
        const keypointIndex = i - numConsecutiveFrames;

        timeAtExtremumEndKeypoint = this.keypoint.getDesiredKeypointFromArray(
          currentRepRef.current.buffer.history[keypointIndex],
          keypointId
        );

        currentRepRef.current.timeAtExtremumEndKeypoint =
          timeAtExtremumEndKeypoint;

        currentRepRef.current.timeAtExtremumEndTimestamp =
          timeAtExtremumEndKeypoint?.capturedAt;

        break;
      }
    }

    return {
      timeAtExtremumStartKeypoint,
      timeAtExtremumEndKeypoint,
    };
  }

  setRepTimes(input: {
    recordedReps: Rep[];
    currentRepRef: RefObject<Rep | null>;
    timeAtExtremumStartKeypoint: Keypoint | undefined;
    timeAtExtremumEndKeypoint: Keypoint | undefined;
  }) {
    const {
      recordedReps,
      currentRepRef,
      timeAtExtremumStartKeypoint,
      timeAtExtremumEndKeypoint,
    } = input;

    if (!currentRepRef.current) return;

    if (currentRepRef.current.endValueTimestamp) {
      currentRepRef.current.durationMs = lib.common.number.roundToStep(
        lib.common.date.getMsDiff(
          currentRepRef.current.startTimestamp,
          currentRepRef.current.endValueTimestamp
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000
      );
    }

    if (recordedReps.length > 0) {
      const prevRep = recordedReps[recordedReps.length - 1];
      if (prevRep.endValueTimestamp) {
        currentRepRef.current.idleTimeMs = lib.common.number.roundToStep(
          lib.common.date.getMsDiff(
            prevRep.endValueTimestamp,
            currentRepRef.current.startTimestamp
          ),
          EXERCISE_TIMES_ROUNDING_STEP_S * 1000
        );
      }
    }

    if (timeAtExtremumStartKeypoint) {
      currentRepRef.current.timeToExtremeMs = Math.max(
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000,
        lib.common.number.roundToStep(
          lib.common.date.getMsDiff(
            currentRepRef.current.startTimestamp,
            timeAtExtremumStartKeypoint.capturedAt
          ),
          EXERCISE_TIMES_ROUNDING_STEP_S * 1000
        )
      );
    } else {
      currentRepRef.current.timeToExtremeMs =
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000;
    }

    if (
      (timeAtExtremumEndKeypoint !== undefined ||
        currentRepRef.current.extremeKeypoint !== undefined) &&
      currentRepRef.current.endValueTimestamp
    ) {
      currentRepRef.current.timeFromExtremeToEndMs = Math.max(
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000,
        lib.common.number.roundToStep(
          lib.common.date.getMsDiff(
            (timeAtExtremumEndKeypoint ||
              currentRepRef.current.extremeKeypoint)!.capturedAt,
            currentRepRef.current.endValueTimestamp
          ),
          EXERCISE_TIMES_ROUNDING_STEP_S * 1000
        )
      );
    }

    if (currentRepRef.current.timeFromExtremeToEndMs === undefined) {
      currentRepRef.current.timeFromExtremeToEndMs =
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000;
    }

    if (timeAtExtremumStartKeypoint && timeAtExtremumEndKeypoint) {
      currentRepRef.current.timeAtExtremeMs = lib.common.number.roundToStep(
        lib.common.date.getMsDiff(
          timeAtExtremumStartKeypoint.capturedAt,
          timeAtExtremumEndKeypoint.capturedAt
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000
      );
    }
  }

  setRepRom(input: {
    currentRepRef: RefObject<Rep | null>;
    initialValues: number[];
  }) {
    const { currentRepRef, initialValues } = input;

    if (!currentRepRef.current) return;

    const min = Math.min(...initialValues);
    const max = Math.max(...initialValues);

    currentRepRef.current.minRomValue = min;
    currentRepRef.current.maxRomValue = max;
    currentRepRef.current.startRomValue = initialValues[0];
  }
}
