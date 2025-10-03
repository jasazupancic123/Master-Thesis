'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';

import Logo from '../logo/logo';
import { useScreenSize } from '@/store/screen-size.provider';

interface LoadingOverlayProps {
  title: string;
  children?: React.ReactNode;
  showLogos?: boolean;
}

export default function LoadingOverlay(props: LoadingOverlayProps) {
  const screenSize = useScreenSize();

  const { title, children, showLogos } = props;
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      sx={{
        zIndex: 130000,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      {showLogos && <Logo width={screenSize.isMobile ? 200 : 250} />}
      <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
        <Typography fontSize={20}>{title}</Typography>
        <CircularProgress size={24} />
      </Box>
      {children}
      {showLogos && (
        <Image
          src="/powered_by_aspire.png"
          alt="Powered by Aspire"
          width={screenSize.isMobile ? 200 : 300}
          height={0}
          layout="intrinsic"
        />
      )}
    </Box>
  );
}
