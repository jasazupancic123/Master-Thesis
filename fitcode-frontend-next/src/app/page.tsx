'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import { redirect, RedirectType } from 'next/navigation';
import React from 'react';

import { HERO_NAVBAR_HEIGHT } from './state';
import { theme } from '@/app/style';
import { SIGN_IN_REDIRECT_MAPPER } from '@/common/constant/navigation.constant';
import type { ChildrenProps } from '@/common/type/props.type';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import Logo from '@/components/logo/logo';
import { useAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';

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
  const duration = 3;
  const ease = [0.22, 0.3, 0.3, 1] as const;

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
        duration: 3,
        // ease,
      },
    },
  };

  const taglineVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0,
      y: -20,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 2,
        duration: 2,
        ease,
      },
    },
  };

  const comingSoonVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        delay: 5,
        duration: 2,
        ease,
      },
    },
  };

  const initialWidth = screenSize.isMobile || screenSize.isTablet ? 250 : 600;

  return (
    <>
      <HeroNavbar height={HERO_NAVBAR_HEIGHT} dissableLogo />

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
              src="/do-it-right.png"
              alt="Do it right"
              width={initialWidth / 2}
              height={0} // not 0
              style={{ height: 'auto' }} // keeps aspect ratio while preventing stretch
              className="block" // removes baseline gap
            />
          </motion.div>
          <motion.div
            variants={comingSoonVariants}
            style={{ willChange: 'opacity', marginTop: 40 }}
          >
            <Typography
              textAlign="center"
              fontSize={screenSize.isMobile ? 15 : 30}
              fontWeight={600}
              lineHeight={1}
              sx={{
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
              }}
            >
              COMING SOON
            </Typography>
          </motion.div>
        </motion.div>
      </Box>
    </>
  );
}
