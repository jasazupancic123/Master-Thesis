'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { redirect, RedirectType } from 'next/navigation';
import React from 'react';

import { HERO_NAVBAR_HEIGHT } from './state';
import { theme } from '@/app/style';
import { SIGN_IN_REDIRECT_MAPPER } from '@/common/constant/navigation.constant';
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
        <HeroNavbar height={HERO_NAVBAR_HEIGHT} />

        {/* Hero */}
        <Box
          sx={{
            width: '100%',
            height: `calc(100vh - ${HERO_NAVBAR_HEIGHT})`,
            position: 'relative',
            backgroundColor: theme.palette.primary.main,
            mt: HERO_NAVBAR_HEIGHT,
            overflowX: 'hidden',
            overflowY: 'hidden',
          }}
        >
          <Typography
            component="div"
            fontSize={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
            sx={{
              fontWeight: 800,
              display: 'inline-block',
              lineHeight: 1, // or 1.1
              color: theme.palette.text.secondary,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              animation: 'scroll-left 6s linear infinite',
              '@keyframes scroll-left': {
                '0%': { transform: 'translateX(42.5%)' },
                '100%': { transform: 'translateX(-100%)' },
              },
            }}
          >
            DO IT RIGHT
          </Typography>
        </Box>
      </>
    );
}
