import { POSE_DETECTION_CONSTRAINTS } from '../const/pose-detection-constrains.const';
import { ConditionDirection } from '../enum/condition-detection.enum';
import { KeypointUtil } from './keypoint.util';
import { RefObject } from 'react';
import { Rep } from '../types/rep.type';
import { Keypoint } from '../types/keypoint.type';
import { KeypointId } from '../enum/keypoint-id';
import { EXERCISE_TIMES_ROUNDING_STEP_S } from '@/components/mobile-movement-validation/mobile-movement-validation';
import { TimeUtil } from './time.util';
import { CommonService } from '@/common/service/common.service';

export class RepPostProcessingUtil {
  static getAtExtremumStartAndEndTimes(input: {
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

    const initialVelocity = KeypointUtil.getVelocityFromValues(
      initialValues
    ) as number[];

    const velocity = KeypointUtil.smoothKeypointValues(
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
      POSE_DETECTION_CONSTRAINTS.TIME_AT_EXTREMUM_VELOCITY_THRESHOLD_M_PER_S /
      (avgFps?.value || 30);

    let timeAtExtremumStartKeypoint: Keypoint | undefined;
    let timeAtExtremumEndKeypoint: Keypoint | undefined;

    const numConsecutiveFrames = KeypointUtil.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTRAINTS.TIME_AT_EXTREMUM_VELOCITY_SUSTAIN_S,
      avgFps?.value || 30
    );

    // time at extremum start meassurement
    let startHit = 0;
    for (let i = indexOfExtreme; i >= 0; i--) {
      const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
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

        timeAtExtremumStartKeypoint = KeypointUtil.getDesiredKeypointFromArray(
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
      const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
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

        timeAtExtremumEndKeypoint = KeypointUtil.getDesiredKeypointFromArray(
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

  static setRepTimes(input: {
    recordedReps: Rep[];
    currentRepRef: RefObject<Rep | null>;
    timeAtExtremumStartKeypoint: Keypoint | undefined;
    timeAtExtremumEndKeypoint: Keypoint | undefined;
    commonService: CommonService;
  }) {
    const {
      recordedReps,
      currentRepRef,
      timeAtExtremumStartKeypoint,
      timeAtExtremumEndKeypoint,
      commonService,
    } = input;

    if (!currentRepRef.current) return;

    if (currentRepRef.current.endValueTimestamp) {
      currentRepRef.current.durationMs = commonService.number.roundToStep(
        TimeUtil.getMsDiff(
          currentRepRef.current.startTimestamp,
          currentRepRef.current.endValueTimestamp
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000
      );
    }

    if (recordedReps.length > 0) {
      const prevRep = recordedReps[recordedReps.length - 1];
      if (prevRep.endValueTimestamp) {
        currentRepRef.current.idleTimeMs = commonService.number.roundToStep(
          TimeUtil.getMsDiff(
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
        commonService.number.roundToStep(
          TimeUtil.getMsDiff(
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
        commonService.number.roundToStep(
          TimeUtil.getMsDiff(
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
      currentRepRef.current.timeAtExtremeMs = commonService.number.roundToStep(
        TimeUtil.getMsDiff(
          timeAtExtremumStartKeypoint.capturedAt,
          timeAtExtremumEndKeypoint.capturedAt
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000
      );
    }
  }

  static setRepRom(input: {
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
