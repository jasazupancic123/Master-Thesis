import { useEffect, useMemo, useRef, useState } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
import type { Training } from '@/core/training/type/training.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { core } from '@/core/core.service';

export default function useAthleteExerciseReportDataGridHeader(
  selectedAthlete: AuthUser | null,
  setSelectedTraining: SetState<Training | null>
) {
  const { selectedInstitution, trainings } = useDashboard();

  const [searchAthlete, setSearchAthlete] = useState('');
  const [openSelectAthleteMenu, setOpenAthleteMenu] = useState(false);

  const [possibleTrainings, setPossibleTrainings] = useState<Training[]>([]);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const cyclesAnchorElRef = useRef<HTMLElement | null>(null);
  const trainingAnchorElRef = useRef<HTMLElement | null>(null);
  const percentageCalculationAnchorElRef = useRef<HTMLElement | null>(null);

  const filteredAthletes = useMemo<AuthUser[]>(() => {
    const allAthletes = selectedInstitution?.athletes || [];
    if (searchAthlete.trim() === '') return allAthletes;

    const lowerSearch = searchAthlete.toLowerCase();

    return allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [selectedInstitution, searchAthlete]);

  useEffect(() => {
    if (!selectedAthlete) return;

    const newPossibleTrainings = core.training.getPotentiallyCompletedTrainings(
      trainings
        .filter((t) => t.membersIds.includes(selectedAthlete.uid))
        .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime())
    );

    setPossibleTrainings(newPossibleTrainings);
    setSelectedTraining(newPossibleTrainings[0] || null);
  }, [trainings, selectedAthlete]);

  return {
    athleteAnchorElRef,
    cyclesAnchorElRef,
    trainingAnchorElRef,
    percentageCalculationAnchorElRef,
    openSelectAthleteMenu,
    setOpenAthleteMenu,
    filteredAthletes,
    possibleTrainings,
    searchAthlete,
    setSearchAthlete,
  };
}
