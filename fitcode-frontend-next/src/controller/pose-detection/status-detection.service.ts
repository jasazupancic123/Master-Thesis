import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { FACE_CAMERA_MESSAGE } from './const/status-messages';
import { ConditionDirection } from './enum/condition-detection.enum';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import { PoseDetectionService } from './pose-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { PoseValidationCondition } from './type/pose-validation-condition.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import type { SetState } from '@/common/type/state.type';

export class StatusDetectionService {
  // if it returns false, it means we need to return in main loop
  static checkAndValidateStatus(
    detectionStatus: DetectionStatus,
    repStateRef: RefObject<RepState>,
    state: {
      keypoints: Keypoint[];
      statusRef: RefObject<DetectionStatus>;
      setStatusMessage: SetState<string>;
      buffer: KeypointHistory;
      exerciseStartConditions: ExerciseRepStartCondition[];
      avgFps: { value: number; count: number } | null;
    }
  ): boolean {
    const {
      keypoints,
      statusRef,
      setStatusMessage,
      buffer,
      exerciseStartConditions,
      avgFps,
    } = state;

    switch (detectionStatus) {
      case DetectionStatus.NOT_FULLY_IN_FRAME: {
        const isFullyInFrame = this.checkIsFullyInFrame(keypoints);

        return this.updateStatus(
          statusRef,
          isFullyInFrame,
          DetectionStatus.NOT_FULLY_IN_FRAME,
          DetectionStatus.NOT_FACING_CAMERA
        );
      }
      case DetectionStatus.NOT_FACING_CAMERA: {
        const isFacingCamera = this.checkIsFacingCamera(
          keypoints,
          setStatusMessage
        );

        return this.updateStatus(
          statusRef,
          isFacingCamera,
          DetectionStatus.NOT_FACING_CAMERA,
          DetectionStatus.NOT_STILL
        );
      }
      case DetectionStatus.NOT_STILL: {
        const isStill = this.checkIsStill(
          statusRef.current,
          keypoints,
          buffer,
          avgFps
        );

        return this.updateStatus(
          statusRef,
          isStill,
          DetectionStatus.NOT_STILL,
          DetectionStatus.READY
        );
      }
      case DetectionStatus.READY: {
        if (!avgFps || !avgFps.value || avgFps.count < 10) return false;

        const startedRecording = this.checkExerciseRepStartConditions(
          keypoints,
          buffer,
          exerciseStartConditions,
          avgFps
        );

        if (repStateRef.current.status === RepStatus.NONE && startedRecording)
          repStateRef.current = {
            status: RepStatus.IDLE,
            avgStartValue: null,
            avgExtremeValue: null,
          };

        return this.updateStatus(
          statusRef,
          startedRecording,
          DetectionStatus.READY,
          DetectionStatus.RECORDING
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
    nextStatus: DetectionStatus
  ): boolean {
    if (!condition && statusRef.current === currentStatus) {
      return false;
    } else if (!condition) {
      statusRef.current = currentStatus;
      return false;
    } else if (condition && statusRef.current === currentStatus) {
      statusRef.current = nextStatus;
      return false;
    }

    return true;
  }

  private static checkIsFullyInFrame(keypoints: Keypoint[]): boolean {
    const count = keypoints.filter(
      (kp) =>
        kp.visibility > POSE_DETECTION_CONSTRAINTS.IN_FRAME_VISIBLITY_THRESHOLD
    ).length;

    return count >= POSE_DETECTION_CONSTRAINTS.MIN_KEYPOINTS_IN_FRAME;
  }

  private static checkIsFacingCamera(
    keypoints: Keypoint[],
    setStatusMessage: SetState<string>
  ): boolean {
    const facingCameraKeypointIds = [
      KeypointId.LEFT_EYE,
      KeypointId.RIGHT_EYE,
      KeypointId.LEFT_SHOULDER,
      KeypointId.RIGHT_SHOULDER,
      KeypointId.LEFT_WRIST,
      KeypointId.RIGHT_WRIST,
      // KeypointId.LEFT_HIP,
      // KeypointId.RIGHT_HIP,
      KeypointId.LEFT_KNEE,
      KeypointId.RIGHT_KNEE,
      KeypointId.LEFT_ANKLE,
      KeypointId.RIGHT_ANKLE,
    ];

    const conditions: PoseValidationCondition[] = [
      {
        keypointId1: KeypointId.LEFT_SHOULDER,
        keypointId2: KeypointId.RIGHT_SHOULDER,
        relation: KeypointValueType.POSITION_Z,
        threshold: 0.1,
        errorMessage: FACE_CAMERA_MESSAGE,
      },
      {
        keypointId1: KeypointId.LEFT_HIP,
        keypointId2: KeypointId.RIGHT_HIP,
        relation: KeypointValueType.POSITION_Z,
        threshold: 0.25,
        errorMessage: FACE_CAMERA_MESSAGE,
      },
    ];

    const facingCameraKeypoints = facingCameraKeypointIds.map((id) =>
      KeypointUtil.getDesiredKeypointFromArray(keypoints, id)
    );

    const error = PoseDetectionService.validateKeypointConditions(
      conditions,
      keypoints
    );

    if (error) {
      setStatusMessage(error);
      return false;
    }

    return facingCameraKeypoints.every(
      (kp) =>
        kp &&
        kp.visibility >
          POSE_DETECTION_CONSTRAINTS.FACING_CAMERA_VISIBLITY_THRESHOLD
    );
  }

  private static checkIsStill(
    currentStatus: DetectionStatus,
    keypoints: Keypoint[],
    buffer: KeypointHistory,
    avgFps: { value: number; count: number } | null
  ): boolean {
    if (!avgFps) return false;

    const timeElapsed = avgFps.count / avgFps.value; // in seconds
    if (timeElapsed < 4) return false;

    const stillnessKeypointIds = [
      KeypointId.LEFT_SHOULDER,
      KeypointId.RIGHT_SHOULDER,
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

    return stillnessKeypoints.every((kp) => {
      if (!kp) return false;

      const history = buffer.getHistoryById(kp.id);
      if (history.some((h) => !h)) return false;

      const stdDev = StatusDetectionService.calculateStandardDeviation(history);
      return currentStatus === DetectionStatus.READY
        ? stdDev < POSE_DETECTION_CONSTRAINTS.STILLNESS_THRESHOLD_WHILE_READY_M
        : stdDev < POSE_DETECTION_CONSTRAINTS.STILLNESS_THRESHOLD_M;
    });
  }

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

      const currentValue = KeypointUtil.getKeypointValueByType(
        currentFrameKeypoint,
        condition.type
      );

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
