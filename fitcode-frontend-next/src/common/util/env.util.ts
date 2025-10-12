export default class EnvUtil {
  static AI = class {
    static disableEruda(): boolean {
      return process.env.NEXT_PUBLIC_DISABLE_ERUDA === '1';
    }
    static disableAIFPS(): boolean {
      return process.env.NEXT_PUBLIC_DISABLE_AI_FPS === '1';
    }
  };
}
