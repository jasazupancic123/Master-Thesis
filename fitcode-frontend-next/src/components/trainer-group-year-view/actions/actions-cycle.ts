import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import type { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import type { GroupController } from '@/core/group/group.controller';
import type { Cycle } from '@/core/group/type/cycle.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';

type AddCycleInput = Pick<Cycle, 'name' | 'from' | 'to' | 'description'>;

export async function handleAddCycle(
  input: {
    controller: GroupController;
    router: AppRouterInstance;
    addCycleInput: AddCycleInput;
  },
  context: {
    useGroup: IGroupCtx;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) {
  const { controller, router, addCycleInput } = input;

  const { useGroup, useSliderCycles } = context;

  const { selectedGroup, setSelectedGroup, setGroup, setCycle } = useGroup;

  const { setSortedCycles } = useSliderCycles;

  const { name, description, from, to } = addCycleInput;

  if (!name || !from || !to) {
    toast.error('Please fill in all required fields.');
    return;
  }

  if (from > to) {
    toast.error('Start date must be before end date.');
    return;
  }

  const newCycle: Cycle = {
    id: v4(),
    name,
    from,
    to,
    description,
    targets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  handleApiRequest(
    router,
    () => controller.addCycle(selectedGroup.id, newCycle),
    () => {
      const newCycles = [...selectedGroup.cycles, newCycle];

      if (newCycles.length === 1) setCycle(newCycle);

      setSortedCycles(newCycles);

      const newGroup = { ...selectedGroup, cycles: newCycles };
      setGroup(newGroup);
      setSelectedGroup(newGroup);
      toast.success('Cycle added successfully.');
    },
    undefined,
    'An error occurred while adding the cycle'
  );
}

export async function handleDeleteCycle(
  input: {
    router: AppRouterInstance;
    controller: GroupController;
  },
  context: {
    useGroup: IGroupCtx;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) {
  const { router, controller } = input;

  const { useGroup, useSliderCycles } = context;

  const { selectedGroup, setSelectedGroup, setGroup, cycle, setCycle } =
    useGroup;

  const { editCycle, setEditCycle } = useSliderCycles;

  if (!editCycle || !selectedGroup) return;

  handleApiRequest(
    router,
    () => controller.removeCycle(selectedGroup.id, editCycle.id),
    () => {
      if (cycle && editCycle.id === cycle?.id) setCycle(undefined);

      setSelectedGroup((prev) => ({
        ...prev,
        cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
      }));
      setGroup((prev) => ({
        ...prev,
        cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
      }));

      setEditCycle(null);

      toast.success('Cycle deleted successfully');
    },
    (_e) => {
      toast.error('An error occurred while deleting the cycle.');
    }
  );
}

export const updateCycleState = (
  input: {
    newCycle: Cycle;
  },
  context: {
    useGroup: IGroupCtx;
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
