'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import Logo from './logo';
import { LINK_SIGN_IN } from '@/lib/common/const/nav.const';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  type: 'loading' | 'unauthorized' | 'error';
  errorMessage?: string;
  color?: string;
}

export default function Alert({ type, errorMessage, color }: Props) {
  const router = useRouter();
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
      <Box sx={{ opacity: 0.75 }}>
        <Logo width={450} style={{ paddingLeft: 20, paddingRight: 20 }} />
      </Box>

      <Typography
        fontSize={18}
        fontWeight={500}
        textAlign="center"
        sx={{ color }}
      >
        {type === 'error' && errorMessage
          ? 'Error: ' + errorMessage[0].toUpperCase() + errorMessage.slice(1)
          : type[0].toUpperCase() + type.slice(1)}
      </Typography>

      {type === 'unauthorized' && (
        <Button
          variant="contained"
          onClick={() => {
            router.push(LINK_SIGN_IN.href);
            router.refresh();
            router.refresh();
          }}
        >
          Sign in
        </Button>
      )}
    </Box>
  );
}
