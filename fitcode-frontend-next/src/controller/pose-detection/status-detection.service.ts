import dayjs from 'dayjs';
import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { ConditionDirection } from './enum/condition-detection.enum';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { RepStatus } from './enum/rep-state';
import { PoseDetectionService } from './pose-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import { getStatusMessage } from '@/components/mobile-movement-validation/state';

export class StatusDetectionService {
  // if it returns false, it means we need to return in main loop
  static checkAndValidateStatus(
    detectionStatus: DetectionStatus,
    repStateRef: RefObject<RepState>,
    state: {
      keypoints: Keypoint[];
      statusRef: RefObject<DetectionStatus>;
      canProceedIntoReadyStateRef: RefObject<boolean>;
      keypointBuffer: KeypointHistory;
      avgFps: { value: number; count: number } | null;
      recordingTimestampRef: RefObject<Date | null>;
      statusMessage: RefObject<string>;
      stillnessCountdownRef: RefObject<Date | null>;
      videoHeight: number;
    }
  ): boolean {
    const {
      keypoints,
      statusRef,
      canProceedIntoReadyStateRef,
      keypointBuffer,
      avgFps,
      recordingTimestampRef,
      statusMessage,
      stillnessCountdownRef,
      videoHeight,
    } = state;

    switch (detectionStatus) {
      case DetectionStatus.NOT_FULLY_IN_FRAME: {
        const isFullyInFrame = this.checkIsFullyInFrame(keypoints);

        const canProceedIntoNotFacingCamera = isFullyInFrame;

        if (!canProceedIntoNotFacingCamera) {
          canProceedIntoReadyStateRef.current = false;
          stillnessCountdownRef.current = null;
        }

        return this.updateStatus(
          statusRef,
          isFullyInFrame,
          DetectionStatus.NOT_FULLY_IN_FRAME,
          DetectionStatus.NOT_FACING_CAMERA,
          statusMessage
        );
      }
      case DetectionStatus.NOT_FACING_CAMERA: {
        const isFacingCamera = this.checkIsFacingCamera(keypoints);

        const canUpdateToNotStill = isFacingCamera;

        if (
          canProceedIntoReadyStateRef.current === false &&
          canUpdateToNotStill
        ) {
          keypointBuffer.clear();
          canProceedIntoReadyStateRef.current = true;
        } else if (!canUpdateToNotStill) {
          canProceedIntoReadyStateRef.current = false;
          stillnessCountdownRef.current = null;
        }

        return this.updateStatus(
          statusRef,
          canUpdateToNotStill,
          DetectionStatus.NOT_FACING_CAMERA,
          DetectionStatus.NOT_STILL,
          statusMessage
        );
      }
      case DetectionStatus.NOT_STILL: {
        const bufferCutOf = KeypointUtil.getFramesCountFromSeconds(
          1,
          avgFps?.value || 30
        );

        const isStill = this.checkIsStill({
          currentStatus: statusRef.current,
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          stillnessCountdownRef,
          bufferCutOf,
          videoHeight,
        });

        return this.updateStatus(
          statusRef,
          isStill,
          DetectionStatus.NOT_STILL,
          DetectionStatus.READY,
          statusMessage
        );
      }
      case DetectionStatus.READY: {
        if (!avgFps || !avgFps.value || avgFps.count < 10) return false;

        // const hasNodded = PoseDetectionService.checkHasNodded({
        //   keypointBuffer,
        //   avgFps,
        // });

        // if (hasNodded)
        //   keypointBuffer.cutAtIndex(keypointBuffer.history.length - 1);

        const isStill = this.checkIsStill({
          currentStatus: statusRef.current,
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          videoHeight,
        });

        // const canStartRecording = hasNodded && isStill;
        const canStartRecording = isStill;

        if (canStartRecording) {
          recordingTimestampRef.current = new Date();

          if (repStateRef.current.status === RepStatus.NONE)
            repStateRef.current = {
              status: RepStatus.IDLE,
              avgStartValue: null,
              avgExtremeValue: null,
            };
        }

        return this.updateStatus(
          statusRef,
          canStartRecording,
          DetectionStatus.READY,
          DetectionStatus.RECORDING,
          statusMessage
        );
      }
      case DetectionStatus.RECORDING: {
        if (
          dayjs(new Date()).diff(
            dayjs(recordingTimestampRef.current),
            'second'
          ) < POSE_DETECTION_CONSTRAINTS.MIN_STILL_TIME_TO_STOP_DETECTION_S
        )
          return false;

        // look for 1 second of stillness
        const bufferCutOf = KeypointUtil.getFramesCountFromSeconds(
          POSE_DETECTION_CONSTRAINTS.STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S,
          avgFps?.value || 30
        );

        const isStill = this.checkIsStill({
          currentStatus: statusRef.current,
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          bufferCutOf,
          videoHeight,
        });

        // const hasNodded = PoseDetectionService.checkHasNodded({
        //   keypointBuffer,
        //   avgFps,
        // });

        const hasShakedHead = PoseDetectionService.checkHasShakedHead({
          keypointBuffer,
          avgFps,
        });

        return this.updateStatus(
          statusRef,
          isStill && hasShakedHead,
          DetectionStatus.RECORDING,
          DetectionStatus.STOPPED,
          statusMessage
        );
      }
      default: {
        return false;
      }
    }
  }

