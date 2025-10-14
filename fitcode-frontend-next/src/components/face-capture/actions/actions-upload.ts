import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { FaceCaptures } from '../types/face.type';
import type { FirebaseStorageUtil } from '@/common/firebase/firebase-storage.util';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { AuthController } from '@/controller/auth/auth.controller';
import type { CustomClaims } from '@/controller/auth/type/custom-claims.type';
import type { AuthUser } from '@/controller/auth/type/user.type';

export async function uploadFaceCaptures(state: {
  customClaims: CustomClaims;
  setCustomClaims: (claims: CustomClaims) => void;
  captures: FaceCaptures;
  user: AuthUser;
  firebaseStorage: FirebaseStorageUtil;
  router: AppRouterInstance;
  authController: AuthController;
  setIsCapturingFace: SetState<boolean>;
}) {
  const {
    customClaims,
    setCustomClaims,
    captures,
    user,
    firebaseStorage,
    router,
    authController,
    setIsCapturingFace,
  } = state;

  // start with whatever roles you already have
  const updatedCustomClaims: CustomClaims = {
    role: customClaims?.role ?? [], // keep existing roles
  };

  // collect entries that actually have blobs
  const entries = Object.entries(captures).filter(
    ([_view, blob]) => !!blob
  ) as [keyof typeof captures, Blob][];

  try {
    // run uploads in parallel and populate URLs on the object
    await Promise.all(
      entries.map(async ([view, blob]) => {
        const file = new File([blob], `${view}.jpg`, {
          type: blob.type || 'image/jpeg',
        });

        const path = `user/${user.uid}/${file.name}`;
        const url = await firebaseStorage.uploadFile(file, path);

        switch (view) {
          case 'front':
            updatedCustomClaims.faceFrontUrl = url;
            break;
          case 'right':
            updatedCustomClaims.faceRightUrl = url;
            break;
          case 'left':
            updatedCustomClaims.faceLeftUrl = url;
            break;
        }
      })
    );

    await handleApiRequest(
      router,
      () => authController.updateCustomClaims(user.uid, updatedCustomClaims),
      () => {
        setCustomClaims(updatedCustomClaims);
        toast.success('Face recognition images uploaded successfully!');
        setIsCapturingFace(false);
      },
      undefined,
      'Failed to post face recognition images'
    );
  } catch (_) {
    toast.error('Failed to upload face images');
  }
}
