import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  PORT: Joi.number().default(8080),

  // Firebase Admin
  ADMIN_EMAIL: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),

  // Firebase Emulator
  FIRESTORE_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: Joi.string().optional(),
  EVENTARC_EMULATOR: Joi.string().optional(),
});

export type Environment = {
  NODE_ENV: 'dev' | 'prod' | 'test';
  PORT: number;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  FIREBASE_CONFIG: string;
  FIRESTORE_EMULATOR_HOST: string | undefined;
  FIREBASE_AUTH_EMULATOR_HOST: string | undefined;
  FIREBASE_STORAGE_EMULATOR_HOST: string | undefined;
  EVENTARC_EMULATOR: string | undefined;
};
