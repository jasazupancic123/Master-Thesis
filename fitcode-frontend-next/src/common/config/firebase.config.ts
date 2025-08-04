import { connectStorageEmulator, getStorage } from '@firebase/storage';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isDev = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const app = getApps().length ? getApps()[0] : initializeApp(config);

const auth = getAuth(app);
if (isDev) connectAuthEmulator(getAuth(), 'http://localhost:9099');

const storage = getStorage(
  app,
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

if (isDev) connectStorageEmulator(storage, 'localhost', 9199);

const functions = getFunctions(app);
if (isDev) connectFunctionsEmulator(functions, 'localhost', 5001);

export { auth, functions, storage };
