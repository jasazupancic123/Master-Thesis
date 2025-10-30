import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid('dev', 'production', 'test', 'staging')
    .default('dev'),
  PORT: Joi.number().default(8080),

  // Deploy
  FRONTEND_URL: Joi.string().required(),
  FRONTEND_WHITELIST: Joi.string().optional(), // comma separated

  // Firebase Admin
  JWT_SECRET: Joi.string().default('secret'),
  ADMIN_EMAIL: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),

  // Firebase Emulator
  FIREBASE_CREDENTIALS: Joi.string().optional(),
  FIRESTORE_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: Joi.string().optional(),
  EVENTARC_EMULATOR: Joi.string().optional(),

  // Debug log firebase queries
  DEBUG_FIRESTORE_QUERY_TIME_LOGGING: Joi.number().default(0),
});

export type NodeEnv = 'dev' | 'test' | 'staging' | 'production';

export type Environment = {
  NODE_ENV: NodeEnv;
  PORT: number;
  FRONTEND_URL: string;
  FRONTEND_WHITELIST: string | undefined;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  FIREBASE_CREDENTIALS: string;
  FIRESTORE_EMULATOR_HOST: string | undefined;
  FIREBASE_AUTH_EMULATOR_HOST: string | undefined;
  FIREBASE_STORAGE_EMULATOR_HOST: string | undefined;
  EVENTARC_EMULATOR: string | undefined;
  DEBUG_FIRESTORE_QUERY_TIME_LOGGING: number;
};
