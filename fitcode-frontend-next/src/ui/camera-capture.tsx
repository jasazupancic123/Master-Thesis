import { CameraAlt } from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { useScreenSize } from '@/store/screen-size.provider';

type Props = {
  onCapture: (file: File) => void;
  facingMode?: 'user' | 'environment';
};

export function CameraCapture({
  onCapture,
  facingMode = 'environment',
}: Props) {
  const screenSize = useScreenSize();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function close() {
    stop();
    setOpen(false);
  }

  async function initCamera() {
    setErr(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('Camera not supported in this browser.');
      return;
    }

    try {
      stop();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      // iOS/Safari helpers
      video.muted = true;
      video.setAttribute('playsinline', 'true');

      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video.addEventListener('loadedmetadata', onLoaded);
      });

      await video.play();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message ?? 'Could not access camera.');
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If you mirror the selfie preview, mirror the capture too
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        close();
      },
      'image/jpeg',
      0.92
    );
  }

  // Start camera only after modal is open & video element is mounted
  useEffect(() => {
    if (!open) return;
    initCamera();

    // cleanup when closing / unmounting
    return () => stop();
    // re-init if facingMode changes while open
  }, [open, facingMode]);

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center">
        <IconButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          sx={{ p: 0.5 }}
        >
          <CameraAlt />
        </IconButton>
      </Box>

      {err && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {err}
        </Typography>
      )}

      {open && (
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            zIndex: 1300,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            aspectRatio: screenSize.isMobile ? '9/16' : '16 / 9',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              flex: 1,
              bgcolor: 'black',
              minHeight: 0,
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
                display: 'block',
              }}
            />
          </Box>

          {/* Footer stays visible */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              p: 2,
              borderTop: '1px solid rgba(0,0,0,0.12)',
              bgcolor: 'background.paper',
            }}
            justifyContent="space-between"
          >
            <Button onClick={close} variant="outlined">
              Cancel
            </Button>
            <Button onClick={snap} variant="contained">
              Snap
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
}
