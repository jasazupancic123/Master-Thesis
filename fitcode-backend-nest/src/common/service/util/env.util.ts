import { config } from 'dotenv';

import type { NodeEnv } from '@src/config/environment-validation-schema';
import {
  type Environment,
  validationSchema,
} from '@src/config/environment-validation-schema';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
if (!['production', 'staging'].includes(nodeEnv))
  // in production and staging, the environment variables are set in other ways
  config({ quiet: true, path: `.env.${nodeEnv}` });

export class EnvUtil {
  // based on key return type, parse number/string/boolean
  getKey<K extends keyof Environment>(key: K): Environment[K] {
    const schema = validationSchema;
    const { value } = schema
      .prefs({ errors: { label: 'key' } })
      .validate(process.env);

    return value?.[key];
  }

  getFrontendUrl(path = ''): string {
    return `${process.env.FRONTEND_URL || `http://localhost:3000`}${path}`;
  }

  isDev() {
    return process.env.NODE_ENV === 'dev';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  isStaging() {
    return process.env.NODE_ENV === 'staging';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}
