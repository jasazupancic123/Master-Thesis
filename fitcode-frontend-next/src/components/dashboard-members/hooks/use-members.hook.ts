import { useEffect, useState } from 'react';

import type { User } from '@/core/user/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useDashboardMembers() {
  const { institution } = useMain();

  const [openRegisterAthletesModal, setOpenRegisterAthletesModal] =
    useState(false);
  const [openRegisterTrainersModal, setOpenRegisterTrainersModal] =
    useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  const [search, setSearch] = useState('');

  const [includeTrainers, setIncludeTrainers] = useState(true);
  const [includeAthletes, setIncludeAthletes] = useState(true);

  const [allInstitutionMembers, setAllInstitutionMembers] = useState<User[]>(
    (institution?.trainers || [])
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
      .concat(
        (institution?.athletes || []).sort((a, b) =>
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
      (institution?.trainers || []).concat(institution?.athletes || [])
    );
  }, [institution]);

  const [filteredMembers, setFilteredMembers] = useState(allInstitutionMembers);

  useEffect(() => {
    let members: User[] = [];
    if (includeTrainers) {
      members = members.concat(institution?.trainers || []);
    }
    if (includeAthletes) {
      members = members.concat(institution?.athletes || []);
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
