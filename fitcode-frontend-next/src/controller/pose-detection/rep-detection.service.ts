import { RefObject } from 'react';
import { KeypointHistory } from './class/keypoint-history';
import { StatusDetectionService } from './status-detection.service';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import {
  ConditionDirection,
  ExerciseRepStartCondition,
} from './type/exercise-start-condition.type';
import { Keypoint } from './type/keypoint.type';
import { KeypointUtil } from './util/keypoint.util';
import { Rep } from './type/rep.type';
import { RepState } from './type/rep-state.type';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';

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
    slopeK: number;
    sustainW: number;
    preWindow: number;
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
      slopeK,
      sustainW,
      preWindow,
      exerciseStartConditions,
      avgFps,
      initedFirstFrameInRecordingMode,
    } = state;

    switch (repStateRef.current.status) {
      case RepStatus.IN_REP: {
        // check for rep end
        const isRepDone = this.checkHasRepEnded({
          repStateRef,
          currentRepRef,
          recordedRepsRef,
          direction,
          keypointId,
          valueType,
          slopeK,
          sustainW,
          avgFps,
        });

        if (isRepDone && currentRepRef.current) {
          // Save rep
          // this.postProcessRep();

          // update avgStartValue and avgExtremeValue
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
              : (repStateRef.current.avgStartValue! *
                  recordedRepsRef.current.length +
                  currentRepRef.current.startValue) /
                (recordedRepsRef.current.length + 1);

          recordedRepsRef.current.push(currentRepRef.current!);

          console.log('RECORDED ', recordedRepsRef.current.length, ' REPS');

          repStateRef.current.status = RepStatus.IDLE; // we are now out of the rep
        }

        break;
      }
      case RepStatus.IDLE: {
        // check for rep start
        const { hasRepStarted, startValue } = this.checkHasRepStarted({
          currentFrameKeypoints,
          keypointHistory,
          currentRepBuffer: currentRepRef.current?.buffer,
          keypointId,
          valueType,
          direction,
          exerciseStartConditions,
          avgFps,
          slopeK,
          sustainW,
          preWindow,
          initedFirstFrameInRecordingMode,
        });

        if (hasRepStarted && startValue !== undefined) {
          console.log('NEW REP DETECTED');
          repStateRef.current.status = RepStatus.IN_REP; // we are now in the rep

          // init new rep
          currentRepRef.current = this.initNewRep(
            recordedRepsRef.current.length + 1,
            startValue
          );
        }
        break;
      }
      default:
        break;
    }
  }

  // Detect whether the value went up/down consecutive times and then up/down consecutive times
  // via the slope of the velocity (K score), example: k=[-2- -1, 1, 2] -> true
  // Also the value needs to be out of a certain range from the starting value
  static detectExtremum(state: {
    repStateRef: RefObject<RepState>;
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    slopeK: number;
    sustainW: number;
    avgFps: { value: number; count: number } | null;
  }) {
    const {
      repStateRef,
      currentRepRef,
      recordedRepsRef,
      direction,
      keypointId,
      valueType,
      slopeK,
      sustainW,
      avgFps,
    } = state;

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

    // if (
    //   this.checkValueCloseEnoughToStartValue(
    //     currentValue,
    //     repStateRef,
    //     currentRepRef
    //   )
    // ) {
    //   console.log('VALUE TOO CLOSE TO START VALUE');
    //   return false;
    // }

    const buffer = currentRepRef.current.buffer;

    // Detect max(2, 150ms) consecutive frames with negative/positive K and then
    // right after max(2, 150ms) consecutive frames with positive/negative K,
    // so like [-2, -1, 1, 2]. If true, set detectedExtremum to true
    // also check for buffer length here after calculating the numFrames needed

    const totalNumFrames = avgFps
      ? Math.max(
          POSE_DETECTION_CONSTRAINTS.MIN_REP_FRAMES,
          KeypointUtil.getFramesCountFromSeconds(
            POSE_DETECTION_CONSTRAINTS.MIN_REP_TIME_S,
            avgFps.value
          )
        )
      : POSE_DETECTION_CONSTRAINTS.MIN_REP_FRAMES; // min 4 total consecutive correct frames (2pos k's, 2neg k's)
    // const minSustainW = Math.max(2, Math.ceil(totalNumFrames / 2));

    const startKCheckIndex = buffer.history.length - 1 - totalNumFrames;

    if (startKCheckIndex < 0) return; // not enough frames yet

    let hit = 0;
    const anyDirectionBuffer = [];

    const ks = [];
    for (let i = startKCheckIndex; i < startKCheckIndex + totalNumFrames; i++) {
      const K = velocity[i] / Math.max(scale, 1e-6);
      ks.push(K);

      const lookingForPositiveK = direction === ConditionDirection.NEGATIVE;

      if (direction === ConditionDirection.ANY) anyDirectionBuffer.push(K);
      else if (lookingForPositiveK && K >= 0) hit++;
      else if (!lookingForPositiveK && K <= 0) hit++;
    }

    // Validate any buffer
    if (direction === ConditionDirection.ANY && anyDirectionBuffer.length) {
      let firstValuePositive = anyDirectionBuffer[0] > 0;
      for (const v of anyDirectionBuffer) {
        if ((firstValuePositive && v >= 0) || (!firstValuePositive && v <= 0)) {
          hit++;
          break;
        }
      }
    }

    if (hit === totalNumFrames) {
      console.log('DETECTED EXTREMUM');
      currentRepRef.current.detectedExtremum = true;
    }
  }

  static checkHasRepEnded(state: {
    repStateRef: RefObject<RepState>;
    currentRepRef: RefObject<Rep | null>;
    recordedRepsRef: RefObject<Rep[]>;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    slopeK: number;
    sustainW: number;
    avgFps: { value: number; count: number } | null;
  }): boolean {
    const {
      repStateRef,
      currentRepRef,
      recordedRepsRef,
      direction,
      keypointId,
      valueType,
      slopeK,
      sustainW,
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
    )
      return false;

    // CHECK FOR U -> 2 consecutiove values have k negative, and then the next 2 have it positive - in the function also check for minDistanceForRep. Add this attribute to the exerciseConditions

    // Update extreme value
    this.updateExtremeRepValue(
      direction,
      currentValue,
      currentRepRef,
      repStateRef
    );

    // We need to detect an extremum first to finish the rep
    if (
      currentRepRef.current?.extremeValue === undefined ||
      !currentRepRef.current?.detectedExtremum
    )
      return false;

    if (currentRepRef.current?.buffer.history.length < 2) return false;

    // Check if current value is close enough to starting value
    if (
      !this.checkValueCloseEnoughToStartValue(
        currentValue,
        repStateRef,
        currentRepRef
      )
    ) {
      // console.log('VALUE NOT CLOSE TO START VALUE');
      return false;
    }

    // slope = naklon
    const slope = this.getSlopeK({
      velocity,
      scale,
      direction,
      slopeK,
      sustainW,
      detectingRepStart: false,
    });

    if (slope === undefined) {
      // slope not flat enough yet
      // console.log('SLOPE NOT FLAT ENOUGH YET');
      return false;
    }

    // HERE ALSO LOOK FOR LOCAL

    // console.log('REP DONE');
    return true;
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
    slopeK: number;
    sustainW: number;
    preWindow: number;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
  }): { hasRepStarted: boolean; startValue?: number } {
    const {
      currentFrameKeypoints,
      keypointHistory,
      currentRepBuffer,
      keypointId,
      valueType,
      direction,
      exerciseStartConditions,
      avgFps,
      slopeK,
      sustainW,
      preWindow,
      initedFirstFrameInRecordingMode, // if the very first rep has been inited
    } = state;

    const isFirstRep = !initedFirstFrameInRecordingMode.current;

    const currentHistory = isFirstRep ? keypointHistory : currentRepBuffer;

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
    const { startIndex, startValue } = RepDetectionService.findStartOfRep({
      buffer: currentHistory,
      keypointId,
      valueType,
      direction,
      slopeK,
      sustainW,
      preWindow,
    });

    currentHistory.cutAtIndex(startIndex, true);

    const startKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      currentHistory.history[0],
      keypointId
    );

    if (!startKeypoint) return { hasRepStarted: false };

    if (startValue === undefined) return { hasRepStarted: false };

    initedFirstFrameInRecordingMode.current = true;

    return { hasRepStarted: true, startValue };
  }

  static findStartOfRep(state: {
    buffer: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    slopeK: number; // how many std devs below 0 to call “down”
    sustainW: number; // frames of sustained slope
    preWindow: number; // look for local max/min in this many frames before the sustain
  }): { startIndex: number; startValue: number } {
    const {
      buffer,
      keypointId,
      valueType,
      direction,
      slopeK,
      sustainW,
      preWindow,
    } = state;

    // 1) Get smoothed values of the keypoint's values
    const values = this.getSmoothedValues(buffer, keypointId, valueType);

    const n = values.length;

    // 2) Velocity
    const velocity: number[] = KeypointUtil.getVelocityFromValues(values);

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
      slopeK,
      sustainW,
      detectingRepStart: true,
    });

    // If ANY and found, infer actual direction from sustained window
    let effDir = direction;
    if (direction === ConditionDirection.ANY && slope !== undefined) {
      const meanLast = (() => {
        let sum = 0;
        for (let k = 0; k < sustainW; k++) sum += velocity[slope - k];
        return sum / sustainW;
      })();
      effDir =
        meanLast <= 0
          ? ConditionDirection.NEGATIVE
          : ConditionDirection.POSITIVE;
    }

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
        return { startIndex: minIdx, startValue: minVal };
      } else if (direction === ConditionDirection.NEGATIVE) {
        let maxIdx = 0,
          maxVal = values[0];
        for (let i = 1; i < n; i++)
          if (values[i] >= maxVal) {
            maxVal = values[i];
            maxIdx = i;
          }
        return { startIndex: maxIdx, startValue: maxVal };
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
          return { startIndex: maxIdx, startValue: maxVal };
        } else {
          let minIdx = 0,
            minVal = values[0];
          for (let i = 1; i < n; i++)
            if (values[i] <= minVal) {
              minVal = values[i];
              minIdx = i;
            }
          return { startIndex: minIdx, startValue: minVal };
        }
      }
    }

    // 5) Slope found, find last local extremum before s within preWindow
    const left = Math.max(0, slope - preWindow);
    let extremumIdx = left,
      extremumVal = values[left];

    if (effDir === ConditionDirection.NEGATIVE) {
      // look for local MAX
      for (let i = left + 1; i <= slope; i++) {
        if (values[i] >= extremumVal) {
          extremumVal = values[i];
          extremumIdx = i;
        }
      }
    } else {
      // look for local MIN
      for (let i = left + 1; i <= slope; i++) {
        if (values[i] <= extremumVal) {
          extremumVal = values[i];
          extremumIdx = i;
        }
      }
    }

    return { startIndex: extremumIdx, startValue: extremumVal };
  }

  private static checkValueCloseEnoughToStartValue(
    currentValue: number,
    repStateRef: RefObject<RepState>,
    currentRepRef: RefObject<Rep | null>
  ) {
    // repStateRef.current.avgStartValue is null only on the very first rep
    const startingValue =
      repStateRef.current.avgStartValue !== null
        ? repStateRef.current.avgStartValue
        : currentRepRef.current?.startValue;

    const extremeValue =
      repStateRef.current.avgExtremeValue !== null
        ? repStateRef.current.avgExtremeValue
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
    repStateRef: RefObject<RepState>
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
              repStateRef,
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
              repStateRef,
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
      case ConditionDirection.ANY: {
        if (
          (extremeValue === undefined &&
            !this.checkValueCloseEnoughToStartValue(
              currentValue,
              repStateRef,
              currentRepRef
            )) ||
          (extremeValue !== undefined &&
            Math.abs(currentValue - extremeValue) >
              Math.abs(extremeValue - currentRepRef.current.startValue))
        ) {
          currentRepRef.current.extremeValue = currentValue;
          currentRepRef.current.extremeValueIndex =
            currentRepRef.current.buffer.history.length - 1;
        }
      }
    }
  }

  private static getSmoothedValues(
    buffer: KeypointHistory,
    keypointId: KeypointId,
    valueType: KeypointValueType
  ) {
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
        } else  {
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
    );

    const velocity: number[] = KeypointUtil.getVelocityFromValues(values);

    // Data-driven threshold: k * std(v)
    const scale = this.getScaleFromVelocity(velocity);

    return {
      currentKeypoint,
      currentValue,
      velocity,
      scale,
    };
  }

  static initNewRep(repNumber: number, startValue: number): Rep {
    return {
      repNumber,
      createdAt: new Date(),
      startValue,
      buffer: new KeypointHistory([]),
      detectedExtremum: false,
    };
  }
}
