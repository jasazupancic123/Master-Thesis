'use client';

import { Box, Button, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import Logo from '../logo/logo';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { useScreenSize } from '@/store/screen-size-provider';

interface AlertProps {
  type: 'loading' | 'unauthorized';
}

export default function Alert(props: AlertProps) {
  const { type } = props;
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
        {type[0].toUpperCase() + type.slice(1)}
      </Typography>
      {type === 'unauthorized' && (
        <Button
          sx={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          variant="contained"
          onClick={() => {
            redirect(LINK_SIGN_IN.href);
          }}
        >
          Sign in
        </Button>
      )}
    </Box>
  );
}
