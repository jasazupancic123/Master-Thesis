export class AiEnvUtil {
  IN_FRAME_VISIBLITY_THRESHOLD(): number {
    return Number(process.env.NEXT_PUBLIC_AI_IN_FRAME_VISIBLITY_THRESHOLD);
  }

  STILLNESS_LOWER_THRESHOLD_M(): number {
    return Number(process.env.NEXT_PUBLIC_AI_STILLNESS_LOWER_THRESHOLD_M);
  }

  STILLNESS_THRESHOLD_M(): number {
    return Number(process.env.NEXT_PUBLIC_AI_STILLNESS_THRESHOLD_M);
  }

  STILLNESS_Z_AXIS_PERCENTAGE_THRESHOLD(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_STILLNESS_Z_AXIS_PERCENTAGE_THRESHOLD
    );
  }

  STILLNESS_THRESHOLD_WHILE_RECORDING_M(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_STILLNESS_THRESHOLD_WHILE_RECORDING_M
    );
  }

  STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S
    );
  }

  FACING_CAMERA_VISIBLITY_THRESHOLD(): number {
    return Number(process.env.NEXT_PUBLIC_AI_FACING_CAMERA_VISIBLITY_THRESHOLD);
  }

  STILLNESS_COUNTDOWN_DURATION_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_STILLNESS_COUNTDOWN_DURATION_S);
  }

  MIN_TIME_PASSED_TO_DETECT_STILLNESS_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_MIN_TIME_PASSED_TO_DETECT_STILLNESS_S
    );
  }

  NOD_DETECTION_BUFFER_DURATION_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_NOD_DETECTION_BUFFER_DURATION_S);
  }

  Y_POS_HELPER_M(): number {
    return Number(process.env.NEXT_PUBLIC_AI_Y_POS_HELPER_M);
  }

  HEAD_SHAKE_DETECTION_BUFFER_DURATION_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_HEAD_SHAKE_DETECTION_BUFFER_DURATION_S
    );
  }

  HEAD_SHAKE_ANGLE_THRESHOLD_DEGREES(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_HEAD_SHAKE_ANGLE_THRESHOLD_DEGREES
    );
  }

  MIN_KEYPOINTS_FOR_JITTER_DETECTION(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_MIN_KEYPOINTS_FOR_JITTER_DETECTION
    );
  }

  JITTER_DETECTION_WINDOW_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_JITTER_DETECTION_WINDOW_S);
  }

  TIME_BETWEEN_MODEL_RELOAD_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_TIME_BETWEEN_MODEL_RELOAD_S);
  }

  KEYPOINT_BUFFER_DURATION_MS(): number {
    return Number(process.env.NEXT_PUBLIC_AI_KEYPOINT_BUFFER_DURATION_MS);
  }

  CLOSE_ENOUGH_TO_START_VALUE_RATIO(): number {
    return Number(process.env.NEXT_PUBLIC_AI_CLOSE_ENOUGH_TO_START_VALUE_RATIO);
  }

  HIGH_FPS_THRESHOLD(): number {
    return Number(process.env.NEXT_PUBLIC_AI_HIGH_FPS_THRESHOLD);
  }

  MIN_FRAMES_FOR_EXTREMUM(): number {
    return Number(process.env.NEXT_PUBLIC_AI_MIN_FRAMES_FOR_EXTREMUM);
  }

  MIN_TIME_FOR_EXTREMUM_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_MIN_TIME_FOR_EXTREMUM_S);
  }

  PRE_WINDOW_FRAMES_REP_START(): number {
    return Number(process.env.NEXT_PUBLIC_AI_PRE_WINDOW_FRAMES_REP_START);
  }

  MAX_LOOKBACK_REP_START_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_MAX_LOOKBACK_REP_START_S);
  }

  KEEP_KEYPOINT_HISTORY_DURING_RECORDING_MS(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_KEEP_KEYPOINT_HISTORY_DURING_RECORDING_MS
    );
  }

  REP_START_END_VELOCITY_HIGH_FPS_M_PER_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_REP_START_END_VELOCITY_HIGH_FPS_M_PER_S
    );
  }

  REP_START_END_VELOCITY_LOW_FPS_M_PER_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_REP_START_END_VELOCITY_LOW_FPS_M_PER_S
    );
  }

  REP_START_VELOCITY_SUSTAIN_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_REP_START_VELOCITY_SUSTAIN_S);
  }

  REP_START_CONSECUTIVE_FRAMES_UNDER_VELOCITY_THRESHOLD_S(): number {
    return Number(
      process.env
        .NEXT_PUBLIC_AI_REP_START_CONSECUTIVE_FRAMES_UNDER_VELOCITY_THRESHOLD_S
    );
  }

  REP_START_JOINT_STILLNESS_VELOCITY_THRESHOLD_M_PER_S(): number {
    return Number(
      process.env
        .NEXT_PUBLIC_AI_REP_START_JOINT_STILLNESS_VELOCITY_THRESHOLD_M_PER_S
    );
  }

  REP_END_VELOCITY_M_PER_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_REP_END_VELOCITY_M_PER_S);
  }

  REP_END_LOOKBACK_S(): number {
    return Number(process.env.NEXT_PUBLIC_AI_REP_END_LOOKBACK_S);
  }

  TIME_AT_EXTREMUM_VELOCITY_THRESHOLD_M_PER_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_TIME_AT_EXTREMUM_VELOCITY_THRESHOLD_M_PER_S
    );
  }

  TIME_AT_EXTREMUM_VELOCITY_SUSTAIN_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_TIME_AT_EXTREMUM_VELOCITY_SUSTAIN_S
    );
  }

  MIN_STILL_TIME_TO_STOP_DETECTION_S(): number {
    return Number(
      process.env.NEXT_PUBLIC_AI_MIN_STILL_TIME_TO_STOP_DETECTION_S
    );
  }
}
