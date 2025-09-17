export const POSE_DETECTION_CONSTRAINTS = {
  MIN_KEYPOINTS_IN_FRAME: 26,
  IN_FRAME_VISIBLITY_THRESHOLD: 0.2,
  STILLNESS_THRESHOLD_M: 0.025, // in meters
  STILLNESS_THRESHOLD_WHILE_READY_M: 0.04, // in meters
  FACING_CAMERA_VISIBLITY_THRESHOLD: 0.5,
  START_CUT_OFF_CONFIDENCE: 0.9, // % of keypoints before the first rep need to be correct to cut off the start
  KEYPOINT_BUFFER_DURATION_MS: 1000, // how many ms to track
  CLOSE_ENOUGH_TO_START_VALUE_RATIO: 0.2, // how close to the start value the rep needs to be to be considered finished
  MIN_REP_FRAMES: 3, // min 4 total consecutive correct frames (2pos k's, 2neg k's)
  MIN_REP_TIME_S: 0.2, // in seconds, it's time for the value to go into opposite direction to detect extremum
};
