import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { GroupController } from '@/core/group/group.controller';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';

export async function handleSaveGroup(
  controller: GroupController,
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>,
  cycle: Cycle | undefined,
  setCycle: SetState<Cycle | undefined>,
  setDetectedChanges: SetState<boolean>,
  router: AppRouterInstance,
  setGroup: SetState<Group>
) {
  for (const cycle of selectedGroup.cycles) {
    if (cycle.from >= cycle.to) {
      toast.error('Start date must be before end date.');
      return;
    }
  }

  handleApiRequest(
    router,
    () =>
      controller.update(selectedGroup.id, {
        cycles: selectedGroup.cycles,
      }),
    (group) => {
      if (group.cycles.length === 1) setCycle(group.cycles[0]);
      else if (cycle) {
        group.cycles.forEach((groupCycle) => {
          if (groupCycle.id === cycle.id) setCycle(groupCycle);
        });
      }

      setGroup(group);
      setSelectedGroup(group);
      setDetectedChanges(false);

      toast.success('Group successfully saved');
    },
    undefined,
    'Failed to save group'
  );
}
