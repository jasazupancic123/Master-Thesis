import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import type { SliderCyclesProviderReturnType } from '@/components/trainer-group-year-view/context/cycles.provider';
import type { GroupController } from '@/controller/group/group.controller';
import type { GroupProviderReturnType } from '@/store/group.provider';

export async function handleDeleteCycle(
  input: {
    router: AppRouterInstance;
    controller: GroupController;
    commonService: CommonService;
  },
  context: {
    useGroup: GroupProviderReturnType;
    useSliderCycles: SliderCyclesProviderReturnType;
  }
) {
  const { router, controller, commonService } = input;

  const { useGroup, useSliderCycles } = context;

  const {
    selectedGroup,
    setSelectedGroup,
    setGroup,
    cycle,
    setCycle,
    trainings,
    setTrainings,
  } = useGroup;

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

      setTrainings((prev) =>
        prev.filter(
          (t) =>
            t.cycleId !== editCycle.id &&
            !commonService.date.isBetween(
              t.from as Date,
              editCycle.from,
              editCycle.to
            )
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
