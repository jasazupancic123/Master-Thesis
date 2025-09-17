import type { KeypointHistory } from '../class/keypoint-history';

export type Rep = {
  // set on init
  repNumber: number; // id
  createdAt: Date; // when the rep was created, used for idle time
  startValue: number; // the value when the rep started
  buffer: KeypointHistory; // the buffer of keypoints during the rep
  detectedExtremum: boolean; // if the rep detected an extremum (local max or min)

  // set later
  extremeValue?: number; // the max or min value reached during the rep, also needs to be out of a certain range from the start value
  extremeValueIndex?: number; // the index in the repBuffer of the extremeValue
  startTime?: Date; // when the value starts decending/ascending
  endTime?: Date; // when the value comes back to the starting point
  idleTime?: number; // startTime - createdAt
  duration?: number; // endTime - startTime
};
