'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { reset } from '../actions/actions-processing';
import { uploadFaceCaptures } from '../actions/actions-upload';
import type { FaceCaptureProps } from '../face-capture';
import type { UseFaceCaptureProcessingReturnType } from '../hooks/use-processing';
import type { UseFaceCaptureUtilsReturnType } from '../hooks/use-utils';
import { AuthController } from '@/core/auth/auth.controller';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import MyModal from '@/ui/modal';

interface FaceCapturePreviewsModalProps {
  faceCaptureProps: FaceCaptureProps;
  faceCaptureUtils: UseFaceCaptureUtilsReturnType;
  faceCaptureProcessing: UseFaceCaptureProcessingReturnType;
  heightWidthRatio: number;
}

export default function FaceCapturePreviewsModal(
  props: FaceCapturePreviewsModalProps & ModalProps
) {
  const router = useRouter();

  const {
    faceCaptureProps,
    faceCaptureUtils,
    faceCaptureProcessing,
    heightWidthRatio,
    open,
    setOpen,
  } = props;

  const { user } = useAuthenticatedAuth();

  const { setCaptures, setPreviews, previews, captures, setIsCapturingFace } =
    faceCaptureProps;

  const { stepRef } = faceCaptureProcessing;

  const { isDoneRef, setIsActive } = faceCaptureUtils;

  const authController = AuthController.getInstance();

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => {
        reset({ setCaptures, setPreviews, stepRef, isDoneRef, setIsActive });
        setOpen(false);
      }}
      cancelText="Cancel"
      sx={{ width: '100%' }}
    >
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

            await uploadFaceCaptures({
              captures,
              user,
              router,
              authController,
              setIsCapturingFace,
            });
          }}
        >
          Upload Face Recognition
        </Button>
      </Box>
    </MyModal>
  );
}
