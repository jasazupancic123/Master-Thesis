import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';
import {
  ConditionDirection,
  ExerciseRepStartConditionWithExerciseId,
} from '../type/exercise-start-condition.type';

// Smaller the duration, more accurate will the rep cuting be
export const EXERCISE_POSES: ExerciseRepStartConditionWithExerciseId[] = [
  {
    exerciseId: 'arm-curl',
    keypointId: KeypointId.RIGHT_WRIST,
    type: KeypointValueType.POSITION_Y,
    direction: ConditionDirection.ANY,
    duration: 750, // ms
    distance: 0.1, // meters
  },
];
