import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { DetectionStatus } from './enum/detection-status';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { PoseValidationCondition } from './type/pose-validation-condition.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import { KeypointId } from './enum/keypoint-id';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { KeypointValueType } from './enum/keypoint-value-type';

export class PoseDetectionService {
  static checkStatus(state: {
    statusRef: RefObject<DetectionStatus>;
    repStateRef: RefObject<RepState>;
    keypoints: Keypoint[];
    keypointBuffer: KeypointHistory;
    keypointHistory: KeypointHistory;
    exerciseStartConditions: ExerciseRepStartCondition[];
    avgFps: { value: number; count: number } | null;
    recordingTimestampRef: RefObject<Date | null>;
  }) {
    const {
      statusRef,
      repStateRef,
      keypoints,
      keypointBuffer,
      keypointHistory,
      exerciseStartConditions,
      avgFps,
      recordingTimestampRef,
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
          keypointBuffer: keypointBuffer,
          exerciseStartConditions,
          avgFps,
          keypointHistory,
          recordingTimestampRef,
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

  static checkHasNodded(state: {
    keypointBuffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
  }): boolean {
    const { keypointBuffer, avgFps } = state;

    const numFrames = KeypointUtil.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTRAINTS.NOD_DETECTION_BUFFER_DURATION_MS / 1000,
      avgFps?.value || 30
    );

    const frames = keypointBuffer.history.slice(-numFrames);

    let earsBelowEyesStart = false;
    let earsAboveEyes = false;
    let earsBelowEyesEnd = false;

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

      if (
        !leftEyeKeypoint ||
        !rightEyeKeypoint ||
        !leftEarKeypoint ||
        !rightEarKeypoint
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

      if (
        leftEyeY === undefined ||
        rightEyeY === undefined ||
        leftEarY === undefined ||
        rightEarY === undefined
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
    }

    // if (earsBelowEyesEnd) console.log('NOD DETECTED');
    return earsBelowEyesStart && earsAboveEyes && earsBelowEyesEnd;
  }
}
