import type { KeypointHistory } from '../class/keypoint-history';

export type Rep = {
  // INIT
  repNumber: number; // id

  // startValue
  startValue: number; // the value when the rep started
  startValueFrameNum: number; // the frame number when the rep started
  startTimestamp: Date; // when the value starts decending/ascending

  // Keypoint buffer
  buffer: KeypointHistory; // the buffer of keypoints during the rep

  // Extremum detection
  detectedExtremum: boolean; // if the rep detected an extremum (local max or min)
  currentlyInExtremumRange: boolean; // if we are in extremum range

  // OPTIONAL
  // endValue
  endValue?: number; // the value when the rep ended
  endValueFrameNum?: number; // the frame number when the rep ended
  endTimestamp?: Date; // when the value comes back to the starting point

  // extremeValue
  extremeValue?: number; // the max or min value reached during the rep, also needs to be out of a certain range from the start value
  extremeValueFrameNum?: number; // the frame number when the extreme value was reached
  extremeValueIndex?: number; // the index in the repBuffer of the extremeValue
  extremeTimestamp?: Date; // when the extreme value was reached
  extremeToEndTimestamp?: Date; // when going from extreme value to end

  // times
  idleTime?: number; // startTime - endTime of the previous rep
  timeToExtremeMs?: number; // extremeTimestamp - startTime
  timeAtExtremeMs?: number; // extremeToEndTime - extremeTimestamp
  timeFromExtremeToEndMs?: number; // timeAtExtreme - extremeTimestamp
  durationMs?: number; // endTime - startTime
};
