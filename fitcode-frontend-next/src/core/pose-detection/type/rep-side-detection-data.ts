import { RefObject } from 'react';
import { RepState } from './rep-state.type';
import { Rep } from './rep.type';
import { KeypointId } from '../enum/keypoint-id';
import {
  ExerciseRepStartCondition,
  RequiredPoseCondition,
  StillnessCondition,
} from './exercise-start-condition.type';
import { ConditionDirection } from '../enum/condition-detection.enum';

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
