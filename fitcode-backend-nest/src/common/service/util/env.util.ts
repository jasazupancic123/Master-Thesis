import { config } from 'dotenv';

import {
  type Environment,
  type NodeEnv,
  validationSchema,
} from '@src/config/environment-validation-schema';

const nodeEnv = (process.env.NODE_ENV || 'dev') as NodeEnv;
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
