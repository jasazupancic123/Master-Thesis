import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { FaceCaptures } from '../types/face.type';
import type { AuthController } from '@/core/auth/auth.controller';
import { FaceEncoderController } from '@/core/face-encoder/face-encoder.controller';
import type { User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';

export async function uploadFaceCaptures(state: {
  captures: FaceCaptures;
  user: User;
  router: AppRouterInstance;
  authController: AuthController;
  setIsCapturingFace: SetState<boolean>;
}) {
  const { captures, user } = state;

  // collect entries that actually have blobs
  const entries = Object.entries(captures).filter(
    ([_view, blob]) => !!blob
  ) as [keyof typeof captures, Blob][];

  let frontImageBase64: string | undefined = undefined;

  try {
    // run uploads in parallel and populate URLs on the object
    await Promise.all(
      entries.map(async ([view, blob]) => {
        const file = new File([blob], `${view}.jpg`, {
          type: blob.type || 'image/jpeg',
        });

        const path = `user/${user.uid}/${file.name}`;
        const { base64 } = await lib.firebase.storage.uploadFileWithBase64(
          file,
          path,
          { maxDimensionCrop: 1000 }
        );

        if (view === 'front') frontImageBase64 = base64;
      })
    );

    if (!frontImageBase64) {
      toast.error('Front face image not uploaded');
      return;
    }

    const res = await new FaceEncoderController().embed(frontImageBase64);
    if (!res.faceEmbedding || res.faceEmbedding.length === 0) {
      toast.error('Empty face embeddings received');
      return;
    }

    await UserController.getInstance().saveFaceEmbeddings(res.faceEmbedding);
    toast.success('Face images uploaded successfully');
  } catch (e) {
    console.error('Error uploading face images', e);
    toast.error('Failed to upload face images');
  }
}
