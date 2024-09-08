import { ref, uploadBytes } from '@firebase/storage';
import { storage } from '@/common/config/firebase.config';

export class FirebaseStorageUtil {
  static exerciseUrl(filename: string) {
    return `${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_URL}/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/media/exercise/${filename}`;
  }

  static async uploadFile(file: File, path: string) {
    const reference = ref(storage, path);
    await uploadBytes(reference, file);
  }
}