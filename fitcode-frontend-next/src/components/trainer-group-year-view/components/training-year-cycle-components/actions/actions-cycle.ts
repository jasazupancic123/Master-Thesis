import type { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { GroupProviderReturnType } from '@/store/group.provider';

export const updateCycleState = (
  input: {
    newCycle: Cycle;
  },
  context: {
    useGroup: GroupProviderReturnType;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) => {
  const { newCycle } = input;

  const { useGroup, useSliderCycles } = context;

  const { setGroup } = useGroup;

  const { sortedCycles, setSortedCycles } = useSliderCycles;

  const newCycles = sortedCycles.map((c) =>
    c.id === newCycle.id ? newCycle : c
  );

  setSortedCycles(newCycles);

  setGroup((prevGroup) => {
    const newStateCycles = prevGroup.cycles.map(
      (c) => newCycles.find((nc) => nc.id === c.id) || c
    );

    newCycles.forEach((nc) => {
      if (!newStateCycles.some((c) => c.id === nc.id)) {
        newStateCycles.push(nc);
      }
    });

    return {
      ...prevGroup,
      cycles: newStateCycles,
    };
  });
};
