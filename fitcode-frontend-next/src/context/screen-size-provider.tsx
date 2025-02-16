'use client';

import React, { createContext, useContext } from 'react';
import { useMediaQuery } from '@mui/material';
import { ChildrenProps } from '@/common/type/props.type';

interface ScreenSizeContextType {
  isMobile: boolean;
  isLandscapeMobile: boolean;
  isLaptop: boolean;
}

const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const ScreenSizeProvider = ({ children }: ChildrenProps) => {
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

export const useScreenSize = () => useContext(ScreenSizeContext)!;
