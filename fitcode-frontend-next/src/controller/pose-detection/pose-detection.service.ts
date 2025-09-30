import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { PoseValidationCondition } from './type/pose-validation-condition.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';

export class PoseDetectionService {
  static checkStatus(state: {
    statusRef: RefObject<DetectionStatus>;
    canProceedIntoReadyStateRef: RefObject<boolean>;
    repStateRef: RefObject<RepState>;
    keypoints: Keypoint[];
    keypointBuffer: KeypointHistory;
    keypointHistory: KeypointHistory;
    exerciseStartConditions: ExerciseRepStartCondition[];
    avgFps: { value: number; count: number } | null;
    recordingTimestampRef: RefObject<Date | null>;
    statusMessage: RefObject<string>;
  }) {
    const {
      statusRef,
      canProceedIntoReadyStateRef,
      repStateRef,
      keypoints,
      keypointBuffer,
      keypointHistory,
      exerciseStartConditions,
      avgFps,
      recordingTimestampRef,
      statusMessage,
    } = state;

    const initStatuses =
      statusRef.current === DetectionStatus.RECORDING
        ? [DetectionStatus.RECORDING]
        : [
            DetectionStatus.NOT_FULLY_IN_FRAME,
            DetectionStatus.NOT_FACING_CAMERA,
            DetectionStatus.NOT_STILL,
            DetectionStatus.READY,
          ];

    for (const status of initStatuses) {
      const validStatus = StatusDetectionService.checkAndValidateStatus(
        status,
        repStateRef,
        {
          keypoints,
          statusRef,
          canProceedIntoReadyStateRef,
          keypointBuffer: keypointBuffer,
          avgFps,
          recordingTimestampRef,
          statusMessage,
        }
      );

      if (!validStatus) return;
    }
  }

  static validateKeypointConditions(
    conditions: PoseValidationCondition[],
    keypoints: Keypoint[]
  ): string | undefined {
    for (const condition of conditions) {
      const keypoint1 = keypoints.find((kp) => kp.id === condition.keypointId1);
      const keypoint2 = keypoints.find((kp) => kp.id === condition.keypointId2);

      if (!keypoint1 || !keypoint2) return condition.errorMessage;

      const { value1, value2 } = KeypointUtil.getKeypointsValuesByType(
        keypoint1,
        keypoint2,
        condition.relation
      );

      if (value1 === undefined || value2 === undefined)
        return condition.errorMessage;

      if (Math.abs(value1 - value2) > condition.threshold)
        return condition.errorMessage;
    }
  }

  static checkHasShakedHead(state: {
    keypointBuffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
  }): boolean {
    const { keypointBuffer, avgFps } = state;

    const numFrames = KeypointUtil.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTRAINTS.HEAD_SHAKE_DETECTION_BUFFER_DURATION_S,
      avgFps?.value || 30
    );

    const frames = keypointBuffer.history.slice(-numFrames);

