'use client';

import { Box, Button, Typography } from '@mui/material';
import { Onest } from 'next/font/google';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

import {} from '@/common/config/firebase.config';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const onest = Onest({ subsets: ['latin'] });

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const mainColor = '#EAFF48';
  const textMainColor = '#D9D9D9';

  return (
    <html>
      <body className={onest.className}>
        <Box
          width="100%"
          height="100vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          gap={1}
        >
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              color: textMainColor,
            }}
          >
            Something went wrong!
          </Typography>
          <Typography variant="body1">{error.message}</Typography>

          <Button
            variant="contained"
            sx={{
              backgroundColor: mainColor,
              color: '#000000',
            }}
            onClick={() => {
              redirect(LINK_SIGN_IN.href);
            }}
          >
            Try again
          </Button>
        </Box>
      </body>
    </html>
  );
}
