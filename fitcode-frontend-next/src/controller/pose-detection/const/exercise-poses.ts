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
      'acceleration-squat-fw[v12]',
      'back-squat-w-ohp-bb',
      'bulgarian-split-squat',
      'bulgarian-split-squat-db',
      'carioca-squat-bw',
      'cossack-squat-bw',
      'deep-back-squat-bb',
      'deep-squat-backward-walk',
      'deep-squat-forward-walk',
      'deep-squat-lateral-walk',
      'drop-squat',
      'drop-squat-from-box',
      'front-squat-bb',
      'front-squat-w-ohp-fw[v12]',
      'goblet-split-squat-kb',
      'goblet-squat-db',
      'half-back-squat-bb',
      'half-squat-fw[d11]',
      'half-squat-ib',
      'half-squat-ks',
      'half-squat-partner',
      'half-squat-taps-bw',
      'half-squat-vbt',
      'half-squat-wb',
      'hang-alternating-lateral-squat-landmine',
      'hang-split-squat-landmine',
      'hang-squat-landmine',
      'iso-half-squat-ks',
      'iso-quarter-squat-ks',
      'iso-sl-squat-ib',
      'iso-split-squat-hold',
      'iso-split-squat-pallof-press-ks',
      'iso-split-squat-w-rotation-fw[v12]',
      'iso-squat-90°-fd',
      'iso-squat-hold',
      'iso-squat-push-135°-fd',
      'iso-squat-w-calf-raises-landmine',
      'lateral-deceleration-squat-fw[v12]',
      'lateral-squat-bw',
      'mobility-squat',
      'oh-split-squat-mb',
      'oscillation-goblet-squat',
      'overhead-squat-bb',
      'partner-back-to-back-squat',
      'partner-back-to-back-squat-combat',
      'partner-mb-squat-throw',
      'plate-reaching-squat-di',
      'pop-to-squat',
      'prisoner-split-squat-bw',
      'prisoner-squat-bw',
      'quarter-back-squat-bb',
      'roll-squat',
      'rolling-squat-di',
      'sl-acceleration-squat-fw[v12]',
      'sl-pistol-squat-bw',
      'sl-skater-squat-[assisted]-bw',
      'sl-skater-squat-bw',
      'sl-skater-squat-sm',
      'sl-squat-ks',
      'sl-squat-to-box-bw',
      'sl-squat-to-box-w-plate-reach-di',
      'sl-zercher-squat-landmine',
      'spanish-squat-belt',
      'split-squat-bb',
      'split-squat-db',
      'split-squat-fw[d11]',
      'split-squat-jumps',
      'split-squat-jumps-[alternating]',
      'split-squat-knee-ext-reach',
      'split-squat-knee-ext-taps',
      'split-squat-knee-ext-taps-to-drop-step-accel',
      'split-squat-knee-ext-taps-to-side-step-accel',
      'spooky-squat-bw',
      'spooky-squat-di',
      'spooky-squat-on-incline-board',
      'squats',
      'staggered-quarter-squat-fw[d11]',
      'staggered-squat-and-press-landmine',
      'staggered-squat-landmine',
      'staggered-stance-quarter-squat-bb',
      'toe-back-squat-bb',
      'toe-squat-and-press-landmine',
      'toe-squat-bw',
      'toe-squat-landmine',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_HIP,
        conditions: [
          {
            keypointId: KeypointId.LEFT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1000, // ms
            distance: 0.04, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['biceps-curl-sa-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.POSITIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.1, // meters
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_WRIST,
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
  },
  {
    exerciseIds: ['arm-curl', 'arm-curl-db', 'biceps-curl-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.POSITIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.1, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['skull-crusher-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
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
  },
  {
    exerciseIds: ['bench-press-bb'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.POSITIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
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
  },
  {
    exerciseIds: [
      'sl-rdl-bw',
      'sl-rdl-db',
      'rdl-bb',
      'rdl-clean-to-box-bb',
      'rdl-clean-to-box-step-up-bb',
      'rdl-kb',
      'rdl-landmine',
      'rdl-tb',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      romStartDirection: ConditionDirection.NEGATIVE,
      leftSide: {
        romKeypointId: KeypointId.LEFT_SHOULDER,
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
  },
];
