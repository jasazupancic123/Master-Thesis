import { Box, Typography } from '@mui/material';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { theme } from '@/app/style';
import {
  ASPIRE_LOGO_IMG_URL,
  DO_IT_RIGHT_IMG_URL,
} from '@/lib/common/const/image.const';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '@/util/logo/logo';

export default function Hero() {
  const screenSize = useScreenSize();
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

  const aspireLogoVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        delay: 4,
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
        delay: 6,
        duration: 2,
        ease,
      },
    },
  };

  const initialLogoWidth = screenSize.isSmallerThanLaptop ? 250 : 500;
  const initialAspireLogoWidth = screenSize.isSmallerThanLaptop ? 75 : 120;

  return (
    <Box
      id="home"
      display="flex"
      flexDirection="column"
      width="100%"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      sx={{
        my: 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          height: '100vh',
          position: 'relative',
          display: 'flex',
          justifyContent: screenSize.isSmallerThanLaptop
            ? 'center'
            : 'space-evenly',
          gap: screenSize.isLandscapeMobile
            ? 20
            : screenSize.isSmallerThanLaptop
              ? 60
              : undefined,
          alignItems: 'center',
          flexDirection: 'column',
          padding: '10vh 0vh',
        }}
        initial="initial"
        animate="animate"
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            style={{ willChange: 'transform, opacity' }}
          >
            <Logo width={initialLogoWidth} version="dark" />
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
              src={DO_IT_RIGHT_IMG_URL}
              alt="Do it right"
              width={initialLogoWidth / 2}
              height={0} // not 0
              style={{ height: 'auto' }} // keeps aspect ratio while preventing stretch
              className="block" // removes baseline gap
            />
          </motion.div>
        </Box>
        <motion.div
          variants={aspireLogoVariants}
          style={{
            willChange: 'transform, opacity',
            pointerEvents: 'none',
          }}
        >
          <Image
            src={ASPIRE_LOGO_IMG_URL}
            alt="Aspire Logo"
            width={initialAspireLogoWidth}
            height={0} // not 0
            style={{ height: 'auto' }} // keeps aspect ratio while preventing stretch
            className="block" // removes baseline gap
          />
        </motion.div>
        <motion.div
          variants={comingSoonVariants}
          style={{ willChange: 'opacity' }}
        >
          <Typography
            textAlign="center"
            fontSize={screenSize.isSmallerThanLaptop ? 15 : 28}
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
  );
}
