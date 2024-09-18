import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import { storage } from '@/common/config/firebase.config';

export class FirebaseStorageUtil {
  static async uploadFile(file: File, path: string) {
    const reference = ref(storage, path);
    console.log('upload reference:', reference.fullPath);
    await uploadBytes(reference, file);
  }

  async exerciseUrl(path: string) {
    const reference = ref(storage, path);
    const url = await getDownloadURL(reference);
    console.log('exercise url:', url);
    return url;
  }
}