  // if it returns false, it means we also need to return in main loop
  private static updateStatus(
    statusRef: RefObject<DetectionStatus>,
    condition: boolean,
    currentStatus: DetectionStatus,
    nextStatus: DetectionStatus,
    statusMessage: RefObject<string>
  ): boolean {
    if (!condition && statusRef.current === currentStatus) {
      return false;
    } else if (!condition) {
      statusRef.current = currentStatus;
      statusMessage.current = getStatusMessage(currentStatus);
      return false;
    } else if (condition && statusRef.current === currentStatus) {
      statusRef.current = nextStatus;
      statusMessage.current = getStatusMessage(nextStatus);

      return false;
    }

    return true;
  }

  private static checkIsFullyInFrame(keypoints: Keypoint[]): boolean {
    const requiredKeypointCombinations = [
      [KeypointId.LEFT_SHOULDER, KeypointId.LEFT_EYE, KeypointId.LEFT_ANKLE],
      [KeypointId.RIGHT_SHOULDER, KeypointId.RIGHT_EYE, KeypointId.RIGHT_ANKLE],
    ]; // at least one of these needs to be true

    return requiredKeypointCombinations.some((combination) => {
      return combination.every((id) => {
        const kp = KeypointUtil.getDesiredKeypointFromArray(keypoints, id);
        return (
          kp &&
          kp.visibility >
            POSE_DETECTION_CONSTRAINTS.IN_FRAME_VISIBLITY_THRESHOLD
        );
      });
    });
  }

  private static checkIsFacingCamera(keypoints: Keypoint[]): boolean {
    const facingCameraKeypointIds = [
      KeypointId.LEFT_EYE,
      KeypointId.RIGHT_EYE,
      KeypointId.LEFT_SHOULDER,
      KeypointId.RIGHT_SHOULDER,
      KeypointId.LEFT_HIP,
      KeypointId.RIGHT_HIP,
      KeypointId.LEFT_KNEE,
      KeypointId.RIGHT_KNEE,
      KeypointId.LEFT_ANKLE,
      KeypointId.RIGHT_ANKLE,
    ];

    const facingCameraKeypoints = facingCameraKeypointIds.map((id) =>
      KeypointUtil.getDesiredKeypointFromArray(keypoints, id)
    );

    return facingCameraKeypoints.every(
      (kp) =>
        kp &&
        kp.visibility >
          POSE_DETECTION_CONSTRAINTS.FACING_CAMERA_VISIBLITY_THRESHOLD
    );
  }

