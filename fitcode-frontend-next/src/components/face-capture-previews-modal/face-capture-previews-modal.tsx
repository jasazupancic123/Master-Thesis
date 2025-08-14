'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';
import { UserController } from '@/controller/user/user.controller';
import { useAuth } from '@/store/auth-provider';

interface FaceCapturePreviewsModalProps {
  previews: {
    front?: string;
    right?: string;
    left?: string;
  };
  captures: {
    front?: Blob;
    right?: Blob;
    left?: Blob;
  };
  setIsCapturingFace: SetState<boolean>;
  heightWidthRatio: number;
}

export default function FaceCapturePreviewsModal(
  props: FaceCapturePreviewsModalProps
) {
  const { user, customClaims, setCustomClaims } = useAuth();
  const router = useRouter();

  const { previews, captures, setIsCapturingFace, heightWidthRatio } = props;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      gap={1}
      alignItems="center"
      justifyContent="center"
    >
      <Typography textAlign="center">Previews</Typography>
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        sx={{
          overflowX: 'auto',
        }}
        gap={1}
      >
        {[previews.front, previews.right, previews.left].map(
          (preview, index) => {
            const text =
              preview === previews.front
                ? 'Front'
                : preview === previews.right
                  ? 'Right'
                  : 'Left';
            if (!preview || !captures.front) return null;

            let width = 320;
            let height = 320 * heightWidthRatio;

            if (height > 400) {
              const ratio = 400 / height;
              height *= ratio;
              width *= ratio;
            }

            return (
              <Box key={index} sx={{ position: 'relative' }}>
                <img
                  width={width}
                  height={height}
                  key={index}
                  src={preview}
                  alt={`Face Preview ${index}`}
                />
                <Typography
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 10,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {text}
                </Typography>
              </Box>
            );
          }
        )}
      </Box>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={async () => {
          if (!user) return;

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
                const url = await FirebaseStorageUtil.uploadFile(file, path);

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
              () => UserController.updateClaims(user.uid, updatedCustomClaims),
              () => {
                setCustomClaims(updatedCustomClaims);
                toast.success('Face recognition images uploaded successfully!');
                setIsCapturingFace(false);
              },
              undefined,
              'Failed to post face recognition images'
            );
          } catch (err) {
            toast.error('Failed to upload face images');
          }
        }}
      >
        Upload Face Recognition
      </Button>
    </Box>
  );
}
