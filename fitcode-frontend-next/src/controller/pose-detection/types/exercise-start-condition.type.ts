import type { ConditionDirection } from '../enum/condition-detection.enum';
import type { KeypointId } from '../enum/keypoint-id';
import type { KeypointValueType } from '../enum/keypoint-value-type';

export type ExerciseDetectionDataWithExerciseIds = {
  exerciseIds: string[];
  data: ExerciseDetectionData;
};

export type ExerciseDetectionData = {
  romValueType: KeypointValueType;
  cannotDoBothSidesSimultaneously?: boolean; // If true, only one side can be active at a time (e.g. lateral lunges)
  leftSide: ExerciseDetectionSideData;
  rightSide?: ExerciseDetectionSideData;
};

type ExerciseDetectionSideData = {
  conditions: ExerciseRepStartCondition[];
  requiredPoseConditions?: RequiredPoseCondition[];
  recordingStillnesses?: StillnessCondition[]; // Which keypoints need to be still for the rep to start
  romKeypointId: KeypointId;
};

export type ExerciseRepStartCondition = {
  keypointId: KeypointId;
  type: KeypointValueType;
  direction: ConditionDirection; // In which direction the ROM keypoint needs to move to start the rep

  // how many ms the condition needs to be held,
  // example: 500ms => 0.5s, for 0.5s hips need to go down in all consecutive frames
  duration: number;
  // how many meters the keypoint needs to move in the specified direction
  distance: number;
};

export type RequiredPoseCondition = {
  keypointId1: KeypointId; // this one must have higher value!
  keypointId2: KeypointId;
  valueType: KeypointValueType;
  minDiffM: number; // if diff is more than this value, then condition is passed
};

export type StillnessCondition = {
  keypointId: KeypointId;
  maxMovementM: number; // if movement is less than this value, then condition is passed
  durationS: number; // how many seconds the condition needs to be held
};
