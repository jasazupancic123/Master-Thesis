'use client';

import React, { createContext, useContext } from 'react';
import { useMediaQuery } from '@mui/material';
import { ChildrenProps } from '@/common/type/props.type';

interface ScreenSizeContextType {
  isMobile: boolean;
  isLandscapeMobile: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isSmallerThanLaptop: boolean;
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const ScreenSizeProvider = ({ children }: ChildrenProps) => {
  const isSmallHeight = useMediaQuery('(max-height:600px)');
  const isMobile = useMediaQuery('(max-width:600px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isLandscapeMobile = isSmallHeight && isLandscape;
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1024px)');
  const isLaptop = useMediaQuery(
    '(min-width:1024px) and (max-width:1700px) and (max-height:1100px) and (min-aspect-ratio:4/3)'
  );
  const isDesktop = useMediaQuery('(min-width:1700px)');

  const isSmallerThanLaptop = useMediaQuery('(max-width:1024px)');

  return (
    <ScreenSizeContext.Provider
      value={{
        isMobile,
        isLandscapeMobile,
        isLaptop,
        isDesktop,
        isTablet,
        isSmallerThanLaptop,
      }}
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
