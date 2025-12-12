import { KeypointId } from '@/core/exercise-ai-prescriptions/enum/keypoint-id';
import type { Keypoint } from '@/core/exercise-ai-prescriptions/type/keypoint.type';
import type { Point2D } from '@/core/exercise-ai-prescriptions/type/point.type';
import type {
  Training,
  TrainingWithStatuses,
} from '@/core/training/type/training.type';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import * as tf from '@tensorflow/tfjs';

export class TypeCheckerUtil {
  isNumberArray(array: unknown): array is number[] {
    if (!Array.isArray(array)) return false;

    if (array.every((v) => typeof v === 'number')) return true;

    return false;
  }

  isKeypointArray(array: unknown): array is Keypoint[] {
    if (!Array.isArray(array)) return false;

    if (
      array.every((v) => {
        return (
          typeof v === 'object' &&
          v !== null &&
          v !== undefined &&
          'id' in v &&
          'position' in v &&
          'pixelPosition' in v
        );
      })
    )
      return true;

    return false;
  }

  isPoint2D(obj: unknown): obj is Point2D {
    if (
      typeof obj === 'object' &&
      obj !== null &&
      'x' in obj &&
      'y' in obj &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (obj as any).x === 'number' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (obj as any).y === 'number'
    )
      return true;

    return false;
  }

  isKeypointIdArray(array: unknown): array is KeypointId[] {
    if (!Array.isArray(array)) return false;

    if (array.every((v) => Object.values(KeypointId).includes(v as KeypointId)))
      return true;

    return false;
  }

  isFourNumberArray(array: unknown): array is [number, number, number, number] {
    if (!Array.isArray(array)) return false;

    if (array.length !== 4) return false;

    if (array.every((v) => typeof v === 'number')) return true;
    return false;
  }

  isTrainingWithStatuses(t: Training): t is TrainingWithStatuses {
    return (t as TrainingWithStatuses).statuses !== undefined;
  }

  isPoseLandmarker(obj: unknown): obj is PoseLandmarker {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'detectForVideo' in obj &&
      typeof (obj as any).detectForVideo === 'function'
    );
  }

  isTfGraphModel(obj: unknown): obj is tf.GraphModel {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'executeAsync' in obj &&
      typeof (obj as any).executeAsync === 'function'
    );
  }
}
