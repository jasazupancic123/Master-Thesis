import { useState } from 'react';

export default function useSupersetExerciseMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  return {
    anchorEl,
    setAnchorEl,
    handleMenuClick,
    open,
  };
}
