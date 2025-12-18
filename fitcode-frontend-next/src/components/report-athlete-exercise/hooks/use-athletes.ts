import { useMemo, useState } from 'react';

import type { User } from '@/core/user/type/user.type';
import { useMain } from '@/store/main.provider';

export default function useAthleteExerciseReportAthletes(
  passedUserId?: string,
  passedUserIds?: string[]
) {
  const { institution, users } = useMain();

  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(
    passedUserId ? users.data.find((u) => u.uid === passedUserId) || null : null
  );
  const [selectedAthletes, setSelectedAthletes] = useState<User[]>(
    passedUserIds ? users.data.filter((u) => passedUserIds.includes(u.uid)) : []
  );
  const [searchAthleteText, setSearchAthleteText] = useState('');

  const filteredAthletes = useMemo<User[]>(() => {
    if (searchAthleteText.trim() === '') return institution.athletes;

    const lowerSearch = searchAthleteText.toLowerCase();

    return institution.athletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [institution, searchAthleteText]);

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
