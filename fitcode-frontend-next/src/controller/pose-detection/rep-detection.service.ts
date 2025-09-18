import type { RefObject } from 'react';

import { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { ConditionDirection } from './enum/condition-detection.enum';
import type { KeypointId } from './enum/keypoint-id';
import type { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { Rep } from './type/rep.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import { NumericValueFrameNum } from './type/numeric-value-frame-num';

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
    } = state;

    switch (repStateRef.current.status) {
      case RepStatus.IN_REP: {
        // check for rep end
        const { isRepDone, extremeValueFrameNum } = this.checkHasRepEnded({
          repStateRef,
          currentRepRef,
          recordedRepsRef,
          keypointHistory,
          direction,
          keypointId,
          valueType,
          avgFps,
        });

        if (
          isRepDone &&
          extremeValueFrameNum !== undefined &&
          currentRepRef.current
        ) {
          // Save rep

          this.updateAvgStartAndExtremeValue(
            repStateRef,
            currentRepRef,
            recordedRepsRef
          );

          this.setRepEndValue(currentRepRef, keypointId, valueType);
          currentRepRef.current.endValueFrameNum = extremeValueFrameNum;

          // this.postProcessRep(); -> TODO()

          recordedRepsRef.current.push(currentRepRef.current!);

          console.log('RECORDED ', recordedRepsRef.current.length, ' REPS');

          repStateRef.current.status = RepStatus.IDLE; // we are now out of the rep
        }

        break;
      }
      case RepStatus.IDLE: {
        if (recordedRepsRef.current.length > 0) {
          const lastRep =
            recordedRepsRef.current[recordedRepsRef.current.length - 1];

          const currentFrameNum = keypointHistory.getLatestFrameNum();

          if (
            typeof lastRep.endValueFrameNum === 'number' &&
            Math.abs(currentFrameNum - lastRep.endValueFrameNum) <=
              POSE_DETECTION_CONSTRAINTS.POST_WINDOW_FRAMES_REP_END
          )
            this.checkPostWindowForExtraExtremums({
              lastRep,
              currentFrameKeypoints,
              keypointId,
              valueType,
              direction,
            });
        }

        // check for rep start
        const { hasRepStarted, startValue, startValueFrameNum } =
          this.checkHasRepStarted({
            currentFrameKeypoints,
            keypointHistory,
            currentRepBuffer: currentRepRef.current?.buffer,
            keypointId,
            valueType,
            direction,
            exerciseStartConditions,
            avgFps,
            initedFirstFrameInRecordingMode,
          });

        if (
          hasRepStarted &&
          startValue !== undefined &&
          startValueFrameNum !== undefined
        ) {
          console.log('NEW REP DETECTED with startValue', startValue);
          repStateRef.current.status = RepStatus.IN_REP; // we are now in the rep

          // init new rep
          currentRepRef.current = this.initNewRep(
            recordedRepsRef.current.length + 1,
            startValue,
            startValueFrameNum
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
  static detectExtremum(state: {
    currentRepRef: RefObject<Rep | null>;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    avgFps: { value: number; count: number } | null;
  }) {
    const { currentRepRef, direction, keypointId, valueType, avgFps } = state;

    if (
      currentRepRef.current?.extremeValue === undefined ||
      currentRepRef.current?.extremeValueIndex === undefined
    )
      return;

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
      console.log('DETECTED EXTREMUM');
      currentRepRef.current.detectedExtremum = true;
    }
  }

  // A buffer, which after we detect rep end, checks for extra extremums in the next n frames
  static checkPostWindowForExtraExtremums(state: {
    lastRep: Rep;
    currentFrameKeypoints: Keypoint[];
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
  }) {
    console.log('checkPostWindowForExtraExtremums');
    const { lastRep, currentFrameKeypoints, keypointId, valueType, direction } =
      state;

    if (
      !lastRep.detectedExtremum ||
      typeof lastRep.endValueFrameNum !== 'number' ||
      typeof lastRep.endValue !== 'number'
    )
      return; // if we accidentally pass a new recording rep

    const currentKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentFrameKeypoints,
      keypointId
    );

    if (!currentKeypoint) return;

    const currentValue = KeypointUtil.getKeypointValueByType(
      currentKeypoint,
      valueType
    );

    if (currentValue === undefined) return;

    if (
      direction === ConditionDirection.POSITIVE &&
      currentValue < lastRep.endValue
    ) {
      // local min
      console.log(
        'UPDATED EXTREMUM IN POST WINDOW from',
        lastRep.endValue,
        ' to ',
        currentValue
      );
      lastRep.endValue = currentValue;
      lastRep.endValueFrameNum = currentValue;
    } else if (
      direction === ConditionDirection.NEGATIVE &&
      currentValue > lastRep.endValue
    ) {
      // local max
      console.log(
        'UPDATED EXTREMUM IN POST WINDOW from',
        lastRep.endValue,
        ' to ',
        currentValue
      );

      lastRep.endValue = currentValue;
      lastRep.endValueFrameNum = currentValue;
    }
  }

  static checkHasRepEnded(state: {
    repStateRef: RefObject<RepState>;
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    keypointHistory: KeypointHistory;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    avgFps: { value: number; count: number } | null;
  }): { isRepDone: boolean; extremeValueFrameNum?: number } {
    const {
      repStateRef,
      currentRepRef,
      recordedRepsRef,
      keypointHistory,
      direction,
      keypointId,
      valueType,
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
    this.updateExtremeRepValue(
      direction,
      currentValue,
      currentRepRef,
      recordedRepsRef
    );

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
    const slope = this.getSlopeK({
      velocity,
      scale,
      direction,
      slopeK: POSE_DETECTION_CONSTRAINTS.SLOPE_K_REP_END,
      sustainW: POSE_DETECTION_CONSTRAINTS.SUSTAIN_W_REP_END,
      detectingRepStart: false,
    });

    if (slope === undefined) return { isRepDone: false };

    const extremeValueFrameNum = keypointHistory.getLatestFrameNum();

    // HERE ALSO LOOK FOR LOCAL EXTREMUM, NOT JUST SLOPE
    // If we look for local extremum, we also need to capture the next n frames and get the extremum
    // out of those, or maybe just track the next n frames, if the value is more extreme than the
    // current extreme_value, then update it

    return { isRepDone: true, extremeValueFrameNum };
  }

  static checkHasRepStarted(state: {
    currentFrameKeypoints: Keypoint[];
    keypointHistory: KeypointHistory;
    currentRepBuffer?: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    exerciseStartConditions: ExerciseRepStartCondition[];
    avgFps: { value: number; count: number } | null;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
  }): {
    hasRepStarted: boolean;
    startValue?: number;
    startValueFrameNum?: number;
  } {
    const {
      currentFrameKeypoints,
      keypointHistory,
      currentRepBuffer,
      keypointId,
      valueType,
      direction,
      exerciseStartConditions,
      avgFps,
      initedFirstFrameInRecordingMode, // if the very first rep has been inited
    } = state;

    const isFirstRep = !initedFirstFrameInRecordingMode.current;

    // const currentHistory = isFirstRep ? keypointHistory : currentRepBuffer;

    const currentHistory = keypointHistory;

    if (!currentHistory) return { hasRepStarted: false };

    // checks if exercise state conditions are met (traveling certain distance in certain time)
    const checkStartedRep =
      StatusDetectionService.checkExerciseRepStartConditions(
        currentFrameKeypoints,
        keypointHistory,
        exerciseStartConditions,
        avgFps
      );

    if (!checkStartedRep) return { hasRepStarted: false };

    if (currentHistory.history.length < 2) return { hasRepStarted: false };

    // New rep detected, find percise starting point
    const { startIndex, startValue, startValueFrameNum } =
      RepDetectionService.findStartOfRep({
        buffer: currentHistory,
        keypointId,
        valueType,
        direction,
      });

    currentHistory.cutAtIndex(startIndex, true);

    const startKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentHistory.history[0],
      keypointId
    );

    if (!startKeypoint) return { hasRepStarted: false };

    if (startValue === undefined || startValueFrameNum === undefined)
      return { hasRepStarted: false };

    initedFirstFrameInRecordingMode.current = true;

    return { hasRepStarted: true, startValue, startValueFrameNum };
  }

  static findStartOfRep(state: {
    buffer: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
  }): { startIndex: number; startValue: number; startValueFrameNum: number } {
    const { buffer, keypointId, valueType, direction } = state;

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

    // Used to calculate min and std of the first half of the velocity data (assumes user starts from still)
    const firstHalfVelocity = velocity.slice(1, Math.floor(n / 2));

    // Data-driven threshold: k * std(v)
    const scale = this.getScaleFromVelocity(firstHalfVelocity);

    // 3) Walk backwards using per-frame K score (z-score of velocity)
    // K = v / scale. For NEGATIVE: K >= -slopeK; POSITIVE: K <= +slopeK; ANY: |K| >= slopeK
    // slope = naklon
    const slope = this.getSlopeK({
      velocity,
      scale,
      direction,
      slopeK: POSE_DETECTION_CONSTRAINTS.SLOPE_K_REP_START,
      sustainW: POSE_DETECTION_CONSTRAINTS.SUSTAIN_W_REP_START,
      detectingRepStart: true,
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

    // 5) Slope found, find last local extremum before s within preWindow
    // If condition is POSITIVE, look for local min; if NEGATIVE, look for local max
    const left = Math.max(
      0,
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

  private static updateExtremeRepValue(
    direction: ConditionDirection,
    currentValue: number,
    currentRepRef: RefObject<Rep | null>,
    recordedRepsRef: RefObject<Rep[]>
  ) {
    if (!currentRepRef.current) return;

    const startValue = currentRepRef.current.startValue;
    const extremeValue = currentRepRef.current.extremeValue;

    switch (direction) {
      case ConditionDirection.POSITIVE: {
        if (
          (extremeValue === undefined &&
            currentValue > startValue &&
            !this.checkValueCloseEnoughToStartValue(
              currentValue,
              recordedRepsRef,
              currentRepRef
            )) ||
          (extremeValue !== undefined && currentValue > extremeValue)
        ) {
          currentRepRef.current.extremeValue = currentValue;
          currentRepRef.current.extremeValueIndex =
            currentRepRef.current.buffer.history.length - 1;
        }
        break;
      }
      case ConditionDirection.NEGATIVE: {
        if (
          (extremeValue === undefined &&
            currentValue < startValue &&
            !this.checkValueCloseEnoughToStartValue(
              currentValue,
              recordedRepsRef,
              currentRepRef
            )) ||
          (extremeValue !== undefined && currentValue < extremeValue)
        ) {
          currentRepRef.current.extremeValue = currentValue;
          currentRepRef.current.extremeValueIndex =
            currentRepRef.current.buffer.history.length - 1;
        }
        break;
      }
    }
  }

  private static getSmoothedValues(
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

  private static getScaleFromVelocity(velocity: number[]): number {
    const meanV = velocity.reduce((a, b) => a + b, 0) / velocity.length;
    const stdV = Math.sqrt(
      velocity.reduce((a, b) => a + (b - meanV) ** 2, 0) / velocity.length
    );

    return Math.max(stdV, 1e-6);
  }

  // loops from the back of the array and returns the first index, which satisfies the slopeK and sustainW conditions
  private static getSlopeK(state: {
    velocity: number[];
    scale: number;
    direction: ConditionDirection;
    slopeK: number;
    sustainW: number;
    detectingRepStart: boolean;
  }): number | undefined {
    const { velocity, scale, direction, slopeK, sustainW, detectingRepStart } =
      state;

    let s = velocity.length - 1;
    let found = false;
    let run = 0; // length of the current satisfied streak

    while (s >= 0) {
      const K = velocity[s] / Math.max(scale, 1e-6);

      let hit: boolean;

      if (detectingRepStart) {
        // when detecting start of rep, check for big K's and check direction
        if (direction === ConditionDirection.NEGATIVE) {
          hit = K >= -slopeK;
        } else if (direction === ConditionDirection.POSITIVE) {
          hit = K <= +slopeK;
        } else {
          // ANY
          hit = Math.abs(K) >= slopeK;
        }
      } else {
        // when detecing end of rep, only check for small K's, no need to check direction
        hit = Math.abs(K) <= slopeK;
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

    return found ? s : undefined;
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

  static initNewRep(
    repNumber: number,
    startValue: number,
    startValueFrameNum: number
  ): Rep {
    return {
      repNumber,
      createdAt: new Date(),
      startValue,
      startValueFrameNum,
      buffer: new KeypointHistory([]),
      detectedExtremum: false,
    };
  }

  // update avgStartValue and avgExtremeValue of repState
  private static updateAvgStartAndExtremeValue(
    repStateRef: RefObject<RepState>,
    currentRepRef: RefObject<Rep | null>,
    recordedRepsRef: RefObject<Rep[]>
  ) {
    if (!currentRepRef.current) return;

    repStateRef.current.avgExtremeValue =
      recordedRepsRef.current.length === 0
        ? currentRepRef.current.extremeValue!
        : (repStateRef.current.avgExtremeValue! *
            recordedRepsRef.current.length +
            currentRepRef.current.extremeValue!) /
          (recordedRepsRef.current.length + 1);

    repStateRef.current.avgStartValue =
      recordedRepsRef.current.length === 0
        ? currentRepRef.current.startValue
        : (repStateRef.current.avgStartValue! * recordedRepsRef.current.length +
            currentRepRef.current.startValue) /
          (recordedRepsRef.current.length + 1);
  }

  private static setRepEndValue(
    currentRepRef: RefObject<Rep | null>,
    keypointId: KeypointId,
    valueType: KeypointValueType
  ) {
    if (!currentRepRef.current) return;

    const lastIndexKeypoints = currentRepRef.current.buffer
      .getHistoryById(keypointId)
      .slice(-1);
    const lastIndexKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      lastIndexKeypoints,
      keypointId
    );

    if (lastIndexKeypoint) {
      const endValue = KeypointUtil.getKeypointValueByType(
        lastIndexKeypoint,
        valueType
      );

      currentRepRef.current.endValue = endValue;
    }
  }
}
