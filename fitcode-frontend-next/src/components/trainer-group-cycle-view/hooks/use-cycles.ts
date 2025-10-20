import { useEffect, useState } from 'react';

import { useGroup } from '@/store/group.provider';

export default function useTrainerCycleViewCycles() {
  const { group } = useGroup();

  const [cyclesForSelect, setCyclesForSelect] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    setCyclesForSelect(
      group.cycles.map((cycle) => ({ label: cycle.name, value: cycle.id }))
    );
  }, [group.cycles]);

  return {
    cyclesForSelect,
  };
}
