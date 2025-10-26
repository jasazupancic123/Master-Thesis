import { useState } from 'react';

export default function useDashboardHeaderUtils() {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openInstitutionsMenu, setOpenInstitutionsMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  const [anchorInstitutionsEl, setAnchorInstitutionsEl] =
    useState<HTMLElement | null>(null);

  const [openEditInstitutionModal, setOpenEditInstitutionModal] =
    useState(false);

  return {
    openProfileMenu,
    setOpenProfileMenu,
    openInstitutionsMenu,
    setOpenInstitutionsMenu,
    anchorProfileEl,
    setAnchorProfileEl,
    anchorInstitutionsEl,
    setAnchorInstitutionsEl,
    openEditInstitutionModal,
    setOpenEditInstitutionModal,
  };
}
