import { useEffect, useState } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
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

  const [includeTrainers, setIncludeTrainers] = useState(true);
  const [includeAthletes, setIncludeAthletes] = useState(true);

  const [allInstitutionMembers, setAllInstitutionMembers] = useState(
    (selectedInstitution?.trainers || [])
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
      .concat(
        (selectedInstitution?.athletes || []).sort((a, b) =>
          (a.displayName || '').localeCompare(b.displayName || '')
        )
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
    let members: AuthUser[] = [];

    if (includeTrainers) {
      members = members.concat(selectedInstitution?.trainers || []);
    }
    if (includeAthletes) {
      members = members.concat(selectedInstitution?.athletes || []);
    }

    setAllInstitutionMembers(members);
  }, [includeTrainers, includeAthletes]);

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
    includeTrainers,
    setIncludeTrainers,
    includeAthletes,
    setIncludeAthletes,
    openRegisterAthletesModal,
    setOpenRegisterAthletesModal,
    openRegisterTrainersModal,
    setOpenRegisterTrainersModal,
    openAddMemberViaCsvModal,
    setOpenAddMemberViaCsvModal,
  };
}
