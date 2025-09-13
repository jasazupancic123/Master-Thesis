import { KeypointId } from '../enum/keypoint-id';
import { PoseModel } from '../enum/pose-model.enum';
import { Landmark, ObjectDetector } from '@mediapipe/tasks-vision';
import { Keypoint } from '../type/keypoint';

export class KeypointUtil {
  static getDesiredKeypointsByModel(
    // add different types to currentFrameKeypoints for different models
    currentFrameKeypoints: Landmark[] | undefined,
    model: PoseModel,
    capturedAt: Date,
    frameNum: number
  ): Keypoint[] {
    if (!currentFrameKeypoints) return [];

    let keypoints: Keypoint[] = [];
    switch (model) {
      case PoseModel.MEDIAPIPE: {
        const keypointIds = Object.values(KeypointId);
        currentFrameKeypoints.forEach((kp, i) => {
          keypoints.push({
            id: keypointIds[i] as unknown as KeypointId,
            x: kp.x,
            y: kp.y,
            z: kp.z,
            velocity: 0,
            isValid: true,
            frameNum,
            capturedAt,
            visibility: kp.visibility,
          });
        });
        break;
      }
      default: {
        return [];
      }
    }

    return keypoints;
  }
}
