import dayjs from 'dayjs';
import type { RefObject } from 'react';

import { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { ConditionDirection } from './enum/condition-detection.enum';
import { CurrentSideMutexValues } from './enum/current-side-mutex-values.enum';
import type { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import { StatusDetectionService } from './status-detection.service';
import type { AvgFps } from './type/avg-fps.type';
import type { CurrentSideMutex } from './type/current-side-mutex.type';
import type {
  ExerciseAngleCondition,
  ExerciseDetectionData,
  ExerciseRepStartCondition,
  RequiredPoseCondition,
  StillnessCondition,
} from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { NumericValueFrameNum } from './type/numeric-value-frame-num';
import type { RecordedReps, Rep, RepsCount } from './type/rep.type';
import type { RepSideDetectionData } from './type/rep-side-detection-data';
import { KeypointUtil } from './util/keypoint.util';
import { RepPostProcessingUtil } from './util/rep-post-processing.util';
import { EXERCISE_TIMES_ROUNDING_STEP_S } from '@/components/mobile-movement-validation/mobile-movement-validation';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { HorizontalVertical } from './enum/horizontal-vertical.enum';
import { Point2D } from './type/point.type';
import { AngleUtil } from './util/angle-util';

export class RepDetectionService {
  private static _instance: RepDetectionService;
  private readonly keypoint: KeypointUtil;
  private readonly status: StatusDetectionService;
  private readonly repPostProcessing: RepPostProcessingUtil;
  private readonly angle: AngleUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
    this.status = StatusDetectionService.instance;
    this.repPostProcessing = RepPostProcessingUtil.instance;
    this.angle = AngleUtil.instance;
  }

  static get instance(): RepDetectionService {
    if (!RepDetectionService._instance)
      RepDetectionService._instance = new RepDetectionService();
    return RepDetectionService._instance;
  }

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

  checkRepStatus(state: {
    currentFrameKeypoints: Keypoint[];
    keypointHistory: KeypointHistory;
    constantKeypointHistory: KeypointHistory;
    lastRecordedRepRef: RefObject<Rep | null>;
    exerciseDetectionData: ExerciseDetectionData;
    currentSideMutexRef: RefObject<CurrentSideMutex>;
    currentInvalidAnglesRef: RefObject<ExerciseAngleCondition[]>;
    valueType: KeypointValueType;
    avgFps: AvgFps;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
    leftData: RepSideDetectionData;
    rightData?: RepSideDetectionData | undefined;
    setRepCount: SetState<RepsCount>;
  }) {
    const {
      currentFrameKeypoints,
      keypointHistory,
      constantKeypointHistory,
      lastRecordedRepRef,
      exerciseDetectionData,
      currentSideMutexRef,
      currentInvalidAnglesRef,
      valueType,
      avgFps,
      initedFirstFrameInRecordingMode,
      leftData,
      rightData,
      setRepCount,
    } = state;

    const lAndR = [leftData, rightData].filter((side) => side !== undefined);

    let i = -1;
    for (const lOrR of lAndR) {
      i++;

      const {
        side,
        repStateRef,
        currentRepRef,
        recordedReps,
        keypointId,
        direction,
        exerciseStartConditions,
        requiredPoseConditions,
        recordingStillnesses,
        feedbackAngles,
        extremumAngles,
      } = lOrR;

      if (repStateRef.current.status === RepStatus.NONE) continue;

      const otherSide = lAndR[i === 0 ? 1 : 0];

      // If the other side is in rep, and the exercise cannot do both sides simultaneously, skip this side
      if (otherSide) {
        const { side: otherSideLabel } = otherSide;
        if (
          exerciseDetectionData.cannotDoBothSidesSimultaneously &&
          currentSideMutexRef.current ===
            (otherSideLabel as CurrentSideMutexValues)
        ) {
          continue;
        }
      }

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

          // Check angle feedbacks
          lib.ai.angle.checkAngleFeedbacks({
            angles: feedbackAngles,
            currentFrameKeypoints,
            currentInvalidAnglesRef,
          });

          // Check extreme angles
          (extremumAngles || []).forEach((extremumAngle) => {
            if (!currentRepRef.current) return;

            const point1Keypoints = extremumAngle.point1.map((kId) =>
              this.keypoint.getDesiredKeypointFromArray(
                currentFrameKeypoints,
                kId
              )
            );

            const originKeypointsIds = extremumAngle.attachOriginToStartValue
              ? currentRepRef.current.startFrameKeypoints
              : currentFrameKeypoints;

            const originKeypoints = extremumAngle.origin.map((kId) =>
              this.keypoint.getDesiredKeypointFromArray(originKeypointsIds, kId)
            );

            if (
              !lib.common.typeChecker.isKeypointArray(point1Keypoints) ||
              !lib.common.typeChecker.isKeypointArray(originKeypoints)
            )
              return;

            const extremumAnglePoint2: KeypointId[] | HorizontalVertical =
              extremumAngle.point2;

            const isPoint2KeypointIdArray =
              lib.common.typeChecker.isKeypointIdArray(extremumAnglePoint2);

            const point2Keypoints: (Keypoint | undefined)[] | null =
              isPoint2KeypointIdArray
                ? extremumAnglePoint2.map((kId) =>
                    this.keypoint.getDesiredKeypointFromArray(
                      currentFrameKeypoints,
                      kId
                    )
                  )
                : null;

            if (
              isPoint2KeypointIdArray &&
              !lib.common.typeChecker.isKeypointArray(point2Keypoints)
            )
              return;

            const point1: Point2D | null = this.keypoint.getAvgPointCoordinates(
              point1Keypoints,
              true
            );
            const origin: Point2D | null = this.keypoint.getAvgPointCoordinates(
              originKeypoints,
              true
            );

            if (!point1 || !origin) return;

            const point2: Point2D | null = isPoint2KeypointIdArray
              ? this.keypoint.getAvgPointCoordinates(
                  point2Keypoints as Keypoint[],
                  true
                )
              : extremumAnglePoint2 === HorizontalVertical.VERTICAL
                ? {
                    x: origin.x,
                    y: point1.y,
                  }
                : { x: point1.x, y: origin.y };

            if (!point2) return;

            let deg = this.angle.calculateAngle(point1, point2, origin);

            if (deg === null) return;

            deg = Math.round(deg * 10) / 10;

            console.log(deg);

            if (!currentRepRef.current.extremumAngles) {
              currentRepRef.current.extremumAngles = [
                {
                  ...extremumAngle,
                  value: deg,
                },
              ];

              return;
            }

            const found = currentRepRef.current.extremumAngles.find(
              (ea) => ea.id === extremumAngle.id
            );

            if (found && deg > found.value) {
              found.value = deg;
            } else if (!found)
              currentRepRef.current.extremumAngles.push({
                ...extremumAngle,
                value: deg,
              });
          });

          // Check for rep end
          const { isRepDone, endKeypoint } = this.checkHasRepEnded({
            currentFrameKeypoints,
            currentRepRef,
            recordedReps,
            keypointHistory,
            direction,
            keypointId,
            valueType,
            conditionDirection: direction,
            avgFps,
          });

          if (isRepDone && endKeypoint !== undefined && currentRepRef.current) {
            // Save rep
            currentRepRef.current.endValueTimestamp = endKeypoint.capturedAt;
            currentInvalidAnglesRef.current = []; // clear invalid anglesF

            // Set all the times
            this.postProcessRep({
              currentRepRef,
              recordedReps,
              keypointId,
              valueType,
              direction,
              avgFps,
            });

            lastRecordedRepRef.current = currentRepRef.current;

            recordedReps.push(currentRepRef.current);

            setRepCount((prev) =>
              side === 'L'
                ? { ...prev, left: recordedReps.length }
                : { ...prev, right: recordedReps.length }
            );

            console.log('RECORDED ', recordedReps.length, ' REPS');

            repStateRef.current.status = RepStatus.IDLE; // we are now out of the rep

            // Reset MUTEX after rep is done, also clear keypoint history, so that the other side does not detect a rep start
            if (currentSideMutexRef.current) {
              currentSideMutexRef.current = CurrentSideMutexValues.NoneAtm;
              keypointHistory.clear();
            }
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
            requiredPoseConditions,
            recordingStillnesses,
            avgFps,
            initedFirstFrameInRecordingMode,
            recordedReps,
            side,
          });

          if (
            hasRepStarted &&
            startValue !== undefined &&
            startValueFrameNum !== undefined &&
            startValueCapturedAt !== undefined
          ) {
            console.log('REP START DETECTED');
            // New rep
            // console.log('NEW REP DETECTED with startValue', startValue);
            if (currentSideMutexRef.current !== undefined) {
              console.log('setting MUTEX to', side);
              currentSideMutexRef.current = side as CurrentSideMutexValues; // lock to this side
            }
            repStateRef.current.status = RepStatus.IN_REP; // we are now in the rep

            currentRepRef.current = this.initNewRep(
              recordedReps.length + 1,
              startValue,
              startValueFrameNum,
              startValueCapturedAt,
              keypointHistory.history.map((h) => [...h]),
              constantKeypointHistory
            );
          }
          break;
        }
        default:
          break;
      }
    }
  }

  // Detect whether the value went up/down (opposite dirrection of the rep start direction) consecutive times
  // via the slope of the velocity (K score), example: (rep_direction=NEGATIVE; k=[0.5, 0.75, 1, 2]) -> true
  private detectExtremum(state: {
    currentRepRef: RefObject<Rep | null>;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    avgFps: AvgFps;
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
          this.keypoint.getFramesCountFromSeconds(
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

  private checkHasRepEnded(state: {
    currentFrameKeypoints: Keypoint[];
    currentRepRef: RefObject<Rep | null>;
    recordedReps: Rep[];
    keypointHistory: KeypointHistory;
    direction: ConditionDirection;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    conditionDirection: ConditionDirection;
    avgFps: AvgFps;
  }): { isRepDone: boolean; endKeypoint?: Keypoint } {
    const {
      currentFrameKeypoints,
      currentRepRef,
      recordedReps,
      keypointHistory,
      direction,
      keypointId,
      valueType,
      conditionDirection,
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

    if (slope === undefined) {
      // console.log('SLOPE UNDEFINED');
      return { isRepDone: false };
    }

    // Check if current value is close enough to starting value
    if (
      !this.checkValueCloseEnoughToStartValue(
        currentValue,
        recordedReps,
        currentRepRef,
        conditionDirection
      )
    ) {
      // console.log('NOT CLOSE ENOUGH TO START VALUE');
      return { isRepDone: false };
    }

    const endKeypoint = this.keypoint.getDesiredKeypointFromArray(
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

  private checkHasRepStarted(state: {
    currentFrameKeypoints: Keypoint[];
    keypointHistory: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    exerciseStartConditions: ExerciseRepStartCondition[];
    requiredPoseConditions?: RequiredPoseCondition[];
    recordingStillnesses?: StillnessCondition[];
    avgFps: AvgFps;
    initedFirstFrameInRecordingMode: RefObject<boolean>;
    recordedReps: Rep[];
    side: 'L' | 'R';
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
      requiredPoseConditions,
      recordingStillnesses,
      avgFps,
      initedFirstFrameInRecordingMode, // if the very first rep has been inited
      recordedReps,
      side,
    } = state;

    // const isFirstRep = !initedFirstFrameInRecordingMode.current;
    // const currentHistory = isFirstRep ? keypointHistory : currentRepBuffer;

    // checks if exercise state conditions are met (traveling certain distance in certain time)
    const checkStartedRep = this.status.checkExerciseRepStartConditions(
      currentFrameKeypoints,
      keypointHistory,
      exerciseStartConditions,
      avgFps,
      recordedReps
    );

    const checkRequiredPoseConditions = this.checkRequiredPoseConditions(
      currentFrameKeypoints,
      requiredPoseConditions
    );

    const checkStillnessConditions = this.checkStillnessConditions(
      keypointHistory,
      currentFrameKeypoints,
      avgFps,
      recordingStillnesses
    );

    if (
      !checkStartedRep ||
      !checkRequiredPoseConditions ||
      !checkStillnessConditions
    )
      return { hasRepStarted: false };

    if (keypointHistory.history.length < 2) return { hasRepStarted: false };

    // New rep detected, find percise starting point
    const { startIndex, startValue, startValueFrameNum } = this.findStartOfRep({
      buffer: keypointHistory,
      keypointId,
      valueType,
      direction,
      avgFps,
    });

    keypointHistory.cutAtIndex(startIndex, true);

    const startKeypoint = this.keypoint.getDesiredKeypointFromArray(
      keypointHistory.history[0],
      keypointId
    );

    if (!startKeypoint) return { hasRepStarted: false };

    if (startValue === undefined || startValueFrameNum === undefined)
      return { hasRepStarted: false };

    initedFirstFrameInRecordingMode.current = true;

    // Clamp start to be after previous rep's end
    let startValueCapturedAt = startKeypoint.capturedAt;
    const prev = recordedReps.at(-1);
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

  private checkRequiredPoseConditions(
    currentFrameKeypoints: Keypoint[],
    requiredPoseConditions?: RequiredPoseCondition[]
  ): boolean {
    if (!requiredPoseConditions) return true;

    for (const poseCondition of requiredPoseConditions) {
      const { keypointId1, keypointId2, valueType, minDiffM } = poseCondition;

      const keypoint1 = this.keypoint.getDesiredKeypointFromArray(
        currentFrameKeypoints,
        keypointId1
      );

      const keypoint2 = this.keypoint.getDesiredKeypointFromArray(
        currentFrameKeypoints,
        keypointId2
      );

      if (!keypoint1 || !keypoint2) return false;

      const value1 = this.keypoint.getKeypointValueByType(keypoint1, valueType);
      const value2 = this.keypoint.getKeypointValueByType(keypoint2, valueType);

      if (value1 === undefined || value2 === undefined) return false;

      const diff = value1 - value2;

      // if (avgFps !== null && avgFps.count % avgFps.value < 1) {
      //   console.log({ keypoint1: keypoint1.id, keypoint2: keypoint2.id, diff });
      // }

      if (diff < minDiffM) return false;
    }

    return true;
  }

  private checkStillnessConditions(
    keypointHistory: KeypointHistory,
    currentFrameKeypoints: Keypoint[],
    avgFps: AvgFps,
    recordingStillnesses?: StillnessCondition[]
  ): boolean {
    if (!recordingStillnesses || recordingStillnesses.length === 0) return true;

    for (const stillness of recordingStillnesses) {
      const { keypointId, maxMovementM, durationS } = stillness;

      const isStill = this.detectStillnessViaVelocity(
        keypointHistory,
        keypointId,
        maxMovementM,
        avgFps,
        durationS
      );

      if (!isStill) {
        console.log('NOT STILL', new Date().getTime().toString().at(-1));
        return false;
      }
    }

    return true;
  }

  // Calculates diffs and checks if it's under a certain threshold
  private detectStillnessViaVelocity(
    buffer: KeypointHistory,
    keypointId: KeypointId,
    maxMovementM: number,
    avgFps: AvgFps,
    seconds = 1
  ): boolean {
    if (!avgFps) return false;

    const numFrames = this.keypoint.getFramesCountFromSeconds(
      seconds,
      avgFps.value
    );

    if (numFrames > buffer.history.length) return false;

    const cutIndex = buffer.history.length - 1 - numFrames;

    const cutBuffer = buffer.history.slice(cutIndex);

    const keypoints = cutBuffer
      .map((frame) =>
        this.keypoint.getDesiredKeypointFromArray(frame, keypointId)
      )
      .filter((k) => k !== undefined);

    const valuesX = keypoints
      .map((k) =>
        this.keypoint.getKeypointValueByType(k, KeypointValueType.POSITION_X)
      )
      .filter((v) => v !== undefined);

    const valuesY = keypoints
      .map((k) =>
        this.keypoint.getKeypointValueByType(k, KeypointValueType.POSITION_Y)
      )
      .filter((v) => v !== undefined);

    const minX = Math.min(...valuesX);
    const maxX = Math.max(...valuesX);

    const minY = Math.min(...valuesY);
    const maxY = Math.max(...valuesY);

    if (
      Math.abs(minX - maxX) > maxMovementM
      // || Math.abs(minY - maxY) > maxMovementM
    )
      return false;

    return true;
  }

  private findStartOfRep(state: {
    buffer: KeypointHistory;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    avgFps: AvgFps;
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
    const velocity: number[] = this.keypoint.getVelocityFromValues(
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

    console.log('FOUND START INDEX AT', extremumIdx, 'SLOPE:', slope);

    return {
      startIndex: extremumIdx,
      startValue: extremumVal.value,
      startValueFrameNum: extremumVal.frameNum,
    };
  }

  private checkValueCloseEnoughToStartValue(
    currentValue: number,
    recordedReps: Rep[],
    currentRepRef: RefObject<Rep | null>,
    conditionDirection: ConditionDirection
  ) {
    // repStateRef.current.avgStartValue is null only on the very first rep
    const startingValue =
      recordedReps.length && recordedReps[0].startValue !== undefined
        ? recordedReps[0].startValue
        : currentRepRef.current?.startValue;

    const extremeValue =
      recordedReps.length && recordedReps[0].extremeValue !== undefined
        ? recordedReps[0].extremeValue
        : currentRepRef.current?.extremeValue;

    if (startingValue === undefined || extremeValue === undefined) return false;

    const diff = Math.abs(extremeValue - startingValue);

    const closeByMagnitude =
      Math.abs(currentValue - startingValue) <=
      diff * POSE_DETECTION_CONSTRAINTS.CLOSE_ENOUGH_TO_START_VALUE_RATIO;

    const consistentWithDirection =
      conditionDirection === ConditionDirection.POSITIVE
        ? startingValue > currentValue
        : currentValue > startingValue;

    const isValueCloseEnough = closeByMagnitude || consistentWithDirection;

    return isValueCloseEnough;
  }

  private updateExtremeRepValue(state: {
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
      lib.common.number.roundToStep(
        lib.common.date.getMsDiff(
          currentRepRef.current.startTimestamp,
          timeToFirstExtreme
        ),
        EXERCISE_TIMES_ROUNDING_STEP_S * 1000 // 200ms
      )
    );
  }

  getSmoothedValues(
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
        value: this.keypoint.getKeypointValueByType(k, valueType),
        frameNum: k.frameNum,
      }))
      .filter((v): v is NumericValueFrameNum => v.value !== undefined);

    const values = this.keypoint.smoothKeypointValues(
      unsmoothedValues,
      undefined,
      13,
      2
    );

    return values;
  }

  getScaleFromVelocity(velocity: number[]): number {
    const meanV = velocity.reduce((a, b) => a + b, 0) / velocity.length;
    const stdV = Math.sqrt(
      velocity.reduce((a, b) => a + (b - meanV) ** 2, 0) / velocity.length
    );

    return Math.max(stdV, 1e-6);
  }

  // loops from the back of the array and returns the first index, which satisfies the slopeK and sustainW conditions
  private getSlopeK(state: {
    velocity: number[];
    direction: ConditionDirection;
    detectingRepStart: boolean;
    avgFps: AvgFps;
  }): number | undefined {
    const { velocity, direction, detectingRepStart, avgFps } = state;

    const isHighFps =
      avgFps?.value &&
      avgFps?.value > POSE_DETECTION_CONSTRAINTS.HIGH_FPS_THRESHOLD;

    // if we are over this velocity, then we are still moving - starting or ending the rep!
    const minVelocityPerFrame =
      (detectingRepStart
        ? isHighFps
          ? POSE_DETECTION_CONSTRAINTS.REP_START_END_VELOCITY_HIGH_FPS_M_PER_S
          : POSE_DETECTION_CONSTRAINTS.REP_START_END_VELOCITY_LOW_FPS_M_PER_S
        : POSE_DETECTION_CONSTRAINTS.REP_END_VELOCITY_M_PER_S) /
      (avgFps?.value || 30); // when we go under this velocity, then we started/ended the rep!

    const minVelocitySustainNumFrames = this.keypoint.getFramesCountFromSeconds(
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

  private initStartValues(
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

    const currentKeypoint = this.keypoint.getDesiredKeypointFromArray(
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

    const currentValue = this.keypoint.getKeypointValueByType(
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

    const velocity: number[] = this.keypoint.getVelocityFromValues(
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

  private initNewRep(
    repNumber: number,
    startValue: number,
    startValueFrameNum: number,
    startValueCapturedAt: Date,
    history: Keypoint[][],
    constantKeypointHistory: KeypointHistory
  ): Rep {
    const cutAtIndex = constantKeypointHistory.history.findIndex((frame) => {
      const keypoint = frame[0];

      return keypoint.frameNum === startValueFrameNum;
    });

    const startRepKeypoints = constantKeypointHistory.history[cutAtIndex] || [];

    const bufferHistory =
      cutAtIndex !== -1
        ? new KeypointHistory(constantKeypointHistory.history.slice(cutAtIndex))
        : new KeypointHistory(history);

    return {
      repNumber,
      startTimestamp: startValueCapturedAt,
      startValue,
      startValueFrameNum,
      buffer: bufferHistory,
      detectedExtremum: false,
      currentlyInExtremumRange: false,
      timeAtExtremeMs: 0,
      startFrameKeypoints: startRepKeypoints,
    };
  }

  private async postProcessRep(state: {
    currentRepRef: RefObject<Rep | null>;
    recordedReps: Rep[];
    keypointId: KeypointId;
    valueType: KeypointValueType;
    direction: ConditionDirection;
    avgFps: AvgFps;
  }) {
    const {
      currentRepRef,
      recordedReps,
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
      .map((k) => this.keypoint.getKeypointValueByType(k, valueType))
      .filter((v) => v !== undefined);

    const { timeAtExtremumStartKeypoint, timeAtExtremumEndKeypoint } =
      this.repPostProcessing.getAtExtremumStartAndEndTimes({
        currentRepRef,
        initialValues,
        avgFps,
        extremeKeypoint,
        keypointId,
        direction,
      });

    // UPDATE ALL NECESARY TIMES HERE!
    // durationMs, idleTimeMs, timeToExtremeMs, timeAtExtremeMs, timeFromExtremeToEndMs

    this.repPostProcessing.setRepTimes({
      currentRepRef,
      recordedReps,
      timeAtExtremumStartKeypoint,
      timeAtExtremumEndKeypoint,
    });

    this.repPostProcessing.setRepRom({ currentRepRef, initialValues });
  }

  static saveRepTimesToJsonFiles = (state: {
    recordedRepsRef: RefObject<RecordedReps>;
    selectedExercise: TrainingExercise | undefined;
  }) => {
    const { recordedRepsRef, selectedExercise } = state;

    const sides = [
      recordedRepsRef.current.left,
      recordedRepsRef.current.right,
    ].filter((r) => r !== undefined);

    for (const side of sides) {
      const sideLabel =
        side === recordedRepsRef.current.left ? 'left' : 'right';

      const repsData = side.map((rep) => ({
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
        `${selectedExercise?.id || 'exercise'}_${sideLabel}reps_times.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };
}
