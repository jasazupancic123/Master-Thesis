import type { ConditionDirection } from '../enum/condition-detection.enum';
import type { HorizontalVertical } from '../enum/horizontal-vertical.enum';
import type { KeypointId } from '../enum/keypoint-id';
import type { KeypointValueType } from '../enum/keypoint-value-type';
import type { MoreLess } from '../enum/more-less.enum';

export type ExerciseAiPrescription = {
  id: string;
  exerciseIds: string[];
  data: ExerciseAiPrescriptionData;
};

export type ExerciseAiPrescriptionData = {
  romValueType: KeypointValueType;
  cannotDoBothSidesSimultaneously?: boolean; // If true, only one side can be active at a time (e.g. lateral lunges)
  stillnessEvaluationKeypoints?: KeypointId[]; // Which keypoints are evaluated for stillness at start only
  drawLines?: KeypointId[][][]; // Array of lines to draw. Each line is a sequence of points, their positions get averaged and connected
  drawRadars?: DrawRadar[];
  leftSide: ExerciseDetectionSideData;
  rightSide?: ExerciseDetectionSideData;
};

type ExerciseDetectionSideData = {
  romKeypointId: KeypointId;
  conditions: ExerciseRepStartCondition[];
  feedbackAngles?: ExerciseAngleCondition[];
  requiredPoseConditions?: RequiredPoseCondition[]; // Which relations between keypoints need to be satisfied for the rep to start
  recordingStillnesses?: StillnessCondition[]; // Which keypoints need to be still for the rep to start
  extremumAngles?: ExtremumAngle[];
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

export type ExerciseAngleCondition = {
  id: string;
  name: string;
  point1: KeypointId[]; // takes the avg coordinate of all the keypoints provided here
  point2: KeypointId[];
  origin: KeypointId[]; // the "middle" point, where the angle gets calculated
  threshold: number; // degrees
  moreLess: MoreLess; // if more and angle is more than the threshold, then angle is incorrect
};

export type ExtremumAngle = Omit<
  ExerciseAngleCondition,
  'point2' | 'threshold' | 'moreLess'
> & {
  attachOriginToStartValue?: boolean; // if true, point1 gets attached to the start value of rep keypoint position
  point2: KeypointId[] | HorizontalVertical; // if this is vertical - it takes a navpična črta for the angle meassure, if horizontal it takes vodoravna črta
};

export type ExtremumAngleWithValue = ExtremumAngle & {
  value: number;
};

export type DrawRadar = {
  startKeypointOrigin: KeypointId[]; // the start keypoint, which is the origin for the radar
  alignStartPoint?: HorizontalVertical; // if true and for example vertical, takes the x of the origin, but the y is a navpična črta at the x
  dynamicKeypoint: KeypointId; // the dynamic keypoint, which will be updating during the rep
};
