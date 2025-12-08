import type { KeypointHistory } from '../class/keypoint-history';
import type { ExtremumAngleWithValue } from './exercise-detection-data';
import type { Keypoint } from './keypoint.type';

export type Rep = {
  // INIT
  repNumber: number; // id

  // startValue
  startValue: number; // the value when the rep started
  startValueFrameNum: number; // the frame number when the rep started
  startTimestamp: Date; // when the value starts decending/ascending
  startFrameKeypoints: Keypoint[];

  // Keypoint buffer
  buffer: KeypointHistory; // the buffer of keypoints during the rep

  // Extremum detection
  detectedExtremum: boolean; // if the rep detected an extremum (local max or min)
  currentlyInExtremumRange: boolean; // if we are in extremum range

  // OPTIONAL
  // endValue
  endValue?: number; // the value when the rep ended
  endValueFrameNum?: number; // the frame number when the rep ended
  endValueTimestamp?: Date; // when the value comes back to the starting point

  // extremeValue
  extremeValue?: number; // the max or min value reached during the rep, also needs to be out of a certain range from the start value
  extremeKeypoint?: Keypoint; // the keypoint when the extreme value was reached
  extremeTimestamp?: Date; // when the extreme value was reached
  extremeToEndTimestamp?: Date; // when going from extreme value to end
  extremumImage?: Blob;
  extremumImageUrl?: string;

  // angles
  extremumAngles?: ExtremumAngleWithValue[];

  // timeAtExtremum
  timeAtExtremumStartKeypoint?: Keypoint;
  timeAtExtremumEndKeypoint?: Keypoint;
  timeAtExtremumStartTimestamp?: Date;
  timeAtExtremumEndTimestamp?: Date;

  // times
  idleTimeMs?: number; // startTime - endTime of the previous rep
  timeToExtremeMs?: number; // extremeTimestamp - startTime
  timeAtExtremeMs: number; // extremeToEndTime - extremeTimestamp, inited to 0
  timeFromExtremeToEndMs?: number; // timeAtExtreme - extremeTimestamp
  durationMs?: number; // endTime - startTime

  // ROM
  minRomValue?: number; // the minimum value reached during the rep
  maxRomValue?: number; // the maximum value reached during the rep
  startRomValue?: number; // the value when the rep started
  extremumRomValue?: number; // the ROM value at the extreme point
  totalRomCm?: number; // maxRomValue - minRomValue
};

export type RepInfo = {
  repNumber: number; // id
  startTimestamp: Date; // when the value starts decending/ascending
  endTimestamp?: Date; // when the value comes back to the starting point

  // times
  idleTimeMs?: number; // startTime - endTime of the previous rep
  timeToExtremeMs?: number; // extremeTimestamp - startTime
  timeAtExtremeMs: number; // extremeToEndTime - extremeTimestamp, inited to 0
  timeFromExtremeToEndMs?: number; // timeAtExtreme - extremeTimestamp
  durationMs?: number; // endTime - startTime

  // ROM
  minRomValue?: number; // the minimum value reached during the rep
  maxRomValue?: number; // the maximum value reached during the rep
  startRomValue?: number; // the value when the rep started
  extremumRomValue?: number; // the ROM value at the extreme point
  totalRomCm?: number; // maxRomValue - minRomValue
};

export type RecordedReps = {
  left: Rep[];
  right?: Rep[];
};

export type RecordedRepsInfo = {
  left: RepInfo[];
  right?: RepInfo[];
};

export type RepsCount = {
  left: number;
  right?: number;
};
