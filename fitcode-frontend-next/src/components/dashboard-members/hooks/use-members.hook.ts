import { useEffect, useState } from 'react';

import { useDashboard } from '@/store/dashboard.provider';

export default function useDashboardMembers() {
  const { selectedInstitution } = useDashboard();

  const [openRegisterAthletesModal, setOpenRegisterAthletesModal] =
    useState(false);
  const [openRegisterTrainersModal, setOpenRegisterTrainersModal] =
    useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  const [search, setSearch] = useState('');

  const [allInstitutionMembers, setAllInstitutionMembers] = useState(
    (selectedInstitution?.trainers || []).concat(
      selectedInstitution?.athletes || []
    )
  );

  const [hoveredUser, setHoveredUser] = useState<{
    userId: string | null;
    groupId: string | null;
  }>({ userId: null, groupId: null });

  useEffect(() => {
    setAllInstitutionMembers(
      (selectedInstitution?.trainers || []).concat(
        selectedInstitution?.athletes || []
      )
    );
  }, [selectedInstitution]);

  const [filteredMembers, setFilteredMembers] = useState(allInstitutionMembers);

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase();

    setFilteredMembers(
      allInstitutionMembers.filter((member) => {
        const name = (member.displayName ?? '').toLowerCase();
        return name.includes(normalizedSearch);
      })
    );
  }, [allInstitutionMembers, search]);

  return {
    search,
    setSearch,
    filteredMembers,
    allInstitutionMembers,
    hoveredUser,
    setHoveredUser,
    openRegisterAthletesModal,
    setOpenRegisterAthletesModal,
    openRegisterTrainersModal,
    setOpenRegisterTrainersModal,
    openAddMemberViaCsvModal,
    setOpenAddMemberViaCsvModal,
  };
}
