import { handleApiRequest } from '@/common/type/state.type';
import { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import { GroupProviderReturnType } from '@/store/group.provider';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

type AddCycleInput = Pick<Cycle, 'name' | 'from' | 'to' | 'description'>;

export async function handleAddCycle(
  input: {
    controller: GroupController;
    router: AppRouterInstance;
    addCycleInput: AddCycleInput;
  },
  context: {
    useGroup: GroupProviderReturnType;
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
    selectedTargets: [],
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
