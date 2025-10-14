import { useEffect, useState } from 'react';

export default function useTrainerCycleViewSticky() {
  const [isSticky, setIsSticky] = useState(false);

  // effect to track scroll position and set sticky mode
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    isSticky,
    setIsSticky,
  };
}
