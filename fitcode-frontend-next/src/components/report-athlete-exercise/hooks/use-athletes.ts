import { useMemo, useState } from 'react';

import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useAthleteExerciseReportAthletes(
  passedUserId?: string,
  passedUserIds?: string[]
) {
  const { users } = useMain();
  const { selectedGroups } = useDashboard();

  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(
    passedUserId ? users.data.find((u) => u.uid === passedUserId) || null : null
  );
  const [selectedAthletes, setSelectedAthletes] = useState<User[]>(
    passedUserIds ? users.data.filter((u) => passedUserIds.includes(u.uid)) : []
  );
  const [searchAthleteText, setSearchAthleteText] = useState('');

  const filteredAthletes = useMemo<User[]>(() => {
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
