'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import CameraSquat from '@/components/mediapipe-react-app/components/CameraSquat/CameraSquat';
import { Close } from '@mui/icons-material';
import { useScreenSize } from '@/context/screen-size-provider';
import '@mediapipe/pose';
import type { Pose as PoseType, PoseConfig } from '@mediapipe/pose';
import { PoseLandmarker } from '@mediapipe/tasks-vision';

const Pose = window.Pose as { new (config?: PoseConfig): PoseType };

interface MediapipePoseDetectionProps {
  setOpenCameraPoseDetection: (value: boolean) => void;
}

export default function MediapipePoseDetection(
  props: MediapipePoseDetectionProps
) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <iframe
        src="https://detrack.netlify.app/"
        width={1000}
        height={600}
        style={{ border: 'none', margin: 'auto' }}
        allowFullScreen
        allow="camera; microphone"
      />
    </Box>
  );

  const { setOpenCameraPoseDetection } = props;

  const screenSize = useScreenSize();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poseResults, setPoseResults] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  //const [POSE_LANDMARKS, setPoseLandmarks] = useState(window.POSE_LANDMARKS);
  const [POSE_LANDMARKS, setPoseLandmarks] = useState({
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    LEFT_RIGHT: 9,
    RIGHT_LEFT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
  });

  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);

  useEffect(() => {
    const checkMediaPipe = () => {
      import('@mediapipe/pose').then((module) => {
        import('@mediapipe/camera_utils').then((module) => {
          if (window.Pose && window.Camera) {
            console.log(
              '✅ MediaPipe Loaded!',
              window.Pose,
              window.Camera,
              window.POSE_LANDMARKS
            );
            setIsMediaPipeLoaded(true);
            clearInterval(interval);
          }
        });
      });
    };

    const interval = setInterval(checkMediaPipe, 100);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!isMediaPipeLoaded) return;
    let camera: any;
    import('@mediapipe/pose').then((module) => {
      //console.log('window.POSE_LANDMARKS', window.POSE_LANDMARKS);
      //setPoseLandmarks(window.POSE_LANDMARKS);
      import('@mediapipe/camera_utils').then((module) => {
        const pose = new window.Pose({
          locateFile: (file: any) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        console.log('window.Camera AFTER MODULE IMPORT', window.Camera);
        const Camera = window.Camera;

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: any) => {
          setPoseResults(results);

          if (canvasRef.current && results.poseLandmarks) {
            const ctx = canvasRef.current.getContext('2d');
            const video = videoRef.current;
            if (!video || !ctx) return;
            const displayWidth = video.clientWidth;
            const displayHeight = video.clientHeight;

            // Resize canvas
            canvasRef.current.width = displayWidth;
            canvasRef.current.height = displayHeight;

            ctx.clearRect(0, 0, displayWidth, displayHeight);

            // Draw landmarks manually if drawLandmarks is missing
            //   results.poseLandmarks.forEach((landmark: any) => {
            //     ctx.beginPath();
            //     ctx.arc(
            //       landmark.x * displayWidth,
            //       landmark.y * displayHeight,
            //       5,
            //       0,
            //       2 * Math.PI
            //     );
            //     ctx.fillStyle = 'red';
            //     ctx.fill();
            //   });
          }
        });

        if (cameraActive && videoRef.current) {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              await pose.send({ image: videoRef.current! });
            },
            width: 1280,
            height: 720,
          });
          if (!camera) return;
          camera.start();
        }

        return () => {
          if (camera) {
            camera.stop();
          }
          pose.close();
        };
      });
    });
  }, [cameraActive, window, window.Pose, window.Camera, isMediaPipeLoaded]);

  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      // Stop Camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } else {
      // Start Camera
      navigator.mediaDevices
        .getUserMedia({
          video: {
            aspectRatio: 16 / 9,
            width: { ideal: 1280 },
            frameRate: { ideal: 60 },
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('Error accessing the camera:', err);
        });
    }
    setCameraActive(!cameraActive);
  }, [cameraActive]);

  return (
    <Box>
      <IconButton
        onClick={() => setOpenCameraPoseDetection(false)}
        sx={{ position: 'absolute', top: 20, right: 50, m: 0, p: 0 }}
      >
        <Close />
      </IconButton>
      <Button
        onClick={toggleCamera}
        variant="contained"
        sx={{ margin: 'auto' }}
      >
        {cameraActive ? 'Stop Camera' : 'Start Camera'}
      </Button>
      <video
        ref={videoRef}
        className="input-video"
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        // style={{
        //     width: screenSize.isMobile ? undefined : '100%',
        //     height: screenSize.isMobile ? '100vh' : '100%',
        //     zIndex: 1,
        //   }}
      />
      <canvas
        ref={canvasRef}
        className="output-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      ></canvas>
      {poseResults && (
        <CameraSquat
          poseResults={poseResults}
          videoRef={videoRef}
          canvasRef={canvasRef}
          poseLandmarks={POSE_LANDMARKS}
        />
      )}
    </Box>
  );
}
