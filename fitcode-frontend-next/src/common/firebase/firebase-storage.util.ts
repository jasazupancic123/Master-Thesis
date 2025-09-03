import type { FirebaseStorage } from '@firebase/storage';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';

import type { FirebaseInitAppOptions } from '@/common/config/firebase.config';
import { getFirebaseStorage } from '@/common/config/firebase.config';

export class FirebaseStorageUtil {
  private storage: FirebaseStorage;

  constructor(options?: FirebaseInitAppOptions) {
    this.storage = getFirebaseStorage(options);
  }

  async uploadFile(file: File, path: string) {
    const reference = ref(this.storage, path);
    await uploadBytes(reference, file);
    return await getDownloadURL(reference);
  }

  async exerciseUrl(path: string) {
    const reference = ref(this.storage, path);
    const url = await getDownloadURL(reference);
    return url;
  }
}
