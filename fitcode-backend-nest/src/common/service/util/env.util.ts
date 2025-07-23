import { config } from 'dotenv';

config({ quiet: true });

export class EnvUtil {
  isDev() {
    return process.env.NODE_ENV === 'dev';
  }

  isProd() {
    return process.env.NODE_ENV === 'prod';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }
}
