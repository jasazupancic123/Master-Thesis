import { useState } from 'react';

export default function useDashboardMembers() {
  const [openRegisterAthletesModal, setOpenRegisterAthletesModal] =
    useState(false);
  const [openRegisterTrainersModal, setOpenRegisterTrainersModal] =
    useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  const [search, setSearch] = useState('');

  return {
    search,
    setSearch,
    openRegisterAthletesModal,
    setOpenRegisterAthletesModal,
    openRegisterTrainersModal,
    setOpenRegisterTrainersModal,
    openAddMemberViaCsvModal,
    setOpenAddMemberViaCsvModal,
  };
}
