import { config } from 'dotenv';

config();

export class EnvUtil {
  isDev() {
    return process.env.NODE_ENV === 'development';
  }

  isProd() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }
}