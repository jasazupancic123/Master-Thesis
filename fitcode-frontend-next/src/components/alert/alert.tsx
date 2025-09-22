'use client';

import { Box, Button, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import Logo from '../logo/logo';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { useScreenSize } from '@/store/screen-size.provider';

interface AlertProps {
  type: 'loading' | 'unauthorized';
}

export default function Alert(props: AlertProps) {
  const { type } = props;
  const screenSize = useScreenSize();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        width: '100%',
        height: screenSize.isMobile ? '80vh' : '100vh',
        position: 'relative',
      }}
      gap={2}
    >
      <Box
        sx={{
          opacity: 0.75,
        }}
      >
        <Logo width={450} />
      </Box>

      <Typography fontSize={18} fontWeight={500} textAlign="center">
        {type[0].toUpperCase() + type.slice(1)}
      </Typography>
      {type === 'unauthorized' && (
        <Button
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
