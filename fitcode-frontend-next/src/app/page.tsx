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
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '@/components/logo/logo';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Image from 'next/image';

export type AppPageProps = ChildrenProps & {
  title: string;
  description: string;
  id: string;
};

export default function Home() {
  const auth = useAuth();
  const screenSize = useScreenSize();
  // const prefersReducedMotion = useReducedMotion();

  if (auth.status === 'authenticated') {
    redirect(SIGN_IN_REDIRECT_MAPPER[auth.role].href, RedirectType.replace);
  }

  // Tunables
  const duration = 1.5;
  const ease = [0.22, 1, 0.36, 1] as const; // 👈 tuple, not number[]

  const prefersReducedMotion = false; // if you use useReducedMotion(), keep the ternaries below

  const logoVariants: Variants = {
    initial: {
      opacity: 0,
      y: 0,
      // only scale if motion is allowed
      scale: prefersReducedMotion ? 1 : 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease,
      },
    },
  };

  const taglineVariants: Variants = {
    initial: {
      opacity: 0,
      y: -20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: duration / 2,
        duration: duration * 1.5,
        ease,
      },
    },
  };

  const initialWidth = screenSize.isMobile || screenSize.isTablet ? 250 : 600;

  return (
    <>
      <HeroNavbar height={HERO_NAVBAR_HEIGHT} />

      {/* Hero */}
      <Box
        display="flex"
        flexDirection="column"
        width="100%"
        height="100vh"
        justifyContent="center"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.primary.main,
          my: 'auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
          initial="initial"
          animate="animate"
        >
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            style={{ willChange: 'transform, opacity' }}
          >
            <Logo width={initialWidth} version="dark" />
          </motion.div>

          {/* Tagline */}
          <motion.div
            variants={taglineVariants}
            style={{
              willChange: 'transform, opacity',
              pointerEvents: 'none',
            }}
          >
            <Image
              src={'/do-it-right.png'}
              alt="Do it right"
              width={initialWidth / 2}
              height={0}
              layout="intrinsic"
            />
            {/* <Typography
              textAlign="center"
              fontSize={screenSize.isMobile ? 26 : 40}
              fontWeight="bold"
              sx={{
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
              }}
            >
              Do it right
            </Typography> */}
          </motion.div>
        </motion.div>
      </Box>
    </>
  );
}