  private static checkIsStill(state: {
    currentStatus: DetectionStatus;
    keypoints: Keypoint[];
    buffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
    videoHeight: number;
    bufferCutOf?: number;
    stillnessCountdownRef?: RefObject<Date | null>;
  }): boolean {
    const {
      currentStatus,
      keypoints,
      buffer,
      avgFps,
      videoHeight,
      bufferCutOf: bufferCutOff,
      stillnessCountdownRef,
    } = state;

    if (!avgFps) return false;

    const framesNeededInBuffer = Math.min(
      buffer.bufferLength || Infinity,
      POSE_DETECTION_CONSTRAINTS.MIN_TIME_PASSED_TO_DETECT_STILLNESS_S *
        avgFps.value // at least this much second of data
    );

    const stillnessKeypointIds = [
      KeypointId.LEFT_SHOULDER,
      KeypointId.RIGHT_SHOULDER,
      KeypointId.LEFT_WRIST,
      KeypointId.RIGHT_WRIST,
      KeypointId.LEFT_HIP,
      KeypointId.RIGHT_HIP,
      KeypointId.LEFT_KNEE,
      KeypointId.RIGHT_KNEE,
      KeypointId.LEFT_ANKLE,
      KeypointId.RIGHT_ANKLE,
    ];

    const stillnessKeypoints = stillnessKeypointIds.map((id) =>
      KeypointUtil.getDesiredKeypointFromArray(keypoints, id)
    );

    if (buffer.history.length < framesNeededInBuffer) return false;

    if (bufferCutOff !== undefined && buffer.history.length < bufferCutOff)
      return false;

    const isStillXY = stillnessKeypoints.every((kp) => {
      if (!kp) return false;

      const history = buffer.getHistoryById(kp.id, bufferCutOff);
      if (history.some((h) => !h)) return false;

      const stdDev = StatusDetectionService.calculateStandardDeviation(history);

      const isKeypointStill =
        stdDev < POSE_DETECTION_CONSTRAINTS.STILLNESS_THRESHOLD_M;

      return isKeypointStill;
    });

    const isStillZ = this.isZAxisStill({
      buffer: buffer,
      videoHeight,
      bufferCutOff,
      tresholdPercentage:
        POSE_DETECTION_CONSTRAINTS.STILLNESS_Z_AXIS_PERCENTAGE_THRESHOLD,
    });

    const isStill = isStillXY && isStillZ;

    if (!isStill && stillnessCountdownRef) stillnessCountdownRef.current = null;
    else if (isStill && stillnessCountdownRef && !stillnessCountdownRef.current)
      stillnessCountdownRef.current = new Date();

    if (stillnessCountdownRef) {
      const now = new Date();
      const diff = dayjs(now).diff(
        dayjs(stillnessCountdownRef.current),
        'second'
      );

      const passedDiff =
        diff >= POSE_DETECTION_CONSTRAINTS.STILLNESS_COUNTDOWN_DURATION_S;

      return isStill && passedDiff;
    }

    return isStill;
  }

  private static isZAxisStill = (state: {
    buffer: KeypointHistory;
    videoHeight: number;
    tresholdPercentage: number;
    bufferCutOff?: number;
  }) => {
    const { buffer, videoHeight, tresholdPercentage, bufferCutOff } = state;

    let biggestValueBetweenNoseAndFoots: number | undefined,
      smallestValueBetweenNoseAndFoots: number | undefined;

    buffer.history.slice(bufferCutOff ? bufferCutOff : 0).forEach((frame) => {
      const nose = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.NOSE
      );
      const leftFoot = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_FOOT_INDEX
      );
      const rightFoot = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_FOOT_INDEX
      );

      if (!nose || !leftFoot || !rightFoot) return;

      if (
        !nose.pixelPosition ||
        !leftFoot.pixelPosition ||
        !rightFoot.pixelPosition
      )
        return;

