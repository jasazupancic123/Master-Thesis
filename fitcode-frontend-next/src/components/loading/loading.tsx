'use client';

import { Box, Typography } from '@mui/material';
import Logo from '../logo/logo';
import { useScreenSize } from '@/store/screen-size-provider';

interface LoadingProps {
  text: string;
}

export default function Loading(props: LoadingProps) {
  const { text } = props;

  const screenSize = useScreenSize();
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        width: '100%',
        height: screenSize.isMobile ? '80vh' : '100vh',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: 0.07,
        }}
      >
        <Logo version="narrow" height={100} width={150} />
      </Box>
      <Typography fontSize={18} fontWeight={500} textAlign="center">
        {text}
      </Typography>
    </Box>
  );
}
