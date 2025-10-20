import { FirebaseAuthUtil } from './service/auth';
import { FirebaseFirestoreUtil } from './service/firestore';
import { FirebaseFunctionsUtil } from './service/functions';
import { FirebaseStorageUtil } from './service/storage';

export class FirebaseService {
  readonly auth: FirebaseAuthUtil;
  readonly firestore: FirebaseFirestoreUtil;
  readonly functions: FirebaseFunctionsUtil;
  readonly storage: FirebaseStorageUtil;

  constructor() {
    this.auth = new FirebaseAuthUtil();
    this.firestore = new FirebaseFirestoreUtil();
    this.functions = new FirebaseFunctionsUtil();
    this.storage = new FirebaseStorageUtil();
  }
}
