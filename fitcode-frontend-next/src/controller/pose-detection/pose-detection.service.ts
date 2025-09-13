import { DetectionStatus } from './enum/detection-status';
import { Keypoint } from './type/keypoint';
import { POSE_DETECTION_CONSTRAINTS } from './const/pose-detection-constrains.const';
import { RefObject } from 'react';

export class PoseDetectionService {
  static checkStatus(
    statusRef: RefObject<DetectionStatus>,
    keypoints: Keypoint[]
  ) {
    // NOT_FULLY_IN_FRAME check by checking visibility
    const isFullyInFrame = keypoints.every(
      (kp) => kp.visibility > POSE_DETECTION_CONSTRAINTS.VISIBLITY_THRESHOLD
    );

    if (
      !isFullyInFrame &&
      statusRef.current === DetectionStatus.NOT_FULLY_IN_FRAME
    ) {
      return;
    } else if (!isFullyInFrame) {
      statusRef.current = DetectionStatus.NOT_FULLY_IN_FRAME;
      return;
    } else if (
      isFullyInFrame &&
      statusRef.current === DetectionStatus.NOT_FULLY_IN_FRAME
    ) {
      statusRef.current = DetectionStatus.NOT_STILL;
      return;
    }
  }
}
