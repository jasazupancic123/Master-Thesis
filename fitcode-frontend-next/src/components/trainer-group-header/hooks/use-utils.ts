import { useState } from 'react';

export default function useTrainerGroupHeaderUtils() {
  const [isUpdatingTraining, setIsUpdatingTraining] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  return {
    isUpdatingTraining,
    setIsUpdatingTraining,
    openDrawer,
    setOpenDrawer,
    openProfileMenu,
    setOpenProfileMenu,
    addMemberModal,
    setAddMemberModal,
    anchorProfileEl,
    setAnchorProfileEl,
  };
}
