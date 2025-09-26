export const POSE_DETECTION_CONSTRAINTS = {
  // State detection
  MIN_KEYPOINTS_IN_FRAME: 30,
  IN_FRAME_VISIBLITY_THRESHOLD: 0.5,
  STILLNESS_THRESHOLD_M: 0.03, // in meters
  STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S: 1, // in seconds
  FACING_CAMERA_VISIBLITY_THRESHOLD: 0.5,

  // Nod detection
  NOD_DETECTION_BUFFER_DURATION_MS: 1500, // how many ms to track for nod detection
  Y_POS_HELPER_M: 0.01, // in meters, how much we help the y for better detection

  START_CUT_OFF_CONFIDENCE: 0.9, // % of keypoints before the first rep need to be correct to cut off the start
  KEYPOINT_BUFFER_DURATION_MS: 1000, // how many ms to track
  CLOSE_ENOUGH_TO_START_VALUE_RATIO: 0.3, // how close to the start value the rep needs to be to be considered finished
  ROM_GRAPH_LENGTH_S: 3, // in seconds, how many seconds of history to keep for the ROM graph

  // Extremum detection
  MIN_FRAMES_FOR_EXTREMUM: 4, // min 4 total consecutive correct frames (2pos k's, 2neg k's)
  MIN_TIME_FOR_EXTREMUM_S: 0.2, // in seconds, it's time for the value to go into opposite direction to detect extremum
  EXTREMUM_RANGE_TIME_TO_EXTREME_RATIO: 0.05, // used to detect timeToExtremeMs
  EXTREMUM_RANGE_TIME_AT_EXTREME_RATIO: 0.01, // used to detect timeAtExtremumMs, 0.01 for arm-curl, 0.05 for squat
  NEW_EXTREMUM_DETECTION_RATIO: 0.02, // if we reach a new extremum, it needs to be at least this % away from the previous one

  // Rep start
  SLOPE_K_REP_START: 0.5, // naklon premice (K) za zacetek ponovitve
  SUSTAIN_W_REP_START: 2, // stevilo zaporednih tock, ki morajo biti nad naklonom
  PRE_WINDOW_FRAMES_REP_START: 4, // stevilo tock pred zaznano končno, v katerih iščemo ekstremum
  MIN_START_SCALE: 1e-3,
  MAX_LOOKBACK_REP_START_S: 3, // maksimalno število sekund, ki jih lahko gledamo nazaj, da najdemo začetek ponovitve
  KEEP_KEYPOINT_HISTORY_DURING_RECORDING_MS: 8000, // koliko sekund hranimo zgodovino keypointov, da lahko gledamo nazaj

  // Rep end
  SLOPE_K_REP_END: 0.2, // naklon premice (K) za konec ponovitve
  SUSTAIN_W_REP_END: 2, // stevilo zaporednih tock, ki morajo biti pod naklonom
  POST_WINDOW_FRAMES_REP_END: 2, // stevilo frame-ov po tem ko se rep konča, da najdemo še kakšen ekstremum
  NEW_EXTREMUM_DETECTION_DISTANCE_M: 0.005, // če pridemo do novega ekstremuma, mora biti ta oddaljen od prejšnjega za to vrednost (v metrih)

  // Detection end
  MIN_STILL_TIME_TO_STOP_DETECTION_S: 2, // at least how many seconds of recording state to stop detection
};
