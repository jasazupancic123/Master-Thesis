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

  getPoseLandmarkerModelPath(): 'lite' | 'full' | 'heavy' {
    const version = process.env.NEXT_PUBLIC_POSE_LANDMARKER_VERSION as string;
    return ['lite', 'full', 'heavy'].includes(version)
      ? (version as 'lite' | 'full' | 'heavy')
      : 'lite';
  }
}
