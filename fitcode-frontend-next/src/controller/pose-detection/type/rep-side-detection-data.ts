import { RefObject } from 'react';
import { RepState } from './rep-state.type';
import { Rep } from './rep.type';
import { KeypointId } from '../enum/keypoint-id';
import { ExerciseRepStartCondition } from './exercise-start-condition.type';

export type RepSideDetectionData = {
  repStateRef: RefObject<RepState>;
  currentRepRef: RefObject<Rep | null>;
  recordedReps: Rep[];
  keypointId: KeypointId;
  exerciseStartConditions: ExerciseRepStartCondition[];
  side: 'L' | 'R';
};
