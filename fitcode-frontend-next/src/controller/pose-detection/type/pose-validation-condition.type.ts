import { KeypointId } from '../enum/keypoint-id';
import { KeypointValueType } from '../enum/keypoint-value-type';

export type PoseValidationCondition = {
  keypointId1: KeypointId;
  keypointId2: KeypointId;
  relation: KeypointValueType;
  threshold: number;
  errorMessage: string;
};
