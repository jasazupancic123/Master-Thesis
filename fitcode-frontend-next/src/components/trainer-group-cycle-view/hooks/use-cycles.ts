import { GroupService } from '@/controller/group/group.service';
import { useGroup } from '@/store/group.provider';
import { useEffect, useState } from 'react';

export default function useTrainerCycleViewCycles() {
  const { group } = useGroup();

  const [cyclesForSelect, setCyclesForSelect] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    setCyclesForSelect(GroupService.getCyclesForSelect(group.cycles));
  }, [group.cycles]);

  return {
    cyclesForSelect,
  };
}
