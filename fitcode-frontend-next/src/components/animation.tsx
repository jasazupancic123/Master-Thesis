import { Box, LinearProgress } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useScreenSize } from '@/context/screen-size-provider';
import Image from 'next/image';

interface AnimationProps {
  text: string;
  onEnd: () => void;
  fullScreen?: boolean;
}

export default function Animation(props: AnimationProps) {
  const screenSize = useScreenSize();
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 10 : prevProgress + 1
      );
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      props.onEnd();
    }
  }, [progress]);

  return (
    <Box
      sx={{
        position: props.fullScreen ? 'absolute' : undefined,
        top: props.fullScreen ? 0 : undefined,
        left: props.fullScreen ? 0 : undefined,
        width: props.fullScreen ? '100vw' : undefined,
        height: props.fullScreen ? '100vh' : undefined,
        backgroundColor: props.fullScreen ? 'background.default' : undefined,
        display: 'flex',
        pt: !props.fullScreen ? (screenSize.isMobile ? 20 : 13) : undefined,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100000,
      }}
    >
      <video
        style={{
          backgroundColor: 'transparent',
          mixBlendMode: 'normal',
          filter: 'contrast(1) brightness(1)',
        }}
        ref={videoRef}
        autoPlay
        muted
        width={screenSize.isMobile ? '100%' : '33%'}
        src="/fitcode_animation.mp4"
      />
      <div className="flex flex-col items-center justify-center h-screen bg-gray-800">
        <p className="text-gray-300 text-lg font-bold tracking-wider uppercase mb-2">
          {props.text}
        </p>
        <LinearProgress variant="determinate" value={progress} />
      </div>
      <Image
        src="/powered_by_aspire.png"
        alt="Powered by Aspire"
        width={screenSize.isSmallerThanLaptop ? 320.5 : 427}
        height={screenSize.isSmallerThanLaptop ? 30 : 40}
        style={{ marginTop: 20, transform: 'translate(-8.5%, -10%)' }}
      />
    </Box>
  );
}
