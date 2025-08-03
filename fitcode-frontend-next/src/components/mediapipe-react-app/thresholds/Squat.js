const KneeAngleThresh = {
  STAND: [150, 180], // Standing angle range
  QUARTER: [120, 149], // Quarter squat angle range
  HALF: [75, 119], // Half squat angle range
  FULL: [30, 74], // Full squat angle range
};

export const Thresholds = {
  KNEE_ANGLE: KneeAngleThresh,
  TRUNK_VERTICAL_THRESH: 45,
  SHIN_VERTICAL_THRESH: 35,
  HEAD_VERTICAL_THRESH: 60,
  KNEE_ALIGNMENT: [-1.55, 1.55],
  FEET_SPACING: [1.4, 2.0], // razdalja med gležnji : razdalja med kolki (noge skup/narazen)
  FEET_ANGLE: [30, 55],
  STANDING_HIP_ANGLE_THRESH: 150,
  STANDING_KNEE_ANGLE_THRESH: 140,
};

export const CoMWeights = {
  headCenter: 0.07,
  leftShoulder: 0.125, // Part of the torso
  rightShoulder: 0.125, // Part of the torso
  leftElbow: 0.025, // Upper arm
  rightElbow: 0.025, // Upper arm
  leftWrist: 0.015, // Forearm
  rightWrist: 0.015, // Forearm
  leftHip: 0.1, // Part of the torso and thigh
  rightHip: 0.1, // Part of the torso and thigh
  leftKnee: 0.045, // Shank
  rightKnee: 0.045, // Shank
  leftAnkle: 0.015, // Foot
  rightAnkle: 0.015, // Foot
};

// Simplified Body Mass Distribution Model
// According to various studies on human body mass distribution, we can approximate the body's mass distribution as follows (these are rough estimates):

// Head: 7%
// Torso (including the neck, chest, abdomen, and pelvis): 50%
// Each upper arm: 2.5%
// Each forearm: 1.5%
// Each hand: 0.6%
// Each thigh: 10%
// Each shank (lower leg): 4.5%
// Each foot: 1.5%
