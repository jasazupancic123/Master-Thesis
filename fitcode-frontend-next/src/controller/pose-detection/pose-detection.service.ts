import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { DetectionStatus } from './enum/detection-status';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseRepStartCondition } from './type/exercise-start-condition.type';
import type { Keypoint } from './type/keypoint.type';
import type { PoseValidationCondition } from './type/pose-validation-condition.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';
import type { SetState } from '@/common/type/state.type';

export class PoseDetectionService {
  static checkStatus(
    statusRef: RefObject<DetectionStatus>,
    repStateRef: RefObject<RepState>,
    keypoints: Keypoint[],
    setStatusMessage: SetState<string>,
    buffer: KeypointHistory,
    exerciseStartConditions: ExerciseRepStartCondition[],
    avgFps: { value: number; count: number } | null
  ) {
    if (statusRef.current !== DetectionStatus.RECORDING) {
      // We are not in recording mode, so we need to make init checks

      const initStatuses = [
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
            setStatusMessage,
            buffer,
            exerciseStartConditions,
            avgFps,
          }
        );
        if (!validStatus) return;
      }
    } else {
      // We are in recording mode, we cannot go back to previous states
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
}
