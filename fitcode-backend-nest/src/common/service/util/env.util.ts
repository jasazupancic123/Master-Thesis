import { config } from 'dotenv';

import type { NodeEnv } from '@src/config/environment-validation-schema';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
config({ quiet: true, path: `.env.${nodeEnv}` });

export class EnvUtil {
  isDev() {
    return process.env.NODE_ENV === 'dev';
  }

  isProd() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }
}
