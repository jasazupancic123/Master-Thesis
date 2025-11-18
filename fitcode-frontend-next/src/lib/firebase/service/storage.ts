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

  async uploadFileWithBase64(file: File, path: string) {
    const reference = ref(this.storage, path);
    await uploadBytes(reference, file);

    const url = await getDownloadURL(reference);
    const base64 = await this.fileToBase64(file);

    return { url, base64 };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // data:<mime>;base64,....
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
