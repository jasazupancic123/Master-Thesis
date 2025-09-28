import { ConditionDirection } from '../enum/condition-detection.enum';
import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';
import type { ExerciseDetectionDataWithExerciseIds } from '../type/exercise-start-condition.type';

// Smaller the duration, more accurate will the rep cuting be
export const EXERCISE_POSES: ExerciseDetectionDataWithExerciseIds[] = [
  {
    exerciseIds: [
      'acceleration-squat-fw',
      'bulgarian-split-squat',
      'deep-back-squat',
      'half-back-squat-bb',
      'half-squat-fw',
      'half-squat-ks',
      'half-squat-tb',
      'sa-squat-jump-db',
      'sissy-squat-belt',
      'sl-acceleration-squat-fw',
      'sl-squat-ks',
      'spooky-squat-di',
      'squat-rows-fw',
      'staggered-half-back-squat',
      'toe-squat',
      'goblet-squat',
      'split-squat',
      'carioca-lunge',
    ],
    data: {
      romKeypointId: KeypointId.LEFT_SHOULDER,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      conditions: [
        {
          keypointId: KeypointId.LEFT_SHOULDER,
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
  {
    exerciseIds: ['sl-rdl-bw', 'sl-rdl-db'],
    data: {
      romKeypointId: KeypointId.LEFT_SHOULDER,
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      conditions: [
        {
          keypointId: KeypointId.LEFT_SHOULDER,
          type: KeypointValueType.POSITION_Y,
          direction: ConditionDirection.NEGATIVE,
          duration: 750, // ms
          distance: 0.04, // meters
        },
      ],
    },
  },
];
