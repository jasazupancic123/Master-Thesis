'use client';

import React, { createContext, useContext } from 'react';
import { useMediaQuery } from '@mui/material';

interface ScreenSizeContextType {
  isMobile: boolean;
  isLandscapeMobile: boolean;
  isLaptop: boolean;
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const ScreenSizeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isSmallHeight = useMediaQuery('(max-height:600px)');
  const isMobile = useMediaQuery('(max-width:600px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isLandscapeMobile = isSmallHeight && isLandscape;
  const isLaptop = useMediaQuery('(min-width:1024px)');

  return (
    <ScreenSizeContext.Provider
      value={{ isMobile, isLandscapeMobile, isLaptop }}
    >
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => {
  const context = useContext(ScreenSizeContext);
  if (!context) {
    throw new Error('useScreenSize must be used within a ScreenSizeProvider');
  }
  return context;
};
