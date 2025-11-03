import { useEffect, useState } from 'react';

import { core } from '@/core/core.service';
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
        const target = core.training.component.findCycleTarget(
          st.targetId,
          cycle
        );

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
      const component = core.training.component.findByTarget(st.targetId);
      const target = core.training.component.findCycleTarget(
        st.targetId,
        cycle
      );

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
