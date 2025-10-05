import dayjs from 'dayjs';
import type { RefObject } from 'react';

import type { TrainingExercise } from '../training/type/training-exercise.type';
import { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { ConditionDirection } from './enum/condition-detection.enum';
import type { KeypointId } from './enum/keypoint-id';
import type { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { NumericValueFrameNum } from './type/numeric-value-frame-num';
import type { Rep } from './type/rep.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import { TimeUtil } from './util/time.util';
import { CommonService } from '@/common/service/common.service';
import { SetState } from '@/common/type/state.type';
import { EXERCISE_TIMES_ROUNDING_STEP_S } from '@/components/mobile-movement-validation/mobile-movement-validation';

const commonService = CommonService.instance;

export class RepDetectionService {
  /*
    DETECT_REP

    Create class Rep (start_time, end_time, extreme_value, etc.)

    Create state RepState (IDLE, IN_REP)

    We know when the rep starts, so then we will set the RepState to RepState.IN_REP

    We know the starting value, which we will use to detect, if a rep is ended. Also track the current extreme_value (min/max)
      and use it to set a max_diff between the start pos and the extreme_value. Then set a certain percentage of this max_diff,
      lets say 20% and check if the Math.abs(extreme_value - value) < max_diff * 0.2 is true, then start tracking K's. 
      If a certain number of consecutive K's is under a threshold AND we are still in the range of the starting value, 
      then the rep has ended.

    Once we have the starting point and the end point of a rep, we get can generate a Rep and set its start_time, end_time
      and extreme_value and the RepState will go into RepState.IDLE

    When we detect end of a new rep, also update avgStartValue and avgExtremeValue in RepState
  */

  static checkRepStatus(state: {
    repStateRef: React.RefObject<RepState>;
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    currentFrameKeypoints: Keypoint[];
    keypointHistory: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    exerciseStartConditions: ExerciseRepStartCondition[];
    avgFps: { value: number; count: number } | null;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
    setRepCount: SetState<number>;
  }) {
    const {
      repStateRef,
      currentRepRef,
      recordedRepsRef,
      currentFrameKeypoints,
      keypointHistory,
      keypointId,
      valueType,
      direction,
      exerciseStartConditions,
      avgFps,
      initedFirstFrameInRecordingMode,
      setRepCount,
    } = state;

    switch (repStateRef.current.status) {
      case RepStatus.IN_REP: {
        // Updates rep's extremeToEndTimestamp if the value falls out of a certain range from the extremeValue
        // this.checkOutOfExtremeRange({
        //   currentRepRef,
        //   currentFrameKeypoints,
        //   keypointId,
        //   valueType,
        //   direction,
        // });

        // Check for rep end
        const { isRepDone, endKeypoint } = this.checkHasRepEnded({
          currentRepRef,
          recordedRepsRef,
          keypointHistory,
          direction,
          keypointId,
          valueType,
          avgFps,
        });

        if (isRepDone && endKeypoint !== undefined && currentRepRef.current) {
          // Save rep
          currentRepRef.current.endValueTimestamp = endKeypoint.capturedAt;

          // Set all the times
          this.postProcessRep({
            currentRepRef,
            recordedRepsRef,
            keypointId,
            valueType,
            direction,
            avgFps,
          });

          recordedRepsRef.current.push(currentRepRef.current);

          setRepCount(recordedRepsRef.current.length);

          console.log('RECORDED ', recordedRepsRef.current.length, ' REPS');

          repStateRef.current.status = RepStatus.IDLE; // we are now out of the rep
        }

        break;
      }
      case RepStatus.IDLE: {
        // Check for rep start
        const {
          hasRepStarted,
          startValue,
          startValueFrameNum,
          startValueCapturedAt,
        } = this.checkHasRepStarted({
          currentFrameKeypoints,
          keypointHistory,
          keypointId,
          valueType,
          direction,
          exerciseStartConditions,
          avgFps,
          initedFirstFrameInRecordingMode,
          recordedRepsRef,
        });

        if (
          hasRepStarted &&
          startValue !== undefined &&
          startValueFrameNum !== undefined &&
          startValueCapturedAt !== undefined
        ) {
          // New rep
          // console.log('NEW REP DETECTED with startValue', startValue);
          repStateRef.current.status = RepStatus.IN_REP; // we are now in the rep

          currentRepRef.current = this.initNewRep(
            recordedRepsRef.current.length + 1,
            startValue,
            startValueFrameNum,
            startValueCapturedAt,
            keypointHistory.history.map((h) => [...h])
          );
        }
        break;
      }
      default:
        break;
    }
  }

  // Detect whether the value went up/down (opposite dirrection of the rep start direction) consecutive times
  // via the slope of the velocity (K score), example: (rep_direction=NEGATIVE; k=[0.5, 0.75, 1, 2]) -> true
  private static detectExtremum(state: {
    currentRepRef: RefObject<Rep | null>;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    avgFps: { value: number; count: number } | null;
  }) {
    const { currentRepRef, direction, keypointId, valueType, avgFps } = state;

    if (currentRepRef.current?.extremeValue === undefined) return;

    const { currentKeypoint, currentValue, velocity, scale } =
      this.initStartValues(currentRepRef.current.buffer, keypointId, valueType);

    if (
      !currentKeypoint ||
      currentValue === null ||
      !velocity ||
      scale === null
    )
      return false;

    const buffer = currentRepRef.current.buffer;

    const totalNumFrames = avgFps
      ? Math.max(
          POSE_DETECTION_CONSTRAINTS.MIN_FRAMES_FOR_EXTREMUM,
          KeypointUtil.getFramesCountFromSeconds(
            POSE_DETECTION_CONSTRAINTS.MIN_TIME_FOR_EXTREMUM_S,
            avgFps.value
          )
        )
      : POSE_DETECTION_CONSTRAINTS.MIN_FRAMES_FOR_EXTREMUM; // min 4 total consecutive correct frames (2pos k's, 2neg k's)

    const startKCheckIndex = buffer.history.length - 1 - totalNumFrames;

    if (startKCheckIndex < 0) return; // not enough frames yet

    let hit = 0;

    for (let i = startKCheckIndex; i < startKCheckIndex + totalNumFrames; i++) {
      const K = velocity[i] / Math.max(scale, 1e-6);

      const lookingForPositiveK = direction === ConditionDirection.NEGATIVE;

      if (lookingForPositiveK && K >= 0) hit++;
      else if (!lookingForPositiveK && K <= 0) hit++;
    }

    if (hit === totalNumFrames) {
      // console.log('DETECTED EXTREMUM');
      currentRepRef.current.detectedExtremum = true;
    }
  }

  private static checkHasRepEnded(state: {
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    keypointHistory: KeypointHistory;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    avgFps: { value: number; count: number } | null;
  }): { isRepDone: boolean; endKeypoint?: Keypoint } {
    const {
      currentRepRef,
      recordedRepsRef,
      keypointHistory,
      direction,
      keypointId,
      valueType,
      avgFps,
    } = state;

    // Detecting the U turn in the rep (extremum), so we can finish it
    if (!currentRepRef.current?.detectedExtremum) this.detectExtremum(state);

    const { currentKeypoint, currentValue, velocity, scale } =
      this.initStartValues(
        currentRepRef.current?.buffer,
        keypointId,
        valueType
      );

    if (
      !currentKeypoint ||
      currentValue === null ||
      !velocity ||
      scale === null
    ) {
      return { isRepDone: false };
    }

    // Update extreme value
    this.updateExtremeRepValue({
      direction,
      currentValue,
      currentKeypoint,
      currentRepRef,
    });

    // We need to detect an extremum first to finish the rep
    if (
      currentRepRef.current?.extremeValue === undefined ||
      !currentRepRef.current?.detectedExtremum
    ) {
      return { isRepDone: false };
    }

    if (currentRepRef.current?.buffer.history.length < 2)
      return { isRepDone: false };

    // Check if current value is close enough to starting value
    if (
      !this.checkValueCloseEnoughToStartValue(
        currentValue,
        recordedRepsRef,
        currentRepRef
      )
    ) {
      return { isRepDone: false };
    }

    // slope = naklon

    /*
      MAKE 2 SEPERATE FUNCTIONS, ONE FOR REP START AND KEEP THE getSlopeK FUNCTIONALITY FOR IT AS IT IS,
      BUT FOR REP_END, THE FUNCTION NEEDS TO RETURN A FIXED VALUE OF THEN THE REP HAS ENDED, NOT THE SAME
      AS THE START, WHICH CAN RETURN THE "BEST" K! AND WHEN THIS FUNCTION HERE RETURNS A VALUE - IT WILL BE
      A INDEX/FRAME NUM, THEN RETURN THE FRAMENUM WITH isRepDone: true;
    */

    const slope = this.getSlopeK({
      velocity,
      direction,
      detectingRepStart: false,
      avgFps,
    });

    if (slope === undefined) return { isRepDone: false };

    const endKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentRepRef.current?.buffer.history[slope],
      keypointId
    );

    if (!endKeypoint) return { isRepDone: false };

    // replace this with the correct frameNum
    // const extremeValueFrameNum = keypointHistory.getLatestFrameNum();

    // HERE ALSO LOOK FOR LOCAL EXTREMUM, NOT JUST SLOPE
    // If we look for local extremum, we also need to capture the next n frames and get the extremum
    // out of those, or maybe just track the next n frames, if the value is more extreme than the
    // current extreme_value, then update it

    return { isRepDone: true, endKeypoint };
  }

  private static checkHasRepStarted(state: {
    currentFrameKeypoints: Keypoint[];
    keypointHistory: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    exerciseStartConditions: ExerciseRepStartCondition[];
    avgFps: { value: number; count: number } | null;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
    recordedRepsRef: RefObject<Rep[]>;
  }): {
    hasRepStarted: boolean;
    startValue?: number;
    startValueFrameNum?: number;
    startValueCapturedAt?: Date;
  } {
    const {
      currentFrameKeypoints,
      keypointHistory,
      keypointId,
      valueType,
      direction,
      exerciseStartConditions,
      avgFps,
      initedFirstFrameInRecordingMode, // if the very first rep has been inited
      recordedRepsRef,
    } = state;

    // const isFirstRep = !initedFirstFrameInRecordingMode.current;
    // const currentHistory = isFirstRep ? keypointHistory : currentRepBuffer;

    // checks if exercise state conditions are met (traveling certain distance in certain time)
    const checkStartedRep =
      StatusDetectionService.checkExerciseRepStartConditions(
        currentFrameKeypoints,
        keypointHistory,
        exerciseStartConditions,
        avgFps
      );

    if (!checkStartedRep) return { hasRepStarted: false };

    if (keypointHistory.history.length < 2) return { hasRepStarted: false };

    // New rep detected, find percise starting point
    const { startIndex, startValue, startValueFrameNum } =
      RepDetectionService.findStartOfRep({
        buffer: keypointHistory,
        keypointId,
        valueType,
        direction,
        avgFps,
      });

    keypointHistory.cutAtIndex(startIndex, true);

    const startKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      keypointHistory.history[0],
      keypointId
    );

    if (!startKeypoint) return { hasRepStarted: false };

    if (startValue === undefined || startValueFrameNum === undefined)
      return { hasRepStarted: false };

    initedFirstFrameInRecordingMode.current = true;

    // Clamp start to be after previous rep's end
    let startValueCapturedAt = startKeypoint.capturedAt;
    const prev = recordedRepsRef.current.at(-1);
    if (
      prev?.endValueTimestamp &&
      startValueCapturedAt < prev.endValueTimestamp
    ) {
      startValueCapturedAt = dayjs(prev.endValueTimestamp)
        .add(1, 'ms')
        .toDate();
    }

    return {
      hasRepStarted: true,
      startValue,
      startValueFrameNum,
      startValueCapturedAt,
    };
  }

  private static findStartOfRep(state: {
    buffer: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    avgFps: { value: number; count: number } | null;
  }): { startIndex: number; startValue: number; startValueFrameNum: number } {
    const { buffer, keypointId, valueType, direction, avgFps } = state;

    // 1) Get smoothed values of the keypoint's values
    const values = this.getSmoothedValues(
      buffer,
      keypointId,
      valueType
    ) as NumericValueFrameNum[];

    const n = values.length;

    // 2) Velocity
    const velocity: number[] = KeypointUtil.getVelocityFromValues(
      values.map((v) => v.value)
    );

    // 3) Walk backwards using per-frame K score (z-score of velocity)
    // K = v / scale. For NEGATIVE: K >= -slopeK; POSITIVE: K <= +slopeK; ANY: |K| >= slopeK
    // slope = naklon

    const slope = this.getSlopeK({
      velocity,
      direction,
      detectingRepStart: true,
      avgFps,
    });

    // 4) If nothing found, fallback to global extremum consistent with effDir
    if (slope === undefined) {
      if (direction === ConditionDirection.POSITIVE) {
        let minIdx = 0,
          minVal = values[0];
        for (let i = 1; i < n; i++)
          if (values[i] <= minVal) {
            minVal = values[i];
            minIdx = i;
          }
        return {
          startIndex: minIdx,
          startValue: minVal.value,
          startValueFrameNum: minVal.frameNum,
        };
      } else if (direction === ConditionDirection.NEGATIVE) {
        let maxIdx = 0,
          maxVal = values[0];
        for (let i = 1; i < n; i++)
          if (values[i] >= maxVal) {
            maxVal = values[i];
            maxIdx = i;
          }
        return {
          startIndex: maxIdx,
          startValue: maxVal.value,
          startValueFrameNum: maxVal.frameNum,
        };
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
          return {
            startIndex: maxIdx,
            startValue: maxVal.value,
            startValueFrameNum: maxVal.frameNum,
          };
        } else {
          let minIdx = 0,
            minVal = values[0];
          for (let i = 1; i < n; i++)
            if (values[i] <= minVal) {
              minVal = values[i];
              minIdx = i;
            }
          return {
            startIndex: minIdx,
            startValue: minVal.value,
            startValueFrameNum: minVal.frameNum,
          };
        }
      }
    }

    // Limit how far back we can search for the first rep's start
    const lookback =
      (avgFps?.value || 30) *
      POSE_DETECTION_CONSTRAINTS.MAX_LOOKBACK_REP_START_S;

    const maxLookbackFrames = Math.max(
      lookback,
      POSE_DETECTION_CONSTRAINTS.MAX_LOOKBACK_REP_START_S
    );
    const leftBound = Math.max(0, n - Math.floor(maxLookbackFrames));

    // 5) Slope found, find last local extremum before s within preWindow
    // If condition is POSITIVE, look for local min; if NEGATIVE, look for local max
    const left = Math.max(
      leftBound,
      slope - POSE_DETECTION_CONSTRAINTS.PRE_WINDOW_FRAMES_REP_START
    );

    let extremumIdx = left,
      extremumVal = values[left];

    for (let i = left + 1; i <= slope; i++) {
      if (
        (direction === ConditionDirection.POSITIVE &&
          values[i] <= extremumVal) ||
        (direction === ConditionDirection.NEGATIVE && values[i] >= extremumVal)
      ) {
        extremumVal = values[i];
        extremumIdx = i;
      }
    }

    return {
      startIndex: extremumIdx,
      startValue: extremumVal.value,
      startValueFrameNum: extremumVal.frameNum,
    };
  }

  private static checkValueCloseEnoughToStartValue(
    currentValue: number,
    recordedRepsRef: RefObject<Rep[]>,
    currentRepRef: RefObject<Rep | null>
  ) {
    // repStateRef.current.avgStartValue is null only on the very first rep
    const startingValue =
      recordedRepsRef.current.length &&
      recordedRepsRef.current[0].startValue !== undefined
        ? recordedRepsRef.current[0].startValue
        : currentRepRef.current?.startValue;

    const extremeValue =
      recordedRepsRef.current.length &&
      recordedRepsRef.current[0].extremeValue !== undefined
        ? recordedRepsRef.current[0].extremeValue
        : currentRepRef.current?.extremeValue;

    if (startingValue === undefined || extremeValue === undefined) return false;

    const diff = Math.abs(extremeValue - startingValue);

    const isValueCloseEnough =
      Math.abs(currentValue - startingValue) <=
      diff * POSE_DETECTION_CONSTRAINTS.CLOSE_ENOUGH_TO_START_VALUE_RATIO;

    return isValueCloseEnough;
  }

  private static updateExtremeRepValue(state: {
    direction: ConditionDirection;
    currentValue: number;
    currentKeypoint: Keypoint;
    currentRepRef: RefObject<Rep | null>;
  }) {
    const { direction, currentValue, currentKeypoint, currentRepRef } = state;

    if (!currentRepRef.current) return;

    const startValue = currentRepRef.current.startValue;
    const extremeValue = currentRepRef.current.extremeValue;

    let updateToNewExtreme = false;

    if (direction === ConditionDirection.POSITIVE) {
      if (
        (extremeValue === undefined && currentValue > startValue) ||
        (extremeValue !== undefined && currentValue > extremeValue)
      ) {
        updateToNewExtreme = true;
      }
    } else if (direction === ConditionDirection.NEGATIVE) {
      if (
        (extremeValue === undefined && currentValue < startValue) ||
        (extremeValue !== undefined && currentValue < extremeValue)
      ) {
        updateToNewExtreme = true;
      }
    }

    if (!updateToNewExtreme) return;

    currentRepRef.current.extremeValue = currentValue;
    currentRepRef.current.extremeKeypoint = currentKeypoint;

    // LATER REMOVE THIS AND POST PROCESS IT!
    const timeToFirstExtreme: Date = currentKeypoint.capturedAt;

    // timestamp
    currentRepRef.current.extremeTimestamp = timeToFirstExtreme;

    currentRepRef.current.timeToExtremeMs = Math.max(
      EXERCISE_TIMES_ROUNDING_STEP_S * 1000,
      commonService.number.roundToStep(
        TimeUtil.getMsDiff(
          currentRepRef.current.startTimestamp,
          timeToFirstExtreme
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000 // 200ms
      )
    );
  }

  static getSmoothedValues(
    buffer: KeypointHistory,
    keypointId: KeypointId,
    valueType: KeypointValueType
  ): NumericValueFrameNum[] | number[] {
    const rawKeypoints: (Keypoint | undefined)[] =
      buffer.getHistoryById(keypointId);
    const lastUndefIndx = rawKeypoints.lastIndexOf(undefined);
    const tail = rawKeypoints.slice(lastUndefIndx + 1);

    const keypoints: Keypoint[] = tail.filter(
      (k): k is Keypoint => k !== undefined
    );

    const unsmoothedValues = keypoints
      .map((k) => ({
        value: KeypointUtil.getKeypointValueByType(k, valueType),
        frameNum: k.frameNum,
      }))
      .filter((v): v is NumericValueFrameNum => v.value !== undefined);

    const values = KeypointUtil.smoothKeypointValues(
      unsmoothedValues,
      undefined,
      13,
      2
    );

    return values;
  }

  static getScaleFromVelocity(velocity: number[]): number {
    const meanV = velocity.reduce((a, b) => a + b, 0) / velocity.length;
    const stdV = Math.sqrt(
      velocity.reduce((a, b) => a + (b - meanV) ** 2, 0) / velocity.length
    );

    return Math.max(stdV, 1e-6);
  }

  // loops from the back of the array and returns the first index, which satisfies the slopeK and sustainW conditions
  private static getSlopeK(state: {
    velocity: number[];
    direction: ConditionDirection;
    detectingRepStart: boolean;
    avgFps: { value: number; count: number } | null;
  }): number | undefined {
    const { velocity, direction, detectingRepStart, avgFps } = state;

    const isHighFps =
      avgFps?.value &&
      avgFps?.value > POSE_DETECTION_CONSTRAINTS.HIGH_FPS_THRESHOLD;

    // if we are over this velocity, then we are still moving - starting or ending the rep!
    const minVelocityPerFrame =
      (detectingRepStart
        ? isHighFps
          ? POSE_DETECTION_CONSTRAINTS.REP_START_VELOCITY_HIGH_FPS_M_PER_S
          : POSE_DETECTION_CONSTRAINTS.REP_START_VELOCITY_LOW_FPS_M_PER_S
        : POSE_DETECTION_CONSTRAINTS.REP_END_VELOCITY_M_PER_S) /
      (avgFps?.value || 30); // when we go under this velocity, then we started/ended the rep!

    const minVelocitySustainNumFrames = KeypointUtil.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTRAINTS.REP_START_VELOCITY_SUSTAIN_S,
      avgFps?.value || 30
    );

    let bestK: number | undefined;
    let bestS: number | undefined;

    // When detecting rep end, we can cut the velocity array to a certain lookback time (like a buffer)
    const cutVelocity = !detectingRepStart
      ? velocity.slice(
          velocity.length -
            Math.max(
              4,
              Math.ceil(
                (avgFps?.value || 0) *
                  POSE_DETECTION_CONSTRAINTS.REP_END_LOOKBACK_S
              )
            )
        )
      : undefined;

    let hit = 0;
    const initialMissHit = cutVelocity
      ? Math.floor(cutVelocity.length * 0.2)
      : Math.floor(minVelocitySustainNumFrames * 0.2); // allow some misses in the sustain frames
    let missHit = initialMissHit;

    let s = (cutVelocity || velocity).length - 1;

    while (s >= 0) {
      const K = (cutVelocity || velocity)[s];

      if (detectingRepStart) {
        if (
          (direction === ConditionDirection.POSITIVE &&
            K < minVelocityPerFrame) ||
          (direction === ConditionDirection.NEGATIVE &&
            K > -minVelocityPerFrame)
        ) {
          // console.log('BEST START');

          if (
            bestK === undefined ||
            (direction === ConditionDirection.POSITIVE && K <= bestK) ||
            (direction === ConditionDirection.NEGATIVE && K >= bestK)
          ) {
            bestK = K;
          }

          bestS = s;
          hit++;

          if (hit === minVelocitySustainNumFrames) {
            bestS = s + minVelocitySustainNumFrames - 1;
            break;
          }
        } else if (missHit > 0) {
          missHit--;
          hit++;

          if (hit === minVelocitySustainNumFrames) {
            bestS = s + minVelocitySustainNumFrames - 1;
            break;
          }
        } else {
          hit = 0;
          missHit = initialMissHit;
        }

        if (
          bestK === undefined ||
          (direction === ConditionDirection.POSITIVE && K <= bestK) ||
          (direction === ConditionDirection.NEGATIVE && K >= bestK)
        ) {
          // console.log('FOUND OK START');
          bestK = K;
          bestS = s;
        }
      } else {
        if (
          (direction === ConditionDirection.POSITIVE &&
            K > -minVelocityPerFrame) ||
          (direction === ConditionDirection.NEGATIVE && K < minVelocityPerFrame)
        ) {
          // console.log('BEST END');

          if (
            bestK === undefined ||
            (direction === ConditionDirection.NEGATIVE && K <= bestK) ||
            (direction === ConditionDirection.POSITIVE && K >= bestK)
          ) {
            bestK = K;
          }

          hit++;
          bestS = s;

          if (hit === cutVelocity?.length) {
            bestS = s + minVelocitySustainNumFrames - 1;
            break;
          }
        } else if (missHit > 0) {
          missHit--;
          hit++;

          if (hit === cutVelocity?.length) {
            bestS = s + minVelocitySustainNumFrames - 1;
            break;
          }
        } else {
          hit = 0;
          missHit = initialMissHit;
        }
      }

      s -= 1;
    }

    return bestS !== undefined
      ? detectingRepStart
        ? bestS
        : cutVelocity
          ? bestS + (velocity.length - cutVelocity?.length)
          : undefined
      : undefined;
  }

  private static initStartValues(
    currentRepBuffer: KeypointHistory | undefined,
    keypointId: KeypointId,
    valueType: KeypointValueType
  ): {
    currentKeypoint: Keypoint | null;
    currentValue: number | null;
    velocity: number[] | null;
    scale: number | null;
  } {
    if (!currentRepBuffer)
      return {
        currentKeypoint: null,
        currentValue: null,
        velocity: null,
        scale: null,
      };

    const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentRepBuffer.history[currentRepBuffer.history.length - 1] || [],
      keypointId
    );

    if (!currentKeypoint)
      return {
        currentKeypoint: null,
        currentValue: null,
        velocity: null,
        scale: null,
      };

    const currentValue = KeypointUtil.getKeypointValueByType(
      currentKeypoint,
      valueType
    );

    if (currentValue === undefined)
      return {
        currentKeypoint: null,
        currentValue: null,
        velocity: null,
        scale: null,
      };

    const values = this.getSmoothedValues(
      currentRepBuffer,
      keypointId,
      valueType
    ) as NumericValueFrameNum[];

    const velocity: number[] = KeypointUtil.getVelocityFromValues(
      values.map((v) => v.value)
    );

    // Data-driven threshold: k * std(v)
    const scale = this.getScaleFromVelocity(velocity);

    return {
      currentKeypoint,
      currentValue,
      velocity,
      scale,
    };
  }

  private static initNewRep(
    repNumber: number,
    startValue: number,
    startValueFrameNum: number,
    startValueCapturedAt: Date,
    history: Keypoint[][]
  ): Rep {
    return {
      repNumber,
      startTimestamp: startValueCapturedAt,
      startValue,
      startValueFrameNum,
      buffer: new KeypointHistory(history),
      detectedExtremum: false,
      currentlyInExtremumRange: false,
      timeAtExtremeMs: 0,
    };
  }

  private static async postProcessRep(state: {
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    avgFps: { value: number; count: number } | null;
  }) {
    const {
      currentRepRef,
      recordedRepsRef,
      keypointId,
      valueType,
      direction,
      avgFps,
    } = state;

    if (!currentRepRef.current || !currentRepRef.current) return;

    const extremeKeypoint = currentRepRef.current.extremeKeypoint;

    if (!extremeKeypoint) return;

    const keypoints = currentRepRef.current.buffer.getHistoryById(keypointId);
    const initialValues: number[] = keypoints
      .map((k) => KeypointUtil.getKeypointValueByType(k, valueType))
      .filter((v) => v !== undefined);

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

    if (indexOfExtreme === -1) return;

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

    // UPDATE ALL NECESARY TIMES HERE!
    // durationMs, idleTimeMs, timeToExtremeMs, timeAtExtremeMs, timeFromExtremeToEndMs

    if (currentRepRef.current.endValueTimestamp) {
      currentRepRef.current.durationMs = commonService.number.roundToStep(
        TimeUtil.getMsDiff(
          currentRepRef.current.startTimestamp,
          currentRepRef.current.endValueTimestamp
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000
      );
    }

    if (recordedRepsRef.current.length > 0) {
      const prevRep =
        recordedRepsRef.current[recordedRepsRef.current.length - 1];
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

  static saveRepTimesToJsonFiles = (state: {
    recordedRepsRef: RefObject<Rep[]>;
    selectedExercise: TrainingExercise | undefined;
  }) => {
    const { recordedRepsRef, selectedExercise } = state;

    const repsData = recordedRepsRef.current.map((rep) => ({
      repNumber: rep.repNumber,
      idleTime: rep.idleTimeMs,
      timeToExtremeMs: rep.timeToExtremeMs,
      timeAtExtremeMs: rep.timeAtExtremeMs,
      timeFromExtremeToEndMs: rep.timeFromExtremeToEndMs,
      durationMs: rep.durationMs,
    }));

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(repsData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `${selectedExercise?.id || 'exercise'}_reps_times.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
}
