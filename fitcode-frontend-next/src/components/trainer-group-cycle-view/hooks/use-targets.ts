import { useEffect, useState } from 'react';

import type { Target } from '@/core/target/type/target.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

export default function useTrainingCycleViewTargets() {
  const { components } = useMain();

  const { cycle } = useGroup();

  const [selectedTargets, setSelectedTargets] = useState<
    { componentId: string; target: Target }[]
  >([]);

  useEffect(() => {
    if (!cycle) return;

    setSelectedTargets(
      cycle.selectedTargets.map((st) => ({
        componentId: st.componentId,
        target: components
          .find((c) => c.id === st.componentId)
          ?.targets?.find((t) => t.id === st.targetId) as Target,
      })) || []
    );
  }, [cycle]);

  useEffect(() => {
    if (!cycle) return;

    const newSelectedTargets = [] as { componentId: string; target: Target }[];

    cycle.selectedTargets.map((st) => {
      const component = components.find((c) => c.id === st.componentId);
      if (component) {
        const target = component.targets?.find((t) => t.id === st.targetId);
        if (target) {
          newSelectedTargets.push({
            componentId: st.componentId,
            target,
          });
        }
      }
    });

    setSelectedTargets(newSelectedTargets);
  }, []);

  return {
    selectedTargets,
    setSelectedTargets,
  };
}
