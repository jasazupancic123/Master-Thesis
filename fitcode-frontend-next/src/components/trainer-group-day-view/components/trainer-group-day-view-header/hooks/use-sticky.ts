import { useScreenSize } from '@/store/screen-size.provider';
import { useEffect, useState } from 'react';

export const useTrainerDayViewHeaderSticky = () => {
  const screenSize = useScreenSize();

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (screenSize.isMobile || screenSize.isLandscapeMobile) return;

    const handleScroll = () => {
      if (screenSize.isMobile || screenSize.isLandscapeMobile) return;
      if (screenSize.isSmallerThanLaptop) {
        setIsSticky(false);
        return;
      }

      const scrollY = window.scrollY;
      const screenHeight = window.innerHeight;
      setIsSticky(scrollY > screenHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [screenSize]);

  return {
    isSticky,
    setIsSticky,
  };
};
