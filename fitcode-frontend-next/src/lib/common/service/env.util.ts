export class EnvUtil {
  static isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  disableErudaAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_ERUDA === '1';
  }

  disableFpsAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_FPS === '1';
  }
}
