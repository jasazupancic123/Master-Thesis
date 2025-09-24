'use client';
import { Box, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';

import Logo from '@/components/logo/logo';
import { useScreenSize } from '@/store/screen-size.provider';

interface AnimationProps {
  duration?: number; // in milliseconds
}

export default function Animation(props: AnimationProps) {
  const screenSize = useScreenSize();

  const { duration = 6000 } = props;

  useEffect(() => {
    const timer = setTimeout(() => {}, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="100vh"
      justifyContent="center"
      alignItems="center"
      sx={{
        my: 'auto',
      }}
    >
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="flex justify-center items-center h-screen bg-black"
      >
        <Logo width={screenSize.isMobile ? 200 : 600} />
      </motion.div>
      <motion.div
        initial={{ y: -200, opacity: 0 }}
        animate={{ x: 0, y: screenSize.isMobile ? 10 : 30, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="flex justify-center items-center h-screen bg-black"
      >
        <Image
          src="/powered_by_aspire.png"
          alt="Powered by Aspire"
          width={screenSize.isMobile ? 200 : 400}
          height={0}
          layout="intrinsic"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 1, ease: 'easeInOut' }}
      >
        <CircularProgress
          size={screenSize.isMobile ? 24 : undefined}
          sx={{ mt: screenSize.isMobile ? 3 : 6 }}
        />
      </motion.div>
    </Box>
  );
}
