'use client';

import { ChildrenProps } from '@/common/type/props.type';
import { useMediaQuery } from '@mui/material';
import React, { createContext, useContext } from 'react';

interface ScreenSizeContextType {
  isGigaSmall: boolean;
  isUltraSmall: boolean;
  isReallySmall: boolean;
  isMobile: boolean;
  isLandscapeMobile: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isSmallTablet: boolean;
  isSmallerThanLaptop: boolean;
  isBetween: (min: number, max: number) => boolean;
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const ScreenSizeProvider = ({ children }: ChildrenProps) => {
  const isGigaSmall = useMediaQuery('(max-width:275px)');
  const isUltraSmall = useMediaQuery('(max-width:330px)');
  const isReallySmall = useMediaQuery('(max-width:360px)');
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
  const isLaptop = useMediaQuery(
    '(min-width:1024px) and (max-width:1700px) and (max-height:1100px) and (min-aspect-ratio:4/3)'
  );

  const isBetween = (min: number, max: number) => {
    return useMediaQuery(`(min-width:${min}px) and (max-width:${max}px)`);
  };

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
        isSmallerThanLaptop,
        isBetween,
      }}
    >
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => useContext(ScreenSizeContext)!;