    const startMouthLeftKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      frames[0],
      KeypointId.MOUTH_LEFT
    );

    const startMouthRightKeypoint = KeypointUtil.getDesiredKeypointFromArray(
      frames[0],
      KeypointId.MOUTH_RIGHT
    );

    if (!startMouthLeftKeypoint || !startMouthRightKeypoint) return false;

    const startMouthLeftKeypointX = KeypointUtil.getKeypointValueByType(
      startMouthLeftKeypoint,
      KeypointValueType.POSITION_X
    );

    const startMouthRightKeypointX = KeypointUtil.getKeypointValueByType(
      startMouthRightKeypoint,
      KeypointValueType.POSITION_X
    );

    if (
      startMouthLeftKeypointX === undefined ||
      startMouthRightKeypointX === undefined
    )
      return false;

    let hasMovedLeft = false,
      hasMovedRight = false;

    for (const frame of frames) {
      const leftEye = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_EYE
      );

      const rightEye = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_EYE
      );

      if (leftEye && !hasMovedLeft) {
        const leftEyeX = KeypointUtil.getKeypointValueByType(
          leftEye,
          KeypointValueType.POSITION_X
        );

        if (leftEyeX !== undefined && leftEyeX < startMouthRightKeypointX)
          hasMovedLeft = true;
      }

      if (rightEye && !hasMovedRight) {
        const rightEyeX = KeypointUtil.getKeypointValueByType(
          rightEye,
          KeypointValueType.POSITION_X
        );

        if (rightEyeX !== undefined && rightEyeX > startMouthLeftKeypointX)
          hasMovedRight = true;
      }
    }

    return hasMovedLeft && hasMovedRight;
  }

  static checkHasNodded(state: {
    keypointBuffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
  }): boolean {
    const { keypointBuffer, avgFps } = state;

    const numFrames = KeypointUtil.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTRAINTS.NOD_DETECTION_BUFFER_DURATION_S,
      avgFps?.value || 30
    );

    const frames = keypointBuffer.history.slice(-numFrames);

    // conditions for nod
    let earsBelowEyesStart = false;
    let earsAboveEyes = false;
    let earsBelowEyesEnd = false;
    let shouldersAlwaysAboveHips = true;

    for (const frame of frames) {
      const leftEyeKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_EYE_OUTER
      );

      const rightEyeKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_EYE_OUTER
      );

      const leftEarKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_EAR
      );

      const rightEarKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_EAR
      );

      const leftHipKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_HIP
      );

      const rightHipKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_HIP
      );

      const leftShoulderKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_SHOULDER
      );

      const rightShoulderKeypoint = KeypointUtil.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_SHOULDER
      );

      if (
        !leftEyeKeypoint ||
        !rightEyeKeypoint ||
        !leftEarKeypoint ||
        !rightEarKeypoint ||
        !leftHipKeypoint ||
        !rightHipKeypoint ||
        !leftShoulderKeypoint ||
        !rightShoulderKeypoint
      )
        continue;

      const leftEyeY = KeypointUtil.getKeypointValueByType(
        leftEyeKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightEyeY = KeypointUtil.getKeypointValueByType(
        rightEyeKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftEarY = KeypointUtil.getKeypointValueByType(
        leftEarKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightEarY = KeypointUtil.getKeypointValueByType(
        rightEarKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftHipY = KeypointUtil.getKeypointValueByType(
        leftHipKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightHipY = KeypointUtil.getKeypointValueByType(
        rightHipKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftShoulderY = KeypointUtil.getKeypointValueByType(
        leftShoulderKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightShoulderY = KeypointUtil.getKeypointValueByType(
        rightShoulderKeypoint,
        KeypointValueType.POSITION_Y
      );

      if (
        leftEyeY === undefined ||
        rightEyeY === undefined ||
        leftEarY === undefined ||
        rightEarY === undefined ||
        leftHipY === undefined ||
        rightHipY === undefined ||
        leftShoulderY === undefined ||
        rightShoulderY === undefined
      )
        continue;

      const avgEyeY = (leftEyeY + rightEyeY) / 2;
      const avgEarY = (leftEarY + rightEarY) / 2;

      if (!earsBelowEyesStart) {
        if (avgEarY > avgEyeY) earsBelowEyesStart = true;
        continue;
      }

      if (!earsAboveEyes) {
        if (avgEarY < avgEyeY + POSE_DETECTION_CONSTRAINTS.Y_POS_HELPER_M) {
          // console.log('EARS ABOVE EYES');
          earsAboveEyes = true;
        }
        continue;
      }

      if (!earsBelowEyesEnd) {
        if (avgEarY > avgEyeY) {
          earsBelowEyesEnd = true;
          break;
        }
      }

      const avgHipY = (leftHipY + rightHipY) / 2;
      const avgShoulderY = (leftShoulderY + rightShoulderY) / 2;

      if (avgShoulderY - 0.2 <= avgHipY) shouldersAlwaysAboveHips = false;
    }

    return (
      earsBelowEyesStart &&
      earsAboveEyes &&
      earsBelowEyesEnd &&
      shouldersAlwaysAboveHips
    );
  }
}
