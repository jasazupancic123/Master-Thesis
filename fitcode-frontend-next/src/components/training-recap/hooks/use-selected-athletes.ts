import { AuthUser } from '@/core/auth/type/user.type';
import { useMain } from '@/store/main.provider';
import { useTrainingRecap } from '@/store/training-recap.provider';
import { useEffect, useState } from 'react';

export default function useTrainingRecapSelectedAthletes() {
  const { users } = useMain();

  const { workloads } = useTrainingRecap();

  const [filteredAthletes, setFilteredAthletes] = useState<AuthUser[]>([]);

  const [searchAthlete, setSearchAthlete] = useState<string>('');

  useEffect(() => {
    const userIds = workloads.map((w) => w.userId);

    const allAthletes = users.filter((u) => userIds.includes(u.uid));

    if (searchAthlete.trim() === '') {
      setFilteredAthletes(allAthletes);
      return;
    }

    const lowerSearch = searchAthlete.toLowerCase();

    const searchedAthletes = allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );

    setFilteredAthletes(searchedAthletes);
  }, [searchAthlete, workloads]);

  return {
    filteredAthletes,
    searchAthlete,
    setSearchAthlete,
  };
}
