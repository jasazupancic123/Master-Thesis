import { connectStorageEmulator, getStorage } from '@firebase/storage';
import type { FirebaseApp, FirebaseServerApp } from 'firebase/app';
import { getApps, initializeApp, initializeServerApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

export type FirebaseInitAppOptions = {
  authIdToken?: string;
  server?: boolean;
};

const dev = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

function getConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(getConfig());
}

export function getFirebaseServerApp(
  options?: FirebaseInitAppOptions
): FirebaseServerApp {
  return initializeServerApp(
    getConfig(),
    options?.authIdToken ? { authIdToken: options.authIdToken } : undefined
  );
}

export function getFirebaseAuth(options?: FirebaseInitAppOptions) {
  const app = options?.server
    ? getFirebaseServerApp(options)
    : getApps().length
      ? getApps()[0]
      : getFirebaseApp();

  const auth = getAuth(app);

  if (dev) connectAuthEmulator(auth, 'http://localhost:9099');
  return auth;
}

export function getFirebaseStorage(options?: FirebaseInitAppOptions) {
  const app = options?.server
    ? getFirebaseServerApp(options)
    : getFirebaseApp();

  const storage = getStorage(app); // process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  if (dev) connectStorageEmulator(storage, 'localhost', 9199);
  return storage;
}

export function getFirebaseFunctions(options?: FirebaseInitAppOptions) {
  const app = options?.server
    ? getFirebaseServerApp(options)
    : getFirebaseApp();

  const functions = getFunctions(app);

  if (dev) connectFunctionsEmulator(functions, 'localhost', 5001);
  return functions;
}
