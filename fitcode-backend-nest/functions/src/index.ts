// NOTE - this has to be default import: https://github.com/firebase/firebase-admin-node/issues/593#issuecomment-620711067
import admin from 'firebase-admin';
import { https } from 'firebase-functions/v1';

admin.initializeApp({ credential: admin.credential.applicationDefault() });

export const createUserWithRole = https.onCall(async (_data, _context) => {
  // not used anymore, here for placeholder
});
