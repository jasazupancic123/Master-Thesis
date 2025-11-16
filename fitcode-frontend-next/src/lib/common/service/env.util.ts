import {
  POSE_LANDMARKER_FULL_PATH,
  POSE_LANDMARKER_HEAVY_PATH,
  POSE_LANDMARKER_LITE_PATH,
} from '@/core/exercise-ai-prescriptions/const/pose-landmarker-paths';

export class EnvUtil {
  isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  disableErudaAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_ERUDA === '1';
  }

  disableFpsAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_FPS === '1';
  }

  convertToMetricScale(): boolean {
    return process.env.NEXT_PUBLIC_AI_CONVERT_TO_METRIC_SCALE === '1';
  }

  getPoseLandmarkerModelPath(): string {
    const model = process.env.NEXT_PUBLIC_POSE_LANDMARKER_VERSION;

    if (model === 'lite') return POSE_LANDMARKER_LITE_PATH;
    else if (model === 'heavy') return POSE_LANDMARKER_HEAVY_PATH;

    return POSE_LANDMARKER_FULL_PATH; // default to full
  }

  unoptimizeImages(): boolean {
    return process.env.NEXT_PUBLIC_UNOPTIMIZE_IMAGES === '1';
  }
}
