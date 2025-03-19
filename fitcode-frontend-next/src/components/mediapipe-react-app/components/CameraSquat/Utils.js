import { POSE_LANDMARKS } from "@mediapipe/pose";
import { Thresholds } from '../../thresholds/Squat';

export const ESSENTIAL_SQUAT_LANDMARKS = [
  POSE_LANDMARKS.LEFT_HIP,
  POSE_LANDMARKS.RIGHT_HIP,
  POSE_LANDMARKS.LEFT_KNEE,
  POSE_LANDMARKS.RIGHT_KNEE,
  POSE_LANDMARKS.LEFT_ANKLE,
  POSE_LANDMARKS.RIGHT_ANKLE,
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.RIGHT_SHOULDER,
];

export const SquatState = {
  STAND: 'STAND',
  QUARTER: 'QUARTER',
  HALF: 'HALF',
  FULL: 'FULL',
  NONE: 'NONE',
};

export function getSquatState(leftKneeAngle, rightKneeAngle) {
  if (
    (Thresholds.KNEE_ANGLE.STAND[0] <= leftKneeAngle &&
      leftKneeAngle <= Thresholds.KNEE_ANGLE.STAND[1]) ||
    (Thresholds.KNEE_ANGLE.STAND[0] <= rightKneeAngle &&
      rightKneeAngle <= Thresholds.KNEE_ANGLE.STAND[1])
  ) {
    return SquatState.STAND;
  } else if (
    (Thresholds.KNEE_ANGLE.QUARTER[0] <= leftKneeAngle &&
      leftKneeAngle <= Thresholds.KNEE_ANGLE.QUARTER[1]) ||
    (Thresholds.KNEE_ANGLE.QUARTER[0] <= rightKneeAngle &&
      rightKneeAngle <= Thresholds.KNEE_ANGLE.QUARTER[1])
  ) {
    return SquatState.QUARTER;
  } else if (
    (Thresholds.KNEE_ANGLE.HALF[0] <= leftKneeAngle &&
      leftKneeAngle <= Thresholds.KNEE_ANGLE.HALF[1]) ||
    (Thresholds.KNEE_ANGLE.HALF[0] <= rightKneeAngle &&
      rightKneeAngle <= Thresholds.KNEE_ANGLE.HALF[1])
  ) {
    return SquatState.HALF;
  } else if (
    (Thresholds.KNEE_ANGLE.FULL[0] <= leftKneeAngle &&
      leftKneeAngle <= Thresholds.KNEE_ANGLE.FULL[1]) ||
    (Thresholds.KNEE_ANGLE.FULL[0] <= rightKneeAngle &&
      rightKneeAngle <= Thresholds.KNEE_ANGLE.FULL[1])
  ) {
    return SquatState.FULL;
  } else {
    return SquatState.NONE;
  }
}
