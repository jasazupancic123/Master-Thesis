'use client';

import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React from 'react';

import useFaceCaptureDisplay from './hooks/use-display';
import useFaceCaptureProcessing from './hooks/use-processing';
import useFaceCaptureUtils from './hooks/use-utils';
import FaceCapturePreviewsModal from './modals/face-capture-previews-modal';
import type { FaceCaptures, FacePreviews } from './types/face.type';
import { FaceCaptureStep } from '@/core/user/enum/face-capture-step.enum';
import type { SetState } from '@/lib/common/type/state.type';

export const BASE_ASSET_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.5/wasm';
// export const FACE_LANDMARKER_MODEL_URL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
export const FACE_LANDMARKER_MODEL_URL = `/models/face-landmarker/face_landmarker.task`;

export type FaceCaptureProps = {
  width?: number; // video width (px)
  height?: number; // video height (px)
  setIsCapturingFace: SetState<boolean>;
  previews: FacePreviews;
  setPreviews: SetState<FacePreviews>;
  captures: FaceCaptures;
  setCaptures: SetState<FaceCaptures>;
};

export default function FaceCapture(props: FaceCaptureProps) {
  const {
    width = window.innerWidth,
    height = window.innerHeight,
    setIsCapturingFace,
  } = props;

  const theme = useTheme();

  const faceCaptureDisplay = useFaceCaptureDisplay();
  const faceCaptureUtils = useFaceCaptureUtils();
  const faceCaptureProcessing = useFaceCaptureProcessing({
    input: props,
    useFaceCaptureDisplay: faceCaptureDisplay,
    useFaceCaptureUtils: faceCaptureUtils,
  });

  const { stageRef, overlayRef, drawRef } = faceCaptureDisplay;

  const {
    isActive,
    openModal,
    setOpenModal,
    streamError,
    labelRef,
    isDoneRef,
  } = faceCaptureUtils;

  const { videoRef, stepRef } = faceCaptureProcessing;

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <div>
        <IconButton
          sx={{
            position: 'absolute',
            left: 5,
            top: 5,
            zIndex: 10000,
            p: 0.2,
            backgroundColor: theme.palette.background.default,
          }}
          onClick={() => setIsCapturingFace(false)}
        >
          <Close />
        </IconButton>

        {!openModal && (
          <Typography
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              zIndex: 10000,
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.background.default,
              p: 0.2,
            }}
          >
            {labelRef.current}
          </Typography>
        )}

        {/* Stacked stage */}
        <div
          ref={stageRef}
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{
            width: '100vw',
            height: '100dvh', // dynamic viewport height on mobile (fallbacks below)
            background: '#000',
            position: 'relative',
            display: !isActive ? 'none' : undefined,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain', // 👈 no crop; may letterbox
              display: isActive ? 'block' : 'none',
              transform: 'scaleX(-1)',
            }}
          />

          <canvas
            ref={drawRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
            }}
          />
          <canvas
            ref={overlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Bottom HUD */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))',
            }}
          >
            <div className="text-white text-sm">
              {stepRef.current === FaceCaptureStep.FRONT && (
                <Typography textAlign="center">
                  Step 1/3 – Center your face inside the guide.
                </Typography>
              )}
              {stepRef.current === FaceCaptureStep.RIGHT && (
                <Typography textAlign="center">
                  Step 2/3 – Turn right until we see your right profile.
                </Typography>
              )}
              {stepRef.current === FaceCaptureStep.LEFT &&
                !isDoneRef.current && (
                  <Typography textAlign="center">
                    Step 3/3 – Turn left until we see your left profile.
                  </Typography>
                )}
              {isDoneRef.current && (
                <Typography textAlign="center">
                  All set! You can continue.
                </Typography>
              )}
            </div>
          </div>
        </div>

        {streamError && (
          <Typography textAlign="center">{streamError}</Typography>
        )}
      </div>

      <FaceCapturePreviewsModal
        faceCaptureProps={props}
        faceCaptureUtils={faceCaptureUtils}
        faceCaptureProcessing={faceCaptureProcessing}
        heightWidthRatio={height / width}
        open={openModal}
        setOpen={setOpenModal}
      />
    </Box>
  );
}
