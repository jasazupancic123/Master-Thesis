export const POSE_DETECTION_CONSTRAINTS = {
  // State detection
  IN_FRAME_VISIBLITY_THRESHOLD: 0.5,
  STILLNESS_LOWER_THRESHOLD_M: 0.02, // in meters
  STILLNESS_THRESHOLD_M: 0.06, // in meters
  STILLNESS_Z_AXIS_PERCENTAGE_THRESHOLD: 0.15, // if we move for 15% in z axis, then we are not still
  STILLNESS_THRESHOLD_WHILE_RECORDING_M: 0.01, // in meters
  STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S: 1.5, // in seconds
  FACING_CAMERA_VISIBLITY_THRESHOLD: 0.5,
  STILLNESS_COUNTDOWN_DURATION_S: 3, // in seconds
  MIN_TIME_PASSED_TO_DETECT_STILLNESS_S: 1, // in seconds

  // Nod detection
  NOD_DETECTION_BUFFER_DURATION_S: 1.5, // how many ms to track for nod detection
  Y_POS_HELPER_M: 0.001335, // in meters, how much we help the y for better detection

  // Head shake
  HEAD_SHAKE_DETECTION_BUFFER_DURATION_S: 1.5, // how many ms to track for head shake detection
  HEAD_SHAKE_ANGLE_THRESHOLD_DEGREES: 155, // read as 180 - this_value; min angle to consider head shake

  // Jitter detection
  MIN_KEYPOINTS_FOR_JITTER_DETECTION: 3, // min % number of keypoints that need to be jittering to consider the whole pose as jittering
  JITTER_DETECTION_WINDOW_S: 0.5,
  TIME_BETWEEN_MODEL_RELOAD_S: 10, // to prevent reloading the model too often

  KEYPOINT_BUFFER_DURATION_MS: 1000, // how many ms to track
  CLOSE_ENOUGH_TO_START_VALUE_RATIO: 0.2, // how close to the start value the rep needs to be to be considered finished
  HIGH_FPS_THRESHOLD: 17, // fps above which we consider it high fps

  // Extremum detection
  MIN_FRAMES_FOR_EXTREMUM: 4, // min 4 total consecutive correct frames (2pos k's, 2neg k's)
  MIN_TIME_FOR_EXTREMUM_S: 0.2, // in seconds, it's time for the value to go into opposite direction to detect extremum

  // Rep start
  PRE_WINDOW_FRAMES_REP_START: 4, // stevilo tock pred zaznano končno, v katerih iščemo ekstremum
  MAX_LOOKBACK_REP_START_S: 1, // maksimalno število sekund, ki jih lahko gledamo nazaj, da najdemo začetek ponovitve
  KEEP_KEYPOINT_HISTORY_DURING_RECORDING_MS: 8000, // koliko sekund hranimo zgodovino keypointov, da lahko gledamo nazaj
  REP_START_END_VELOCITY_HIGH_FPS_M_PER_S: 0.04, // when speed goes under (this_value)m/s, then we started the rep!
  REP_START_END_VELOCITY_LOW_FPS_M_PER_S: 0.02, // when speed goes under (this_value)m/s, then we started the rep!
  REP_START_VELOCITY_SUSTAIN_S: 0.3, // if this many frames go under the velocity threshold, then rep started
  REP_START_CONSECUTIVE_FRAMES_UNDER_VELOCITY_THRESHOLD_S: 0.2, // if this many frames go under the velocity threshold, then rep started
  REP_START_JOINT_STILLNESS_VELOCITY_THRESHOLD_M_PER_S: 0.01, // tracking stillness of a joint for rep start

  // Rep end
  REP_END_VELOCITY_M_PER_S: 0.02, // when speed goes under (this_value)m/s, then we ended the rep!
  REP_END_LOOKBACK_S: 0.25, // how many seconds the velocity buffer is long to detect rep end

  // Time at extremum
  TIME_AT_EXTREMUM_VELOCITY_THRESHOLD_M_PER_S: 0.05, // when going over this, then we are out of the extremum range
  TIME_AT_EXTREMUM_VELOCITY_SUSTAIN_S: 0.25, // for at least this amount of time the value needs to be over the threshold

  // Detection end
  MIN_STILL_TIME_TO_STOP_DETECTION_S: 2, // at least how many seconds of recording state to stop detection
};
