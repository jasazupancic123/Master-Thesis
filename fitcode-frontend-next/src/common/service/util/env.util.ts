export class EnvUtil {
  static isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
