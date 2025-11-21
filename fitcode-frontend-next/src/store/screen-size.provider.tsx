'use client';

import { useMediaQuery } from '@mui/material';
import React, { createContext, useContext } from 'react';

interface Props {
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
  isUltraSmallTablet: boolean;
  isSmallTablet: boolean;
  isSmallerThanLaptop: boolean;
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  isTouchDevice: boolean;
}

const ScreenSizeContext = createContext<Props | undefined>(undefined);

export const ScreenSizeProvider = ({ children }: React.PropsWithChildren) => {
  const isGigaSmall = useMediaQuery('(max-width:275px)');
  const isUltraSmall = useMediaQuery('(max-width:330px)');
  const isReallySmall = useMediaQuery('(max-width:360px)');
  const isSmallMobile = useMediaQuery('(max-width:450px)');
  const isSmallHeight = useMediaQuery('(max-height:600px)');
  const isMobile = useMediaQuery('(max-width:600px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isLandscapeMobile = isSmallHeight && isLandscape;
  const isUltraSmallTablet = useMediaQuery(
    '(min-width:600px) and (max-width:700px)'
  );
  const isSmallTablet = useMediaQuery(
    '(min-width:600px) and (max-width:800px)'
  );
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1024px)');
  const isDesktop = useMediaQuery('(min-width:1700px)');
  const isSmallerThanLaptop = useMediaQuery(
    '(max-width:1024px) or (max-height:650px)'
  );
  const isSmallLaptop = useMediaQuery(
    '(min-width:1024px) and (max-width:1240px)'
  );
  const isLaptop = useMediaQuery('(min-width:1024px) and (max-width:1700px)');

  const xs = useMediaQuery('(max-width:599px)');
  const sm = useMediaQuery('(min-width:599px) and (max-width:899px)');
  const md = useMediaQuery('(min-width:899px) and (max-width:1199px)');
  const lg = useMediaQuery('(min-width:1199px) and (max-width:1535px)');
  const xl = useMediaQuery('(min-width:1535px)');

  const isTouchDevice =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

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
        isUltraSmallTablet,
        isSmallerThanLaptop,
        isSmallMobile,
        xs,
        sm,
        md,
        lg,
        xl,
        isTouchDevice,
      }}
    >
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => useContext(ScreenSizeContext)!;
