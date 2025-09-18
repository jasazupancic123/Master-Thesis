export const POSE_DETECTION_CONSTRAINTS = {
  // State detection
  MIN_KEYPOINTS_IN_FRAME: 26,
  IN_FRAME_VISIBLITY_THRESHOLD: 0.2,
  STILLNESS_THRESHOLD_M: 0.025, // in meters
  STILLNESS_THRESHOLD_WHILE_READY_M: 0.04, // in meters
  FACING_CAMERA_VISIBLITY_THRESHOLD: 0.5,

  START_CUT_OFF_CONFIDENCE: 0.9, // % of keypoints before the first rep need to be correct to cut off the start
  KEYPOINT_BUFFER_DURATION_MS: 1000, // how many ms to track
  CLOSE_ENOUGH_TO_START_VALUE_RATIO: 0.3, // how close to the start value the rep needs to be to be considered finished
  ROM_GRAPH_LENGTH_S: 3, // in seconds, how many seconds of history to keep for the ROM graph

  // Extremum detection
  MIN_FRAMES_FOR_EXTREMUM: 4, // min 4 total consecutive correct frames (2pos k's, 2neg k's)
  MIN_TIME_FOR_EXTREMUM_S: 0.2, // in seconds, it's time for the value to go into opposite direction to detect extremum

  // Rep start
  SLOPE_K_REP_START: 0.5, // naklon premice (K) za zacetek ponovitve
  SUSTAIN_W_REP_START: 2, // stevilo zaporednih tock, ki morajo biti nad naklonom
  PRE_WINDOW_FRAMES_REP_START: 4, // stevilo tock pred zaznano končno, v katerih iščemo ekstremum

  // Rep end
  SLOPE_K_REP_END: 0.075, // naklon premice (K) za konec ponovitve
  SUSTAIN_W_REP_END: 2, // stevilo zaporednih tock, ki morajo biti pod naklonom
  POST_WINDOW_FRAMES_REP_END: 8, // stevilo frame-ov po tem ko se rep konča, da najdemo še kakšen ekstremum
};
