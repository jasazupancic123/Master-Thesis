import type { RefObject } from 'react';

import type { ConditionDirection } from '../enum/condition-detection.enum';
import type { KeypointId } from '../enum/keypoint-id';
import type {
  ExerciseRepStartCondition,
  RequiredPoseCondition,
  StillnessCondition,
} from './exercise-start-condition.type';
import type { Rep } from './rep.type';
import type { RepState } from './rep-state.type';

export type RepSideDetectionData = {
  repStateRef: RefObject<RepState>;
  currentRepRef: RefObject<Rep | null>;
  recordedReps: Rep[];
  keypointId: KeypointId;
  exerciseStartConditions: ExerciseRepStartCondition[];
  requiredPoseConditions?: RequiredPoseCondition[];
  recordingStillnesses?: StillnessCondition[];
  direction: ConditionDirection;
  side: 'L' | 'R';
};
