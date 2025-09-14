import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';

export enum ConditionDirection {
  ANY = 'ANY',
  NEGATIVE = 'NEGATIVE',
  POSITIVE = 'POSITIVE',
}

export type ExerciseStartCondition = {
  keypointId: KeypointId;
  type: KeypointValueType;
  direction: ConditionDirection;

  // how many ms the condition needs to be held,
  // example: 500ms => 0.5s, for 0.5s hips need to go down in all consecutive frames
  duration: number;
  // how many meters the keypoint needs to move in the specified direction
  distance: number;
};
