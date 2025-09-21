'use client';

import { useMediaQuery } from '@mui/material';
import React, { createContext, useContext } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';

interface ScreenSizeContextType {
  isGigaSmall: boolean;
  isUltraSmall: boolean;
  isReallySmall: boolean;
  isSmallMobile: boolean;
  isMobile: boolean;
  isLandscapeMobile: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isSmallLaptop: boolean;
  isSmallTablet: boolean;
  isSmallerThanLaptop: boolean;
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const ScreenSizeProvider = ({ children }: ChildrenProps) => {
  const isGigaSmall = useMediaQuery('(max-width:275px)');
  const isUltraSmall = useMediaQuery('(max-width:330px)');
  const isReallySmall = useMediaQuery('(max-width:360px)');
  const isSmallMobile = useMediaQuery('(max-width:450px)');
  const isSmallHeight = useMediaQuery('(max-height:600px)');
  const isMobile = useMediaQuery('(max-width:600px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isLandscapeMobile = isSmallHeight && isLandscape;
  const isSmallTablet = useMediaQuery(
    '(min-width:600px) and (max-width:800px)'
  );
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1024px)');
  const isDesktop = useMediaQuery('(min-width:1700px)');
  const isSmallerThanLaptop = useMediaQuery('(max-width:1024px)');
  const isSmallLaptop = useMediaQuery(
    '(min-width:1024px) and (max-width:1240px)'
  );
  const isLaptop = useMediaQuery(
    '(min-width:1024px) and (max-width:1700px) and (max-height:1100px) and (min-aspect-ratio:4/3)'
  );

  return (
    <ScreenSizeContext.Provider
      value={{
        isGigaSmall,
        isUltraSmall,
        isReallySmall,
        isMobile,
        isLandscapeMobile,
        isLaptop,
        isDesktop,
        isTablet,
        isSmallTablet,
        isSmallLaptop,
        isSmallerThanLaptop,
        isSmallMobile,
      }}
    >
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => useContext(ScreenSizeContext)!;
