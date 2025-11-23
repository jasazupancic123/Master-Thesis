import { useMemo, useState } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useAthleteExerciseReportAthletes(
  passedUserId?: string,
  passedUserIds?: string[]
) {
  const { users } = useMain();
  const { selectedGroup } = useDashboard();

  const [selectedAthlete, setSelectedAthlete] = useState<AuthUser | null>(
    passedUserId ? users.find((u) => u.uid === passedUserId) || null : null
  );
  const [selectedAthletes, setSelectedAthletes] = useState<AuthUser[]>(
    passedUserIds ? users.filter((u) => passedUserIds.includes(u.uid)) : []
  );
  const [searchAthleteText, setSearchAthleteText] = useState('');

  const filteredAthletes = useMemo<AuthUser[]>(() => {
    const allAthletes = selectedGroup?.members || [];
    if (searchAthleteText.trim() === '') return allAthletes;

    const lowerSearch = searchAthleteText.toLowerCase();
    return allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [selectedGroup, searchAthleteText]);

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
