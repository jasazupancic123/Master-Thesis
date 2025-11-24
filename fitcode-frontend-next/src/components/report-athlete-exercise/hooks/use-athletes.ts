import { useMemo, useState } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useAthleteExerciseReportAthletes(
  passedUserId?: string,
  passedUserIds?: string[]
) {
  const { users } = useMain();
  const { selectedGroups } = useDashboard();

  const [selectedAthlete, setSelectedAthlete] = useState<AuthUser | null>(
    passedUserId ? users.find((u) => u.uid === passedUserId) || null : null
  );
  const [selectedAthletes, setSelectedAthletes] = useState<AuthUser[]>(
    passedUserIds ? users.filter((u) => passedUserIds.includes(u.uid)) : []
  );
  const [searchAthleteText, setSearchAthleteText] = useState('');

  const filteredAthletes = useMemo<AuthUser[]>(() => {
    const allAthletes = lib.common.generic.getUnique(
      selectedGroups.flatMap((group) => group?.members || []),
      'uid'
    );

    if (searchAthleteText.trim() === '') return allAthletes;

    const lowerSearch = searchAthleteText.toLowerCase();

    return allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [selectedGroups, searchAthleteText]);

  return {
    selectedAthlete,
    setSelectedAthlete,
    selectedAthletes,
    setSelectedAthletes,
    filteredAthletes,
    searchAthleteText,
    setSearchAthleteText,
  };
}
