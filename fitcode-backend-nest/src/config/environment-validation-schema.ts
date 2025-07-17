import Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Firebase Admin
  FIREBASE_ADMIN_EMAIL: Joi.string().required(),
  FIREBASE_ADMIN_PASSWORD: Joi.string().required(),
  FIREBASE_CREDENTIALS: Joi.string().required(),

  // Firebase Emulator
  FIRESTORE_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: Joi.string().optional(),
  EVENTARC_EMULATOR: Joi.string().optional(),
});

export type Environment = {
  NODE_ENV: 'dev' | 'prod' | 'test';
  PORT: number;
  FIREBASE_ADMIN_EMAIL: string;
  FIREBASE_ADMIN_PASSWORD: string;
  FIREBASE_CREDENTIALS: string;
  FIRESTORE_EMULATOR_HOST: string | undefined;
  FIREBASE_AUTH_EMULATOR_HOST: string | undefined;
  FIREBASE_STORAGE_EMULATOR_HOST: string | undefined;
  EVENTARC_EMULATOR: string | undefined;
};
