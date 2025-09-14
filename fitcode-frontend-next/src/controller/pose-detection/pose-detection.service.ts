import { DetectionStatus } from './enum/detection-status';
import { Keypoint } from './type/keypoint';
import { RefObject } from 'react';
import { DetectionStatusService } from './detection-status.service';
import { PoseValidationCondition } from './type/pose-validation-condition';
import { KeypointUtil } from './util/keypoint.util';
import { SetState } from '@/common/type/state.type';
import { KeypointHistory } from './class/keypoint-history';
import { ExerciseStartCondition } from './type/exercise-start-condition';

export class PoseDetectionService {
  static checkStatus(
    statusRef: RefObject<DetectionStatus>,
    keypoints: Keypoint[],
    setStatusMessage: SetState<string>,
    buffer: KeypointHistory,
    exerciseStartConditions: ExerciseStartCondition[],
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
        const validStatus = DetectionStatusService.checkStatusAndValidateStatus(
          status,
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

      const { value1, value2 } = KeypointUtil.getKeypointValueByType(
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
