import { connectFirestoreEmulator, getFirestore } from '@firebase/firestore';
import { connectStorageEmulator, getStorage } from '@firebase/storage';
import type { FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

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

export function getFirebaseFirestore() {
  const firestore = getFirestore(getFirebaseApp());
  if (dev) connectFirestoreEmulator(firestore, 'localhost', 8090);
  return firestore;
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (dev) connectAuthEmulator(auth, 'http://localhost:9099');
  return auth;
}

export function getFirebaseStorage() {
  const storage = getStorage(getFirebaseApp()); // process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (dev) connectStorageEmulator(storage, 'localhost', 9199);
  return storage;
}

export function getFirebaseFunctions() {
  const functions = getFunctions(getFirebaseApp());
  if (dev) connectFunctionsEmulator(functions, 'localhost', 5001);
  return functions;
}
