import type { FirebaseStorage } from '@firebase/storage';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';

import { getFirebaseStorage } from '@/lib/firebase/config';

export class FirebaseStorageUtil {
  private storage: FirebaseStorage;

  constructor() {
    this.storage = getFirebaseStorage();
  }

  async uploadFile(file: File, path: string) {
    const reference = ref(this.storage, path);
    await uploadBytes(reference, file);
    return await getDownloadURL(reference);
  }

  async getUrl(path: string) {
    const reference = ref(this.storage, path);
    return await getDownloadURL(reference);
  }
}
