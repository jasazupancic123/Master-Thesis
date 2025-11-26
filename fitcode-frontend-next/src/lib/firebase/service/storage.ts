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

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // data:<mime>;base64,....
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async uploadFileWithBase64(
    file: File,
    path: string,
    options?: { maxDimensionCrop?: number }
  ) {
    let finalFile = file;

    // Only resize if requested, maxDimension provided, and it's an image
    if (options?.maxDimensionCrop && file.type.startsWith('image/')) {
      try {
        finalFile = await this.resizeImageKeepingAspectRatio(
          file,
          options.maxDimensionCrop
        );
      } catch (err) {
        console.log(
          'Image resize failed, uploading original file instead:',
          err
        );
      }
    }

    const reference = ref(this.storage, path);
    await uploadBytes(reference, finalFile);

    const url = await getDownloadURL(reference);
    const base64 = await this.fileToBase64(finalFile);

    return { url, base64 };
  }

  private resizeImageKeepingAspectRatio(
    file: File,
    maxDimension: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        const largestSide = Math.max(originalWidth, originalHeight);

        // If already smaller than or equal to maxDimension, no need to resize
        if (largestSide <= maxDimension) {
          resolve(file);
          return;
        }

        const scale = maxDimension / largestSide;
        const newWidth = Math.round(originalWidth * scale);
        const newHeight = Math.round(originalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }

            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          file.type,
          0.92 // optional quality for JPEG/WebP
        );
      };

      img.onerror = (e) => reject(e);

      // Read the file as a data URL to set as image src
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
