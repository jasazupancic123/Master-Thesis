import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { handleApiRequest } from '@/common/type/state.type';
import type { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import type { GroupController } from '@/controller/group/group.controller';
import type { GroupProviderReturnType } from '@/store/group.provider';

export async function handleDeleteCycle(
  input: {
    router: AppRouterInstance;
    controller: GroupController;
  },
  context: {
    useGroup: GroupProviderReturnType;
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
