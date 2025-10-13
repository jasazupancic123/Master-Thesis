import { useState } from 'react';

export default function useDashboardGroupsMembersUtils() {
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);

  return {
    openEditAthleteModal,
    setOpenEditAthleteModal,
    openAddMemberModal,
    setOpenAddMemberModal,
  };
}
