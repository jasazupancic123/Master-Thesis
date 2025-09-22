'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { redirect, RedirectType } from 'next/navigation';
import React from 'react';

import { theme } from '@/app/style';
import {
  LINKS_NAVBAR,
  SIGN_IN_REDIRECT_MAPPER,
} from '@/common/constant/navigation.constant';
import type { ChildrenProps } from '@/common/type/props.type';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { useAuth } from '@/store/auth.provider';

export type AppPageProps = ChildrenProps & {
  title: string;
  description: string;
  id: string;
};

export default function Home() {
  const auth = useAuth();

  if (auth.status === 'authenticated')
    redirect(SIGN_IN_REDIRECT_MAPPER[auth.role].href, RedirectType.replace);
  else
    return (
      <>
        <HeroNavbar />

        {/* Hero */}
        <Box
          id={LINKS_NAVBAR.index.id}
          sx={{
            width: '100%',
            height: '100vh',
            position: 'relative',
            backgroundSize: '100% 5%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
              backgroundColor: 'black',
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'translate(-50%, -50%)',
                zIndex: -1, // Ensure the video stays in the background
                filter: 'grayscale(100%) brightness(80%)',
              }}
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
          </Box>

          <Container
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                component="span"
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: '3rem',
                  textTransform: 'uppercase',
                }}
              >
                Do it right
              </Typography>

              <br />

              <Typography
                component="span"
                variant="h4"
                sx={{
                  color: '#FFF',
                  fontSize: '2.0rem',
                }}
              >
                Coming Soon
              </Typography>
            </Box>
          </Container>
        </Box>
      </>
    );
}
