import type { FirebaseStorage } from '@firebase/storage';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';

import { getFirebaseStorage } from '@/common/config/firebase.config';

export class FirebaseStorageUtil {
  private static instance: FirebaseStorageUtil;
  private storage: FirebaseStorage;

  private constructor() {
    this.storage = getFirebaseStorage();
  }

  static get Instance() {
    if (!this.instance) this.instance = new FirebaseStorageUtil();
    return this.instance;
  }

  async uploadFile(file: File, path: string) {
    const reference = ref(this.storage, path);
    await uploadBytes(reference, file);
    return await getDownloadURL(reference);
  }
}
