import { AuthUser } from '@/core/auth/type/user.type';
import { Cycle } from '@/core/group/type/cycle.type';
import { Group } from '@/core/group/type/group.type';
import { Training } from '@/core/training/type/training.type';
import { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { group } from 'console';
import { useState, useRef, useMemo, useEffect } from 'react';

export default function useAthleteExerciseReportDataGridHeader(
  selectedAthlete: AuthUser | null,
  cycles: Cycle[],
  selectedCycles: Cycle[],
  setSelectedCycles: SetState<Cycle[]>,
  setSelectedTraining: SetState<Training | null>
) {
  const { selectedInstitution, trainings } = useDashboard();

  const [searchAthlete, setSearchAthlete] = useState('');
  const [openSelectAthleteMenu, setOpenAthleteMenu] = useState(false);

  const [possibleTrainings, setPossibleTrainings] = useState<Training[]>([]);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const cyclesAnchorElRef = useRef<HTMLElement | null>(null);
  const trainingAnchorElRef = useRef<HTMLElement | null>(null);

  const filteredAthletes = useMemo<AuthUser[]>(() => {
    const allAthletes = selectedInstitution?.athletes || [];
    if (searchAthlete.trim() === '') return allAthletes;

    const lowerSearch = searchAthlete.toLowerCase();

    return allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [selectedInstitution, searchAthlete]);

  useEffect(() => {
    if (!cycles || !cycles.length) {
      setSelectedCycles([]);
      return;
    }

    setSelectedCycles([
      cycles.sort(
        (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
      )[0],
    ]);
  }, [cycles]);

  useEffect(() => {
    if (!selectedAthlete) return;

    const newPossibleTrainings = trainings
      .filter(
        (t) =>
          selectedCycles.some((c) => c.id === t.cycleId) &&
          t.membersIds.includes(selectedAthlete.uid)
      )
      .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

    setPossibleTrainings(() => newPossibleTrainings);
    setSelectedTraining(newPossibleTrainings[0] || null);
  }, [selectedCycles]);

  return {
    athleteAnchorElRef,
    cyclesAnchorElRef,
    trainingAnchorElRef,
    openSelectAthleteMenu,
    setOpenAthleteMenu,
    filteredAthletes,
    possibleTrainings,
    searchAthlete,
    setSearchAthlete,
  };
}