      const noseY = nose.pixelPosition.y * videoHeight;
      const meanFootY =
        ((leftFoot.pixelPosition.y + rightFoot.pixelPosition.y) / 2) *
        videoHeight;

      if (!biggestValueBetweenNoseAndFoots)
        biggestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);
      if (!smallestValueBetweenNoseAndFoots)
        smallestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);

      if (Math.abs(noseY - meanFootY) > biggestValueBetweenNoseAndFoots)
        biggestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);

      if (Math.abs(noseY - meanFootY) < smallestValueBetweenNoseAndFoots)
        smallestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);
    });

    return (
      biggestValueBetweenNoseAndFoots !== undefined &&
      smallestValueBetweenNoseAndFoots !== undefined &&
      ((Math.abs(biggestValueBetweenNoseAndFoots) +
        Math.abs(smallestValueBetweenNoseAndFoots)) /
        2) *
        tresholdPercentage >=
        Math.abs(
          biggestValueBetweenNoseAndFoots - smallestValueBetweenNoseAndFoots
        )
    );
  };

  private static calculateStandardDeviation = (keypoints: Keypoint[]) => {
    if (keypoints.length === 0) return 0;
    const meanX =
      keypoints.reduce((acc, pos) => acc + pos.position.x, 0) /
      keypoints.length;
    const meanY =
      keypoints.reduce((acc, pos) => acc + pos.position.y, 0) /
      keypoints.length;
    const variances = keypoints.map(
      (pos) =>
        ((pos.position.x - meanX) ** 2 + (pos.position.y - meanY) ** 2) / 2
    );
    const variance =
      variances.reduce((acc, varian) => acc + varian, 0) / keypoints.length;
    return Math.sqrt(variance);
  };

  static checkExerciseRepStartConditions(
    keypoints: Keypoint[],
    buffer: KeypointHistory,
    exerciseStartConditions: ExerciseRepStartCondition[],
    avgFps: { value: number; count: number } | null
  ): boolean {
    // 5 fps/s, 0.5s -> 3 frames
    for (const condition of exerciseStartConditions) {
      const fps = avgFps?.value || 30; // default to 30 fps
      const numFrames = Math.ceil((fps * condition.duration) / 1000); // convert ms to seconds

      const historyFrame = buffer.history.slice(-numFrames)[0];
      if (!historyFrame) return false;

      const historyKeypoint = historyFrame.find(
        (k) => k.id === condition.keypointId
      );
      if (!historyKeypoint) return false;

      const currentFrameKeypoint = keypoints.find(
        (k) => k.id === condition.keypointId
      );
      if (!currentFrameKeypoint) return false;

      // const currentValue = KeypointUtil.getKeypointValueByType(
      //   currentFrameKeypoint,
      //   condition.type
      // );

      // console.log(condition.keypointId, 'currentValue', currentValue);

      const isValid = this.validateKeypointCondition(
        historyKeypoint,
        currentFrameKeypoint,
        condition
      );

      if (!isValid) return false;
    }

    return true;
  }

  private static validateKeypointCondition(
    currentKeypoint: Keypoint,
    nextKeypoint: Keypoint,
    condition: ExerciseRepStartCondition
  ): boolean {
    const { value1: currentValue, value2: nextValue } =
      KeypointUtil.getKeypointsValuesByType(
        currentKeypoint,
        nextKeypoint,
        condition.type
      );

    if (currentValue === undefined || nextValue === undefined) return false;

    const distance = Math.abs(nextValue - currentValue);
    const isDistanceOk = distance >= condition.distance;

    switch (condition.direction) {
      case ConditionDirection.POSITIVE: {
        return nextValue > currentValue && isDistanceOk;
      }
      case ConditionDirection.NEGATIVE:
        return nextValue < currentValue && isDistanceOk;
      default:
        return false;
    }
  }
}
