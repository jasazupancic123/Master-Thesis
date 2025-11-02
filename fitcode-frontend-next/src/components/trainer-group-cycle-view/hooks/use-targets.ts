import { useEffect, useState } from 'react';

import { Components } from '@/core/exercise/constant/components.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Target } from '@/core/exercise/type/target.type';
import { useGroup } from '@/store/group.provider';

export default function useTrainingCycleViewTargets() {
  const { cycle } = useGroup();

  const [selectedTargets, setSelectedTargets] = useState<
    { componentId: string; target: Target }[]
  >([]);

  useEffect(() => {
    if (!cycle) return;

    setSelectedTargets(
      cycle.targets.map((st) => {
        const target = Targets.find((t) => t.field === st.targetId);
        return {
          componentId: target?.componentId || 'other',
          target: target || {
            field: st.targetId,
            name: st.targetId,
            componentId: 'other',
          },
        };
      }) || []
    );
  }, [cycle]);

  useEffect(() => {
    if (!cycle) return;

    const newSelectedTargets = [] as { componentId: string; target: Target }[];

    cycle.targets.map((st) => {
      const target = Targets.find((t) => t.field === st.targetId);
      const component = Components.find((c) => c.field === target?.componentId);
      if (component && target)
        newSelectedTargets.push({ componentId: target.componentId, target });
    });

    setSelectedTargets(newSelectedTargets);
  }, []);

  return {
    selectedTargets,
    setSelectedTargets,
  };
}
