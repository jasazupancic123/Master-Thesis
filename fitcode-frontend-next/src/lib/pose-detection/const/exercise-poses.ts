import { ConditionDirection } from '../enum/condition-detection.enum';
import { HorizontalVertical } from '../enum/horizontal-vertical.enum';
import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';
import { MoreLess } from '../enum/more-less.enum';
import type { ExerciseDetectionDataWithExerciseIds } from '../type/exercise-start-condition.type';

// Smaller the duration, more accurate will the rep cuting be
export const EXERCISE_POSES: ExerciseDetectionDataWithExerciseIds[] = [
  {
    exerciseIds: [
      'acceleration-squat-fw',
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
      'cossack-squat-bw',
      'deep-back-squat-bb',
      'deep-squat-backward-walk',
      'deep-squat-forward-walk',
      'deep-squat-lateral-walk',
      'drop-squat',
      'drop-squat-from-box',
      'front-squat-bb',
      'front-squat-w-ohp-fw[v12]',
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
      'mobility-squat',
      'oh-split-squat-mb',
      'oscillation-goblet-squat',
      'overhead-squat-bb',
      'partner-back-to-back-squat',
      'partner-back-to-back-squat-combat',
      'partner-mb-squat-throw',
      'plate-reaching-squat-di',
      'pop-to-squat',
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
      leftSide: {
        romKeypointId: KeypointId.LEFT_HIP,
        conditions: [
          {
            keypointId: KeypointId.LEFT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1500, // ms
            distance: 0.04, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'lateral-squat-bw',
      'lateral-lunge-w-plate-reach-di',
      'lateral-lunge',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_X,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_KNEE,
        conditions: [
          {
            keypointId: KeypointId.LEFT_KNEE,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.04, // meters
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_KNEE,
        conditions: [
          {
            keypointId: KeypointId.RIGHT_KNEE,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.NEGATIVE,
            duration: 750, // ms
            distance: 0.04, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['carioca-squat-bw'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_HIP,
        conditions: [
          {
            keypointId: KeypointId.LEFT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1100,
            distance: 0.06,
          },
        ],
        recordingStillnesses: [
          {
            keypointId: KeypointId.RIGHT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
          {
            keypointId: KeypointId.LEFT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.RIGHT_ANKLE,
            keypointId2: KeypointId.LEFT_SHOULDER,
            valueType: KeypointValueType.POSITION_X,
            minDiffM: 0,
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_HIP,
        conditions: [
          {
            keypointId: KeypointId.RIGHT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1100, // ms
            distance: 0.06, // meters
          },
        ],
        recordingStillnesses: [
          {
            keypointId: KeypointId.LEFT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
          {
            keypointId: KeypointId.RIGHT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_SHOULDER,
            keypointId2: KeypointId.RIGHT_ANKLE,
            valueType: KeypointValueType.POSITION_X,
            minDiffM: 0,
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'pull-up',
      'trx-row-[level-1]',
      'trx-row-[level-2]',
      'trx-row-[level-3]',
      'incline-bench-db-row',
      'inverted-bar-row-bw',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_SHOULDER,
        conditions: [
          {
            keypointId: KeypointId.LEFT_SHOULDER,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1000,
            distance: 0.04,
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['sa-bent-over-row-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.05, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['push-up'],
    data: {
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_WRIST,
        KeypointId.RIGHT_WRIST,
        KeypointId.LEFT_SHOULDER,
        KeypointId.RIGHT_SHOULDER,
      ],
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_SHOULDER,
        conditions: [
          {
            keypointId: KeypointId.LEFT_SHOULDER,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1200,
            distance: 0.03,
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'split-squat-bb',
      'split-squat-db',
      'bulgarian-split-squat',
      'bulgarian-split-squat-db',
      'goblet-split-squat-kb',
      'hang-split-squat',
      'hang-split-squat-landmine',
      'prisoner-split-squat-bw',
      'split-squat-fw[d11]',
      'forward-lunge',
      'forward-lunge-bb',
      'forward-lunge-w-rotation',
      'forward-lunge-partner-push',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_HIP,
        conditions: [
          {
            keypointId: KeypointId.LEFT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1100,
            distance: 0.05,
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.RIGHT_ANKLE,
            keypointId2: KeypointId.LEFT_ANKLE,
            valueType: KeypointValueType.POSITION_Z,
            minDiffM: 0.1,
          },
        ],
        recordingStillnesses: [
          {
            keypointId: KeypointId.RIGHT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
          {
            keypointId: KeypointId.LEFT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_HIP,
        conditions: [
          {
            keypointId: KeypointId.RIGHT_HIP,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1100,
            distance: 0.05,
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_ANKLE,
            keypointId2: KeypointId.RIGHT_ANKLE,
            valueType: KeypointValueType.POSITION_Z,
            minDiffM: 0.1,
          },
        ],
        recordingStillnesses: [
          {
            keypointId: KeypointId.RIGHT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
          {
            keypointId: KeypointId.LEFT_ANKLE,
            maxMovementM: 0.06,
            durationS: 0.3,
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'biceps-curl-sa-db',
      'bent-over-row-bb',
      'bent-over-row-db',
      'gorilla-row-kb',
      'incline-bench-db-row',
      'renegade-rows-db',
      'upright-rows-bb',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.05, // meters
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
            distance: 0.05, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['arm-curl', 'arm-curl-db', 'biceps-curl-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 750, // ms
            distance: 0.05, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'bench-press',
      'bench-press-bb',
      'bench-press-db',
      'incline-bench-press-db',
      'narrow-bench-press-db',
      'skull-crasher-1-db',
      'skull-crasher-2-db',
      'skull-crasher-ca',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_WRIST,
        KeypointId.RIGHT_WRIST,
        KeypointId.LEFT_ELBOW,
        KeypointId.RIGHT_ELBOW,
        KeypointId.LEFT_KNEE,
        KeypointId.RIGHT_KNEE,
        KeypointId.LEFT_ANKLE,
        KeypointId.RIGHT_ANKLE,
      ],
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1000, // ms
            distance: 0.04, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_WRIST,
            keypointId2: KeypointId.LEFT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.05,
          },
          {
            keypointId1: KeypointId.RIGHT_WRIST,
            keypointId2: KeypointId.RIGHT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.05,
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['triceps-bench-dips', 'triceps-dips'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_SHOULDER,
        conditions: [
          {
            keypointId: KeypointId.LEFT_SHOULDER,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1000, // ms
            distance: 0.05, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['triceps-press-down-ca'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
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
    exerciseIds: ['overhead-triceps-extensions-ca'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1000, // ms
            distance: 0.04, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['sit-up'],
    data: {
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_SHOULDER,
        KeypointId.RIGHT_SHOULDER,
        KeypointId.LEFT_KNEE,
        KeypointId.RIGHT_KNEE,
        KeypointId.LEFT_ANKLE,
        KeypointId.RIGHT_ANKLE,
      ],
      romValueType: KeypointValueType.POSITION_Y,
      leftSide: {
        romKeypointId: KeypointId.LEFT_SHOULDER,
        conditions: [
          {
            keypointId: KeypointId.LEFT_SHOULDER,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1200, // ms
            distance: 0.04, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_KNEE,
            keypointId2: KeypointId.LEFT_HIP,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.01,
          },
          {
            keypointId1: KeypointId.RIGHT_KNEE,
            keypointId2: KeypointId.RIGHT_HIP,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.01,
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['triceps-press-down-sa-ca'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 1000, // ms
            distance: 0.04, // meters
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.RIGHT_WRIST,
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
    exerciseIds: ['overhead-triceps-extension-sa-ca'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1000, // ms
            distance: 0.04, // meters
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
            duration: 1000, // ms
            distance: 0.04, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['bench-press-sa-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_WRIST,
        KeypointId.RIGHT_WRIST,
        KeypointId.LEFT_ELBOW,
        KeypointId.RIGHT_ELBOW,
        KeypointId.LEFT_KNEE,
        KeypointId.RIGHT_KNEE,
        KeypointId.LEFT_ANKLE,
        KeypointId.RIGHT_ANKLE,
      ],
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1200, // ms
            distance: 0.05, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_WRIST,
            keypointId2: KeypointId.LEFT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.05,
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
            duration: 1200, // ms
            distance: 0.05, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.RIGHT_WRIST,
            keypointId2: KeypointId.RIGHT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.05,
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['bench-press-[top-down-alt]-db'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_WRIST,
        KeypointId.RIGHT_WRIST,
        KeypointId.LEFT_ELBOW,
        KeypointId.RIGHT_ELBOW,
        KeypointId.LEFT_KNEE,
        KeypointId.RIGHT_KNEE,
        KeypointId.LEFT_ANKLE,
        KeypointId.RIGHT_ANKLE,
      ],
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 750, // ms
            distance: 0.07, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_WRIST,
            keypointId2: KeypointId.LEFT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.07,
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.RIGHT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.RIGHT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.NEGATIVE,
            duration: 750, // ms
            distance: 0.07, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.RIGHT_WRIST,
            keypointId2: KeypointId.RIGHT_ELBOW,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.07,
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'diagonal-shoulder-raises-sa-ca',
      'lateral-shoulder-raises-sa-ca',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1500, // ms
            distance: 0.04, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.LEFT_ELBOW,
            keypointId2: KeypointId.LEFT_WRIST,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.02,
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
            duration: 1500, // ms
            distance: 0.04, // meters
          },
        ],
        requiredPoseConditions: [
          {
            keypointId1: KeypointId.RIGHT_ELBOW,
            keypointId2: KeypointId.RIGHT_WRIST,
            valueType: KeypointValueType.POSITION_Y,
            minDiffM: 0.02,
          },
        ],
      },
    },
  },
  {
    exerciseIds: [
      'shoulder-press-bb',
      'shoulder-press-db',
      'lateral-shoulder-raises-db',
    ],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      cannotDoBothSidesSimultaneously: true,
      leftSide: {
        romKeypointId: KeypointId.LEFT_WRIST,
        conditions: [
          {
            keypointId: KeypointId.LEFT_WRIST,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1500, // ms
            distance: 0.04, // meters
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
  {
    exerciseIds: ['leg-raises'],
    data: {
      romValueType: KeypointValueType.POSITION_Y,
      stillnessEvaluationKeypoints: [
        KeypointId.LEFT_ANKLE,
        KeypointId.RIGHT_ANKLE,
        KeypointId.LEFT_KNEE,
        KeypointId.RIGHT_KNEE,
      ],
      leftSide: {
        romKeypointId: KeypointId.LEFT_ANKLE,
        conditions: [
          {
            keypointId: KeypointId.LEFT_ANKLE,
            type: KeypointValueType.POSITION_Y,
            direction: ConditionDirection.POSITIVE,
            duration: 1200, // ms
            distance: 0.03, // meters
          },
        ],
      },
    },
  },
  {
    exerciseIds: ['mummy-plank'],
    data: {
      romValueType: KeypointValueType.POSITION_X,
      cannotDoBothSidesSimultaneously: true,
      drawLines: [
        [
          [KeypointId.NOSE],
          [KeypointId.LEFT_SHOULDER, KeypointId.RIGHT_SHOULDER],
          [KeypointId.LEFT_HIP, KeypointId.RIGHT_HIP],
          [KeypointId.LEFT_ANKLE, KeypointId.RIGHT_ANKLE],
        ],
      ],
      drawRadars: [
        {
          startKeypointOrigin: [KeypointId.LEFT_ANKLE, KeypointId.RIGHT_ANKLE],
          alignStartPoint: HorizontalVertical.VERTICAL,
          dynamicKeypoint: KeypointId.NOSE, // the dynamic keypoint, which will be updating during the rep
        },
      ],
      leftSide: {
        romKeypointId: KeypointId.NOSE,
        conditions: [
          {
            keypointId: KeypointId.NOSE,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.POSITIVE,
            duration: 3000, // ms
            distance: 0.04, // meters
          },
          {
            keypointId: KeypointId.LEFT_SHOULDER,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.POSITIVE,
            duration: 3000, // ms
            distance: 0.04, // meters
          },
        ],
        feedbackAngles: [
          {
            id: 'nose-shoulders-hip-left',
            name: 'NOSE - SHOULDERS - HIP',
            point1: [KeypointId.NOSE],
            point2: [KeypointId.LEFT_HIP, KeypointId.RIGHT_HIP],
            origin: [KeypointId.LEFT_SHOULDER, KeypointId.RIGHT_SHOULDER],
            threshold: 160, // degrees
            moreLess: MoreLess.LESS,
          },
          {
            id: 'shoulders-hip-ankle-left',
            name: 'SHOULDERS - HIP - ANKLE',
            point1: [KeypointId.LEFT_SHOULDER, KeypointId.RIGHT_SHOULDER],
            point2: [KeypointId.LEFT_ANKLE],
            origin: [KeypointId.LEFT_HIP, KeypointId.RIGHT_HIP],
            threshold: 160, // degrees
            moreLess: MoreLess.LESS,
          },
        ],
        extremumAngles: [
          {
            id: 'peak-angle-l',
            name: 'Peak angle L',
            point1: [KeypointId.NOSE],
            point2: HorizontalVertical.VERTICAL,
            origin: [KeypointId.LEFT_ANKLE],
            attachOriginToStartValue: true,
          },
        ],
      },
      rightSide: {
        romKeypointId: KeypointId.NOSE,
        conditions: [
          {
            keypointId: KeypointId.NOSE,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.NEGATIVE,
            duration: 3000, // ms
            distance: 0.04, // meters
          },
          {
            keypointId: KeypointId.RIGHT_SHOULDER,
            type: KeypointValueType.POSITION_X,
            direction: ConditionDirection.NEGATIVE,
            duration: 3000, // ms
            distance: 0.04, // meters
          },
        ],
        feedbackAngles: [
          {
            id: 'nose-shoulders-hip-right',
            name: 'NOSE - SHOULDERS - HIP',
            point1: [KeypointId.NOSE],
            point2: [KeypointId.LEFT_HIP, KeypointId.RIGHT_HIP],
            origin: [KeypointId.LEFT_SHOULDER, KeypointId.RIGHT_SHOULDER],
            threshold: 160, // degrees
            moreLess: MoreLess.LESS,
          },
          {
            id: 'shoulders-hip-ankle-right',
            name: 'SHOULDERS - HIP - ANKLE',
            point1: [KeypointId.LEFT_SHOULDER, KeypointId.RIGHT_SHOULDER],
            point2: [KeypointId.RIGHT_ANKLE],
            origin: [KeypointId.LEFT_HIP, KeypointId.RIGHT_HIP],
            threshold: 160, // degrees
            moreLess: MoreLess.LESS,
          },
        ],
        extremumAngles: [
          {
            id: 'peak-angle-r',
            name: 'Peak angle R',
            point1: [KeypointId.NOSE],
            point2: HorizontalVertical.VERTICAL,
            origin: [KeypointId.RIGHT_ANKLE],
            attachOriginToStartValue: true,
          },
        ],
      },
    },
  },
];
