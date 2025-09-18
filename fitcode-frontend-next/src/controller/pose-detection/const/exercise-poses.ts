import { ConditionDirection } from '../enum/condition-detection.enum';
import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';
import type { ExerciseDetectionDataWithExerciseIds } from '../type/exercise-start-condition.type';

// Smaller the duration, more accurate will the rep cuting be
export const EXERCISE_POSES: ExerciseDetectionDataWithExerciseIds[] = [
  {
    exerciseIds: [
      'deep-back-squat',
      'half-back-squat-bb',
      'half-squat-fw',
      'half-squat-ks',
      'half-squat-tb',
      'squat-rows-fw',
      'staggered-half-back-squat',
      'toe-squat',
    ],
    data: {
      romKeypointId: KeypointId.LEFT_HIP,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      conditions: [
        {
          keypointId: KeypointId.LEFT_HIP,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.NEGATIVE,
          duration: 750, // ms
          distance: 0.05, // meters}
        },
      ],
    },
  },
  {
    exerciseIds: ['arm-curl', 'arm-curl-db'],
    data: {
      romKeypointId: KeypointId.RIGHT_WRIST,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.POSITIVE,
      conditions: [
        {
          keypointId: KeypointId.RIGHT_WRIST,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.POSITIVE,
          duration: 750, // ms
          distance: 0.1, // meters
        },
      ],
    },
  },
  {
    exerciseIds: ['skull-crusher-db'],
    data: {
      romKeypointId: KeypointId.LEFT_WRIST,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      conditions: [
        {
          keypointId: KeypointId.LEFT_WRIST,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.NEGATIVE,
          duration: 750, // ms
          distance: 0.05, // meters
        },
      ],
    },
  },
  {
    exerciseIds: ['bench-press-bb'],
    data: {
      romKeypointId: KeypointId.LEFT_WRIST,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.POSITIVE,
      conditions: [
        {
          keypointId: KeypointId.LEFT_WRIST,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.POSITIVE,
          duration: 750, // ms
          distance: 0.15, // meters
        },
      ],
    },
  },
];
