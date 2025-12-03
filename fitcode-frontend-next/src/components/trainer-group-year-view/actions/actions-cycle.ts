import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import type { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { Cycle } from '@/core/institution/type/cycle.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { IMainContext } from '@/store/main.provider';

type AddCycleInput = Pick<Cycle, 'name' | 'from' | 'to' | 'description'>;

export async function handleAddCycle(
  input: {
    router: AppRouterInstance;
    addCycleInput: AddCycleInput;
  },
  context: {
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) {
  const { router, addCycleInput } = input;

  const { useMain, useGroup, useSliderCycles } = context;

  const { setGroups } = useMain;

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
    () =>
      InstitutionController.getInstance().addCycle(
        selectedGroup.institutionId,
        selectedGroup.id,
        newCycle
      ),
    () => {
      const newCycles = [...selectedGroup.cycles, newCycle];

      if (newCycles.length === 1) setCycle(newCycle);

      setSortedCycles(newCycles);

      const newGroup = { ...selectedGroup, cycles: newCycles };
      setGroup(newGroup);
      setGroups((prev) =>
        prev.map((g) => (g.id === newGroup.id ? newGroup : g))
      );
      setSelectedGroup(newGroup);
      toast.success('Cycle added successfully.');
    },
    undefined,
    'An error occurred while adding the cycle'
  );
}

export async function handleDeleteCycle(
  input: { router: AppRouterInstance },
  context: {
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) {
  const { router } = input;
  const { useMain, useGroup, useSliderCycles } = context;
  const { setGroups, setTrainings } = useMain;
  const { selectedGroup, setSelectedGroup, setGroup, cycle, setCycle } =
    useGroup;

  const { editCycle, setEditCycle } = useSliderCycles;

  if (!editCycle || !selectedGroup) return;

  handleApiRequest(
    router,
    () =>
      InstitutionController.getInstance().removeCycle(
        selectedGroup.institutionId,
        selectedGroup.id,
        editCycle.id
      ),
    () => {
      if (cycle && editCycle.id === cycle?.id) setCycle(undefined);

      setTrainings((prev) => ({
        ...prev,
        data: prev.data.filter((t) => t.cycleId !== editCycle.id),
      }));

      setSelectedGroup((prev) => ({
        ...prev,
        cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
      }));
      setGroup((prev) => ({
        ...prev,
        cycles: prev.cycles.filter((c) => c.id !== editCycle.id),
      }));
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id
            ? {
                ...g,
                cycles: g.cycles.filter((c) => c.id !== editCycle.id),
              }
            : g
        )
      );

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
    useMain: IMainContext;
    useGroup: IGroupCtx;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) => {
  const { newCycle } = input;

  const { useMain, useGroup, useSliderCycles } = context;

  const { setGroups } = useMain;

  const { group, setGroup } = useGroup;

  const { sortedCycles, setSortedCycles } = useSliderCycles;

  const newCycles = sortedCycles.map((c) =>
    c.id === newCycle.id ? newCycle : c
  );

  setSortedCycles(newCycles);

  const newStateCycles = group.cycles.map(
    (c) => newCycles.find((nc) => nc.id === c.id) || c
  );

  newCycles.forEach((nc) => {
    if (!newStateCycles.some((c) => c.id === nc.id)) {
      newStateCycles.push(nc);
    }
  });

  setGroup((prevGroup) => {
    return {
      ...prevGroup,
      cycles: newStateCycles,
    };
  });

  setGroups((prev) =>
    prev.map((g) =>
      g.id === group.id
        ? {
            ...g,
            cycles: newStateCycles,
          }
        : g
    )
  );
};
