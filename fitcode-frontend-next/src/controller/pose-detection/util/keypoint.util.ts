import { KeypointId } from '../enum/keypoint-id';
import { PoseModel } from '../enum/pose-model.enum';
import { Landmark, ObjectDetector } from '@mediapipe/tasks-vision';
import { Keypoint } from '../type/keypoint';
import { KeypointValueType } from '../enum/keypoint-value-type';

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

  static getDesiredKeypointFromArray(
    keypoints: Keypoint[],
    keypointId: KeypointId
  ): Keypoint | undefined {
    return keypoints.find((kp) => kp.id === keypointId);
  }

  static getKeypointValueByType(
    keypoint1: Keypoint,
    keypoint2: Keypoint,
    type: KeypointValueType
  ): { value1: number | undefined; value2: number | undefined } {
    switch (type) {
      case KeypointValueType.POSITION_X:
        return { value1: keypoint1.x, value2: keypoint2.x };
      case KeypointValueType.POSITION_Y:
        return { value1: keypoint1.y, value2: keypoint2.y };
      case KeypointValueType.POSITION_Z:
        return { value1: keypoint1.z, value2: keypoint2.z };
      case KeypointValueType.VELOCITY:
        return { value1: keypoint1.velocity, value2: keypoint2.velocity };
      default:
        return { value1: undefined, value2: undefined };
    }
  }
}
