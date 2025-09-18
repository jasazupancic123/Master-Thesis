import type { KeypointHistory } from '../class/keypoint-history';

export type Rep = {
  // INIT
  repNumber: number; // id
  createdAt: Date; // when the rep was created, used for idle time
  startValue: number; // the value when the rep started
  startValueFrameNum: number; // the frame number when the rep started
  buffer: KeypointHistory; // the buffer of keypoints during the rep
  detectedExtremum: boolean; // if the rep detected an extremum (local max or min)

  // OPTIONAL
  // endValue
  endValue?: number; // the value when the rep ended
  endValueFrameNum?: number; // the frame number when the rep ended

  // extremeValue
  extremeValue?: number; // the max or min value reached during the rep, also needs to be out of a certain range from the start value
  extremeValueFrameNum?: number; // the frame number when the extreme value was reached
  extremeValueIndex?: number; // the index in the repBuffer of the extremeValue

  // times
  startTime?: Date; // when the value starts decending/ascending
  endTime?: Date; // when the value comes back to the starting point
  idleTime?: number; // startTime - createdAt
  duration?: number; // endTime - startTime
};
