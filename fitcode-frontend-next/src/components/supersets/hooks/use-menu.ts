import { useState } from 'react';

export default function useSupersetExerciseMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);

  return {
    anchorEl,
    setAnchorEl,
    handleMenuClick,
    open,
  };
}
