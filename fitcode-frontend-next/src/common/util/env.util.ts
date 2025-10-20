import {
  POSE_LANDMARKER_FULL_PATH,
  POSE_LANDMARKER_HEAVY_PATH,
  POSE_LANDMARKER_LITE_PATH,
} from '@/controller/pose-detection/const/pose-landmarker-paths';

export default class EnvUtil {
  static AI = class {
    static getPoseLandmarkerModelPath(): string {
      const model = process.env.NEXT_PUBLIC_POSE_LANDMARKER_VERSION;

      if (model === 'lite') return POSE_LANDMARKER_LITE_PATH;
      else if (model === 'heavy') return POSE_LANDMARKER_HEAVY_PATH;

      return POSE_LANDMARKER_FULL_PATH; // default to full
    }
    static disableEruda(): boolean {
      return process.env.NEXT_PUBLIC_DISABLE_ERUDA === '1';
    }
    static disableAIFPS(): boolean {
      return process.env.NEXT_PUBLIC_DISABLE_AI_FPS === '1';
    }

    static convertToMetricScale(): boolean {
      return process.env.NEXT_PUBLIC_AI_CONVERT_TO_METRIC_SCALE === '1';
    }
  };
}
